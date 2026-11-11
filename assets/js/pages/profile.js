/* Profile — personal info, photo, password, notification preferences,
   delete account. Demo storage; swap for PATCH /api/me etc. */
(function () {
  if (!SR.auth.require()) return;
  const { $, $$, esc, icon } = SR;
  let editing = false;

  const accounts = () => ({ ...SR.STAFF, [SR.DEMO.email]: { ...SR.DEMO }, ...(SR.store.get("accounts", {}) || {}) });
  const saveAccount = (a) => { const all = accounts(); all[a.email] = { ...(all[a.email] || {}), ...a }; SR.store.set("accounts", all); };

  function render() {
    const u = SR.auth.user();
    const E = SR.enrolled();
    const prefs = SR.store.get("prefs", { course: true, live: true, digest: true, offers: false });
    const certs = (SR.store.get("certificates", []) || []).length;
    const done = E.courses.filter(id => SR.progressOf(id).complete).length;
    $("#main").innerHTML = `
    <div class="profile">
      <section class="card p-head">
        <div class="p-avatar"><img src="${SR.avatarURL(u)}" alt="Profile photo"><label for="photo" title="Change photo">${icon("camera")}<span class="sr-only">Change photo</span></label><input id="photo" type="file" accept="image/*" hidden></div>
        <div style="min-width:0"><h1>${esc(u.firstName + " " + (u.lastName || ""))}</h1><div class="email">${esc(u.email)}</div><span class="pill green" style="margin-top:8px">${icon("check")}Email Verified</span></div>
        ${editing ? "" : `<button class="btn" id="edit">${icon("edit")}Edit profile</button>`}
      </section>

      <section class="p-stats">
        <div><b>${E.courses.length}</b><span>Courses enrolled</span></div>
        <div><b>${done}</b><span>Completed</span></div>
        <div><b>${E.trainings.length}</b><span>Training batches</span></div>
        <div><b>${certs}</b><span>Certificates</span></div>
      </section>

      <form class="card stack" id="info" novalidate>
        <div class="card-head" style="margin:0"><h2>Personal Information</h2></div>
        <div class="form-grid">
          <div class="field"><label for="p-first">First Name</label><input id="p-first" value="${esc(u.firstName)}" ${editing ? "" : "readonly"} autocomplete="given-name"></div>
          <div class="field"><label for="p-last">Last Name</label><input id="p-last" value="${esc(u.lastName || "")}" ${editing ? "" : "readonly"} autocomplete="family-name"></div>
          <div class="field"><label for="p-email">Email</label><input id="p-email" value="${esc(u.email)}" readonly><span class="hint">Email cannot be changed</span></div>
          <div class="field"><label for="p-phone">Contact Number</label><input id="p-phone" value="${esc(u.phone || "")}" inputmode="numeric" ${editing ? "" : "readonly"} autocomplete="tel"></div>
          <div class="field"><label for="p-city">City</label><input id="p-city" value="${esc(u.city || "")}" placeholder="${editing ? "e.g. Bengaluru" : "Not added"}" ${editing ? "" : "readonly"}></div>
          <div class="field"><label for="p-role">Current role</label><input id="p-role" value="${esc(u.jobTitle || "")}" placeholder="${editing ? "e.g. Student, Developer" : "Not added"}" ${editing ? "" : "readonly"}></div>
          <div class="field full"><label for="p-bio">Bio</label><textarea id="p-bio" ${editing ? "" : "readonly"} placeholder="${editing ? "A line or two about you and what you're learning" : "Not added"}" style="min-height:90px">${esc(u.bio || "")}</textarea></div>
        </div>
        ${editing ? `<div class="row" style="justify-content:flex-end"><button class="btn plain" type="button" id="cancel">Cancel</button><button class="btn" type="submit">Save changes</button></div>` : ""}
      </form>

      <section class="card stack">
        <div class="card-head" style="margin:0"><h2>Account Settings</h2></div>
        <div class="setting"><div><h3>Email Verification</h3><p style="color:var(--success-ink)">Your email has been verified</p></div><span class="pill green">${icon("check")}Email Verified</span></div>
        <div class="setting"><div><h3>Password</h3><p>Last changed ${u.pwChanged ? SR.fmtDate(u.pwChanged) : "when you signed up"}</p></div><button class="btn plain sm" id="pw">Reset Password</button></div>
      </section>

      <section class="card stack">
        <div class="card-head" style="margin:0"><h2>Notifications</h2></div>
        ${[["course", "Course updates", "New lessons and replies to your questions"], ["live", "Live session reminders", "Email and SMS 30 minutes before each session"], ["digest", "Weekly progress digest", "Your learning hours and streak every Monday"], ["offers", "Offers & new programs", "Occasional discounts and new certifications"]]
          .map(([k, t, d]) => `<div class="setting" style="background:#fff;border:1px solid var(--line)"><div><h3 style="color:var(--ink)">${t}</h3><p>${d}</p></div><span class="switch"><input type="checkbox" data-pref="${k}" ${prefs[k] ? "checked" : ""} aria-label="${t}"><span></span></span></div>`).join("")}
      </section>

      <section class="card stack danger-zone">
        <div class="card-head" style="margin:0"><h2 style="color:var(--danger-ink)">Delete account</h2></div>
        <p class="muted small">Permanently delete your account, progress and certificates. Certificates already shared will no longer verify.</p>
        <button class="btn plain sm" id="del" style="justify-self:start;color:var(--danger-ink);border-color:#f3c7c7">Delete my account</button>
      </section>
    </div>`;
    bind();
  }

  function modal(html, onOk) {
    const m = document.createElement("div"); m.className = "modal-back";
    m.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    m.addEventListener("click", e => { if (e.target === m || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    const first = m.querySelector("input,button"); if (first) first.focus();
    m.querySelector("form").addEventListener("submit", e => { e.preventDefault(); if (onOk(m) !== false) close(); });
    SR.bindPasswordToggles(m); $$(".pw button", m).forEach(b => b.innerHTML = icon("eye"));
  }

  function bind() {
    const ed = $("#edit"); if (ed) ed.addEventListener("click", () => { editing = true; render(); $("#p-first").focus(); });
    const cn = $("#cancel"); if (cn) cn.addEventListener("click", () => { editing = false; render(); });
    $("#info").addEventListener("submit", e => {
      e.preventDefault(); if (!editing) return;
      const first = $("#p-first").value.trim(), last = $("#p-last").value.trim(), phone = $("#p-phone").value.replace(/\D/g, "");
      SR.fieldError($("#p-first"), first ? "" : "Enter your first name.");
      SR.fieldError($("#p-phone"), /^[6-9]\d{9}$/.test(phone) ? "" : "Enter a 10-digit mobile number.");
      if (!first || !/^[6-9]\d{9}$/.test(phone)) return;
      const u = { ...SR.auth.user(), firstName: first, lastName: last, phone, city: $("#p-city").value.trim(), jobTitle: $("#p-role").value.trim(), bio: $("#p-bio").value.trim() };
      SR.auth.signIn(u); saveAccount({ email: u.email, firstName: first, lastName: last, phone });
      editing = false; render(); SR.toast("Profile updated");
      document.querySelectorAll(".user-btn .hi").forEach(h => h.textContent = "Hi " + first);
    });
    $("#photo").addEventListener("change", e => {
      const f = e.target.files[0]; if (!f) return;
      if (f.size > 3 * 1024 * 1024) { SR.toast("Choose an image under 3 MB"); return; }
      const r = new FileReader();
      r.onload = () => {
        // Downscale to 240px so it fits comfortably in storage
        const img = new Image(); img.onload = () => {
          const s = 240, cv = document.createElement("canvas"); cv.width = cv.height = s;
          const k = Math.min(img.width, img.height), ctx = cv.getContext("2d");
          ctx.drawImage(img, (img.width - k) / 2, (img.height - k) / 2, k, k, 0, 0, s, s);
          SR.auth.signIn({ ...SR.auth.user(), avatar: cv.toDataURL("image/jpeg", .85) }); render(); SR.toast("Profile photo updated");
          document.querySelectorAll(".user-btn img").forEach(i => i.src = SR.auth.user().avatar);
        }; img.src = r.result;
      };
      r.readAsDataURL(f);
    });
    $$("[data-pref]").forEach(t => t.addEventListener("change", () => {
      const p = SR.store.get("prefs", { course: true, live: true, digest: true, offers: false }); p[t.dataset.pref] = t.checked; SR.store.set("prefs", p);
      SR.toast(t.checked ? "Notifications on" : "Notifications off");
    }));
    $("#pw").addEventListener("click", () => modal(`
      <h2>Change password</h2>
      <form class="stack" novalidate>
        <div class="field"><label for="m-cur">Current password</label><div class="pw"><input id="m-cur" type="password" autocomplete="current-password"><button type="button" aria-label="Show password"></button></div></div>
        <div class="field"><label for="m-new">New password</label><div class="pw"><input id="m-new" type="password" autocomplete="new-password"><button type="button" aria-label="Show password"></button></div><span class="hint">At least 8 characters, with a number and a symbol.</span></div>
        <div class="field"><label for="m-conf">Confirm new password</label><div class="pw"><input id="m-conf" type="password" autocomplete="new-password"><button type="button" aria-label="Show password"></button></div></div>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Update password</button></div>
        <p class="tiny muted">Forgot it? <a class="link" href="forgot-password.html">Reset with an email code</a></p>
      </form>`, (m) => {
      const u = SR.auth.user(), acc = accounts()[u.email] || {};
      const cur = $("#m-cur", m).value, nw = $("#m-new", m).value, cf = $("#m-conf", m).value;
      const bad = nw.length < 8 ? "Use at least 8 characters." : !/\d/.test(nw) ? "Add at least one number." : !/[^\w\s]/.test(nw) ? "Add at least one symbol." : "";
      SR.fieldError($("#m-cur", m), acc.password && cur !== acc.password ? "That isn't your current password." : cur ? "" : "Enter your current password.");
      SR.fieldError($("#m-new", m), bad);
      SR.fieldError($("#m-conf", m), cf === nw ? "" : "Passwords don't match.");
      if ((acc.password && cur !== acc.password) || !cur || bad || cf !== nw) return false;
      saveAccount({ email: u.email, password: nw }); SR.auth.signIn({ ...u, pwChanged: Date.now() }); render(); SR.toast("Password updated");
    }));
    $("#del").addEventListener("click", () => modal(`
      <h2>Delete your account?</h2>
      <p class="muted">This removes your profile, progress and certificates for good. Type <b>DELETE</b> to confirm.</p>
      <form class="stack" novalidate>
        <div class="field"><label for="m-del" class="sr-only">Type DELETE</label><input id="m-del" autocomplete="off" placeholder="DELETE"></div>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn danger" type="submit">Delete account</button></div>
      </form>`, (m) => {
      if ($("#m-del", m).value.trim() !== "DELETE") { SR.fieldError($("#m-del", m), "Type DELETE in capitals to confirm."); return false; }
      const u = SR.auth.user(), all = accounts(); if (u.email !== SR.DEMO.email) { delete all[u.email]; SR.store.set("accounts", all); }
      ["enrolled", "progress", "certprog", "attempts", "certificates", "activity", "seeded", "mynotes", "prefs", "notifRead"].forEach(k => SR.store.del(k));
      SR.auth.signOut(); location.href = "index.html";
    }));
  }
  render();
})();
