/* Certification exam — exam-rules.html | exam.html | exam-result.html  (#<cert-id>)
   Rules → timed, proctored exam → scored result (+ certificate on pass).
   Demo proctoring: tab switches are detected and flagged. A production
   build would add webcam capture and server-side timing and scoring. */
(function () {
  if (!SR.auth.require()) return;
  const { $, $$, esc, icon, pct, fmtDate } = SR;
  const page = document.querySelector('meta[name="sr-page"]').content;
  const c = SR.cert(SR.hashId());
  if (!c) { location.replace(location.hash.length > 1 ? "404.html" : "certifications.html"); return; }
  const user = SR.auth.user();
  const hub = `certification.html#${c.id}`;
  const STATE_KEY = "exam_" + c.id;

  // Guard: must be enrolled and have finished the modules
  const done = ((SR.store.get("certprog", {}) || {})[c.id]) || 0;
  if (page !== "result" && (!SR.isEnrolled("certs", c.id) || done < c.modules.length)) { location.replace(hub); return; }

  /* ---------- Questions ----------
     Professional exams draw a fresh, domain-weighted set from their bank and
     shuffle the options on every attempt (the draw is kept in the attempt state). */
  const X = c.exam, PRO = !!X.pro, BANK = X.bank && SR.examBanks && SR.examBanks[X.bank];
  const shuffle = (arr) => { const a = [...arr]; for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
  function legacy() {
    if (c.id === "python") return SR.examQuestions.slice(0, X.questions);
    const others = SR.certifications.filter(x => x.id !== c.id);
    const foreignMods = others.flatMap(o => o.modules), foreignSkills = others.flatMap(o => o.skills);
    const out = [];
    for (let i = 0; i < X.questions; i++) {
      const useMod = i % 2 === 0, pool = useMod ? c.modules : c.skills, right = pool[Math.floor(i / 2) % pool.length];
      const wrongPool = (useMod ? foreignMods : foreignSkills).filter(x => !pool.includes(x));
      const wrong = [0, 1, 2].map(k => wrongPool[(i * 5 + k * 7) % wrongPool.length]);
      const pos = (i * 3) % 4, o = [...wrong]; o.splice(pos, 0, right);
      out.push({ s: c.modules[Math.floor(i / X.questions * c.modules.length)], q: useMod ? `Which of these topics is part of the ${c.title} syllabus?` : `Which skill does the ${c.title} exam assess?`, o, a: pos });
    }
    return out;
  }
  function newPick() {
    if (!BANK) return null;
    const doms = X.domains || [...new Set(BANK.map(q => q.d))].map(d => [d, 100 / new Set(BANK.map(q => q.d)).size]);
    let counts = doms.map(([, w]) => Math.round(X.questions * w / 100));
    let diff = X.questions - counts.reduce((a, b) => a + b, 0); for (let k = 0; diff !== 0; k = (k + 1) % counts.length) { counts[k] += Math.sign(diff); diff -= Math.sign(diff); }
    const chosen = doms.flatMap(([d], k) => shuffle(BANK.map((q, i) => q.d === d ? i : -1).filter(i => i >= 0)).slice(0, counts[k]));
    return shuffle(chosen).map(i => ({ i, o: shuffle(BANK[i].o.map((_, k) => k)) }));
  }
  const fromPick = (pick) => pick.map(({ i, o }) => {
    const b = BANK[i], multi = Array.isArray(b.a), at = (k) => o.indexOf(k);
    return { s: b.d, q: b.q, o: o.map(k => b.o[k]), a: multi ? b.a.map(at).sort((x, y) => x - y) : at(b.a), multi, n: multi ? b.a.length : 1, e: b.e };
  });
  const isRight = (q, g) => q.multi ? Array.isArray(g) && g.length === q.a.length && [...g].sort((x, y) => x - y).every((v, k) => v === q.a[k]) : g === q.a;
  const isAnswered = (g) => Array.isArray(g) ? g.length > 0 : g !== null && g !== undefined;
  const NUM = ["", "ONE", "TWO", "THREE", "FOUR"];
  const MAX_STRIKES = X.maxStrikes || (PRO ? 5 : 6);
  const L = "ABCDEF";
  const scaledOf = (frac) => Math.round(X.scaled.min + (X.scaled.max - X.scaled.min) * frac);
  let Q = BANK ? [] : legacy();
  const sectionsOf = (qs) => [...new Set(qs.map(q => q.s))];

  const header = (right) => {
    $("#exam-header").innerHTML = `<a class="brand" href="${page === "exam" ? "#" : "dashboard.html"}" ${page === "exam" ? 'data-toast="Finish or submit the exam before leaving"' : ""} aria-label="SkillRadius">${SR.brandImg(26)}</a>
      <div class="title">${esc(c.title)}${page === "exam" ? " · Proctored Exam" : ""}</div><div>${right}</div>`;
  };

  /* ================= Check-in (rules page) =================
     Four steps, like a test centre's check-in desk:
     1 System check · 2 Identity · 3 Your room · 4 Rules & launch */
  if (page === "rules") {
    header(`<a class="btn exit" href="${hub}">← Back to Hub</a>`);
    const attempts = ((SR.store.get("attempts", {}) || {})[c.id]) || [];
    const saved = SR.session.get(STATE_KEY);
    const cool = !saved && SR.retakeAt(c);
    const fi = (n) => SR.ficon(n);
    const CK = SR.session.get("checkin_" + c.id) || {};
    const saveCK = () => SR.session.set("checkin_" + c.id, CK);
    let step = saved ? 4 : 1, media = null, sysOK = false;
    const STEPS = [["System check", "Camera, microphone, browser"], ["Identity", "Face and photo ID"], ["Your room", "Desk and surroundings"], ["Rules & start", "Read and agree"]];

    $("#main").innerHTML = `
    <section class="ci-wrap">
      <div class="ci-card">
        <aside class="ci-steps">
          <div class="ci-exam"><span class="pill blue">${PRO ? "Professional exam" : "Proctored exam"}</span><b>${esc(c.title)}</b><span>${X.questions} questions · ${X.minutes} min · pass ${SR.passMark(c)}</span></div>
          <ol id="ci-steps">${STEPS.map(([t, d], i) => `<li data-s="${i + 1}"><span class="n">${i + 1}</span><div><b>${t}</b><small>${d}</small></div></li>`).join("")}</ol>
          <div class="ci-cand"><img src="${SR.avatarURL(user)}" alt=""><div><b>${esc(user.firstName + " " + (user.lastName || ""))}</b><small>Candidate ID ${candId()}</small></div></div>
        </aside>
        <div class="ci-body" id="ci-body"></div>
      </div>
    </section>`;

    function candId() { let h = 0; for (const ch of user.email) h = (h * 33 + ch.charCodeAt(0)) % 900000; return "SR-" + (100000 + h); }
    const stopMedia = () => { if (media && media.stream) media.stream.getTracks().forEach(t => t.stop()); media = null; };
    async function ensureMedia() { if (media && media.stream && media.stream.active) return media; media = await SR.getMedia(); return media; }
    const attach = (v) => { if (v && media && media.stream) { v.srcObject = media.stream; v.play().catch(() => {}); } };

    function go(n) {
      step = n;
      $$("#ci-steps li").forEach(li => { const k = +li.dataset.s; li.className = k < n ? "done" : k === n ? "on" : ""; });
      ({ 1: sys, 2: ident, 3: room, 4: rules })[n]();
      $(".ci-body").scrollTop = 0; scrollTo({ top: 0 });
    }

    /* ---------- 1. System check ---------- */
    async function sys() {
      $("#ci-body").innerHTML = `
        <h1>System check</h1><p class="lead">We check your camera, microphone and browser before you start. Nothing is recorded yet.</p>
        <div class="ci-sys">
          <div class="ci-cam"><video id="ci-v" muted playsinline autoplay></video><div class="ci-cam-msg" id="ci-cam-msg">${icon("camera")}<span>Requesting camera…</span></div></div>
          <ul class="ci-checks" id="ci-checks"></ul>
        </div>
        <div class="ci-actions"><button class="btn plain" id="ci-retry" type="button">${icon("retry")}Run check again</button><button class="btn" id="ci-next" type="button" disabled>Continue ${icon("arrow")}</button></div>
        <p class="ci-demo" id="ci-demo" hidden></p>`;
      const rows = { browser: ["Browser", "Checking…"], camera: ["Camera", "Waiting for permission…"], mic: ["Microphone", "Waiting for permission…"], face: ["Face detection", "Loading…"], screen: ["Display", "Checking…"], net: ["Connection", "Checking…"], fs: ["Full screen", "Checking…"] };
      const set = (k, state, text) => { rows[k] = [rows[k][0], text, state]; draw(); };
      const draw = () => { $("#ci-checks").innerHTML = Object.entries(rows).map(([k, [t, d, st = "wait"]]) => `<li class="${st}" data-k="${k}"><span class="i">${st === "ok" ? icon("check") : st === "bad" ? icon("x") : st === "warn" ? "!" : `<i class="spin"></i>`}</span><div><b>${t}</b><small>${esc(d)}</small>${k === "mic" ? `<span class="lvl"><i id="ci-lvl"></i></span>` : ""}</div></li>`).join(""); };
      draw();
      const modern = !!(navigator.mediaDevices && window.AudioContext && document.documentElement.requestFullscreen !== undefined && window.Promise);
      set("browser", modern ? "ok" : "bad", modern ? (navigator.userAgentData && navigator.userAgentData.brands ? navigator.userAgentData.brands.map(b => b.brand).filter(b => !/Not/.test(b)).slice(-1)[0] || "Supported" : "Supported") + " · up to date" : "Please use the latest Chrome, Edge, Firefox or Safari");
      const multi = window.screen && window.screen.isExtended;
      set("screen", innerWidth < 900 ? "warn" : multi ? "warn" : "ok", innerWidth < 900 ? "Use a laptop or desktop for the exam" : multi ? "Disconnect extra monitors before you start" : `${screen.width}×${screen.height} · single display`);
      set("net", navigator.onLine ? "ok" : "bad", navigator.onLine ? "Online" : "You're offline");
      set("fs", document.fullscreenEnabled ? "ok" : "warn", document.fullscreenEnabled ? "Supported" : "Not available here; the exam will run in the window");
      SR.loadFaceApi().then(fa => set("face", fa ? "ok" : "warn", fa ? "On-device AI ready" : "Basic checks only (AI model unavailable)"));
      media = await ensureMedia();
      const v = $("#ci-v");
      if (media.stream) {
        attach(v); $("#ci-cam-msg").hidden = true;
        const vt = media.stream.getVideoTracks()[0];
        set("camera", "ok", (vt && vt.label ? vt.label.replace(/\s*\(.*\)$/, "") : "Camera") + " · working");
        if (media.stream.getAudioTracks().length) {
          set("mic", "ok", "Working · speak to see the level move");
          try { const ac = new AudioContext(), an = ac.createAnalyser(); ac.createMediaStreamSource(media.stream).connect(an); const b = new Float32Array(an.fftSize); const loop = () => { if (step !== 1 || !$("#ci-lvl")) { ac.close(); return; } an.getFloatTimeDomainData(b); let q = 0; for (const x of b) q += x * x; const l = Math.min(1, Math.sqrt(q / b.length) * 9); $("#ci-lvl").style.width = (l * 100).toFixed(0) + "%"; requestAnimationFrame(loop); }; loop(); } catch (e) {}
        } else set("mic", "warn", "No microphone found. Noise monitoring will be off");
        sysOK = true; CK.noCamera = false; saveCK();
      } else {
        const why = { denied: "Permission was blocked. Allow camera access in your browser's address bar, then run the check again.", no_device: "No camera found. Connect a webcam and run the check again.", unsupported: "This browser can't use a camera. Use the latest Chrome, Edge or Firefox.", blocked: "The camera can't be used inside this preview window. Open the site in its own browser tab (your own domain, or the downloaded files) to use the camera.", busy: "Your camera is being used by another app (Zoom, Teams, Meet…). Close it, then run the check again.", insecure: "The camera only works on a secure (https://) address. Open the site over https." }[media.error] || "The camera couldn't start.";
        $("#ci-cam-msg").innerHTML = `${icon("camera")}<span>${esc(why)}</span>`; $("#ci-cam-msg").classList.add("bad");
        set("camera", "bad", "Not available"); set("mic", "bad", "Not available");
        const d = $("#ci-demo"); d.hidden = false;
        d.innerHTML = `A camera is required for a certified result. <button type="button" class="link" id="ci-nocam">Demo only: continue without a camera</button>. The attempt will be marked as not camera-proctored.`;
        $("#ci-nocam").addEventListener("click", () => { CK.noCamera = true; saveCK(); sysOK = true; go(2); });
      }
      $("#ci-next").disabled = !sysOK;
      $("#ci-retry").addEventListener("click", () => { stopMedia(); sys(); });
      $("#ci-next").addEventListener("click", () => go(2));
    }

    /* ---------- 2. Identity ---------- */
    async function ident() {
      const noCam = CK.noCamera;
      $("#ci-body").innerHTML = `
        <h1>Verify your identity</h1><p class="lead">Take a clear photo of your face, then hold up a government photo ID (Aadhaar, PAN, passport or driving licence). Your photos are kept with this attempt for the proctor.</p>
        <div class="ci-id">
          <div class="ci-shot" id="shot-face"><div class="ci-frame face">${noCam ? "" : `<video muted playsinline autoplay></video>`}<span class="guide oval"></span>${CK.face ? `<img src="${CK.face}" alt="Your face photo">` : ""}</div>
            <div class="ci-shot-f"><b>1. Your face</b><small id="face-msg">${CK.face ? "Captured" : "Centre your face inside the oval, in good light."}</small><button class="btn sm ${CK.face ? "plain" : ""}" type="button" data-cap="face" ${noCam ? "disabled" : ""}>${CK.face ? "Retake" : "Capture"}</button></div></div>
          <div class="ci-shot" id="shot-id"><div class="ci-frame id">${noCam ? "" : `<video muted playsinline autoplay></video>`}<span class="guide card"></span>${CK.id ? `<img src="${CK.id}" alt="Your ID photo">` : ""}</div>
            <div class="ci-shot-f"><b>2. Photo ID</b><small id="id-msg">${CK.id ? "Captured" : "Hold the photo side of your ID inside the frame."}</small><div class="row" style="gap:8px"><button class="btn sm ${CK.id ? "plain" : ""}" type="button" data-cap="id" ${noCam ? "disabled" : ""}>${CK.id ? "Retake" : "Capture"}</button><label class="btn sm plain" style="cursor:pointer">Upload<input type="file" accept="image/*" id="id-file" hidden></label></div></div></div>
        </div>
        <div class="ci-actions"><button class="btn plain" type="button" id="ci-back">${icon("arrowl")}Back</button><button class="btn" id="ci-next" type="button" ${(CK.face && CK.id) || noCam ? "" : "disabled"}>Continue ${icon("arrow")}</button></div>
        ${noCam ? `<p class="ci-demo">Demo mode: photos are skipped because no camera is available. You can still upload an ID photo.</p>` : ""}`;
      if (!noCam) { media = await ensureMedia(); $$(".ci-frame video").forEach(attach); }
      const enableNext = () => { $("#ci-next").disabled = !((CK.face && CK.id) || noCam); };
      $$("[data-cap]").forEach(b => b.addEventListener("click", async () => {
        const kind = b.dataset.cap, box = $("#shot-" + kind), v = $("video", box), msg = $("#" + kind + "-msg");
        if (CK[kind]) { CK[kind] = null; saveCK(); const im = $("img", box); if (im) im.remove(); b.textContent = "Capture"; b.classList.remove("plain"); msg.textContent = kind === "face" ? "Centre your face inside the oval, in good light." : "Hold the photo side of your ID inside the frame."; enableNext(); return; }
        if (kind === "face") {
          msg.textContent = "Checking…";
          const r = await SR.loadFaceApi().then(() => SR.detectFaces(v)).catch(() => null);
          if (r && r.count === 0) { msg.innerHTML = `<span class="bad">No face found. Move closer and face the camera.</span>`; return; }
          if (r && r.count > 1) { msg.innerHTML = `<span class="bad">More than one face found. Only you should be in view.</span>`; return; }
        }
        const shot = SR.snapshot(v, 320); if (!shot) { msg.textContent = "The camera isn't ready yet. Try again."; return; }
        CK[kind] = shot; saveCK();
        box.querySelector(".ci-frame").insertAdjacentHTML("beforeend", `<img src="${shot}" alt="">`);
        msg.innerHTML = `<span class="ok">${icon("check")}Captured</span>`; b.textContent = "Retake"; b.classList.add("plain"); enableNext();
      }));
      $("#id-file").addEventListener("change", e => {
        const f = e.target.files[0]; if (!f) return;
        const img = new Image(); img.onload = () => { const w = 320, h = Math.round(w * img.height / img.width), cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d").drawImage(img, 0, 0, w, h); CK.id = cv.toDataURL("image/jpeg", .7); saveCK(); ident(); };
        img.src = URL.createObjectURL(f);
      });
      $("#ci-back").addEventListener("click", () => go(1));
      $("#ci-next").addEventListener("click", () => go(3));
    }

    /* ---------- 3. Room ---------- */
    async function room() {
      const checks = [["alone", "I'm alone in the room, and no one will come in during the exam"], ["desk", "My desk is clear: no notes, books, papers or second screens"], ["phone", "My phone and smartwatch are switched off and out of reach"], ["quiet", "I'm in a quiet, well-lit place, and my face is clearly visible"]];
      CK.room = CK.room || {};
      $("#ci-body").innerHTML = `
        <h1>Prepare your room</h1><p class="lead">Exams are taken in a private room. The proctor may ask to see your surroundings, and the camera watches for other people throughout the exam.</p>
        <div class="ci-room">
          <ul class="ci-list">${checks.map(([k, t]) => `<li><label><input type="checkbox" data-r="${k}" ${CK.room[k] ? "checked" : ""}><span>${t}</span></label></li>`).join("")}</ul>
          <div class="ci-scan">${CK.noCamera ? `<p class="small muted">Room scan needs a camera.</p>` : `<div class="ci-frame room"><video muted playsinline autoplay></video>${CK.roomShot ? `<img src="${CK.roomShot}" alt="">` : ""}</div><div class="ci-shot-f"><b>Room scan</b><small>Tilt your screen or turn your camera to show your desk, then capture.</small><button class="btn sm ${CK.roomShot ? "plain" : ""}" id="room-cap" type="button">${CK.roomShot ? "Retake" : "Capture desk"}</button></div>`}</div>
        </div>
        <div class="ci-tips"><b>Not allowed during the exam</b><span>Talking or reading aloud · leaving your seat · headphones or earbuds · other browser tabs or apps · notes, calculators or phones</span></div>
        <div class="ci-actions"><button class="btn plain" type="button" id="ci-back">${icon("arrowl")}Back</button><button class="btn" id="ci-next" type="button" disabled>Continue ${icon("arrow")}</button></div>`;
      if (!CK.noCamera) { media = await ensureMedia(); attach($(".ci-frame.room video")); }
      const upd = () => { $$("[data-r]").forEach(x => CK.room[x.dataset.r] = x.checked); saveCK(); $("#ci-next").disabled = !checks.every(([k]) => CK.room[k]); };
      $$("[data-r]").forEach(x => x.addEventListener("change", upd)); upd();
      const rc = $("#room-cap"); if (rc) rc.addEventListener("click", () => { const s = SR.snapshot($(".ci-frame.room video"), 320); if (s) { CK.roomShot = s; saveCK(); room(); } });
      $("#ci-back").addEventListener("click", () => go(2));
      $("#ci-next").addEventListener("click", () => go(4));
    }

    /* ---------- 4. Rules & launch ---------- */
    function rules() {
      stopMedia();
      $("#ci-body").innerHTML = `
        <h1>${saved ? "Resume your exam" : "Rules and start"}</h1><p class="lead">${saved ? "You have an exam in progress. Resuming keeps your answers and the remaining time." : "Read the rules, then start. The exam opens in full screen, and the timer starts when you begin."}</p>
        <div class="stats4 ci-stats"><div><b>${X.questions}</b><span>Questions</span></div><div><b>${X.minutes} min</b><span>Duration</span></div><div><b>${X.scaled ? X.scaled.pass + "<small>/" + X.scaled.max + "</small>" : X.pass + "%"}</b><span>Pass score</span></div><div><b>${X.retakeDays ? X.retakeDays + " days" : "∞"}</b><span>${X.retakeDays ? "Retake wait" : "Attempts"}</span></div></div>
        ${cool ? `<div class="alert error">${icon("clock")}<span><b>Retake available on ${fmtDate(cool, { day: "numeric", month: "long", year: "numeric" })}.</b> Professional exams have a ${X.retakeDays}-day wait after an unsuccessful attempt. Work on the domains marked “Needs improvement” and take the <a class="link" href="mock-test.html#${c.id}">practice exam</a>.</span></div>` : ""}
        ${PRO ? `<h2>About this exam</h2>
        <div class="pro-info">
          <div><b>Question types</b><span><i>Multiple choice:</i> one correct answer out of four.<br><i>Multiple response:</i> two or more correct answers out of five. The question tells you how many to choose.</span></div>
          <div><b>Scoring</b><span>Scaled score from ${X.scaled.min} to ${X.scaled.max}; ${X.scaled.pass} to pass. Unanswered questions count as wrong, and there's no penalty for guessing. A multiple-response question scores only if every choice is correct.</span></div>
          <div><b>Every attempt is different</b><span>Questions are drawn from a larger bank, weighted by domain, and the answer order is shuffled.</span></div>
        </div>
        <table class="dom-table"><thead><tr><th>Domain</th><th>Weight</th></tr></thead><tbody>${(X.domains || []).map(([d, w]) => `<tr><td>${esc(d)}</td><td><span class="w"><i style="width:${w * 2.5}%"></i></span>${w}%</td></tr>`).join("")}</tbody></table>` : ""}
        <h2>How you're proctored</h2>
        <ul class="rules ci-rules">
          ${[["photo_camera", "Camera on the whole time", "On-device AI checks that you, and only you, are in view and looking at the screen."], ["mobile_hand_left_off", "Microphone listens for talking", "Sustained talking or noise is logged."], ["block", "Full screen, one tab", "Leaving full screen or switching tabs is a serious warning."], ["notifications_off", "Copy, paste and shortcuts are off", "Right-click, printing and developer tools are blocked and logged."], ["emergency_home", `${MAX_STRIKES} serious warnings end the exam`, "Your answers so far are submitted and the attempt goes to a proctor for review."], ["alarm_on", "Timer is strict", `The exam submits automatically when the ${X.minutes}-minute timer ends.`], (X.retakeDays ? ["replay", `${X.retakeDays}-day retake wait`, `If you don't pass, you can retake ${X.retakeDays} days after your attempt.`] : ["replay", "Free retakes", "You can retake the exam with no waiting period."])]
            .map(([i, t, d]) => `<li>${fi(i)}<div><b>${t}</b><span>${d}</span></div></li>`).join("")}
        </ul>
        ${attempts.length ? `<p class="prev-att">Previous attempts: ${attempts.map((a, i) => `#${i + 1} ${SR.examScore(c, a)}`).join(" · ")}</p>` : ""}
        <label class="agree-row"><input type="checkbox" id="agree"><span>I agree to be recorded and monitored, and I confirm the identity photos are of me.</span></label>
        ${cool ? `<button class="btn ghost block" id="demo-skip" type="button" style="margin-bottom:10px">Demo only: skip the ${X.retakeDays}-day wait</button>` : ""}
        <div class="ci-actions">${saved ? "" : `<button class="btn plain" type="button" id="ci-back">${icon("arrowl")}Back</button>`}<button class="btn agree" id="start" disabled>${saved ? "Resume exam" : "Start exam"} ${icon("arrow")}</button></div>`;
      $("#agree").addEventListener("change", e => $("#start").disabled = !e.target.checked || !!cool);
      const ds = $("#demo-skip"); if (ds) ds.addEventListener("click", () => { const all = SR.store.get("attempts", {}) || {}; (all[c.id] || []).forEach(a => a.date -= X.retakeDays * 864e5); SR.store.set("attempts", all); location.reload(); });
      const bk = $("#ci-back"); if (bk) bk.addEventListener("click", () => go(3));
      $("#start").addEventListener("click", () => {
        if (cool) return;
        if (!saved) SR.session.set(STATE_KEY, { start: null, pick: newPick(), answers: new Array(X.questions).fill(null), flags: [], struck: {}, visited: [0], idx: 0, switches: 0, checkin: { face: CK.face || null, id: CK.id || null, room: CK.roomShot || null, noCamera: !!CK.noCamera, at: Date.now() } });
        try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
        location.href = "exam.html#" + c.id;
      });
    }
    addEventListener("pagehide", stopMedia);
    go(cool ? 4 : step);
    return;
  }

  /* ================= Exam =================
     Professional test-delivery layout: dark top bar, question pane, a right rail
     with the live camera and proctoring status, a navigator with filters,
     a review screen before submitting, and proctoring overlays. */
  if (page === "exam") {
    let st = SR.session.get(STATE_KEY);
    if (!st || (BANK && !st.pick)) { SR.session.del(STATE_KEY); location.replace("exam-rules.html#" + c.id); return; }
    if (BANK) Q = fromPick(st.pick);
    st.struck = st.struck || {};
    const sections = sectionsOf(Q);
    const limit = X.minutes * 60;
    let submitted = false, proc = null, stream = null, fontStep = +(SR.store.get("examFont", 0) || 0), filter = "all";
    const save = () => { if (!submitted) SR.session.set(STATE_KEY, st); };
    document.body.classList.add("xm");
    const noCam = st.checkin && st.checkin.noCamera;

    document.querySelector(".exam-header").outerHTML = `
      <header class="xm-top"><div class="in">
        <div class="xm-brand"><img src="assets/img/logo-mark.svg" alt="SkillRadius" width="28" height="28"><div><b>${esc(c.title)}</b><small>${esc(c.code)} · ${PRO ? "Professional" : "Proctored"} exam</small></div></div>
        <div class="xm-cand"><span>${esc(user.firstName + " " + (user.lastName || ""))}</span><small>Candidate</small></div>
        <div class="xm-count"><b id="xm-qn">1</b><span>/ ${Q.length}</span><small>Question</small></div>
        <div class="xm-timer" id="timer" role="timer"><span class="ring"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.5"/><circle id="tring" cx="18" cy="18" r="15.5"/></svg></span><div><b id="tleft">--:--</b><small>Time left</small></div></div>
        <div class="xm-actions"><button class="xm-btn" id="xm-review" type="button">${icon("grid")}Review</button><button class="xm-btn end" id="submit-side" type="button">End exam</button></div>
      </div></header>`;

    $("#main").innerHTML = `
      <div class="xm-wrap">
        <section class="xm-main">
          <div class="xm-qcard" id="qbox" aria-live="polite"></div>
          <div class="xm-nav">
            <button class="btn plain" id="prev" type="button">${icon("chevl")}Previous</button>
            <div class="xm-prog"><span id="xm-prog-t"></span><div class="bar"><i id="xm-prog-b"></i></div></div>
            <button class="btn" id="next" type="button">Next ${icon("chevr")}</button>
          </div>
        </section>
        <aside class="xm-rail">
          <div class="xm-cam ${noCam ? "off" : ""}" id="xm-cam">
            <video id="xm-v" muted playsinline autoplay></video>
            <div class="xm-cam-off">${icon("camera")}<span>${noCam ? "Demo mode · no camera" : "Connecting camera…"}</span></div>
            <span class="xm-rec"><i></i>REC</span>
            <span class="xm-face" id="xm-face"></span>
          </div>
          <ul class="xm-status" id="xm-status"></ul>
          <div class="xm-strikes" id="xm-strikes"></div>
          <div class="xm-navi">
            <div class="xm-navi-h"><b>Questions</b><div class="xm-filter" role="tablist">${[["all", "All"], ["todo", "Unanswered"], ["flag", "Marked"]].map(([k, l]) => `<button type="button" role="tab" data-f="${k}" aria-selected="${k === "all"}">${l}</button>`).join("")}</div></div>
            <div class="pal-grid xm-pal" id="pal"></div>
            <div class="xm-legend"><span><i class="a"></i>Answered</span><span><i class="f"></i>Marked</span><span><i class="c"></i>Current</span><span><i></i>Not answered</span></div>
          </div>
        </aside>
      </div>
      <div class="xm-toast" id="xm-toast" role="alert" hidden></div>`;

    /* ---------- Question pane ---------- */
    function draw() {
      const i = st.idx, q = Q[i], sec = sections.indexOf(q.s), struck = st.struck[i] || [];
      $("#xm-qn").textContent = i + 1;
      $("#qbox").style.setProperty("--fs", (17 + fontStep * 2) + "px");
      $("#qbox").innerHTML = `
        <div class="xm-qhead">
          <div><span class="qno">Question ${i + 1} of ${Q.length}</span>${PRO ? "" : `<span class="sec-label">Section ${sec + 1} of ${sections.length} · ${esc(q.s)}</span>`}</div>
          <div class="xm-tools">
            <div class="xm-size" role="group" aria-label="Text size"><button type="button" data-fs="-1" aria-label="Smaller text">A−</button><button type="button" data-fs="0" aria-label="Default text size">A</button><button type="button" data-fs="1" aria-label="Larger text">A+</button></div>
            <button class="flag-btn" id="flag" type="button" aria-pressed="${st.flags.includes(i)}">${icon("flag")}${st.flags.includes(i) ? "Marked for review" : "Mark for review"}</button>
          </div>
        </div>
        <h2>${esc(q.q.replace(/\s*\(Choose [A-Z]+\.\)$/, ""))}${q.multi ? ` <span class="choose">(Choose ${NUM[q.n]}.)</span>` : ""}</h2>
        ${q.code ? `<pre class="code">${esc(q.code)}</pre>` : ""}
        <div class="exam-opts" role="${q.multi ? "group" : "radiogroup"}" aria-label="Answer options">${q.o.map((o, k) => { const on = q.multi ? (st.answers[i] || []).includes(k) : st.answers[i] === k; return `<div class="xm-optrow ${struck.includes(k) ? "struck" : ""}"><label class="opt${q.multi ? " multi" : ""}"><input type="${q.multi ? "checkbox" : "radio"}" name="ans" value="${k}" ${on ? "checked" : ""}><span class="letter">${L[k]}</span><span class="txt">${esc(o)}</span></label><button type="button" class="xm-strike" data-strike="${k}" title="${struck.includes(k) ? "Restore this option" : "Rule out this option"}" aria-label="${struck.includes(k) ? "Restore" : "Rule out"} option ${L[k]}">${struck.includes(k) ? "↺" : "✕"}</button></div>`; }).join("")}</div>
        <div class="xm-qfoot">${q.multi ? `<span class="tiny muted" id="pick-note">${(st.answers[i] || []).length} of ${q.n} selected</span>` : `<span class="tiny muted">Tip: press ${L.slice(0, q.o.length).split("").join(", ")} to answer, ← → to move</span>`}${isAnswered(st.answers[i]) ? `<button class="link" id="clear" type="button">Clear answer</button>` : ""}</div>`;
      $$('input[name="ans"]').forEach(r => r.addEventListener("change", () => {
        if (q.multi) {
          let cur = [...(st.answers[i] || [])]; const v = +r.value;
          if (r.checked) { if (!cur.includes(v)) cur.push(v); if (cur.length > q.n) cur = cur.slice(-q.n); } else cur = cur.filter(x => x !== v);
          st.answers[i] = cur.length ? cur.sort((x, y) => x - y) : null;
        } else st.answers[i] = +r.value;
        if (st.struck[i]) st.struck[i] = st.struck[i].filter(k => !(q.multi ? (st.answers[i] || []).includes(k) : st.answers[i] === k));
        save(); draw();
      }));
      $$("[data-strike]").forEach(b => b.addEventListener("click", () => { const k = +b.dataset.strike, cur = st.struck[i] || []; st.struck[i] = cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]; save(); draw(); }));
      $$("[data-fs]").forEach(b => b.addEventListener("click", () => { const d = +b.dataset.fs; fontStep = d === 0 ? 0 : Math.max(-1, Math.min(3, fontStep + d)); SR.store.set("examFont", fontStep); draw(); }));
      $("#flag").addEventListener("click", () => { st.flags = st.flags.includes(i) ? st.flags.filter(x => x !== i) : [...st.flags, i]; save(); draw(); });
      const cl = $("#clear"); if (cl) cl.addEventListener("click", () => { st.answers[i] = null; save(); draw(); });
      $("#prev").disabled = i === 0;
      $("#next").innerHTML = i === Q.length - 1 ? `Review answers ${icon("arrow")}` : `Next ${icon("chevr")}`;
      const done = st.answers.filter(isAnswered).length;
      $("#xm-prog-t").textContent = `${done} of ${Q.length} answered${st.flags.length ? ` · ${st.flags.length} marked` : ""}`;
      $("#xm-prog-b").style.width = (done / Q.length * 100) + "%";
      pal();
    }
    function pal() {
      $("#pal").innerHTML = Q.map((_, k) => {
        const ans = isAnswered(st.answers[k]), fl = st.flags.includes(k);
        if ((filter === "todo" && ans) || (filter === "flag" && !fl)) return "";
        const cls = [ans ? "answered" : "", fl ? "flagged" : "", k === st.idx ? "current" : ""].join(" ");
        return `<button class="${cls}" data-go="${k}" type="button" aria-label="Question ${k + 1}${ans ? ", answered" : ""}${fl ? ", marked" : ""}">${k + 1}</button>`;
      }).join("") || `<p class="tiny muted" style="grid-column:1/-1">Nothing here.</p>`;
    }
    const go = (k) => { st.idx = Math.max(0, Math.min(Q.length - 1, k)); if (!st.visited.includes(st.idx)) st.visited.push(st.idx); save(); draw(); $(".xm-main").scrollTo && $(".xm-main").scrollTo({ top: 0 }); };
    $("#pal").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) go(+b.dataset.go); });
    $$("[data-f]").forEach(b => b.addEventListener("click", () => { filter = b.dataset.f; $$("[data-f]").forEach(x => x.setAttribute("aria-selected", String(x === b))); pal(); }));
    $("#prev").addEventListener("click", () => go(st.idx - 1));
    $("#next").addEventListener("click", () => st.idx === Q.length - 1 ? review() : go(st.idx + 1));
    $("#xm-review").addEventListener("click", review);
    $("#submit-side").addEventListener("click", confirmSubmit);
    document.addEventListener("keydown", e => {
      if ($(".modal-back") || $(".xm-over:not([hidden])") || e.target.tagName === "TEXTAREA" || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (/^[a-f]$/.test(k)) { const r = $$('input[name="ans"]')["abcdef".indexOf(k)]; if (r) { r.checked = r.type === "checkbox" ? !r.checked : true; r.dispatchEvent(new Event("change")); } }
      else if (e.key === "ArrowRight") go(st.idx + 1); else if (e.key === "ArrowLeft") go(st.idx - 1);
      else if (k === "m") $("#flag").click();
    });

    /* ---------- Review screen ---------- */
    function review() {
      const back = document.createElement("div"); back.className = "modal-back xm-review-back";
      const rows = (f) => Q.map((q, k) => ({ k, ans: isAnswered(st.answers[k]), fl: st.flags.includes(k) })).filter(r => f === "all" || (f === "todo" && !r.ans) || (f === "flag" && r.fl));
      const render = (f) => {
        const done = st.answers.filter(isAnswered).length;
        back.innerHTML = `<div class="modal xm-review" role="dialog" aria-modal="true" aria-labelledby="rv-h">
          <div class="xm-rv-head"><div><h2 id="rv-h">Review your answers</h2><p class="muted small">${done} of ${Q.length} answered · ${Q.length - done} unanswered · ${st.flags.length} marked for review</p></div><button class="xm-x" type="button" data-close aria-label="Close">${icon("x")}</button></div>
          <div class="xm-filter" role="tablist">${[["all", `All (${Q.length})`], ["todo", `Unanswered (${Q.length - done})`], ["flag", `Marked (${st.flags.length})`]].map(([k, l]) => `<button type="button" data-rf="${k}" aria-selected="${k === f}">${l}</button>`).join("")}</div>
          <div class="xm-rv-grid">${rows(f).map(r => `<button type="button" class="xm-rv-item ${r.ans ? "a" : ""} ${r.fl ? "f" : ""}" data-rgo="${r.k}"><b>${r.k + 1}</b><span>${r.ans ? "Answered" : "Not answered"}</span>${r.fl ? `<em>${icon("flag")}</em>` : ""}</button>`).join("") || `<p class="muted small">Nothing to show.</p>`}</div>
          <div class="btn-row" style="justify-content:space-between"><button class="btn plain" type="button" data-close>Back to the exam</button><button class="btn danger" type="button" id="rv-end">End exam and submit</button></div></div>`;
        $$("[data-rf]", back).forEach(b => b.addEventListener("click", () => render(b.dataset.rf)));
        $$("[data-rgo]", back).forEach(b => b.addEventListener("click", () => { back.remove(); go(+b.dataset.rgo); }));
        $$("[data-close]", back).forEach(b => b.addEventListener("click", () => back.remove()));
        $("#rv-end", back).addEventListener("click", () => { back.remove(); confirmSubmit(); });
      };
      render("all"); document.body.appendChild(back);
      back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    }

    /* ---------- Timer ---------- */
    let tt = null; const warned = {};
    function tick() {
      if (!st.start) return;
      const left = Math.max(0, limit - Math.floor((Date.now() - st.start) / 1000));
      $("#tleft").textContent = `${left >= 3600 ? Math.floor(left / 3600) + ":" : ""}${String(Math.floor(left % 3600 / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
      const ring = $("#tring"); ring.style.strokeDashoffset = (97.4 * (1 - left / limit)).toFixed(1);
      $("#timer").classList.toggle("low", left <= 300);
      [[900, "15 minutes left"], [300, "5 minutes left. Review your marked questions."], [60, "1 minute left. The exam submits automatically."]].forEach(([s, m]) => { if (left <= s && left > s - 5 && !warned[s]) { warned[s] = 1; toast(m, "time"); } });
      if (left === 0) { clearInterval(tt); submit(true); }
    }

    /* ---------- Proctoring ---------- */
    const MAX = MAX_STRIKES;
    const STAT = { camera: ["Camera", "camera"], face: ["Face", "user"], audio: ["Microphone", "bell"], focus: ["Focus", "eye"], fullscreen: ["Full screen", "grid"], online: ["Connection", "globe"] };
    function renderStatus(s) {
      const val = {
        camera: noCam ? ["warn", "Demo mode"] : s.camera ? ["ok", "On"] : ["bad", "Off"],
        face: noCam ? ["warn", "Not monitored"] : s.face === "ok" ? ["ok", s.detector === "ai" ? "Detected" : "On"] : s.face === "none" ? ["bad", "Not in view"] : s.face === "multi" ? ["bad", "Several people"] : s.face === "away" ? ["warn", "Looking away"] : s.face === "covered" ? ["bad", "Camera covered"] : ["wait", s.detector === "basic" ? "Basic checks" : "Starting…"],
        audio: s.audio === "noise" ? ["warn", "Noise detected"] : s.audio === "ok" ? ["ok", "Quiet"] : ["warn", "Not monitored"],
        focus: s.focus ? ["ok", "On exam"] : ["bad", "Away"],
        fullscreen: !document.fullscreenEnabled ? ["warn", "Unavailable"] : s.fullscreen ? ["ok", "On"] : ["bad", "Off"],
        online: s.online ? ["ok", "Online"] : ["bad", "Offline"]
      };
      $("#xm-status").innerHTML = Object.entries(STAT).map(([k, [t, ic]]) => `<li class="${val[k][0]}">${icon(ic)}<span>${t}</span><b>${val[k][1]}</b>${k === "audio" && s.level != null ? `<i class="lvl" style="--l:${(s.level * 100).toFixed(0)}%"></i>` : ""}</li>`).join("");
      const fb = $("#xm-face"); fb.className = "xm-face " + (val.face[0]); fb.textContent = noCam ? "" : val.face[1];
      if (document.fullscreenEnabled && st.start && !s.fullscreen && !submitted && !navLock) lock("fs"); else if (s.fullscreen && $("#xm-lock") && $("#xm-lock").dataset.kind === "fs") unlock();
      if (!s.online) banner(); else { const b = $("#xm-offline"); if (b) b.remove(); }
    }
    function renderStrikes() {
      const P = st.proctor || { strikes: 0, log: [] };
      $("#xm-strikes").innerHTML = `<div class="h"><b>Proctoring warnings</b><span>${P.strikes} / ${MAX}</span></div><div class="dots">${Array.from({ length: MAX }, (_, k) => `<i class="${k < P.strikes ? "on" : ""}"></i>`).join("")}</div>${P.log.length ? `<small>Last: ${esc(P.log[P.log.length - 1].label)} · ${fmtClock(P.log[P.log.length - 1].t)}</small>` : `<small>No issues so far</small>`}`;
    }
    const fmtClock = (t) => { const s = Math.max(0, Math.floor((t - (st.start || t)) / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
    let toastT;
    function toast(msg, kind = "minor", tip) {
      const t = $("#xm-toast"); t.className = "xm-toast " + kind; t.hidden = false;
      t.innerHTML = `${kind === "time" ? icon("clock") : icon("warn")}<div><b>${esc(msg)}</b>${tip ? `<span>${esc(tip)}</span>` : ""}</div>`;
      clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 6000);
    }
    let navLock = false;
    function lock(kind) {
      if ($("#xm-lock")) return;
      const o = document.createElement("div"); o.className = "xm-over"; o.id = "xm-lock"; o.dataset.kind = kind;
      o.innerHTML = `<div class="xm-over-card"><span class="ic">${icon("warn")}</span><h2>Return to full screen</h2><p>The exam is paused on screen until you go back to full screen. This has been logged as a proctoring warning. The timer keeps running.</p><button class="btn lg" type="button" id="xm-refs">Return to full screen</button></div>`;
      document.body.appendChild(o);
      $("#xm-refs").addEventListener("click", () => document.documentElement.requestFullscreen().then(unlock).catch(() => unlock()));
    }
    function unlock() { const o = $("#xm-lock"); if (o) o.remove(); }
    function banner() { if ($("#xm-offline")) return; document.body.insertAdjacentHTML("beforeend", `<div class="xm-offline" id="xm-offline">${icon("warn")}You're offline. Keep answering. Your answers are saved on this device and will be submitted when you're back online.</div>`); }
    function major(e, P) {
      const r = SR.PROCTOR_RULES[e.type] || {};
      if (P.strikes >= MAX) { P.terminated = true; save(); terminate(); return; }
      const back = document.createElement("div"); back.className = "modal-back xm-warn-back";
      back.innerHTML = `<div class="modal xm-warn" role="alertdialog" aria-modal="true" aria-labelledby="w-h"><span class="ic">${icon("warn")}</span><h2 id="w-h">${esc(e.label)}</h2><p>${esc(r.tip || "")}</p>
        <div class="xm-warn-count"><b>Warning ${P.strikes} of ${MAX}</b><span>At ${MAX} warnings the exam ends and goes to a proctor for review.</span><div class="dots">${Array.from({ length: MAX }, (_, k) => `<i class="${k < P.strikes ? "on" : ""}"></i>`).join("")}</div></div>
        <button class="btn" type="button" data-close>I understand, continue</button></div>`;
      $$(".xm-warn-back").forEach(x => x.remove()); document.body.appendChild(back);
      $("[data-close]", back).focus(); $("[data-close]", back).addEventListener("click", () => back.remove());
    }
    function terminate() {
      if (submitted) return;
      const o = document.createElement("div"); o.className = "xm-over"; o.innerHTML = `<div class="xm-over-card"><span class="ic bad">${icon("warn")}</span><h2>Exam ended by proctoring</h2><p>You reached ${MAX} serious proctoring warnings. Your answers so far are being submitted, and a proctor will review the recording.</p></div>`;
      document.body.appendChild(o); setTimeout(() => submit(false), 1800);
    }

    async function startProctoring() {
      const v = $("#xm-v");
      if (!noCam) {
        const m = await SR.getMedia();
        if (m.stream) { stream = m.stream; v.srcObject = stream; v.play().catch(() => {}); $("#xm-cam").classList.add("live"); }
        else { $("#xm-cam .xm-cam-off span").textContent = "Camera unavailable"; }
      }
      proc = SR.proctor({ video: v, stream, state: st, save, policy: { fullscreen: !!document.fullscreenEnabled },
        onStatus: renderStatus,
        onEvent: (e, P) => { if (noCam && /face|cam_/.test(e.type)) return; renderStrikes(); if (e.sev === "major") major(e, P); else toast(e.label, "minor", (SR.PROCTOR_RULES[e.type] || {}).tip); } });
      if (noCam) { st.proctor.noCamera = true; save(); }
      renderStrikes();
    }

    /* ---------- Begin gate: full screen + timer start ---------- */
    function begin() {
      const g = document.createElement("div"); g.className = "xm-over"; g.id = "xm-gate";
      const resume = !!st.start;
      g.innerHTML = `<div class="xm-over-card"><span class="ic">${SR.ficon ? SR.ficon("verified") : icon("check")}</span><h2>${resume ? "Resume your exam" : "You're checked in"}</h2>
        <p>${resume ? "Your answers are saved and the timer has kept running." : `${Q.length} questions · ${X.minutes} minutes. The timer starts when you click Begin. The exam runs in full screen with your camera on.`}</p>
        <ul class="xm-gate-list"><li>${icon("check")}Identity ${st.checkin && st.checkin.face ? "photo captured" : "check skipped (demo)"}</li><li>${icon("check")}Room checklist confirmed</li><li>${icon("check")}${noCam ? "Demo mode: camera not used" : "Camera and microphone ready"}</li></ul>
        <button class="btn lg" type="button" id="begin">${resume ? "Resume exam" : "Begin exam"} ${icon("arrow")}</button></div>`;
      document.body.appendChild(g);
      $("#begin").addEventListener("click", async () => {
        navLock = true;
        try { if (document.fullscreenEnabled && !document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch (e) {}
        navLock = false;
        if (!st.start) st.start = Date.now(); save();
        g.remove(); tick(); tt = setInterval(tick, 1000);
        startProctoring();
      });
    }

    addEventListener("beforeunload", e => { if (!submitted && SR.session.get(STATE_KEY) && st.start) { e.preventDefault(); e.returnValue = ""; } });

    function confirmSubmit() {
      const answered = st.answers.filter(isAnswered).length, flagged = st.flags.length;
      const m = document.createElement("div"); m.className = "modal-back";
      m.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt">
        <h2 id="mt">End the exam and submit?</h2>
        <p class="muted">You've answered <b style="color:var(--ink)">${answered} of ${Q.length}</b> questions${flagged ? ` and marked <b style="color:var(--ink)">${flagged}</b> for review` : ""}. ${answered < Q.length ? "Unanswered questions count as wrong." : ""} You can't change answers after submitting.</p>
        <div class="btn-row"><button class="btn plain" id="m-cancel">Keep working</button><button class="btn" id="m-ok">Submit exam</button></div></div>`;
      document.body.appendChild(m); $("#m-ok").focus();
      $("#m-cancel").addEventListener("click", () => m.remove());
      m.addEventListener("click", e => { if (e.target === m) m.remove(); });
      $("#m-ok").addEventListener("click", () => submit(false));
    }
    function submit(timeout) {
      if (submitted) return; submitted = true; clearInterval(tt);
      if (proc) proc.stop();
      const used = Math.min(limit, Math.floor((Date.now() - (st.start || Date.now())) / 1000));
      const correct = Q.map((q, k) => isRight(q, st.answers[k]) ? 1 : 0);
      const score = correct.reduce((a, b) => a + b, 0);
      const domains = {}; Q.forEach((q, k) => { const d = domains[q.s] = domains[q.s] || [0, 0]; d[0] += correct[k]; d[1]++; });
      const scaled = X.scaled ? scaledOf(score / Q.length) : null;
      const passed = X.scaled ? scaled >= X.scaled.pass : pct(score, Q.length) >= X.pass;
      const P = st.proctor || { log: [], snaps: [], strikes: 0 };
      const proctor = { log: P.log, snaps: P.snaps.slice(0, 12), strikes: P.strikes, terminated: !!P.terminated, noCamera: !!(st.checkin && st.checkin.noCamera) || !stream, checkin: st.checkin || null, started: st.start };
      const attempt = { date: Date.now(), score, total: Q.length, time: `${String(Math.floor(used / 60)).padStart(2, "0")}:${String(used % 60).padStart(2, "0")}`, answers: correct, flagged: P.log.some(e => e.sev === "major"), domains, scaled, passed, proctor };
      const integ = SR.integrity(proctor);
      attempt.hold = passed && (integ.verdict === "review" || integ.verdict === "terminated") && !proctor.noCamera;
      const all = SR.store.get("attempts", {}) || {}; const list = all[c.id] = [...(all[c.id] || []), attempt];
      // keep evidence for the latest 5 attempts only, so storage stays small
      list.slice(0, -5).forEach(a => { if (a.proctor) { a.proctor.snaps = []; if (a.proctor.checkin) a.proctor.checkin = { noCamera: a.proctor.checkin.noCamera }; } });
      SR.store.set("attempts", all);
      const certId = passed && !attempt.hold ? SR.issueCertificate(c, attempt) : null;
      SR.session.set("lastResult", { cert: c.id, given: st.answers, pick: st.pick, timeout, certId });
      SR.session.del(STATE_KEY); SR.session.del("checkin_" + c.id);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      location.href = "exam-result.html#" + c.id;
    }
    draw(); renderStrikes();
    renderStatus({ camera: false, face: null, audio: null, focus: true, fullscreen: !!document.fullscreenElement, online: navigator.onLine });
    begin();
    return;
  }

  /* ================= Result ================= */
  if (page === "result") {
    header(`<a class="btn plain sm" href="${hub}">${icon("arrowl")}Back to Hub</a>`);
    const attempts = ((SR.store.get("attempts", {}) || {})[c.id]) || [];
    const a = attempts[attempts.length - 1];
    if (!a) { location.replace(hub); return; }
    const last = SR.session.get("lastResult");
    const given = last && last.cert === c.id ? last.given : null;
    if (BANK && last && last.cert === c.id && last.pick) Q = fromPick(last.pick);
    const p = pct(a.score, a.total), pass = SR.examPassed(c, a);
    const grade = pass ? ((a.scaled ? a.scaled >= 900 : p >= 80) ? "Distinction" : "Pass") : "Below pass mark";
    const doms = a.domains || {};
    const domHTML = Object.keys(doms).length ? `<div class="dom-report"><h3>${PRO ? "Performance by domain" : "Performance by section"}</h3>${Object.entries(doms).map(([d, [r, t]]) => { const dp = pct(r, t), ok = dp >= 70; return `<div class="dr"><div class="dr-h"><b>${esc(d)}</b><span class="pill ${ok ? "green" : "amber"}">${ok ? "Meets competencies" : "Needs improvement"}</span></div><div class="dr-bar"><i style="width:${dp}%" class="${ok ? "ok" : ""}"></i></div><span class="tiny muted">${r} of ${t} correct</span></div>`; }).join("")}</div>` : "";
    const retake = !pass && SR.retakeAt(c);
    const cert = (SR.store.get("certificates", []) || []).find(x => x.ref === c.id);
    const repHTML = SR.proctorReportHTML ? SR.proctorReportHTML(a, { open: false }) : "";
    const held = pass && a.hold;

    $("#main").innerHTML = `
    <section class="result-wrap band">
      <div class="result-deco" aria-hidden="true">${[[-170, 717, 412, 412, "50%", "#fff, #728aff 80%, #4e6cff"], [-170, 997, 171, 389], [-170, 845, 273, 274, "50%"], [316, 848, 150, 153], [1593, 85, 138, 442], [1542, 187, 140, 140, "50%"], [1662, 306, 213, 484], [1755, 335, 233, 233, "50%", "#4e6cff, #728aff 20%, #fff"]]
        .map(([x, y, w, h, r = "0", g]) => `<span class="cshape" style="left:${(x / 17.28).toFixed(2)}%;top:${y - 92}px;width:${w}px;height:${h}px;border-radius:${r};${g ? `background:conic-gradient(from 135deg, ${g})` : ""}"></span>`).join("")}</div>
      ${pass && !held ? `<canvas id="confetti" aria-hidden="true"></canvas>` : ""}
      <div class="result-card ${pass ? "pass" : "fail"}">
        <span class="pill ${pass ? "green" : "red"}" style="justify-self:center;font-size:13px;padding:6px 14px">${pass ? "PASSED" : "FAILED"}</span>
        ${a.scaled ? `<div><div class="big">${a.scaled} <small>/ ${X.scaled.max}</small></div><div class="grade">Scaled score · pass mark ${X.scaled.pass} · ${grade}</div></div>` : `<div><div class="big">${a.score} <small>/ ${a.total}</small></div><div class="grade">${p}% Score · ${grade}</div></div>`}
        ${last && last.timeout ? `<div class="alert info">${icon("clock")}<span>Time ran out, so your exam was submitted automatically.</span></div>` : ""}
        ${held ? `<div class="warn-banner">${icon("warn")}<span><b>Result under review.</b> The proctoring system flagged this attempt. A proctor will review the recording within 48 hours, and we'll email you when your certificate is released.</span></div>` : ""}
        <div class="r-stats"><div><b>${a.time}</b><span>Time Taken</span></div><div><b>${p}%</b><span>Accuracy</span></div><div><b style="color:var(--success-ink)">${a.score}</b><span>Correct</span></div><div><b style="color:var(--danger)">${a.total - a.score}</b><span>Wrong</span></div></div>
        ${domHTML}
        ${PRO ? "" : `<div class="breakdown"><h3>Per Question Breakdown</h3><div class="bd-grid">${a.answers.map((x, i) => `<span class="${x ? "ok" : given && given[i] === null ? "skip" : "no"}" title="Question ${i + 1}: ${x ? "correct" : given && given[i] === null ? "not answered" : "wrong"}">${x ? "✓" : "✕"}</span>`).join("")}</div></div>`}
        ${repHTML}
        ${held ? `<a class="btn ghost block" href="${hub}">Back to the certification hub</a>`
        : pass ? `<p style="color:var(--success-ink);font-weight:600">🎉 You passed! Your certificate is now ready.</p>
          <a class="btn lg block" href="certificate.html#${cert ? cert.id : ""}">${icon("award")}Claim Your Certificate</a>
          <a class="btn ghost block" href="exam-rules.html#${c.id}">Retake to improve your score ${icon("arrow")}</a>
          <p class="tiny muted">Your certificate will be generated with your name and score.</p>`
        : PRO ? `<p class="muted">You need ${X.scaled.pass} to pass. Focus on the domains marked “Needs improvement”.${retake ? ` You can retake from <b>${fmtDate(retake, { day: "numeric", month: "long" })}</b>.` : ""}</p>
          <a class="btn lg block" href="mock-test.html#${c.id}">${icon("quiz")}Take the practice exam</a>`
        : `<p class="muted">You need ${X.pass}% to pass. Review the questions you missed, then try again. There's no limit on attempts.</p>
          <a class="btn lg block" href="exam-rules.html#${c.id}">${icon("retry")}Retake Exam</a>
          <a class="btn ghost block" href="${hub}">Review study modules</a>`}
        ${PRO ? `<p class="tiny muted" style="text-align:left">To protect the exam, individual questions and answers aren't shown after a professional exam. The practice exam explains every answer.</p>` : ""}
        ${given && !PRO ? `<details class="acc" style="text-align:left"><summary style="padding:12px 0">Review your answers ${icon("chev")}</summary><div class="stack" style="gap:10px">${Q.map((q, i) => `
          <div class="review-q"><b>${i + 1}. ${esc(q.q)}</b>${q.code ? `<pre class="code" style="font-size:12.5px">${esc(q.code)}</pre>` : ""}
          <div class="ans">${given[i] === q.a ? `<span class="pill green">✓ ${esc(q.o[q.a])}</span>` : `${given[i] === null ? `<span class="pill grey">Not answered</span>` : `<span class="pill red">✕ ${esc(q.o[given[i]])}</span>`}<span class="pill green">Correct: ${esc(q.o[q.a])}</span>`}</div></div>`).join("")}</div></details>` : ""}
      </div>
    </section>`;

    // Confetti (skipped for reduced motion)
    const cv = $("#confetti");
    if (cv && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const ctx = cv.getContext("2d"); const fit = () => { cv.width = cv.offsetWidth; cv.height = cv.offsetHeight; }; fit(); addEventListener("resize", fit);
      const cols = ["#3c59c8", "#8a9dff", "#3fb877", "#f2a31b", "#e2445c", "#7a4fe0"];
      const bits = Array.from({ length: 140 }, () => ({ x: Math.random() * cv.width, y: -Math.random() * cv.height, r: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], vy: 1.5 + Math.random() * 2.5, vx: -1 + Math.random() * 2, a: Math.random() * 6, va: -.1 + Math.random() * .2 }));
      let frames = 0;
      (function loop() { ctx.clearRect(0, 0, cv.width, cv.height); bits.forEach(b => { b.y += b.vy; b.x += b.vx; b.a += b.va; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.c; ctx.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2); ctx.restore(); }); if (++frames < 420) requestAnimationFrame(loop); else ctx.clearRect(0, 0, cv.width, cv.height); })();
    }
  }
})();
