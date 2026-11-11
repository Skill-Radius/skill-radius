/* =====================================================================
   SkillRadius — catalog engine
   Search + faceted filters + sort for the Courses, Trainings and
   Certifications listing pages. State lives in the URL hash
   (e.g. courses.html#q=react&cat=Development) so results are linkable.
===================================================================== */
SR.catalog = function (cfg) {
  const { $, $$, esc, icon } = SR;
  const state = { q: "", sort: Object.keys(cfg.sorts)[0], sel: {}, page: 1, more: {} };
  const PER = cfg.perPage || 6, MORE_AFTER = 4;
  cfg.groups.forEach(g => state.sel[g.id] = new Set());

  /* ---- URL hash <-> state ---- */
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    state.q = p.get("q") || "";
    state.sort = cfg.sorts[p.get("sort")] ? p.get("sort") : Object.keys(cfg.sorts)[0];
    state.page = +p.get("page") || 1;
    cfg.groups.forEach(g => { state.sel[g.id] = new Set((p.get(g.id) || "").split("|").filter(Boolean)); });
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.sort !== Object.keys(cfg.sorts)[0]) p.set("sort", state.sort);
    cfg.groups.forEach(g => { if (state.sel[g.id].size) p.set(g.id, [...state.sel[g.id]].join("|")); });
    if (state.page > 1) p.set("page", state.page);
    const h = p.toString();
    history.replaceState(null, "", h ? "#" + h : location.pathname.split("/").pop());
  }

  /* ---- Matching ---- */
  // Forgiving search: ignore filler words, match word stems, and keep items that
  // match at least half of the meaningful words (ranked by how many they match).
  const STOP = new Set(["a", "an", "and", "the", "for", "of", "in", "to", "with", "on", "course", "courses", "learn", "how"]);
  const ALIAS = { dev: "develop", js: "javascript", ui: "design", ux: "design", ml: "machine", ai: "ai", web: "web" };
  const terms = () => state.q.toLowerCase().split(/[^a-z0-9+#.]+/).filter(w => w && !STOP.has(w));
  const scoreOf = (item) => {
    const ws = terms(); if (!ws.length) return 1;
    const hay = cfg.text(item).toLowerCase();
    return ws.filter(w => hay.includes(w) || (ALIAS[w] && hay.includes(ALIAS[w])) || (w.length > 3 && hay.includes(w.slice(0, -1)))).length;
  };
  const matchesQuery = (item) => { const ws = terms(); return !ws.length || scoreOf(item) >= Math.max(1, Math.ceil(ws.length / 2)); };
  const matchesGroups = (item, except) => cfg.groups.every(g => {
    if (g.id === except || !state.sel[g.id].size) return true;
    const vals = g.values(item);
    return [...state.sel[g.id]].some(v => vals.includes(v));
  });

  /* ---- Render filters with live counts ---- */
  function renderFilters() {
    cfg.groups.forEach(g => {
      const pool = cfg.items.filter(i => matchesQuery(i) && matchesGroups(i, g.id));
      const all = [...new Set(cfg.items.flatMap(g.values))];
      const opts = g.order ? g.order.filter(o => all.includes(o)) : all.sort();
      const host = $(g.el);
      const open = state.more[g.id] || opts.slice(MORE_AFTER).some(o => state.sel[g.id].has(o));
      host.innerHTML = `<h3>${esc(g.label)}</h3>` + opts.map((o, k) => {
        const n = pool.filter(i => g.values(i).includes(o)).length;
        const id = `f-${g.id}-${o.replace(/\W+/g, "")}`;
        return `<label for="${id}" ${k >= MORE_AFTER && !open ? "hidden" : ""}><input type="${g.radio ? "radio" : "checkbox"}" name="${g.id}" id="${id}" value="${esc(o)}" ${state.sel[g.id].has(o) ? "checked" : ""}>${esc(o)}<span class="c">${n}</span></label>`;
      }).join("") + (opts.length > MORE_AFTER ? `<button type="button" class="f-more" data-more="${g.id}" aria-expanded="${open}">${open ? "Less" : "More"} ${icon("chev")}</button>` : "");
    });
  }

  function render() {
    renderFilters();
    let list = cfg.items.filter(i => matchesQuery(i) && matchesGroups(i));
    list = [...list].sort(cfg.sorts[state.sort]);
    if (terms().length) list.sort((a, b) => scoreOf(b) - scoreOf(a));
    if ($("#sort")) $("#sort").value = state.sort;
    $("#q").value = state.q;

    const [one, many] = cfg.noun;
    $("#summary").innerHTML = state.q ? `Showing ${one} results for &nbsp;“${esc(state.q)}”` : `Showing all ${many}`;
    const cnt = $("#count"); if (cnt) cnt.textContent = state.q ? `${list.length} result${list.length === 1 ? "" : "s"} matched this search` : `${list.length} ${list.length === 1 ? one : many}`;

    const chips = [];
    cfg.groups.forEach(g => state.sel[g.id].forEach(v => chips.push(`<button data-clear="${g.id}" data-v="${esc(v)}">${esc(v)} ${icon("x")}</button>`)));
    $("#chips").innerHTML = chips.join("");

    const total = cfg.groups.reduce((n, g) => n + state.sel[g.id].size, 0);
    $("#filter-toggle").innerHTML = `${icon("tune")}${total ? `Filters (${total})` : "Filters"}`;

    const pages = Math.max(1, Math.ceil(list.length / PER));
    state.page = Math.min(Math.max(1, state.page), pages);
    const shown = list.slice((state.page - 1) * PER, state.page * PER);
    $("#grid").innerHTML = list.length ? shown.map(cfg.card).join("") : `
      <div class="no-results" style="grid-column:1/-1">
        <img src="assets/img/art-empty-mark.webp" alt="" width="280" height="280">
        <h3>${esc(cfg.empty.title)}</h3>
        <p>${state.q ? `Nothing matched “${esc(state.q)}”. ` : ""}${esc(cfg.empty.hint)}</p>
        <div class="btn-row"><button class="btn" type="button" data-clear="all">Clear search &amp; filters</button>${cfg.empty.alt.map(([t, h]) => `<a class="btn ghost" href="${h}">${t}</a>`).join("")}</div>
      </div>`;
    const pg = $("#pager");
    if (pg) pg.innerHTML = pages > 1 ? `<button class="prev" data-page="${state.page - 1}" aria-label="Previous page" ${state.page === 1 ? "disabled" : ""}>${icon("arrowl")}</button>${Array.from({ length: pages }, (_, i) => `<button data-page="${i + 1}" ${i + 1 === state.page ? 'aria-current="page"' : ""} aria-label="Page ${i + 1}">${i + 1}</button>`).join("")}<button class="next" data-page="${state.page + 1}" aria-label="Next page" ${state.page === pages ? "disabled" : ""}>${icon("arrow")}</button>` : "";
    writeHash();
  }

  /* ---- Events ---- */
  $("#filters").addEventListener("change", e => {
    const i = e.target; if (!i.name) return;
    const g = cfg.groups.find(x => x.id === i.name);
    if (g.radio) { state.sel[g.id] = new Set(i.checked ? [i.value] : []); }
    else i.checked ? state.sel[g.id].add(i.value) : state.sel[g.id].delete(i.value);
    state.page = 1; render();
  });
  // Clicking a checked radio unchecks it
  $("#filters").addEventListener("click", e => {
    const i = e.target; if (i.type !== "radio") return;
    if (i.dataset.was === "1") { i.checked = false; state.sel[i.name] = new Set(); render(); }
    $$(`input[name="${i.name}"]`).forEach(r => r.dataset.was = r.checked ? "1" : "0");
  });
  document.addEventListener("click", e => {
    const m = e.target.closest("[data-more]"); if (m) { state.more[m.dataset.more] = m.getAttribute("aria-expanded") !== "true"; renderFilters(); return; }
    const pb = e.target.closest("[data-page]"); if (pb && !pb.disabled) { state.page = +pb.dataset.page; render(); $("#grid").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const c = e.target.closest("[data-clear]"); if (!c) return;
    state.page = 1;
    const k = c.dataset.clear;
    if (k === "all") { state.q = ""; cfg.groups.forEach(g => state.sel[g.id].clear()); }
    else if (k === "q") state.q = "";
    else state.sel[k].delete(c.dataset.v);
    render();
  });
  $("#clear").addEventListener("click", () => { cfg.groups.forEach(g => state.sel[g.id].clear()); state.page = 1; render(); });
  if ($("#sort")) $("#sort").addEventListener("change", e => { state.sort = e.target.value; state.page = 1; render(); });
  $("#search-form").addEventListener("submit", e => { e.preventDefault(); state.q = $("#q").value.trim(); state.page = 1; render(); });
  let deb; $("#q").addEventListener("input", e => { clearTimeout(deb); deb = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; render(); }, 220); });
  $("#filter-toggle").addEventListener("click", () => { const f = $("#filters"), o = !f.classList.contains("open"); f.classList.toggle("open", o); $("#filter-toggle").setAttribute("aria-expanded", String(o)); });
  addEventListener("hashchange", () => { readHash(); render(); });

  readHash(); render();
};
