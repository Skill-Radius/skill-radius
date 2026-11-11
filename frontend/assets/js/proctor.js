/* =====================================================================
   SkillRadius — browser proctoring engine
   Watches the candidate during a certification exam and keeps an evidence
   log the result page and the admin review queue read back.

   What it monitors
   · Camera: face present, more than one face, looking away, camera covered,
     camera disconnected (face detection runs on the device with face-api.js;
     no video ever leaves the browser in this demo)
   · Microphone: sustained talking or noise
   · Focus: tab switches, leaving the window, exiting full screen
   · Integrity: copy/paste/cut, right-click, print, developer tools, going offline
   · Evidence: small webcam snapshots at start, on every major event and
     every few minutes

   → In production, stream events and snapshots to the server as they happen
     (POST /api/proctoring/events) and let a human proctor review flagged
     attempts. Detection here is advisory, never the final decision.
===================================================================== */
(function () {
  const VENDOR = "assets/vendor/face-api/";
  const RULES = {
    no_face:      { sev: "major", label: "No face in view",            tip: "Stay in front of the camera." },
    multi_face:   { sev: "major", label: "More than one person in view", tip: "Only you may be in the room." },
    look_away:    { sev: "minor", label: "Looking away from the screen", tip: "Keep your eyes on the exam." },
    cam_covered:  { sev: "major", label: "Camera covered or too dark",  tip: "Uncover the camera and turn on a light." },
    cam_lost:     { sev: "major", label: "Camera disconnected",         tip: "Reconnect your camera." },
    noise:        { sev: "minor", label: "Talking or noise detected",   tip: "Keep the room quiet." },
    tab_hidden:   { sev: "major", label: "Left the exam tab",           tip: "Stay on this tab until you submit." },
    blur:         { sev: "minor", label: "Exam window lost focus",      tip: "Keep the exam window active." },
    fs_exit:      { sev: "major", label: "Exited full screen",          tip: "The exam must stay in full screen." },
    clipboard:    { sev: "minor", label: "Copy or paste attempted",     tip: "Copying and pasting are disabled." },
    context:      { sev: "minor", label: "Right-click attempted",       tip: "Right-click is disabled." },
    shortcut:     { sev: "minor", label: "Blocked keyboard shortcut",   tip: "Printing, saving and developer tools are disabled." },
    offline:      { sev: "minor", label: "Internet connection lost",    tip: "Your answers are saved on this device." },
    resize:       { sev: "minor", label: "Window resized",              tip: "Keep the exam window maximised." },
    no_camera:    { sev: "major", label: "Exam started without a camera", tip: "A camera is required for certified results." }
  };
  SR.PROCTOR_RULES = RULES;

  let faceapiP = null;
  const addScript = (src) => new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.async = true; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
  /* Weights ship inside face-models.js (not fetched as .bin files), so the
     models also load when the site is opened straight from disk (file://). */
  function loadNet(fa, net, m) {
    const bin = atob(m.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    net.loadFromWeightMap(fa.tf.io.decodeWeights(u8.buffer, m.weights));
  }
  function loadFaceApi() {
    if (faceapiP) return faceapiP;
    faceapiP = new Promise((res) => {
      setTimeout(() => res(null), 25000);
      (async () => {
        try {
          if (!window.faceapi) await addScript(VENDOR + "face-api.js");
          if (!window.SR_FACE_MODELS) await addScript(VENDOR + "face-models.js");
          const fa = window.faceapi, M = window.SR_FACE_MODELS;
          if (fa.tf && fa.tf.ready) await fa.tf.ready();
          if (!fa.nets.tinyFaceDetector.isLoaded) loadNet(fa, fa.nets.tinyFaceDetector, M.tiny);
          try { if (!fa.nets.faceLandmark68TinyNet.isLoaded) loadNet(fa, fa.nets.faceLandmark68TinyNet, M.lm); } catch (e) { /* landmarks optional */ }
          res(fa);
        } catch (e) { console.warn("Face model unavailable:", e && e.message); res(null); }
      })();
    });
    return faceapiP;
  }
  SR.loadFaceApi = loadFaceApi;

  /* Ask for camera + microphone. Resolves { stream, error } (never rejects). */
  SR.getMedia = async (opts = {}) => {
    if (!window.isSecureContext) return { error: "insecure" };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { error: "unsupported" };
    /* Embedded in a frame that doesn't allow the camera (e.g. a preview window) */
    const pol = document.permissionsPolicy || document.featurePolicy;
    if (pol && pol.allowsFeature && !pol.allowsFeature("camera")) return { error: "blocked" };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: opts.audio === false ? false : { echoCancellation: true, noiseSuppression: false } });
      return { stream };
    } catch (e) {
      if (opts.audio !== false) { // retry video-only so a missing mic doesn't block the camera
        try { const stream = await navigator.mediaDevices.getUserMedia({ video: true }); return { stream, error: "no_mic" }; } catch (e2) { /* fall through */ }
      }
      const n = e && e.name;
      return { error: n === "NotAllowedError" || n === "SecurityError" ? (window.top !== window.self ? "blocked" : "denied") : n === "NotFoundError" || n === "OverconstrainedError" ? "no_device" : n === "NotReadableError" || n === "AbortError" ? "busy" : n === "NotSupportedError" ? "unsupported" : "blocked" };
    }
  };

  /* Small JPEG of the current video frame */
  SR.snapshot = (video, w = 192) => {
    try {
      if (!video || !video.videoWidth) return null;
      const h = Math.round(w * video.videoHeight / video.videoWidth), c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(video, 0, 0, w, h); return c.toDataURL("image/jpeg", .62);
    } catch (e) { return null; }
  };

  /* Average brightness + detail (variance) of a frame; used to spot a covered or dark camera */
  function frameStats(video) {
    const c = frameStats.c || (frameStats.c = document.createElement("canvas")); c.width = 64; c.height = 48;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(video, 0, 0, 64, 48);
    const d = x.getImageData(0, 0, 64, 48).data; let sum = 0, sq = 0, n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { const l = d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114; sum += l; sq += l * l; }
    const mean = sum / n; return { mean, sd: Math.sqrt(Math.max(0, sq / n - mean * mean)) };
  }

  /* Detect faces in one frame → { count, lookingAway, box } or null when no detector is available */
  async function detect(video) {
    const fa = window.faceapi && window.faceapi.nets.tinyFaceDetector.isLoaded ? window.faceapi : null;
    if (fa) {
      const opts = new fa.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: .45 });
      const withLm = fa.nets.faceLandmark68TinyNet.isLoaded;
      const res = withLm ? await fa.detectAllFaces(video, opts).withFaceLandmarks(true) : await fa.detectAllFaces(video, opts);
      let lookingAway = false, box = null;
      if (res.length === 1) {
        const det = res[0].detection || res[0]; box = det.box;
        if (withLm && res[0].landmarks) {
          // Head turn: compare the nose tip with the midpoint between the eyes, relative to eye distance
          const lm = res[0].landmarks, nose = lm.getNose()[3], le = lm.getLeftEye(), re = lm.getRightEye();
          const cx = (a) => a.reduce((s, p) => s + p.x, 0) / a.length, cy = (a) => a.reduce((s, p) => s + p.y, 0) / a.length;
          const ex = (cx(le) + cx(re)) / 2, ey = (cy(le) + cy(re)) / 2, dist = Math.abs(cx(re) - cx(le)) || 1;
          const yaw = (nose.x - ex) / dist, pitch = (nose.y - ey) / dist;
          lookingAway = Math.abs(yaw) > .38 || pitch < .25 || pitch > 1.25;
        }
      }
      return { count: res.length, lookingAway, box };
    }
    if ("FaceDetector" in window) {
      try { const fd = detect.fd || (detect.fd = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 })); const r = await fd.detect(video); return { count: r.length, lookingAway: false, box: r[0] && r[0].boundingBox }; } catch (e) { /* unsupported in this browser */ }
    }
    return null;
  }
  SR.detectFaces = detect;

  /* ---------------- Live session ----------------
     const p = SR.proctor({ video, stream, state, save, onEvent, onStatus, policy })
     state.proctor holds { log: [], snaps: [], strikes } and is persisted by save() */
  SR.proctor = function (o) {
    const P = o.state.proctor = o.state.proctor || { log: [], snaps: [], strikes: 0, started: Date.now() };
    const video = o.video, stream = o.stream;
    const status = { camera: !!stream, face: null, audio: null, focus: true, fullscreen: !!document.fullscreenElement, online: navigator.onLine, detector: "loading" };
    const timers = [], cleanups = [];
    const on = (t, ev, fn, opt) => { t.addEventListener(ev, fn, opt); cleanups.push(() => t.removeEventListener(ev, fn, opt)); };
    let stopped = false;
    const last = {};
    const emitStatus = () => o.onStatus && o.onStatus({ ...status });

    function record(type, extra = {}) {
      if (stopped) return;
      const r = RULES[type] || { sev: "minor", label: type }, now = Date.now();
      // de-duplicate: the same event type at most once every 8 seconds
      if (last[type] && now - last[type] < 8000) return; last[type] = now;
      const e = { t: now, type, sev: r.sev, label: r.label };
      if (r.sev === "major" && video && stream && P.snaps.length < 12) { const s = SR.snapshot(video); if (s) { P.snaps.push({ t: now, img: s, why: r.label }); e.snap = P.snaps.length - 1; } }
      if (r.sev === "major") P.strikes++;
      Object.assign(e, extra); P.log.push(e); o.save();
      o.onEvent && o.onEvent(e, P);
    }

    /* Camera + face */
    let noFaceSince = 0, multiSince = 0, awaySince = 0, darkSince = 0;
    async function faceTick() {
      if (stopped || !video || !stream) return;
      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState === "ended") { status.camera = false; emitStatus(); record("cam_lost"); return; }
      if (!video.videoWidth || video.paused) return;
      const st = frameStats(video), now = Date.now();
      if (st.mean < 18 || st.sd < 6) { darkSince = darkSince || now; if (now - darkSince > 3000) { status.face = "covered"; emitStatus(); record("cam_covered"); } return; } else darkSince = 0;
      let r = null; try { r = await detect(video); } catch (e) { r = null; }
      if (!r) { status.detector = "basic"; status.face = "unknown"; emitStatus(); return; }
      status.detector = "ai";
      if (r.count === 0) { noFaceSince = noFaceSince || now; multiSince = 0; awaySince = 0; status.face = "none"; if (now - noFaceSince > 4000) record("no_face"); }
      else if (r.count > 1) { multiSince = multiSince || now; noFaceSince = 0; status.face = "multi"; if (now - multiSince > 2000) record("multi_face", { faces: r.count }); }
      else { noFaceSince = 0; multiSince = 0; if (r.lookingAway) { awaySince = awaySince || now; status.face = "away"; if (now - awaySince > 5000) record("look_away"); } else { awaySince = 0; status.face = "ok"; } }
      emitStatus();
    }

    /* Microphone level: flag sustained sound above the room's baseline */
    let ac = null, analyser = null, buf = null, base = 0, loudSince = 0, calib = [];
    if (stream && stream.getAudioTracks().length) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)(); const src = ac.createMediaStreamSource(stream);
        analyser = ac.createAnalyser(); analyser.fftSize = 1024; src.connect(analyser); buf = new Float32Array(analyser.fftSize);
        status.audio = "ok";
      } catch (e) { status.audio = null; }
    }
    function audioTick() {
      if (stopped || !analyser) return;
      if (ac.state === "suspended") ac.resume().catch(() => {});
      analyser.getFloatTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const rms = Math.sqrt(s / buf.length), db = 20 * Math.log10(rms + 1e-8), now = Date.now();
      if (calib.length < 12) { calib.push(db); base = calib.reduce((a, b) => a + b, 0) / calib.length; return; }
      status.level = Math.max(0, Math.min(1, (db + 70) / 50));
      const loud = db > Math.max(base + 18, -38);
      if (loud) { loudSince = loudSince || now; status.audio = "noise"; if (now - loudSince > 2500) record("noise"); }
      else { loudSince = 0; status.audio = "ok"; base = base * .995 + db * .005; }
      emitStatus();
    }

    /* Focus, full screen, clipboard, shortcuts, network */
    on(document, "visibilitychange", () => { if (document.hidden) { status.focus = false; emitStatus(); record("tab_hidden"); } else { status.focus = true; emitStatus(); } });
    on(window, "blur", () => { setTimeout(() => { if (!document.hidden && !document.hasFocus()) { status.focus = false; emitStatus(); record("blur"); } }, 400); });
    on(window, "focus", () => { status.focus = true; emitStatus(); });
    on(document, "fullscreenchange", () => { status.fullscreen = !!document.fullscreenElement; emitStatus(); if (!document.fullscreenElement && o.policy && o.policy.fullscreen) record("fs_exit"); });
    ["copy", "cut", "paste"].forEach(ev => on(document, ev, e => { e.preventDefault(); record("clipboard"); }));
    on(document, "contextmenu", e => { e.preventDefault(); record("context"); });
    on(document, "dragstart", e => e.preventDefault());
    on(document, "keydown", e => {
      const k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
      const blocked = (mod && ["c", "v", "x", "p", "s", "u", "a", "f"].includes(k)) || k === "f12" || k === "printscreen" || (mod && e.shiftKey && ["i", "j", "c", "k"].includes(k)) || (e.altKey && k === "tab");
      if (blocked) { e.preventDefault(); e.stopPropagation(); record(["c", "v", "x"].includes(k) && mod ? "clipboard" : "shortcut", { key: (mod ? "Ctrl+" : "") + (e.shiftKey ? "Shift+" : "") + e.key }); }
    }, true);
    on(window, "offline", () => { status.online = false; emitStatus(); record("offline"); });
    on(window, "online", () => { status.online = true; emitStatus(); });
    let rsT; on(window, "resize", () => { clearTimeout(rsT); rsT = setTimeout(() => { if (!document.fullscreenElement && (outerWidth < screen.availWidth * .8)) record("resize"); }, 800); });

    /* Loops */
    if (stream) { loadFaceApi().then(() => emitStatus()); timers.push(setInterval(faceTick, 1200)); }
    if (analyser) timers.push(setInterval(audioTick, 250));
    // periodic evidence: one snapshot at the start, then every 3 minutes
    const snapNow = (why) => { if (!video || !stream || P.snaps.length >= 12) return; const s = SR.snapshot(video); if (s) { P.snaps.push({ t: Date.now(), img: s, why }); o.save(); } };
    if (stream) { const first = () => { if (video.videoWidth) { if (!P.snaps.some(s => s.why === "Exam start")) snapNow("Exam start"); } else setTimeout(first, 500); }; first(); timers.push(setInterval(() => snapNow("Routine check"), 180000)); }
    if (!stream) record("no_camera");
    emitStatus();

    return {
      status: () => ({ ...status }),
      record,
      stop() { stopped = true; timers.forEach(clearInterval); cleanups.forEach(f => f()); try { ac && ac.close(); } catch (e) {} if (stream) stream.getTracks().forEach(t => t.stop()); }
    };
  };

  /* Proctoring report block (result page and admin review) */
  SR.proctorReportHTML = (a, opts = {}) => {
    const pr = a && a.proctor; if (!pr) return "";
    const esc = SR.esc, icon = SR.icon, I = SR.integrity(pr);
    const t0 = pr.started || (pr.log[0] && pr.log[0].t) || a.date;
    const clock = (t) => { const s = Math.max(0, Math.floor((t - t0) / 1000)); return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
    const counts = {}; pr.log.forEach(e => counts[e.label] = (counts[e.label] || 0) + 1);
    const ck = pr.checkin || {};
    return `<details class="pr-report ${I.verdict}" ${opts.open ? "open" : ""}>
      <summary><span class="pr-v">${icon(I.verdict === "clear" ? "shield" : "warn")}<span><b>Proctoring: ${esc(I.label)}</b><small>${pr.noCamera ? "Camera not used (demo mode)" : `Integrity score ${I.score}/100`} · ${I.majors || 0} serious · ${I.minors || 0} minor</small></span></span>${icon("chev")}</summary>
      <div class="pr-body">
        ${pr.noCamera ? `<p class="pr-note">This attempt ran in demo mode without a camera. In production, attempts without camera proctoring are held for review and don't issue a certificate.</p>` : ""}
        ${ck.face || ck.id || ck.room ? `<div class="pr-id"><h4>Check-in</h4><div class="pr-shots">${[["face", "Face"], ["id", "Photo ID"], ["room", "Room scan"]].filter(([k]) => ck[k]).map(([k, l]) => `<figure><img src="${ck[k]}" alt="${l}"><figcaption>${l}</figcaption></figure>`).join("")}</div></div>` : ""}
        ${Object.keys(counts).length ? `<div class="pr-sum"><h4>Events</h4><ul>${Object.entries(counts).map(([l, n]) => `<li><span>${esc(l)}</span><b>${n}×</b></li>`).join("")}</ul></div>` : `<p class="pr-note ok">${icon("check")}No proctoring events were recorded during this exam.</p>`}
        ${pr.log.length ? `<div class="pr-tl"><h4>Timeline</h4><ol>${pr.log.slice(-40).map(e => `<li class="${e.sev}"><time>${clock(e.t)}</time><span>${esc(e.label)}${e.key ? ` <small>(${esc(e.key)})</small>` : ""}</span><em>${e.sev === "major" ? "Serious" : "Minor"}</em></li>`).join("")}</ol></div>` : ""}
        ${(pr.snaps || []).length ? `<div class="pr-ev"><h4>Evidence snapshots</h4><div class="pr-shots">${pr.snaps.map(sn => `<figure><img src="${sn.img}" alt=""><figcaption>${clock(sn.t)} · ${esc(sn.why)}</figcaption></figure>`).join("")}</div></div>` : ""}
      </div></details>`;
  };

  /* Integrity verdict from a proctoring log */
  SR.integrity = (pr) => {
    if (!pr) return { verdict: "none", label: "Not proctored", score: null };
    const majors = pr.log.filter(e => e.sev === "major").length, minors = pr.log.filter(e => e.sev === "minor").length;
    const score = Math.max(0, 100 - majors * 12 - minors * 3);
    if (pr.terminated) return { verdict: "terminated", label: "Exam ended by proctoring", score, majors, minors };
    if (pr.review === "cleared") return { verdict: "clear", label: "Cleared after review", score, majors, minors };
    if (pr.review === "invalidated") return { verdict: "invalid", label: "Result invalidated", score, majors, minors };
    if (majors >= 2 || score < 70 || pr.noCamera) return { verdict: "review", label: "Flagged for review", score, majors, minors };
    return { verdict: "clear", label: "No issues found", score, majors, minors };
  };
})();
