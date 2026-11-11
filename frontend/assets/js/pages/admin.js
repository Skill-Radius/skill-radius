/* =====================================================================
   Admin panel — admin.html#overview | courses | batches | certifications
   | learners | orders | coupons | exams | leads | tickets | reviews | content
   Edits are saved to localStorage and applied across the website
   (prices, published state, coupons, certificate revocations, ticket replies).
   Replace SR.store reads/writes with your admin API.
===================================================================== */
(function () {
  if (!SR.auth.require("admin")) return;
  const { $, $$, esc, icon, inr, pct } = SR;
  const DAY = 864e5, NOW = Date.now();
  const fmt = (d) => SR.fmtDate(d, { day: "numeric", month: "short", year: "numeric" });
  const when = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const overrides = () => SR.store.get("overrides", {}) || {};
  const setOverride = (kind, id, patch) => { const o = overrides(); o[kind] = o[kind] || {}; o[kind][id] = { ...(o[kind][id] || {}), ...patch }; SR.store.set("overrides", o); };
  const statusPill = (s) => `<span class="pill ${/Paid|Active|Published|Won|Open for enrolment|Valid|Answered|Clean|Cleared/.test(s) ? "green" : /Refund|New|Open|Flagged|Draft|Running/.test(s) ? "amber" : /Suspend|Revoked|Hidden|Closed|Lost|Terminated|Invalidated/.test(s) ? "red" : "grey"}">${esc(s)}</span>`;

  /* ---------- Data (store + sample records standing in for the API) ---------- */
  const L = SR.sampleLearners;
  const catalog = [...SR.courses.map(c => ["course", c]), ...SR.trainings.map(t => ["training", t]), ...SR.certifications.map(c => ["cert", c])];
  const sampleOrders = Array.from({ length: 46 }, (_, i) => {
    const [type, it] = catalog[(i * 5 + 3) % catalog.length], l = L[(i * 7) % L.length];
    return { id: "SR-ORD-" + (239600 + i), date: NOW - ((i * 17) % 30) * DAY - (i % 9) * 3600e3, type, ref: it.id, title: it.title, total: it.price, discount: 0, coupon: i % 6 === 0 ? "SKILL10" : "", method: ["UPI", "Card", "Netbanking", "UPI", "EMI"][i % 5], status: i === 7 ? "Refunded" : "Paid", name: l.name, email: l.email, state: ["Karnataka", "Maharashtra", "Telangana", "Tamil Nadu"][i % 4], sample: true };
  }).filter(o => o.total > 0);
  const me = SR.auth.user();
  const ownOrders = () => SR.orders().map(o => ({ ...o, name: o.name || "Satish Hebbal", email: o.email || SR.DEMO.email }));
  const allOrders = () => [...ownOrders(), ...sampleOrders].sort((a, b) => b.date - a.date);
  const sampleLeads = [
    { id: "L-S1", type: "business", date: NOW - 2 * DAY, status: "Contacted", name: "Rakesh Menon", email: "rakesh@finlabs.example", company: "FinLabs", size: "50–499", interest: "Development" },
    { id: "L-S2", type: "scholarship", date: NOW - 3 * DAY, status: "New", name: "Pooja Rao", email: "pooja.rao@example.com", program: "women-tech", target: "Learning path: Full Stack Developer" },
    { id: "L-S3", type: "trainer", date: NOW - 5 * DAY, status: "New", name: "Vivek Nair", email: "vivek@example.com", subject: "Data & AI", years: "6–10" },
    { id: "L-S4", type: "job", date: NOW - 6 * DAY, status: "New", name: "Shruti Iyer", email: "shruti@example.com", role: "Frontend Engineer" },
    { id: "L-S5", type: "contact", date: NOW - 1 * DAY, status: "New", name: "Gaurav Singh", email: "gaurav@example.com", topic: "Course question", message: "Is the React course updated for the latest version?" }
  ];
  const leads = () => [...(SR.store.get("leads", []) || []), ...sampleLeads.filter(s => !(SR.store.get("leadStatus", {}) || {})["x" + s.id] )].map(l => ({ ...l, status: ((SR.store.get("leadStatus", {}) || {})[l.id]) || l.status })).sort((a, b) => b.date - a.date);
  const attempts0 = () => Object.entries(SR.store.get("attempts", {}) || {}).flatMap(([cid, list]) => list.map((a, i) => ({ ...a, cert: cid, key: cid + "-" + i })));
  const attempts = () => {
    const mine = Object.entries(SR.store.get("attempts", {}) || {}).flatMap(([cid, list]) => list.map((a, i) => ({ ...a, cert: cid, idx: i, name: "Satish Hebbal", email: SR.DEMO.email, key: cid + "-" + i })));
    const samples = L.slice(0, 9).map((l, i) => ({ cert: ["python", "uiux", "data-ai", "mern", "react-pro"][i % 5], name: l.name, email: l.email, date: NOW - (i + 1) * 2 * DAY, score: [18, 11, 15, 9, 17, 13, 19, 12, 16][i], total: 20, time: "4" + i + ":1" + i, flagged: i === 3 || i === 7, key: "s" + i }));
    return [...mine, ...samples].sort((a, b) => b.date - a.date);
  };
  const reviewed0 = () => SR.store.get("examReviewed", []) || [];
  /* Proctored attempts are open until a proctor clears or invalidates them */
  const needsReview = (a) => a.proctor ? (!a.proctor.review && ["review", "terminated"].includes(SR.integrity(a.proctor).verdict) && !a.proctor.noCamera) : (a.flagged && !reviewed0().includes(a.key));
  const reviewed = () => [...reviewed0(), ...attempts0().filter(a => a.proctor && !needsReview(a)).map(a => a.key)];
  const revoked = () => SR.store.get("revoked", []) || [];
  const certs = () => [
    ...(SR.store.get("certificates", []) || []).map(c => ({ ...c, name: "Satish Hebbal" })),
    ...Object.entries(SR.registry).filter(([id]) => !(SR.store.get("certificates", []) || []).some(c => c.id === id)).map(([id, r]) => ({ id, title: r.program, name: r.name, issued: new Date(r.issued).getTime(), kind: "Certification", score: r.score }))
  ];
  const reviews = () => Object.entries(SR.store.get("reviews", {}) || {}).flatMap(([cid, list]) => list.map((r, i) => ({ ...r, course: cid, idx: i })));
  const drafts = () => SR.store.get("draftCourses", []) || [];

  /* ---------- Views ---------- */
  function vOverview() {
    const orders = allOrders().filter(o => o.status === "Paid");
    const rev30 = orders.filter(o => NOW - o.date < 30 * DAY).reduce((s, o) => s + o.total, 0);
    const days = Array.from({ length: 14 }, (_, i) => { const start = new Date(NOW - (13 - i) * DAY); start.setHours(0, 0, 0, 0); return { d: start, v: orders.filter(o => new Date(o.date).toDateString() === start.toDateString()).reduce((s, o) => s + o.total, 0) }; });
    const max = Math.max(...days.map(d => d.v), 1);
    const W = 560, H = 190, pl = 40, pb = 24, bw = (W - pl) / 14 * 0.6;
    const y = (v) => 10 + (H - 10 - pb) * (1 - v / max);
    const chart = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue per day, last 14 days" style="width:100%;height:auto">
      ${[0, .5, 1].map(f => `<line x1="${pl}" x2="${W}" y1="${y(max * f)}" y2="${y(max * f)}" stroke="#e9ebf2"/><text x="${pl - 6}" y="${y(max * f) + 4}" text-anchor="end" style="font-size:10px;fill:#9a9eac">${f ? "₹" + Math.round(max * f / 1000) + "k" : "0"}</text>`).join("")}
      ${days.map((d, i) => { const x = pl + (W - pl) / 14 * i + ((W - pl) / 14 - bw) / 2, h = y(0) - y(d.v); return `<rect x="${x.toFixed(1)}" y="${y(d.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(d.v ? 2 : 0, h).toFixed(1)}" rx="4" fill="${i === 13 ? "#3461ff" : "#8a9dff"}"><title>${d.d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${inr(d.v)}</title></rect>${i % 2 === 0 ? `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" style="font-size:10px;fill:#9a9eac">${d.d.getDate()}</text>` : ""}`; }).join("")}</svg>`;
    const openTickets = SR.tickets().filter(t => t.status === "Open").length;
    const newLeads = leads().filter(l => l.status === "New").length;
    const flagged = attempts().filter(needsReview).length;
    const top = SR.courses.slice().sort((a, b) => b.learners - a.learners).slice(0, 5);
    return `
    <div class="view-head"><div><h1>Good ${new Date().getHours() < 12 ? "morning" : "day"}, ${esc(me.firstName)}</h1><p>Here's how SkillRadius is doing.</p></div></div>
    <section class="kpis" style="margin-bottom:20px">
      ${SR.pkpi("card", "var(--success-soft)", "var(--success-ink)", inr(rev30), "Revenue · last 30 days", `<em>${orders.filter(o => NOW - o.date < 30 * DAY).length}</em> paid orders`, "#orders")}
      ${SR.pkpi("users", "var(--primary-soft)", "var(--primary)", (L.length + Object.keys(SR.store.get("accounts", {}) || {}).length + 1).toLocaleString("en-IN"), "Learners (sample)", `<em>+${L.filter(l => NOW - l.joined < 30 * DAY).length}</em> this month`, "#learners")}
      ${SR.pkpi("help", "var(--warn-soft)", "var(--warn-ink)", openTickets, "Open tickets", `<em>${newLeads}</em> new leads`, "#tickets")}
      ${SR.pkpi("shield", "var(--danger-soft)", "var(--danger)", flagged, "Exams to review", "Proctoring flags", "#exams")}
    </section>
    <div class="grid12">
      <section class="card s7 full-md"><div class="card-head"><h2>Revenue · last 14 days</h2><span class="muted small">${inr(days.reduce((s, d) => s + d.v, 0))}</span></div>${chart}</section>
      <section class="card s5 full-md"><div class="card-head"><h2>Top courses</h2><a href="#courses">All courses</a></div>
        <div class="hb">${top.map(c => `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;margin-bottom:10px"><span class="small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.title)}</span><b class="small num">${c.learners.toLocaleString("en-IN")}</b><span class="bar" style="grid-column:1/-1"><span style="width:${pct(c.learners, top[0].learners)}%;background:var(--chart-2)"></span></span></div>`).join("")}</div></section>
      <section class="card s7 full-md"><div class="card-head"><h2>Recent orders</h2><a href="#orders">All orders</a></div>
        ${SR.ptable([["Order", o => `<b>${o.id}</b>`], ["Learner", o => esc(o.name)], ["Item", o => `<span class="small">${esc(o.title)}</span>`, { cls: "wide" }], ["Amount", o => `<b class="num">${SR.money(o.total)}</b>`], ["Status", o => statusPill(o.status)]], allOrders().slice(0, 6))}</section>
      <section class="card s5 full-md"><div class="card-head"><h2>New leads</h2><a href="#leads">All leads</a></div>
        ${leads().filter(l => l.status === "New").slice(0, 6).map(l => `<div data-row style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span><b class="small">${esc(l.name || l.email)}</b><br><span class="tiny muted">${esc(l.type)} · ${when(l.date)}</span></span>${statusPill(l.status)}</div>`).join("") || `<p class="muted small">No new leads.</p>`}</section>
    </div>`;
  }

  function vCourses() {
    const rows = [...SR.courses.map(c => ({ ...c, kind: "live" })), ...drafts().map(d => ({ ...d, kind: "draft" }))];
    return `
    <div class="view-head"><div><h1>Courses</h1><p>${SR.courses.length} courses · price and visibility changes apply to the website immediately.</p></div><button class="btn" id="new-course">${icon("plus")}New course</button></div>
    <section class="card">${SR.ptable([
      ["Course", c => `<div style="display:flex;gap:10px;align-items:center"><img src="${c.img || "assets/img/full-stack.jpg"}" alt="" style="width:56px;height:34px;object-fit:cover;border-radius:6px"><span><b style="font-weight:600">${esc(c.title)}</b><br><span class="tiny muted">${esc(c.cat)}${c.instructor ? " · " + esc(SR.trainer(c.instructor).name) : ""}</span></span></div>`, { cls: "wide" }],
      ["Price", c => `<b class="num">${inr(c.price)}</b>${c.mrp ? `<br><s class="tiny muted">${inr(c.mrp)}</s>` : ""}`],
      ["Learners", c => c.learners ? c.learners.toLocaleString("en-IN") : "–"],
      ["Rating", c => c.rating ? "★ " + c.rating : "–"],
      ["Status", c => statusPill(c.kind === "draft" ? "Draft" : c.published === false ? "Hidden" : "Published")],
      ["", c => c.kind === "draft" ? `<button class="btn ghost sm" data-del-draft="${c.id}">Delete</button>` : `<button class="btn ghost sm" data-edit-course="${c.id}">${icon("edit")}Edit</button> <a class="btn plain sm" href="course.html#${c.id}" target="_blank">View</a>`, { cls: "end" }]
    ], rows)}</section>`;
  }

  function vBatches() {
    return `
    <div class="view-head"><div><h1>Batches</h1><p>Live trainings, seats and schedules.</p></div></div>
    <section class="card">${SR.ptable([
      ["Batch", t => `<b style="font-weight:600">${esc(t.title)}</b><br><span class="tiny muted">${esc(t.batch)} · ${t.mode === "online" ? "Online" : "In-person"}</span>`, { cls: "wide" }],
      ["Starts", t => fmt(t.start)],
      ["Schedule", t => `<span class="small">${esc(t.days)}<br>${esc(t.time)}</span>`],
      ["Trainer", t => esc(SR.trainer(t.trainer).name)],
      ["Seats", t => `<b class="num">${t.taken}/${t.seats}</b><span class="bar mini" style="display:block;margin-top:4px;width:80px"><span style="width:${pct(t.taken, t.seats)}%;background:var(--training)"></span></span>`],
      ["Fee", t => inr(t.price)],
      ["Status", t => statusPill(t.closed ? "Running" : new Date(t.start) < NOW ? "Running" : t.taken >= t.seats ? "Full" : "Open for enrolment")],
      ["", t => `<button class="btn ghost sm" data-edit-batch="${t.id}">${icon("edit")}Edit</button> <button class="btn plain sm" data-roster="${t.id}">Roster</button>`, { cls: "end" }]
    ], SR.trainings)}</section>`;
  }

  function vCerts() {
    return `
    <div class="view-head"><div><h1>Certifications</h1><p>Programs, pricing and exam settings.</p></div></div>
    <section class="card">${SR.ptable([
      ["Program", c => `<b style="font-weight:600">${esc(c.title)}</b><br><span class="tiny muted">${esc(c.code)} · ${esc(c.level)}</span>`, { cls: "wide" }],
      ["Fee", c => `<b class="num">${inr(c.price)}</b>`],
      ["Enrolled", c => c.enrolled.toLocaleString("en-IN")],
      ["Exam", c => `<span class="small">${c.exam.questions} Q · ${c.exam.minutes} min · pass ${SR.passMark(c)}</span>`],
      ["Pass rate", c => c.passRate + "%"],
      ["Status", c => statusPill(c.published === false ? "Hidden" : "Published")],
      ["", c => `<button class="btn ghost sm" data-edit-cert="${c.id}">${icon("edit")}Edit</button>`, { cls: "end" }]
    ], SR.certifications)}</section>`;
  }

  function vLearners() {
    const susp = SR.store.get("suspended", []) || [];
    const acc = Object.values(SR.store.get("accounts", {}) || {}).filter(a => a.email !== SR.DEMO.email).map(a => ({ name: a.firstName + " " + a.lastName, email: a.email, phone: a.phone, joined: NOW, city: "–", enrolments: 0, spent: 0, status: "Active" }));
    const rows = [{ name: "Satish Hebbal", email: SR.DEMO.email, phone: SR.DEMO.phone, joined: NOW - 120 * DAY, city: "Bengaluru", enrolments: 11, spent: SR.orders().reduce((s, o) => s + o.total, 0), status: "Active" }, ...acc, ...L].map(l => ({ ...l, status: susp.includes(l.email) ? "Suspended" : l.status }));
    return `
    <div class="view-head"><div><h1>Learners</h1><p>${rows.length} learners (sample data plus accounts created in this browser).</p></div><button class="btn ghost" data-csv="export">${icon("download")}Export CSV</button></div>
    <section class="card">${SR.ptable([
      ["Learner", l => `<div style="display:flex;gap:10px;align-items:center"><span class="avatar-i" style="background:#3c59c8;width:32px;height:32px;font-size:12px">${SR.initials(l.name)}</span><span><b style="font-weight:600">${esc(l.name)}</b><br><span class="tiny muted">${esc(l.email)}</span></span></div>`, { cls: "wide" }],
      ["Phone", l => esc(l.phone || "–")], ["City", l => esc(l.city)], ["Joined", l => fmt(l.joined)],
      ["Enrolments", l => l.enrolments], ["Spent", l => SR.money(l.spent)], ["Status", l => statusPill(l.status)],
      ["", l => l.email === SR.DEMO.email ? "" : `<button class="btn plain sm" data-suspend="${esc(l.email)}">${l.status === "Suspended" ? "Reactivate" : "Suspend"}</button>`, { cls: "end" }]
    ], rows)}</section>`;
  }

  function vOrders() {
    const rows = allOrders();
    const paid = rows.filter(o => o.status === "Paid").reduce((s, o) => s + o.total, 0);
    return `
    <div class="view-head"><div><h1>Orders</h1><p>${rows.length} orders · ${inr(paid)} collected · ${rows.filter(o => o.status === "Refund requested").length} refund requests</p></div><button class="btn ghost" data-csv="export">${icon("download")}Export CSV</button></div>
    <section class="card">${SR.ptable([
      ["Order", o => `<b>${o.id}</b><br><span class="tiny muted">${when(o.date)}</span>`],
      ["Learner", o => `${esc(o.name)}<br><span class="tiny muted">${esc(o.email)}</span>`],
      ["Item", o => `<span class="small">${esc(o.title)}</span>${o.coupon ? `<br><span class="tiny muted">Code ${esc(o.coupon)}</span>` : ""}`, { cls: "wide" }],
      ["Method", o => esc(o.method)], ["Amount", o => `<b class="num">${SR.money(o.total)}</b>`], ["Status", o => statusPill(o.status)],
      ["", o => `${!o.sample && o.total ? `<a class="btn ghost sm" href="invoice.html#${o.id}" target="_blank">Invoice</a>` : ""} ${o.status === "Refund requested" ? `<button class="btn sm" data-refund-ok="${o.id}">Approve refund</button>` : ""}`, { cls: "end" }]
    ], rows)}</section>`;
  }

  function vCoupons() {
    const list = SR.coupons();
    return `
    <div class="view-head"><div><h1>Coupons</h1><p>Codes learners can enter at checkout. Referral codes (REF-…) are built in: ₹500 off orders over ₹2,000.</p></div></div>
    <div class="grid12">
      <section class="card s7 full-md">${SR.ptable([
        ["Code", k => `<b style="letter-spacing:.04em">${esc(k.code)}</b>`], ["Discount", k => k.pct + "%"], ["Used", k => `${k.uses || 0}${k.limit ? " / " + k.limit : ""}`], ["Note", k => `<span class="small">${esc(k.note || "")}</span>`, { cls: "wide" }], ["Status", k => statusPill(k.active ? "Active" : "Closed")],
        ["", k => `<button class="btn plain sm" data-toggle-coupon="${esc(k.code)}">${k.active ? "Deactivate" : "Activate"}</button>`, { cls: "end" }]
      ], list)}</section>
      <form class="card s5 full-md" id="coupon-form" novalidate style="display:grid;gap:12px;align-content:start">
        <h2 style="font-size:17px;font-weight:600">Create a coupon</h2>
        <div class="field"><label for="c-code">Code</label><input id="c-code" placeholder="DIWALI25" style="text-transform:uppercase"></div>
        <div class="field"><label for="c-pct">Discount %</label><input id="c-pct" type="number" min="1" max="90" value="15"></div>
        <div class="field"><label for="c-limit">Usage limit <span class="tiny muted">(0 = unlimited)</span></label><input id="c-limit" type="number" min="0" value="0"></div>
        <div class="field"><label for="c-note">Note</label><input id="c-note" placeholder="Festive campaign"></div>
        <button class="btn" type="submit">Create coupon</button>
      </form>
    </div>`;
  }

  function vExams() {
    const rows = attempts(), cs = certs();
    return `
    <div class="view-head"><div><h1>Exams &amp; certificates</h1><p>Review flagged attempts and manage issued certificates.</p></div></div>
    <section class="card" style="margin-bottom:20px"><div class="card-head"><h2>Exam attempts</h2><span class="small muted">${rows.filter(needsReview).length} flagged for review</span></div>${SR.ptable([
      ["Learner", a => `${esc(a.name)}<br><span class="tiny muted">${esc(a.email)}</span>`],
      ["Certification", a => `<span class="small">${esc((SR.cert(a.cert) || {}).title || a.cert)}</span>`, { cls: "wide" }],
      ["Date", a => fmt(a.date)], ["Score", a => `<b>${a.score}/${a.total}</b> · ${SR.examScore(SR.cert(a.cert), a)}`],
      ["Result", a => statusPill(SR.examPassed(SR.cert(a.cert), a) ? "Passed" : "Failed")],
      ["Proctoring", a => {
        if (a.proctor) { const I = SR.integrity(a.proctor); const map = { clear: "Clean", review: "Flagged", terminated: "Terminated", invalid: "Invalidated" };
          return `${statusPill(a.proctor.review === "cleared" ? "Cleared" : map[I.verdict] || "Clean")}<br><span class="tiny muted">${a.proctor.noCamera ? "No camera (demo)" : `Integrity ${I.score}/100`}${a.hold ? " · cert on hold" : ""}</span>`; }
        return a.flagged ? (reviewed().includes(a.key) ? statusPill("Cleared") : statusPill("Flagged")) : `<span class="tiny muted">Clean</span>`; }],
      ["", a => a.proctor ? `<button class="btn ${needsReview(a) ? "" : "ghost "}sm" data-pr-review="${a.key}">${needsReview(a) ? "Review" : "Report"}</button>` : a.flagged && !reviewed().includes(a.key) ? `<button class="btn sm" data-clear-exam="${a.key}">Mark reviewed</button>` : "", { cls: "end" }]
    ], rows)}</section>
    <section class="card"><div class="card-head"><h2>Issued certificates</h2></div>${SR.ptable([
      ["ID", c => `<b>${esc(c.id)}</b>`], ["Name", c => esc(c.name)], ["Program", c => `<span class="small">${esc(c.title)}</span>`, { cls: "wide" }], ["Issued", c => fmt(c.issued)],
      ["Status", c => statusPill(revoked().includes(c.id) ? "Revoked" : "Valid")],
      ["", c => `<a class="btn ghost sm" href="verify.html#${c.id}" target="_blank">Verify</a> <button class="btn plain sm" data-revoke="${c.id}">${revoked().includes(c.id) ? "Restore" : "Revoke"}</button>`, { cls: "end" }]
    ], cs)}</section>`;
  }

  let leadType = "all";
  function vLeads() {
    const all = leads(), types = ["all", ...new Set(all.map(l => l.type))];
    const rows = all.filter(l => leadType === "all" || l.type === leadType);
    const detail = (l) => Object.entries(l).filter(([k]) => !["id", "type", "date", "status", "name", "email", "consent", "sample"].includes(k) && l[k] !== "" && l[k] !== false).map(([k, v]) => `<b>${esc(k)}:</b> ${esc(String(v)).slice(0, 80)}`).join("<br>");
    return `
    <div class="view-head"><div><h1>Leads &amp; applications</h1><p>Business enquiries, scholarship and trainer applications, job applicants, event sign-ups and contact messages.</p></div></div>
    <div class="seg" role="tablist" style="margin-bottom:16px;flex-wrap:wrap">${types.map(t => `<button role="tab" aria-selected="${t === leadType}" data-lead-type="${t}">${t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)} <span class="c">${t === "all" ? all.length : all.filter(l => l.type === t).length}</span></button>`).join("")}</div>
    <section class="card">${SR.ptable([
      ["Received", l => `<span class="small">${when(l.date)}</span><br><span class="tiny muted">${l.id}</span>`],
      ["Type", l => `<span class="pill blue">${esc(l.type)}</span>`],
      ["From", l => `<b style="font-weight:600">${esc(l.name || "–")}</b><br><span class="tiny muted">${esc(l.email || "")}${l.phone ? " · " + esc(l.phone) : ""}</span>`],
      ["Details", l => `<span class="small muted">${detail(l)}</span>`, { cls: "wide" }],
      ["Status", l => `<select class="select" data-lead-status="${l.id}" aria-label="Lead status" style="padding:6px 8px;border:1px solid var(--line);border-radius:8px">${["New", "Contacted", "Won", "Lost", "Closed"].map(s => `<option ${s === l.status ? "selected" : ""}>${s}</option>`).join("")}</select>`]
    ], rows, "No leads of this type yet.")}</section>`;
  }

  function vTickets() {
    const ts = SR.tickets().slice().sort((a, b) => b.updated - a.updated);
    return `
    <div class="view-head"><div><h1>Support tickets</h1><p>${ts.filter(t => t.status === "Open").length} open · replies show up in the learner's Support page.</p></div></div>
    <section class="card">${SR.ptable([
      ["Ticket", t => `<b>${t.id}</b><br><span class="tiny muted">${when(t.updated)}</span>`],
      ["Learner", t => `${esc(t.name)}<br><span class="tiny muted">${esc(t.email)}</span>`],
      ["Subject", t => `<b style="font-weight:600">${esc(t.subject)}</b><br><span class="tiny muted">${esc(t.topic)}${t.order ? " · " + t.order : ""}</span>`, { cls: "wide" }],
      ["Status", t => statusPill(t.status)],
      ["", t => `<button class="btn sm" data-ticket="${t.id}">Open</button>`, { cls: "end" }]
    ], ts, "No tickets yet. Learners raise them from the Support page or by requesting a refund.")}</section>`;
  }

  function vReviews() {
    const rs = reviews();
    return `
    <div class="view-head"><div><h1>Course reviews</h1><p>Reviews posted by learners. Hide anything abusive or off-topic.</p></div></div>
    <section class="card">${SR.ptable([
      ["Course", r => `<span class="small">${esc((SR.course(r.course) || {}).title || r.course)}</span>`],
      ["Learner", r => esc(r.name)], ["Rating", r => `<span class="stars" style="color:var(--warn)">${SR.stars(r.rating)}</span>`],
      ["Review", r => `<span class="small">${esc(r.text)}</span>`, { cls: "wide" }], ["Date", r => fmt(r.at)], ["Status", r => statusPill(r.status === "hidden" ? "Hidden" : "Published")],
      ["", r => `<button class="btn plain sm" data-review="${r.course}|${r.idx}">${r.status === "hidden" ? "Publish" : "Hide"}</button>`, { cls: "end" }]
    ], rs, "No learner reviews yet. They appear here once learners post them on course pages.")}</section>`;
  }

  function vContent() {
    const hidden = SR.store.get("postsHidden", []) || [], regs = SR.store.get("eventRegs", []) || [];
    return `
    <div class="view-head"><div><h1>Content</h1><p>Blog articles and free events.</p></div></div>
    <section class="card" style="margin-bottom:20px"><div class="card-head"><h2>Blog articles</h2></div>${SR.ptable([
      ["Title", p => `<b style="font-weight:600">${esc(p.title)}</b>`, { cls: "wide" }], ["Category", p => esc(p.cat)], ["Author", p => esc(SR.trainer(p.author).name)], ["Published", p => fmt(p.date)],
      ["Status", p => statusPill(hidden.includes(p.slug) ? "Hidden" : "Published")],
      ["", p => `<a class="btn ghost sm" href="article.html#${p.slug}" target="_blank">View</a> <button class="btn plain sm" data-post="${p.slug}">${hidden.includes(p.slug) ? "Publish" : "Unpublish"}</button>`, { cls: "end" }]
    ], SR.posts)}</section>
    <section class="card"><div class="card-head"><h2>Events</h2></div>${SR.ptable([
      ["Event", e => `<b style="font-weight:600">${esc(e.title)}</b><br><span class="tiny muted">${esc(e.type)} · host ${esc(SR.trainer(e.host).name)}</span>`, { cls: "wide" }],
      ["Date", e => when(e.date)], ["Registrations", e => `<b>${e.registered + (regs.includes(e.id) ? 1 : 0)}</b> / ${e.seats}`], ["Status", e => statusPill(e.date < NOW ? "Closed" : "Open")]
    ], SR.events)}</section>`;
  }

  /* ---------- Actions ---------- */
  function after() {
    const nc = $("#new-course");
    if (nc) nc.addEventListener("click", () => SR.modal(`<h2>New course</h2><p class="small muted">Creates a draft. Add modules and lessons in the course builder (connect to your CMS).</p>
      <form class="stack"><div class="field"><label for="n-title">Title</label><input id="n-title"></div><div class="field"><label for="n-cat">Category</label><select id="n-cat">${[...new Set(SR.courses.map(c => c.cat))].map(c => `<option>${c}</option>`).join("")}</select></div><div class="field"><label for="n-price">Price (₹)</label><input id="n-price" type="number" min="0" value="999"></div>
      <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Create draft</button></div></form>`, (m) => {
      const t = m.querySelector("#n-title").value.trim(); if (!t) { SR.fieldError(m.querySelector("#n-title"), "Add a title."); return false; }
      SR.store.set("draftCourses", [...drafts(), { id: "draft-" + Date.now().toString(36), title: t, cat: m.querySelector("#n-cat").value, price: +m.querySelector("#n-price").value || 0 }]);
      SR.panelRender(); SR.toast("Draft created");
    }));
    const cf = $("#coupon-form");
    if (cf) cf.addEventListener("submit", e => {
      e.preventDefault();
      const code = $("#c-code").value.trim().toUpperCase(), p = +$("#c-pct").value;
      SR.fieldError($("#c-code"), /^[A-Z0-9]{4,16}$/.test(code) ? (SR.coupons().some(k => k.code === code) ? "That code already exists." : "") : "Use 4–16 letters or numbers.");
      SR.fieldError($("#c-pct"), p >= 1 && p <= 90 ? "" : "Enter 1–90.");
      if (!/^[A-Z0-9]{4,16}$/.test(code) || SR.coupons().some(k => k.code === code) || !(p >= 1 && p <= 90)) return;
      SR.store.set("coupons", [...SR.coupons(), { code, pct: p, limit: +$("#c-limit").value || 0, note: $("#c-note").value.trim(), active: true, uses: 0 }]);
      SR.panelRender(); SR.toast(`${code} created. It works at checkout now.`);
    });
  }

  document.addEventListener("change", e => {
    const ls = e.target.closest("[data-lead-status]"); if (!ls) return;
    const all = SR.store.get("leadStatus", {}) || {}; all[ls.dataset.leadStatus] = ls.value; SR.store.set("leadStatus", all);
    const stored = SR.store.get("leads", []) || []; const x = stored.find(l => l.id === ls.dataset.leadStatus); if (x) { x.status = ls.value; SR.store.set("leads", stored); }
    SR.toast("Lead marked " + ls.value);
  });

  document.addEventListener("click", e => {
    const t = (s) => e.target.closest(s);
    let b;
    if ((b = t("[data-edit-course]"))) {
      const c = SR.course(b.dataset.editCourse);
      SR.modal(`<h2>Edit course</h2><p class="small muted">${esc(c.title)}</p><form class="stack">
        <div class="field"><label for="e-price">Price (₹)</label><input id="e-price" type="number" min="0" value="${c.price}"></div>
        <div class="field"><label for="e-mrp">List price / MRP (₹)</label><input id="e-mrp" type="number" min="0" value="${c.mrp}"></div>
        <label class="checkbox" style="display:flex;gap:8px"><input type="checkbox" id="e-best" ${c.bestseller ? "checked" : ""}>Bestseller badge</label>
        <label class="checkbox" style="display:flex;gap:8px"><input type="checkbox" id="e-pub" ${c.published === false ? "" : "checked"}>Published on the website</label>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`, (m) => {
        const price = +m.querySelector("#e-price").value, mrp = +m.querySelector("#e-mrp").value;
        if (mrp && mrp < price) { SR.fieldError(m.querySelector("#e-mrp"), "MRP should be at least the price."); return false; }
        const patch = { price, mrp, bestseller: m.querySelector("#e-best").checked, published: m.querySelector("#e-pub").checked };
        setOverride("courses", c.id, patch); Object.assign(c, patch); SR.panelRender(); SR.toast("Saved. The website shows the new details.");
      });
    } else if ((b = t("[data-edit-cert]"))) {
      const c = SR.cert(b.dataset.editCert);
      SR.modal(`<h2>Edit certification</h2><p class="small muted">${esc(c.title)}</p><form class="stack">
        <div class="field"><label for="e-price">Fee (₹)</label><input id="e-price" type="number" min="0" value="${c.price}"></div>
        <div class="field"><label for="e-mrp">List price (₹)</label><input id="e-mrp" type="number" min="0" value="${c.mrp}"></div>
        <label class="checkbox" style="display:flex;gap:8px"><input type="checkbox" id="e-pub" ${c.published === false ? "" : "checked"}>Published on the website</label>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`, (m) => {
        const patch = { price: +m.querySelector("#e-price").value, mrp: +m.querySelector("#e-mrp").value, published: m.querySelector("#e-pub").checked };
        setOverride("certs", c.id, patch); Object.assign(c, patch); SR.panelRender(); SR.toast("Saved");
      });
    } else if ((b = t("[data-edit-batch]"))) {
      const tr = SR.training(b.dataset.editBatch);
      SR.modal(`<h2>Edit batch</h2><p class="small muted">${esc(tr.title)} · ${esc(tr.batch)}</p><form class="stack">
        <div class="field"><label for="e-start">Start date</label><input id="e-start" type="date" value="${tr.start}"></div>
        <div class="field"><label for="e-seats">Seats</label><input id="e-seats" type="number" min="${tr.taken}" value="${tr.seats}"></div>
        <div class="field"><label for="e-price">Fee (₹)</label><input id="e-price" type="number" min="0" value="${tr.price}"></div>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Save</button></div></form>`, (m) => {
        const seats = +m.querySelector("#e-seats").value;
        if (seats < tr.taken) { SR.fieldError(m.querySelector("#e-seats"), `At least ${tr.taken} (seats already taken).`); return false; }
        const patch = { start: m.querySelector("#e-start").value || tr.start, seats, price: +m.querySelector("#e-price").value };
        setOverride("trainings", tr.id, patch); Object.assign(tr, patch); SR.panelRender(); SR.toast("Batch updated");
      });
    } else if ((b = t("[data-roster]"))) {
      const tr = SR.training(b.dataset.roster), n = Math.min(tr.taken, 12);
      const roster = [...(SR.isEnrolled("trainings", tr.id) ? [{ name: "Satish Hebbal", email: SR.DEMO.email }] : []), ...L.slice(0, n)];
      SR.modal(`<h2>${esc(tr.title)}</h2><p class="small muted">${esc(tr.batch)} · ${tr.taken} learners${tr.taken > roster.length ? ` (showing ${roster.length})` : ""}</p>
        <div style="max-height:50vh;overflow:auto;display:grid;gap:6px">${roster.map(l => `<div style="display:flex;gap:10px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)"><span class="avatar-i" style="background:#7a4fe0;width:30px;height:30px;font-size:11px">${SR.initials(l.name)}</span><span class="small"><b>${esc(l.name)}</b><br><span class="muted">${esc(l.email)}</span></span></div>`).join("")}</div>
        <div class="btn-row"><button class="btn ghost" data-csv="roster">Export</button><button class="btn" data-close>Close</button></div>`);
    } else if ((b = t("[data-del-draft]"))) {
      SR.store.set("draftCourses", drafts().filter(d => d.id !== b.dataset.delDraft)); SR.panelRender(); SR.toast("Draft deleted");
    } else if ((b = t("[data-suspend]"))) {
      const s = SR.store.get("suspended", []) || [], em = b.dataset.suspend;
      SR.store.set("suspended", s.includes(em) ? s.filter(x => x !== em) : [...s, em]); SR.panelRender(); SR.toast(s.includes(em) ? "Account reactivated" : "Account suspended");
    } else if ((b = t("[data-refund-ok]"))) {
      const all = SR.orders(), o = all.find(x => x.id === b.dataset.refundOk); o.status = "Refunded"; SR.store.set("orders", all);
      const ts = SR.tickets(), tk = ts.find(x => x.order === o.id && x.status !== "Closed");
      if (tk) { tk.messages.push({ from: "support", text: `Your refund of ${inr(o.total)} for ${o.title} is approved. It will reach your original payment method in 7–10 business days.`, at: Date.now() }); tk.status = "Answered"; tk.updated = Date.now(); SR.saveTickets(ts); }
      SR.panelRender(); SR.toast("Refund approved and the learner notified");
    } else if ((b = t("[data-toggle-coupon]"))) {
      SR.store.set("coupons", SR.coupons().map(k => k.code === b.dataset.toggleCoupon ? { ...k, active: !k.active } : k)); SR.panelRender();
    } else if ((b = t("[data-pr-review]"))) {
      const a = attempts().find(x => x.key === b.dataset.prReview); if (!a) return;
      const c = SR.cert(a.cert), open = needsReview(a);
      const m = SR.modal(`<h2>Proctoring review</h2><p class="muted small">${esc(a.name)} · ${esc((c || {}).title || a.cert)} · ${fmt(a.date)} · score ${SR.examScore(c, a)} (${SR.examPassed(c, a) ? "pass" : "fail"})</p>
        <div style="max-height:60vh;overflow:auto;margin:14px 0">${SR.proctorReportHTML(a, { open: true })}</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">${open ? `<button class="btn ghost" data-pr-act="invalidated">Invalidate result</button><button class="btn" data-pr-act="cleared">Clear attempt${a.hold ? " &amp; release certificate" : ""}</button>` : `<button class="btn ghost" data-close>Close</button>`}</div>`, null, { wide: true });
      m.el.addEventListener("click", ev => {
        const x = ev.target.closest("[data-pr-act]"); if (!x) return;
        const all = SR.store.get("attempts", {}) || {}, rec = all[a.cert][a.idx];
        rec.proctor.review = x.dataset.prAct; rec.proctor.reviewedAt = Date.now();
        let msg = "Result invalidated. The learner will be notified.";
        if (x.dataset.prAct === "cleared") { msg = "Attempt cleared"; if (rec.hold) { rec.hold = false; const id = SR.issueCertificate(c, rec); msg = `Cleared. Certificate ${id} released.`; } }
        else rec.hold = false;
        SR.store.set("attempts", all); m.close(); SR.panelRender(); SR.toast(msg);
      });
    } else if ((b = t("[data-clear-exam]"))) {
      SR.store.set("examReviewed", [...reviewed(), b.dataset.clearExam]); SR.panelRender(); SR.toast("Attempt cleared");
    } else if ((b = t("[data-revoke]"))) {
      const r = revoked(), id = b.dataset.revoke;
      SR.store.set("revoked", r.includes(id) ? r.filter(x => x !== id) : [...r, id]); SR.panelRender(); SR.toast(r.includes(id) ? "Certificate restored" : "Certificate revoked. Verify now shows it as revoked.");
    } else if ((b = t("[data-lead-type]"))) {
      leadType = b.dataset.leadType; SR.panelRender();
    } else if ((b = t("[data-review]"))) {
      const [cid, idx] = b.dataset.review.split("|"), all = SR.store.get("reviews", {}) || {}, r = all[cid][+idx];
      r.status = r.status === "hidden" ? "published" : "hidden"; SR.store.set("reviews", all); SR.panelRender();
    } else if ((b = t("[data-post]"))) {
      const h = SR.store.get("postsHidden", []) || [], s = b.dataset.post;
      SR.store.set("postsHidden", h.includes(s) ? h.filter(x => x !== s) : [...h, s]); SR.panelRender();
    } else if ((b = t("[data-ticket]"))) {
      const tk = SR.tickets().find(x => x.id === b.dataset.ticket);
      SR.modal(`<h2>${esc(tk.subject)}</h2><p class="small muted">${tk.id} · ${esc(tk.name)} · ${esc(tk.topic)}${tk.order ? " · " + tk.order : ""}</p>
        <div style="max-height:40vh;overflow:auto;display:grid;gap:8px">${tk.messages.map(m => `<div style="justify-self:${m.from === "learner" ? "start" : "end"};max-width:85%;background:${m.from === "learner" ? "var(--bg)" : "var(--primary)"};color:${m.from === "learner" ? "var(--ink)" : "#fff"};border-radius:12px;padding:10px 12px;font-size:14px">${esc(m.text)}<div style="font-size:11px;opacity:.7;margin-top:4px">${when(m.at)}</div></div>`).join("")}</div>
        <form class="stack"><div class="field"><label for="tk-reply">Reply</label><textarea id="tk-reply" style="min-height:80px" placeholder="Write a reply to the learner"></textarea></div>
        <div class="btn-row"><button class="btn plain" type="button" id="tk-close">Close ticket</button><button class="btn" type="submit">Send reply</button></div></form>`, (m) => {
        const v = m.querySelector("#tk-reply").value.trim(); if (!v) { SR.fieldError(m.querySelector("#tk-reply"), "Write a reply."); return false; }
        const all = SR.tickets(), x = all.find(y => y.id === tk.id); x.messages.push({ from: "support", text: v, at: Date.now() }); x.status = "Answered"; x.updated = Date.now(); SR.saveTickets(all); SR.panelRender(); SR.toast("Reply sent");
      }, { wide: true });
      $("#tk-close").addEventListener("click", () => { const all = SR.tickets(); const x = all.find(y => y.id === tk.id); x.status = "Closed"; x.updated = Date.now(); SR.saveTickets(all); document.querySelector(".modal-back").remove(); SR.panelRender(); SR.toast("Ticket closed"); });
    }
  });

  SR.panel({
    roleLabel: "Admin", badge: "Admin panel", badgeText: "Changes here update the live website.",
    nav: () => [
      { section: "Overview" }, { id: "overview", label: "Dashboard", icon: "home", short: "Home" },
      { section: "Catalog" }, { id: "courses", label: "Courses", icon: "book" }, { id: "batches", label: "Batches", icon: "training" }, { id: "certifications", label: "Certifications", icon: "cert", short: "Certs" },
      { section: "People & sales" }, { id: "learners", label: "Learners", icon: "users" }, { id: "orders", label: "Orders", icon: "card", count: allOrders().filter(o => o.status === "Refund requested").length }, { id: "coupons", label: "Coupons", icon: "tag" },
      { section: "Operations" }, { id: "exams", label: "Exams & certificates", icon: "shield", count: attempts().filter(needsReview).length }, { id: "leads", label: "Leads", icon: "bell", count: leads().filter(l => l.status === "New").length }, { id: "tickets", label: "Support tickets", icon: "help", count: SR.tickets().filter(t => t.status === "Open").length }, { id: "reviews", label: "Reviews", icon: "star" }, { id: "content", label: "Content", icon: "articles" }
    ],
    views: { overview: vOverview, courses: vCourses, batches: vBatches, certifications: vCerts, learners: vLearners, orders: vOrders, coupons: vCoupons, exams: vExams, leads: vLeads, tickets: vTickets, reviews: vReviews, content: vContent },
    after
  });
})();
