/* =====================================================================
   SkillRadius — interaction layer (loaded after ui.js on every page)
   · Quick search palette (Ctrl/⌘ K, or the search button in the header)
   · Learning assistant (answers from the catalog, FAQ and help centre)
   · Live batch countdowns  ([data-countdown] anywhere on a page)
   · Course finder           (SR.recommend, shared by home + assistant)
   · Scroll progress, card spotlight, smooth page transitions
   Everything here reads the same SR data the pages use, so it keeps
   working when that data comes from the API.
===================================================================== */
(function () {
  const { $, $$, esc, icon, inr } = SR;
  const fi = (n, a = "") => SR.ficon(n, a);
  const page = (document.querySelector('meta[name="sr-page"]') || {}).content || "";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const SVG = {
    chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L4 21l1.4-4.3A8.5 8.5 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 14h4.5"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21.9 12 3.4 3.6 3.4 10.1 16.6 12 3.4 13.9z"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9zM18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/></svg>`,
    enter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 5v7a3 3 0 0 1-3 3H5"/><path d="m9 11-4 4 4 4"/></svg>`
  };

  /* ---------- Smooth page transitions + scroll progress ---------- */
  const header = $("#site-header");
  if (header) {
    header.insertAdjacentHTML("beforeend", `<div class="sr-progress" aria-hidden="true"><span></span></div>`);
    const bar = $(".sr-progress span", header);
    const upd = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
    addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();
  }

  /* ---------- Search index (catalog + useful pages) ---------- */
  function buildIndex() {
    const list = [];
    SR.publicCourses().forEach(c => list.push({ g: "Courses", t: c.title, s: `${c.cat} · ${c.level || "All levels"} · ${inr(c.price)}`, img: c.img, href: "course.html#" + c.id, hay: [c.title, c.subtitle, c.cat, c.short, ...(c.outcomes || [])].join(" ") }));
    SR.publicCerts().forEach(c => list.push({ g: "Certifications", t: c.title, s: `${c.code || c.cat} · ${inr(c.price)} · ${c.validity} years validity`, img: c.img, href: "certification.html#" + c.id, hay: [c.title, c.cat, c.level, ...(c.skills || [])].join(" ") }));
    SR.openTrainings().forEach(t => list.push({ g: "Live batches", t: t.title, s: `${t.mode === "online" ? "Live online" : "In person"} · starts ${SR.fmtDate(t.start, { day: "numeric", month: "short" })} · ${t.seats - t.taken} seats left`, img: t.img, href: "training.html#" + t.id, hay: [t.title, t.summary, t.cat, ...(t.topics || [])].join(" ") }));
    SR.paths.forEach(p => list.push({ g: "Career paths", t: p.title, s: `${p.months} months · ${p.salary} starting salaries`, img: p.img, href: "path.html#" + p.id, hay: [p.title, p.role, p.summary, ...(p.skills || [])].join(" ") }));
    [["Verify a certificate", "verify.html", "cert", "check certificate id employer"], ["Free events & webinars", "events.html", "cal", "webinar workshop free event"], ["Help centre", "help.html", "help", "support faq question payment refund"], ["Contact us", "contact.html", "phone", "call email address office talk human counsellor"], ["Placements", "placements.html", "trend", "jobs hiring salary placement"], ["For Business", "business.html", "users", "team corporate company training"], ["Scholarships", "scholarships.html", "award", "discount financial aid scholarship"], ["Refer & earn", "refer.html", "heart", "referral invite friend reward"], ["Become a trainer", "teach.html", "training", "teach instructor mentor"], ["Blog", "blog.html", "file", "articles guides news"]]
      .forEach(([t, href, ic, k]) => list.push({ g: "Pages", t, s: "", ic, href, hay: t + " " + k }));
    return list;
  }
  const STOP = new Set(["a", "an", "the", "for", "and", "of", "in", "to", "on", "i", "me", "my", "is", "are", "do", "does", "you", "your", "have", "has", "get", "there", "any", "can", "will", "what", "which", "how", "course", "courses", "learn", "want", "can", "about"]);
  const ALIAS = { js: "javascript", ml: "machine learning", ux: "design", ui: "design", dev: "development", web: "development", ai: "ai", video: "video", data: "data" };
  const words = (q) => q.toLowerCase().split(/[^a-z0-9+#.]+/).filter(w => w && !STOP.has(w)).map(w => ALIAS[w] || w);
  function search(q, idx, limit = 8) {
    const ws = words(q); if (!ws.length) return [];
    const need = Math.max(1, Math.ceil(ws.length / 2));
    return idx.map(x => {
      const t = x.t.toLowerCase(), h = x.hay.toLowerCase();
      let hit = 0, score = 0;
      ws.forEach(w => { if (t.includes(w)) { hit++; score += 3; } else if (h.includes(w)) { hit++; score += 1; } });
      return [x, hit, score];
    }).filter(([, hit]) => hit >= need).sort((a, b) => b[2] - a[2]).slice(0, limit).map(([x]) => x);
  }

  /* ---------- Quick search palette ---------- */
  function mountSearchButton() {
    const inner = $(".nav-inner"); if (!inner) return;
    const right = $(".nav-auth", inner) || $(".user-wrap", inner), menu = $("#menu-btn");
    const end = document.createElement("div"); end.className = "nav-end";
    // (No search button in the nav; the quick search still opens with Ctrl/⌘ K)
    inner.appendChild(end);
    if (right) end.appendChild(right);
    if (menu) end.appendChild(menu);

  }
  let idx;
  function openPalette() {
    if ($(".qs-back")) return;
    idx = idx || buildIndex();
    const back = document.createElement("div"); back.className = "qs-back";
    const popular = ["Python", "Full stack", "UI/UX design", "Data analytics", "AI automation"];
    back.innerHTML = `<div class="qs" role="dialog" aria-modal="true" aria-label="Search SkillRadius">
      <div class="qs-in">${fi("search")}<input id="qs-q" type="search" placeholder="Search courses, live batches, certifications…" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="qs-list"><kbd>Esc</kbd></div>
      <div class="qs-list" id="qs-list" role="listbox"></div>
      <div class="qs-foot"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span><span class="sp"></span><a href="courses.html">Browse the full catalogue →</a></div>
    </div>`;
    document.body.appendChild(back); document.documentElement.classList.add("qs-open");
    const q = $("#qs-q", back), list = $("#qs-list", back);
    let sel = 0, items = [];
    const row = (x, i) => `<a class="qs-row${i === sel ? " on" : ""}" role="option" aria-selected="${i === sel}" href="${x.href}" data-i="${i}">${x.img ? `<img src="${x.img}" alt="">` : `<span class="ic">${icon(x.ic)}</span>`}<span class="tx"><b>${esc(x.t)}</b>${x.s ? `<small>${esc(x.s)}</small>` : ""}</span><span class="go">${SVG.enter}</span></a>`;
    function render() {
      const v = q.value.trim();
      if (!v) {
        const soon = SR.openTrainings().slice().sort((a, b) => a.start.localeCompare(b.start)).slice(0, 2).map(t => idx.find(x => x.href === "training.html#" + t.id)).filter(Boolean);
        const top = ["python", "mern"].map(id => idx.find(x => x.href === "certification.html#" + id)).filter(Boolean);
        items = [...soon, ...top];
        list.innerHTML = `<div class="qs-chips">${popular.map(p => `<button type="button" data-q="${p}">${p}</button>`).join("")}</div><h4>Starting soon</h4>${soon.map((x, i) => row(x, i)).join("")}<h4>Popular certifications</h4>${top.map((x, i) => row(x, i + soon.length)).join("")}`;
      } else {
        items = search(v, idx, 9);
        if (!items.length) { list.innerHTML = `<div class="qs-none"><b>No matches for “${esc(v)}”</b><span>Try a skill like “Python”, “React” or “design”, or <a href="contact.html">ask our team</a>.</span></div>`; return; }
        let html = "", last = "";
        items.forEach((x, i) => { if (x.g !== last) { html += `<h4>${x.g}</h4>`; last = x.g; } html += row(x, i); });
        list.innerHTML = html;
      }
    }
    const move = (d) => { if (!items.length) return; sel = (sel + d + items.length) % items.length; $$(".qs-row", list).forEach((r, i) => { r.classList.toggle("on", i === sel); r.setAttribute("aria-selected", i === sel); if (i === sel) r.scrollIntoView({ block: "nearest" }); }); };
    q.addEventListener("input", () => { sel = 0; render(); });
    q.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); const it = items[sel]; location.href = it ? it.href : "courses.html#q=" + encodeURIComponent(q.value.trim()); }
    });
    list.addEventListener("mousemove", e => { const r = e.target.closest(".qs-row"); if (r && +r.dataset.i !== sel) { sel = +r.dataset.i; move(0); } });
    list.addEventListener("click", e => { const b = e.target.closest("[data-q]"); if (b) { q.value = b.dataset.q; sel = 0; render(); q.focus(); } });
    const close = () => { back.remove(); document.documentElement.classList.remove("qs-open"); document.removeEventListener("keydown", esc_); };
    const esc_ = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", esc_);
    back.addEventListener("click", e => { if (e.target === back) close(); });
    render(); q.focus();
  }
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
    else if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); openPalette(); }
  });
  SR.openSearch = openPalette;
  mountSearchButton();

  /* ---------- Live countdowns ---------- */
  // A batch's start time = its start date + the first time in its schedule (IST)
  SR.startsAt = (t) => { const m = String(t.time || "").match(/(\d{1,2}):(\d{2})/); return new Date(`${t.start}T${m ? m[1].padStart(2, "0") + ":" + m[2] : "10:00"}:00+05:30`).getTime(); };
  function tick() {
    const now = Date.now();
    $$("[data-countdown]").forEach(el => {
      const ms = +el.dataset.countdown - now;
      if (ms <= 0) { el.hidden = true; return; }
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      const units = d > 0 ? [[d, "d"], [h, "h"], [m, "m"]] : [[h, "h"], [m, "m"], [s, "s"]];
      const html = units.map(([v, u]) => `<b>${String(v).padStart(2, "0")}</b><i>${u}</i>`).join("");
      const box = el.querySelector(".cdn-t"); if (box && box.innerHTML !== html) box.innerHTML = html;
    });
  }
  SR.countdownHTML = (t, label = "Starts in") => `<div class="cdn" data-countdown="${SR.startsAt(t)}"><span class="dot" aria-hidden="true"></span><span class="cdn-l">${label}</span><span class="cdn-t" aria-live="off"></span></div>`;
  setInterval(tick, 1000); SR.tickCountdowns = tick;
  document.addEventListener("DOMContentLoaded", tick); setTimeout(tick, 0);

  /* ---------- Course finder (used by the home quiz and the assistant) ---------- */
  SR.interests = [
    { id: "dev", label: "Building websites & apps", ic: "widgets", path: "full-stack-developer", cert: "mern", course: "full-stack" },
    { id: "data", label: "Finding stories in data", ic: "bar_chart_4_bars", path: "data-analyst", cert: "data-analytics", course: "finance-basics" },
    { id: "design", label: "Designing products people love", ic: "frame_inspect", path: "ui-ux-designer", cert: "uiux", course: "portfolio" },
    { id: "ai", label: "Automating work with AI", ic: "flowchart", path: "ai-automation-specialist", cert: "data-ai", course: "ai-automation" },
    { id: "creative", label: "Creating video & content", ic: "smart_display", path: null, cert: "digital-marketing", course: "mobile-cine" }
  ];
  SR.recommend = ({ interest = "dev", goal = "job", time = "mid" }) => {
    const it = SR.interests.find(x => x.id === interest) || SR.interests[0];
    const path = it.path && SR.paths.find(p => p.id === it.path);
    const cert = SR.cert(it.cert), course = SR.course(it.course);
    const cats = { dev: "Development", data: "Data", design: "Design", ai: "Development", creative: "Creative" };
    const batch = SR.openTrainings().filter(t => (path && (path.trainings || []).includes(t.id)) || t.cat === cats[it.id]).sort((a, b) => a.start.localeCompare(b.start))[0];
    // Main pick: a full path for career goals with time to spare, a certification for people growing in a role, otherwise a self-paced course
    let main;
    if ((goal === "job" || goal === "switch") && time !== "low" && path) main = { kind: "Career path", why: `A ${path.months}-month guided track with courses, a live batch and a certification, built around a real ${path.role || path.title} role.`, title: path.title, img: path.img, href: "path.html#" + path.id, meta: `${path.months} months · ${path.salary} starting salaries`, price: path.price };
    else if (goal === "grow" && cert) main = { kind: "Certification", why: "Proof of skill your manager and recruiters can verify, with study notes and unlimited exam attempts on most certifications.", title: cert.title, img: cert.img, href: "certification.html#" + cert.id, meta: `${cert.validity} years validity · proctored online`, price: cert.price };
    else if (course) main = { kind: "Self-paced course", why: time === "low" ? "Short lessons you can fit into a few hours a week, at your own pace." : "Learn by building real projects, one module at a time.", title: course.title, img: course.img, href: "course.html#" + course.id, meta: `${course.hours} hours · ${course.level || "All levels"} · ★ ${course.rating}`, price: course.price };
    const extra = [];
    if (batch && main.kind !== "Live batch") extra.push({ kind: "Live batch", title: batch.title, href: "training.html#" + batch.id, meta: `${SR.fmtDate(batch.start, { day: "numeric", month: "short" })} · ${batch.seats - batch.taken} seats left`, t: batch });
    if (cert && main.kind !== "Certification") extra.push({ kind: "Certification", title: cert.title, href: "certification.html#" + cert.id, meta: `${inr(cert.price)} · ${cert.validity} years validity` });
    if (course && main.kind !== "Self-paced course") extra.push({ kind: "Start with", title: course.title, href: "course.html#" + course.id, meta: `${course.hours} hours · ${inr(course.price)}` });
    return { main, extra: extra.slice(0, 2) };
  };

  /* ---------- Card spotlight (follows the pointer) ---------- */
  if (!reduce && matchMedia("(hover: hover)").matches) {
    const SEL = ".course-card, .cert-card, .tr-card, .way, .path-c, .story, .step, .pf-opt";
    document.addEventListener("pointermove", e => {
      const c = e.target.closest && e.target.closest(SEL); if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---------- Learning assistant ---------- */
  const NO_ASSIST = new Set(["admin", "trainer", "exam", "rules", "result", "learn", "mock", "login", "signup", "forgot", "reset", "otp", "invoice", "certificate", "assignment", "checkout"]);
  if (NO_ASSIST.has(page) || document.body.classList.contains("panel")) return;

  const helpQA = [...(SR.faq || []), ...(SR.help || []).flatMap(h => h.items || [])];
  const fab = document.createElement("button");
  fab.className = "ai-fab"; fab.type = "button"; fab.setAttribute("aria-label", "Open the SkillRadius assistant"); fab.setAttribute("aria-expanded", "false");
  fab.innerHTML = `${SVG.chat}<span class="ai-tip">Need help choosing?</span>`;
  document.body.appendChild(fab);
  try { if (!sessionStorage.getItem("sr_ai_tip")) { setTimeout(() => fab.classList.add("tip"), 6000); setTimeout(() => fab.classList.remove("tip"), 13000); sessionStorage.setItem("sr_ai_tip", "1"); } } catch (e) { /* storage blocked */ }

  let panel, log, input, state = {};
  const chipsHTML = (list) => `<div class="ai-chips">${list.map(([l, v]) => `<button type="button" data-v="${esc(v || l)}">${esc(l)}</button>`).join("")}</div>`;
  const cardHTML = (x) => `<a class="ai-card" href="${x.href}">${x.img ? `<img src="${x.img}" alt="">` : ""}<span><small>${esc(x.kind || x.g || "")}</small><b>${esc(x.title || x.t)}</b><em>${esc(x.meta || x.s || "")}</em></span></a>`;
  const MAIN_CHIPS = [["Help me choose a course", "recommend"], ["When do batches start?", "batches"], ["How do certifications work?", "certifications"], ["Talk to a person", "human"]];

  function openAssistant() {
    if (!panel) {
      panel = document.createElement("section"); panel.className = "ai-panel"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "SkillRadius assistant");
      panel.innerHTML = `
        <header><span class="av">${SR.logo(22)}</span><div><b>SkillRadius Assistant</b><small><i></i>Automated help · a person is one tap away</small></div><button type="button" class="x" aria-label="Close assistant">${icon("x")}</button></header>
        <div class="ai-log" aria-live="polite"></div>
        <form class="ai-in"><input type="text" placeholder="Ask about courses, batches, fees…" aria-label="Your question" maxlength="200"><button type="submit" aria-label="Send">${SVG.send}</button></form>`;
      document.body.appendChild(panel);
      log = $(".ai-log", panel); input = $("input", panel);
      $(".x", panel).addEventListener("click", closeAssistant);
      $(".ai-in", panel).addEventListener("submit", e => { e.preventDefault(); const v = input.value.trim(); if (!v) return; input.value = ""; ask(v, v); });
      log.addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (b) { b.parentElement.remove(); ask(b.textContent, b.dataset.v); } });
      const u = SR.auth.user();
      bot(`Hi${u ? " " + esc(u.firstName) : ""}! I can help you find the right course, check batch dates or answer questions about fees and certificates.` + chipsHTML(MAIN_CHIPS), 250);
    }
    panel.classList.add("open"); fab.classList.add("hide"); fab.setAttribute("aria-expanded", "true"); fab.classList.remove("tip");
    setTimeout(() => input.focus(), 250);
  }
  function closeAssistant() { panel.classList.remove("open"); fab.classList.remove("hide"); fab.setAttribute("aria-expanded", "false"); fab.focus(); }
  fab.addEventListener("click", openAssistant);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && panel && panel.classList.contains("open") && !$(".qs-back")) closeAssistant(); });
  SR.openAssistant = openAssistant;

  const scroll = () => { log.scrollTop = log.scrollHeight; };
  function say(html, who) { const m = document.createElement("div"); m.className = "ai-m " + who; m.innerHTML = html; log.appendChild(m); scroll(); return m; }
  function bot(html, delay = 550) {
    const t = say(`<span class="typing"><i></i><i></i><i></i></span>`, "bot");
    setTimeout(() => { t.innerHTML = html; scroll(); tick(); }, reduce ? 0 : delay);
  }
  function ask(label, v) { say(esc(label), "me"); setTimeout(() => answer(v), 120); }

  function answer(v) {
    const q = v.toLowerCase();
    // Course finder conversation
    if (state.step === "interest" && SR.interests.some(x => x.id === v)) { state.interest = v; state.step = "goal"; return bot("And what's the goal?" + chipsHTML([["Get my first job", "g:job"], ["Switch careers", "g:switch"], ["Grow in my current role", "g:grow"], ["Just exploring", "g:explore"]])); }
    if (state.step === "goal" && v.startsWith("g:")) { state.goal = v.slice(2); state.step = "time"; return bot("How much time can you give each week?" + chipsHTML([["Under 5 hours", "t:low"], ["5–10 hours", "t:mid"], ["10+ hours", "t:high"]])); }
    if (state.step === "time" && v.startsWith("t:")) {
      state.time = v.slice(2); state.step = null;
      const r = SR.recommend(state);
      return bot(`Here's what I'd start with:<div class="ai-pick">${cardHTML({ ...r.main, meta: r.main.meta + " · " + inr(r.main.price) })}<p>${esc(r.main.why)}</p></div>${r.extra.length ? `<p class="ai-sub">Pairs well with</p>${r.extra.map(cardHTML).join("")}` : ""}` + chipsHTML([["Start over", "recommend"], ["Talk to a counsellor", "human"]]), 800);
    }
    if (/^recommend$|choose|which (course|one)|suggest|recommend|beginner|confused|not sure|career path|where do i begin/.test(q)) {
      state = { step: "interest" };
      return bot("Happy to help. What sounds most like you?" + chipsHTML(SR.interests.map(x => [x.label, x.id])));
    }
    if (/^human$|human|person|agent|call|phone|talk|counsel|whatsapp|contact/.test(q)) {
      return bot(`You can reach our learner team Mon–Sat, 9:30 am – 7:00 pm IST.<div class="ai-contact"><a href="tel:+919876543210">${icon("phone")}+91 98765 43210</a><a href="mailto:support@skillradius.in">${icon("mail")}support@skillradius.in</a><a href="contact.html">${icon("ext")}Send us a message</a></div>`);
    }
    if (/^batches$|batch|live|start|schedule|when|weekend|timing|trainer/.test(q)) {
      const all = SR.openTrainings().slice().sort((a, b) => a.start.localeCompare(b.start));
      const kw = words(q).filter(w => !/^(batch|batches|live|start|starts|schedule|when|timing|trainer|class|classes)$/.test(w));
      const hit = kw.length ? all.filter(t => kw.some(w => (t.title + " " + t.cat + " " + (t.topics || []).join(" ")).toLowerCase().includes(w))) : [];
      const soon = (hit.length ? hit : all).slice(0, 3);
      return bot("These live batches are open for enrolment:" + soon.map(t => `<a class="ai-card" href="training.html#${t.id}"><img src="${t.img}" alt=""><span><small>${t.mode === "online" ? "Live online" : "In person"} · ${esc(t.days)}</small><b>${esc(t.title)}</b>${SR.countdownHTML(t)}<em>${t.seats - t.taken} of ${t.seats} seats left · ${inr(t.price)}</em></span></a>`).join("") + chipsHTML([["See all batches", "go:trainings.html"], ["Help me choose", "recommend"]]));
    }
    if (v.startsWith("go:")) { location.href = v.slice(3); return; }
    if (/^certifications$|certif|exam|proctor|verify|credential/.test(q) && !/refund|price|cost|fee/.test(q)) {
      const top = ["python", "mern", "uiux"].map(SR.cert).filter(Boolean);
      return bot("Our certifications are earned through a proctored online exam. You get study notes, unlimited attempts on most certifications, and a certificate ID employers can check on our Verify page. Popular ones:" + top.map(c => cardHTML({ kind: c.level || "Certification", title: c.title, img: c.img, href: "certification.html#" + c.id, meta: `${inr(c.price)} · ${c.validity} years validity` })).join("") + chipsHTML([["How does the exam work?", "How does the proctored exam work?"], ["All certifications", "go:certifications.html"]]));
    }
    // Help centre / FAQ answers
    const ws = words(q);
    const has = (txt, w) => new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(txt);
    const qa = helpQA.map(([qq, a]) => [qq, a, ws.filter(w => has(qq + " " + a, w)).length + ws.filter(w => has(qq, w)).length * 2]).sort((a, b) => b[2] - a[2])[0];
    const hits = search(v, idx = idx || buildIndex(), 3);
    if (qa && qa[2] >= Math.max(1, Math.ceil(ws.length * .8))) return bot(`<b>${esc(qa[0])}</b><br>${esc(qa[1])}` + (hits.length ? `<p class="ai-sub">Related</p>${hits.slice(0, 2).map(cardHTML).join("")}` : "") + chipsHTML([["Talk to a person", "human"], ["Something else", "menu"]]));
    if (hits.length) return bot("Here's what I found:" + hits.map(cardHTML).join("") + chipsHTML([["Help me choose", "recommend"], ["See all results", "go:courses.html#q=" + encodeURIComponent(v)]]));
    if (q === "menu") return bot("What would you like to do?" + chipsHTML(MAIN_CHIPS));
    return bot("I'm not sure about that one. Our team can answer it properly, or try asking about a course, a batch, fees or certificates." + chipsHTML(MAIN_CHIPS));
  }
})();
