/* Checkout — checkout.html#course/<id> | #training/<id> | #cert/<id> | #path/<id>
   Demo payment: no money moves. Wire the "Pay" step to your payment
   gateway (Razorpay / Stripe) and enrol on the server's success webhook.
   Every purchase creates an order (with GST split) shown under
   My Learning → Orders, with a printable invoice. */
(function () {
  if (!SR.auth.require()) return;
  const { $, esc, icon, inr, off } = SR;
  const [type, id] = SR.hashId().split("/");
  const pathParts = (p) => [...p.courses.map(x => ["courses", x]), ...p.trainings.map(x => ["trainings", x]), ...p.certs.map(x => ["certs", x])];
  const MAP = {
    course: { get: SR.course, store: "courses", label: "Course", back: "course", next: x => `learn.html#${x.id}`, nextLabel: "Start learning", meta: x => `${x.hours} hours · ${x.modules.length} modules · lifetime access` },
    training: { get: SR.training, store: "trainings", label: "Live training", back: "training", next: x => `training.html#${x.id}`, nextLabel: "View your batch", meta: x => `Starts ${SR.fmtDate(x.start, { day: "numeric", month: "short" })} · ${x.days}, ${x.time}` },
    cert: { get: SR.cert, store: "certs", label: "Certification", back: "certification", next: x => `certification.html#${x.id}`, nextLabel: "Open your program", meta: x => `${x.months} months access · ${x.validity}-year certificate` },
    path: { get: (i) => SR.paths.find(p => p.id === i), store: null, label: "Learning path", back: "path", next: () => "dashboard.html", nextLabel: "Go to My Learning", meta: x => `${pathParts(x).length} programs · ${x.months} months` }
  };
  const cfg = MAP[type], item = cfg && cfg.get(id);
  if (!item) { location.replace(location.hash.length > 1 ? "404.html" : "courses.html"); return; }
  if (item.closed && !SR.isEnrolled(cfg.store, item.id)) { location.replace("training.html#" + item.next); return; }
  const user = SR.auth.user();
  const isOwned = () => type === "path" ? pathParts(item).every(([t, x]) => SR.isEnrolled(t, x)) : SR.isEnrolled(cfg.store, item.id);
  let coupon = null, code = "";
  const pre = SR.session.get("coupon"); if (pre) { const c = SR.lookupCoupon(pre, user); if (c && !c.error) { coupon = c; code = pre.toUpperCase(); } }

  if (isOwned()) { done(null); return; }

  const totals = () => {
    const sub = item.price;
    let disc = 0;
    if (coupon) disc = coupon.kind === "pct" ? Math.round(sub * coupon.value / 100) : (sub >= 2000 ? Math.min(coupon.value, sub) : 0);
    const total = sub - disc;
    return { sub, disc, total, gst: Math.round(total - total / 1.18) };
  };

  function render() {
    const t = totals(), free = item.price === 0;
    $("#main").innerHTML = `
    <div class="wrap">
      <div class="steps-bar"><a class="link" href="${cfg.back}.html#${item.id}">${icon("arrowl")}Back</a><span>·</span><b>1 Details</b><span>›</span><span>2 Payment</span><span>›</span><span>3 Done</span></div>
      <div class="co">
        <form class="card stack" id="pay-form" novalidate style="gap:22px">
          <div><h1>${free ? "Confirm enrolment" : "Checkout"}</h1><p class="muted">${free ? "This course is free. Confirm your details to start." : "Secure payment. You'll get instant access and a GST invoice."}</p></div>
          <fieldset style="border:0;padding:0;margin:0" class="stack">
            <legend style="font-weight:700;margin-bottom:12px;font-size:16px">Billing details</legend>
            <div class="form-grid">
              <div class="field"><label for="b-name">Full name <span class="req">*</span></label><input id="b-name" value="${esc(user.firstName + " " + (user.lastName || ""))}" autocomplete="name"></div>
              <div class="field"><label for="b-email">Email <span class="req">*</span></label><input id="b-email" type="email" value="${esc(user.email)}" autocomplete="email"></div>
              <div class="field"><label for="b-phone">Phone <span class="req">*</span></label><input id="b-phone" inputmode="numeric" value="${esc(user.phone || "")}" placeholder="10-digit mobile number" autocomplete="tel"></div>
              <div class="field"><label for="b-state">State <span class="req">*</span></label><select id="b-state"><option value="">Select state</option>${["Andhra Pradesh", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"].map(s => `<option ${s === "Karnataka" ? "selected" : ""}>${s}</option>`).join("")}</select></div>
              <div class="field full"><label for="b-gst">GSTIN <span class="tiny muted">(optional, for business invoices)</span></label><input id="b-gst" placeholder="29ABCDE1234F1Z5" style="text-transform:uppercase"></div>
            </div>
          </fieldset>
          ${free ? "" : `
          <fieldset style="border:0;padding:0;margin:0" class="stack">
            <legend style="font-weight:700;margin-bottom:12px;font-size:16px">Payment method</legend>
            <div class="pay-methods" role="radiogroup">
              <label><input type="radio" name="pm" value="UPI" checked>${icon("upi")}UPI</label>
              <label><input type="radio" name="pm" value="Card">${icon("card")}Card</label>
              <label><input type="radio" name="pm" value="Netbanking">${icon("bank")}Netbanking</label>
              <label ${t.total < 5000 ? 'style="opacity:.5"' : ""}><input type="radio" name="pm" value="EMI" ${t.total < 5000 ? "disabled" : ""}>${icon("cal")}No-cost EMI</label>
            </div>
            <div id="pm-detail"></div>
          </fieldset>`}
          <label class="checkbox"><input type="checkbox" id="agree"><span>I agree to the <a class="link" href="terms.html" target="_blank">Terms &amp; Conditions</a>, <a class="link" href="refund-policy.html" target="_blank">Refund Policy</a> and <a class="link" href="privacy.html" target="_blank">Privacy Policy</a>.</span></label>
          <div id="form-alert"></div>
          <button class="btn lg block" type="submit" id="pay-btn">${free ? "Enroll for free" : `Pay ${inr(t.total)}`}</button>
          <p class="tiny muted center">${icon("lock", 'width="13" height="13" style="vertical-align:-2px"')} Payments are encrypted. This demo doesn't charge you.</p>
        </form>

        <aside class="card summary stack">
          <h2 style="font-size:18px;font-weight:600">Order summary</h2>
          <div class="item"><img src="${item.img}" alt=""><div><span class="pill blue" style="margin-bottom:6px">${cfg.label}</span><b>${esc(item.title)}</b><span class="tiny muted">${esc(cfg.meta(item))}</span></div></div>
          ${type === "path" ? `<ul class="check-list small">${pathParts(item).map(([t2, x]) => { const it = { courses: SR.course, trainings: SR.training, certs: SR.cert }[t2](x); return `<li>${icon(SR.isEnrolled(t2, x) ? "checkc" : "check")}${esc(it.title)}${SR.isEnrolled(t2, x) ? ' <span class="tiny muted">(owned)</span>' : ""}</li>`; }).join("")}</ul>` : ""}
          ${free ? "" : `
          <form class="coupon" id="coupon-form"><input class="input" id="coupon" placeholder="Coupon or referral code" aria-label="Coupon or referral code" value="${esc(code)}"><button class="btn soft" type="submit">Apply</button></form>
          <p class="tiny muted" id="coupon-msg">${coupon ? `<span style="color:var(--success-ink);font-weight:600">${esc(code)} applied: ${coupon.kind === "pct" ? coupon.value + "% off" : (t.disc ? inr(coupon.value) + " off" : "needs an order over ₹2,000")}</span> · <button type="button" class="link" id="rm-coupon" style="border:0;background:none;font-size:inherit;padding:0">Remove</button>` : "Try SKILL10 for 10% off, or a friend's referral code."}</p>
          <div class="lines">
            ${item.mrp ? `<div><span class="muted">${type === "path" ? "If bought separately" : "Original price"}</span><s class="muted">${inr(item.mrp)}</s></div>` : ""}
            <div><span class="muted">Price</span><span>${inr(t.sub)}</span></div>
            ${t.disc ? `<div><span class="muted">${esc(coupon.label)} (${esc(code)})</span><span style="color:var(--success-ink)">− ${inr(t.disc)}</span></div>` : ""}
            <div class="total"><span>Total</span><span>${inr(t.total)}</span></div>
            <div class="tiny muted"><span>Includes ${inr(t.gst)} GST (18%)</span>${item.mrp ? `<span style="color:var(--success-ink);font-weight:600">You save ${inr(item.mrp - t.total)} (${off(t.total, item.mrp)}%)</span>` : ""}</div>
          </div>`}
          <ul class="check-list small">${["Instant access after payment", type === "training" ? "Full refund up to 3 days before start" : type === "cert" ? "Refund within 7 days if no exam attempt" : "30-day money-back guarantee", "GST invoice in your dashboard"].map(x => `<li>${icon("check", 'style="color:var(--success)"')}${x}</li>`).join("")}</ul>
        </aside>
      </div>
    </div>`;
    bind();
  }

  function pmDetail(v) {
    const host = $("#pm-detail"); if (!host) return;
    host.innerHTML = {
      UPI: `<div class="field" style="margin-top:4px"><label for="upi">UPI ID</label><input id="upi" placeholder="yourname@okbank"><span class="hint">You'll approve the payment in your UPI app.</span></div>`,
      Card: `<div class="form-grid" style="margin-top:4px"><div class="field full"><label for="cc">Card number</label><input id="cc" inputmode="numeric" placeholder="1234 5678 9012 3456" autocomplete="cc-number"></div><div class="field"><label for="exp">Expiry</label><input id="exp" placeholder="MM / YY" autocomplete="cc-exp"></div><div class="field"><label for="cvv">CVV</label><input id="cvv" inputmode="numeric" placeholder="123" autocomplete="cc-csc"></div></div>`,
      Netbanking: `<div class="field" style="margin-top:4px"><label for="bank">Bank</label><select id="bank"><option>HDFC Bank</option><option>ICICI Bank</option><option>State Bank of India</option><option>Axis Bank</option><option>Kotak Mahindra Bank</option></select></div>`,
      EMI: `<div class="alert info" style="margin-top:4px">${icon("info")}<span>3 monthly payments of <b>${inr(Math.ceil(totals().total / 3))}</b> with no interest, on eligible credit cards.</span></div>`
    }[v];
  }

  function bind() {
    const pm = document.querySelector('input[name="pm"]:checked'); if (pm) pmDetail(pm.value);
    document.querySelectorAll('input[name="pm"]').forEach(r => r.addEventListener("change", () => pmDetail(r.value)));
    const cf = $("#coupon-form");
    if (cf) cf.addEventListener("submit", e => {
      e.preventDefault();
      const v = $("#coupon").value.trim().toUpperCase(), c = SR.lookupCoupon(v, user);
      if (c && !c.error) { coupon = c; code = v; render(); SR.toast(`${v} applied`); }
      else $("#coupon-msg").innerHTML = `<span style="color:var(--danger)">${c && c.error ? esc(c.error) : `“${esc(v || " ")}” isn't a valid code. Check the spelling and try again.`}</span>`;
    });
    const rm = $("#rm-coupon"); if (rm) rm.addEventListener("click", () => { coupon = null; code = ""; SR.session.del("coupon"); render(); });
    $("#pay-form").addEventListener("submit", e => {
      e.preventDefault();
      const checks = [["#b-name", v => v.trim().length > 1, "Enter your full name."], ["#b-email", SR.validEmail, "Enter a valid email address."], ["#b-phone", v => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "").slice(-10)), "Enter a 10-digit Indian mobile number."], ["#b-state", v => !!v, "Choose your state."], ["#b-gst", v => !v.trim() || /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(v.trim()), "Enter a valid 15-character GSTIN, or leave it empty."]];
      let ok = true;
      checks.forEach(([s, fn, msg]) => { const i = $(s), good = fn(i.value); SR.fieldError(i, good ? "" : msg); if (!good && ok) { i.focus(); ok = false; } });
      const upi = $("#upi"); if (ok && upi && !/^[\w.-]+@[\w]+$/.test(upi.value.trim())) { SR.fieldError(upi, "Enter a UPI ID like name@okbank."); upi.focus(); ok = false; } else if (upi) SR.fieldError(upi, "");
      const cc = $("#cc"); if (ok && cc && cc.value.replace(/\D/g, "").length < 15) { SR.fieldError(cc, "Enter the full card number."); cc.focus(); ok = false; }
      if (ok && !$("#agree").checked) { $("#form-alert").innerHTML = `<div class="alert error">${icon("warn")}Please accept the terms to continue.</div>`; ok = false; } else $("#form-alert").innerHTML = "";
      if (!ok) return;
      const b = $("#pay-btn"); b.disabled = true; b.innerHTML = `<span class="spinner"></span>${item.price ? "Processing payment…" : "Enrolling…"}`;
      const t = totals(), method = (document.querySelector('input[name="pm"]:checked') || {}).value || "Free";
      setTimeout(() => {
        const parts = type === "path" ? pathParts(item) : [[cfg.store, item.id]];
        parts.forEach(([store, x]) => {
          SR.enroll(store, x);
          if (store === "courses") SR.setLast(x, "0-0");
          if (store === "certs") { const cp = SR.store.get("certprog", {}) || {}; cp[x] = cp[x] || 0; SR.store.set("certprog", cp); }
        });
        // → Replace with the order created by your server after payment succeeds
        const order = SR.addOrder({ id: SR.newOrderId(), date: Date.now(), type, ref: item.id, title: item.title, price: item.price, mrp: item.mrp || item.price, discount: t.disc, coupon: code, total: t.total, state: $("#b-state").value, method, status: t.total ? "Paid" : "Free", gstin: $("#b-gst").value.trim().toUpperCase(), name: $("#b-name").value.trim(), email: $("#b-email").value.trim() });
        SR.session.del("coupon");
        done(order);
      }, 1200);
    });
  }

  function done(order) {
    $("#main").innerHTML = `
      <div class="wrap"><div class="card success">
        <span class="tick">${icon("check")}</span>
        <h1>${order ? "You're enrolled!" : "You're already enrolled"}</h1>
        <p class="muted">${order ? `A receipt has been sent to <b>${esc(user.email)}</b>. <b>${esc(item.title)}</b> is now in your dashboard.` : `You already have access to <b>${esc(item.title)}</b>.`}</p>
        ${order && order.total ? `<p class="small muted">Order <b>${order.id}</b> · ${inr(order.total)} paid by ${esc(order.method)}</p>` : ""}
        ${type === "training" && order ? `<p class="small muted">Your first session is on <b>${SR.fmtDate(item.start, { weekday: "long", day: "numeric", month: "long" })}</b> at ${esc(item.time)}.</p>` : ""}
        <div class="btn-row"><a class="btn lg" href="${cfg.next(item)}">${cfg.nextLabel} ${icon("arrow")}</a>${order && order.total ? `<a class="btn ghost lg" href="invoice.html#${order.id}">${icon("download")}View invoice</a>` : `<a class="btn ghost lg" href="dashboard.html">Go to My Learning</a>`}</div>
      </div></div>`;
  }

  render();
})();
addEventListener("hashchange", () => location.reload());
