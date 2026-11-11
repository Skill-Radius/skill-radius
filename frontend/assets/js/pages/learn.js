/* Lesson player — learn.html#<course-id>[/<module>-<lesson>]
   Video, notes and quiz lessons with a module sidebar. Enrolled learners
   can open every lesson; everyone else can preview the first one.
   The video is simulated (no media files ship with this build): swap
   .video for your player (e.g. a <video> tag or an HLS player). */
(function () {
  const { $, $$, esc, icon, pct } = SR;
  const TYPE_ICON = { video: "play", notes: "notes", quiz: "quiz" };
  let timer = null, autoNext = null;

  const parse = () => { const [id, key] = SR.hashId().split("/"); return { id, key }; };
  const secs = (d) => { const m = /^(\d+):(\d{2})$/.exec(d || ""); return m ? +m[1] * 60 + +m[2] : 0; };
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  /* ---------- Lesson content builders ---------- */
  function article(c, l) {
    if (c.id === "ai-automation" && l.key === "0-1") return `
      <div class="kicker">Module 1 · Notes</div>
      <h1 style="font-size:clamp(22px,3vw,28px);font-weight:700">WORKFLOWS &amp; LOGIC – INTRODUCTION NOTES</h1>
      <h2>What is a Workflow?</h2>
      <p>A workflow is a sequence of steps that turns an input into an outcome. In automation, each step is something a tool does for you, such as reading an email, saving a row to a sheet, or sending a message.</p>
      <h2>The three building blocks</h2>
      <ul><li><b>Trigger</b>: the event that starts the workflow (a new email, a form submission, a time of day).</li><li><b>Actions</b>: the steps the workflow performs (create a task, send a reply, update a CRM).</li><li><b>Logic</b>: the rules that decide which actions run (if/else conditions, filters, loops).</li></ul>
      <div class="callout"><b>Tip:</b> Before you build anything, write the workflow as plain sentences: “When X happens, if Y is true, do Z.” If you can't describe it in one line, split it into two workflows.</div>
      <h2>Conditions in practice</h2>
      <pre class="code"><span class="c">// Pseudo-logic for an inbox workflow</span>
<span class="k">when</span> new_email:
  <span class="k">if</span> email.from <span class="k">in</span> clients:
      label(<span class="s">"Clients"</span>)
      create_task(<span class="s">"Reply to "</span> + email.subject)
  <span class="k">else if</span> <span class="s">"invoice"</span> <span class="k">in</span> email.subject:
      forward_to(<span class="s">"accounts@company.com"</span>)</pre>
      <h2>Summary</h2>
      <p>Every automation is a trigger, some actions and the logic that connects them. In the next module you'll build your first branching workflow in n8n.</p>`;
    const pts = c.outcomes.slice(l.mi % 3, l.mi % 3 + 3);
    return `
      <div class="kicker">Module ${l.mi + 1} · Notes</div>
      <h1 style="font-size:clamp(22px,3vw,28px);font-weight:700">${esc(l.title)}</h1>
      <h2>Why this matters</h2>
      <p>These notes summarise the key ideas from <b>${esc(l.module)}</b>. Keep them open while you practise, and come back to them before the module quiz.</p>
      <h2>Key ideas</h2>
      <ul>${pts.map(p => `<li>${esc(p)}</li>`).join("")}</ul>
      <div class="callout"><b>Practice task:</b> Spend 15 minutes applying one of the ideas above to a small project of your own, then write two lines about what worked and what didn't.</div>
      ${["Development", "AI & Automation"].includes(c.cat) ? `<h2>Example</h2><pre class="code"><span class="k">function</span> <span class="f">practice</span>(idea) {
  <span class="k">const</span> steps = idea.<span class="f">split</span>(<span class="s">" then "</span>);
  <span class="k">return</span> steps.<span class="f">map</span>((s, i) =&gt; <span class="s">\`Step \${i + 1}: \${s}\`</span>);
}</pre>` : ""}
      <h2>Summary</h2>
      <p>You now have the vocabulary for ${esc(l.module.toLowerCase())}. Next, put it into practice in the following lesson.</p>`;
  }

  // Build a deterministic 5-question quiz for a module
  function quizFor(c, l) {
    if (/react/i.test(c.id) || /Hooks/.test(l.title)) return [
      { q: "Which of the following React hooks is best suited for handling side effects, such as data fetching, subscriptions, or manually changing the DOM in a functional component?", code: "function ExampleComponent() {\n  // Which hook goes here?\n  ???(() => {\n    document.title = `You clicked ${count} times`;\n  });\n}", o: ["useState", "useEffect", "useContext", "useReducer"], a: 1 },
      { q: "When does an effect with an empty dependency array [] run?", o: ["On every render", "Only after the first render", "Never", "Only when state changes"], a: 1 },
      { q: "What should an effect return to clean up a subscription?", o: ["null", "A promise", "A cleanup function", "The new state"], a: 2 },
      { q: "Which hook shares a value across components without prop drilling?", o: ["useMemo", "useRef", "useContext", "useId"], a: 2 },
      { q: "Calling setState inside an effect with no dependency array will most likely…", o: ["Run once", "Cause an infinite render loop", "Throw a syntax error", "Do nothing"], a: 1 }
    ];
    const others = SR.courses.filter(x => x.id !== c.id);
    const pick = (arr, n, seed) => arr.map((x, i) => [x, (i * 7 + seed * 13) % 17]).sort((a, b) => a[1] - b[1]).slice(0, n).map(x => x[0]);
    const mod = c.modules[l.mi];
    const qs = [];
    const lessonsHere = mod.lessons.filter(x => x[1] !== "quiz").map(x => x[0]);
    const foreign = others.flatMap(o => o.modules.flatMap(m => m.lessons.filter(x => x[1] !== "quiz").map(x => x[0])));
    c.outcomes.slice(0, 3).forEach((out, i) => {
      const wrong = pick(others.flatMap(o => o.outcomes), 3, i + l.mi);
      const pos = (i + l.mi) % 4, opts = [...wrong]; opts.splice(pos, 0, out);
      qs.push({ q: `Which of these is a skill this course helps you build?`, o: opts, a: pos });
    });
    lessonsHere.slice(0, 2).forEach((t, i) => {
      const wrong = pick(foreign, 3, i + 5 + l.mi);
      const pos = (i + 2 + l.mi) % 4, opts = [...wrong]; opts.splice(pos, 0, t);
      qs.push({ q: `Which topic is covered in “${mod.title}”?`, o: opts, a: pos });
    });
    return qs.slice(0, 5);
  }

  /* ---------- Render ---------- */
  function render() {
    clearInterval(timer); clearInterval(autoNext);
    const { id, key } = parse();
    const c = SR.course(id);
    if (!c) { location.replace(location.hash.length > 1 ? "404.html" : "courses.html"); return; }
    const user = SR.auth.user();
    const enrolled = !!user && SR.isEnrolled("courses", c.id);
    const lessons = SR.lessons(c);
    const p = enrolled ? SR.progressOf(c.id) : { done: [], doneCount: 0, total: lessons.length, pct: 0 };
    const startKey = key || (enrolled ? (p.last || (lessons.find(x => !p.done.includes(x.key)) || lessons[0]).key) : "0-0");
    const l = lessons.find(x => x.key === startKey) || lessons[0];
    const idx = lessons.indexOf(l), prev = lessons[idx - 1], next = lessons[idx + 1];
    const canOpen = (x) => enrolled || x.key === "0-0";
    const isDone = (k) => p.done.includes(k);
    if (enrolled) SR.setLast(c.id, l.key);
    if (!key) history.replaceState(null, "", `#${c.id}/${l.key}`);
    document.title = `${l.title} · ${c.short || c.title} · SkillRadius`;
    const left = p.total - p.doneCount;

    let stage;
    if (!canOpen(l)) {
      stage = `<div class="video"><img src="${c.img}" alt=""><div class="overlay"><div>${icon("lock", 'width="36" height="36"')}<h3>This lesson is part of the full course</h3><p>Enrol to unlock all ${lessons.length} lessons, quizzes and your certificate.</p><a class="btn" href="course.html#${c.id}">${c.price ? "Buy for " + SR.inr(c.price) : "Enroll for free"}</a></div></div></div>`;
    } else if (l.type === "video") {
      stage = `
        <div class="video" id="video" data-dur="${secs(l.dur) || 600}">
          <img src="${l.mi === 0 && l.li === 0 && c.id === "ai-automation" ? "assets/img/lesson-poster.jpg" : c.img}" alt="">
          <button class="play" id="play" aria-label="Play lesson">${icon("playf")}</button>
          <div class="controls">
            <button id="pp" aria-label="Play">${icon("playf")}</button>
            <div class="track" id="track" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><span id="bar" style="width:0%"></span></div>
            <span id="time">0:00 / ${esc(l.dur)}</span>
            <button class="speed" id="speed" aria-label="Playback speed">1x</button>
          </div>
        </div>`;
    } else if (l.type === "notes") {
      stage = `<article class="article">${article(c, l)}</article>`;
    } else {
      stage = `<div class="quiz" id="quiz"></div>`;
    }

    $("#main").innerHTML = `
    <div class="player-layout">
      <div class="stage">
        ${!enrolled ? `<div class="alert info">${icon("info")}<span>You're previewing <b>${esc(c.title)}</b>. <a class="link" href="course.html#${c.id}">Enrol</a> to unlock every lesson and save your progress.</span></div>` : ""}
        ${stage}
        <div class="lesson-head">
          <div>
            <h1>${esc(l.title)}</h1>
            <div class="sub"><span>Module ${l.mi + 1}: ${esc(l.module)}</span><span>${icon(TYPE_ICON[l.type])}${l.type === "quiz" ? l.dur.replace("Q", "questions") : esc(l.dur)}</span></div>
          </div>
          ${enrolled && l.type !== "quiz" ? `<button class="btn plain sm mark-btn" id="mark" aria-pressed="${isDone(l.key)}">${icon("check")}${isDone(l.key) ? "Completed" : "Mark as complete"}</button>` : ""}
        </div>
        ${p.doneCount === p.total && enrolled ? `<div class="alert ok">${icon("award")}<span>Course complete! <a class="link" href="dashboard.html#certificates">View your certificate</a></span></div>` : ""}
        <div class="lesson-nav">
          ${prev ? `<a class="btn plain sm" href="#${c.id}/${prev.key}">${icon("chevl")}Previous</a>` : "<span></span>"}
          ${next ? `<a class="btn sm" href="#${c.id}/${next.key}">Next: ${esc(next.title.length > 34 ? next.title.slice(0, 32) + "…" : next.title)} ${icon("chevr")}</a>` : `<a class="btn sm" href="${enrolled ? "dashboard.html#courses" : "course.html#" + c.id}">${enrolled ? "Back to My Learning" : "View course"}</a>`}
        </div>
        <div class="card" style="padding:0 18px 18px">
          <div class="lesson-tabs" role="tablist">
            <button role="tab" aria-selected="true" data-tab="about">Overview</button>
            <button role="tab" aria-selected="false" data-tab="notes">My notes</button>
            <button role="tab" aria-selected="false" data-tab="res">Resources</button>
            <button role="tab" aria-selected="false" data-tab="qa">Q&amp;A</button>
          </div>
          <div class="tab-panel" data-panel="about"><p>${esc(c.subtitle)}</p><p class="small muted" style="margin-top:10px">Instructor: <b>${esc(SR.trainer(c.instructor).name)}</b> · ${c.hours} hours · ${lessons.length} lessons</p></div>
          <div class="tab-panel" data-panel="notes" hidden>
            ${enrolled ? `<label class="sr-only" for="mynote">Your notes for this lesson</label><textarea class="notes-area" id="mynote" placeholder="Write notes for this lesson. They save automatically.">${esc(((SR.store.get("mynotes", {}) || {})[c.id + "/" + l.key]) || "")}</textarea><p class="tiny muted" id="saved" style="margin-top:6px">Saved to your account</p>` : `<p class="muted">Enrol to take notes that save with each lesson.</p>`}
          </div>
          <div class="tab-panel" data-panel="qa" hidden id="qa"></div>
          <div class="tab-panel" data-panel="res" hidden>
            <ul class="res-list">${[["notes", `${l.module} – lesson notes.pdf`, "Outline of every lesson in this module", "notes"], ["download", "Practice exercises.pdf", "Tasks to try after each lesson", "practice"], ["articles", "Cheat sheet.pdf", "Course outcomes and skills on one page", "cheat"]].map(([i, n, s, k]) => `<li><span class="ic">${icon(i)}</span><span>${esc(n)}<br><span class="tiny muted">PDF · ${s}</span></span>${enrolled ? `<button class="btn ghost sm" data-res="${k}">Download</button>` : icon("lock", 'width="16" height="16" style="color:var(--ink-3)"')}</li>`).join("")}</ul>
          </div>
        </div>
      </div>

      <aside class="course-side" id="side">
        <div class="prog-card">
          <div class="top"><b>Course Progress</b><span class="muted">${enrolled ? `${left}/${p.total} lessons left` : "Preview"}</span></div>
          <div class="bar"><span style="width:${p.pct}%"></span></div>
          <div class="pctl">${p.pct}%</div>
        </div>
        <button class="btn plain sm side-toggle" id="side-toggle" aria-expanded="true">Hide course content</button>
        <div class="mod-acc">
          <h2>Modules</h2>
          ${c.modules.map((m, mi) => `
            <details ${mi === l.mi ? "open" : ""}>
              <summary><span>Module ${mi + 1}: ${esc(m.title)}</span><span class="n">${m.lessons.filter((_, li) => isDone(mi + "-" + li)).length}/${m.lessons.length}</span>${icon("chev")}</summary>
              <ul>${m.lessons.map((x, li) => {
                const k = mi + "-" + li, ok = canOpen({ key: k });
                const ic2 = isDone(k) ? icon("checkc", 'class="done"') : icon(TYPE_ICON[x[1]]);
                return `<li>${ok ? `<a href="#${c.id}/${k}" ${k === l.key ? 'aria-current="page"' : ""}>${ic2}<span>${esc(x[0])}</span><span class="d">${esc(x[2])}</span></a>` : `<span class="locked">${icon("lock")}<span>${esc(x[0])}</span><span class="d">${esc(x[2])}</span></span>`}</li>`;
              }).join("")}</ul>
            </details>`).join("")}
        </div>
        <a class="btn ghost sm" href="course.html#${c.id}">${icon("info")}Course details</a>
      </aside>
    </div>`;

    bind(c, l, next, enrolled);
    renderQA(c, l, enrolled);
    if (l.type === "quiz" && canOpen(l)) runQuiz(c, l, enrolled, next);
  }

  function markDone(c, l, val = true) {
    SR.setLessonDone(c.id, l.key, val);
  }

  function bind(c, l, next, enrolled) {
    $$(".lesson-tabs button").forEach(b => b.addEventListener("click", () => {
      $$(".lesson-tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
      $$(".tab-panel").forEach(p => p.hidden = p.dataset.panel !== b.dataset.tab);
    }));
    const note = $("#mynote");
    if (note) { let t; note.addEventListener("input", () => { clearTimeout(t); $("#saved").textContent = "Saving…"; t = setTimeout(() => { const all = SR.store.get("mynotes", {}) || {}; all[c.id + "/" + l.key] = note.value; SR.store.set("mynotes", all); $("#saved").textContent = "Saved to your account"; }, 400); }); }
    const mark = $("#mark");
    if (mark) mark.addEventListener("click", () => { const now = mark.getAttribute("aria-pressed") !== "true"; markDone(c, l, now); SR.toast(now ? "Lesson marked complete" : "Marked as not complete"); const y = scrollY; render(); scrollTo(0, y); });
    const st = $("#side-toggle");
    if (st) st.addEventListener("click", () => { const side = $("#side"), col = !side.classList.contains("collapsed"); side.classList.toggle("collapsed", col); st.textContent = col ? "Show course content" : "Hide course content"; st.setAttribute("aria-expanded", String(!col)); });

    // Lesson resources: real PDFs built from the course outline
    $$("[data-res]").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.res, mod = c.modules[l.mi], ls = SR.lessons(c).filter(x => x.mi === l.mi), slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const top = [{ t: k === "cheat" ? c.title : `Module ${l.mi + 1}: ${mod.title}`, h: 1 }, { t: k === "cheat" ? `${c.cat} - ${c.level} - Cheat sheet` : `${c.title} - ${k === "notes" ? "Lesson notes" : "Practice exercises"}`, small: 1 }, { gap: 6 }, { rule: 1 }];
      if (k === "notes") SR.pdf(`${slug(mod.title)}-lesson-notes.pdf`, [...top, { t: "In this module", h: 2 }, ...ls.map((x, n) => ({ t: `${n + 1}. ${x.title} (${x.type === "quiz" ? "quiz" : x.dur})`, li: 1 })), ...ls.filter(x => x.type !== "quiz").flatMap(x => [{ t: x.title, h: 2 }, { t: "Key points", b: 1 }, { box: 78 }, { t: "Questions to ask your trainer", b: 1 }, { box: 46 }])], { tag: "Lesson notes" });
      else if (k === "practice") SR.pdf(`${slug(mod.title)}-practice.pdf`, [...top, { t: "Do these right after each lesson. Short, focused practice is what makes the skill stick." }, ...ls.filter(x => x.type !== "quiz").flatMap((x, n) => [{ t: `Exercise ${n + 1}: ${x.title}`, h: 2 }, { t: "Rebuild what was shown in the lesson from a blank file, without looking at the video.", li: 1 }, { t: "Change one thing (an input, a setting or a step) and note what happens.", li: 1 }, { t: "Write three lines on what you would explain to a teammate about it.", li: 1 }, { t: "Done on: ____________     Time taken: ____________", small: 1 }]), { t: "Stuck?", h: 2 }, { t: "Post your question under the lesson. Trainers answer within 24 hours." }], { tag: "Practice" });
      else SR.pdf(`${slug(c.title)}-cheat-sheet.pdf`, [...top, { t: "What you will be able to do", h: 2 }, ...(c.outcomes || []).map(t => ({ t, li: 1 })), ...((c.skills || []).length ? [{ t: "Skills covered", h: 2 }, { t: c.skills.join(", ") }] : []), { t: "Course map", h: 2 }, ...c.modules.flatMap((m, n) => [{ t: `Module ${n + 1}: ${m.title}`, b: 1 }, { t: m.lessons.map(x => x[0]).join("  |  "), small: 1 }, { gap: 4 }])], { tag: "Cheat sheet" });
      SR.toast("Download started");
    }));

    // Simulated video player
    const v = $("#video");
    if (v) {
      const dur = +v.dataset.dur; let pos = 0, rate = 1, playing = false;
      const RATE_SCALE = dur / 14;  // demo: a lesson "plays" in ~14 seconds at 1x
      const draw = () => { $("#bar").style.width = pct(pos, dur) + "%"; $("#track").setAttribute("aria-valuenow", pct(pos, dur)); $("#time").textContent = `${mmss(pos)} / ${mmss(dur)}`; };
      const setPlaying = (on) => {
        playing = on; $("#play").hidden = on; $("#pp").innerHTML = icon(on ? "pause" : "playf"); $("#pp").setAttribute("aria-label", on ? "Pause" : "Play");
        clearInterval(timer);
        if (on) timer = setInterval(() => { pos = Math.min(dur, pos + RATE_SCALE * rate * 0.25); draw(); if (pos >= dur) { clearInterval(timer); finished(); } }, 250);
      };
      const finished = () => {
        playing = false;
        if (enrolled) markDone(c, l, true);
        v.insertAdjacentHTML("beforeend", `<div class="overlay" id="ended"><div>${icon("checkc", 'width="40" height="40" style="color:#7fe0aa"')}<h3>${enrolled ? "Lesson complete" : "Preview finished"}</h3>${next && (enrolled || next.key === "0-0") ? `<p>Up next: <b>${esc(next.title)}</b> in <span id="cd">5</span>s</p><div class="row" style="justify-content:center"><a class="btn" href="#${c.id}/${next.key}">Play next</a><button class="btn plain" id="stay" style="color:#fff;border-color:#4a56a0">Stay here</button></div>` : enrolled ? `<p>Nice work.</p>` : `<p>Enrol to keep going with the full course.</p><a class="btn" href="course.html#${c.id}">Enrol now</a>`}</div></div>`);
        if (next && enrolled) {
          let n = 5; autoNext = setInterval(() => { n--; const cd = $("#cd"); if (cd) cd.textContent = n; if (n <= 0) { clearInterval(autoNext); location.hash = `${c.id}/${next.key}`; } }, 1000);
          $("#stay").addEventListener("click", () => { clearInterval(autoNext); $("#ended").remove(); render(); });
        }
      };
      $("#play").addEventListener("click", () => setPlaying(true));
      $("#pp").addEventListener("click", () => setPlaying(!playing));
      $("#speed").addEventListener("click", () => { rate = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1; $("#speed").textContent = rate + "x"; });
      const seek = (e) => { const r = $("#track").getBoundingClientRect(); pos = Math.max(0, Math.min(dur, (e.clientX - r.left) / r.width * dur)); draw(); };
      $("#track").addEventListener("click", seek);
      $("#track").addEventListener("keydown", e => { if (e.key === "ArrowRight") { pos = Math.min(dur, pos + 10); draw(); } if (e.key === "ArrowLeft") { pos = Math.max(0, pos - 10); draw(); } });
      draw();
    }
  }

  /* ---------- Q&A (answered by trainers in trainer.html) ---------- */
  function renderQA(c, l, enrolled) {
    const host = $("#qa"); if (!host) return;
    const all = SR.qaFor(c.id), here = all.filter(q => q.lesson === l.key), rest = all.filter(q => q.lesson !== l.key);
    const when = (d) => SR.fmtDate(d, { day: "numeric", month: "short" });
    const item = (q) => `<div class="review" style="gap:10px"><div class="top"><span class="avatar-i" style="background:#7a4fe0;width:32px;height:32px;font-size:12px">${SR.initials(q.by)}</span><div><b style="font-size:14.5px">${esc(q.q)}</b><span class="tiny muted">${esc(q.by)} · ${when(q.at)}${q.lesson !== l.key ? ` · ${esc((SR.lessons(c).find(x => x.key === q.lesson) || {}).title || "")}` : ""}</span></div></div>
      ${q.answers.length ? q.answers.map(a => `<div style="margin-left:42px;background:var(--primary-softer);border-radius:10px;padding:10px 12px;font-size:14.5px"><b style="font-size:13px;color:var(--primary)">${esc(a.by)}${a.role === "trainer" ? " · Trainer" : ""}</b><p style="margin-top:4px">${esc(a.text)}</p></div>`).join("") : `<span class="tiny muted" style="margin-left:42px">Waiting for a trainer's answer · usually within 24 hours</span>`}</div>`;
    host.innerHTML = `
      ${enrolled ? `<form class="stack" id="ask" novalidate style="margin-bottom:16px"><div class="field"><label for="ask-q">Ask a question about this lesson</label><textarea id="ask-q" style="min-height:70px" placeholder="Be specific: what did you try, and what happened?"></textarea></div><button class="btn sm" type="submit" style="justify-self:start">Post question</button></form>` : `<p class="small muted" style="margin-bottom:14px">Enrol to ask questions. Trainers answer within 24 hours.</p>`}
      <div class="stack" style="gap:10px">${here.length ? here.slice().reverse().map(item).join("") : `<p class="small muted">No questions on this lesson yet.</p>`}</div>
      ${rest.length ? `<details style="margin-top:14px"><summary class="small" style="cursor:pointer;font-weight:600;color:var(--primary)">Questions on other lessons (${rest.length})</summary><div class="stack" style="gap:10px;margin-top:10px">${rest.slice().reverse().map(item).join("")}</div></details>` : ""}`;
    const f = $("#ask");
    if (f) f.addEventListener("submit", e => {
      e.preventDefault();
      const v = $("#ask-q").value.trim(); if (v.length < 10) { SR.fieldError($("#ask-q"), "Write your question in a sentence or two."); return; }
      const u = SR.auth.user();
      // → Replace with POST /api/courses/:id/questions
      SR.addQA(c.id, { lesson: l.key, q: v, by: u.firstName + " " + (u.lastName || "").charAt(0) + ".", email: u.email });
      renderQA(c, l, enrolled); SR.toast("Question posted. You'll get an email when a trainer answers.");
    });
  }

  /* ---------- Quiz ---------- */
  function runQuiz(c, l, enrolled, next) {
    const qs = quizFor(c, l), answers = new Array(qs.length).fill(null);
    let i = 0;
    const host = $("#quiz");
    function show() {
      const q = qs[i];
      host.innerHTML = `
        <span class="count">Question ${i + 1} of ${qs.length}</span>
        <h2>${esc(l.title.replace(/^Quiz:\s*/, ""))}</h2>
        <p class="q">${esc(q.q)}</p>
        ${q.code ? `<pre class="code">${esc(q.code)}</pre>` : ""}
        <div class="options" role="radiogroup">${q.o.map((o, k) => `<label class="opt"><input type="radio" name="opt" value="${k}" ${answers[i] === k ? "checked" : ""}><span>${esc(o)}</span><span class="letter">${"ABCD"[k]}</span></label>`).join("")}</div>
        <div class="actions">
          <button class="btn plain sm" id="qprev" ${i === 0 ? "disabled" : ""}>${icon("arrowl")}Previous Question</button>
          <button class="btn sm" id="qnext">${i === qs.length - 1 ? "Submit quiz" : "Next Question"} ${icon("arrow")}</button>
        </div>`;
      $$('input[name="opt"]', host).forEach(r => r.addEventListener("change", () => answers[i] = +r.value));
      $("#qprev").addEventListener("click", () => { i--; show(); });
      $("#qnext").addEventListener("click", () => {
        if (answers[i] === null) { SR.toast("Choose an answer to continue"); return; }
        if (i < qs.length - 1) { i++; show(); } else result();
      });
    }
    function result() {
      const right = qs.filter((q, k) => answers[k] === q.a).length, score = pct(right, qs.length), pass = score >= 60;
      if (pass && enrolled) markDone(c, l, true);
      host.innerHTML = `
        <div class="quiz-result">
          <span class="pill ${pass ? "green" : "red"}">${pass ? "Passed" : "Try again"}</span>
          <div class="score">${right}/${qs.length}</div>
          <p class="muted">${pass ? `${score}% correct. ${enrolled ? "This quiz is marked complete." : ""}` : `${score}% correct. You need 60% to pass this quiz.`}</p>
        </div>
        <div class="stack">${qs.map((q, k) => `<div class="review-q" style="border:1px solid var(--line);border-radius:12px;padding:12px 14px"><b>${k + 1}. ${esc(q.q.length > 120 ? q.q.slice(0, 118) + "…" : q.q)}</b><span class="small" style="color:${answers[k] === q.a ? "var(--success-ink)" : "var(--danger-ink)"}">${answers[k] === q.a ? "✓ " : "✕ Your answer: " + esc(q.o[answers[k]]) + " · Correct: "}${esc(q.o[q.a])}</span></div>`).join("")}</div>
        <div class="actions"><button class="btn plain sm" id="retake">${icon("retry")}Retake quiz</button>${next ? `<a class="btn sm" href="#${c.id}/${next.key}">Next lesson ${icon("arrow")}</a>` : `<a class="btn sm" href="dashboard.html#courses">Back to My Learning</a>`}</div>`;
      $("#retake").addEventListener("click", () => { answers.fill(null); i = 0; show(); });
    }
    show();
  }

  addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
  render();
})();
