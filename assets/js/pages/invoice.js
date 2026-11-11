/* GST tax invoice — invoice.html#<order-id>
   Intra-state (Karnataka) orders show CGST + SGST; others show IGST.
   SAC 999293 covers commercial training and coaching services. */
(function () {
  if (!SR.auth.require()) return;
  const { $, esc, icon, inr } = SR;
  const user = SR.auth.user();
  const o = SR.orders().find(x => x.id === SR.hashId());
  if (!o) { $("#main").innerHTML = `<div class="wrap narrow"><div class="empty">${icon("file")}<h3>Invoice not found</h3><p>We couldn't find order “${esc(SR.hashId())}” in your account.</p><a class="btn" href="dashboard.html#orders">Back to orders</a></div></div>`; return; }
  const g = SR.gstSplit(o.total, o.state);
  const money = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const invNo = "INV/" + new Date(o.date).getFullYear() + "-" + String(new Date(o.date).getFullYear() + 1).slice(2) + "/" + o.id.replace("SR-ORD-", "");
  const typeLabel = { course: "Online course (self-paced)", training: "Live training program", cert: "Professional certification program", path: "Learning path bundle" }[o.type];
  document.title = invNo + " · SkillRadius";
  const words = (n) => { // Indian-format amount in words (rupees only)
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"], b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const two = (x) => x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : "");
    const three = (x) => (x >= 100 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : "") + (x % 100 ? two(x % 100) : "");
    n = Math.round(n); if (!n) return "Zero";
    const parts = [[Math.floor(n / 1e7), "Crore"], [Math.floor(n / 1e5) % 100, "Lakh"], [Math.floor(n / 1e3) % 100, "Thousand"], [n % 1000, ""]];
    return parts.filter(([v]) => v).map(([v, l]) => (l ? two(v) : three(v)) + (l ? " " + l : "")).join(" ");
  };

  $("#main").innerHTML = `
  <div class="wrap" style="max-width:900px">
    <ol class="crumbs"><li><a href="dashboard.html">My Learning</a></li><li><a href="dashboard.html#orders">Orders</a></li><li>${esc(o.id)}</li></ol>
    <div class="inv" id="inv">
      <div class="inv-top">
        <div><span class="brand" style="font-size:22px">${SR.logo(32)}<span>SkillRadius</span></span>
          <p class="small muted" style="margin-top:10px;max-width:40ch">SkillRadius Learning Pvt. Ltd.<br>Cinnabar Hills, Embassy Golf Links Business Park, Challaghatta, Bengaluru, Karnataka 560071<br>GSTIN: 29ABCDE1234F1Z5 · PAN: ABCDE1234F</p></div>
        <div style="text-align:right"><h1>TAX INVOICE</h1><p class="small" style="margin-top:6px">Invoice no: <b>${invNo}</b><br>Date: <b>${SR.fmtDate(o.date)}</b><br>Order: ${esc(o.id)}</p>${o.status === "Paid" ? `<p style="margin-top:10px"><span class="paid">PAID</span></p>` : o.status === "Refunded" ? `<p style="margin-top:10px"><span class="paid" style="border-color:var(--danger);color:var(--danger-ink)">REFUNDED</span></p>` : ""}</div>
      </div>
      <div class="inv-meta">
        <div><h2>Billed to</h2><b>${esc(o.name || user.firstName + " " + (user.lastName || ""))}</b><br>${esc(o.email || user.email)}<br>State: ${esc(o.state)}${o.gstin ? `<br>GSTIN: ${esc(o.gstin)}` : ""}</div>
        <div><h2>Payment</h2>Method: ${esc(o.method)}<br>Place of supply: ${esc(o.state)}<br>Reverse charge: No</div>
      </div>
      <div style="overflow-x:auto"><table>
        <thead><tr><th>#</th><th>Description</th><th>SAC</th><th class="r">Amount</th></tr></thead>
        <tbody>
          <tr><td>1</td><td><b>${esc(o.title)}</b><br><span class="small muted">${typeLabel}</span></td><td>999293</td><td class="r">${money(o.price / 1.18)}</td></tr>
          ${o.discount ? `<tr><td></td><td>Discount${o.coupon ? ` (${esc(o.coupon)})` : ""}</td><td></td><td class="r">− ${money(o.discount / 1.18)}</td></tr>` : ""}
        </tbody>
      </table></div>
      <div class="totals">
        <div><span class="muted">Taxable value</span><span>${money(g.base)}</span></div>
        ${g.igst ? `<div><span class="muted">IGST @ 18%</span><span>${money(g.igst)}</span></div>` : `<div><span class="muted">CGST @ 9%</span><span>${money(g.cgst)}</span></div><div><span class="muted">SGST @ 9%</span><span>${money(g.sgst)}</span></div>`}
        <div class="grand"><span>Total</span><span>${money(o.total)}</span></div>
        <div class="tiny muted" style="justify-content:flex-end">Rupees ${words(o.total)} only</div>
      </div>
      <p class="tiny muted" style="margin-top:28px;border-top:1px solid var(--line);padding-top:14px">This is a computer-generated invoice and does not need a signature. For billing questions, write to support@skillradius.in quoting ${esc(o.id)}.</p>
    </div>
    <div class="inv-actions">
      <button class="btn" id="print">${icon("download")}Download PDF</button>
      <a class="btn ghost" href="dashboard.html#orders">${icon("arrowl")}Back to orders</a>
    </div>
  </div>`;
  $("#print").addEventListener("click", () => { try { window.print(); } catch { } setTimeout(() => SR.toast("Choose “Save as PDF” in the print dialog"), 300); });
})();
addEventListener("hashchange", () => location.reload());
