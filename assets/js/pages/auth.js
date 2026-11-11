/* Auth flow — login, signup, forgot-password, verify-otp, reset-password
   Demo only: accounts live in localStorage. Replace the marked spots with
   calls to your auth API. */
(function () {
  const { $, $$, esc, icon } = SR;
  const page = document.querySelector('meta[name="sr-page"]').content;
  const DEMO_CODE = "482913";
  SR.bindPasswordToggles();
  $$(".pw button").forEach(b => b.innerHTML = icon("eye"));
  $$("[data-i]").forEach(el => el.innerHTML = icon(el.dataset.i));

  /* Floating product cards over the brand artwork */
  const art = $(".auth-art");
  if (art) {
    const nb = SR.openTrainings().slice().sort((a, b) => a.start.localeCompare(b.start))[0];
    art.insertAdjacentHTML("beforeend", `
      <div class="float f1"><span class="ic ok">${icon("cert")}</span><div><b>Certificate earned</b><span>Python Development · verified ID</span></div></div>
      ${nb ? `<div class="float f2"><span class="live"></span><div><b>Next live batch</b><span>Starts ${SR.fmtDate(nb.start, { day: "numeric", month: "short" })} · ${esc(nb.title.split(/ (Web|with|Design) /)[0])}</span></div></div>` : ""}
      <div class="float f3"><span class="ic star">${icon("star")}</span><div><b>4.8 average rating</b><span>across live batches</span></div></div>`);
  }

  /* Caps Lock warning on password fields */
  $$('input[type="password"]').forEach(inp => ["keydown", "keyup"].forEach(ev => inp.addEventListener(ev, e => {
    const w = inp.closest(".field") && inp.closest(".field").querySelector(".caps");
    if (w && e.getModifierState) w.hidden = !e.getModifierState("CapsLock");
  })));

  /* Busy state on the submit button before moving on */
  const busy = (btn, label, then) => { btn.disabled = true; btn.classList.add("busy"); btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${label}`; setTimeout(then, 300); };

  const accounts = () => ({ ...SR.STAFF, [SR.DEMO.email]: { ...SR.DEMO }, ...(SR.store.get("accounts", {}) || {}) });
  const saveAccount = (a) => { const all = accounts(); all[a.email.toLowerCase()] = a; SR.store.set("accounts", all); };
  const formError = (msg) => { $("#form-error").innerHTML = msg ? `<div class="alert error" role="alert">${icon("warn")}<span>${msg}</span></div>` : ""; };

  // Already signed in? Skip the login/signup forms.
  if ((page === "login" || page === "signup") && SR.auth.user()) { location.replace(SR.homeFor(SR.auth.user())); return; }

  /* ---------- Password strength ---------- */
  function strength(v) {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^\w\s]/.test(v)) s++;
    return v ? Math.max(1, s) : 0;
  }
  const meter = $("#meter");
  if (meter) $("#password").addEventListener("input", e => {
    const s = strength(e.target.value);
    meter.className = "pw-meter" + (s ? " s" + s : "");
    $("#meter-text").textContent = ["", "Weak password", "Could be stronger", "Good password", "Strong password"][s];
    const v = e.target.value, ok = { len: v.length >= 8, num: /\d/.test(v), sym: /[^\w\s]/.test(v), case: /[A-Z]/.test(v) && /[a-z]/.test(v) };
    $$("#rules li").forEach(li => li.classList.toggle("ok", ok[li.dataset.r]));
  });
  const pwProblem = (v) => v.length < 8 ? "Use at least 8 characters." : !/\d/.test(v) ? "Add at least one number." : !/[^\w\s]/.test(v) ? "Add at least one symbol, like @ or #." : "";

  /* ---------- Login ---------- */
  if (page === "login") {
    const flash = SR.session.get("flash"); if (flash) { $("#notice").innerHTML = `<div class="alert ok">${icon("check")}<span>${esc(flash)}</span></div>`; SR.session.del("flash"); }
    // Demo accounts: one tap fills the form
    $$("[data-demo]").forEach(b => b.addEventListener("click", () => {
      const who = b.dataset.demo, a = who === "learner" ? SR.DEMO : Object.values(SR.STAFF).find(x => x.role === who);
      setMode("password");
      $("#email").value = a.email; $("#password").value = a.password;
      $$("[data-demo]").forEach(x => x.classList.toggle("on", x === b));
      SR.fieldError($("#email"), ""); SR.fieldError($("#password"), "");
      $("#submit").focus();
    }));
    // Password or one-time email code
    let mode = "password";
    function setMode(m) {
      mode = m;
      $$(".seg [data-mode]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.mode === m)));
      $(".seg").dataset.on = m;
      $("#pw-field").hidden = m !== "password"; $("#remember-row").hidden = m !== "password"; $("#code-note").hidden = m !== "code";
      $("#submit").textContent = m === "password" ? "Log In" : "Email me a code";
      formError("");
    }
    $$(".seg [data-mode]").forEach(b => b.addEventListener("click", () => { setMode(b.dataset.mode); $("#email").focus(); }));
    $("#form").addEventListener("submit", e => {
      e.preventDefault(); formError("");
      const email = $("#email").value.trim().toLowerCase(), pw = $("#password").value;
      SR.fieldError($("#email"), SR.validEmail(email) ? "" : "Enter a valid email address, like john.doe@gmail.com.");
      if (!SR.validEmail(email)) return;
      const acc = accounts()[email];
      if (mode === "code") {
        // → Replace with POST /api/auth/login-code (server emails the code)
        if (!acc) { formError(`No account found for ${esc(email)}. <a class="link" href="signup.html">Create one</a>`); return; }
        SR.session.set("pending", { mode: "login", email });
        busy($("#submit"), "Sending code…", () => location.href = "verify-otp.html");
        return;
      }
      SR.fieldError($("#password"), pw ? "" : "Enter your password.");
      if (!pw) return;
      // → Replace with POST /api/auth/login
      if (!acc) { formError(`No account found for ${esc(email)}. <a class="link" href="signup.html">Create one</a>`); return; }
      if (acc.password !== pw) { SR.fieldError($("#password"), "Incorrect Password!"); $("#password").select(); return; }
      busy($("#submit"), "Logging in…", () => signInAs(acc));
    });
  }
  function signInAs(acc) {
    SR.auth.signIn({ firstName: acc.firstName, lastName: acc.lastName, email: acc.email, phone: acc.phone, verified: true, role: acc.role || "learner", trainer: acc.trainer });
    if (!acc.role || acc.role === "learner") SR.seedLearner(acc.email !== SR.DEMO.email);
    SR.auth.afterLogin();
  }

  /* ---------- Sign up (two short steps) ---------- */
  if (page === "signup") {
    const phone = $("#phone");
    phone.addEventListener("input", () => { const d = phone.value.replace(/\D/g, "").slice(-10); phone.value = d.length > 5 ? d.slice(0, 5) + " " + d.slice(5) : d; });
    const read = () => ({ first: $("#first").value.trim(), last: $("#last").value.trim(), email: $("#email").value.trim().toLowerCase(), phone: phone.value.replace(/\D/g, ""), pw: $("#password").value, confirm: $("#confirm").value });
    const step1Errors = (v) => [
      ["#first", v.first ? "" : "Enter your first name."],
      ["#last", v.last ? "" : "Enter your last name."],
      ["#email", SR.validEmail(v.email) ? (accounts()[v.email] ? `An account with this email already exists. <a class="link" href="login.html">Log in instead</a>` : "") : "Enter a valid email address."],
      ["#phone", /^[6-9]\d{9}$/.test(v.phone.slice(-10)) && v.phone.length >= 10 ? "" : "Enter a 10-digit mobile number."]
    ];
    const show = (errs) => { let first = null; errs.forEach(([sel, m]) => { SR.fieldError($(sel), m.replace(/<[^>]+>/g, "")); if (m && !first) first = $(sel); }); return first; };
    const go = (n) => {
      $("#pane-1").hidden = n !== 1; $("#pane-2").hidden = n !== 2;
      $("#st-1").className = n === 1 ? "on" : "done"; $("#st-2").className = n === 2 ? "on" : "";
      (n === 1 ? $("#first") : $("#password")).focus();
    };
    $("#next").addEventListener("click", () => { const first = show(step1Errors(read())); if (first) first.focus(); else go(2); });
    $("#pane-1").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); $("#next").click(); } });
    $("#back").addEventListener("click", () => go(1));
    $("#st-1").addEventListener("click", () => { if (!$("#pane-2").hidden) go(1); });
    // Live match check on confirm password
    const match = () => { const v = read(), m = $("#match"); if (!v.confirm) { m.hidden = true; return; } m.hidden = false; const ok = v.confirm === v.pw; m.className = "match " + (ok ? "ok" : "no"); m.innerHTML = ok ? `${icon("check")}Passwords match` : "Passwords don't match yet"; };
    $("#confirm").addEventListener("input", match); $("#password").addEventListener("input", match);
    $("#form").addEventListener("submit", e => {
      e.preventDefault(); formError("");
      if (!$("#pane-1").hidden) { $("#next").click(); return; }
      const v = read();
      if (show(step1Errors(v))) { go(1); show(step1Errors(v)); return; }
      const first = show([["#password", pwProblem(v.pw)], ["#confirm", v.confirm && v.confirm === v.pw ? "" : "Passwords don't match."]]);
      if (first) { first.focus(); return; }
      if (!$("#agree").checked) { formError("Please accept the Terms and Privacy Policy to continue."); return; }
      // → Replace with POST /api/auth/signup (server emails the code)
      SR.session.set("pending", { mode: "signup", email: v.email, account: { firstName: v.first, lastName: v.last, email: v.email, phone: v.phone.slice(-10), password: v.pw, role: "learner" } });
      busy($("#submit"), "Creating your account…", () => location.href = "verify-otp.html");
    });
  }

  /* ---------- Forgot password ---------- */
  if (page === "forgot") {
    $("#form").addEventListener("submit", e => {
      e.preventDefault();
      const email = $("#email").value.trim().toLowerCase();
      if (!SR.validEmail(email)) { SR.fieldError($("#email"), "Enter a valid email address."); return; }
      SR.fieldError($("#email"), "");
      // Always continue (don't reveal whether an account exists)
      SR.session.set("pending", { mode: "reset", email });
      location.href = "verify-otp.html";
    });
  }

  /* ---------- OTP ---------- */
  if (page === "otp") {
    const pending = SR.session.get("pending");
    if (!pending) { location.replace("login.html"); return; }
    $("#otp-sub").innerHTML = `We’ve sent a verification code to your email<br><b style="color:var(--ink)">${esc(pending.email)}</b><br>${pending.mode === "reset" ? "Please check your inbox and enter the code below to reset your password." : pending.mode === "login" ? "Enter it below to log in. The code works once." : "Enter it below to verify your email and finish creating your account."}`;
    const boxes = $$("#otp input");
    boxes.forEach((b, i) => {
      b.addEventListener("input", () => { b.value = b.value.replace(/\D/g, "").slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener("keydown", e => { if (e.key === "Backspace" && !b.value && boxes[i - 1]) boxes[i - 1].focus(); if (e.key === "ArrowLeft" && boxes[i - 1]) boxes[i - 1].focus(); if (e.key === "ArrowRight" && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener("paste", e => { const d = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6); if (d.length) { e.preventDefault(); d.split("").forEach((c, k) => boxes[k] && (boxes[k].value = c)); boxes[Math.min(d.length, 5)].focus(); } });
    });
    boxes[0].focus();
    $("#fill-code").addEventListener("click", () => { DEMO_CODE.split("").forEach((c, k) => boxes[k].value = c); boxes[5].focus(); });

    let left = 45, iv;
    function tick() {
      const t = $("#timer");
      if (left > 0) { t.innerHTML = `Resend code in <b class="num">00:${String(left).padStart(2, "0")}</b>`; left--; }
      else { clearInterval(iv); t.innerHTML = `Didn’t receive the code? <button type="button" class="link" id="resend" style="border:0;background:none;padding:0;font-size:inherit">Resend</button>`; $("#resend").addEventListener("click", () => { SR.toast("A new code is on its way to " + pending.email); left = 45; tick(); iv = setInterval(tick, 1000); }); }
    }
    tick(); iv = setInterval(tick, 1000);

    $("#form").addEventListener("submit", e => {
      e.preventDefault();
      const code = boxes.map(b => b.value).join("");
      if (code.length < 6) { formError("Enter all 6 digits of the code."); return; }
      // → Replace with POST /api/auth/verify-code
      if (code !== DEMO_CODE) { formError("That code isn't right. Check the latest email from us, or resend the code."); boxes.forEach(b => b.value = ""); boxes[0].focus(); return; }
      if (pending.mode === "login") {
        const acc = accounts()[pending.email]; SR.session.del("pending");
        if (acc) { signInAs(acc); return; }
        location.replace("login.html"); return;
      }
      if (pending.mode === "signup") {
        saveAccount(pending.account);
        SR.session.del("pending");
        SR.auth.signIn({ firstName: pending.account.firstName, lastName: pending.account.lastName, email: pending.account.email, phone: pending.account.phone, verified: true, role: "learner" });
        SR.seedLearner(true);
        SR.toast("Email verified. Welcome to SkillRadius!");
        setTimeout(() => SR.auth.afterLogin(), 600);
      } else {
        SR.session.set("pending", { ...pending, verified: true });
        location.href = "reset-password.html";
      }
    });
  }

  /* ---------- Reset password ---------- */
  if (page === "reset") {
    const pending = SR.session.get("pending");
    if (!pending || !pending.verified) { location.replace("forgot-password.html"); return; }
    $("#form").addEventListener("submit", e => {
      e.preventDefault();
      const pw = $("#password").value, c = $("#confirm").value;
      SR.fieldError($("#password"), pwProblem(pw));
      SR.fieldError($("#confirm"), c === pw ? "" : "Passwords don't match.");
      if (pwProblem(pw) || c !== pw) return;
      // → Replace with POST /api/auth/reset-password
      const acc = accounts()[pending.email];
      if (acc) saveAccount({ ...acc, password: pw });
      SR.session.del("pending");
      SR.session.set("flash", "Password updated. Log in with your new password.");
      location.href = "login.html";
    });
  }
})();
