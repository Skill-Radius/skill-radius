/* =====================================================================
   Learner dashboard — dashboard.html#overview | #courses | #trainings
                                    | #certifications | #certificates
   Everything shown is derived from the learner's enrolments, lesson
   progress, exam attempts and certificates (see ui.js → SR.store).
===================================================================== */
(function () {
  if (!SR.auth.require()) return;
  SR.seedLearner(!SR.auth.isDemo());
  const { $, $$, esc, icon: ic, pct, initials } = SR;
  const user = SR.auth.user();
  const NOW = new Date();
  const DAY = 864e5;

  /* ---------- Date helpers ---------- */
  const fmtDate = (d, o = { day: "numeric", month: "short", year: "numeric" }) => new Date(d).toLocaleDateString("en-IN", o);
  const fmtTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  const dayLabel = (d) => { const t = new Date(NOW); if (sameDay(d, t)) return "Today"; t.setDate(t.getDate() + 1); if (sameDay(d, t)) return "Tomorrow"; return fmtDate(d, { weekday: "short", day: "numeric", month: "short" }); };
  const rel = (d) => { const m = Math.round((NOW - d) / 60000); if (m < 0) return "soon"; if (m < 60) return m <= 1 ? "just now" : `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; const dd = Math.round(h / 24); return dd === 1 ? "yesterday" : `${dd} days ago`; };

  /* =====================================================================
     Model
  ===================================================================== */
  const E = SR.enrolled();
  const certsStore = SR.store.get("certificates", []) || [];
  const activity = SR.store.get("activity", { days: [0, 0, 0, 0, 0, 0, 0], prev: 0, streak: 0, goal: 5 });

  const courses = E.courses.map(SR.course).filter(Boolean).map(c => {
    const p = SR.progressOf(c.id), lessons = SR.lessons(c);
    const next = lessons.find(l => l.key === p.last && !p.done.includes(l.key)) || lessons.find(l => !p.done.includes(l.key));
    const cert = certsStore.find(x => x.ref === c.id);
    return {
      id: c.id, title: c.title, category: c.cat, thumbnail: c.img, description: c.subtitle,
      status: p.complete ? "completed" : "ongoing", done: p.doneCount, total: p.total, pct: p.pct,
      next: next ? `Module ${next.mi + 1} · ${next.title}` : "", nextKey: next ? next.key : "0-0",
      lastOpened: new Date(p.at || NOW), hoursLeft: Math.max(0.5, Math.round(c.hours * (1 - p.pct / 100) * 2) / 2),
      completedOn: p.completedOn ? new Date(p.completedOn) : null, certificate: cert ? cert.id : p.review ? "in_review" : null
    };
  });
  const ongoing = courses.filter(c => c.status === "ongoing").sort((a, b) => b.lastOpened - a.lastOpened);
  const completed = courses.filter(c => c.status === "completed");

  const trainings = E.trainings.map(SR.training).filter(Boolean).map(t => {
    const sessions = SR.sessionsOf(t), dur = SR.durationMin(t);
    const held = sessions.filter(s => s.getTime() + dur * 60000 < NOW);
    const nextIdx = sessions.findIndex(s => s.getTime() + dur * 60000 >= NOW);
    const topicOf = (i) => (t.topics && t.topics[i]) || (t.syllabus[i] ? t.syllabus[i][1] : "Session " + (i + 1));
    const tr = SR.trainer(t.trainer);
    return {
      id: t.id, title: t.title, batch: t.batch, mode: t.mode, schedule: `${t.days} · ${t.time}`, total: sessions.length, durationMin: dur,
      trainer: tr, attendance: held.map((_, i) => i === 4 ? "a" : "p"), sessions, topicOf,
      next: nextIdx >= 0 ? { start: sessions[nextIdx], topic: `${t.weeks ? "Session " + (nextIdx + 1) : "Day " + (nextIdx + 1)} · ${topicOf(nextIdx)}`, index: nextIdx } : null,
      assignment: t.assignment && held.length ? { title: t.assignment.title, due: new Date(new Date(NOW).setHours(23, 59, 0, 0) + t.assignment.dueInDays * DAY) } : null,
      status: !held.length ? "upcoming" : nextIdx < 0 ? "completed" : "ongoing", summary: t.summary, venue: t.mode === "in-person" ? t.batch : null
    };
  });
  const activeTrainings = trainings.filter(t => t.status === "ongoing");
  const attendedAll = trainings.flatMap(t => t.attendance);
  const attendancePct = attendedAll.length ? pct(attendedAll.filter(a => a === "p").length, attendedAll.length) : null;
  const recordings = trainings.flatMap(t => t.sessions.map((s, i) => ({ t, s, i })).filter(x => x.s.getTime() + t.durationMin * 60000 < NOW && x.t.attendance[x.i])
    .map(x => ({ training: t.title, title: `Session ${x.i + 1} · ${t.topicOf(x.i)}`, date: x.s, duration: `${Math.floor((t.durationMin - 6 + (x.i % 4) * 3) / 60)}h ${String((t.durationMin - 6 + (x.i % 4) * 3) % 60).padStart(2, "0")}m`, watched: x.i % 3 !== 2 || !!(SR.store.get("watched", {}) || {})[`${t.id}/${x.i}`], key: `${t.id}/${x.i}`, img: t.img, mins: t.durationMin - 6 + (x.i % 4) * 3, by: t.trainer.name })))
    .sort((a, b) => b.date - a.date).slice(0, 5);

  const certProg = SR.store.get("certprog", {}) || {};
  const attemptsAll = SR.store.get("attempts", {}) || {};
  const certifications = E.certs.map(SR.cert).filter(Boolean).map(c => {
    const attempts = attemptsAll[c.id] || [];
    const passed = attempts.some(a => SR.examPassed(c, a));
    return { ...c, modulesDone: Math.min(certProg[c.id] || 0, c.modules.length), attempts, passed, status: passed ? "passed" : "in_progress" };
  });
  const certsInProgress = certifications.filter(c => !c.passed);
  const certificates = [...certsStore].sort((a, b) => b.issued - a.issued);

  const weekHrs = activity.days.reduce((a, b) => a + b, 0);
  const allNext = trainings.filter(t => t.next).map(t => ({ ...t.next, t })).sort((a, b) => a.start - b.start);
  const nextLive = allNext[0];
  const nothingYet = !courses.length && !trainings.length && !certifications.length;

  const achievements = [
    { name: `${Math.max(activity.streak, 7)}-day streak`, detail: activity.streak >= 7 ? `Learned ${activity.streak} days in a row` : "Learn 7 days in a row", icon: "flame", color: "#e59a1a", earned: activity.streak >= 7, progress: `${activity.streak}/7` },
    { name: "First certification", detail: "Passed a proctored exam", icon: "award", color: "#3461ff", earned: certifications.some(c => c.passed), progress: "Pass an exam" },
    { name: "Perfect attendance", detail: "Attended 10 live sessions", icon: "calcheck", color: "#7a4fe0", earned: attendedAll.filter(a => a === "p").length >= 10, progress: `${Math.min(10, attendedAll.filter(a => a === "p").length)}/10` },
    { name: "Course finisher", detail: "Completed a full course", icon: "bolt", color: "#3fb877", earned: completed.length > 0, progress: "Finish a course" },
    { name: "Quiz master", detail: "Score 90%+ on 5 quizzes", icon: "target", color: "#e2445c", earned: false, progress: "3/5" },
    { name: "Mentor's pick", detail: "Capstone featured by a trainer", icon: "star", color: "#1e3fbf", earned: false, progress: "Locked" }
  ];
  const takenCats = new Set(courses.map(c => c.category));
  const recommended = SR.courses.filter(c => !E.courses.includes(c.id)).sort((a, b) => (takenCats.has(b.cat) - takenCats.has(a.cat)) || (b.learners - a.learners)).slice(0, 3)
    .map(c => ({ ...c, href: "course.html#" + c.id, meta: `${c.hours} h · ${SR.inr(c.price)}`, why: takenCats.has(c.cat) ? `Because you're learning ${c.cat}` : "Popular with learners like you" }));
  // Top up with certifications the learner hasn't started, so the row is always full
  SR.certifications.filter(c => !E.certs.includes(c.id)).slice(0, Math.max(0, 3 - recommended.length))
    .forEach(c => recommended.push({ ...c, reviews: c.enrolled, href: "certification.html#" + c.id, meta: `${c.validity}-yr cert · ${SR.inr(c.price)}`, why: "Turn your skills into a credential" }));

  const read = new Set(SR.store.get("notifRead", []) || []);
  const notifications = [
    nextLive && (nextLive.start - NOW) < 3 * DAY && { id: "live-" + nextLive.t.id + nextLive.index, icon: "live", color: "#e2445c", text: `${nextLive.t.title}: ${nextLive.topic} starts ${dayLabel(nextLive.start).toLowerCase()} at ${fmtTime(nextLive.start)}.`, when: new Date(NOW - 5 * 60000), href: "#trainings" },
    certificates[0] && { id: "cert-" + certificates[0].id, icon: "award", color: "#3461ff", text: `Your certificate ${certificates[0].id} has been issued.`, when: new Date(certificates[0].issued), href: "certificate.html#" + certificates[0].id },
    ...trainings.filter(t => t.assignment).map(t => ({ id: "asg-" + t.id, icon: "notes", color: "#e59a1a", text: `Assignment “${t.assignment.title}” is due ${dayLabel(t.assignment.due).toLowerCase()}.`, when: new Date(NOW - DAY), href: "#trainings" })),
    activeTrainings[0] && { id: "rev-" + activeTrainings[0].id, icon: "check", color: "#3fb877", text: `${activeTrainings[0].trainer.name} reviewed your last exercise: 9/10.`, when: new Date(NOW - 2 * DAY), href: "#trainings" },
    !courses.length && { id: "welcome", icon: "compass", color: "#3c59c8", text: "Welcome to SkillRadius! Pick your first course to get started.", when: NOW, href: "courses.html" }
  ].filter(Boolean);

  /* =====================================================================
     Shell: sidebar, tab bar, user menu, notifications, search
  ===================================================================== */
  $("#side-brand").innerHTML = SR.logo(28) + "<span>SkillRadius</span>";
  $("#m-brand").innerHTML = SR.logo(28) + "<span>SkillRadius</span>";
  $("#m-search").innerHTML = ic("search");
  $("#notif-icon").innerHTML = ic("bell");
  const NAV = [
    { id: "overview", label: "Dashboard", icon: "home" },
    { id: "courses", label: "My Courses", icon: "book", count: ongoing.length },
    { id: "trainings", label: "Trainings", icon: "training", count: trainings.length },
    { id: "certifications", label: "Certifications", icon: "cert", count: certifications.length },
    { id: "certificates", label: "Certificates", icon: "file", count: certificates.length },
    { id: "orders", label: "Orders", icon: "card" },
    { id: "wishlist", label: "Wishlist", icon: "heart", count: SR.wishlist().length }
  ];
  $("#side-nav").innerHTML = `<span class="side-label">Learning</span>` + NAV.map(n =>
    `<a href="#${n.id}" data-nav="${n.id}" title="${n.label}">${ic(n.icon)}${n.label}${n.count ? `<span class="count">${n.count}</span>` : ""}</a>`).join("") +
    `<span class="side-label">Explore</span>
     <a class="ext" href="courses.html" title="Browse courses">${ic("compass")}Browse courses</a>
     <a class="ext" href="trainings.html" title="Live batches">${ic("video")}Live batches</a>
     <a class="ext" href="paths.html" title="Learning paths">${ic("trend")}Learning paths</a>
     <a class="ext" href="events.html" title="Free events">${ic("live")}Free events</a>
     <a class="ext" href="refer.html" title="Refer & earn">${ic("heart")}Refer &amp; earn</a>
     <span class="side-label">Account</span>
     <a class="ext" href="profile.html" title="Profile">${ic("user")}Profile</a>
     <a class="ext" href="support.html" title="Help & support">${ic("help")}Help & support</a>`;
  $("#tabbar").innerHTML = NAV.slice(0, 5).map(n => `<a href="#${n.id}" data-nav="${n.id}">${ic(n.icon)}<span>${n.id === "overview" ? "Home" : n.label.replace("My ", "")}</span></a>`).join("");

  $("#first-name").textContent = user.firstName;
  $("#avatar").src = SR.avatarURL(user);
  $("#user-menu").innerHTML = `
    <div class="who"><b>${esc(user.firstName + " " + (user.lastName || ""))}</b><span>${esc(user.email)}</span></div>
    <a href="profile.html">${ic("user")}Profile</a>
    <a href="#certificates">${ic("file")}My certificates</a>
    <a href="index.html">${ic("home")}SkillRadius home</a>
    <a href="#" class="logout" data-logout>${ic("logout")}Logout</a>`;

  function renderNotifs() {
    const unread = notifications.filter(n => !read.has(n.id)).length;
    $("#notif-dot").hidden = !unread;
    $("#notif-btn").setAttribute("aria-label", `Notifications${unread ? `, ${unread} unread` : ""}`);
    $("#notif-pop").innerHTML = `
      <header><h3>Notifications</h3>${unread ? `<button class="link-btn" id="mark-read">Mark all read</button>` : ""}</header>
      ${notifications.length ? `<ul>${notifications.map(n => `
        <li class="${read.has(n.id) ? "" : "unread"}">
          <span class="ic" style="background:${n.color}1f;color:${n.color}">${ic(n.icon)}</span>
          <a href="${n.href}" style="text-decoration:none"><p>${esc(n.text)}</p><time>${rel(n.when)}</time></a>
        </li>`).join("")}</ul>` : `<p class="muted small" style="padding:10px">You're all caught up.</p>`}`;
  }
  renderNotifs();

  function closePops() {
    [["#notif-btn", "#notif-pop"], ["#user-btn", "#user-menu"]].forEach(([b, p]) => { $(p).hidden = true; $(b).setAttribute("aria-expanded", "false"); });
    $("#search-results").hidden = true;
  }
  function togglePop(btn, pop) { const open = pop.hidden; closePops(); pop.hidden = !open; btn.setAttribute("aria-expanded", String(open)); }
  $("#notif-btn").addEventListener("click", e => { e.stopPropagation(); togglePop($("#notif-btn"), $("#notif-pop")); });
  $("#user-btn").addEventListener("click", e => { e.stopPropagation(); togglePop($("#user-btn"), $("#user-menu")); });
  document.addEventListener("click", e => {
    if (e.target.id === "mark-read") { notifications.forEach(n => read.add(n.id)); SR.store.set("notifRead", [...read]); renderNotifs(); e.stopPropagation(); return; }
    if (e.target.closest("#notif-pop a")) { const li = e.target.closest("li"); const n = notifications[[...li.parentNode.children].indexOf(li)]; read.add(n.id); SR.store.set("notifRead", [...read]); renderNotifs(); closePops(); return; }
    if (!e.target.closest(".pop") && !e.target.closest(".search")) { closePops(); if (!e.target.closest("#m-search")) $("#search-wrap").classList.remove("open"); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closePops(); $("#search-wrap").classList.remove("open"); } });

  const INDEX = [
    ...courses.map(c => ({ title: c.title, kind: c.status === "ongoing" ? "My course · in progress" : "My course · completed", href: c.status === "ongoing" ? "learn.html#" + c.id : "#courses", icon: "book" })),
    ...trainings.map(t => ({ title: t.title, kind: "My training", href: "training.html#" + t.id, icon: "training" })),
    ...certifications.map(c => ({ title: c.title, kind: "My certification", href: "certification.html#" + c.id, icon: "cert" })),
    ...certificates.map(c => ({ title: c.title + " · " + c.id, kind: "Certificate", href: "certificate.html#" + c.id, icon: "file" })),
    ...SR.courses.filter(c => !E.courses.includes(c.id)).map(c => ({ title: c.title, kind: "Catalog course", href: "course.html#" + c.id, icon: "compass" }))
  ];
  $("#search").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase(), box = $("#search-results");
    if (!q) { box.hidden = true; return; }
    const hits = INDEX.filter(x => (x.title + " " + x.kind).toLowerCase().includes(q)).slice(0, 8);
    box.innerHTML = (hits.length ? hits.map(h => `<a href="${h.href}">${ic(h.icon, 'width="17" height="17" style="color:var(--ink-3)"')}<span>${esc(h.title)}</span><span class="kind">${h.kind}</span></a>`).join("")
      : `<div class="muted small" style="padding:10px">Nothing in your learning matches “${esc(e.target.value)}”.</div>`) + `<a href="courses.html#q=${encodeURIComponent(e.target.value.trim())}" style="border-top:1px solid var(--line);margin-top:4px">${ic("search", 'width="17" height="17" style="color:var(--ink-3)"')}<span>Search the full catalog</span></a>`;
    box.hidden = false;
  });
  $("#search-results").addEventListener("click", () => { $("#search").value = ""; closePops(); $("#search-wrap").classList.remove("open"); });
  $("#m-search").addEventListener("click", e => { e.stopPropagation(); $("#search-wrap").classList.add("open"); $("#search").focus(); });

  /* =====================================================================
     Small shared pieces
  ===================================================================== */
  const kpi = (href, icon, bg, fg, n, label, sub) => `<a class="kpi" href="${href}"><span class="ic" style="background:${bg};color:${fg}">${ic(icon)}</span><b>${n}</b><span class="l">${label}</span><span class="sub">${sub}</span></a>`;
  const trainingArt = (color) => `<svg class="thumb" viewBox="0 0 160 90" aria-hidden="true" style="background:${color}">
    <circle cx="130" cy="10" r="46" fill="#fff" opacity=".14"/><rect x="18" y="20" width="70" height="44" rx="6" fill="#fff" opacity=".9"/>
    <circle cx="53" cy="37" r="7" fill="${color}"/><path d="M41 56a12 12 0 0 1 24 0" fill="${color}"/>
    <rect x="96" y="24" width="44" height="6" rx="3" fill="#fff" opacity=".7"/><rect x="96" y="36" width="32" height="6" rx="3" fill="#fff" opacity=".5"/><circle cx="104" cy="58" r="5" fill="#ff5b73"/></svg>`;
  const emptyCTA = (icon, title, text, href, cta) => `<div class="empty-cta">${ic(icon)}<h3>${title}</h3><p class="muted small">${text}</p><a class="btn sm" href="${href}">${cta}</a></div>`;
  const joinWindow = (n) => n && (n.start - NOW) <= 15 * 60000;   // join opens 15 minutes before

  function activityChart() {
    const W = 360, H = 170, pl = 28, pr = 6, pt = 10, pb = 24, days = activity.days;
    const maxV = Math.max(3, Math.ceil(Math.max(...days)));
    const y = v => pt + (H - pt - pb) * (1 - v / maxV);
    const n = days.length, slot = (W - pl - pr) / n, bw = Math.min(30, slot * 0.56), target = activity.goal / 7;
    let s = "";
    for (let t = 0; t <= maxV; t++) s += `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" stroke="#e9ebf2" stroke-width="1"/><text x="${pl - 8}" y="${y(t) + 4}" text-anchor="end">${t}h</text>`;
    days.forEach((v, i) => {
      const d = new Date(NOW); d.setDate(d.getDate() - (n - 1 - i));
      const x = pl + slot * i + (slot - bw) / 2, h = Math.max(v ? 3 : 0, y(0) - y(v));
      s += `<rect class="bar-rect ${i === n - 1 ? "today" : ""}" x="${x.toFixed(1)}" y="${(y(0) - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="5"><title>${fmtDate(d, { weekday: "short", day: "numeric", month: "short" })}: ${v} h</title></rect>`;
      if (v && (i === n - 1 || v === Math.max(...days))) s += `<text x="${(x + bw / 2).toFixed(1)}" y="${(y(v) - 6).toFixed(1)}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${v}h</text>`;
      s += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" ${i === n - 1 ? 'style="fill:var(--ink);font-weight:600"' : ""}>${i === n - 1 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" })}</text>`;
    });
    s += `<line x1="${pl}" x2="${W - pr}" y1="${y(target).toFixed(1)}" y2="${y(target).toFixed(1)}" stroke="#e59a1a" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Hours learned per day over the last 7 days">${s}</svg>`;
  }

  function certTrack(c) {
    const last = c.attempts[c.attempts.length - 1], ready = c.modulesDone >= c.modules.length;
    const lp = DATA_latestPass();
    return `<div class="track">
      <div class="track-top"><div><span class="code">${esc(c.level)} · ${esc(c.code)}</span><h3>${esc(c.title)}</h3></div>${c.passed ? `<span class="pill green">${ic("check")}Passed</span>` : `<span class="pill amber">In progress</span>`}</div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px" class="muted"><span>${ready ? "All modules complete" : `Module ${c.modulesDone + 1} of ${c.modules.length}: <b style="color:var(--ink)">${esc(c.modules[c.modulesDone])}</b>`}</span><span class="num">${pct(c.modulesDone, c.modules.length)}%</span></div>
        <div class="steps" style="--n:${c.modules.length}">${c.modules.map((m, i) => `<span class="${i < c.modulesDone ? "done" : i === c.modulesDone ? "cur" : ""}" title="${esc(m)}"></span>`).join("")}</div>
      </div>
      <div class="track-stats">
        <div><b>${c.modulesDone}/${c.modules.length}</b><span>Modules done</span></div>
        <div><b>${c.attempts.length}</b><span>Exam attempts</span></div>
        <div><b>${c.exam.questions} Q · ${c.exam.minutes}m</b><span>Proctored exam</span></div>
        <div><b>${SR.passMark(c)}</b><span>Pass mark</span></div>
      </div>
      ${lp && lp.c.id !== c.id ? lp.html : ""}
      <div class="track-foot">
        ${c.passed ? `<p>${ic("award")}Passed with ${pct(last.score, last.total)}% on attempt ${c.attempts.length}.</p><a class="btn sm" href="certificate.html#${(certificates.find(x => x.ref === c.id) || {}).id || ""}">View certificate</a>`
          : ready ? `<p>${ic("check")}All modules complete. You can take the exam now.</p><a class="btn sm" href="exam-rules.html#${c.id}">Start exam</a>`
          : `<p>${ic("lock")}Exam unlocks after all ${c.modules.length} modules.</p><a class="btn sm" href="certification.html#${c.id}">Continue module</a>`}
      </div>
    </div>`;
  }
  function DATA_latestPass() {
    const c = certifications.find(x => x.passed); if (!c) return null;
    const a = [...c.attempts].reverse().find(x => SR.examPassed(c, x)), p = SR.examScore(c, a);
    return { c, html: `<div class="last-result"><div class="big">${p}<small>Passed</small></div><div style="min-width:0"><b style="font-weight:600">Latest exam · ${esc(c.title)}</b>
      <div class="small muted">${a.score}/${a.total} correct · ${a.time} taken · ${fmtDate(a.date, { day: "numeric", month: "short" })}</div>
      ${a.answers ? `<div class="qdots" aria-label="Per-question breakdown">${a.answers.map((x, i) => `<i class="${x ? "" : "x"}" title="Q${i + 1}: ${x ? "correct" : "wrong"}"></i>`).join("")}</div>` : ""}</div></div>` };
  }

  /* =====================================================================
     Views
  ===================================================================== */
  function viewOverview() {
    const goalPct = Math.min(100, pct(weekHrs, activity.goal));
    const diff = weekHrs - activity.prev;
    const R = 46, C = 2 * Math.PI * R;
    const hour = NOW.getHours(), greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const cert = certsInProgress[0] || certifications[0];

    const resume = [
      ...ongoing.map(r => ({ kind: "Course", title: r.title, thumb: r.thumbnail, next: r.next, done: r.done, total: r.total, unit: "lessons", t: r.lastOpened, href: `learn.html#${r.id}/${r.nextKey}`, cta: "Resume" })),
      ...activeTrainings.map(t => ({ kind: "Training", title: t.title, color: t.trainer.color, next: t.next ? t.next.topic : "All sessions done", done: t.attendance.length, total: t.total, unit: "sessions", t: new Date(NOW - DAY / 2), href: "training.html#" + t.id, cta: "Open" }))
    ].sort((a, b) => b.t - a.t).slice(0, 4);

    const ev = [];
    trainings.forEach(t => t.sessions.forEach((s, i) => { if (s > NOW && s - NOW < 10 * DAY) ev.push({ d: s, title: `${t.mode === "in-person" ? "Day" : "Session"} ${i + 1} · ${t.topicOf(i)}`, sub: t.title, color: "var(--training)", type: t.mode === "in-person" ? "In-person" : "Live" }); }));
    trainings.forEach(t => t.assignment && ev.push({ d: t.assignment.due, title: t.assignment.title, sub: "Assignment due · " + t.title, color: "var(--warn)", type: "Due" }));
    ev.sort((a, b) => a.d - b.d);
    const days = []; ev.slice(0, 7).forEach(e => { const k = e.d.toDateString(); let g = days.find(x => x.k === k); if (!g) days.push(g = { k, d: e.d, items: [] }); g.items.push(e); });
    const typePill = { Live: "livepill", "In-person": "violet", Due: "amber" };

    const welcome = nothingYet
      ? `<p>Welcome aboard! Pick a course, join a live batch or start a certification. Your progress, schedule and certificates will all show up here.</p>
         <div class="chips"><a class="chip" href="courses.html" style="text-decoration:none;color:#fff">${ic("book")}Browse courses</a><a class="chip" href="trainings.html" style="text-decoration:none;color:#fff">${ic("video")}Live batches</a><a class="chip" href="certifications.html" style="text-decoration:none;color:#fff">${ic("cert")}Certifications</a></div>`
      : `<p>${goalPct >= 100 ? "You've hit this week's learning goal. Nice work." : `You're ${(activity.goal - weekHrs).toFixed(1)} hours away from this week's goal.`}${nextLive ? ` Your next live session is ${dayLabel(nextLive.start).toLowerCase()} at ${fmtTime(nextLive.start)}.` : ""}</p>
         <div class="chips">
           <span class="chip">${ic("flame")}${activity.streak}-day streak</span>
           <span class="chip">${ic("clock")}${weekHrs.toFixed(1)} h this week</span>
           ${attendancePct != null ? `<span class="chip">${ic("calcheck")}${attendancePct}% attendance</span>` : ""}
         </div>`;

    const live = nextLive ? `
      <section class="card next-live s4" aria-label="Next live session">
        <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="pill livepill">Next live session</span><span class="pill violet">${esc(nextLive.t.batch)}</span></div>
        <h3>${esc(nextLive.topic)}</h3>
        <div class="meta">
          <div>${ic("training")}${esc(nextLive.t.title)}</div>
          <div>${ic("clock")}${dayLabel(nextLive.start)}, ${fmtTime(nextLive.start)} · ${nextLive.t.durationMin} min</div>
          <div>${ic("user")}with ${esc(nextLive.t.trainer.name)}</div>
        </div>
        <div class="countdown" id="countdown" data-start="${nextLive.start.getTime()}"></div>
        <div class="actions">
          ${nextLive.t.mode === "in-person" ? `<a class="btn" href="training.html#${nextLive.t.id}">${ic("pin")}Venue details</a>` : `<button class="btn ${joinWindow(nextLive) ? "live" : ""}" id="join-btn" ${joinWindow(nextLive) ? `data-join="${nextLive.t.id}"` : `disabled title="The join button opens 15 minutes before the session"`}>${ic("video")}${joinWindow(nextLive) ? "Join session" : "Join opens 15 min before"}</button>`}
          <button class="btn ghost" data-ics-training="${nextLive.t.id}">${ic("cal")}Add to calendar</button>
        </div>
      </section>` : `
      <section class="card s4">${emptyCTA("video", "No live sessions scheduled", "Join a trainer-led batch to learn live with a small group.", "trainings.html", "Find a batch")}</section>`;

    return `
    <div class="grid12">
      <section class="card welcome s8">
        <svg class="deco" viewBox="0 0 200 145" preserveAspectRatio="xMaxYMid meet" aria-hidden="true"><path d="M200 0H110a90 90 0 0 0 90 90z" fill="url(#g-a)"/><circle cx="80" cy="95" r="68" fill="url(#g-c)" opacity=".6"/><path d="M60 70l60 75H60z" fill="url(#g-b)"/><rect x="140" y="60" width="60" height="85" fill="url(#g-b)" opacity=".8"/></svg>
        <div><h1>${greet}, ${esc(user.firstName)}</h1>${welcome}</div>
        <div class="goal">
          <svg viewBox="0 0 110 110" role="img" aria-label="Weekly goal ${goalPct}% complete">
            <circle cx="55" cy="55" r="${R}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="10"/>
            <circle cx="55" cy="55" r="${R}" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(C * goalPct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 55 55)"/>
            <text x="55" y="53" text-anchor="middle" class="goal-ring-text" font-size="22" font-weight="600">${goalPct}%</text>
            <text x="55" y="71" text-anchor="middle" class="goal-ring-text" font-size="11" opacity=".85">${weekHrs.toFixed(1)}/${activity.goal} h</text>
          </svg>
          <span class="lbl">Weekly goal</span>
        </div>
      </section>
      ${live}

      <section class="kpis s12" aria-label="Summary">
        ${kpi("#courses", "book", "var(--primary-soft)", "var(--primary)", ongoing.length, "Courses in progress", `<em>${completed.length}</em> completed so far`)}
        ${kpi("#trainings", "training", "var(--training-soft)", "var(--training)", trainings.length, "Training batches", attendancePct != null ? `<em>${attendancePct}%</em> attendance across batches` : "Join a live batch")}
        ${kpi("#certifications", "cert", "var(--warn-soft)", "var(--warn)", certsInProgress.length, "Certifications in progress", `<em>${certifications.filter(c => c.passed).length}</em> passed`)}
        ${kpi("#certificates", "file", "var(--success-soft)", "var(--success-ink)", certificates.length, "Certificates earned", certificates.length ? `Latest ${fmtDate(certificates[0].issued, { day: "numeric", month: "short" })}` : "Finish a course to earn one")}
      </section>

      <section class="card s7 full-md">
        <div class="card-head"><h2>Continue learning</h2><a href="#courses">View all</a></div>
        ${resume.length ? `<div class="resume-list">${resume.map(r => `
          <div class="resume">
            <div class="t">${r.thumb ? `<img class="thumb" src="${esc(r.thumb)}" alt="">` : trainingArt(r.color)}<span class="pill ${r.kind === "Course" ? "blue" : "violet"}">${r.kind}</span></div>
            <div style="min-width:0">
              <h3>${esc(r.title)}</h3>
              <div class="next">${ic(r.kind === "Course" ? "play" : "cal")}<span>Next: ${esc(r.next)}</span></div>
              <div class="prog"><div class="bar ${r.kind === "Training" ? "violet" : ""}"><span style="width:${pct(r.done, r.total)}%"></span></div><span><b>${pct(r.done, r.total)}%</b> · ${r.done}/${r.total} ${r.unit}</span></div>
            </div>
            <a class="btn sm" href="${r.href}">${r.cta}</a>
          </div>`).join("")}</div>` : emptyCTA("book", "Nothing in progress yet", "Start a course and your next lesson will always be one click away.", "courses.html", "Browse courses")}
      </section>

      <section class="card s5 activity">
        <div class="card-head"><h2>Learning activity</h2><span class="muted small">Last 7 days</span></div>
        <div class="totals">
          <div><b>${weekHrs.toFixed(1)} h</b><span>Time spent</span></div>
          <div><b style="color:${diff >= 0 ? "var(--success-ink)" : "var(--danger)"}">${diff >= 0 ? "+" : ""}${diff.toFixed(1)} h</b><span>vs previous week</span></div>
          <div><b>${activity.days.filter(h => h > 0).length}/7</b><span>Active days</span></div>
        </div>
        ${activityChart()}
        <div class="legend-row"><span><i style="background:var(--chart-2)"></i>Hours learned</span><span><i style="background:var(--chart-3)"></i>Today</span><span><i style="background:none;border-top:2px dashed var(--warn);height:0;border-radius:0"></i>Daily target (${(activity.goal / 7).toFixed(1)} h)</span></div>
      </section>

      <section class="card s5">
        <div class="card-head"><h2>Upcoming</h2><span class="muted small">Next 10 days</span></div>
        ${days.length ? `<div class="agenda">${days.map(g => `
          <div class="agenda-day"><h4>${dayLabel(g.d)}</h4><ul>${g.items.map(e => `
            <li class="agenda-item"><time>${fmtTime(e.d)}</time><span class="stripe" style="background:${e.color}"></span>
              <div style="min-width:0"><b>${esc(e.title)}</b><span class="sub">${esc(e.sub)}</span></div>
              <span class="pill ${typePill[e.type]}">${e.type}</span></li>`).join("")}</ul></div>`).join("")}</div>`
        : emptyCTA("cal", "Your schedule is clear", "Live sessions and deadlines will appear here.", "trainings.html", "See live batches")}
      </section>

      <section class="card s7">
        <div class="card-head"><h2>Certification track</h2>${cert ? `<a href="certification.html#${cert.id}">Details</a>` : ""}</div>
        ${cert ? certTrack(cert) : emptyCTA("cert", "Prove your skills", "Earn an industry-recognised certificate through a proctored exam.", "certifications.html", "Explore certifications")}
      </section>

      <section class="card s5">
        <div class="card-head"><h2>Achievements</h2><span class="muted small">${achievements.filter(a => a.earned).length} of ${achievements.length} earned</span></div>
        <div class="badges">${achievements.map(a => `
          <div class="badge ${a.earned ? "" : "locked"}" title="${esc(a.detail)}">
            <div class="medal" style="background:${a.color}">${ic(a.icon)}</div>
            <b>${esc(a.name)}</b><span>${a.earned ? esc(a.detail) : `${ic("lock", 'width="11" height="11" style="vertical-align:-1px"')} ${esc(a.progress)}`}</span>
          </div>`).join("")}</div>
      </section>

      <section class="card s7 full-md">
        <div class="card-head"><h2>Recommended for you</h2><a href="courses.html">Browse catalogue</a></div>
        <div class="recos">${recommended.map(r => `
          <article class="reco">
            <img class="thumb" src="${esc(r.img)}" alt="">
            <span class="why">${esc(r.why)}</span>
            <h3>${esc(r.title)}</h3>
            <div class="row"><span><span class="stars">★</span> <b>${r.rating}</b> (${(r.reviews / 1000).toFixed(1)}k)</span><span>${r.meta}</span></div>
            <a class="btn ghost sm" href="${r.href}">View details</a>
          </article>`).join("")}</div>
      </section>
    </div>`;
  }

  let courseTab = "ongoing", courseCat = "All";
  function viewCourses() {
    const cats = ["All", ...new Set(courses.map(c => c.category))];
    const list = courses.filter(c => c.status === courseTab && (courseCat === "All" || c.category === courseCat));
    return `
    <div class="view-head"><div><h1>My Courses</h1><p>${ongoing.length} in progress · ${completed.length} completed</p></div>
      <a class="btn ghost" href="courses.html">${ic("compass")}Browse courses</a></div>
    <div class="toolbar">
      <div class="seg" role="tablist" aria-label="Course status">
        <button role="tab" data-ctab="ongoing" aria-selected="${courseTab === "ongoing"}">${ic("play", 'width="17" height="17"')}Ongoing <span class="c">${ongoing.length}</span></button>
        <button role="tab" data-ctab="completed" aria-selected="${courseTab === "completed"}">${ic("check", 'width="17" height="17"')}Completed <span class="c">${completed.length}</span></button>
      </div>
      ${cats.length > 2 ? `<label class="small muted">Category <select id="cat">${cats.map(c => `<option ${c === courseCat ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></label>` : ""}
    </div>
    ${list.length ? `<div class="course-grid">${list.map(c => courseTab === "ongoing" ? `
      <article class="ccard"><img src="${esc(c.thumbnail)}" alt="">
        <div class="b"><span class="pill blue" style="align-self:flex-start">${esc(c.category)}</span><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p>
          <div class="small muted" style="display:flex;gap:6px;align-items:center">${ic("play", 'width="14" height="14"')}<span>${esc(c.next)}</span></div>
          <div class="bar"><span style="width:${c.pct}%"></span></div>
          <div class="meta"><span><b style="color:var(--ink)">${c.pct}%</b> · ${c.done}/${c.total} lessons</span><span>~${c.hoursLeft} h left</span></div>
          <div class="foot"><span class="small muted">Opened ${rel(c.lastOpened)}</span><a class="btn sm" href="learn.html#${c.id}/${c.nextKey}">Continue</a></div>
        </div></article>` : `
      <article class="ccard"><img src="${esc(c.thumbnail)}" alt="">
        <div class="b"><span class="pill green" style="align-self:flex-start">${ic("check")}Completed</span><h3>${esc(c.title)}</h3><p>${esc(c.description)}</p>
          <div class="meta"><span>Course Completed on ${c.completedOn ? fmtDate(c.completedOn) : "–"}</span></div>
          <div class="foot">${c.certificate && c.certificate !== "in_review" ? `<a class="btn sm" href="certificate.html#${c.certificate}">${ic("download")}Certificate</a>` : `<span class="pill amber">Assignments in review</span>`}
            <a class="btn ghost sm" href="learn.html#${c.id}">Revisit</a></div>
        </div></article>`).join("")}</div>`
      : `<div class="empty">${courses.length ? `No ${courseTab} courses${courseCat !== "All" ? " in " + esc(courseCat) : ""} yet.` : emptyCTA("book", "You haven't enrolled in a course yet", "Self-paced courses with video lessons, notes and quizzes.", "courses.html", "Browse courses")}</div>`}`;
  }

  function viewTrainings() {
    const upcoming = trainings.flatMap(t => t.sessions.map((s, i) => ({ s, i, t })).filter(x => x.s > NOW)).sort((a, b) => a.s - b.s).slice(0, 6);
    return `
    <div class="view-head"><div><h1>Trainings</h1><p>Your trainer-led batches with live sessions, attendance and assignments.</p></div>
      <a class="btn ghost" href="trainings.html">${ic("training")}Find a training</a></div>
    ${trainings.length ? `<div class="prog-list">${trainings.map(t => {
      const present = t.attendance.filter(a => a === "p").length, soon = joinWindow(t.next);
      return `
      <article class="card program">
        <div>
          <div class="top"><span class="pill violet">${t.mode === "online" ? "Live online" : "In-person"}</span><span class="pill grey">${esc(t.batch)}</span>${t.status === "upcoming" ? `<span class="pill blue">Starts ${fmtDate(t.sessions[0], { day: "numeric", month: "short" })}</span>` : t.status === "completed" ? `<span class="pill green">Completed</span>` : ""}</div>
          <h3><a href="training.html#${t.id}" style="text-decoration:none">${esc(t.title)}</a></h3>
          <p class="desc">${esc(t.summary)}</p>
          <div class="trainer"><span class="avatar-i" style="background:${t.trainer.color}">${initials(t.trainer.name)}</span><div><b>${esc(t.trainer.name)}</b><span>${esc(t.trainer.role)}</span></div></div>
          <div class="facts">
            <div><b>${t.attendance.length}/${t.total}</b><span>Sessions held</span></div>
            <div><b>${t.attendance.length ? pct(present, t.attendance.length) + "%" : "–"}</b><span>Attendance</span></div>
            <div><b style="font-size:13.5px;line-height:1.35">${esc(t.schedule)}</b><span>Schedule</span></div>
          </div>
          ${t.attendance.length ? `<div style="margin-top:14px"><div class="small muted" style="margin-bottom:6px">Attendance log</div><div class="attend">${t.attendance.map((a, i) => `<i class="${a}" title="Session ${i + 1}: ${a === "p" ? "present" : "absent"}"></i>`).join("")}${Array.from({ length: t.total - t.attendance.length }, () => "<i></i>").join("")}</div></div>` : ""}
        </div>
        <aside>
          <h4>${t.next ? "Next session" : "Batch finished"}</h4>
          ${t.next ? `<div class="when">${dayLabel(t.next.start)}, ${fmtTime(t.next.start)}</div><div class="topic">${esc(t.next.topic)}</div>` : `<div class="topic">All sessions are done. Recordings stay available.</div>`}
          ${t.assignment ? `<div class="small" style="display:flex;gap:8px;align-items:center;background:#fff;padding:8px 10px;border-radius:10px">${ic("notes", 'width="16" height="16" style="color:var(--warn)"')}<span><b>${esc(t.assignment.title)}</b><br><span class="muted">Due ${dayLabel(t.assignment.due)}</span></span></div>` : ""}
          <div class="actions">
            ${t.mode === "in-person" ? `<a class="btn" href="training.html#${t.id}">${ic("pin")}Venue details</a>`
              : t.next ? `<button class="btn ${soon ? "live" : ""}" ${soon ? `data-join="${t.id}"` : `disabled title="Opens 15 minutes before the session"`}>${ic("video")}${soon ? "Join session" : "Join opens later"}</button>` : ""}
            ${t.status !== "upcoming" ? `<a class="btn ghost" href="assignment.html#${t.id}">${ic("notes")}Assignments</a>` : `<button class="btn ghost" data-ics-training="${t.id}">${ic("cal")}Calendar</button>`}
          </div>
        </aside>
      </article>`; }).join("")}</div>

    <div class="grid12" style="margin-top:20px">
      <section class="card s7">
        <div class="card-head"><h2>Session schedule</h2></div>
        ${upcoming.length ? `<div class="table-wrap"><table>
          <thead><tr><th>When</th><th>Session</th><th>Training</th><th>Duration</th></tr></thead>
          <tbody>${upcoming.map(x => `<tr><td style="white-space:nowrap"><b>${dayLabel(x.s)}</b> <span class="muted small">${fmtTime(x.s)}</span></td><td class="wide"><b style="font-weight:600">${x.t.mode === "in-person" ? "Day" : "Session"} ${x.i + 1} · ${esc(x.t.topicOf(x.i))}</b></td><td class="muted wide small">${esc(x.t.title)}</td><td class="num end" style="text-align:left">${x.t.durationMin >= 120 ? (x.t.durationMin / 60) + " h" : x.t.durationMin + " min"}</td></tr>`).join("")}</tbody>
        </table></div>` : `<p class="muted small">No upcoming sessions.</p>`}
      </section>
      <section class="card s5">
        <div class="card-head"><h2>Recordings</h2></div>
        ${recordings.length ? `<div style="display:grid;gap:10px">${recordings.map(r => `
          <div style="display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:12px;align-items:center">
            <span class="avatar-i" style="background:var(--training-soft);color:var(--training);border-radius:10px;width:40px;height:40px">${ic("play", 'width="20" height="20"')}</span>
            <div style="min-width:0"><b style="font-weight:600;font-size:14px">${esc(r.title)}</b><div class="small muted">${fmtDate(r.date, { day: "numeric", month: "short" })} · ${r.duration}</div></div>
            <button class="btn ghost sm" data-video data-v-key="${r.key}" data-v-title="${esc(r.title)}" data-v-sub="${esc(r.training)} · with ${esc(r.by)} · ${fmtDate(r.date, { day: "numeric", month: "short" })}" data-v-poster="${r.img || ""}" data-v-mins="${r.mins}">${r.watched ? `${ic("check", 'width="14" height="14"')}Watch again` : "Watch"}</button>
          </div>`).join("")}</div>` : `<p class="muted small">Recordings appear here after each session.</p>`}
      </section>
    </div>` : `<div class="empty">${emptyCTA("training", "No training batches yet", "Learn live with an industry trainer in a small batch, online or in person.", "trainings.html", "See upcoming batches")}</div>`}`;
  }

  function viewCertifications() {
    return `
    <div class="view-head"><div><h1>Certifications</h1><p>Industry-recognised programs that end in a proctored exam.</p></div>
      <a class="btn ghost" href="certifications.html">${ic("cert")}Explore 25+ programs</a></div>
    ${certifications.length ? `<div class="prog-list">${certifications.map(c => {
      const ready = c.modulesDone >= c.modules.length, cf = certificates.find(x => x.ref === c.id);
      return `
      <article class="card cert-card">
        <div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">${c.passed ? `<span class="pill green">${ic("check")}Passed</span>` : `<span class="pill amber">In progress</span>`}<span class="pill grey">${esc(c.code)}</span></div>
          <h3 style="font-size:19px;font-weight:600"><a href="certification.html#${c.id}" style="text-decoration:none">${esc(c.title)}</a></h3>
          <p class="muted small" style="margin:4px 0 14px">${esc(c.level)} · ${c.modulesDone}/${c.modules.length} modules complete</p>
          <ul class="mods">${c.modules.map((m, i) => `<li><span class="st ${i < c.modulesDone ? "done" : i === c.modulesDone ? "cur" : ""}">${i < c.modulesDone ? ic("check") : i + 1}</span><span>${esc(m)}</span>${i === c.modulesDone && !c.passed ? `<a class="btn sm" href="certification.html#${c.id}">Continue</a>` : i < c.modulesDone ? `<span class="small muted">Done</span>` : `<span class="small muted">${ic("lock", 'width="13" height="13" style="vertical-align:-2px"')}</span>`}</li>`).join("")}</ul>
        </div>
        <div class="exam-box">
          <h4>Proctored exam</h4>
          <div class="exam-rules">
            <div><b>${c.exam.questions}</b><span>Questions</span></div><div><b>${c.exam.minutes} min</b><span>Duration</span></div>
            <div><b>${SR.passMark(c)}</b><span>Pass score</span></div><div><b>${c.exam.retakeDays ? c.exam.retakeDays + "-day wait" : "Unlimited"}</b><span>${c.exam.retakeDays ? "Between attempts" : "Attempts"}</span></div>
          </div>
          ${c.attempts.length ? `<div class="table-wrap"><table>
            <thead><tr><th>Attempt</th><th>Score</th><th>Result</th></tr></thead>
            <tbody>${c.attempts.map((a, i) => { const p = pct(a.score, a.total), ok = SR.examPassed(c, a); return `<tr><td>Attempt #${i + 1} · <span class="muted" style="white-space:nowrap">${fmtDate(a.date, { day: "numeric", month: "short" })}</span></td>
              <td class="wide"><span class="score"><span class="num">${a.score}/${a.total}</span><span class="bar mini"><span style="width:${p}%;background:${ok ? "var(--success)" : "var(--danger)"}"></span></span></span></td>
              <td class="end"><span class="pill ${ok ? "green" : "red"}">${ok ? "Passed" : "Failed"} · ${SR.examScore(c, a)}</span></td></tr>`; }).join("")}</tbody></table></div>`
            : `<p class="small muted" style="margin:0">No attempts yet. ${ready ? "Every module is done, so the exam is unlocked." : `The exam unlocks after all ${c.modules.length} modules.`}</p>`}
          ${cf ? `<a class="btn" href="certificate.html#${cf.id}">${ic("award")}View certificate</a>` : ready ? `<a class="btn" href="exam-rules.html#${c.id}">${ic("arrow")}${c.attempts.length ? "Retake exam" : "Go to exam"}</a>` : `<button class="btn" disabled>${ic("lock")}Exam locked</button><a class="btn ghost" href="certification.html#${c.id}">Continue studying</a>`}
          <a class="btn ghost" href="mock-test.html#${c.id}">${ic("target")}Take a mock test${(SR.store.get("mocks", {}) || {})[c.id] != null ? ` · best ${(SR.store.get("mocks", {}) || {})[c.id]}%` : ""}</a>
        </div>
      </article>`; }).join("")}</div>`
      : `<div class="empty">${emptyCTA("cert", "No certifications yet", "Earn a verifiable credential valid for 2–3 years.", "certifications.html", "Explore certifications")}</div>`}`;
  }

  function viewCertificates() {
    const pending = completed.filter(c => c.certificate === "in_review");
    return `
    <div class="view-head"><div><h1>Certificates</h1><p>Share or verify any certificate with its ID.</p></div></div>
    ${certificates.length || pending.length ? `<div class="certs">${certificates.map(c => {
      const valid = c.validYears ? new Date(new Date(c.issued).setFullYear(new Date(c.issued).getFullYear() + c.validYears)) : null;
      return `
      <article class="certificate">
        <div class="paper">
          <small>SkillRadius · ${esc(c.kind)} certificate</small>
          <h3>${esc(c.title)}</h3>
          <p>Awarded to <span class="name">${esc(user.firstName + " " + (user.lastName || ""))}</span></p>
          <svg class="seal" viewBox="0 0 100 100" aria-hidden="true"><path d="M40 0l8 14 12-12 2 18 18-6-6 18 18 2-12 12 14 8-14 8 12 12-18 2 6 18-18-6-2 18-12-12-8 14-8-14-12 12-2-18-18 6 6-18-18-2 12-12-14-8 14-8z" transform="translate(10 0) scale(.9)" fill="url(#g-b)"/><path d="M40 52l8 8 14-16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="b">
          <dl><dt>Certificate ID</dt><dd>${esc(c.id)}</dd><dt>Issued</dt><dd>${fmtDate(c.issued)}</dd><dt>Valid until</dt><dd>${valid ? fmtDate(valid) : "Lifetime"}</dd><dt>Result</dt><dd>${esc(c.score)}</dd></dl>
          <div class="actions">
            <a class="btn sm" href="certificate.html#${c.id}">${ic("eye")}View</a>
            <button class="btn ghost sm" data-copy="${esc(c.id)}">${ic("copy")}Copy ID</button>
            <a class="btn ghost sm" href="verify.html#${c.id}">${ic("shield")}Verify</a>
          </div>
        </div>
      </article>`; }).join("")}
      ${pending.map(c => `
      <article class="certificate" style="justify-content:center"><div class="b" style="text-align:center;padding:28px 20px">
        <span class="pill amber" style="justify-self:center">Pending</span>
        <h3 style="font-size:16px;font-weight:600">${esc(c.title)}</h3>
        <p class="small muted" style="margin:0">Your certificate will be issued once your assignments are reviewed.</p>
      </div></article>`).join("")}</div>`
      : `<div class="empty">${emptyCTA("file", "No certificates yet", "Finish a course or pass a certification exam to earn your first one.", "courses.html", "Find a course")}</div>`}`;
  }

  function viewOrders() {
    const orders = SR.orders().slice().sort((a, b) => b.date - a.date);
    const typeLabel = { course: "Course", training: "Training", cert: "Certification", path: "Learning path" };
    const refundable = (o) => o.status === "Paid" && Date.now() - o.date < (o.type === "cert" ? 7 : 30) * DAY;
    const spent = orders.filter(o => o.status === "Paid").reduce((s, o) => s + o.total, 0);
    return `
    <div class="view-head"><div><h1>Orders &amp; invoices</h1><p>${orders.length} order${orders.length === 1 ? "" : "s"} · ${SR.inr(spent)} spent</p></div><a class="btn ghost" href="refund-policy.html">${ic("file")}Refund policy</a></div>
    ${orders.length ? `<section class="card"><div class="table-wrap"><table>
      <thead><tr><th>Order</th><th>Item</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
      <tbody>${orders.map(o => `<tr>
        <td><b>${o.id}</b><br><span class="small muted">${esc(o.method)}</span></td>
        <td class="wide"><span class="pill blue">${typeLabel[o.type]}</span> <b style="font-weight:600">${esc(o.title)}</b>${o.coupon ? `<br><span class="small muted">Code ${esc(o.coupon)} · saved ${SR.inr(o.discount)}</span>` : ""}</td>
        <td>${fmtDate(o.date)}</td>
        <td class="num"><b>${SR.inr(o.total)}</b></td>
        <td><span class="pill ${o.status === "Paid" ? "green" : o.status === "Refund requested" ? "amber" : "grey"}">${o.status}</span></td>
        <td class="end" style="white-space:nowrap">${o.total ? `<a class="btn ghost sm" href="invoice.html#${o.id}">${ic("download")}Invoice</a>` : ""} ${refundable(o) ? `<button class="btn plain sm" data-refund="${o.id}">Request refund</button>` : ""}</td></tr>`).join("")}</tbody>
    </table></div></section>
    <p class="small muted" style="margin-top:12px">Refunds: courses within 30 days if under 30% complete · trainings up to 3 days before start · certifications within 7 days if no exam attempt.</p>`
      : `<div class="empty">${emptyCTA("card", "No orders yet", "Your purchases and GST invoices will appear here.", "courses.html", "Browse courses")}</div>`}`;
  }

  function viewWishlist() {
    const items = SR.wishlist().map(SR.course).filter(Boolean);
    return `
    <div class="view-head"><div><h1>Wishlist</h1><p>Courses you've saved for later.</p></div><a class="btn ghost" href="courses.html">${ic("compass")}Browse courses</a></div>
    ${items.length ? `<div class="course-grid">${items.map(c => `
      <article class="ccard"><img src="${esc(c.img)}" alt="">
        <div class="b"><span class="pill blue" style="align-self:flex-start">${esc(c.cat)}</span><h3>${esc(c.title)}</h3><p>${esc(c.subtitle)}</p>
          <div class="meta"><span><b style="color:var(--ink)">${SR.inr(c.price)}</b> ${c.mrp ? `<s>${SR.inr(c.mrp)}</s>` : ""}</span><span>★ ${c.rating}</span></div>
          <div class="foot"><button class="btn plain sm" data-unwish="${c.id}">${ic("x")}Remove</button>${SR.isEnrolled("courses", c.id) ? `<a class="btn sm" href="learn.html#${c.id}">Continue</a>` : `<a class="btn sm" href="checkout.html#course/${c.id}">Buy now</a>`}</div>
        </div></article>`).join("")}</div>`
      : `<div class="empty">${emptyCTA("heart", "Your wishlist is empty", "Tap “Save to wishlist” on any course to keep it here.", "courses.html", "Browse courses")}</div>`}`;
  }

  /* =====================================================================
     Router + interactions
  ===================================================================== */
  const VIEWS = { overview: viewOverview, courses: viewCourses, trainings: viewTrainings, certifications: viewCertifications, certificates: viewCertificates, orders: viewOrders, wishlist: viewWishlist };
  let timer;
  function render() {
    const id = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : "overview";
    $("#view").innerHTML = VIEWS[id]();
    $$("[data-nav]").forEach(a => a.dataset.nav === id ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    document.title = (NAV.find(n => n.id === id) || NAV[0]).label.replace("Dashboard", "My Learning") + " · SkillRadius";
    clearInterval(timer);
    if ($("#countdown")) { tick(); timer = setInterval(tick, 1000); }
  }
  function tick() {
    const el = $("#countdown"); if (!el) return;
    let s = Math.max(0, Math.floor((+el.dataset.start - Date.now()) / 1000));
    if (s === 0) { el.innerHTML = `<div style="min-width:0;flex:1"><b>Live now</b><span>Session in progress</span></div>`; return; }
    const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
    const parts = d ? [[d, "days"], [h, "hrs"], [m, "min"]] : [[h, "hrs"], [m, "min"], [s, "sec"]];
    el.innerHTML = parts.map(([v, l]) => `<div><b>${String(v).padStart(2, "0")}</b><span>${l}</span></div>`).join("");
    el.setAttribute("aria-label", `Starts in ${parts.map(([v, l]) => v + " " + l).join(" ")}`);
  }
  addEventListener("hashchange", () => { render(); scrollTo({ top: 0 }); });
  render();

  document.addEventListener("click", e => {
    const ct = e.target.closest("[data-ctab]");
    if (ct) { courseTab = ct.dataset.ctab; render(); return; }
    const uw = e.target.closest("[data-unwish]");
    if (uw) { SR.toggleWish(uw.dataset.unwish); render(); SR.toast("Removed from wishlist"); return; }
    const rf = e.target.closest("[data-refund]");
    if (rf) {
      const o = SR.orders().find(x => x.id === rf.dataset.refund);
      SR.modal(`<h2>Request a refund</h2><p class="muted">${esc(o.title)} · ${SR.inr(o.total)}</p>
        <form class="stack"><div class="field"><label for="rf-why">Reason <span class="req">*</span></label><select id="rf-why"><option value="">Choose a reason</option><option>Not what I expected</option><option>Bought by mistake</option><option>Schedule doesn't work for me</option><option>Technical problems</option><option>Other</option></select></div>
        <div class="field"><label for="rf-more">Anything else?</label><textarea id="rf-more" style="min-height:80px"></textarea></div>
        <p class="tiny muted">Approved refunds reach your original payment method in 7–10 business days.</p>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Submit request</button></div></form>`, (m) => {
        const why = m.querySelector("#rf-why").value; if (!why) { SR.fieldError(m.querySelector("#rf-why"), "Choose a reason."); return false; }
        const all = SR.orders(); all.find(x => x.id === o.id).status = "Refund requested"; SR.store.set("orders", all);
        const ts = SR.tickets(), now = Date.now();
        ts.push({ id: "TKT-" + (5200 + ts.length + 1), email: user.email, name: user.firstName + " " + (user.lastName || ""), topic: "Refund request", subject: "Refund for " + o.title, order: o.id, status: "Open", created: now, updated: now, messages: [{ from: "learner", text: `Reason: ${why}. ${m.querySelector("#rf-more").value.trim()}`, at: now }] });
        SR.saveTickets(ts); render(); SR.toast("Refund requested. We'll confirm within 2 working days.");
      });
      return;
    }
    const cp = e.target.closest("[data-copy]");
    if (cp) { const id = cp.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(id) : Promise.reject()).then(() => SR.toast(`Copied ${id}`), () => SR.toast(`Certificate ID: ${id}`)); }
  });
  document.addEventListener("change", e => { if (e.target.id === "cat") { courseCat = e.target.value; render(); } });
})();
