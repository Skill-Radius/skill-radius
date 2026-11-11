/* =====================================================================
   SkillRadius — shared UI
   Header, footer, auth/enrolment state, card renderers and helpers.
   Load order on every page: data.js → ui.js → page script.

   State is kept in localStorage for this static build so the whole flow
   (sign up → enrol → learn → exam → certificate) works without a server.
   Swap SR.store / SR.auth for real API calls when the backend exists.
===================================================================== */
(function () {
  const SR = window.SR = window.SR || {};

  /* ---------- Helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => n === 0 ? "Free" : "₹" + Number(n).toLocaleString("en-IN");
  const off = (p, m) => m ? Math.round((1 - p / m) * 100) : 0;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const initials = (n) => String(n).replace(/^Dr\.\s*/, "").split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase();
  const fmtDate = (d, o = { day: "numeric", month: "short", year: "numeric" }) => new Date(d).toLocaleDateString("en-IN", o);
  const stars = (r) => { const f = Math.round(r); return "★".repeat(f) + "☆".repeat(5 - f); };
  const hashId = () => decodeURIComponent(location.hash.slice(1));
  /* Exam results: professional exams use a scaled score and a retake wait */
  SR.examPassed = (c, a) => a && (typeof a.passed === "boolean" ? a.passed : c && c.exam.scaled && a.scaled != null ? a.scaled >= c.exam.scaled.pass : Math.round(a.score / a.total * 100) >= ((c && c.exam.pass) || 60));
  SR.examScore = (c, a) => a.scaled != null && c && c.exam.scaled ? `${a.scaled}/${c.exam.scaled.max}` : Math.round(a.score / a.total * 100) + "%";
  /* Issue (or upgrade) the certificate for a passed exam attempt; returns the certificate ID */
  SR.issueCertificate = (c, a) => {
    const certs = SR.store.get("certificates", []) || [];
    const p = Math.round(a.score / a.total * 100), grade = (a.scaled != null ? a.scaled >= 900 : p >= 80) ? "Distinction" : "Pass";
    const label = a.scaled != null && c.exam.scaled ? `${a.scaled}/${c.exam.scaled.max} · ${grade}` : `${p}% · ${grade}`;
    const prev = certs.find(x => x.ref === c.id);
    if (prev) { const old = parseInt(prev.score); if ((a.scaled != null ? a.scaled : p) > old) { prev.score = label; prev.issued = Date.now(); } SR.store.set("certificates", certs); return prev.id; }
    const id = `CERT-SR-${c.code.replace(/^DIC-/, "").replace(/-?\d+.*$/, "").replace(/\d+/, "")}-${new Date().getFullYear()}-${String(certs.length + 2).padStart(3, "0")}`;
    certs.push({ id, kind: "Certification", ref: c.id, title: c.title, issued: Date.now(), validYears: c.validity, score: label });
    SR.store.set("certificates", certs); return id;
  };
  SR.passMark = (c) => c.exam.scaled ? `${c.exam.scaled.pass}/${c.exam.scaled.max}` : c.exam.pass + "%";
  SR.retakeAt = (c) => {
    if (!c.exam.retakeDays) return 0;
    const at = ((SR.store.get("attempts", {}) || {})[c.id]) || [], last = at[at.length - 1];
    if (!last || SR.examPassed(c, last)) return 0;
    const t = last.date + c.exam.retakeDays * 864e5; return t > Date.now() ? t : 0;
  };
  SR.money = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
  Object.assign(SR, { $, $$, esc, inr, off, pct, initials, fmtDate, stars, hashId });

  /* ---------- Icons ---------- */
  const P = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    grid: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    book: '<rect x="7" y="3" width="14" height="14" rx="2"/><path d="M3 7v12a2 2 0 0 0 2 2h12"/><path d="M12 7.5v5l4-2.5z" fill="currentColor"/>',
    training: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><circle cx="12" cy="9" r="2.2"/><path d="M8.5 14a3.6 3.6 0 0 1 7 0"/>',
    cert: '<circle cx="12" cy="9" r="6"/><path d="M8.5 13.8L7 22l5-3 5 3-1.5-8.2"/>',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    userc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5a6.5 6.5 0 0 1 11 0"/>',
    logout: '<path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/><path d="M10 12h10M17 9l3 3-3 3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    chevr: '<path d="M9 6l6 6-6 6"/>',
    chevl: '<path d="M15 6l-6 6 6 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowl: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    ext: '<path d="M7 17L17 7M8 7h9v9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    checkc: '<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M8 12.5l3 3 5-6" stroke="#fff"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/>',
    playf: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    notes: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    articles: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    cc: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 10.5a2 2 0 1 0 0 3M17 10.5a2 2 0 1 0 0 3"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M9 14.5L7.5 22 12 19.5 16.5 22 15 14.5"/>',
    star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9z"/>',
    pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 6 4.5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    filter: '<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    noTab: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M4 4l16 16"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
    bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
    retry: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    upi: '<path d="M7 4l5 16M12 4l5 16"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    heart: '<path d="M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-5 5-5 8-1-1-2-2-2-4-2 2-2 5-2 8 0 4 3 7 7 7z"/>',
    live: '<circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
    calcheck: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5h.01"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.9.8c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'
  };
  /* Material Symbols (outlined) used in the Figma file, drawn as filled paths */
  const M = {
    home: "M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z",
    grid: "M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Zm80-400h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Zm160-320Zm240-160Zm0 240ZM360-280Z",
    cert: "m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm34-102 102-44 104 44 56-96 110-26-10-112 74-84-74-86 10-112-110-24-58-96-102 44-104-44-56 96-110 24 10 112-74 86 74 84-10 114 110 24 58 96Zm102-318Zm-42 142 226-226-56-58-170 170-86-84-56 56 142 142Z",
    book: "M360-400l280-180-280-180v360ZM320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z",
    training: "M840-120v-640H120v320H40v-320q0-33 23.5-56.5T120-840h720q33 0 56.5 23.5T920-760v560q0 33-23.5 56.5T840-120ZM360-400q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0-80q33 0 56.5-23.5T440-560q0-33-23.5-56.5T360-640q-33 0-56.5 23.5T280-560q0 33 23.5 56.5T360-480ZM40-80v-112q0-34 17.5-62.5T104-298q62-31 126-46.5T360-360q66 0 130 15.5T616-298q29 15 46.5 43.5T680-192v112H40Zm80-80h480v-32q0-11-5.5-20T580-226q-54-27-109-40.5T360-280q-56 0-111 13.5T140-226q-9 5-14.5 14t-5.5 20v32Zm240-400Zm0 400Z",
    tune: "M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z",
    smart: "m380-300 280-180-280-180v360ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z",
    widgets: "M666-440 440-666l226-226 226 226-226 226Zm-546-80v-320h320v320H120Zm400 400v-320h320v320H520Zm-400 0v-320h320v320H120Zm80-480h160v-160H200v160Zm467 48 113-113-113-113-113 113 113 113Zm-67 352h160v-160H600v160Zm-400 0h160v-160H200v160Zm160-400Zm194-65ZM360-360Zm240 0Z",
    timer: "M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm40 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Zm0-80q116 0 198-82t82-198q0-116-82-198t-198-82q-116 0-198 82t-82 198q0 116 82 198t198 82Zm0-280Z",
    lockm: "M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z",
    fb: "M14 13.5h2.5l1-4H14v-2c0-1 .5-2 2.1-2H17.6V2.1A21 21 0 0 0 14.9 2C12.1 2 10 3.7 10 6.9v2.6H7v4h3V22h4z",
    ig: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm0 2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6Zm5.3-3.7a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
    xlogo: "M18.9 2H22l-7.2 8.2L23 22h-6.6l-5.2-6.8L5.3 22H2.2l7.7-8.8L2 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 3.9H5.5L17.7 20Z",
    li: "M3.5 8.5h4V21h-4zM5.5 2.5a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6ZM10 8.5h3.8v1.8c.6-1 2-2.1 4-2.1 4.3 0 5.1 2.8 5.1 6.4V21h-4v-5.6c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21H10z"
  };
  const SOCIAL = { fb: 1, ig: 1, xlogo: 1, li: 1 };
  const icon = (name, attrs = "") => M[name]
    ? `<svg viewBox="${SOCIAL[name] ? "0 0 24 24" : "0 -960 960 960"}" fill="currentColor" aria-hidden="true" ${attrs}><path d="${M[name]}"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${attrs}>${P[name] || ""}</svg>`;
  /* Figma star row: 5 filled stars, grey for the remainder */
  const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";
  SR.starRow = (r, size = 26) => `<span class="star-row" role="img" aria-label="Rated ${r} out of 5">${[1, 2, 3, 4, 5].map(i => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="width:${size}px;height:${size}px" aria-hidden="true"><path d="${STAR}" fill="${i <= Math.round(r) ? "#ffa600" : "#d9d9d9"}"/></svg>`).join("")}</span>`;
  SR.icon = icon;
  SR.logo = (size = 28) => `<svg viewBox="0 0 51 51" width="${size}" height="${size}" aria-hidden="true"><g transform="matrix(1 0 0 1 0 0)"><g transform="matrix(1 0 0 1 0 0)"><path d="M0 0L51 51L0 51L0 0Z" fill="#3c5ac7"/></g><g transform="matrix(1 0 0 1 2.469 2.468)"><path d="M19.43 0C30.16 0 38.85 8.7 38.85 19.43C38.85 30.15 30.15 38.85 19.43 38.85C8.7 38.85 0 30.16 0 19.43L0 0L19.43 0Z" fill="#e5eaff"/><path d="M19.43 0L19.43 -2.5L19.43 -2.5L19.43 0ZM0 19.43L-2.5 19.43L-2.5 19.43L0 19.43ZM0 0L0 -2.5L-2.5 -2.5L-2.5 0L0 0ZM19.43 0L19.43 2.5C28.77 2.5 36.35 10.08 36.35 19.43L38.85 19.43L41.35 19.43C41.35 7.32 31.54 -2.5 19.43 -2.5L19.43 0ZM38.85 19.43L36.35 19.43C36.35 28.77 28.77 36.35 19.43 36.35L19.43 38.85L19.43 41.35C31.54 41.35 41.35 31.54 41.35 19.43L38.85 19.43ZM19.43 38.85L19.43 36.35C10.08 36.35 2.5 28.77 2.5 19.43L0 19.43L-2.5 19.43C-2.5 31.54 7.32 41.35 19.43 41.35L19.43 38.85ZM0 19.43L2.5 19.43L2.5 0L0 0L-2.5 0L-2.5 19.43L0 19.43ZM0 0L0 2.5L19.43 2.5L19.43 0L19.43 -2.5L0 -2.5L0 0Z" fill="#3c5ac7"/></g><g transform="matrix(1 0 0 1 0 0)"><path d="M19.96 0C21.17 0 22.15 0.98 22.15 2.19C22.15 3.4 21.17 4.38 19.96 4.38L7.47 4.38L23.46 20.36C24.32 21.22 24.32 22.61 23.46 23.46C22.61 24.32 21.22 24.32 20.36 23.46L4.38 7.48L4.38 19.96C4.38 21.17 3.4 22.15 2.19 22.15C0.98 22.15 0 21.17 0 19.96L0 3.1L0 3.1L0 0L19.96 0Z" fill="#3c5ac7"/></g></g></svg>`;
  SR.gradients = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="g-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".55" stop-color="#9fb0ff"/><stop offset="1" stop-color="#4f6dff"/></linearGradient>
    <linearGradient id="g-b" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f6dff"/><stop offset="1" stop-color="#dfe5ff"/></linearGradient>
    <linearGradient id="g-c" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#6f88ff"/></linearGradient></defs></svg>`;
  SR.decoL = `<svg class="deco l" viewBox="0 0 210 145" aria-hidden="true"><path d="M0 0h90a90 90 0 0 1-90 90z" fill="url(#g-b)" opacity=".85"/><rect x="110" y="12" width="100" height="98" fill="url(#g-a)"/><path d="M30 65l70 75H30z" fill="url(#g-b)"/><circle cx="40" cy="95" r="52" fill="url(#g-c)" opacity=".7"/></svg>`;
  SR.decoR = `<svg class="deco r" viewBox="0 0 200 145" aria-hidden="true"><path d="M200 0H110a90 90 0 0 0 90 90z" fill="url(#g-a)"/><circle cx="80" cy="95" r="68" fill="url(#g-c)" opacity=".75"/><path d="M60 70l60 75H60z" fill="url(#g-b)"/><rect x="140" y="60" width="60" height="85" fill="url(#g-b)" opacity=".8"/></svg>`;

  /* ---------- Storage (wrapped: storage can be unavailable) ---------- */
  const mem = {};
  SR.store = {
    get(k, d = null) { try { const v = localStorage.getItem("sr_" + k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch { return k in mem ? mem[k] : d; } },
    set(k, v) { mem[k] = v; try { localStorage.setItem("sr_" + k, JSON.stringify(v)); } catch { } },
    del(k) { delete mem[k]; try { localStorage.removeItem("sr_" + k); } catch { } }
  };
  SR.session = {
    get(k, d = null) { try { const v = sessionStorage.getItem("sr_" + k); return v == null ? (("s_" + k) in mem ? mem["s_" + k] : d) : JSON.parse(v); } catch { return ("s_" + k) in mem ? mem["s_" + k] : d; } },
    set(k, v) { mem["s_" + k] = v; try { sessionStorage.setItem("sr_" + k, JSON.stringify(v)); } catch { } },
    del(k) { delete mem["s_" + k]; try { sessionStorage.removeItem("sr_" + k); } catch { } }
  };

  /* ---------- Lookups ---------- */
  SR.course = (id) => SR.courses.find(c => c.id === id);
  SR.training = (id) => SR.trainings.find(t => t.id === id);
  SR.cert = (id) => SR.certifications.find(c => c.id === id);
  SR.trainer = (key) => SR.instructors[key] || SR.instructors.skillradius;
  SR.lessons = (c) => c.modules.flatMap((m, mi) => m.lessons.map((l, li) => ({ key: mi + "-" + li, mi, li, title: l[0], type: l[1], dur: l[2], module: m.title })));
  SR.courseHours = (c) => c.hours;
  SR.openTrainings = () => SR.trainings.filter(t => !t.closed);
  // Every session of a batch as a Date (with start time), built from start date + meeting days
  SR.sessionsOf = (t) => {
    const DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const days = t.days.match(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/g).map(d => DAYS[d]);
    const [hh, mm] = t.time.match(/\d{1,2}:\d{2}/)[0].split(":").map(Number);
    const count = t.weeks ? t.weeks * days.length : 2;
    const out = [], d = new Date(t.start + "T00:00:00");
    while (out.length < count) { if (days.includes(d.getDay())) { const x = new Date(d); x.setHours(hh, mm, 0, 0); out.push(x); } d.setDate(d.getDate() + 1); }
    return out;
  };
  SR.durationMin = (t) => { const m = t.time.match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/); return m ? (m[3] * 60 + +m[4]) - (m[1] * 60 + +m[2]) : 120; };

  /* ---------- Auth (demo) ---------- */
  SR.DEMO = { email: "satishhebbal@gmail.com", password: "Skill@2026", firstName: "Satish", lastName: "Hebbal", phone: "9766739928", role: "learner" };
  // Staff demo accounts (role decides which panel they land on)
  SR.STAFF = {
    "admin@skillradius.in": { email: "admin@skillradius.in", password: "Admin@2026", firstName: "Ananya", lastName: "Iyer", phone: "9876500001", role: "admin" },
    "priya@skillradius.in": { email: "priya@skillradius.in", password: "Trainer@2026", firstName: "Priya", lastName: "Raman", phone: "9876500002", role: "trainer", trainer: "priya" }
  };
  SR.homeFor = (u) => !u ? "index.html" : u.role === "admin" ? "admin.html" : u.role === "trainer" ? "trainer.html" : "dashboard.html";
  SR.auth = {
    user: () => SR.store.get("user"),
    signIn(user) { SR.store.set("user", user); },
    signOut() { SR.store.del("user"); },
    isDemo: () => (SR.store.get("user") || {}).email === SR.DEMO.email,
    // Pages that need a signed-in user call this first; pass a role to restrict (e.g. "admin")
    require(role) {
      const u = SR.auth.user();
      if (u && (!role || u.role === role)) return true;
      if (u && role) { location.replace(SR.homeFor(u)); return false; }
      SR.session.set("next", location.pathname.split("/").pop() + location.hash);
      location.replace("login.html");
      return false;
    },
    // After sign-in: go where the user was heading, else their home
    afterLogin() { const n = SR.session.get("next"); SR.session.del("next"); const u = SR.auth.user(); location.href = (n && (u.role === "learner" || !u.role || /admin|trainer/.test(n))) ? n : SR.homeFor(u); }
  };

  /* Seed a realistic learning history for the demo account (and anyone who signs up, so the dashboard isn't empty) */
  SR.seedLearner = (fresh) => {
    const who = (SR.auth.user() || {}).email || "";
    if (SR.store.get("seeded") === who) return;   // already set up for this account
    const allKeys = (id) => SR.lessons(SR.course(id)).map(l => l.key);
    SR.store.set("activity", fresh ? { days: [0, 0, 0, 0, 0, 0, 0], prev: 0, streak: 0, goal: 5 } : { days: [1.2, 0.5, 2.1, 0, 1.6, 2.4, 0.8], prev: 6.9, streak: 12, goal: 10 });
    SR.store.set("notifRead", []);
    if (fresh) {
      SR.store.set("enrolled", { courses: [], trainings: [], certs: [] });
      SR.store.set("progress", {});
    } else {
      const now = Date.now(), day = 864e5;
      SR.store.set("enrolled", { courses: ["ai-automation", "ai-video", "automation", "react", "mobile-cine", "portfolio"], trainings: ["fsd-oct", "data-oct", "uiux-workshop"], certs: ["python", "uiux"] });
      SR.store.set("progress", {
        "ai-automation": { done: ["0-0", "0-1", "0-2", "1-0", "1-1", "1-2"], last: "2-0", at: now - 2 * 3600e3 },
        "ai-video": { done: ["0-0", "0-1", "1-0"], last: "1-1", at: now - day },
        "automation": { done: allKeys("automation").slice(0, 5), last: "2-1", at: now - 2 * day },
        "react": { done: ["0-0"], last: "0-1", at: now - 4 * day },
        "mobile-cine": { done: allKeys("mobile-cine"), last: null, at: now - 40 * day, completedOn: now - 40 * day, review: true },
        "portfolio": { done: allKeys("portfolio"), last: null, at: now - 55 * day, completedOn: now - 55 * day }
      });
      SR.store.set("certprog", { python: 12, uiux: 3 });
      SR.store.set("attempts", { python: [{ date: now - 21 * day, score: 9, total: 20, time: "38:44", answers: [0,1,0,0,0,1,0,1,0,0,0,1,1,0,0,1,0,1,0,0] }, { date: now - 12 * day, score: 16, total: 20, time: "42:18", answers: [1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1] }] });
      SR.store.set("certificates", [
        { id: "CERT-SR-PD-2026-001", kind: "Certification", ref: "python", title: "Certified Advanced Python Development", issued: now - 12 * day, validYears: 2, score: "80% · Distinction" },
        { id: "CERT-SR-DFP-2026-031", kind: "Course", ref: "portfolio", title: "Design your first portfolio!", issued: now - 55 * day, score: "Course completion" }
      ]);
    }
    if (fresh) { SR.store.set("certprog", {}); SR.store.set("attempts", {}); SR.store.set("certificates", []); SR.store.set("orders", []); SR.store.set("wishlist", []); SR.store.set("submissions", {}); }
    else {
      const now = Date.now(), day = 864e5;
      const mk = (n, type, id, daysAgo, coupon) => { const it = { course: SR.course, training: SR.training, cert: SR.cert }[type](id); const disc = coupon ? Math.round(it.price * 0.1) : 0; return { id: "SR-ORD-" + (240100 + n), date: now - daysAgo * day, type, ref: id, title: it.title, price: it.price, mrp: it.mrp || it.price, discount: disc, coupon: coupon || "", total: it.price - disc, state: "Karnataka", method: ["UPI", "Card", "UPI", "Netbanking"][n % 4], status: "Paid", gstin: "" }; };
      SR.store.set("orders", [mk(1, "course", "portfolio", 70), mk(2, "course", "mobile-cine", 60, "SKILL10"), mk(3, "cert", "python", 45), mk(4, "training", "fsd-oct", 40), mk(5, "course", "react", 30), mk(6, "training", "data-oct", 18, "SKILL10"), mk(7, "course", "ai-video", 12), mk(8, "cert", "uiux", 9), mk(9, "course", "ai-automation", 6), mk(10, "course", "automation", 5), mk(11, "training", "uiux-workshop", 3)]);
      SR.store.set("wishlist", ["full-stack"]);
      SR.store.set("submissions", { "fsd-oct": [{ title: "Responsive landing page", link: "https://github.com/satish/landing", file: "", notes: "", at: now - 16 * day, score: 9, max: 10, feedback: "Clean, semantic markup and good use of CSS grid. Add focus styles for keyboard users.", reviewedBy: "Priya Raman", reviewedAt: now - 14 * day }] });
    }
    SR.store.set("seeded", who);
  };
  SR.enrolled = () => SR.store.get("enrolled", { courses: [], trainings: [], certs: [] });
  SR.isEnrolled = (type, id) => (SR.enrolled()[type] || []).includes(id);
  SR.enroll = (type, id) => { const e = SR.enrolled(); e[type] = e[type] || []; if (!e[type].includes(id)) e[type].push(id); SR.store.set("enrolled", e); };
  SR.progressOf = (id) => {
    const c = SR.course(id), p = (SR.store.get("progress", {}) || {})[id] || { done: [] };
    const total = SR.lessons(c).length, done = p.done.filter(k => SR.lessons(c).some(l => l.key === k)).length;
    return { ...p, total, doneCount: done, pct: pct(done, total), complete: done >= total };
  };
  SR.setLessonDone = (id, key, done = true) => {
    const all = SR.store.get("progress", {}) || {};
    const p = all[id] || { done: [] };
    p.done = done ? [...new Set([...p.done, key])] : p.done.filter(k => k !== key);
    p.at = Date.now();
    const c = SR.course(id);
    if (p.done.length >= SR.lessons(c).length && !p.completedOn) {
      p.completedOn = Date.now();
      const certs = SR.store.get("certificates", []);
      if (!certs.some(x => x.ref === id)) {
        certs.push({ id: `CERT-SR-${id.slice(0, 3).toUpperCase()}-${new Date().getFullYear()}-${String(100 + certs.length).padStart(3, "0")}`, kind: "Course", ref: id, title: c.title, issued: Date.now(), score: "Course completion" });
        SR.store.set("certificates", certs);
      }
    }
    all[id] = p; SR.store.set("progress", all);
    return p;
  };
  SR.setLast = (id, key) => { const all = SR.store.get("progress", {}) || {}; const p = all[id] || { done: [] }; p.last = key; p.at = Date.now(); all[id] = p; SR.store.set("progress", all); };

  /* ---------- Orders, coupons, referrals ---------- */
  SR.orders = () => SR.store.get("orders", []) || [];
  SR.addOrder = (o) => { const all = SR.orders(); all.push(o); SR.store.set("orders", all); return o; };
  SR.newOrderId = () => "SR-ORD-" + (240100 + SR.orders().length + 1 + Math.floor(Math.random() * 50));
  SR.defaultCoupons = [{ code: "SKILL10", pct: 10, active: true, uses: 214, limit: 0, note: "Site-wide 10%" }, { code: "WELCOME20", pct: 20, active: true, uses: 88, limit: 500, note: "First purchase" }];
  SR.coupons = () => { const extra = SR.store.get("coupons", null); return extra || SR.defaultCoupons; };
  SR.refCode = (u) => { if (!u) return ""; let h = 0; for (const ch of u.email) h = (h * 31 + ch.charCodeAt(0)) % 9000; return "REF-" + (u.firstName || "SR").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) + (1000 + h); };
  // Returns { kind: "pct"|"flat", value, label } or null
  SR.lookupCoupon = (code, user) => {
    const c = String(code || "").trim().toUpperCase(); if (!c) return null;
    if (/^REF-[A-Z]+\d{4}$/.test(c)) return user && SR.refCode(user) === c ? { error: "You can't use your own referral code." } : { kind: "flat", value: 500, label: "Referral discount" };
    const k = SR.coupons().find(x => x.code === c && x.active);
    return k ? { kind: "pct", value: k.pct, label: k.note || k.code } : null;
  };
  SR.gstSplit = (total, state) => { const base = Math.round(total / 1.18 * 100) / 100, tax = Math.round((total - base) * 100) / 100; return state === "Karnataka" ? { base, cgst: tax / 2, sgst: tax / 2, igst: 0, tax } : { base, cgst: 0, sgst: 0, igst: tax, tax }; };

  /* ---------- Course Q&A ---------- */
  SR.qaSeed = () => { const d = 864e5, n = Date.now(); return {
    "ai-automation": [
      { id: "Q1", lesson: "0-0", q: "Is n8n better than Zapier for beginners?", by: "Rohit P.", at: n - 6 * d, answers: [{ by: "SkillRadius Studio", role: "trainer", text: "Zapier is quicker to start with. n8n gives you more control and is free to self-host. We use n8n in this course because the logic carries over to every tool.", at: n - 5 * d }] },
      { id: "Q2", lesson: "1-1", q: "Can a loop run on every row of a Google Sheet?", by: "Meera K.", at: n - 2 * d, answers: [] }],
    "react": [{ id: "Q3", lesson: "1-0", q: "Why does my useEffect run twice in development?", by: "Ankit S.", at: n - 4 * d, answers: [{ by: "Priya Raman", role: "trainer", text: "That's React Strict Mode mounting components twice to catch bugs. It only happens in development. Make sure your effect has a cleanup function.", at: n - 4 * d + 3600e3 }] }],
    "full-stack": [{ id: "Q4", lesson: "3-1", q: "Where should I store the JWT on the client?", by: "Divya M.", at: n - 1 * d, answers: [] }]
  }; };
  SR.qaAll = () => SR.store.get("qa", null) || SR.qaSeed();
  SR.qaFor = (id) => SR.qaAll()[id] || [];
  SR.addQA = (id, q) => { const all = SR.qaAll(); all[id] = [...(all[id] || []), { id: "Q" + Date.now().toString(36), at: Date.now(), answers: [], ...q }]; SR.store.set("qa", all); };

  /* ---------- Wishlist ---------- */
  SR.wishlist = () => SR.store.get("wishlist", []) || [];
  SR.toggleWish = (id) => { const w = SR.wishlist(), has = w.includes(id); SR.store.set("wishlist", has ? w.filter(x => x !== id) : [...w, id]); return !has; };

  /* ---------- Leads (forms that go to the admin panel) ---------- */
  SR.addLead = (type, data) => { const all = SR.store.get("leads", []) || []; const lead = { id: "L" + Date.now().toString(36).toUpperCase(), type, date: Date.now(), status: "New", ...data }; all.push(lead); SR.store.set("leads", all); return lead; };
  SR.tickets = () => SR.store.get("tickets", []) || [];
  SR.saveTickets = (t) => SR.store.set("tickets", t);

  /* ---------- Admin overrides (price changes, unpublished items) ---------- */
  (function applyOverrides() {
    const o = SR.store.get("overrides", {}) || {};
    [["courses", SR.courses], ["trainings", SR.trainings], ["certs", SR.certifications]].forEach(([k, list]) => Object.entries(o[k] || {}).forEach(([id, patch]) => { const it = list.find(x => x.id === id); if (it) Object.assign(it, patch); }));
  })();
  SR.publicCourses = () => SR.courses.filter(c => c.published !== false);
  SR.publicCerts = () => SR.certifications.filter(c => c.published !== false);

  /* ---------- Modal ---------- */
  SR.modal = (html, onSubmit, opts = {}) => {
    const m = document.createElement("div"); m.className = "modal-back";
    m.innerHTML = `<div class="modal" role="dialog" aria-modal="true" style="${opts.wide ? "width:min(640px,100%)" : ""}">${html}</div>`;
    document.body.appendChild(m);
    const close = () => { m.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    m.addEventListener("click", e => { if (e.target === m || e.target.closest("[data-close]")) close(); });
    const f = m.querySelector("input,select,textarea,button"); if (f) f.focus();
    const form = m.querySelector("form"); if (form && onSubmit) form.addEventListener("submit", e => { e.preventDefault(); if (onSubmit(m) !== false) close(); });
    return { el: m, close };
  };

  /* Profile photo, or an initials avatar for accounts without one */
  SR.avatarURL = (u) => {
    if (!u) return "";
    if (u.avatar) return u.avatar;
    if (u.email === SR.DEMO.email) return "assets/img/avatar.jpg";
    const t = initials((u.firstName || "") + " " + (u.lastName || "")) || "?";
    return "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#3c5ac7"/><text x="40" y="51" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">${t}</text></svg>`);
  };

  /* ---------- Toast ---------- */
  let tt;
  SR.toast = (msg) => {
    let el = $("#toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => el.hidden = true, 2800);
  };
  document.addEventListener("click", e => { const t = e.target.closest("[data-toast]"); if (t) { if (t.tagName === "A") e.preventDefault(); SR.toast(t.dataset.toast); } });

  /* ---------- Real file downloads: CSV from tables, calendar (.ics) from batch schedules ---------- */
  SR.download = (name, text, type = "text/plain") => {
    const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  /* ---------- Video player window ----------
     SR.playVideo({ title, sub, poster, mins, src, onEnd })
     · src = YouTube link → embedded player · src = .mp4 / .webm → real <video>
     · no src → sample playback on the poster (same as lessons), so every Play button works
       before your videos are uploaded. Set `video:"…"` on events / courses in data.js. */
  const ensureCSS = () => {
    if (document.getElementById("sr-x-css")) return;
    const s = document.createElement("style"); s.id = "sr-x-css";
    s.textContent = `
.vm-back{position:fixed;inset:0;z-index:90;background:rgba(8,11,28,.82);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px}
.vm{width:min(960px,100%);display:grid;gap:14px;color:#fff}
.vm-top{display:flex;gap:14px;align-items:flex-start;justify-content:space-between}
.vm-top h2{font-size:clamp(17px,2vw,22px);font-weight:600;color:#fff;line-height:1.3}
.vm-top p{font-size:13.5px;color:#b9c0e6;margin-top:3px}
.vm-x{flex:none;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;display:grid;place-items:center;cursor:pointer}
.vm-x:hover{background:rgba(255,255,255,.2)}.vm-x svg{width:18px;height:18px}
.vm-stage{position:relative;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#0b0f22;box-shadow:0 40px 80px -30px #000}
.vm-stage>img,.vm-stage>video,.vm-stage>iframe{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0}
.vm-stage.sim>img{filter:brightness(.72)}
.vm-big{position:absolute;inset:0;margin:auto;width:78px;height:78px;border-radius:50%;border:0;background:rgba(255,255,255,.96);color:#2f4bd8;display:grid;place-items:center;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.4);transition:transform .2s}
.vm-big:hover{transform:scale(1.06)}.vm-big svg{width:32px;height:32px;margin-left:4px}
.vm-chip{position:absolute;left:14px;top:14px;font-size:12px;font-weight:600;padding:5px 10px;border-radius:99px;background:rgba(11,15,34,.7);color:#fff}
.vm-ctl{position:absolute;left:0;right:0;bottom:0;padding:30px 16px 12px;background:linear-gradient(transparent,rgba(0,0,0,.78));display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:12px;align-items:center;font-size:13px;font-variant-numeric:tabular-nums}
.vm-ctl button{border:0;background:none;color:#fff;display:grid;place-items:center;padding:4px;cursor:pointer}.vm-ctl svg{width:20px;height:20px}
.vm-track{height:6px;border-radius:99px;background:rgba(255,255,255,.3);overflow:hidden;cursor:pointer}.vm-track i{display:block;height:100%;width:0;background:#fff}
.vm-ctl .sp{border:1px solid rgba(255,255,255,.5);border-radius:6px;padding:1px 7px;font-size:12px;font-weight:600}
.vm-end{position:absolute;inset:0;background:rgba(11,15,34,.86);display:grid;place-items:center;text-align:center;padding:20px}
.vm-end div{display:grid;gap:12px;justify-items:center}.vm-end h3{font-size:20px;font-weight:600;color:#fff}.vm-end p{color:#c3c9e8;font-size:14.5px}
.wr{display:grid;gap:14px}.wr-ic{width:54px;height:54px;border-radius:16px;background:var(--primary-soft,#e8edff);color:var(--primary,#2f4bd8);display:grid;place-items:center}
.wr-ic svg{width:26px;height:26px}.wr ul{display:grid;gap:8px;font-size:14px;list-style:none;padding:12px 14px;margin:0;border-radius:12px;background:var(--primary-softer,#f4f6ff)}
.wr li{display:flex;gap:8px;align-items:center}.wr li svg{width:16px;height:16px;flex:none;color:var(--primary,#2f4bd8)}
.wr .dot{width:9px;height:9px;border-radius:50%;background:#e2a400;animation:wrp 1.4s infinite}@keyframes wrp{50%{opacity:.3}}
.lp-ag{display:grid;gap:0;border:1px solid var(--line,#e3e6f2);border-radius:12px;overflow:hidden;font-size:14px}
.lp-ag div{display:grid;grid-template-columns:86px minmax(0,1fr);gap:12px;padding:10px 14px;border-top:1px solid var(--line,#e3e6f2)}.lp-ag div:first-child{border-top:0}
.lp-ag b{color:var(--primary,#2f4bd8);font-weight:600;white-space:nowrap}.lp-ag span span{display:block;font-size:12.5px;color:var(--ink-3,#6b7392)}
.modal textarea{font:inherit}
@media (prefers-reduced-motion:reduce){.wr .dot{animation:none}}`;
    document.head.appendChild(s);
  };
  ensureCSS();
  const ytId = (u) => (String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
  SR.playVideo = (o = {}) => {
    ensureCSS();
    const esc = SR.esc, dur = Math.max(60, (o.mins || 5) * 60), mmss = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0"); };
    const yt = o.src && ytId(o.src), back = document.createElement("div"); back.className = "vm-back";
    const stage = yt ? `<div class="vm-stage"><iframe src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0" title="${esc(o.title || "Video")}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`
      : o.src ? `<div class="vm-stage"><video src="${esc(o.src)}" ${o.poster ? `poster="${esc(o.poster)}"` : ""} controls autoplay playsinline></video></div>`
      : `<div class="vm-stage sim">${o.poster ? `<img src="${esc(o.poster)}" alt="">` : ""}<span class="vm-chip">Sample playback</span>
          <button class="vm-big" type="button" aria-label="Play">${SR.icon("playf")}</button>
          <div class="vm-ctl"><button type="button" class="pp" aria-label="Play">${SR.icon("playf")}</button><div class="vm-track" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><span class="tm">0:00 / ${mmss(dur)}</span><button type="button" class="sp" aria-label="Playback speed">1x</button></div></div>`;
    back.innerHTML = `<div class="vm" role="dialog" aria-modal="true" aria-label="${esc(o.title || "Video")}"><div class="vm-top"><div><h2>${esc(o.title || "")}</h2>${o.sub ? `<p>${esc(o.sub)}</p>` : ""}</div><button class="vm-x" type="button" aria-label="Close video">${SR.icon("x")}</button></div>${stage}</div>`;
    document.body.appendChild(back);
    let timer, ended = false; const q = (s) => back.querySelector(s), last = document.activeElement;
    const close = () => { clearInterval(timer); back.remove(); document.removeEventListener("keydown", onKey); if (last && last.focus) last.focus(); };
    const done = () => { if (ended) return; ended = true; if (o.onEnd) o.onEnd(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    back.addEventListener("click", e => { if (e.target === back || e.target.closest(".vm-x") || e.target.closest("[data-vm-close]")) close(); });
    q(".vm-x").focus();
    const vid = q("video"); if (vid) vid.addEventListener("ended", done);
    if (yt) setTimeout(done, 15000);            // embedded players don't report back; count it watched after 15s
    if (q(".sim")) {
      let pos = 0, rate = 1, on = false; const step = dur / 20;   // sample runs start to end in ~20 seconds
      const draw = () => { const p = Math.round(pos / dur * 100); q(".vm-track i").style.width = p + "%"; q(".vm-track").setAttribute("aria-valuenow", p); q(".tm").textContent = `${mmss(pos)} / ${mmss(dur)}`; };
      const play = (v) => {
        on = v; q(".vm-big").hidden = v; q(".pp").innerHTML = SR.icon(v ? "pause" : "playf"); q(".pp").setAttribute("aria-label", v ? "Pause" : "Play"); clearInterval(timer);
        const end = q(".vm-end"); if (v && end) { end.remove(); if (pos >= dur) pos = 0; }
        if (v) timer = setInterval(() => { pos = Math.min(dur, pos + step * rate * .25); draw(); if (pos >= dur) { play(false); q(".vm-big").hidden = true; done(); q(".sim").insertAdjacentHTML("beforeend", `<div class="vm-end"><div>${SR.icon("checkc", 'width="40" height="40" style="color:#7fe0aa"')}<h3>${esc(o.endTitle || "That's the end")}</h3>${o.endHTML || ""}<button class="btn plain" type="button" data-vm-close style="color:#fff;border-color:#4a56a0">Close</button></div></div>`); } }, 250);
      };
      q(".vm-big").addEventListener("click", () => play(true)); q(".pp").addEventListener("click", () => play(!on));
      q(".sp").addEventListener("click", () => { rate = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1; q(".sp").textContent = rate + "x"; });
      q(".vm-track").addEventListener("click", e => { const r = q(".vm-track").getBoundingClientRect(); pos = Math.max(0, Math.min(dur, (e.clientX - r.left) / r.width * dur)); draw(); });
      q(".vm-track").addEventListener("keydown", e => { if (e.key === "ArrowRight") { pos = Math.min(dur, pos + 10); draw(); } if (e.key === "ArrowLeft") { pos = Math.max(0, pos - 10); draw(); } });
      play(true);
    }
    return { close };
  };
  // <button data-video data-v-title data-v-sub data-v-poster data-v-mins data-v-src data-v-key>
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-video]"); if (!b) return; const d = b.dataset;
    SR.playVideo({ title: d.vTitle, sub: d.vSub, poster: d.vPoster, mins: +d.vMins || 5, src: d.vSrc, onEnd: d.vKey ? () => { const w = SR.store.get("watched", {}) || {}; w[d.vKey] = 1; SR.store.set("watched", w); if (b.isConnected && b.classList.contains("btn")) b.innerHTML = SR.icon("check", 'width="14" height="14"') + "Watch again"; } : null });
  });

  /* ---------- Live classroom ----------
     The trainer saves the meeting link (Zoom / Google Meet / Teams) for a batch; learners' Join
     buttons open it. Until a link is saved, learners see a waiting room instead of a dead button. */
  SR.meetLink = (tid) => (SR.store.get("meet", {}) || {})[tid] || (SR.training(tid) || {}).meet || "";
  SR.joinClass = (tid) => {
    ensureCSS(); const t = SR.training(tid) || {}, url = SR.meetLink(tid), esc = SR.esc;
    if (url) { window.open(url, "_blank", "noopener"); SR.toast("Classroom opened in a new tab"); return; }
    const m = SR.modal(`<div class="wr"><span class="wr-ic">${SR.icon("video")}</span><h2>Waiting for your trainer</h2>
      <p class="small muted">The classroom for <b>${esc(t.title || "this session")}</b> opens as soon as ${esc((t.trainer && t.trainer.name) || "your trainer")} starts it, usually a few minutes before time.</p>
      <ul><li><span class="dot"></span>Room not open yet</li><li>${SR.icon("check")}Keep your headphones and notebook ready</li><li>${SR.icon("check")}Use Chrome or Edge on a laptop for the best experience</li></ul>
      <div class="btn-row"><button class="btn plain" type="button" data-close>Close</button><button class="btn" type="button" id="wr-again">Check again</button></div></div>`);
    m.el.querySelector("#wr-again").addEventListener("click", () => { if (SR.meetLink(tid)) { m.close(); SR.joinClass(tid); } else SR.toast("Not open yet. We'll keep this window ready."); });
  };
  document.addEventListener("click", e => { const b = e.target.closest("[data-join]"); if (b && !b.disabled) SR.joinClass(b.dataset.join); });

  /* ---------- PDF files, generated in the browser ----------
     SR.pdf("name.pdf", [{ t:"Heading", h:1 }, { t:"Paragraph" }, { t:"Bullet", li:1 }, { gap:10 }, { rule:1 }]) */
  SR.pdf = (name, blocks, o = {}) => {
    const W = 595, H = 842, M = 54, clean = (s) => String(s).replace(/[–—]/g, "-").replace(/[·•]/g, "-").replace(/₹/g, "Rs. ").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
    const pe = (s) => clean(s).replace(/([\\()])/g, "\\$1");
    const pages = []; let ops = [], y = H - M;
    const newPage = () => { if (ops.length) pages.push(ops); ops = []; y = H - M; };
    const head = () => { ops.push(`0.184 0.294 0.847 rg 0 ${H - 26} ${W} 26 re f`, `BT /F2 10 Tf 1 1 1 rg ${M} ${H - 17} Td (SkillRadius) Tj ET`, `BT /F1 9 Tf 1 1 1 rg ${W - M - 150} ${H - 17} Td (${pe(o.tag || "skillradius.in")}) Tj ET`); y = H - M - 14; };
    head();
    const text = (t, size, bold, x, col) => {
      const max = Math.floor((W - M - x) / (size * (bold ? .56 : .52))), words = clean(t).split(/\s+/), lines = []; let cur = "";
      words.forEach(w => { if ((cur + " " + w).trim().length > max) { lines.push(cur); cur = w; } else cur = (cur + " " + w).trim(); }); if (cur) lines.push(cur);
      lines.forEach(l => { if (y < M + size) { newPage(); head(); } ops.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${col} rg ${x} ${y} Td (${pe(l)}) Tj ET`); y -= size * 1.45; });
    };
    blocks.forEach(b => {
      if (b.gap) { y -= b.gap; return; }
      if (b.rule) { ops.push(`0.86 0.88 0.95 RG 0.8 w ${M} ${y + 4} m ${W - M} ${y + 4} l S`); y -= 12; return; }
      if (b.h === 1) { y -= 6; text(b.t, 21, true, M, "0.07 0.09 0.2"); y -= 4; }
      else if (b.h === 2) { y -= 10; text(b.t, 13.5, true, M, "0.184 0.294 0.847"); y -= 2; }
      else if (b.li) { if (y < M + 12) { newPage(); head(); } ops.push(`0.184 0.294 0.847 rg ${M + 3} ${y + 2.5} 3.2 3.2 re f`); text(b.t, 11, false, M + 16, "0.15 0.17 0.28"); y -= 2; }
      else if (b.box) { if (y < M + 40) { newPage(); head(); } ops.push(`0.8 0.83 0.93 RG 0.7 w ${M} ${y - b.box + 10} ${W - 2 * M} ${b.box} re S`); y -= b.box + 6; }
      else text(b.t, b.small ? 9.5 : 11, !!b.b, M, b.small ? "0.42 0.45 0.57" : "0.15 0.17 0.28");
    });
    newPage();
    const objs = ["<< /Type /Catalog /Pages 2 0 R >>", `<< /Type /Pages /Kids [${pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"];
    pages.forEach((p, i) => { const s = p.concat(`BT /F1 8.5 Tf 0.5 0.53 0.65 rg ${M} 30 Td (${pe((o.footer || "(c) SkillRadius - for enrolled learners") + "   -   Page " + (i + 1) + " of " + pages.length)}) Tj ET`).join("\n");
      objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`, `<< /Length ${s.length} >>\nstream\n${s}\nendstream`); });
    let out = "%PDF-1.4\n"; const off = [];
    objs.forEach((b, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${b}\nendobj\n`; });
    const xr = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map(n => String(n).padStart(10, "0") + " 00000 n \n").join("")}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
    const bytes = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    SR.download(name, bytes, "application/pdf"); return bytes;
  };

  const csvCell = (v) => { v = String(v).replace(/\s+/g, " ").trim(); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  SR.tableCSV = (table) => {
    const txt = (c) => { const k = c.cloneNode(true); k.querySelectorAll(".avatar-i, svg, button, select").forEach(x => x.remove()); k.querySelectorAll("br").forEach(x => x.replaceWith(" · ")); k.querySelectorAll("*").forEach(x => x.after(" ")); return k.textContent.replace(/\s+/g, " ").replace(/^ · | · $/g, "").trim(); };
    const rows = [...table.rows].map(r => [...r.cells].map(txt));
    const keep = rows[0].map((_, i) => rows.some(r => r[i] && r[i].trim()));
    return rows.map(r => r.filter((_, i) => keep[i]).map(v => csvCell(v || ""))).join("\r\n");
  };
  const icsDate = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  SR.icsFor = (ids) => {
    const evs = ids.map(SR.training).filter(Boolean).flatMap(t => SR.sessionsOf(t).filter(d => d > Date.now() - 864e5).map((d, i) => ({ t, d, i })));
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SkillRadius//Live batches//EN", "CALSCALE:GREGORIAN"];
    evs.forEach(({ t, d, i }) => lines.push("BEGIN:VEVENT", `UID:${t.id}-${i}-${+d}@skillradius.in`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(d)}`, `DTEND:${icsDate(+d + SR.durationMin(t) * 6e4)}`,
      `SUMMARY:${t.title} (session ${i + 1})`, `LOCATION:${t.mode === "online" ? "SkillRadius live classroom" : t.batch}`, `DESCRIPTION:SkillRadius live batch. Details: training.html#${t.id}`, "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", "DESCRIPTION:Session starts in 15 minutes", "END:VALARM", "END:VEVENT"));
    lines.push("END:VCALENDAR"); return { text: lines.join("\r\n"), count: evs.length };
  };
  /* Free events: calendar file + registration modal (events list and event detail page) */
  SR.eventICS = (e) => {
    const end = e.date + e.mins * 6e4;
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SkillRadius//Events//EN", "BEGIN:VEVENT", `UID:${e.id}@skillradius.in`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(e.date)}`, `DTEND:${icsDate(end)}`,
      `SUMMARY:${e.title} (SkillRadius ${e.type})`, "LOCATION:Online · joining link in your email", `DESCRIPTION:${(e.desc || "").replace(/[,;]/g, " ")} Details: event.html#${e.id}`, "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Starts in 30 minutes", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  };
  SR.eventRegs = () => SR.store.get("eventRegs", []) || [];
  SR.registerEvent = (e, done) => {
    const m = SR.modal(`<h2>Register: ${esc(e.title)}</h2><p class="muted small">${new Date(e.date).toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })} · ${e.mins} min · Free</p>
      <form class="stack" id="reg-form">
        <div class="field"><label for="r-name">Full name <span class="req">*</span></label><input id="r-name" name="name" data-req autocomplete="name"></div>
        <div class="field"><label for="r-email">Email <span class="req">*</span></label><input id="r-email" name="email" type="email" data-req data-kind="email" autocomplete="email"></div>
        <div class="field"><label for="r-phone">WhatsApp number <span class="tiny muted">(for the reminder)</span></label><input id="r-phone" name="phone" data-kind="phone" inputmode="numeric"></div>
        <div class="field"><label for="r-q">A question for the speaker</label><textarea id="r-q" name="question" style="min-height:80px"></textarea></div>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Register</button></div>
      </form>`, null, { wide: true });
    SR.leadForm(m.el.querySelector("#reg-form"), { type: "event", extra: { event: e.title }, onDone: () => {
      SR.store.set("eventRegs", [...SR.eventRegs(), e.id]); e.registered++;
      m.close(); SR.toast("You're registered. The joining link is on its way by email."); done && done();
    } });
  };
  document.addEventListener("click", ev => {
    const c = ev.target.closest("[data-ics]"); if (!c) return;
    const e = SR.events.find(x => x.id === c.dataset.ics); if (!e) return;
    SR.download(`skillradius-${e.id}.ics`, SR.eventICS(e), "text/calendar"); SR.toast("Calendar file downloaded. Open it to add the event.");
  });
  document.addEventListener("click", e => {
    const c = e.target.closest("[data-csv]");
    if (c) {
      let scope = c.parentElement; while (scope && !scope.querySelector("table")) scope = scope.parentElement;
      const tb = scope && scope.querySelector("table"); if (!tb) { SR.toast("Nothing to export yet."); return; }
      const title = ((scope.querySelector("h1, h2") || {}).textContent || c.dataset.csv).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
      SR.download(`skillradius-${title}-${new Date().toISOString().slice(0, 10)}.csv`, "﻿" + SR.tableCSV(tb), "text/csv"); SR.toast(`Exported ${tb.rows.length - 1} rows to CSV`);
    }
    const ic = e.target.closest("[data-ics-training]");
    if (ic) {
      const ids = ic.dataset.icsTraining.split(",").filter(Boolean), r = SR.icsFor(ids);
      if (!r.count) { SR.toast("No upcoming sessions to add."); return; }
      SR.download(`skillradius-${ids.length > 1 ? "schedule" : ids[0]}.ics`, r.text, "text/calendar"); SR.toast(`Added ${r.count} sessions. Open the file to import them into your calendar.`);
    }
  });

  /* ---------- FAQ / accordion helper ---------- */
  SR.faqHTML = (items, openFirst = true) => items.map(([q, a], i) => `<details ${openFirst && i === 0 ? "open" : ""}><summary>${esc(q)}${icon("plus")}</summary><div class="body">${esc(a)}</div></details>`).join("");

  /* ---------- Cards (Figma components) ---------- */
  SR.courseCard = (c) => {
    const mine = SR.isEnrolled("courses", c.id);
    return `
    <article class="course-card">
      <div class="img"><img src="${c.img}" alt="" loading="lazy" width="366" height="184">${c.bestseller ? `<span class="pill solid">Best Seller</span>` : ""}</div>
      <div class="b">
        <h3><a href="course.html#${c.id}">${esc(c.title)}</a></h3>
        <p>${esc(c.subtitle)}</p>
        <div class="foot">
          <span class="rating">${SR.starRow(c.rating)}<span>${c.rating} (${c.reviews.toLocaleString("en-IN")})</span></span>
          ${mine ? `<a class="btn soft" href="learn.html#${c.id}">Continue</a>` : `<a class="btn" href="course.html#${c.id}">Apply</a>`}
        </div>
      </div>
    </article>`;
  };
  SR.certCard = (c) => `
    <article class="cert-card">
      <div class="img"><img src="${c.img}" alt="" loading="lazy" width="380" height="192">${c.tag ? `<span class="pill ${c.tag === "Trending" ? "hot" : "solid"}">${esc(c.tag)}</span>` : ""}</div>
      <div class="b">
        <span class="code">${esc(c.card || c.code)}</span>
        <h3><a href="certification.html#${c.id}">${esc(c.title)} ${esc(c.level)}</a></h3>
        <div class="meta"><a class="pv" href="certification.html#${c.id}#preview">${icon("smart")}Watch Preview Video</a><span>${c.months} Months duration</span></div>
        <div class="dates"><span>Created: ${esc(c.created || "Jan 2025")}</span><span>Updated: ${esc(c.updated || "Jan 2026")}</span></div>
        <div class="foot">
          <span class="pill">${c.validity} Years validity</span>
          <div class="price"><s>${inr(c.mrp)}</s><b>${inr(c.price)}</b></div>
        </div>
        <a class="btn block" href="certification.html#${c.id}">${SR.isEnrolled("certs", c.id) ? "Go to program" : "View Details"} ${icon("arrow")}</a>
      </div>
    </article>`;
  SR.trainingCard = (t) => {
    const tr = SR.trainer(t.trainer), left = t.seats - t.taken;
    return `
    <article class="tr-card">
      <div class="top"><span class="pill blue">${t.mode === "online" ? "Live online" : "In-person · " + esc(t.batch.replace(" Studio", ""))}</span>${left <= 5 ? `<span class="pill red">Only ${left} seats left</span>` : `<span class="pill green">Enrolling now</span>`}</div>
      <h3><a href="training.html#${t.id}">${esc(t.title)}</a></h3>
      <dl>
        <dt>${icon("cal")}Starts</dt><dd>${fmtDate(t.start)}${t.weeks ? ` · ${t.weeks} weeks` : " · 2 days"}</dd>
        <dt>${icon("clock")}Schedule</dt><dd>${esc(t.days)} · ${esc(t.time)}</dd>
        <dt>${icon("tag")}Fee</dt><dd><b style="font-weight:600">${inr(t.price)}</b> <s class="tiny" style="color:var(--ink-3)">${inr(t.mrp)}</s></dd>
      </dl>
      ${SR.countdownHTML ? SR.countdownHTML(t) : ""}
      <div class="seats">${t.taken} of ${t.seats} seats filled<div class="bar"><span style="width:${pct(t.taken, t.seats)}%"></span></div></div>
      <div class="trainer"><span class="avatar-i" style="background:${tr.color}">${initials(tr.name)}</span><div><b>${esc(tr.name)}</b><span>${esc(tr.role)}</span></div></div>
      <a class="btn ${left <= 5 ? "" : "ghost"}" href="training.html#${t.id}">${SR.isEnrolled("trainings", t.id) ? "View batch" : "Reserve a seat"}</a>
    </article>`;
  };

  /* Brand lockup (Figma "Group 1": mark + Carmen Sans wordmark, exported from the file) */
  SR.brandImg = (h = 26) => `<img src="assets/img/logo-full.svg" alt="SkillRadius" height="${h}" style="height:${h}px;width:auto">`;

  /* ---------- Header & footer ---------- */
  const page = () => (document.querySelector('meta[name="sr-page"]') || {}).content || "";
  /* ---------- Nav dropdown menus (built on first open) ---------- */
  const MENUS = {
    courses: () => {
      const all = SR.publicCourses(), cats = [...new Set(all.map(c => c.cat))];
      const feat = ["full-stack", "ai-video"].map(SR.course).filter(Boolean);
      return `<div class="mg mg-courses"><div class="mg-col"><h5>Browse by topic</h5>${cats.map(c => `<a class="mg-cat" href="courses.html#cat=${encodeURIComponent(c)}"><span>${esc(c)}</span><em>${all.filter(x => x.cat === c).length}</em></a>`).join("")}<a class="mg-all" href="courses.html">All courses ${icon("arrow")}</a></div>
        <div class="mg-col mg-feat"><h5>Popular right now</h5>${feat.map(c => `<a class="mg-card" href="course.html#${c.id}"><img src="${c.img}" alt=""><span><b>${esc(c.title)}</b><small>★ ${c.rating} · ${c.hours} hours · ${inr(c.price)}</small></span></a>`).join("")}
        <a class="mg-promo" href="paths.html"><b>Not sure where to start?</b><span>Follow a career path with courses, a live batch and a certification.</span></a></div></div>`;
    },
    certifications: () => {
      const list = SR.publicCerts().slice(0, 5);
      return `<div class="mg mg-certs"><div class="mg-col"><h5>Professional certifications</h5>${list.map(c => `<a class="mg-row" href="certification.html#${c.id}"><img src="${c.img}" alt=""><span><b>${esc(c.title.replace(/^Certified (Advanced )?/, ""))}</b><small>${esc(c.code)} · ${c.validity} years validity</small></span><em>${inr(c.price)}</em></a>`).join("")}<a class="mg-all" href="certifications.html">All ${SR.publicCerts().length} certifications ${icon("arrow")}</a></div>
        <div class="mg-col mg-side"><a class="mg-tile" href="verify.html"><span class="ic">${icon("shield")}</span><b>Verify a certificate</b><small>Check any SkillRadius certificate ID instantly.</small></a><a class="mg-tile" href="certifications.html#how"><span class="ic">${icon("quiz")}</span><b>How the exam works</b><small>Proctored online, 60 minutes, unlimited attempts.</small></a></div></div>`;
    },
    trainings: () => {
      const list = SR.openTrainings().slice().sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3);
      return `<div class="mg mg-tr"><h5>Next live batches</h5>${list.map(t => { const d = new Date(t.start + "T00:00:00"), left = t.seats - t.taken; return `<a class="mg-batch" href="training.html#${t.id}"><span class="dt"><b>${String(d.getDate()).padStart(2, "0")}</b>${d.toLocaleDateString("en-IN", { month: "short" })}</span><span class="tx"><b>${esc(t.title)}</b><small>${esc(t.days)} · ${t.mode === "online" ? "Live online" : "In person"}</small></span><em class="${left <= 8 ? "low" : ""}">${left} seats left</em></a>`; }).join("")}
        <div class="mg-foot"><a class="mg-all" href="trainings.html">See all batches ${icon("arrow")}</a><a class="mg-all soft" href="events.html">Free webinars ${icon("arrow")}</a></div></div>`;
    },
    explore: () => {
      const items = [["paths.html", "target", "Career paths", "Job-ready tracks with placement support"], ["events.html", "cal", "Free webinars", "Live sessions with industry experts"], ["placements.html", "trend", "Placements", "Where our learners got hired"], ["business.html", "users", "For business", "Train your team with SkillRadius"], ["scholarships.html", "award", "Scholarships", "Financial aid for deserving learners"], ["instructors.html", "training", "Our trainers", "Meet the people who teach"], ["blog.html", "file", "Blog", "Guides, career tips and news"], ["help.html", "help", "Help centre", "Answers to common questions"]];
      return `<div class="mg mg-explore">${items.map(([h, ic, t, d]) => `<a class="mg-tile" href="${h}"><span class="ic">${icon(ic)}</span><b>${t}</b><small>${d}</small></a>`).join("")}</div>`;
    }
  };

  function renderHeader() {
    const host = $("#site-header"); if (!host) return;
    const u = SR.auth.user(), cur = page(), signed = !!u;
    const staff = u && (u.role === "admin" || u.role === "trainer");
    const homeLink = u ? [u.role === "admin" ? "admin" : u.role === "trainer" ? "trainer" : "dashboard", SR.homeFor(u), "grid", u.role === "admin" ? "Admin" : u.role === "trainer" ? "My Batches" : "My Learning"] : ["home", "index.html", "home", "Home"];
    const links = [homeLink, ...(u ? [["courses", "courses.html", "book", "Courses"], ["certifications", "certifications.html", "cert", "Certifications"]] : [["certifications", "certifications.html", "cert", "Certifications"], ["courses", "courses.html", "book", "Courses"]]), ["trainings", "trainings.html", "training", "Trainings"]];
    const sub = { course: "courses", training: "trainings", certification: "certifications", learn: "dashboard", profile: "", "exam-rules": "certifications", "exam-result": "certifications", certificate: "dashboard", assignment: "dashboard" };
    const navHTML = links.map(([k, href, ic, label]) => `<a href="${href}" ${cur === k || sub[cur] === k ? 'aria-current="page"' : ""}>${icon(ic)}${label}</a>`).join("");
    const moreHTML = [["paths.html", "Learning paths"], ["events.html", "Free events"], ["business.html", "For Business"], ["placements.html", "Placements"], ["blog.html", "Blog"], ["help.html", "Help center"], ["verify.html", "Verify a certificate"], ["contact.html", "Contact"]].map(([h, l]) => `<a href="${h}">${l}</a>`).join("");
    const right = u ? `
      <div class="user-wrap">
        <button class="user-btn" id="user-btn" aria-haspopup="true" aria-expanded="false" aria-controls="user-menu">
          <span class="hi">Hi ${esc(u.firstName)}</span><img src="${SR.avatarURL(u)}" alt="">${icon("chev")}
        </button>
        <div class="user-menu" id="user-menu" hidden>
          <div class="who"><b>${esc(u.firstName + " " + (u.lastName || ""))}</b><span>${esc(u.email)}</span></div>
          ${u.role === "admin" ? `<a href="admin.html">${icon("grid")}Admin panel</a>` : u.role === "trainer" ? `<a href="trainer.html">${icon("grid")}Trainer panel</a>` : `<a href="dashboard.html">${icon("grid")}My Learning</a>
          <a href="dashboard.html#orders">${icon("card")}Orders &amp; invoices</a>
          <a href="dashboard.html#certificates">${icon("cert")}My certificates</a>
          <a href="refer.html">${icon("heart")}Refer &amp; earn</a>`}
          <a href="profile.html">${icon("userc")}Profile</a>
          <a href="support.html">${icon("help")}Support</a>
          <button class="logout" data-logout>${icon("logout")}Logout</button>
        </div>
      </div>` : `<a class="btn ghost" href="login.html">Log In</a><a class="btn" href="signup.html">Sign Up</a>`;
    host.className = "site-header" + (signed ? " learner" : "");
    host.innerHTML = `
      <div class="wrap nav-inner">
        <a class="brand" href="${u ? SR.homeFor(u) : "index.html"}" aria-label="SkillRadius home">${SR.brandImg()}</a>
        <nav class="nav-links" aria-label="Main"><span class="nav-ind" aria-hidden="true"></span>${links.map(([k, href, ic, label]) => { const cur_ = cur === k || sub[cur] === k; const has = MENUS[k]; return has ? `<div class="nav-item" data-menu="${k}"><a class="nav-top" href="${href}" ${cur_ ? 'aria-current="page"' : ""} aria-haspopup="true" aria-expanded="false">${icon(ic)}${label}<span class="chev">${icon("chev")}</span></a><div class="mega" role="menu"></div></div>` : `<a class="nav-top" href="${href}" ${cur_ ? 'aria-current="page"' : ""}>${icon(ic)}${label}</a>`; }).join("")}<div class="nav-item" data-menu="explore"><button type="button" class="nav-top" aria-haspopup="true" aria-expanded="false">${icon("compass")}Explore<span class="chev">${icon("chev")}</span></button><div class="mega" role="menu"></div></div></nav>
        ${u ? right : `<div class="nav-auth">${right}</div>`}
        <button class="menu-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon("menu")}</button>
      </div>
      <div class="wrap mobile-menu" id="mobile-menu" hidden>
        ${navHTML}
        <p class="mm-h">Explore</p>
        <div class="sub-links">${moreHTML}</div>
        ${u ? `<button class="btn plain block" data-logout style="margin-top:12px">${icon("logout")}Log out</button>`
            : `<div class="duo"><a class="btn ghost" href="login.html">Log In</a><a class="btn" href="signup.html">Sign Up</a></div>`}
      </div>`;
    const mb = $("#menu-btn"), mm = $("#mobile-menu");
    mb.addEventListener("click", () => { const o = mm.hidden; mm.hidden = !o; mb.setAttribute("aria-expanded", String(o)); mb.innerHTML = icon(o ? "x" : "menu"); });
    const ub = $("#user-btn"), um = $("#user-menu");
    if (ub) ub.addEventListener("click", e => { e.stopPropagation(); const o = um.hidden; um.hidden = !o; ub.setAttribute("aria-expanded", String(o)); });
    document.addEventListener("click", e => { if (um && !e.target.closest(".user-wrap")) { um.hidden = true; ub && ub.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { if (um) um.hidden = true; mm.hidden = true; mb.setAttribute("aria-expanded", "false"); mb.innerHTML = icon("menu"); } });
    addEventListener("resize", () => { if (innerWidth > 1080 && !mm.hidden) { mm.hidden = true; mb.innerHTML = icon("menu"); } });
    addEventListener("scroll", () => host.classList.toggle("scrolled", scrollY > 8), { passive: true });
    // Dropdowns: open on hover / focus / click, build content on first open
    const nav = $(".nav-links", host), ind = $(".nav-ind", host);
    const moveInd = (el) => { if (!el) { ind.style.opacity = 0; return; } const r = el.getBoundingClientRect(), n = nav.getBoundingClientRect(); ind.style.opacity = 1; ind.style.width = r.width + 24 + "px"; ind.style.transform = `translateX(${r.left - n.left - 12}px)`; };
    let closeT;
    const openItem = (it) => {
      clearTimeout(closeT);
      $$(".nav-item.open", host).forEach(x => { if (x !== it) { x.classList.remove("open"); $(".nav-top", x).setAttribute("aria-expanded", "false"); } });
      if (!it) return;
      const m = $(".mega", it); if (!m.dataset.built) { m.innerHTML = MENUS[it.dataset.menu](); m.dataset.built = 1; if (SR.tickCountdowns) SR.tickCountdowns(); }
      it.classList.add("open"); $(".nav-top", it).setAttribute("aria-expanded", "true");
      // keep the panel inside the viewport
      m.style.setProperty("--shift", "0px"); const r = m.getBoundingClientRect(); const over = r.right - (innerWidth - 16), under = 16 - r.left; m.style.setProperty("--shift", (over > 0 ? -over : under > 0 ? under : 0) + "px");
    };
    $$(".nav-top", nav).forEach(t => {
      t.addEventListener("mouseenter", () => { moveInd(t); const it = t.closest(".nav-item"); openItem(it); });
      t.addEventListener("focus", () => moveInd(t));
    });
    $$(".nav-item", nav).forEach(it => {
      it.addEventListener("mouseleave", () => { closeT = setTimeout(() => openItem(null), 160); });
      it.addEventListener("mouseenter", () => clearTimeout(closeT));
      const top = $(".nav-top", it);
      top.addEventListener("click", e => { if (top.tagName === "BUTTON" || matchMedia("(hover: none)").matches) { e.preventDefault(); it.classList.contains("open") ? openItem(null) : openItem(it); } });
      top.addEventListener("keydown", e => { if (e.key === "ArrowDown" || (e.key === "Enter" && top.tagName === "BUTTON")) { e.preventDefault(); openItem(it); const f = $(".mega a", it); f && f.focus(); } });
      it.addEventListener("focusout", e => { if (!it.contains(e.relatedTarget)) it.classList.remove("open"); });
    });
    nav.addEventListener("mouseleave", () => { const curA = $('[aria-current="page"]', nav); moveInd(curA); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") openItem(null); });
    document.addEventListener("click", e => { if (!e.target.closest(".nav-item")) openItem(null); });
    requestAnimationFrame(() => moveInd($('[aria-current="page"]', nav)));
    addEventListener("resize", () => moveInd($('[aria-current="page"]', nav)));
    document.fonts && document.fonts.ready.then(() => moveInd($('[aria-current="page"]', nav)));
    void staff;
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-logout]")) { SR.auth.signOut(); location.href = "index.html"; } });

  /* Conic "Brand/Accent" shapes used in the footer, auth art and page banners */
  SR.shapes = (list) => list.map(([l, t, w, h, r = 0, extra = ""]) => `<span class="shape-c" aria-hidden="true" style="left:${l};top:${t};width:${w};height:${h};border-radius:${r};${extra}"></span>`).join("");

  function renderFooter() {
    const host = $("#site-footer"); if (!host) return;
    if (host.dataset.variant === "mini") { host.className = "mini-footer band"; host.innerHTML = "© SkillRadius. All rights reserved."; return; }
    host.className = "site-footer";
    // Social profiles come from SR.social in data.js. Until a link is filled in, the icon says so instead of going nowhere.
    const soc = (k, label) => { const u = (SR.social || {})[k]; return u ? `href="${esc(u)}" target="_blank" rel="noopener" aria-label="SkillRadius on ${label}"` : `href="#" aria-label="SkillRadius on ${label}" data-toast="Our ${label} page is launching soon"`; };
    const yt = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z"/></svg>`;
    const col = (title, links) => `<nav class="fcol" aria-label="${title}"><h4>${title}</h4><ul>${links.map(([h, l, tag]) => `<li><a href="${h}">${l}${tag ? `<span class="tag">${tag}</span>` : ""}</a></li>`).join("")}</ul></nav>`;
    host.innerHTML = `
      <span class="f-glow g1" aria-hidden="true"></span><span class="f-glow g2" aria-hidden="true"></span><img class="f-sym tr" src="assets/img/art-band-r.webp" alt="" aria-hidden="true"><img class="f-sym bl" src="assets/img/art-band-l.webp" alt="" aria-hidden="true"><img class="f-sym mk" src="assets/img/art-empty-mark.webp" alt="" aria-hidden="true">
      <div class="wrap">
        <div class="f-news">
          <svg class="fn-rings" viewBox="0 0 300 300" aria-hidden="true"><circle cx="300" cy="150" r="60"/><circle cx="300" cy="150" r="105"/><circle cx="300" cy="150" r="150"/><circle cx="300" cy="150" r="195"/></svg>
          <span class="fn-mark" aria-hidden="true"><i></i><i></i><img src="assets/img/logo-mark.svg" alt=""></span>
          <div class="f-news-l"><h3>Grow your <span>skill radius</span></h3><p>New batches, free webinars and career tips. Every two weeks, no spam.</p></div>
          <form class="f-news-form" id="f-news" novalidate><label for="f-news-email" class="sr-only">Email address</label>${icon("mail")}<input id="f-news-email" type="email" placeholder="Enter your email" autocomplete="email"><button class="btn" type="submit">Subscribe ${icon("arrow")}</button></form>
        </div>
        <div class="f-grid">
          <div class="f-brand">
            <a class="f-logo" href="index.html" aria-label="SkillRadius home"><img src="assets/img/logo-mark.svg" alt="" width="40" height="40"><img class="word" src="assets/img/logo-word.svg" alt="SkillRadius" height="20"></a>
            <p>Expert-led courses, live trainer batches and industry-recognised certifications, built to help you land and grow in real careers.</p>
            <ul class="f-contact">
              <li>${icon("phone")}<a href="tel:+919876543210">+91 98765 43210</a><span>Mon–Sat, 9:30 am – 7 pm IST</span></li>
              <li>${icon("mail")}<a href="mailto:support@skillradius.in">support@skillradius.in</a></li>
              <li>${icon("pin")}<span class="addr">Embassy Golf Links Business Park, Challaghatta, Bengaluru, Karnataka 560071</span></li>
            </ul>
            <div class="f-social">
              <a ${soc("linkedin", "LinkedIn")}>${icon("li")}</a>
              <a ${soc("instagram", "Instagram")}>${icon("ig")}</a>
              <a ${soc("youtube", "YouTube")}>${yt}</a>
              <a ${soc("x", "X")}>${icon("xlogo")}</a>
              <a ${soc("facebook", "Facebook")}>${icon("fb")}</a>
            </div>
          </div>
          ${col("Learn", [["courses.html", "All courses"], ["certifications.html", "Certifications"], ["trainings.html", "Live trainings"], ["paths.html", "Career paths"], ["events.html", "Free webinars", "Free"], ["scholarships.html", "Scholarships"]])}
          ${col("Company", [["about.html", "About us"], ["placements.html", "Placements"], ["business.html", "For business"], ["teach.html", "Become a trainer"], ["careers.html", "Careers", "Hiring"], ["press.html", "Press"], ["blog.html", "Blog"]])}
          ${col("Support", [["help.html", "Help centre"], ["contact.html", "Contact us"], ["verify.html", "Verify a certificate"], ["refer.html", "Refer &amp; earn"], ["instructors.html", "Our trainers"], ["sitemap.html", "Sitemap"]])}
          ${col("Legal", [["terms.html", "Terms &amp; conditions"], ["privacy.html", "Privacy policy"], ["refund-policy.html", "Refund policy"], ["delivery-policy.html", "Delivery policy"], ["cookie-policy.html", "Cookie policy"], ["grievance.html", "Grievance redressal"], ["accessibility.html", "Accessibility"]])}
        </div>
        <div class="f-trust">
          <span>${icon("shield")}ISO 9001:2015 certified</span><span>${icon("award")}MSME registered</span><span>${icon("lock")}GDPR compliant</span><span>${icon("cert")}Verifiable certificate IDs</span>
          <span class="pay" aria-label="Payment methods"><b>UPI</b><b>Visa</b><b>Mastercard</b><b>RuPay</b><b>Net banking</b><b>EMI</b></span>
        </div>
        <div class="f-bottom">
          <span>© ${new Date().getFullYear()} SkillRadius. All rights reserved.</span>
          <span class="links"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="refund-policy.html">Refunds</a><button type="button" data-cookie-settings>Cookie settings</button></span>
          <span class="made">Made in Bengaluru, India <button type="button" class="f-top" id="f-top" aria-label="Back to top">${icon("arrow")}</button></span>
        </div>
      </div>
      <div class="f-word" id="f-word" aria-hidden="true"><span>SkillRadius</span><span class="lit">SkillRadius</span></div>`;
    $("#f-top").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
    const fw = $("#f-word");
    fw.addEventListener("pointermove", e => { const r = fw.getBoundingClientRect(); fw.style.setProperty("--wx", (e.clientX - r.left) + "px"); fw.style.setProperty("--wy", (e.clientY - r.top) + "px"); fw.classList.add("on"); });
    fw.addEventListener("pointerleave", () => fw.classList.remove("on"));
    if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { host.classList.add("f-in"); io.disconnect(); } }, { threshold: .1 }); io.observe(host); } else host.classList.add("f-in");
    const nf = $("#f-news");
    nf.addEventListener("submit", e => {
      e.preventDefault(); const inp = $("#f-news-email"), v = inp.value.trim();
      if (!SR.validEmail(v)) { inp.classList.add("bad"); inp.focus(); SR.toast("Enter a valid email address to subscribe."); return; }
      inp.classList.remove("bad"); SR.addLead && SR.addLead("newsletter", { email: v }); // → Replace with POST /api/newsletter
      nf.innerHTML = `<p class="f-done">${icon("check")}<span>You're subscribed. Watch for our next email at <b>${esc(v)}</b>.</span></p>`;
    });
  }
  SR.validEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v);

  /* ---------- Shared form helpers ---------- */
  SR.fieldError = (input, msg) => {
    const f = input.closest(".field"); if (!f) return;
    let e = f.querySelector(".err");
    if (msg) { f.classList.add("invalid"); input.setAttribute("aria-invalid", "true"); if (!e) { e = document.createElement("span"); e.className = "err"; f.appendChild(e); } e.textContent = msg; }
    else { f.classList.remove("invalid"); input.removeAttribute("aria-invalid"); if (e) e.remove(); }
  };
  SR.bindPasswordToggles = (root = document) => $$(".pw button", root).forEach(b => b.addEventListener("click", () => {
    const i = b.parentElement.querySelector("input"), show = i.type === "password";
    i.type = show ? "text" : "password"; b.innerHTML = icon(show ? "eyeoff" : "eye"); b.setAttribute("aria-label", show ? "Hide password" : "Show password");
  }));

  /* ---------- Cookie consent (DPDP-style: essential always on, others opt-in) ---------- */
  function consentBanner(force) {
    if (!force && SR.store.get("consent")) return;
    if (document.querySelector('meta[name="sr-page"][content="exam"],meta[name="sr-page"][content="admin"],meta[name="sr-page"][content="trainer"]')) return;
    let el = $("#cookie-banner"); if (el) el.remove();
    const c = SR.store.get("consent", { analytics: false, marketing: false });
    el = document.createElement("div"); el.id = "cookie-banner"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Cookie preferences");
    el.innerHTML = `<style>
      #cookie-banner{position:fixed;z-index:85;left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));max-width:720px;margin:0 auto;background:#fff;border:1px solid #e7e9f2;border-radius:16px;box-shadow:0 24px 50px -20px rgba(20,30,80,.45);padding:18px 20px;font-family:"Instrument Sans",system-ui,sans-serif;color:#0f1424;font-size:14.5px;line-height:1.5}
      #cookie-banner h2{font-size:16px;margin:0 0 4px;font-weight:600}#cookie-banner p{margin:0;color:#555a6b}#cookie-banner a{color:#3c5ac7;font-weight:600}
      #cookie-banner .cb-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:14px}
      #cookie-banner button{font:inherit;font-weight:600;border-radius:10px;padding:9px 15px;cursor:pointer;border:1.5px solid #3c5ac7;background:#fff;color:#3c5ac7}
      #cookie-banner button.p{background:#3c5ac7;color:#fff}#cookie-banner .cb-prefs{display:grid;gap:8px;margin-top:12px}
      #cookie-banner label{display:flex;gap:10px;align-items:flex-start;background:#f6f8ff;border-radius:10px;padding:10px 12px;font-size:14px}#cookie-banner label input{margin-top:3px;accent-color:#3c5ac7;width:16px;height:16px}
      #cookie-banner label span{color:#555a6b;font-size:13px;display:block}
      @media(max-width:520px){#cookie-banner{left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));padding:12px 14px;font-size:12.5px;line-height:1.4;border-radius:14px}#cookie-banner h2{font-size:14px;margin-bottom:2px}#cookie-banner .cb-row{margin-top:10px;gap:6px;flex-wrap:nowrap}#cookie-banner .cb-row button{flex:1 1 0;padding:8px 6px;font-size:12px;line-height:1.2;white-space:nowrap;border-radius:9px}#cookie-banner .cb-x{display:none}}</style>
      <h2>We value your privacy</h2>
      <p>We use essential cookies to keep you signed in and remember your progress. With your consent, we'd also use analytics and marketing cookies. <a href="cookie-policy.html">Cookie Policy</a></p>
      <div class="cb-prefs" id="cb-prefs" ${force ? "" : "hidden"}>
        <label><input type="checkbox" checked disabled><div><b>Essential</b><span>Sign-in, checkout and progress. Always on.</span></div></label>
        <label><input type="checkbox" id="cb-an" ${c.analytics ? "checked" : ""}><div><b>Analytics</b><span>Helps us understand which lessons work.</span></div></label>
        <label><input type="checkbox" id="cb-mk" ${c.marketing ? "checked" : ""}><div><b>Marketing</b><span>Relevant offers on other sites.</span></div></label>
      </div>
      <div class="cb-row"><button type="button" id="cb-rej" aria-label="Reject non-essential cookies">Reject<span class="cb-x"> non-essential</span></button><button type="button" id="cb-pref">${force ? "Save choices" : "Preferences"}</button><button type="button" class="p" id="cb-acc">Accept all</button></div>`;
    document.body.appendChild(el);
    const save = (a, m) => { SR.store.set("consent", { analytics: a, marketing: m, at: Date.now() }); el.remove(); SR.toast("Cookie preferences saved"); };
    $("#cb-acc", el).addEventListener("click", () => save(true, true));
    $("#cb-rej", el).addEventListener("click", () => save(false, false));
    $("#cb-pref", el).addEventListener("click", () => { const p = $("#cb-prefs", el); if (p.hidden) { p.hidden = false; $("#cb-pref", el).textContent = "Save choices"; } else save($("#cb-an", el).checked, $("#cb-mk", el).checked); });
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-cookie-settings]")) consentBanner(true); });

  /* ---------- Lead forms ----------
     <form data-lead="business"> with inputs that have name=, and optional
     data-req (required) / data-kind="email|phone". On success the form is
     replaced by a confirmation and a lead is stored for the admin panel. */
  SR.leadForm = (form, opts = {}) => {
    const u = SR.auth.user();
    if (u) { const f = form.querySelector('[name="name"]'), e = form.querySelector('[name="email"]'), ph = form.querySelector('[name="phone"]'); if (f && !f.value) f.value = (u.firstName + " " + (u.lastName || "")).trim(); if (e && !e.value) e.value = u.email; if (ph && !ph.value && u.phone) ph.value = u.phone; }
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", ev => {
      ev.preventDefault();
      let first = null; const data = {};
      $$("[name]", form).forEach(el => {
        const v = el.type === "checkbox" ? el.checked : el.type === "file" ? (el.files[0] ? el.files[0].name : "") : el.value.trim();
        data[el.name] = v;
        let msg = "";
        if (el.hasAttribute("data-req") && (v === "" || v === false)) msg = el.dataset.msg || "This field is required.";
        else if (v && el.dataset.kind === "email" && !SR.validEmail(v)) msg = "Enter a valid email address.";
        else if (v && el.dataset.kind === "phone" && !/^[6-9]\d{9}$/.test(String(v).replace(/\D/g, "").slice(-10))) msg = "Enter a 10-digit mobile number.";
        else if (v && el.dataset.kind === "url" && !/^https?:\/\/\S+\.\S+/.test(v)) msg = "Enter a full link starting with https://";
        if (el.type === "checkbox") { const box = el.closest("label"); if (box) box.style.color = msg ? "var(--danger)" : ""; }
        else SR.fieldError(el, msg);
        if (msg && !first) first = el;
      });
      if (first) { first.focus(); return; }
      // → Replace with POST /api/leads
      const lead = SR.addLead(opts.type || form.dataset.lead, { ...data, ...(opts.extra || {}) });
      if (opts.onDone) opts.onDone(lead, data);
      else form.innerHTML = `<div class="center stack" style="justify-items:center;padding:24px 8px"><span style="width:64px;height:64px;border-radius:50%;background:var(--success-soft);color:var(--success);display:grid;place-items:center">${icon("check", 'width="32" height="32"')}</span><h3 style="font-size:21px">${esc(opts.title || "Thanks, we've got it")}</h3><p class="muted">${esc(opts.message || "Our team will get back to you within one working day.")} Reference: <b>${lead.id}</b></p></div>`;
    });
  };

  /* ---------- Boot ---------- */
  document.body.insertAdjacentHTML("afterbegin", SR.gradients);
  renderHeader(); renderFooter();
  setTimeout(() => consentBanner(false), 600);

  /* Shared page header: SkillRadius shapes, breadcrumb and a branded eyebrow */
  $$(".page-hero").forEach(h => {
    if (!h.querySelector(".ph-shapes")) h.insertAdjacentHTML("afterbegin", `<div class="ph-shapes" aria-hidden="true"><i class="c"></i><i></i><i class="c"></i><i></i><i class="c"></i><i class="c"></i></div>`);
    const inner = h.querySelector(".inner"), eb = inner && inner.querySelector(".eyebrow");
    if (eb && !eb.querySelector(".mk")) eb.insertAdjacentHTML("afterbegin", `<span class="mk" aria-hidden="true"><img src="assets/img/logo-mark.svg" alt=""></span>`);
    if (inner && !inner.querySelector(".ph-crumb") && !h.hasAttribute("data-no-crumb")) {
      const name = (document.title.split("·")[0] || "").trim();
      if (name && !/^SkillRadius/.test(name)) inner.insertAdjacentHTML("afterbegin", `<ol class="ph-crumb" aria-label="Breadcrumb"><li><a href="index.html">Home</a></li><li aria-current="page">${esc(name)}</li></ol>`);
    }
  });
})();
/* Material Symbols exported from the Figma file (exact paths). SR.ficon(name, attrs) */
SR.FIG_ICONS={"search":[24,24,"<path transform=\"matrix(1 0 0 1 4.32 4.195)\" d=\"M14.971 14.544C14.605 14.91 14.017 14.931 13.625 14.591L10.3 11.7C9.8 12.1 9.225 12.417 8.575 12.65C7.925 12.883 7.233 13 6.5 13C4.683 13 3.146 12.371 1.888 11.113C0.629 9.854 0 8.317 0 6.5C0 4.683 0.629 3.146 1.888 1.888C3.146 0.629 4.683 0 6.5 0C8.317 0 9.854 0.629 11.113 1.888C12.371 3.146 13 4.683 13 6.5C13 7.233 12.883 7.925 12.65 8.575C12.417 9.225 12.1 9.8 11.7 10.3L14.921 13.1C15.353 13.476 15.376 14.139 14.971 14.544ZM6.5 11C7.75 11 8.813 10.563 9.688 9.688C10.563 8.813 11 7.75 11 6.5C11 5.25 10.563 4.188 9.688 3.313C8.813 2.438 7.75 2 6.5 2C5.25 2 4.188 2.438 3.313 3.313C2.438 4.188 2 5.25 2 6.5C2 7.75 2.438 8.813 3.313 9.688C4.188 10.563 5.25 11 6.5 11Z\"/>"],"home":[24,24,"<path transform=\"matrix(1 0 0 1 4 3)\" d=\"M2 14.5C2 15.328 2.672 16 3.5 16C4.328 16 5 15.328 5 14.5L5 12C5 10.895 5.895 10 7 10L9 10C10.105 10 11 10.895 11 12L11 14.5C11 15.328 11.672 16 12.5 16C13.328 16 14 15.328 14 14.5L14 8C14 7.37 13.704 6.778 13.2 6.4L9.2 3.4C8.489 2.867 7.511 2.867 6.8 3.4L2.8 6.4C2.296 6.778 2 7.37 2 8L2 14.5ZM2 18C0.895 18 0 17.105 0 16L0 7C0 6.37 0.296 5.778 0.8 5.4L6.8 0.9C7.511 0.367 8.489 0.367 9.2 0.9L15.2 5.4C15.704 5.778 16 6.37 16 7L16 16C16 17.105 15.105 18 14 18L11 18C9.895 18 9 17.105 9 16L9 13C9 12.448 8.552 12 8 12C7.448 12 7 12.448 7 13L7 16C7 17.105 6.105 18 5 18L2 18Z\"/>"],"animated_images":[24,24,"<path transform=\"matrix(1 0 0 1 2.108 2)\" d=\"M9.892 11.5L15.892 7.5L9.892 3.5L9.892 11.5ZM10.592 17L16.192 17C16.075 17.433 15.875 17.783 15.592 18.05C15.308 18.317 14.942 18.483 14.492 18.55L3.592 19.875C3.042 19.958 2.546 19.829 2.104 19.488C1.663 19.146 1.408 18.7 1.342 18.15L0.017 7.225C-0.05 6.675 0.083 6.183 0.417 5.75C0.75 5.317 1.192 5.067 1.742 5L2.892 4.85L2.892 6.85L1.992 6.975L3.342 17.9L10.592 17ZM6.892 15C6.342 15 5.871 14.804 5.479 14.413C5.088 14.021 4.892 13.55 4.892 13L4.892 2C4.892 1.45 5.088 0.979 5.479 0.588C5.871 0.196 6.342 0 6.892 0L17.892 0C18.442 0 18.913 0.196 19.304 0.588C19.696 0.979 19.892 1.45 19.892 2L19.892 13C19.892 13.55 19.696 14.021 19.304 14.413C18.913 14.804 18.442 15 17.892 15L6.892 15ZM6.892 13L17.892 13L17.892 2L6.892 2L6.892 13Z\"/>"],"auto_stories":[24,24,"<path transform=\"matrix(1 0 0 1 1 0.5)\" d=\"M11 19.5C10.2 18.867 9.333 18.375 8.4 18.025C7.467 17.675 6.5 17.5 5.5 17.5C4.8 17.5 4.113 17.592 3.438 17.775C2.763 17.958 2.117 18.217 1.5 18.55C1.15 18.733 0.813 18.725 0.488 18.525C0.162 18.325 0 18.033 0 17.65L0 5.6C0 5.417 0.046 5.242 0.138 5.075C0.229 4.908 0.367 4.783 0.55 4.7C1.317 4.3 2.117 4 2.95 3.8C3.783 3.6 4.633 3.5 5.5 3.5C6.467 3.5 7.413 3.625 8.338 3.875C9.263 4.125 10.15 4.5 11 5L11 17.1C11.85 16.567 12.742 16.167 13.675 15.9C14.608 15.633 15.55 15.5 16.5 15.5C17.1 15.5 17.688 15.55 18.263 15.65C18.838 15.75 19.417 15.9 20 16.1L20 4.1C20.25 4.183 20.496 4.271 20.738 4.363C20.979 4.454 21.217 4.567 21.45 4.7C21.633 4.783 21.771 4.908 21.863 5.075C21.954 5.242 22 5.417 22 5.6L22 17.65C22 18.033 21.838 18.325 21.513 18.525C21.188 18.725 20.85 18.733 20.5 18.55C19.883 18.217 19.237 17.958 18.563 17.775C17.888 17.592 17.2 17.5 16.5 17.5C15.5 17.5 14.533 17.675 13.6 18.025C12.667 18.375 11.8 18.867 11 19.5ZM13 14.5L13 5L18 0L18 10L13 14.5ZM9 16.125L9 6.225C8.45 5.992 7.879 5.813 7.287 5.688C6.696 5.563 6.1 5.5 5.5 5.5C4.883 5.5 4.283 5.558 3.7 5.675C3.117 5.792 2.55 5.967 2 6.2L2 16.125C2.583 15.908 3.162 15.75 3.737 15.65C4.313 15.55 4.9 15.5 5.5 15.5C6.1 15.5 6.688 15.55 7.263 15.65C7.838 15.75 8.417 15.908 9 16.125Z\"/>"],"keyboard_arrow_down":[24,24,"<path transform=\"matrix(1 0 0 1 6 8)\" d=\"M6 7.4L0 1.4L1.4 0L6 4.6L10.6 0L12 1.4L6 7.4Z\"/>"],"discover_tune":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M11 6C10.448 6 10 5.552 10 5C10 4.448 10.448 4 11 4L12 4C12.552 4 13 3.552 13 3L13 1C13 0.448 13.448 0 14 0C14.552 0 15 0.448 15 1L15 3C15 3.552 15.448 4 16 4L17 4C17.552 4 18 4.448 18 5C18 5.552 17.552 6 17 6L11 6ZM14 18C13.448 18 13 17.552 13 17L13 9C13 8.448 13.448 8 14 8C14.552 8 15 8.448 15 9L15 17C15 17.552 14.552 18 14 18ZM4 18C3.448 18 3 17.552 3 17L3 15C3 14.448 2.552 14 2 14L1 14C0.448 14 0 13.552 0 13C0 12.448 0.448 12 1 12L7 12C7.552 12 8 12.448 8 13C8 13.552 7.552 14 7 14L6 14C5.448 14 5 14.448 5 15L5 17C5 17.552 4.552 18 4 18ZM4 10C3.448 10 3 9.552 3 9L3 1C3 0.448 3.448 0 4 0C4.552 0 5 0.448 5 1L5 9C5 9.552 4.552 10 4 10Z\"/>"],"check_circle":[40,40,"<path transform=\"matrix(1 0 0 1 3.336 3.333)\" d=\"M14.333 24.333L26.083 12.583L23.75 10.25L14.333 19.667L9.583 14.917L7.25 17.25L14.333 24.333ZM16.667 33.333C14.361 33.333 12.194 32.896 10.167 32.021C8.139 31.146 6.375 29.958 4.875 28.458C3.375 26.958 2.188 25.194 1.313 23.167C0.437 21.139 0 18.972 0 16.667C0 14.361 0.437 12.194 1.313 10.167C2.188 8.139 3.375 6.375 4.875 4.875C6.375 3.375 8.139 2.188 10.167 1.313C12.194 0.437 14.361 0 16.667 0C18.972 0 21.139 0.437 23.167 1.313C25.194 2.188 26.958 3.375 28.458 4.875C29.958 6.375 31.146 8.139 32.021 10.167C32.896 12.194 33.333 14.361 33.333 16.667C33.333 18.972 32.896 21.139 32.021 23.167C31.146 25.194 29.958 26.958 28.458 28.458C26.958 29.958 25.194 31.146 23.167 32.021C21.139 32.896 18.972 33.333 16.667 33.333Z\"/>"],"schedule":[24,24,"<path transform=\"matrix(1 0 0 1 2 2)\" d=\"M13.3 14.7L14.7 13.3L11 9.6L11 5L9 5L9 10.4L13.3 14.7ZM10 20C8.617 20 7.317 19.737 6.1 19.212C4.883 18.688 3.825 17.975 2.925 17.075C2.025 16.175 1.313 15.117 0.788 13.9C0.262 12.683 0 11.383 0 10C0 8.617 0.262 7.317 0.788 6.1C1.313 4.883 2.025 3.825 2.925 2.925C3.825 2.025 4.883 1.313 6.1 0.788C7.317 0.262 8.617 0 10 0C11.383 0 12.683 0.262 13.9 0.788C15.117 1.313 16.175 2.025 17.075 2.925C17.975 3.825 18.688 4.883 19.212 6.1C19.737 7.317 20 8.617 20 10C20 11.383 19.737 12.683 19.212 13.9C18.688 15.117 17.975 16.175 17.075 17.075C16.175 17.975 15.117 18.688 13.9 19.212C12.683 19.737 11.383 20 10 20ZM10 18C12.217 18 14.104 17.221 15.663 15.663C17.221 14.104 18 12.217 18 10C18 7.783 17.221 5.896 15.663 4.338C14.104 2.779 12.217 2 10 2C7.783 2 5.896 2.779 4.338 4.338C2.779 5.896 2 7.783 2 10C2 12.217 2.779 14.104 4.338 15.663C5.896 17.221 7.783 18 10 18Z\"/>"],"description":[24,24,"<path transform=\"matrix(1 0 0 1 4 2)\" d=\"M4 16L12 16L12 14L4 14L4 16ZM4 12L12 12L12 10L4 10L4 12ZM2 20C1.45 20 0.979 19.804 0.588 19.413C0.196 19.021 0 18.55 0 18L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L10 0L16 6L16 18C16 18.55 15.804 19.021 15.413 19.413C15.021 19.804 14.55 20 14 20L2 20ZM9 7L9 2L2 2L2 18L14 18L14 7L9 7Z\"/>"],"download":[24,24,"<path transform=\"matrix(1 0 0 1 4 4)\" d=\"M8 12L3 7L4.4 5.55L7 8.15L7 0L9 0L9 8.15L11.6 5.55L13 7L8 12ZM2 16C1.45 16 0.979 15.804 0.588 15.413C0.196 15.021 0 14.55 0 14L0 11L2 11L2 14L14 14L14 11L16 11L16 14C16 14.55 15.804 15.021 15.413 15.413C15.021 15.804 14.55 16 14 16L2 16Z\"/>"],"mobile":[24,24,"<path transform=\"matrix(1 0 0 1 5 1)\" d=\"M2 22C1.45 22 0.979 21.804 0.588 21.413C0.196 21.021 0 20.55 0 20L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L12 0C12.55 0 13.021 0.196 13.413 0.588C13.804 0.979 14 1.45 14 2L14 5.1C14.3 5.217 14.542 5.4 14.725 5.65C14.908 5.9 15 6.183 15 6.5L15 8.5C15 8.817 14.908 9.1 14.725 9.35C14.542 9.6 14.3 9.783 14 9.9L14 20C14 20.55 13.804 21.021 13.413 21.413C13.021 21.804 12.55 22 12 22L2 22ZM2 20L12 20L12 2L2 2L2 20ZM7.713 4.713C7.904 4.521 8 4.283 8 4C8 3.717 7.904 3.479 7.713 3.288C7.521 3.096 7.283 3 7 3C6.717 3 6.479 3.096 6.287 3.288C6.096 3.479 6 3.717 6 4C6 4.283 6.096 4.521 6.287 4.713C6.479 4.904 6.717 5 7 5C7.283 5 7.521 4.904 7.713 4.713Z\"/>"],"closed_caption":[24,24,"<path transform=\"matrix(1 0 0 1 3 4)\" d=\"M2 16C1.45 16 0.979 15.804 0.588 15.413C0.196 15.021 0 14.55 0 14L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L16 0C16.55 0 17.021 0.196 17.413 0.588C17.804 0.979 18 1.45 18 2L18 14C18 14.55 17.804 15.021 17.413 15.413C17.021 15.804 16.55 16 16 16L2 16ZM2 14L16 14L16 2L2 2L2 14ZM4 11L7 11C7.283 11 7.521 10.904 7.713 10.713C7.904 10.521 8 10.283 8 10L8 9L6.5 9L6.5 9.5L4.5 9.5L4.5 6.5L6.5 6.5L6.5 7L8 7L8 6C8 5.717 7.904 5.479 7.713 5.287C7.521 5.096 7.283 5 7 5L4 5C3.717 5 3.479 5.096 3.288 5.287C3.096 5.479 3 5.717 3 6L3 10C3 10.283 3.096 10.521 3.288 10.713C3.479 10.904 3.717 11 4 11ZM11 11L14 11C14.283 11 14.521 10.904 14.713 10.713C14.904 10.521 15 10.283 15 10L15 9L13.5 9L13.5 9.5L11.5 9.5L11.5 6.5L13.5 6.5L13.5 7L15 7L15 6C15 5.717 14.904 5.479 14.713 5.287C14.521 5.096 14.283 5 14 5L11 5C10.717 5 10.479 5.096 10.288 5.287C10.096 5.479 10 5.717 10 6L10 10C10 10.283 10.096 10.521 10.288 10.713C10.479 10.904 10.717 11 11 11Z\"/>"],"award_star":[24,24,"<path transform=\"matrix(1 0 0 1 0.699 0.7)\" d=\"M8.375 15.55L11.3 13.775L14.225 15.55L13.45 12.225L16.05 9.975L12.625 9.7L11.3 6.55L9.975 9.7L6.55 9.975L9.15 12.225L8.375 15.55ZM11.3 22.6L7.95 19.3L3.3 19.3L3.3 14.65L0 11.3L3.3 7.95L3.3 3.3L7.95 3.3L11.3 0L14.65 3.3L19.3 3.3L19.3 7.95L22.6 11.3L19.3 14.65L19.3 19.3L14.65 19.3L11.3 22.6ZM11.3 19.8L13.8 17.3L17.3 17.3L17.3 13.8L19.8 11.3L17.3 8.8L17.3 5.3L13.8 5.3L11.3 2.8L8.8 5.3L5.3 5.3L5.3 8.8L2.8 11.3L5.3 13.8L5.3 17.3L8.8 17.3L11.3 19.8Z\"/>"],"browse_gallery":[24,24,"<path transform=\"matrix(1 0 0 1 0 3)\" d=\"M11.8 13.2L13.2 11.8L10 8.6L10 4L8 4L8 9.4L11.8 13.2ZM18 17.5L18 15.3C19.233 14.717 20.208 13.858 20.925 12.725C21.642 11.592 22 10.35 22 9C22 7.65 21.642 6.408 20.925 5.275C20.208 4.142 19.233 3.283 18 2.7L18 0.5C19.817 1.133 21.271 2.229 22.363 3.788C23.454 5.346 24 7.083 24 9C24 10.917 23.454 12.654 22.363 14.213C21.271 15.771 19.817 16.867 18 17.5ZM5.488 17.288C4.396 16.813 3.446 16.171 2.638 15.363C1.829 14.554 1.188 13.604 0.713 12.512C0.238 11.421 0 10.25 0 9C0 7.75 0.238 6.579 0.713 5.488C1.188 4.396 1.829 3.446 2.638 2.638C3.446 1.829 4.396 1.188 5.488 0.713C6.579 0.238 7.75 0 9 0C10.25 0 11.421 0.238 12.512 0.713C13.604 1.188 14.554 1.829 15.363 2.638C16.171 3.446 16.813 4.396 17.288 5.488C17.763 6.579 18 7.75 18 9C18 10.25 17.763 11.421 17.288 12.512C16.813 13.604 16.171 14.554 15.363 15.363C14.554 16.171 13.604 16.813 12.512 17.288C11.421 17.763 10.25 18 9 18C7.75 18 6.579 17.763 5.488 17.288ZM9 16C10.95 16 12.604 15.321 13.963 13.963C15.321 12.604 16 10.95 16 9C16 7.05 15.321 5.396 13.963 4.037C12.604 2.679 10.95 2 9 2C7.05 2 5.396 2.679 4.037 4.037C2.679 5.396 2 7.05 2 9C2 10.95 2.679 12.604 4.037 13.963C5.396 15.321 7.05 16 9 16Z\"/>"],"widgets":[24,24,"<path transform=\"matrix(1 0 0 1 3 1.7)\" d=\"M13.65 11.3L8 5.65L13.65 0L19.3 5.65L13.65 11.3ZM0 9.3L0 1.3L8 1.3L8 9.3L0 9.3ZM10 19.3L10 11.3L18 11.3L18 19.3L10 19.3ZM0 19.3L0 11.3L8 11.3L8 19.3L0 19.3ZM2 7.3L6 7.3L6 3.3L2 3.3L2 7.3ZM13.675 8.5L16.5 5.675L13.675 2.85L10.85 5.675L13.675 8.5ZM12 17.3L16 17.3L16 13.3L12 13.3L12 17.3ZM2 17.3L6 17.3L6 13.3L2 13.3L2 17.3Z\"/>"],"lock":[24,24,"<path transform=\"matrix(1 0 0 1 4 1)\" d=\"M2 21C1.45 21 0.979 20.804 0.588 20.413C0.196 20.021 0 19.55 0 19L0 9C0 8.45 0.196 7.979 0.588 7.588C0.979 7.196 1.45 7 2 7L3 7L3 5C3 3.617 3.488 2.438 4.463 1.462C5.438 0.487 6.617 0 8 0C9.383 0 10.563 0.487 11.538 1.462C12.513 2.438 13 3.617 13 5L13 7L14 7C14.55 7 15.021 7.196 15.413 7.588C15.804 7.979 16 8.45 16 9L16 19C16 19.55 15.804 20.021 15.413 20.413C15.021 20.804 14.55 21 14 21L2 21ZM2 19L14 19L14 9L2 9L2 19ZM9.413 15.413C9.804 15.021 10 14.55 10 14C10 13.45 9.804 12.979 9.413 12.588C9.021 12.196 8.55 12 8 12C7.45 12 6.979 12.196 6.588 12.588C6.196 12.979 6 13.45 6 14C6 14.55 6.196 15.021 6.588 15.413C6.979 15.804 7.45 16 8 16C8.55 16 9.021 15.804 9.413 15.413ZM5 7L11 7L11 5C11 4.167 10.708 3.458 10.125 2.875C9.542 2.292 8.833 2 8 2C7.167 2 6.458 2.292 5.875 2.875C5.292 3.458 5 4.167 5 5L5 7Z\"/>"],"dashboard":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M10 6L10 0L18 0L18 6L10 6ZM0 10L0 0L8 0L8 10L0 10ZM10 18L10 8L18 8L18 18L10 18ZM0 18L0 12L8 12L8 18L0 18ZM2 8L6 8L6 2L2 2L2 8ZM12 16L16 16L16 10L12 10L12 16ZM12 4L16 4L16 2L12 2L12 4ZM2 16L6 16L6 14L2 14L2 16Z\"/>"],"arrow_forward_ios":[13,13,"<path transform=\"matrix(1 0 0 1 3.385 1.083)\" d=\"M0.961 10.833L0 9.872L4.455 5.417L0 0.961L0.961 0L6.378 5.417L0.961 10.833Z\"/>"],"check":[24,24,"<path transform=\"matrix(1 0 0 1 3.85 5.975)\" d=\"M5.7 12.025L0 6.325L1.425 4.9L5.7 9.175L14.875 0L16.3 1.425L5.7 12.025Z\"/>"],"live_tv":[24,24,"<path transform=\"matrix(1 0 0 1 2 3)\" d=\"M7.5 12.5L14.5 8L7.5 3.5L7.5 12.5ZM6 18L6 16L2 16C1.45 16 0.979 15.804 0.588 15.413C0.196 15.021 0 14.55 0 14L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L18 0C18.55 0 19.021 0.196 19.413 0.588C19.804 0.979 20 1.45 20 2L20 14C20 14.55 19.804 15.021 19.413 15.413C19.021 15.804 18.55 16 18 16L14 16L14 18L6 18ZM2 14L18 14L18 2L2 2L2 14Z\"/>"],"arrow_outward":[14,14,"<path transform=\"matrix(1 0 0 1 2.916 2.917)\" d=\"M0.817 7.583L0 6.767L5.6 1.167L0.583 1.167L0.583 0L7.583 0L7.583 7L6.417 7L6.417 1.983L0.817 7.583Z\"/>"],"play_circle":[66.06,66.06,"<path transform=\"matrix(1 0 0 1 5.506 5.505)\" d=\"M20.645 39.913L39.913 27.526L20.645 15.139L20.645 39.913ZM27.526 55.052C23.718 55.052 20.14 54.33 16.791 52.884C13.442 51.439 10.529 49.478 8.051 47.001C5.574 44.523 3.613 41.61 2.168 38.261C0.723 34.912 0 31.334 0 27.526C0 23.718 0.723 20.14 2.168 16.791C3.613 13.442 5.574 10.529 8.051 8.051C10.529 5.574 13.442 3.613 16.791 2.168C20.14 0.723 23.718 0 27.526 0C31.334 0 34.912 0.723 38.261 2.168C41.61 3.613 44.523 5.574 47.001 8.051C49.478 10.529 51.439 13.442 52.884 16.791C54.33 20.14 55.052 23.718 55.052 27.526C55.052 31.334 54.33 34.912 52.884 38.261C51.439 41.61 49.478 44.523 47.001 47.001C44.523 49.478 41.61 51.439 38.261 52.884C34.912 54.33 31.334 55.052 27.526 55.052Z\"/>"],"slideshow":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M6.5 13.5L13.5 9L6.5 4.5L6.5 13.5ZM2 18C1.45 18 0.979 17.804 0.588 17.413C0.196 17.021 0 16.55 0 16L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L16 0C16.55 0 17.021 0.196 17.413 0.588C17.804 0.979 18 1.45 18 2L18 16C18 16.55 17.804 17.021 17.413 17.413C17.021 17.804 16.55 18 16 18L2 18ZM2 16L16 16L16 2L2 2L2 16Z\"/>"],"quiz":[24,24,"<path transform=\"matrix(1 0 0 1 2 2)\" d=\"M12.738 12.688C12.946 12.479 13.05 12.233 13.05 11.95C13.05 11.667 12.946 11.421 12.738 11.213C12.529 11.004 12.283 10.9 12 10.9C11.717 10.9 11.471 11.004 11.262 11.213C11.054 11.421 10.95 11.667 10.95 11.95C10.95 12.233 11.054 12.479 11.262 12.688C11.471 12.896 11.717 13 12 13C12.283 13 12.529 12.896 12.738 12.688ZM11.25 9.8L12.75 9.8C12.75 9.317 12.8 8.963 12.9 8.738C13 8.512 13.233 8.217 13.6 7.85C14.1 7.35 14.433 6.946 14.6 6.638C14.767 6.329 14.85 5.967 14.85 5.55C14.85 4.8 14.587 4.188 14.063 3.713C13.538 3.238 12.85 3 12 3C11.317 3 10.721 3.192 10.213 3.575C9.704 3.958 9.35 4.467 9.15 5.1L10.5 5.65C10.65 5.233 10.854 4.921 11.113 4.713C11.371 4.504 11.667 4.4 12 4.4C12.4 4.4 12.725 4.513 12.975 4.738C13.225 4.963 13.35 5.267 13.35 5.65C13.35 5.883 13.283 6.104 13.15 6.313C13.017 6.521 12.783 6.783 12.45 7.1C11.9 7.583 11.563 7.963 11.438 8.238C11.313 8.512 11.25 9.033 11.25 9.8ZM6 16C5.45 16 4.979 15.804 4.588 15.413C4.196 15.021 4 14.55 4 14L4 2C4 1.45 4.196 0.979 4.588 0.588C4.979 0.196 5.45 0 6 0L18 0C18.55 0 19.021 0.196 19.413 0.588C19.804 0.979 20 1.45 20 2L20 14C20 14.55 19.804 15.021 19.413 15.413C19.021 15.804 18.55 16 18 16L6 16ZM6 14L18 14L18 2L6 2L6 14ZM2 20C1.45 20 0.979 19.804 0.588 19.413C0.196 19.021 0 18.55 0 18L0 4L2 4L2 18L16 18L16 20L2 20Z\"/>"],"work":[24,24,"<path transform=\"matrix(1 0 0 1 4 3.5)\" d=\"M12.175 9L0 9L0 7L12.175 7L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z\"/>"],"link_2":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M4.95 18C3.583 18 2.417 17.517 1.45 16.55C0.483 15.583 0 14.417 0 13.05C0 12.383 0.125 11.75 0.375 11.15C0.625 10.55 0.983 10.017 1.45 9.55L4.8 6.225L6.2 7.625L2.85 10.975C2.567 11.258 2.354 11.579 2.213 11.938C2.071 12.296 2 12.667 2 13.05C2 13.867 2.287 14.563 2.862 15.137C3.438 15.712 4.133 16 4.95 16C5.333 16 5.708 15.929 6.075 15.788C6.442 15.646 6.767 15.433 7.05 15.15L10.375 11.8L11.8 13.225L8.45 16.55C7.983 17.017 7.45 17.375 6.85 17.625C6.25 17.875 5.617 18 4.95 18ZM6.925 12.5L5.5 11.075L11.075 5.5L12.5 6.925L6.925 12.5ZM13.2 11.8L11.8 10.375L15.15 7.05C15.433 6.767 15.642 6.45 15.775 6.1C15.908 5.75 15.975 5.383 15.975 5C15.975 4.167 15.692 3.458 15.125 2.875C14.558 2.292 13.858 2 13.025 2C12.642 2 12.271 2.071 11.913 2.213C11.554 2.354 11.233 2.567 10.95 2.85L7.625 6.2L6.2 4.8L9.55 1.45C10.017 0.983 10.55 0.625 11.15 0.375C11.75 0.125 12.383 0 13.05 0C14.417 0 15.579 0.483 16.538 1.45C17.496 2.417 17.975 3.592 17.975 4.975C17.975 5.625 17.854 6.25 17.613 6.85C17.371 7.45 17.017 7.983 16.55 8.45L13.2 11.8Z\"/>"],"edit":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M2 16L3.425 16L13.2 6.225L11.775 4.8L2 14.575L2 16ZM0 18L0 13.75L13.2 0.575C13.4 0.392 13.621 0.25 13.863 0.15C14.104 0.05 14.358 0 14.625 0C14.892 0 15.15 0.05 15.4 0.15C15.65 0.25 15.867 0.4 16.05 0.6L17.425 2C17.625 2.183 17.771 2.4 17.863 2.65C17.954 2.9 18 3.15 18 3.4C18 3.667 17.954 3.921 17.863 4.162C17.771 4.404 17.625 4.625 17.425 4.825L4.25 18L0 18ZM12.475 5.525L11.775 4.8L13.2 6.225L12.475 5.525Z\"/>"],"logout":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M2 18C1.45 18 0.979 17.804 0.588 17.413C0.196 17.021 0 16.55 0 16L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L9 0L9 2L2 2L2 16L9 16L9 18L2 18ZM13 14L11.625 12.55L14.175 10L6 10L6 8L14.175 8L11.625 5.45L13 4L18 9L13 14Z\"/>"],"account_circle":[24,24,"<path transform=\"matrix(1 0 0 1 2 2)\" d=\"M3.85 15.1C4.7 14.45 5.65 13.938 6.7 13.563C7.75 13.188 8.85 13 10 13C11.15 13 12.25 13.188 13.3 13.563C14.35 13.938 15.3 14.45 16.15 15.1C16.733 14.417 17.188 13.642 17.513 12.775C17.838 11.908 18 10.983 18 10C18 7.783 17.221 5.896 15.663 4.338C14.104 2.779 12.217 2 10 2C7.783 2 5.896 2.779 4.338 4.338C2.779 5.896 2 7.783 2 10C2 10.983 2.162 11.908 2.487 12.775C2.813 13.642 3.267 14.417 3.85 15.1ZM7.513 9.988C6.838 9.313 6.5 8.483 6.5 7.5C6.5 6.517 6.838 5.688 7.513 5.013C8.188 4.338 9.017 4 10 4C10.983 4 11.813 4.338 12.488 5.013C13.163 5.688 13.5 6.517 13.5 7.5C13.5 8.483 13.163 9.313 12.488 9.988C11.813 10.663 10.983 11 10 11C9.017 11 8.188 10.663 7.513 9.988ZM10 20C8.617 20 7.317 19.737 6.1 19.212C4.883 18.688 3.825 17.975 2.925 17.075C2.025 16.175 1.313 15.117 0.788 13.9C0.262 12.683 0 11.383 0 10C0 8.617 0.262 7.317 0.788 6.1C1.313 4.883 2.025 3.825 2.925 2.925C3.825 2.025 4.883 1.313 6.1 0.788C7.317 0.262 8.617 0 10 0C11.383 0 12.683 0.262 13.9 0.788C15.117 1.313 16.175 2.025 17.075 2.925C17.975 3.825 18.688 4.883 19.212 6.1C19.737 7.317 20 8.617 20 10C20 11.383 19.737 12.683 19.212 13.9C18.688 15.117 17.975 16.175 17.075 17.075C16.175 17.975 15.117 18.688 13.9 19.212C12.683 19.737 11.383 20 10 20ZM12.5 17.613C13.283 17.354 14 16.983 14.65 16.5C14 16.017 13.283 15.646 12.5 15.387C11.717 15.129 10.883 15 10 15C9.117 15 8.283 15.129 7.5 15.387C6.717 15.646 6 16.017 5.35 16.5C6 16.983 6.717 17.354 7.5 17.613C8.283 17.871 9.117 18 10 18C10.883 18 11.717 17.871 12.5 17.613ZM11.075 8.575C11.358 8.292 11.5 7.933 11.5 7.5C11.5 7.067 11.358 6.708 11.075 6.425C10.792 6.142 10.433 6 10 6C9.567 6 9.208 6.142 8.925 6.425C8.642 6.708 8.5 7.067 8.5 7.5C8.5 7.933 8.642 8.292 8.925 8.575C9.208 8.858 9.567 9 10 9C10.433 9 10.792 8.858 11.075 8.575Z\"/>"],"arrow_insert":[24,24,"<path transform=\"matrix(1 0 0 1 6 5)\" d=\"M11.6 13L2 3.4L2 12L0 12L0 0L12 0L12 2L3.4 2L13 11.6L11.6 13Z\"/>"],"verified":[24,24,"<path transform=\"matrix(1 0 0 1 1 1.5)\" d=\"M7.6 21L5.7 17.8L2.1 17L2.45 13.3L0 10.5L2.45 7.7L2.1 4L5.7 3.2L7.6 0L11 1.45L14.4 0L16.3 3.2L19.9 4L19.55 7.7L22 10.5L19.55 13.3L19.9 17L16.3 17.8L14.4 21L11 19.55L7.6 21ZM8.45 18.45L11 17.35L13.6 18.45L15 16.05L17.75 15.4L17.5 12.6L19.35 10.5L17.5 8.35L17.75 5.55L15 4.95L13.55 2.55L11 3.65L8.4 2.55L7 4.95L4.25 5.55L4.5 8.35L2.65 10.5L4.5 12.6L4.25 15.45L7 16.05L8.45 18.45ZM9.95 14.05L15.6 8.4L14.2 6.95L9.95 11.2L7.8 9.1L6.4 10.5L9.95 14.05Z\"/>"],"smart_display":[20,20,"<path transform=\"matrix(1 0 0 1 2.385 4.432)\" d=\"M5.792 8.699L10.699 5.583L5.792 2.468L5.792 8.699ZM1.34 11.167C0.965 11.167 0.648 11.037 0.389 10.778C0.13 10.519 0 10.201 0 9.826L0 1.334C0 0.959 0.13 0.642 0.389 0.385C0.648 0.128 0.965 0 1.34 0L13.827 0C14.202 0 14.519 0.13 14.778 0.389C15.037 0.648 15.167 0.965 15.167 1.341L15.167 9.833C15.167 10.208 15.037 10.524 14.778 10.781C14.519 11.038 14.202 11.167 13.827 11.167L1.34 11.167Z\"/>"],"show_chart":[24,24,"<path transform=\"matrix(1 0 0 1 2 5.5)\" d=\"M1.5 13L0 11.5L7.5 4L11.5 8L18.6 0L20 1.4L11.5 11L7.5 7L1.5 13Z\"/>"],"door_open":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M8 10C8.283 10 8.521 9.904 8.713 9.713C8.904 9.521 9 9.283 9 9C9 8.717 8.904 8.479 8.713 8.288C8.521 8.096 8.283 8 8 8C7.717 8 7.479 8.096 7.287 8.288C7.096 8.479 7 8.717 7 9C7 9.283 7.096 9.521 7.287 9.713C7.479 9.904 7.717 10 8 10ZM4 18L4 16L10 15L10 3.875C10 3.625 9.925 3.4 9.775 3.2C9.625 3 9.433 2.883 9.2 2.85L4 2L4 0L9.5 0.9C10.233 1.033 10.833 1.375 11.3 1.925C11.767 2.475 12 3.117 12 3.85L12 16.65L4 18ZM0 18L0 16L2 16L2 2C2 1.433 2.196 0.958 2.588 0.575C2.979 0.192 3.45 0 4 0L14 0C14.567 0 15.042 0.192 15.425 0.575C15.808 0.958 16 1.433 16 2L16 16L18 16L18 18L0 18ZM4 16L14 16L14 2L4 2L4 16Z\"/>"],"chess_knight":[24,24,"<path transform=\"matrix(1 0 0 1 3.418 2)\" d=\"M1.581 20L1.581 16C1.581 15.617 1.681 15.271 1.881 14.963C2.081 14.654 2.348 14.408 2.681 14.225L7.581 11.75L7.581 10L4.106 11.725C3.906 11.825 3.698 11.9 3.481 11.95C3.265 12 3.048 12.025 2.831 12.025C2.315 12.025 1.827 11.892 1.369 11.625C0.91 11.358 0.556 10.975 0.306 10.475C0.073 10.025 -0.027 9.546 0.006 9.038C0.04 8.529 0.198 8.058 0.481 7.625L3.581 3L1.581 0L7.581 0C9.798 0 11.685 0.775 13.244 2.325C14.802 3.875 15.581 5.767 15.581 8L15.581 20L1.581 20ZM3.581 18L13.581 18L13.581 8C13.581 6.333 12.998 4.917 11.831 3.75C10.665 2.583 9.248 2 7.581 2L5.331 2L5.981 3L2.156 8.75C2.073 8.883 2.027 9.021 2.019 9.163C2.01 9.304 2.04 9.442 2.106 9.575C2.19 9.758 2.302 9.879 2.444 9.938C2.585 9.996 2.723 10.025 2.856 10.025C2.906 10.025 3.031 10 3.231 9.95L9.581 6.75L9.581 13L3.581 16L3.581 18Z\"/>"],"arrow_upward":[24,24,"<path transform=\"matrix(1 0 0 1 4 4)\" d=\"M7 16L7 3.825L1.4 9.425L0 8L8 0L16 8L14.6 9.425L9 3.825L9 16L7 16Z\"/>"],"security":[24,24,"<path transform=\"matrix(1 0 0 1 4 2)\" d=\"M8 20C5.683 19.417 3.771 18.088 2.263 16.013C0.754 13.938 0 11.633 0 9.1L0 3L8 0L16 3L16 9.1C16 11.633 15.246 13.938 13.738 16.013C12.229 18.088 10.317 19.417 8 20ZM8 17.9C9.617 17.4 10.967 16.413 12.05 14.938C13.133 13.462 13.767 11.817 13.95 10L8 10L8 2.125L2 4.375L2 9.55C2 9.667 2.017 9.817 2.05 10L8 10L8 17.9Z\"/>"],"business_center":[24,24,"<path transform=\"matrix(1 0 0 1 2 2)\" d=\"M2 19C1.45 19 0.979 18.804 0.588 18.413C0.196 18.021 0 17.55 0 17L0 6C0 5.45 0.196 4.979 0.588 4.588C0.979 4.196 1.45 4 2 4L6 4L6 2C6 1.45 6.196 0.979 6.588 0.588C6.979 0.196 7.45 0 8 0L12 0C12.55 0 13.021 0.196 13.413 0.588C13.804 0.979 14 1.45 14 2L14 4L18 4C18.55 4 19.021 4.196 19.413 4.588C19.804 4.979 20 5.45 20 6L20 17C20 17.55 19.804 18.021 19.413 18.413C19.021 18.804 18.55 19 18 19L2 19ZM8 4L12 4L12 2L8 2L8 4ZM18 13L13 13L13 15L7 15L7 13L2 13L2 17L18 17L18 13ZM9 13L11 13L11 11L9 11L9 13ZM2 11L7 11L7 9L13 9L13 11L18 11L18 6L2 6L2 11Z\"/>"],"local_police":[14,14,"<path transform=\"matrix(1 0 0 1 2.334 1.167)\" d=\"M3.033 7.933L4.667 6.708L6.271 7.933L5.658 5.95L7.292 4.667L5.308 4.667L4.667 2.683L4.025 4.667L2.042 4.667L3.646 5.95L3.033 7.933ZM4.667 11.667C3.315 11.326 2.2 10.551 1.32 9.341C0.44 8.13 0 6.786 0 5.308L0 1.75L4.667 0L9.333 1.75L9.333 5.308C9.333 6.786 8.893 8.13 8.014 9.341C7.134 10.551 6.018 11.326 4.667 11.667ZM4.667 10.442C5.678 10.121 6.514 9.479 7.175 8.517C7.836 7.554 8.167 6.485 8.167 5.308L8.167 2.552L4.667 1.24L1.167 2.552L1.167 5.308C1.167 6.485 1.497 7.554 2.158 8.517C2.819 9.479 3.656 10.121 4.667 10.442Z\"/>"],"captive_portal":[18,18,"<path transform=\"matrix(1 0 0 1 1.5 1.5)\" d=\"M14.213 15.281L12 13.069L12 14.737L10.5 14.737L10.5 10.5L14.737 10.5L14.737 12L13.05 12L15.263 14.213L14.213 15.281ZM7.5 15C6.463 15 5.488 14.803 4.575 14.409C3.662 14.016 2.869 13.481 2.194 12.806C1.519 12.131 0.984 11.338 0.591 10.425C0.197 9.513 0 8.538 0 7.5C0 6.463 0.197 5.488 0.591 4.575C0.984 3.662 1.519 2.869 2.194 2.194C2.869 1.519 3.662 0.984 4.575 0.591C5.488 0.197 6.463 0 7.5 0C8.538 0 9.513 0.197 10.425 0.591C11.338 0.984 12.131 1.519 12.806 2.194C13.481 2.869 14.016 3.662 14.409 4.575C14.803 5.488 15 6.463 15 7.5C15 7.75 14.988 8 14.963 8.25C14.938 8.5 14.9 8.75 14.85 9L13.313 9C13.375 8.75 13.422 8.5 13.453 8.25C13.484 8 13.5 7.75 13.5 7.5C13.5 7.25 13.484 7 13.453 6.75C13.422 6.5 13.375 6.25 13.313 6L10.763 6C10.8 6.25 10.828 6.5 10.847 6.75C10.866 7 10.875 7.25 10.875 7.5C10.875 7.75 10.866 8 10.847 8.25C10.828 8.5 10.8 8.75 10.763 9L9.263 9C9.3 8.75 9.328 8.5 9.347 8.25C9.366 8 9.375 7.75 9.375 7.5C9.375 7.25 9.366 7 9.347 6.75C9.328 6.5 9.3 6.25 9.263 6L5.738 6C5.7 6.25 5.672 6.5 5.653 6.75C5.634 7 5.625 7.25 5.625 7.5C5.625 7.75 5.634 8 5.653 8.25C5.672 8.5 5.7 8.75 5.738 9L8.25 9L8.25 10.5L6.075 10.5C6.225 11.038 6.419 11.553 6.656 12.047C6.894 12.541 7.175 13.013 7.5 13.463C7.75 13.463 8 13.447 8.25 13.416C8.5 13.384 8.75 13.356 9 13.331L9 14.869C8.75 14.894 8.5 14.922 8.25 14.953C8 14.984 7.75 15 7.5 15ZM1.688 9L4.238 9C4.2 8.75 4.172 8.5 4.153 8.25C4.134 8 4.125 7.75 4.125 7.5C4.125 7.25 4.134 7 4.153 6.75C4.172 6.5 4.2 6.25 4.238 6L1.688 6C1.625 6.25 1.578 6.5 1.547 6.75C1.516 7 1.5 7.25 1.5 7.5C1.5 7.75 1.516 8 1.547 8.25C1.578 8.5 1.625 8.75 1.688 9ZM2.325 4.5L4.538 4.5C4.65 4.037 4.791 3.584 4.959 3.141C5.128 2.697 5.325 2.263 5.55 1.838C4.863 2.063 4.244 2.403 3.694 2.859C3.144 3.316 2.688 3.862 2.325 4.5ZM5.55 13.163C5.325 12.738 5.128 12.303 4.959 11.859C4.791 11.416 4.65 10.962 4.538 10.5L2.325 10.5C2.688 11.137 3.144 11.684 3.694 12.141C4.244 12.597 4.863 12.938 5.55 13.163ZM6.075 4.5L8.925 4.5C8.775 3.963 8.581 3.447 8.344 2.953C8.106 2.459 7.825 1.987 7.5 1.537C7.175 1.987 6.894 2.459 6.656 2.953C6.419 3.447 6.225 3.963 6.075 4.5ZM10.462 4.5L12.675 4.5C12.313 3.862 11.856 3.316 11.306 2.859C10.756 2.403 10.138 2.063 9.45 1.838C9.675 2.263 9.872 2.697 10.041 3.141C10.209 3.584 10.35 4.037 10.462 4.5Z\"/>"],"cards_stack":[17,17,"<path transform=\"matrix(1 0 0 1 1.416 2.125)\" d=\"M0.885 11.528L0.017 5.206C-0.042 4.828 0.05 4.486 0.292 4.179C0.534 3.872 0.844 3.689 1.222 3.63L2.302 11.333L7.313 10.625L12.041 10.625C11.947 10.873 11.802 11.082 11.607 11.254C11.413 11.425 11.174 11.528 10.89 11.564L2.443 12.732C2.054 12.791 1.711 12.703 1.416 12.467C1.121 12.231 0.944 11.918 0.885 11.528ZM4.25 9.279C3.86 9.279 3.527 9.14 3.249 8.863C2.972 8.586 2.833 8.252 2.833 7.863L2.833 1.417C2.833 1.027 2.972 0.694 3.249 0.416C3.527 0.139 3.86 0 4.25 0L12.75 0C13.139 0 13.473 0.139 13.75 0.416C14.028 0.694 14.166 1.027 14.166 1.417L14.166 7.863C14.166 8.252 14.028 8.586 13.75 8.863C13.473 9.14 13.139 9.279 12.75 9.279L4.25 9.279ZM4.25 7.863L12.75 7.863L12.75 1.417L4.25 1.417L4.25 7.863ZM5.666 4.25L11.333 4.25L11.333 2.833L5.666 2.833L5.666 4.25ZM5.666 6.375L9.208 6.375L9.208 4.958L5.666 4.958L5.666 6.375Z\"/>"],"emergency_home":[48,48,"<path transform=\"matrix(1 0 0 1 3.949 3.95)\" d=\"M18.525 39.8C18.042 39.6 17.6 39.317 17.2 38.95L1.15 22.9C0.783 22.5 0.5 22.058 0.3 21.575C0.1 21.092 0 20.583 0 20.05C0 19.517 0.1 19 0.3 18.5C0.5 18 0.783 17.567 1.15 17.2L17.2 1.15C17.6 0.75 18.042 0.458 18.525 0.275C19.008 0.092 19.517 0 20.05 0C20.583 0 21.1 0.092 21.6 0.275C22.1 0.458 22.533 0.75 22.9 1.15L38.95 17.2C39.35 17.567 39.642 18 39.825 18.5C40.008 19 40.1 19.517 40.1 20.05C40.1 20.583 40.008 21.092 39.825 21.575C39.642 22.058 39.35 22.5 38.95 22.9L22.9 38.95C22.533 39.317 22.1 39.6 21.6 39.8C21.1 40 20.583 40.1 20.05 40.1C19.517 40.1 19.008 40 18.525 39.8ZM20.05 36.1L36.1 20.05L20.05 4L4 20.05L20.05 36.1ZM18.05 22.05L22.05 22.05L22.05 10.05L18.05 10.05L18.05 22.05ZM21.475 27.475C21.858 27.092 22.05 26.617 22.05 26.05C22.05 25.483 21.858 25.008 21.475 24.625C21.092 24.242 20.617 24.05 20.05 24.05C19.483 24.05 19.008 24.242 18.625 24.625C18.242 25.008 18.05 25.483 18.05 26.05C18.05 26.617 18.242 27.092 18.625 27.475C19.008 27.858 19.483 28.05 20.05 28.05C20.617 28.05 21.092 27.858 21.475 27.475Z\"/>"],"block":[24,24,"<path transform=\"matrix(1 0 0 1 2 2)\" d=\"M6.1 19.212C4.883 18.688 3.825 17.975 2.925 17.075C2.025 16.175 1.313 15.117 0.788 13.9C0.262 12.683 0 11.383 0 10C0 8.617 0.262 7.317 0.788 6.1C1.313 4.883 2.025 3.825 2.925 2.925C3.825 2.025 4.883 1.313 6.1 0.788C7.317 0.262 8.617 0 10 0C11.383 0 12.683 0.262 13.9 0.788C15.117 1.313 16.175 2.025 17.075 2.925C17.975 3.825 18.688 4.883 19.212 6.1C19.737 7.317 20 8.617 20 10C20 11.383 19.737 12.683 19.212 13.9C18.688 15.117 17.975 16.175 17.075 17.075C16.175 17.975 15.117 18.688 13.9 19.212C12.683 19.737 11.383 20 10 20C8.617 20 7.317 19.737 6.1 19.212ZM10 18C10.9 18 11.767 17.854 12.6 17.563C13.433 17.271 14.2 16.85 14.9 16.3L3.7 5.1C3.15 5.8 2.729 6.567 2.438 7.4C2.146 8.233 2 9.1 2 10C2 12.233 2.775 14.125 4.325 15.675C5.875 17.225 7.767 18 10 18ZM16.3 14.9C16.85 14.2 17.271 13.433 17.563 12.6C17.854 11.767 18 10.9 18 10C18 7.767 17.225 5.875 15.675 4.325C14.125 2.775 12.233 2 10 2C9.1 2 8.233 2.146 7.4 2.438C6.567 2.729 5.8 3.15 5.1 3.7L16.3 14.9Z\"/>"],"photo_camera":[24,24,"<path transform=\"matrix(1 0 0 1 2 3)\" d=\"M10 14.5C11.25 14.5 12.313 14.063 13.188 13.188C14.063 12.313 14.5 11.25 14.5 10C14.5 8.75 14.063 7.688 13.188 6.813C12.313 5.938 11.25 5.5 10 5.5C8.75 5.5 7.688 5.938 6.813 6.813C5.938 7.688 5.5 8.75 5.5 10C5.5 11.25 5.938 12.313 6.813 13.188C7.688 14.063 8.75 14.5 10 14.5ZM10 12.5C9.3 12.5 8.708 12.258 8.225 11.775C7.742 11.292 7.5 10.7 7.5 10C7.5 9.3 7.742 8.708 8.225 8.225C8.708 7.742 9.3 7.5 10 7.5C10.7 7.5 11.292 7.742 11.775 8.225C12.258 8.708 12.5 9.3 12.5 10C12.5 10.7 12.258 11.292 11.775 11.775C11.292 12.258 10.7 12.5 10 12.5ZM2 18C1.45 18 0.979 17.804 0.588 17.413C0.196 17.021 0 16.55 0 16L0 4C0 3.45 0.196 2.979 0.588 2.588C0.979 2.196 1.45 2 2 2L5.15 2L7 0L13 0L14.85 2L18 2C18.55 2 19.021 2.196 19.413 2.588C19.804 2.979 20 3.45 20 4L20 16C20 16.55 19.804 17.021 19.413 17.413C19.021 17.804 18.55 18 18 18L2 18ZM2 16L18 16L18 4L13.95 4L12.125 2L7.875 2L6.05 4L2 4L2 16Z\"/>"],"alarm_on":[24,24,"<path transform=\"matrix(1 0 0 1 1.35 2.35)\" d=\"M9.6 14.2L15.25 8.55L13.825 7.125L9.6 11.35L7.475 9.225L6.05 10.65L9.6 14.2ZM7.138 18.938C6.046 18.462 5.096 17.821 4.288 17.013C3.479 16.204 2.838 15.254 2.363 14.163C1.888 13.071 1.65 11.9 1.65 10.65C1.65 9.4 1.888 8.229 2.363 7.138C2.838 6.046 3.479 5.096 4.288 4.287C5.096 3.479 6.046 2.837 7.138 2.362C8.229 1.887 9.4 1.65 10.65 1.65C11.9 1.65 13.071 1.887 14.163 2.362C15.254 2.837 16.204 3.479 17.013 4.287C17.821 5.096 18.463 6.046 18.938 7.138C19.413 8.229 19.65 9.4 19.65 10.65C19.65 11.9 19.413 13.071 18.938 14.163C18.463 15.254 17.821 16.204 17.013 17.013C16.204 17.821 15.254 18.462 14.163 18.938C13.071 19.413 11.9 19.65 10.65 19.65C9.4 19.65 8.229 19.413 7.138 18.938ZM4.25 0L5.65 1.4L1.4 5.65L0 4.25L4.25 0ZM17.05 0L21.3 4.25L19.9 5.65L15.65 1.4L17.05 0ZM10.65 17.65C12.6 17.65 14.254 16.971 15.613 15.613C16.971 14.254 17.65 12.6 17.65 10.65C17.65 8.7 16.971 7.046 15.613 5.688C14.254 4.329 12.6 3.65 10.65 3.65C8.7 3.65 7.046 4.329 5.688 5.688C4.329 7.046 3.65 8.7 3.65 10.65C3.65 12.6 4.329 14.254 5.688 15.613C7.046 16.971 8.7 17.65 10.65 17.65Z\"/>"],"notifications_off":[24,24,"<path transform=\"matrix(1 0 0 1 1.4 2)\" d=\"M2.6 17L2.6 15L4.6 15L4.6 8C4.6 7.45 4.671 6.908 4.813 6.375C4.954 5.842 5.167 5.333 5.45 4.85L6.95 6.35C6.833 6.617 6.746 6.887 6.688 7.162C6.629 7.438 6.6 7.717 6.6 8L6.6 15L12.8 15L0 2.2L1.4 0.8L19.8 19.2L18.4 20.6L14.75 17L2.6 17ZM16.6 13.15L14.6 11.15L14.6 8C14.6 6.9 14.208 5.958 13.425 5.175C12.642 4.392 11.7 4 10.6 4C10.167 4 9.75 4.067 9.35 4.2C8.95 4.333 8.583 4.533 8.25 4.8L6.8 3.35C7.133 3.083 7.492 2.85 7.875 2.65C8.258 2.45 8.667 2.3 9.1 2.2L9.1 1.5C9.1 1.083 9.246 0.729 9.538 0.438C9.829 0.146 10.183 0 10.6 0C11.017 0 11.371 0.146 11.663 0.438C11.954 0.729 12.1 1.083 12.1 1.5L12.1 2.2C13.433 2.533 14.517 3.237 15.35 4.313C16.183 5.387 16.6 6.617 16.6 8L16.6 13.15ZM10.6 20C10.05 20 9.579 19.804 9.188 19.413C8.796 19.021 8.6 18.55 8.6 18L12.6 18C12.6 18.55 12.404 19.021 12.013 19.413C11.621 19.804 11.15 20 10.6 20Z\"/>"],"mobile_hand_left_off":[24,24,"<path transform=\"matrix(1 0 0 1 0.699 2)\" d=\"M19.3 15.2L17.3 13.2L17.3 2L8.3 2L8.3 4.2L6.3 2.2L6.3 2C6.3 1.45 6.496 0.979 6.888 0.588C7.279 0.196 7.75 0 8.3 0L17.3 0C17.85 0 18.321 0.196 18.712 0.588C19.104 0.979 19.3 1.45 19.3 2L19.3 15.2ZM8.3 13.875L10.975 12.525L8.3 9.8L8.3 13.875ZM19.775 21.3L18.25 19.775C18.117 19.858 17.971 19.917 17.813 19.95C17.654 19.983 17.483 20 17.3 20L9.6 20L11.275 18L16.475 18L13.65 15.15L9.6 20C9.317 20.317 8.983 20.563 8.6 20.738C8.217 20.913 7.808 21 7.375 21L6.3 21C5.2 21 4.258 20.608 3.475 19.825C2.692 19.042 2.3 18.1 2.3 17L2.3 9C2.3 8.3 2.467 7.658 2.8 7.075C3.133 6.492 3.575 6.017 4.125 5.65L0 1.5L1.4 0.1L21.2 19.9L19.775 21.3ZM13.512 4.713C13.704 4.521 13.8 4.283 13.8 4C13.8 3.717 13.704 3.479 13.512 3.288C13.321 3.096 13.083 3 12.8 3C12.517 3 12.279 3.096 12.088 3.288C11.896 3.479 11.8 3.717 11.8 4C11.8 4.283 11.896 4.521 12.088 4.713C12.279 4.904 12.517 5 12.8 5C13.083 5 13.321 4.904 13.512 4.713ZM6.3 19L7.375 19C7.525 19 7.667 18.971 7.8 18.913C7.933 18.854 8.05 18.767 8.15 18.65L11.6 14.45L6.3 17.125L6.3 7.8L5.625 7.125C5.242 7.258 4.925 7.496 4.675 7.838C4.425 8.179 4.3 8.567 4.3 9L4.3 17C4.3 17.567 4.496 18.042 4.888 18.425C5.279 18.808 5.75 19 6.3 19Z\"/>"],"replay":[24,24,"<path transform=\"matrix(1 0 0 1 3 1)\" d=\"M5.488 20.288C4.396 19.813 3.446 19.171 2.638 18.363C1.829 17.554 1.188 16.604 0.713 15.512C0.238 14.421 0 13.25 0 12L2 12C2 13.95 2.679 15.604 4.037 16.962C5.396 18.321 7.05 19 9 19C10.95 19 12.604 18.321 13.963 16.962C15.321 15.604 16 13.95 16 12C16 10.05 15.321 8.396 13.963 7.037C12.604 5.679 10.95 5 9 5L8.85 5L10.4 6.55L9 8L5 4L9 0L10.4 1.45L8.85 3L9 3C10.25 3 11.421 3.238 12.512 3.713C13.604 4.188 14.554 4.829 15.363 5.638C16.171 6.446 16.813 7.396 17.288 8.488C17.763 9.579 18 10.75 18 12C18 13.25 17.763 14.421 17.288 15.512C16.813 16.604 16.171 17.554 15.363 18.363C14.554 19.171 13.604 19.813 12.512 20.288C11.421 20.763 10.25 21 9 21C7.75 21 6.579 20.763 5.488 20.288Z\"/>"],"alarm":[24,24,"<path transform=\"matrix(1 0 0 1 1.35 2.35)\" d=\"M7.138 18.938C6.046 18.462 5.096 17.821 4.288 17.013C3.479 16.204 2.838 15.254 2.363 14.163C1.888 13.071 1.65 11.9 1.65 10.65C1.65 9.4 1.888 8.229 2.363 7.138C2.838 6.046 3.479 5.096 4.288 4.287C5.096 3.479 6.046 2.837 7.138 2.362C8.229 1.887 9.4 1.65 10.65 1.65C11.9 1.65 13.071 1.887 14.163 2.362C15.254 2.837 16.204 3.479 17.013 4.287C17.821 5.096 18.463 6.046 18.938 7.138C19.413 8.229 19.65 9.4 19.65 10.65C19.65 11.9 19.413 13.071 18.938 14.163C18.463 15.254 17.821 16.204 17.013 17.013C16.204 17.821 15.254 18.462 14.163 18.938C13.071 19.413 11.9 19.65 10.65 19.65C9.4 19.65 8.229 19.413 7.138 18.938ZM13.45 14.85L14.85 13.45L11.65 10.25L11.65 5.65L9.65 5.65L9.65 11.05L13.45 14.85ZM4.25 0L5.65 1.4L1.4 5.65L0 4.25L4.25 0ZM17.05 0L21.3 4.25L19.9 5.65L15.65 1.4L17.05 0ZM10.65 17.65C12.6 17.65 14.254 16.971 15.613 15.613C16.971 14.254 17.65 12.6 17.65 10.65C17.65 8.7 16.971 7.046 15.613 5.688C14.254 4.329 12.6 3.65 10.65 3.65C8.7 3.65 7.046 4.329 5.688 5.688C4.329 7.046 3.65 8.7 3.65 10.65C3.65 12.6 4.329 14.254 5.688 15.613C7.046 16.971 8.7 17.65 10.65 17.65Z\"/>"],"flag":[19,19,"<path transform=\"matrix(1 0 0 1 3.959 3.167)\" d=\"M0 13.458L0 0L7.125 0L7.442 1.583L11.875 1.583L11.875 9.5L6.333 9.5L6.017 7.917L1.583 7.917L1.583 13.458L0 13.458ZM7.64 7.917L10.292 7.917L10.292 3.167L6.135 3.167L5.819 1.583L1.583 1.583L1.583 6.333L7.323 6.333L7.64 7.917Z\"/>"],"stat_minus_1":[24,24,"<path transform=\"matrix(1 0 0 -1 6 15.375)\" d=\"M6 7.4L0 1.4L1.4 0L6 4.575L10.6 0L12 1.4L6 7.4Z\"/>"],"frame_inspect":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M9.85 9.85C10.283 9.417 10.5 8.883 10.5 8.25C10.5 7.617 10.283 7.083 9.85 6.65C9.417 6.217 8.883 6 8.25 6C7.617 6 7.083 6.217 6.65 6.65C6.217 7.083 6 7.617 6 8.25C6 8.883 6.217 9.417 6.65 9.85C7.083 10.283 7.617 10.5 8.25 10.5C8.883 10.5 9.417 10.283 9.85 9.85ZM13.075 14.5L10.45 11.875C10.117 12.092 9.762 12.25 9.387 12.35C9.012 12.45 8.633 12.5 8.25 12.5C7.067 12.5 6.063 12.087 5.238 11.262C4.413 10.438 4 9.433 4 8.25C4 7.067 4.413 6.063 5.238 5.238C6.063 4.413 7.067 4 8.25 4C9.433 4 10.438 4.413 11.262 5.238C12.087 6.063 12.5 7.067 12.5 8.25C12.5 8.633 12.446 9.012 12.338 9.387C12.229 9.762 12.067 10.117 11.85 10.45L14.5 13.1L13.075 14.5ZM2 18C1.45 18 0.979 17.804 0.588 17.413C0.196 17.021 0 16.55 0 16L0 12L2 12L2 16L6 16L6 18L2 18ZM12 18L12 16L16 16L16 12L18 12L18 16C18 16.55 17.804 17.021 17.413 17.413C17.021 17.804 16.55 18 16 18L12 18ZM0 6L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L6 0L6 2L2 2L2 6L0 6ZM16 6L16 2L12 2L12 0L16 0C16.55 0 17.021 0.196 17.413 0.588C17.804 0.979 18 1.45 18 2L18 6L16 6Z\"/>"],"globe":[24,24,"<path transform=\"matrix(1 0 0 1 2 2)\" d=\"M10 20C8.617 20 7.317 19.737 6.1 19.212C4.883 18.688 3.825 17.975 2.925 17.075C2.025 16.175 1.313 15.117 0.788 13.9C0.262 12.683 0 11.383 0 10C0 8.617 0.262 7.317 0.788 6.1C1.313 4.883 2.025 3.825 2.925 2.925C3.825 2.025 4.883 1.313 6.1 0.788C7.317 0.262 8.617 0 10 0C11.383 0 12.683 0.262 13.9 0.788C15.117 1.313 16.175 2.025 17.075 2.925C17.975 3.825 18.688 4.883 19.212 6.1C19.737 7.317 20 8.617 20 10C20 11.383 19.737 12.683 19.212 13.9C18.688 15.117 17.975 16.175 17.075 17.075C16.175 17.975 15.117 18.688 13.9 19.212C12.683 19.737 11.383 20 10 20ZM10 18C12.233 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.233 18 10C18 9.883 17.996 9.762 17.988 9.637C17.979 9.512 17.975 9.408 17.975 9.325C17.892 9.808 17.667 10.208 17.3 10.525C16.933 10.842 16.5 11 16 11L14 11C13.45 11 12.979 10.804 12.588 10.413C12.196 10.021 12 9.55 12 9L12 8L8 8L8 6C8 5.45 8.196 4.979 8.588 4.588C8.979 4.196 9.45 4 10 4L11 4C11 3.617 11.104 3.279 11.313 2.987C11.521 2.696 11.775 2.458 12.075 2.275C11.742 2.192 11.404 2.125 11.063 2.075C10.721 2.025 10.367 2 10 2C7.767 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.767 2 10L7 10C8.1 10 9.042 10.392 9.825 11.175C10.608 11.958 11 12.9 11 14L11 15L8 15L8 17.75C8.333 17.833 8.663 17.896 8.988 17.938C9.313 17.979 9.65 18 10 18Z\"/>"],"bar_chart_4_bars":[24,24,"<path transform=\"matrix(1 0 0 1 2 3)\" d=\"M0 18L0 16L20 16L20 18L0 18ZM1 15L1 8L4 8L4 15L1 15ZM6 15L6 3L9 3L9 15L6 15ZM11 15L11 6L14 6L14 15L11 15ZM16 15L16 0L19 0L19 15L16 15Z\"/>"],"medical_services":[24,24,"<path transform=\"matrix(1 0 0 1 2 2)\" d=\"M2 20C1.45 20 0.979 19.804 0.588 19.413C0.196 19.021 0 18.55 0 18L0 6C0 5.45 0.196 4.979 0.588 4.588C0.979 4.196 1.45 4 2 4L6 4L6 2C6 1.45 6.196 0.979 6.588 0.588C6.979 0.196 7.45 0 8 0L12 0C12.55 0 13.021 0.196 13.413 0.588C13.804 0.979 14 1.45 14 2L14 4L18 4C18.55 4 19.021 4.196 19.413 4.588C19.804 4.979 20 5.45 20 6L20 18C20 18.55 19.804 19.021 19.413 19.413C19.021 19.804 18.55 20 18 20L2 20ZM2 18L18 18L18 6L2 6L2 18ZM8 4L12 4L12 2L8 2L8 4ZM9 13L9 16L11 16L11 13L14 13L14 11L11 11L11 8L9 8L9 11L6 11L6 13L9 13Z\"/>"],"splitscreen_left":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M2 18C1.45 18 0.979 17.804 0.588 17.413C0.196 17.021 0 16.55 0 16L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L6 0C6.55 0 7.021 0.196 7.412 0.588C7.804 0.979 8 1.45 8 2L8 16C8 16.55 7.804 17.021 7.412 17.413C7.021 17.804 6.55 18 6 18L2 18ZM12 18C11.45 18 10.979 17.804 10.588 17.413C10.196 17.021 10 16.55 10 16L10 2C10 1.45 10.196 0.979 10.588 0.588C10.979 0.196 11.45 0 12 0L16 0C16.55 0 17.021 0.196 17.413 0.588C17.804 0.979 18 1.45 18 2L18 16C18 16.55 17.804 17.021 17.413 17.413C17.021 17.804 16.55 18 16 18L12 18ZM16 2L12 2L12 16L16 16L16 2Z\"/>"],"bid_landscape":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M2 18C1.45 18 0.979 17.804 0.588 17.413C0.196 17.021 0 16.55 0 16L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L16 0C16.55 0 17.021 0.196 17.413 0.588C17.804 0.979 18 1.45 18 2L18 16C18 16.55 17.804 17.021 17.413 17.413C17.021 17.804 16.55 18 16 18L2 18ZM2 13.95L2 16L16 16L16 7.25L10.05 14L6 9.95L2 13.95ZM2 11.1L6 7.1L9.95 11.05L16 4.25L16 2L2 2L2 11.1ZM2 7.25L2 4.25L2 11.05L2 7.1L2 13.95L2 9.95L2 14L2 7.25ZM2 11.1L2 2L2 11.05L2 7.1L2 11.1ZM2 13.95L2 9.95L2 14L2 7.25L2 16L2 13.95Z\"/>"],"notifications":[24,24,"<path transform=\"matrix(1 0 0 1 4 2)\" d=\"M0 17L0 15L2 15L2 8C2 6.617 2.417 5.387 3.25 4.313C4.083 3.237 5.167 2.533 6.5 2.2L6.5 1.5C6.5 1.083 6.646 0.729 6.938 0.438C7.229 0.146 7.583 0 8 0C8.417 0 8.771 0.146 9.063 0.438C9.354 0.729 9.5 1.083 9.5 1.5L9.5 2.2C10.833 2.533 11.917 3.237 12.75 4.313C13.583 5.387 14 6.617 14 8L14 15L16 15L16 17L0 17ZM8 20C7.45 20 6.979 19.804 6.588 19.413C6.196 19.021 6 18.55 6 18L10 18C10 18.55 9.804 19.021 9.413 19.413C9.021 19.804 8.55 20 8 20ZM4 15L12 15L12 8C12 6.9 11.608 5.958 10.825 5.175C10.042 4.392 9.1 4 8 4C6.9 4 5.958 4.392 5.175 5.175C4.392 5.958 4 6.9 4 8L4 15Z\"/>"],"clinical_notes":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M11.875 12.125C11.292 11.542 11 10.833 11 10C11 9.167 11.292 8.458 11.875 7.875C12.458 7.292 13.167 7 14 7C14.833 7 15.542 7.292 16.125 7.875C16.708 8.458 17 9.167 17 10C17 10.833 16.708 11.542 16.125 12.125C15.542 12.708 14.833 13 14 13C13.167 13 12.458 12.708 11.875 12.125ZM14.713 10.713C14.904 10.521 15 10.283 15 10C15 9.717 14.904 9.479 14.713 9.288C14.521 9.096 14.283 9 14 9C13.717 9 13.479 9.096 13.288 9.288C13.096 9.479 13 9.717 13 10C13 10.283 13.096 10.521 13.288 10.713C13.479 10.904 13.717 11 14 11C14.283 11 14.521 10.904 14.713 10.713ZM8 20L8 17.1C8 16.75 8.083 16.421 8.25 16.113C8.417 15.804 8.65 15.558 8.95 15.375C9.483 15.058 10.046 14.796 10.637 14.588C11.229 14.379 11.833 14.225 12.45 14.125L14 16L15.55 14.125C16.167 14.225 16.767 14.379 17.35 14.588C17.933 14.796 18.492 15.058 19.025 15.375C19.325 15.558 19.563 15.804 19.738 16.113C19.913 16.421 20 16.75 20 17.1L20 20L8 20ZM9.975 18L13.05 18L11.7 16.35C11.4 16.433 11.108 16.542 10.825 16.675C10.542 16.808 10.258 16.95 9.975 17.1L9.975 18ZM14.95 18L18 18L18 17.1C17.733 16.933 17.458 16.788 17.175 16.663C16.892 16.538 16.6 16.433 16.3 16.35L14.95 18ZM2 18C1.45 18 0.979 17.804 0.588 17.413C0.196 17.021 0 16.55 0 16L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L16 0C16.55 0 17.021 0.196 17.413 0.588C17.804 0.979 18 1.45 18 2L18 7C17.733 6.667 17.442 6.35 17.125 6.05C16.808 5.75 16.433 5.55 16 5.45L16 2L2 2L2 16L6.15 16C6.1 16.183 6.063 16.367 6.037 16.55C6.012 16.733 6 16.917 6 17.1L6 18L2 18ZM4 6L11 6C11.433 5.667 11.908 5.417 12.425 5.25C12.942 5.083 13.467 5 14 5L14 4L4 4L4 6ZM4 10L9 10C9 9.65 9.038 9.308 9.113 8.975C9.188 8.642 9.292 8.317 9.425 8L4 8L4 10ZM4 14L7.45 14C7.633 13.85 7.829 13.717 8.038 13.6C8.246 13.483 8.458 13.375 8.675 13.275L8.675 12L4 12L4 14ZM2 16L2 2L2 5.425L2 5L2 16Z\"/>"],"stethoscope":[24,24,"<path transform=\"matrix(1 0 0 1 2 2)\" d=\"M11.5 20C9.7 20 8.167 19.367 6.9 18.1C5.633 16.833 5 15.3 5 13.5L5 12.925C3.567 12.692 2.375 12.021 1.425 10.913C0.475 9.804 0 8.5 0 7L0 1L3 1L3 0L5 0L5 4L3 4L3 3L2 3L2 7C2 8.1 2.392 9.042 3.175 9.825C3.958 10.608 4.9 11 6 11C7.1 11 8.042 10.608 8.825 9.825C9.608 9.042 10 8.1 10 7L10 3L9 3L9 4L7 4L7 0L9 0L9 1L12 1L12 7C12 8.5 11.525 9.804 10.575 10.913C9.625 12.021 8.433 12.692 7 12.925L7 13.5C7 14.75 7.438 15.813 8.313 16.688C9.188 17.563 10.25 18 11.5 18C12.75 18 13.813 17.563 14.688 16.688C15.563 15.813 16 14.75 16 13.5L16 11.825C15.417 11.625 14.938 11.267 14.563 10.75C14.188 10.233 14 9.65 14 9C14 8.167 14.292 7.458 14.875 6.875C15.458 6.292 16.167 6 17 6C17.833 6 18.542 6.292 19.125 6.875C19.708 7.458 20 8.167 20 9C20 9.65 19.813 10.233 19.438 10.75C19.063 11.267 18.583 11.625 18 11.825L18 13.5C18 15.3 17.367 16.833 16.1 18.1C14.833 19.367 13.3 20 11.5 20ZM17.712 9.713C17.904 9.521 18 9.283 18 9C18 8.717 17.904 8.479 17.712 8.288C17.521 8.096 17.283 8 17 8C16.717 8 16.479 8.096 16.288 8.288C16.096 8.479 16 8.717 16 9C16 9.283 16.096 9.521 16.288 9.713C16.479 9.904 16.717 10 17 10C17.283 10 17.521 9.904 17.712 9.713Z\"/>"],"repeat":[24,24,"<path transform=\"matrix(1 0 0 1 3 2)\" d=\"M4 20L0 16L4 12L5.4 13.45L3.85 15L14 15L14 11L16 11L16 17L3.85 17L5.4 18.55L4 20ZM2 9L2 3L14.15 3L12.6 1.45L14 0L18 4L14 8L12.6 6.55L14.15 5L4 5L4 9L2 9Z\"/>"],"prescriptions":[24,24,"<path transform=\"matrix(1 0 0 1 3 1)\" d=\"M13.95 19.65L15.1 18.5L13.5 16.9L12.35 18.05C12.117 18.283 12 18.55 12 18.85C12 19.15 12.117 19.417 12.35 19.65C12.583 19.883 12.85 20 13.15 20C13.45 20 13.717 19.883 13.95 19.65ZM16.5 17.1L17.65 15.95C17.883 15.717 18 15.45 18 15.15C18 14.85 17.883 14.583 17.65 14.35C17.417 14.117 17.15 14 16.85 14C16.55 14 16.283 14.117 16.05 14.35L14.9 15.5L16.5 17.1ZM15.375 21.075C14.758 21.692 14.017 22 13.15 22C12.283 22 11.542 21.692 10.925 21.075C10.308 20.458 10 19.717 10 18.85C10 17.983 10.308 17.242 10.925 16.625L14.625 12.925C15.242 12.308 15.983 12 16.85 12C17.717 12 18.458 12.308 19.075 12.925C19.692 13.542 20 14.283 20 15.15C20 16.017 19.692 16.758 19.075 17.375L15.375 21.075ZM2 20C1.45 20 0.979 19.804 0.588 19.413C0.196 19.021 0 18.55 0 18L0 4C0 3.45 0.196 2.979 0.588 2.588C0.979 2.196 1.45 2 2 2L6.2 2C6.417 1.4 6.779 0.917 7.287 0.55C7.796 0.183 8.367 0 9 0C9.633 0 10.204 0.183 10.713 0.55C11.221 0.917 11.583 1.4 11.8 2L16 2C16.55 2 17.021 2.196 17.413 2.588C17.804 2.979 18 3.45 18 4L18 10.125C17.667 10.042 17.333 10 17 10C16.667 10 16.333 10.025 16 10.075L16 4L2 4L2 18L8.075 18C8.025 18.333 8 18.667 8 19C8 19.333 8.042 19.667 8.125 20L2 20ZM9.538 3.038C9.679 2.896 9.75 2.717 9.75 2.5C9.75 2.283 9.679 2.104 9.538 1.962C9.396 1.821 9.217 1.75 9 1.75C8.783 1.75 8.604 1.821 8.463 1.962C8.321 2.104 8.25 2.283 8.25 2.5C8.25 2.717 8.321 2.896 8.463 3.038C8.604 3.179 8.783 3.25 9 3.25C9.217 3.25 9.396 3.179 9.538 3.038ZM4 8L4 6L14 6L14 8L4 8ZM4 12L4 10L14 10L14 10.85C13.867 10.933 13.738 11.029 13.613 11.137C13.488 11.246 13.358 11.367 13.225 11.5L12.725 12L4 12ZM4 16L4 14L10.725 14L9.5 15.225C9.367 15.358 9.246 15.488 9.137 15.613C9.029 15.738 8.933 15.867 8.85 16L4 16Z\"/>"],"pill":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M5.625 18C4.058 18 2.729 17.454 1.638 16.363C0.546 15.271 0 13.942 0 12.375C0 11.625 0.142 10.908 0.425 10.225C0.708 9.542 1.117 8.933 1.65 8.4L8.4 1.65C8.933 1.117 9.542 0.708 10.225 0.425C10.908 0.142 11.625 0 12.375 0C13.942 0 15.271 0.546 16.363 1.638C17.454 2.729 18 4.058 18 5.625C18 6.375 17.858 7.092 17.575 7.775C17.292 8.458 16.883 9.067 16.35 9.6L9.6 16.35C9.067 16.883 8.458 17.292 7.775 17.575C7.092 17.858 6.375 18 5.625 18ZM12.275 10.85L14.95 8.2C15.283 7.867 15.542 7.475 15.725 7.025C15.908 6.575 16 6.108 16 5.625C16 4.625 15.646 3.771 14.938 3.063C14.229 2.354 13.375 2 12.375 2C11.892 2 11.425 2.092 10.975 2.275C10.525 2.458 10.133 2.717 9.8 3.05L7.15 5.725L12.275 10.85ZM5.625 16C6.108 16 6.575 15.908 7.025 15.725C7.475 15.542 7.867 15.283 8.2 14.95L10.85 12.275L5.725 7.15L3.05 9.8C2.717 10.133 2.458 10.525 2.275 10.975C2.092 11.425 2 11.892 2 12.375C2 13.375 2.354 14.229 3.063 14.938C3.771 15.646 4.625 16 5.625 16Z\"/>"],"flowchart":[24,24,"<path transform=\"matrix(1 0 0 1 2 4)\" d=\"M13 16L13 14L9 14L9 9L7 9L7 11L0 11L0 5L7 5L7 7L9 7L9 2L13 2L13 0L20 0L20 6L13 6L13 4L11 4L11 12L13 12L13 10L20 10L20 16L13 16ZM15 14L18 14L18 12L15 12L15 14ZM2 9L5 9L5 7L2 7L2 9ZM15 4L18 4L18 2L15 2L15 4Z\"/>"],"bookmark":[24,24,"<path transform=\"matrix(1 0 0 1 5 3)\" d=\"M0 18L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L12 0C12.55 0 13.021 0.196 13.413 0.588C13.804 0.979 14 1.45 14 2L14 18L7 15L0 18ZM2 14.95L7 12.8L12 14.95L12 2L2 2L2 14.95Z\"/>"],"settings_backup_restore":[24,24,"<path transform=\"matrix(1 0 0 1 3 3)\" d=\"M9 11C8.45 11 7.979 10.804 7.588 10.413C7.196 10.021 7 9.55 7 9C7 8.45 7.196 7.979 7.588 7.588C7.979 7.196 8.45 7 9 7C9.55 7 10.021 7.196 10.413 7.588C10.804 7.979 11 8.45 11 9C11 9.55 10.804 10.021 10.413 10.413C10.021 10.804 9.55 11 9 11ZM9 18C6.683 18 4.675 17.238 2.975 15.713C1.275 14.188 0.3 12.283 0.05 10L2.1 10C2.333 11.733 3.104 13.167 4.412 14.3C5.721 15.433 7.25 16 9 16C10.95 16 12.604 15.321 13.963 13.963C15.321 12.604 16 10.95 16 9C16 7.05 15.321 5.396 13.963 4.037C12.604 2.679 10.95 2 9 2C7.85 2 6.775 2.267 5.775 2.8C4.775 3.333 3.933 4.067 3.25 5L6 5L6 7L0 7L0 1L2 1L2 3.35C2.85 2.283 3.888 1.458 5.113 0.875C6.338 0.292 7.633 0 9 0C10.25 0 11.421 0.238 12.512 0.713C13.604 1.188 14.554 1.829 15.363 2.638C16.171 3.446 16.813 4.396 17.288 5.488C17.763 6.579 18 7.75 18 9C18 10.25 17.763 11.421 17.288 12.512C16.813 13.604 16.171 14.554 15.363 15.363C14.554 16.171 13.604 16.813 12.512 17.288C11.421 17.763 10.25 18 9 18Z\"/>"],"bookmark_check":[24,24,"<path transform=\"matrix(1 0 0 1 5 3)\" d=\"M5.95 11L10.9 6.05L9.475 4.65L5.95 8.175L4.525 6.75L3.1 8.175L5.95 11ZM0 18L0 2C0 1.45 0.196 0.979 0.588 0.588C0.979 0.196 1.45 0 2 0L12 0C12.55 0 13.021 0.196 13.413 0.588C13.804 0.979 14 1.45 14 2L14 18L7 15L0 18ZM2 14.95L7 12.8L12 14.95L12 2L2 2L2 14.95Z\"/>"],"rewarded_ads":[53,53,"<path d=\"M30.66 21.83C31.81 20.67 32.39 19.29 32.39 17.67C32.39 16.05 31.81 14.66 30.66 13.51C29.51 12.35 28.12 11.78 26.5 11.78C24.88 11.78 23.49 12.35 22.34 13.51C21.19 14.66 20.61 16.05 20.61 17.67C20.61 19.29 21.19 20.67 22.34 21.83C23.49 22.98 24.88 23.56 26.5 23.56C28.12 23.56 29.51 22.98 30.66 21.83ZM11.78 53L11.78 47.11L23.56 47.11L23.56 37.98C21.15 37.44 19 36.43 17.11 34.93C15.23 33.43 13.84 31.55 12.96 29.3C9.28 28.86 6.2 27.25 3.72 24.48C1.24 21.7 0 18.45 0 14.72L0 11.78C0 10.16 0.58 8.77 1.73 7.62C2.88 6.47 4.27 5.89 5.89 5.89L11.78 5.89L11.78 0L41.22 0L41.22 5.89L47.11 5.89C48.73 5.89 50.12 6.47 51.27 7.62C52.42 8.77 53 10.16 53 11.78L53 14.72C53 18.45 51.76 21.7 49.28 24.48C46.8 27.25 43.73 28.86 40.04 29.3C39.16 31.55 37.77 33.43 35.89 34.93C34 36.43 31.85 37.44 29.44 37.98L29.44 47.11L41.22 47.11L41.22 53L11.78 53ZM11.78 22.97L11.78 11.78L5.89 11.78L5.89 14.72C5.89 16.59 6.43 18.27 7.51 19.76C8.59 21.26 10.01 22.33 11.78 22.97ZM41.22 22.97C42.99 22.33 44.41 21.26 45.49 19.76C46.57 18.27 47.11 16.59 47.11 14.72L47.11 11.78L41.22 11.78L41.22 22.97Z\"/>"]};
SR.ficon=(n,a="")=>{const i=SR.FIG_ICONS[n];return i?`<svg viewBox="0 0 ${i[0]} ${i[1]}" fill="currentColor" aria-hidden="true" ${a}>${i[2]}</svg>`:SR.icon(n,a)};
