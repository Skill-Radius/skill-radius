/* =====================================================================
   SkillRadius — staff panel engine (admin.html, trainer.html)
   Renders the sidebar app shell (dashboard.css), a hash router, searchable
   tables and small helpers. Each panel passes its nav + views.
===================================================================== */
SR.panel = function (cfg) {
  const { $, $$, esc, icon } = SR;
  const user = SR.auth.user();
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="sidebar" aria-label="Sidebar">
      <a class="brand" href="index.html" aria-label="SkillRadius home">${SR.logo(28)}<span>SkillRadius</span></a>
      <nav class="side-nav" id="side-nav" aria-label="Main"></nav>
      <div class="side-promo" style="background:var(--night)"><h4>${esc(cfg.badge)}</h4><p>${esc(cfg.badgeText)}</p><a href="index.html">View website</a></div>
    </aside>
    <div class="main">
      <header class="topbar">
        <a class="brand m-brand" href="index.html" aria-label="SkillRadius home">${SR.logo(28)}<span>SkillRadius</span></a>
        <div class="search" id="search-wrap">${icon("search")}<input id="panel-search" type="search" placeholder="Filter this page" aria-label="Filter rows on this page" autocomplete="off"></div>
        <div class="top-actions">
          <span class="pill blue" style="white-space:nowrap">${esc(cfg.roleLabel)}</span>
          <div class="rel">
            <button class="user-btn" id="user-btn" aria-haspopup="true" aria-expanded="false"><span class="hi">${esc(user.firstName)}</span><img src="${SR.avatarURL(user)}" alt="">${icon("chev")}</button>
            <div class="pop menu" id="user-menu" hidden>
              <div class="who"><b>${esc(user.firstName + " " + (user.lastName || ""))}</b><span>${esc(user.email)}</span></div>
              <a href="profile.html">${icon("user")}Profile</a><a href="index.html">${icon("home")}View website</a><a href="#" class="logout" data-logout>${icon("logout")}Logout</a>
            </div>
          </div>
        </div>
      </header>
      <main class="content" id="view"></main>
    </div>
    <nav class="tabbar" id="tabbar" aria-label="Main"></nav>`);

  const ub = $("#user-btn"), um = $("#user-menu");
  ub.addEventListener("click", e => { e.stopPropagation(); um.hidden = !um.hidden; ub.setAttribute("aria-expanded", String(!um.hidden)); });
  document.addEventListener("click", e => { if (!e.target.closest(".rel")) { um.hidden = true; ub.setAttribute("aria-expanded", "false"); } });

  function nav(cur) {
    const items = cfg.nav();
    $("#side-nav").innerHTML = items.map(n => n.section ? `<span class="side-label">${n.section}</span>` : `<a href="#${n.id}" title="${n.label}" ${n.id === cur ? 'aria-current="page"' : ""}>${icon(n.icon)}${n.label}${n.count ? `<span class="count">${n.count}</span>` : ""}</a>`).join("");
    $("#tabbar").innerHTML = items.filter(n => !n.section).slice(0, 5).map(n => `<a href="#${n.id}" ${n.id === cur ? 'aria-current="page"' : ""}>${icon(n.icon)}<span>${n.short || n.label}</span></a>`).join("");
  }

  function render() {
    const id = cfg.views[location.hash.slice(1)] ? location.hash.slice(1) : Object.keys(cfg.views)[0];
    nav(id);
    $("#view").innerHTML = cfg.views[id]();
    $("#panel-search").value = "";
    document.title = (cfg.nav().find(n => n.id === id) || {}).label + " · " + cfg.roleLabel + " · SkillRadius";
    if (cfg.after) cfg.after(id);
  }
  SR.panelRender = () => { const y = scrollY; render(); scrollTo(0, y); };

  // Filter every table row / card marked [data-row] on the page
  $("#panel-search").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    $$("[data-row]").forEach(r => r.hidden = q && !r.textContent.toLowerCase().includes(q));
  });
  addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
  render();
};

/* Table helper: cols = [[label, row => html, opts?]] */
SR.ptable = (cols, rows, empty = "Nothing here yet.") => rows.length ? `<div class="table-wrap"><table>
  <thead><tr>${cols.map(([l, , o = {}]) => `<th class="${o.num ? "num" : ""}">${l}</th>`).join("")}</tr></thead>
  <tbody>${rows.map(r => `<tr data-row>${cols.map(([, f, o = {}]) => `<td class="${o.cls || ""}">${f(r)}</td>`).join("")}</tr>`).join("")}</tbody>
</table></div>` : `<p class="muted small" style="padding:16px 4px">${empty}</p>`;

/* KPI tile (dashboard.css .kpi) */
SR.pkpi = (icon, bg, fg, n, label, sub, href = "") => `<${href ? `a href="${href}"` : "div"} class="kpi"><span class="ic" style="background:${bg};color:${fg}">${SR.icon(icon)}</span><b>${n}</b><span class="l">${label}</span>${sub ? `<span class="sub">${sub}</span>` : ""}</${href ? "a" : "div"}>`;

/* Deterministic sample learners for staff views (stands in for the users API) */
SR.sampleLearners = (() => {
  const first = ["Aarav", "Diya", "Rohan", "Sneha", "Kabir", "Ananya", "Vikram", "Meera", "Arjun", "Ishita", "Karthik", "Pooja", "Nikhil", "Riya", "Siddharth", "Kavya", "Imran", "Neha", "Rahul", "Tanvi", "Aditya", "Fatima", "Harsh", "Lakshmi"];
  const last = ["Sharma", "Iyer", "Mehta", "Nair", "Reddy", "Kapoor", "Singh", "Rao", "Menon", "Joshi", "Das", "Patel", "Kulkarni", "Gupta", "Bose", "Khan", "Verma", "Pillai", "Shetty", "Chopra", "Mishra", "Sheikh", "Agarwal", "Krishnan"];
  const day = 864e5, now = Date.now();
  return first.map((f, i) => ({ name: f + " " + last[(i * 7) % last.length], email: (f + "." + last[(i * 7) % last.length]).toLowerCase() + "@example.com", phone: "98" + String(45000000 + i * 137731).slice(0, 8), joined: now - (5 + i * 9) * day, city: ["Bengaluru", "Mumbai", "Pune", "Hyderabad", "Chennai", "Delhi"][i % 6], enrolments: 1 + (i * 3) % 5, status: i === 17 ? "Suspended" : "Active", spent: [1999, 24999, 5999, 899, 17999, 12999, 4999][i % 7] }));
})();
