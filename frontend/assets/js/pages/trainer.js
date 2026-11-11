/* =====================================================================
   Trainer panel — trainer.html#overview | batches | attendance | submissions | qa | schedule
   Grades, answers and recordings are saved to localStorage and show up for
   learners (assignment page, lesson Q&A, dashboard). Swap for the API later.
===================================================================== */
(function () {
  if (!SR.auth.require("trainer")) return;
  const { $, esc, icon, pct } = SR;
  const DAY = 864e5, NOW = Date.now();
  const me = SR.auth.user(), key = me.trainer || "priya", tr = SR.trainer(key);
  const when = (d) => new Date(d).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const day = (d) => SR.fmtDate(d, { weekday: "short", day: "numeric", month: "short" });
  const L = SR.sampleLearners;

  const batches = SR.trainings.filter(t => t.trainer === key);
  const running = batches.filter(t => t.closed || new Date(t.start) <= NOW);
  const courses = SR.courses.filter(c => c.instructor === key);
  const sessions = (t) => SR.sessionsOf(t).map((s, i) => ({ t, s, i, topic: (t.topics || [])[i] || `Session ${i + 1}`, done: s.getTime() + SR.durationMin(t) * 60000 < NOW }));
  const roster = (t) => [...(SR.isEnrolled("trainings", t.id) ? [{ name: "Satish Hebbal", email: SR.DEMO.email }] : []), ...L.slice(0, Math.min(t.taken, 14) - (SR.isEnrolled("trainings", t.id) ? 1 : 0))];

  /* Attendance: stored marks, otherwise a deterministic sample */
  const marks = () => SR.store.get("attendanceMarks", {}) || {};
  const markOf = (t, i, email, j) => { const m = marks()[`${t.id}/${i}`]; return m && m[email] ? m[email] : ((j * 7 + i * 3) % 11 === 0 ? "a" : "p"); };
  const recordings = () => SR.store.get("recordings", {}) || {};

  /* Submissions: the learner's real ones from the store + sample ones for other learners */
  const subsStore = () => SR.store.get("submissions", {}) || {};
  const sampleGrades = () => SR.store.get("sampleGrades", {}) || {};
  function submissions() {
    const out = [];
    running.forEach(t => {
      (subsStore()[t.id] || []).forEach((s, idx) => out.push({ ...s, t, idx, own: true, name: s.name || "Satish Hebbal", email: SR.DEMO.email, key: `own/${t.id}/${idx}` }));
      if (t.assignment) L.slice(2, 7).forEach((l, j) => {
        const k = `s/${t.id}/${j}`, g = sampleGrades()[k] || {};
        out.push({ title: t.assignment.title, link: `https://github.com/${l.name.split(" ")[0].toLowerCase()}/${t.assignment.title.toLowerCase().replace(/\W+/g, "-")}`, file: j === 1 ? "submission.zip" : "", notes: ["Couldn't finish the delete route, rest works.", "", "Added pagination as an extra.", "Tests are in /tests.", ""][j], at: NOW - (j + 1) * 5 * 3600e3, t, name: l.name, email: l.email, key: k, ...g });
      });
    });
    return out.sort((a, b) => (a.score != null) - (b.score != null) || b.at - a.at);
  }
  const pending = () => submissions().filter(s => s.score == null);

  /* Q&A for this trainer's courses */
  const questions = () => courses.flatMap(c => SR.qaFor(c.id).map(q => ({ ...q, course: c }))).sort((a, b) => (a.answers.length > 0) - (b.answers.length > 0) || b.at - a.at);
  const openQs = () => questions().filter(q => !q.answers.length);

  const upcoming = () => batches.flatMap(sessions).filter(x => !x.done).sort((a, b) => a.s - b.s);
  const held = () => running.flatMap(sessions).filter(x => x.done).sort((a, b) => b.s - a.s);

  /* ---------- Views ---------- */
  function vOverview() {
    const next = upcoming()[0], learners = running.reduce((s, t) => s + t.taken, 0);
    const att = held().slice(0, 6).map(x => { const r = roster(x.t); return { x, p: pct(r.filter((l, j) => markOf(x.t, x.i, l.email, j) === "p").length, r.length) }; });
    return `
    <div class="view-head"><div><h1>Hi ${esc(me.firstName)}</h1><p>${esc(tr.role)} · ${running.length} running batch${running.length === 1 ? "" : "es"}, ${courses.length} course${courses.length === 1 ? "" : "s"}.</p></div></div>
    ${next ? `<section class="card" style="margin-bottom:20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;background:var(--primary);color:#fff;border:0">
      <span style="width:46px;height:46px;border-radius:12px;background:rgba(255,255,255,.16);display:grid;place-items:center">${icon("live")}</span>
      <div style="flex:1;min-width:200px"><span class="tiny" style="opacity:.8">Next session · ${when(next.s)}</span><h2 style="font-size:19px;font-weight:600;color:#fff">${esc(next.topic)}</h2><span class="small" style="opacity:.85">${esc(next.t.title)} · ${esc(next.t.batch)}</span></div>
      <button class="btn" style="background:#fff;color:var(--primary)" data-start="${next.t.id}">${SR.meetLink(next.t.id) ? "Open classroom" : "Start session"}</button></section>` : ""}
    <section class="kpis" style="margin-bottom:20px">
      ${SR.pkpi("users", "var(--primary-soft)", "var(--primary)", learners, "Learners in running batches", "", "#batches")}
      ${SR.pkpi("notes", "var(--warn-soft)", "var(--warn-ink)", pending().length, "Submissions to grade", "", "#submissions")}
      ${SR.pkpi("help", "var(--danger-soft)", "var(--danger)", openQs().length, "Unanswered questions", "", "#qa")}
      ${SR.pkpi("star", "var(--success-soft)", "var(--success-ink)", "★ " + (batches[0] ? batches[0].rating : "4.8"), "Average rating", "From learner feedback")}
    </section>
    <div class="grid12">
      <section class="card s7 full-md"><div class="card-head"><h2>Recent attendance</h2><a href="#attendance">Mark attendance</a></div>
        ${att.length ? att.map(({ x, p }) => `<div data-row style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;margin-bottom:12px"><span class="small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><b>${esc(x.topic)}</b> · ${day(x.s)}</span><b class="small">${p}%</b><span class="bar" style="grid-column:1/-1"><span style="width:${p}%;background:${p >= 85 ? "var(--success)" : "var(--warn)"}"></span></span></div>`).join("") : `<p class="muted small">No sessions held yet.</p>`}</section>
      <section class="card s5 full-md"><div class="card-head"><h2>To grade</h2><a href="#submissions">All</a></div>
        ${pending().slice(0, 5).map(s => `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span><b class="small">${esc(s.name)}</b><br><span class="tiny muted">${esc(s.title)} · ${day(s.at)}</span></span><button class="btn sm" data-grade="${s.key}">Grade</button></div>`).join("") || `<p class="muted small">All caught up.</p>`}</section>
    </div>`;
  }

  function vBatches() {
    return `
    <div class="view-head"><div><h1>My batches</h1><p>Rosters, progress and recordings.</p></div></div>
    <div class="stack" style="gap:20px">${batches.map(t => {
      const ss = sessions(t), done = ss.filter(x => x.done).length;
      return `<section class="card"><div class="card-head" style="flex-wrap:wrap;gap:8px"><div><h2>${esc(t.title)}</h2><span class="small muted">${esc(t.batch)} · ${esc(t.days)} ${esc(t.time)} · starts ${day(t.start + "T00:00")}</span></div><span class="pill ${done ? "amber" : "blue"}">${done ? `Running · ${done}/${ss.length} sessions` : "Starts soon"}</span></div>
        <span class="bar" style="display:block;margin:6px 0 16px"><span style="width:${pct(done, ss.length)}%;background:var(--training)"></span></span>
        <div class="grid12">
          <div class="s6 full-md"><h3 class="small" style="font-weight:600;margin-bottom:8px">Roster · ${t.taken} learners</h3>${SR.ptable([["Learner", l => `<b style="font-weight:600">${esc(l.name)}</b><br><span class="tiny muted">${esc(l.email)}</span>`, { cls: "wide" }], ["Attendance", (l) => { const j = roster(t).indexOf(roster(t).find(r => r.email === l.email)), h = ss.filter(x => x.done); return h.length ? pct(h.filter(x => markOf(t, x.i, l.email, j) === "p").length, h.length) + "%" : "–"; }]], roster(t).slice(0, 8))}</div>
          <div class="s6 full-md"><h3 class="small" style="font-weight:600;margin-bottom:8px">Session recordings</h3>
            ${ss.filter(x => x.done).length ? ss.filter(x => x.done).slice(-6).reverse().map(x => { const r = recordings()[`${t.id}/${x.i}`]; return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)"><span class="small"><b>${esc(x.topic)}</b><br><span class="tiny muted">${day(x.s)}${r ? " · " + esc(r) : ""}</span></span>${r || x.i % 4 !== 3 ? `<span class="pill green">Uploaded</span>` : `<button class="btn ghost sm" data-upload="${t.id}/${x.i}">${icon("download")}Upload</button>`}</div>`; }).join("") : `<p class="muted small">Recordings appear after each session.</p>`}</div>
        </div></section>`;
    }).join("") || `<div class="empty"><h3>No batches assigned</h3><p>Ask the admin team to assign you to a batch.</p></div>`}</div>`;
  }

  let attSel = null;
  function vAttendance() {
    const list = held();
    if (!list.length) return `<div class="view-head"><div><h1>Attendance</h1></div></div><div class="empty"><h3>No sessions held yet</h3><p>You can mark attendance once a session has taken place.</p></div>`;
    const cur = list.find(x => `${x.t.id}/${x.i}` === attSel) || list[0], r = roster(cur.t);
    return `
    <div class="view-head"><div><h1>Attendance</h1><p>Learners see their attendance on their dashboard.</p></div></div>
    <section class="card">
      <div class="field" style="max-width:520px;margin-bottom:14px"><label for="att-session">Session</label><select id="att-session">${list.map(x => `<option value="${x.t.id}/${x.i}" ${x === cur ? "selected" : ""}>${esc(x.t.batch)} · ${day(x.s)} · ${esc(x.topic)}</option>`).join("")}</select></div>
      <form id="att-form">
        ${SR.ptable([["Learner", l => `<b style="font-weight:600">${esc(l.name)}</b><br><span class="tiny muted">${esc(l.email)}</span>`, { cls: "wide" }],
          ["Status", l => { const j = r.indexOf(l), v = markOf(cur.t, cur.i, l.email, j); return `<div class="seg" role="radiogroup" aria-label="Attendance for ${esc(l.name)}">${[["p", "Present"], ["a", "Absent"], ["l", "Late"]].map(([k, lab]) => `<label style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:14px"><input type="radio" name="${esc(l.email)}" value="${k}" ${v === k ? "checked" : ""}>${lab}</label>`).join("")}</div>`; }]], r)}
        <div class="btn-row" style="margin-top:14px;justify-content:flex-end"><button class="btn plain" type="button" id="att-all">Mark all present</button><button class="btn" type="submit">Save attendance</button></div>
      </form>
    </section>`;
  }

  let subFilter = "pending";
  function vSubmissions() {
    const all = submissions(), rows = all.filter(s => subFilter === "all" || (subFilter === "pending" ? s.score == null : s.score != null));
    return `
    <div class="view-head"><div><h1>Assignment submissions</h1><p>Grades and feedback appear on the learner's assignment page.</p></div></div>
    <div class="seg" role="tablist" style="margin-bottom:16px">${[["pending", "To grade"], ["graded", "Graded"], ["all", "All"]].map(([k, l]) => `<button role="tab" aria-selected="${k === subFilter}" data-sub-filter="${k}">${l} <span class="c">${k === "all" ? all.length : all.filter(s => k === "pending" ? s.score == null : s.score != null).length}</span></button>`).join("")}</div>
    <section class="card">${SR.ptable([
      ["Learner", s => `<b style="font-weight:600">${esc(s.name)}</b><br><span class="tiny muted">${esc(s.t.batch)}</span>`],
      ["Assignment", s => `<span class="small"><b>${esc(s.title)}</b></span><br><a class="tiny" href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.link.replace(/^https?:\/\//, ""))}</a>${s.file ? `<br><span class="tiny muted">${esc(s.file)}</span>` : ""}`, { cls: "wide" }],
      ["Submitted", s => `<span class="small">${when(s.at)}</span>`],
      ["Score", s => s.score != null ? `<span class="pill green">${s.score}/${s.max}</span>` : `<span class="pill amber">To grade</span>`],
      ["", s => `<button class="btn ${s.score != null ? "ghost" : ""} sm" data-grade="${s.key}">${s.score != null ? "Edit grade" : "Grade"}</button>`, { cls: "end" }]
    ], rows, subFilter === "pending" ? "All caught up. Nothing to grade." : "No submissions yet.")}</section>`;
  }

  function vQA() {
    const qs = questions();
    return `
    <div class="view-head"><div><h1>Learner questions</h1><p>Questions from lessons in your courses. Answers show up under the lesson for every learner.</p></div></div>
    <div class="stack" style="gap:14px">${qs.map(q => `<section class="card" data-row>
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="tiny muted">${esc(q.course.title)} · ${esc((SR.lessons(q.course).find(x => x.key === q.lesson) || {}).title || "")}</span>${q.answers.length ? `<span class="pill green">Answered</span>` : `<span class="pill amber">Waiting</span>`}</div>
      <h2 style="font-size:17px;font-weight:600;margin:6px 0 2px">${esc(q.q)}</h2><span class="tiny muted">${esc(q.by)} · ${when(q.at)}</span>
      ${q.answers.map(a => `<div style="margin-top:10px;background:var(--primary-softer,#f0f3ff);border-radius:10px;padding:10px 12px;font-size:14.5px"><b style="font-size:13px;color:var(--primary)">${esc(a.by)}${a.role === "trainer" ? " · Trainer" : ""}</b><p style="margin-top:4px">${esc(a.text)}</p></div>`).join("")}
      <form class="stack" data-answer="${q.course.id}|${q.id}" novalidate style="margin-top:10px"><label class="sr-only" for="ans-${q.id}">Your answer</label><textarea id="ans-${q.id}" style="min-height:64px;width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;font:inherit" placeholder="${q.answers.length ? "Add a follow-up" : "Write an answer"}"></textarea><button class="btn sm" type="submit" style="justify-self:start">Post answer</button></form>
    </section>`).join("") || `<div class="empty"><h3>No questions yet</h3><p>Questions learners ask on your lessons show up here.</p></div>`}</div>`;
  }

  function vSchedule() {
    const up = upcoming().slice(0, 16), groups = {};
    up.forEach(x => { const k = x.s.toDateString(); (groups[k] = groups[k] || []).push(x); });
    return `
    <div class="view-head"><div><h1>Schedule</h1><p>Your next ${up.length} live sessions.</p></div><button class="btn ghost" data-ics-training="${batches.map(b => b.id).join(",")}">${icon("cal")}Add to calendar</button></div>
    <div class="stack" style="gap:16px">${Object.entries(groups).map(([d, xs]) => `<section class="card" data-row><h2 style="font-size:16px;font-weight:600;margin-bottom:10px">${day(new Date(d))}</h2>
      ${xs.map(x => `<div style="display:flex;gap:14px;align-items:center;padding:8px 0;border-top:1px solid var(--line);flex-wrap:wrap"><b class="small" style="min-width:110px">${esc(x.t.time.replace(" IST", ""))}</b><span style="flex:1;min-width:180px"><b style="font-weight:600">${esc(x.topic)}</b><br><span class="tiny muted">${esc(x.t.title)} · ${esc(x.t.batch)} · Session ${x.i + 1}</span></span><button class="btn ghost sm" data-plan="${x.t.id}/${x.i}">Lesson plan</button></div>`).join("")}</section>`).join("") || `<div class="empty"><h3>No upcoming sessions</h3></div>`}</div>`;
  }

  /* ---------- Actions ---------- */
  function after(id) {
    if (id === "attendance" && $("#att-form")) {
      $("#att-session").addEventListener("change", e => { attSel = e.target.value; SR.panelRender(); });
      $("#att-all").addEventListener("click", () => document.querySelectorAll('#att-form input[value="p"]').forEach(r => r.checked = true));
      $("#att-form").addEventListener("submit", e => {
        e.preventDefault();
        const k = $("#att-session").value, m = marks(); m[k] = {};
        document.querySelectorAll("#att-form input[type=radio]:checked").forEach(r => m[k][r.name] = r.value);
        SR.store.set("attendanceMarks", m); attSel = k;
        const n = Object.values(m[k]).filter(v => v !== "a").length;
        SR.toast(`Attendance saved · ${n} of ${Object.keys(m[k]).length} present`); SR.panelRender();
      });
    }
    document.querySelectorAll("[data-answer]").forEach(f => f.addEventListener("submit", e => {
      e.preventDefault();
      const ta = f.querySelector("textarea"), v = ta.value.trim();
      if (!v) { SR.fieldError(ta, "Write an answer first."); return; }
      const [cid, qid] = f.dataset.answer.split("|"), all = SR.qaAll(), q = (all[cid] || []).find(x => x.id === qid);
      q.answers.push({ by: tr.name, role: "trainer", text: v, at: Date.now() }); SR.store.set("qa", all);
      SR.toast("Answer posted. The learner sees it under the lesson."); SR.panelRender();
    }));
  }

  document.addEventListener("click", e => {
    let b;
    if ((b = e.target.closest("[data-sub-filter]"))) { subFilter = b.dataset.subFilter; SR.panelRender(); }
    else if ((b = e.target.closest("[data-start]"))) {
      const tid = b.dataset.start, t = SR.training(tid), cur = SR.meetLink(tid);
      SR.modal(`<h2>${cur ? "Open the classroom" : "Start the live session"}</h2><p class="small muted">Paste the meeting link for <b>${esc(t.title)}</b>. Learners' Join buttons open this link from 15 minutes before each session. It's saved for the whole batch, so you only do this once.</p><form class="stack" novalidate>
        <div class="field"><label for="meet-link">Meeting link (Zoom, Google Meet or Teams)</label><input id="meet-link" type="url" inputmode="url" placeholder="https://meet.google.com/abc-defg-hij" value="${esc(cur)}"></div>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button>${cur ? `<button class="btn ghost" type="button" id="meet-clear">Remove link</button>` : ""}<button class="btn" type="submit">Save &amp; open classroom</button></div></form>`, (m) => {
        const inp = m.querySelector("#meet-link"), v = inp.value.trim();
        if (!/^https:\/\/[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v)) { SR.fieldError(inp, "Paste the full link, starting with https://"); return false; }
        const all = SR.store.get("meet", {}) || {}; all[tid] = v; SR.store.set("meet", all); window.open(v, "_blank", "noopener"); SR.panelRender(); SR.toast("Classroom opened. Learners can join now.");
      }, { wide: true });
      const clr = document.querySelector("#meet-clear"); if (clr) clr.addEventListener("click", () => { const all = SR.store.get("meet", {}) || {}; delete all[tid]; SR.store.set("meet", all); document.querySelector(".modal-back").remove(); SR.panelRender(); SR.toast("Meeting link removed"); });
    } else if ((b = e.target.closest("[data-plan]"))) {
      const [tid, si] = b.dataset.plan.split("/"), t = SR.training(tid), i = +si, topic = t.topicOf ? t.topicOf(i) : (t.topics || [])[i] || "Session " + (i + 1), D = SR.durationMin(t), key = `${tid}/${i}`;
      const prev = i > 0 ? (t.topicOf ? t.topicOf(i - 1) : (t.topics || [])[i - 1]) : null, nxt = t.topicOf ? t.topicOf(i + 1) : (t.topics || [])[i + 1];
      const parts = [[.1, prev ? "Recap & warm-up" : "Welcome & setup", prev ? `Quick quiz on "${prev}" and open doubts` : "Introductions, tools check, how the batch runs"], [.3, "Concept walkthrough", `Core ideas of ${topic} with examples`], [.2, "Live demo", "Build it on screen; learners follow along"], [.25, "Hands-on practice", "Learners work in pairs; you review two solutions"], [.15, "Q&A and wrap-up", nxt ? `Assignment brief and a preview of "${nxt}"` : "Assignment brief and next steps"]];
      let at = 0; const rows = parts.map(([f, h, d]) => { const m = Math.round(D * f / 5) * 5, r = [`${at}–${at + m} min`, h, d]; at += m; return r; });
      const goals = [`Explain the key ideas behind ${topic}`, `Complete a working exercise on ${topic} without help`, "Know what to practise before the next session"];
      const notes = (SR.store.get("plans", {}) || {})[key] || "";
      const m = SR.modal(`<h2>Lesson plan</h2><p class="small muted">Session ${i + 1} · <b>${esc(topic)}</b><br>${esc(t.title)} · ${esc(t.batch)} · ${D} minutes</p>
        <div><h3 class="small" style="font-weight:600;margin-bottom:6px">By the end, learners can</h3><ul class="small" style="display:grid;gap:4px;padding-left:18px">${goals.map(g => `<li>${esc(g)}</li>`).join("")}</ul></div>
        <div class="lp-ag">${rows.map(r => `<div><b>${r[0]}</b><span>${esc(r[1])}<span>${esc(r[2])}</span></span></div>`).join("")}</div>
        <form class="stack" novalidate><div class="field"><label for="plan-notes">Your notes for this session</label><textarea id="plan-notes" style="min-height:84px" placeholder="Examples to use, links to share, things to watch for…">${esc(notes)}</textarea></div>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Close</button><button class="btn ghost" type="button" id="plan-pdf">${icon("download")}Download PDF</button><button class="btn" type="submit">Save notes</button></div></form>`, (mm) => {
        const all = SR.store.get("plans", {}) || {}; all[key] = mm.querySelector("#plan-notes").value.trim(); SR.store.set("plans", all); SR.toast("Notes saved");
      }, { wide: true });
      m.el.querySelector("#plan-pdf").addEventListener("click", () => {
        const n = m.el.querySelector("#plan-notes").value.trim();
        SR.pdf(`lesson-plan-${tid}-session-${i + 1}.pdf`, [{ t: `Session ${i + 1}: ${topic}`, h: 1 }, { t: `${t.title} - ${t.batch} - ${D} minutes`, small: 1 }, { gap: 6 }, { rule: 1 }, { t: "By the end, learners can", h: 2 }, ...goals.map(g => ({ t: g, li: 1 })), { t: "Agenda", h: 2 }, ...rows.flatMap(r => [{ t: `${r[0]}   ${r[1]}`, b: 1 }, { t: r[2], small: 1 }, { gap: 4 }]), { t: "Trainer notes", h: 2 }, ...(n ? n.split(/\n+/).map(x => ({ t: x })) : [{ box: 150 }])], { tag: "Lesson plan", footer: "(c) SkillRadius - trainer copy" });
        SR.toast("Lesson plan downloaded");
      });
    } else if ((b = e.target.closest("[data-upload]"))) {
      SR.modal(`<h2>Upload recording</h2><p class="small muted">Learners can watch it from their dashboard once processing finishes.</p><form class="stack" novalidate>
        <div class="field"><label for="rec-file">Video file</label><input id="rec-file" type="file" accept="video/*"></div>
        <div class="field"><label for="rec-link">Or paste a link</label><input id="rec-link" placeholder="https://drive.google.com/…"></div>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Upload</button></div></form>`, (m) => {
        const f = m.querySelector("#rec-file").files[0], l = m.querySelector("#rec-link").value.trim();
        if (!f && !/^https?:\/\/\S+/.test(l)) { SR.fieldError(m.querySelector("#rec-link"), "Choose a file or paste a full link."); return false; }
        const r = recordings(); r[b.dataset.upload] = f ? f.name : "Linked video"; SR.store.set("recordings", r); SR.panelRender(); SR.toast("Recording uploaded");
      });
    } else if ((b = e.target.closest("[data-grade]"))) {
      const s = submissions().find(x => x.key === b.dataset.grade);
      SR.modal(`<h2>Grade submission</h2><p class="small muted">${esc(s.name)} · ${esc(s.title)}</p>
        <p class="small"><a href="${esc(s.link)}" target="_blank" rel="noopener">${icon("ext", 'style="width:15px;height:15px;vertical-align:-2px;margin-right:4px"')}Open ${esc(s.link.replace(/^https?:\/\//, ""))}</a></p>
        ${s.notes ? `<p class="small" style="background:var(--bg);border-radius:10px;padding:10px 12px"><b>Learner's note:</b> ${esc(s.notes)}</p>` : ""}
        <form class="stack" novalidate>
          <div class="field"><label for="g-score">Score (out of 10)</label><input id="g-score" type="number" min="0" max="10" value="${s.score != null ? s.score : ""}"></div>
          <div class="field"><label for="g-fb">Feedback</label><textarea id="g-fb" style="min-height:100px" placeholder="What worked, and one or two concrete things to improve">${esc(s.feedback || "")}</textarea></div>
          <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Save grade</button></div></form>`, (m) => {
        const sc = m.querySelector("#g-score").value, fb = m.querySelector("#g-fb").value.trim();
        const okS = sc !== "" && +sc >= 0 && +sc <= 10;
        SR.fieldError(m.querySelector("#g-score"), okS ? "" : "Enter a score from 0 to 10.");
        SR.fieldError(m.querySelector("#g-fb"), fb.length >= 10 ? "" : "Add a sentence or two of feedback.");
        if (!okS || fb.length < 10) return false;
        const grade = { score: +sc, max: 10, feedback: fb, reviewedBy: tr.name, reviewedAt: Date.now() };
        if (s.own) { const all = subsStore(), [, tid, idx] = s.key.split("/"); Object.assign(all[tid][+idx], grade); SR.store.set("submissions", all); }
        else { const g = sampleGrades(); g[s.key] = grade; SR.store.set("sampleGrades", g); }
        SR.panelRender(); SR.toast(s.own ? "Graded. The learner can see the feedback now." : "Grade saved");
      }, { wide: true });
    }
  });

  SR.panel({
    roleLabel: "Trainer", badge: "Trainer panel", badgeText: "Need help? Email trainers@skillradius.in",
    nav: () => [
      { section: "Teaching" }, { id: "overview", label: "Overview", icon: "home", short: "Home" }, { id: "batches", label: "My batches", icon: "training", short: "Batches" }, { id: "attendance", label: "Attendance", icon: "calcheck" },
      { id: "submissions", label: "Submissions", icon: "notes", count: pending().length, short: "Grade" }, { id: "qa", label: "Learner Q&A", icon: "help", count: openQs().length, short: "Q&A" },
      { section: "Plan" }, { id: "schedule", label: "Schedule", icon: "cal" }
    ],
    views: { overview: vOverview, batches: vBatches, attendance: vAttendance, submissions: vSubmissions, qa: vQA, schedule: vSchedule },
    after
  });
})();
