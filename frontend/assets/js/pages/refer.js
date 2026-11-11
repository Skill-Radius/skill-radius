/* Refer & earn — personal code, share links, invites */
(function () {
  const { $, icon, esc } = SR, u = SR.auth.user();
  $("#terms").innerHTML = [
    "The referral discount applies to a friend's first purchase over ₹2,000.",
    "Credit is added 7 days after the friend's purchase, once the refund window for that item has passed.",
    "Credit can be used on any SkillRadius purchase and expires after 12 months.",
    "You can't use your own referral code.",
    "SkillRadius may withdraw rewards for misuse, such as self-referrals with multiple accounts."
  ].map(t => `<li>${t}</li>`).join("");

  if (!u) {
    $("#me").innerHTML = `<div class="rf-out">
      <div class="rf-coupons" aria-hidden="true">
        <div class="rf-coupon you"><small>You get</small><b>₹500</b><span>credit per friend</span><i class="cut l"></i><i class="cut r"></i></div>
        <div class="rf-coupon friend"><small>Your friend gets</small><b>₹500</b><span>off their first course</span><i class="cut l"></i><i class="cut r"></i></div>
      </div>
      <div class="t"><h2>Log in to get your referral code</h2><p>Every SkillRadius learner gets a personal code. Share it with friends and you both save, with no limit on how many people you invite.</p><div class="btn-row" style="justify-content:flex-start"><a class="btn" href="login.html">Log in</a><a class="btn ghost" href="signup.html">Create a free account</a></div></div>
    </div>`;
    return;
  }
  const code = SR.refCode(u);
  const link = "https://www.skillradius.in/signup?ref=" + code;

  function render() {
    const inv = SR.store.get("invites", []) || [];
    const joined = SR.auth.isDemo() ? 3 : 0, earned = joined * 500;
    const msg = encodeURIComponent(`I'm learning on SkillRadius. Use my code ${code} to get ₹500 off your first course: ${link}`);
    $("#me").innerHTML = `
      <div class="grid-2" style="align-items:start">
        <div class="card stack">
          <h2 style="font-size:20px;font-weight:600">Your referral code</h2>
          <div class="rf-ticket"><span><small>Your code · ₹500 off for friends</small><b>${code}</b></span><button class="btn sm" type="button" id="copy-code">${icon("copy")}Copy</button><i class="cut l"></i><i class="cut r"></i></div>
          <div class="field"><label for="ref-link">Your link</label><div class="row" style="flex-wrap:nowrap"><input id="ref-link" class="input" readonly value="${esc(link)}"><button class="btn soft sm" id="copy-link">Copy</button></div></div>
          <div class="row"><a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/?text=${msg}">Share on WhatsApp</a><a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}">Share on LinkedIn</a></div>
        </div>
        <div class="card stack">
          <div class="grid-3" style="gap:10px">${[["Invited", inv.length + joined], ["Joined", joined], ["Earned", "₹" + earned.toLocaleString("en-IN")]].map(([l, v]) => `<div style="background:var(--primary-softer);border-radius:12px;padding:12px;text-align:center"><b style="display:block;font-size:22px;color:var(--brand)">${v}</b><span class="small muted">${l}</span></div>`).join("")}</div>
          <form class="stack" id="invite" novalidate><div class="field"><label for="inv-email">Invite by email</label><div class="row" style="flex-wrap:nowrap"><input id="inv-email" class="input" type="email" placeholder="friend@example.com"><button class="btn" type="submit">Send</button></div></div></form>
          ${inv.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Friend</th><th>Invited</th><th>Status</th></tr></thead><tbody>${inv.slice().reverse().map(i => `<tr><td style="overflow-wrap:anywhere">${esc(i.email)}</td><td>${SR.fmtDate(i.at, { day: "numeric", month: "short" })}</td><td><span class="pill amber">Invited</span></td></tr>`).join("")}</tbody></table></div>` : `<p class="small muted">People you invite will show up here.</p>`}
        </div>
      </div>`;
    const copy = (t, m) => (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => SR.toast(m), () => SR.toast(t));
    $("#copy-code").addEventListener("click", () => copy(code, "Code copied"));
    $("#copy-link").addEventListener("click", () => copy(link, "Link copied"));
    $("#invite").addEventListener("submit", e => {
      e.preventDefault();
      const v = $("#inv-email").value.trim();
      if (!SR.validEmail(v)) { SR.fieldError($("#inv-email"), "Enter a valid email address."); return; }
      const all = SR.store.get("invites", []) || []; all.push({ email: v, at: Date.now() }); SR.store.set("invites", all);
      render(); SR.toast("Invite sent to " + v);
    });
  }
  render();
})();
