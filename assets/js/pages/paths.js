/* Learning paths — paths.html (list) and path.html#<id> (detail) */
(function () {
  const { $, $$, esc, icon, inr, off } = SR;
  const page = document.querySelector('meta[name="sr-page"]').content;
  $$("[data-i]").forEach(el => el.innerHTML = icon(el.dataset.i));

  const items = (p) => [
    ...p.courses.map(id => ({ kind: "Course", it: SR.course(id), href: "course.html#" + id })),
    ...p.trainings.map(id => ({ kind: "Live training", it: SR.training(id), href: "training.html#" + id })),
    ...p.certs.map(id => ({ kind: "Certification", it: SR.cert(id), href: "certification.html#" + id }))
  ].filter(x => x.it);
  const separate = (p) => items(p).reduce((s, x) => s + (x.it.price || 0), 0);
  const owned = (p) => [...p.courses.map(id => ["courses", id]), ...p.trainings.map(id => ["trainings", id]), ...p.certs.map(id => ["certs", id])].every(([t, id]) => SR.isEnrolled(t, id));

  if (page === "paths") {
    $("#list").innerHTML = SR.paths.map(p => `
      <article class="path-card">
        <img src="${p.img}" alt="">
        <div class="b">
          <div class="row" style="gap:8px"><span class="pill blue">${esc(p.level)}</span><span class="pill green">Save ${off(p.price, separate(p))}%</span>${owned(p) ? `<span class="pill solid">Enrolled</span>` : ""}</div>
          <h3><a href="path.html#${p.id}">${esc(p.title)}</a></h3>
          <p class="muted">${esc(p.summary)}</p>
          <div class="path-meta"><span>${icon("clock")}${p.months} months</span><span>${icon("book")}${items(p).length} programs</span><span>${icon("trend")}${esc(p.salary)} roles</span></div>
          <div class="row" style="justify-content:space-between;margin-top:6px"><div class="price"><b>${inr(p.price)}</b><s>${inr(separate(p))}</s></div><a class="btn" href="path.html#${p.id}">View path ${icon("arrow")}</a></div>
        </div>
      </article>`).join("");
    return;
  }

  function render() {
    const p = SR.paths.find(x => x.id === SR.hashId());
    if (!p) { location.replace(location.hash.length > 1 ? "404.html" : "paths.html"); return; }
    document.title = p.title + " learning path · SkillRadius";
    const list = items(p), sep = separate(p), mine = owned(p);
    const stepHref = (type, ref) => type === "course" ? "course.html#" + ref : type === "training" ? "training.html#" + ref : type === "cert" ? "certification.html#" + ref : "placements.html";
    const stepPill = { course: ["Course", "blue"], training: ["Live training", "violet"], cert: ["Certification", "amber"], support: ["Career support", "green"] };
    $("#main").innerHTML = `
    <section class="band section" style="background:linear-gradient(180deg,#e4e9ff,#f6f8ff 70%,#fff);padding-bottom:48px">
      <div class="wrap split">
        <div>
          <ol class="crumbs"><li><a href="index.html">Home</a></li><li><a href="paths.html">Learning paths</a></li><li>${esc(p.title)}</li></ol>
          <span class="eyebrow">Learning path · ${esc(p.level)}</span>
          <h1 style="margin-top:10px">Become a <span class="hl">${esc(p.title)}</span></h1>
          <p class="lead">${esc(p.summary)}</p>
          <div class="path-meta" style="margin-top:16px"><span>${icon("clock")}${p.months} months</span><span>${icon("book")}${list.length} programs</span><span>${icon("trend")}Target role: ${esc(p.role)}</span><span>${icon("tag")}${esc(p.salary)}</span></div>
          <div class="btn-row">${mine ? `<a class="btn lg" href="dashboard.html">Continue in My Learning</a>` : `<a class="btn lg" href="checkout.html#path/${p.id}">Enrol in the path · ${inr(p.price)}</a>`}<a class="btn ghost lg" href="contact.html">Talk to a counsellor</a></div>
          ${mine ? "" : `<p class="small muted" style="margin-top:10px">${inr(sep)} if bought separately · you save ${inr(sep - p.price)} (${off(p.price, sep)}%) · no-cost EMI available</p>`}
        </div>
        <div class="split-media"><img src="${p.img}" alt=""></div>
      </div>
    </section>
    <section class="band section tight">
      <div class="wrap detail">
        <article>
          <section style="margin-top:0"><h2>Your roadmap</h2>
            <ol class="path-steps">${p.steps.map(([t, d, type, ref], i) => `<li><span class="n">${i + 1}</span><div class="card"><div class="row" style="justify-content:space-between"><h3>${esc(t)}</h3><span class="pill ${stepPill[type][1]}">${stepPill[type][0]}</span></div><p class="muted small" style="margin-top:6px">${esc(d)}</p>${ref || type === "support" ? `<a class="link small" style="margin-top:8px" href="${stepHref(type, ref)}">Details ${icon("arrow")}</a>` : ""}</div></li>`).join("")}</ol>
          </section>
          <section><h2>Skills you'll build</h2><div class="row" style="gap:8px">${p.skills.map(s => `<span class="pill blue" style="font-size:13px;padding:6px 12px">${esc(s)}</span>`).join("")}</div></section>
          <section><h2>Path FAQ</h2><div class="acc faq">${SR.faqHTML([["Can I take the programs in a different order?", "Yes. The roadmap is a recommendation; every program in the path unlocks as soon as you enrol."], ["What if I already own one of the programs?", "Contact us before buying and we'll take its price off the bundle."], ["Is placement guaranteed?", "No. We provide placement support (reviews, mock interviews and referrals), but job offers depend on your performance in interviews."]])}</div></section>
        </article>
        <aside class="buy-box">
          <div class="b">
            <h3 style="font-size:18px;font-weight:600">What's included</h3>
            <ul style="gap:12px">${list.map(x => `<li style="display:grid;grid-template-columns:60px minmax(0,1fr);gap:12px;align-items:center"><img src="${x.it.img}" alt="" style="width:60px;aspect-ratio:16/10;object-fit:cover;border-radius:8px"><span><span class="tiny" style="color:var(--primary);font-weight:700">${x.kind}</span><br><a href="${x.href}" style="color:var(--ink);text-decoration:none;font-weight:600">${esc(x.it.title)}</a></span></li>`).join("")}
              <li>${icon("users")}Placement support & mock interviews</li></ul>
            ${mine ? `<span class="pill green" style="justify-self:start">${icon("check")}You own every program in this path</span>` : `<div class="price"><b>${inr(p.price)}</b><s>${inr(sep)}</s><span class="pill green">${off(p.price, sep)}% OFF</span></div><a class="btn lg block" href="checkout.html#path/${p.id}">Enrol now</a><p class="tiny muted center">Each program follows its own refund rule. See the Refund Policy.</p>`}
          </div>
        </aside>
      </div>
    </section>
    <section class="band section tight alt"><div class="wrap"><h2 style="font-size:24px;font-weight:600;margin-bottom:18px">Other paths</h2><div class="grid-3">${SR.paths.filter(x => x.id !== p.id).map(x => `<a class="feature" href="path.html#${x.id}" style="text-decoration:none"><img src="${x.img}" alt="" style="border-radius:12px;aspect-ratio:16/9;object-fit:cover"><h3>${esc(x.title)}</h3><p>${x.months} months · ${inr(x.price)}</p></a>`).join("")}</div></div></section>`;
  }
  addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
  render();
})();
