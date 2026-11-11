/* Legal pages (privacy, terms, refunds, delivery, cookies, accessibility, grievance).
   Builds the shared layout from the plain document markup:
   · branded header with dates, reading time and print / contact actions
   · a switcher between all policies
   · sticky "On this page" card with reading progress and scroll-spy
   · numbered section headings with copyable anchors
   · a help card and related policies at the end */
(function () {
  const { $, $$, esc, icon } = SR;
  const fi = (n, a = "") => SR.ficon(n, a);
  const DOCS = [
    ["privacy.html", "Privacy Policy", "How we collect, use and protect your data", "security"],
    ["terms.html", "Terms & Conditions", "The rules for using SkillRadius", "description"],
    ["refund-policy.html", "Refund & Cancellation", "When and how you get your money back", "replay"],
    ["delivery-policy.html", "Delivery Policy", "How courses and certificates reach you", "download"],
    ["cookie-policy.html", "Cookie Policy", "What we store in your browser and why", "settings_backup_restore"],
    ["accessibility.html", "Accessibility", "Our commitment to an accessible platform", "globe"],
    ["grievance.html", "Grievance Redressal", "Raise a complaint and how we resolve it", "flag"]
  ];
  const here = location.pathname.split("/").pop() || "privacy.html";
  const cur = DOCS.find(d => d[0] === here) || DOCS[0];

  /* ---------- Header ---------- */
  const hero = $(".legal-hero"), doc = $("#doc"), toc = $("#toc");
  if (!hero || !doc) return;
  const datesTxt = ($(".dates", hero) || {}).textContent || "";
  const eff = (datesTxt.match(/Effective Date:\s*([^\n]+?)(?=Last|$)/) || [])[1], upd = (datesTxt.match(/Last Updated:\s*(.+)$/) || [])[1];
  const words = doc.innerText.split(/\s+/).length, mins = Math.max(1, Math.round(words / 220));
  const h1 = $("h1", hero).innerHTML;
  hero.className = "legal-hero page-hero center";
  hero.setAttribute("data-no-crumb", "");
  hero.innerHTML = `
    <div class="ph-shapes" aria-hidden="true"><i class="c"></i><i></i><i class="c"></i><i></i><i class="c"></i><i class="c"></i></div>
    <div class="wrap inner">
      <ol class="ph-crumb" aria-label="Breadcrumb"><li><a href="index.html">Home</a></li><li><a href="sitemap.html#legal">Legal</a></li><li aria-current="page">${esc(cur[1])}</li></ol>
      <span class="eyebrow"><span class="mk" aria-hidden="true"><img src="assets/img/logo-mark.svg" alt=""></span>Legal &amp; policies</span>
      <h1>${h1}</h1>
      <p>${esc(cur[2])}. Written to be read, not skimmed past.</p>
      <ul class="lg-meta">
        ${eff ? `<li>${fi("schedule")}Effective <b>${esc(eff.trim())}</b></li>` : ""}
        ${upd ? `<li>${fi("edit")}Last updated <b>${esc(upd.trim())}</b></li>` : ""}
        <li>${fi("auto_stories")}<b>${mins} min</b> read</li>
      </ul>
      <div class="lg-acts"><button class="btn ghost sm" type="button" id="lg-print">${fi("download")}Save as PDF</button><a class="btn sm" href="contact.html">Ask a question ${icon("arrow")}</a></div>
    </div>`;
  $("#lg-print").addEventListener("click", () => print());

  /* ---------- Policy switcher ---------- */
  hero.insertAdjacentHTML("afterend", `<nav class="lg-switch" aria-label="Policies"><div class="wrap"><div class="lg-tabs">${DOCS.map(([h, t, , ic]) => `<a href="${h}" ${h === cur[0] ? 'aria-current="page"' : ""}>${fi(ic)}${esc(t)}</a>`).join("")}</div></div></nav>`);
  const tabOn = $(".lg-tabs [aria-current]"); if (tabOn) tabOn.scrollIntoView({ block: "nearest", inline: "center" });

  /* ---------- Section headings ---------- */
  const heads = $$("h2", doc);
  heads.forEach((h, i) => {
    const m = h.textContent.match(/^\s*(\d+)\.\s*(.+)$/), n = m ? m[1] : String(i + 1), t = m ? m[2] : h.textContent;
    if (!h.id) h.id = "s" + n;
    h.innerHTML = `<span class="num">${n.padStart(2, "0")}</span><span class="tt">${esc(t)}</span><a class="anc" href="#${h.id}" aria-label="Copy link to ${esc(t)}">#</a>`;
  });
  doc.addEventListener("click", e => {
    const a = e.target.closest(".anc"); if (!a) return; e.preventDefault();
    const url = location.href.split("#")[0] + a.getAttribute("href");
    history.replaceState(null, "", a.getAttribute("href"));
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => SR.toast("Link to this section copied"), () => {});
  });

  /* ---------- On this page ---------- */
  if (toc) {
    const box = document.createElement("aside"); box.className = "lg-toc";
    box.innerHTML = `<details open><summary><b>On this page</b><span>${heads.length} sections</span>${fi("keyboard_arrow_down")}</summary>
      <div class="lg-prog" aria-hidden="true"><i id="lg-bar"></i></div>
      <ol>${heads.map(h => `<li><a href="#${h.id}"><span>${$(".num", h).textContent}</span>${$(".tt", h).innerHTML}</a></li>`).join("")}</ol></details>
      <div class="lg-mini"><span class="ic">${fi("flag")}</span><div><b>Need help?</b><span>Write to <a href="mailto:support@skillradius.in">support@skillradius.in</a></span></div></div>`;
    toc.replaceWith(box);
    if (matchMedia("(max-width: 960px)").matches) $("details", box).open = false;
    const links = $$("ol a", box);
    links.forEach(a => a.addEventListener("click", e => {
      e.preventDefault(); const t = $(a.getAttribute("href"));
      if (t) { scrollTo({ top: t.getBoundingClientRect().top + scrollY - 96, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); history.replaceState(null, "", a.getAttribute("href")); }
      if (matchMedia("(max-width: 960px)").matches) $("details", box).open = false;
    }));
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) links.forEach(a => { const on = a.getAttribute("href") === "#" + en.target.id; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    }), { rootMargin: "-18% 0px -72% 0px" });
    heads.forEach(h => io.observe(h));
    const bar = $("#lg-bar");
    const prog = () => { const r = doc.getBoundingClientRect(), total = r.height - innerHeight * .6, p = Math.min(1, Math.max(0, (-r.top + innerHeight * .2) / Math.max(1, total))); bar.style.width = (p * 100).toFixed(1) + "%"; };
    addEventListener("scroll", prog, { passive: true }); prog();
  }

  /* ---------- Help + related ---------- */
  const related = DOCS.filter(d => d[0] !== cur[0]).slice(0, 3);
  doc.insertAdjacentHTML("beforeend", `
    <div class="lg-help">
      <div class="t"><span class="ic">${fi("account_circle")}</span><div><h3>Questions about this policy?</h3><p>Our team answers within one working day. For complaints, our Grievance Officer responds within 24 hours.</p></div></div>
      <div class="c"><a href="mailto:support@skillradius.in">${icon("mail")}support@skillradius.in</a><a href="tel:+919876543210">${icon("phone")}+91 98765 43210</a><a class="btn sm" href="contact.html">Contact us ${icon("arrow")}</a></div>
    </div>
    <h3 class="lg-rel-h">Related policies</h3>
    <div class="lg-rel">${related.map(([h, t, d, ic]) => `<a href="${h}"><span class="ic">${fi(ic)}</span><b>${esc(t)}</b><span>${esc(d)}</span><em>Read ${icon("arrow")}</em></a>`).join("")}</div>`);

  // Arriving with #section in the URL
  if (location.hash) { const t = $(location.hash); if (t) setTimeout(() => scrollTo({ top: t.getBoundingClientRect().top + scrollY - 96 }), 60); }
})();
