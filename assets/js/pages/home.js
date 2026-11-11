/* Home page (Figma frames "Home" + "search result", plus the sections every visitor needs) */
(function () {
  const { $, $$, esc, icon, inr } = SR;
  const fi = (n, a = "") => SR.ficon(n, a);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  $$("[data-i]").forEach(el => el.innerHTML = icon(el.dataset.i));
  $$("[data-fi]").forEach(el => el.innerHTML = fi(el.dataset.fi));

  // Signed-in visitors get shortcuts to their own area instead of sign-up
  const u = SR.auth.user();
  if (u) {
    const home = SR.homeFor(u), label = u.role === "learner" || !u.role ? "Go to My Learning" : "Open my panel";
    const c = $("#cta-start"); c.textContent = label; c.href = home;
    const s = $("#sc-cta"); s.textContent = "Open my dashboard"; s.href = home;
  }

  /* ---------- Three ways to learn: expanding panels ---------- */
  (function ways() {
    const box = $("#ways"); if (!box) return;
    const cs = SR.publicCourses(), tr = SR.openTrainings().slice().sort((a, b) => a.start.localeCompare(b.start)), ce = SR.publicCerts();
    const from = (list) => { const p = list.map(x => x.price).filter(x => x > 0); return p.length ? inr(Math.min(...p)) : ""; };
    const t0 = tr[0], DUR = 6000;
    const cards = [
      { ic: "animated_images", tag: "Learn anytime", t: "Self-paced courses", d: "Short video lessons, notes and quizzes. Learn on your own schedule and pick up exactly where you left off.",
        facts: [`${cs.length} courses`, "Quizzes & projects", "Certificate included"], href: "courses.html", cta: "Browse courses", price: from(cs),
        fig: `<img class="p" src="assets/img/people/sneha.webp" alt=""><span class="way-chip a"><span class="ic">${fi("animated_images")}</span><span><b>Module 3 of 8</b><span class="bar"><i></i></span></span></span>` },
      { ic: "live_tv", tag: "Learn with a trainer", t: "Live trainings", d: "Trainer-led batches online or in person. Weekly sessions, code reviews and a capstone project, with every class recorded.",
        facts: [`${tr.length} open batches`, "Small groups", "Recordings"], href: "trainings.html", cta: "See batches", price: from(tr),
        fig: `<div class="way-call"><img src="assets/img/lesson-poster.jpg" alt=""><span class="lv"><i></i>LIVE</span><span class="att"><img src="assets/img/people/sneha-face.webp" alt=""><img src="assets/img/people/arjun-face.webp" alt=""><img src="assets/img/people/rohan-face.webp" alt=""></span><span class="bar2"><i></i></span></div>${t0 ? `<span class="way-chip b"><span class="ic">${fi("live_tv")}</span><span><b>Next batch ${SR.fmtDate(t0.start, { day: "numeric", month: "short" })}</b><small>${t0.seats - t0.taken} seats left</small></span></span>` : ""}` },
      { ic: "verified", tag: "Prove your skills", t: "Professional certifications", d: "Pass a proctored exam and earn a credential employers can verify online with a unique certificate ID.",
        facts: ["Proctored exam", "Verifiable ID", "Valid 2–3 years"], href: "certifications.html", cta: "View certifications", price: from(ce),
        fig: `<img class="p" src="assets/img/cert-hero-2.webp" alt=""><span class="way-chip a"><span class="ic ok">${icon("check")}</span><span><b>Certificate verified</b><small>CERT-SR-PD-2026-014</small></span></span>` }
    ];
    box.innerHTML = cards.map((w, i) => `
      <div class="way${i ? "" : " on"}" role="tab" tabindex="0" aria-selected="${!i}" style="--dur:${DUR}ms">
        <div class="way-bg"><i></i></div>
        <span class="way-n">0${i + 1}</span><span class="tick"><i></i></span>
        <div class="way-tab" aria-hidden="true"><b>${w.t}</b><span>${fi(w.ic)}</span></div>
        <div class="way-fig" aria-hidden="true">${w.fig}</div>
        <div class="way-c"><small>${w.tag}</small><h3>${w.t}</h3><p>${w.d}</p>
          <div class="way-facts">${w.facts.map(f => `<span>${esc(f)}</span>`).join("")}</div>
          <a class="btn" href="${w.href}">${w.cta} ${icon("arrow")}${w.price ? `<em>from ${w.price}</em>` : ""}</a></div>
      </div>`).join("");
    const ps = $$(".way", box);
    let cur = 0, timer = null;
    const open = (k) => { cur = k; ps.forEach((p, j) => { p.classList.toggle("on", j === k); p.setAttribute("aria-selected", String(j === k)); const t = $(".tick i", p), b = $(".bar2 i", p); [t, b].forEach(x => { if (x) { x.style.animation = "none"; void x.offsetWidth; x.style.animation = ""; } }); }); };
    const desktop = () => matchMedia("(min-width: 1201px)").matches;
    const auto = () => { clearTimeout(timer); if (reduce || !desktop() || box.classList.contains("paused")) return; timer = setTimeout(() => { open((cur + 1) % ps.length); auto(); }, DUR); };
    ps.forEach((p, k) => {
      p.addEventListener("click", e => { if (k !== cur && desktop()) { e.preventDefault(); open(k); auto(); } });
      p.addEventListener("mouseenter", () => { if (desktop() && k !== cur) open(k); });
      p.addEventListener("focus", () => { if (desktop()) open(k); });
      p.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { const n = (k + (e.key === "ArrowRight" ? 1 : ps.length - 1)) % ps.length; ps[n].focus(); } if (e.key === "Enter" && e.target === p) location.href = cards[k].href; });
    });
    box.addEventListener("mouseenter", () => { box.classList.add("paused"); clearTimeout(timer); });
    box.addEventListener("mouseleave", () => { box.classList.remove("paused"); auto(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => { if (en.isIntersecting) { open(cur); auto(); } else clearTimeout(timer); }, { threshold: .4 }).observe(box);
  })();

  /* ---------- Catalog sections ---------- */
  const featured = ["python", "uiux", "data-ai", "mern"].map(SR.cert).filter(c => c && c.published !== false);
  $("#cert-grid").innerHTML = (featured.length ? featured : SR.publicCerts().slice(0, 4)).map(SR.certCard).join("");
  const picks = ["full-stack", "ai-video", "mobile-cine", "portfolio"].map(SR.course).filter(c => c && c.published !== false);
  // Category tabs over the course grid ("Popular" keeps the Figma picks)
  const allC = SR.publicCourses(), cats = [...new Set(allC.map(c => c.cat))].filter(c => allC.filter(x => x.cat === c).length);
  const tabs = [["Popular", null], ...cats.map(c => [c, c])];
  $("#c-tabs").innerHTML = tabs.map(([l, c], i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-cat="${c || ""}">${esc(l)}${c ? `<span>${allC.filter(x => x.cat === c).length}</span>` : ""}</button>`).join("");
  const showCourses = (cat, animate) => {
    const list = cat ? allC.filter(c => c.cat === cat).slice(0, 4) : (picks.length ? picks : allC.slice(0, 4));
    const g = $("#course-grid");
    g.innerHTML = list.map(SR.courseCard).join("");
    $$(":scope > *", g).forEach((el, i) => el.style.setProperty("--i", i));
    if (animate) { g.classList.remove("swap"); void g.offsetWidth; g.classList.add("swap"); }
  };
  $("#c-tabs").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#c-tabs button").forEach(x => x.setAttribute("aria-selected", String(x === b)));
    showCourses(b.dataset.cat, true);
  });
  showCourses(null, false);

  /* ---------- Hero announcement: the next batch that is still enrolling ---------- */
  const nextBatch = SR.openTrainings().filter(t => SR.startsAt ? SR.startsAt(t) > Date.now() : true).sort((a, b) => a.start.localeCompare(b.start))[0];
  if (nextBatch) {
    const left = nextBatch.seats - nextBatch.taken;
    $("#h-pill").href = "training.html#" + nextBatch.id;
    $("#h-pill-t").innerHTML = `<b>${esc(nextBatch.title)}</b> starts ${SR.fmtDate(nextBatch.start, { day: "numeric", month: "short" })}${left <= 10 ? ` · only ${left} seats left` : ""}`;
    $("#h-pill").hidden = false;
  }

  /* ---------- Course finder (three questions → a matched plan) ---------- */
  const pf = $("#pf");
  if (pf && SR.recommend) {
    const Q = [
      { k: "goal", q: "What are you aiming for?", opts: [["job", "Get my first job", "Start a career in tech or design", "work"], ["switch", "Switch careers", "Move into a new field", "repeat"], ["grow", "Grow in my current role", "Earn a promotion or raise", "show_chart"], ["explore", "Learn something new", "Build skills at my own pace", "auto_stories"]] },
      { k: "interest", q: "What excites you most?", opts: SR.interests.map(x => [x.id, x.label, "", x.ic]) },
      { k: "time", q: "How much time can you give each week?", opts: [["low", "Under 5 hours", "A little each evening", "schedule"], ["mid", "5–10 hours", "A few evenings and a weekend slot", "alarm"], ["high", "10+ hours", "I'm going all in", "bolt"]] }
    ];
    const ans = {};
    const steps = $$(".pf-steps li");
    const mark = (i) => steps.forEach((li, j) => { li.classList.toggle("on", j === i); li.classList.toggle("done", j < i); });
    const ask = (i) => {
      mark(i);
      const q = Q[i];
      pf.innerHTML = `<div><p class="pf-q">${q.q}</p><div class="pf-opts">${q.opts.map(([v, l, sub, ic], n) => `<button type="button" class="pf-opt" data-v="${v}" style="--i:${n}"><span class="ic">${fi(ic)}</span><span>${esc(l)}${sub ? `<small>${esc(sub)}</small>` : ""}</span></button>`).join("")}</div>${i ? `<button type="button" class="pf-back">← Back</button>` : ""}</div>`;
      $$(".pf-opt", pf).forEach(b => b.addEventListener("click", () => { ans[q.k] = b.dataset.v; i + 1 < Q.length ? ask(i + 1) : result(); }));
      const back = $(".pf-back", pf); if (back) back.addEventListener("click", () => ask(i - 1));
    };
    const result = () => {
      mark(3);
      const r = SR.recommend(ans), m = r.main;
      pf.innerHTML = `<div class="pf-res">
        <span class="lbl">Your match</span>
        <a class="pf-main-card" href="${m.href}"><img src="${m.img}" alt=""><div><span class="k">${m.kind}</span><h3>${esc(m.title)}</h3><p>${esc(m.why)}</p><div class="m"><b>${inr(m.price)}</b><span>${esc(m.meta)}</span></div></div></a>
        ${r.extra.length ? `<div class="pf-extra">${r.extra.map(x => `<a href="${x.href}"><small>${x.kind}</small><b>${esc(x.title)}</b><span>${esc(x.meta)}</span>${x.t && SR.countdownHTML ? SR.countdownHTML(x.t) : ""}</a>`).join("")}</div>` : ""}
        <div class="pf-actions"><a class="btn" href="${m.href}">View ${m.kind.toLowerCase()} ${icon("arrow")}</a><button type="button" class="btn ghost" id="pf-again">Start over</button><button type="button" class="pf-back" id="pf-talk" style="margin:0">Talk to an advisor</button></div>
      </div>`;
      SR.tickCountdowns && SR.tickCountdowns();
      $("#pf-again").addEventListener("click", () => ask(0));
      $("#pf-talk").addEventListener("click", () => SR.openAssistant ? SR.openAssistant() : (location.href = "contact.html"));
    };
    ask(0);
  }
  // Live batches as a timetable: date, batch, trainer, schedule, seats, price
  $("#tr-list").innerHTML = SR.openTrainings().slice().sort((a, b) => a.start.localeCompare(b.start)).slice(0, 4).map(t => {
    const tr = SR.trainer(t.trainer), left = t.seats - t.taken, d = new Date(t.start + "T00:00:00");
    const days = Math.round((d - new Date(new Date().toDateString())) / 864e5);
    return `<div class="tt-row" role="listitem">
      <div class="tt-date"><span class="d">${String(d.getDate()).padStart(2, "0")}</span><span class="m">${d.toLocaleDateString("en-IN", { month: "short" })}</span><span class="w">${days > 1 ? "in " + days + " days" : days === 1 ? "tomorrow" : "today"}</span></div>
      <img class="tt-img" src="${t.img}" alt="" loading="lazy">
      <div class="tt-main"><h3><a href="training.html#${t.id}">${esc(t.title)}</a></h3><div class="tt-by"><i style="background:${tr.color}">${SR.initials(tr.name)}</i>${esc(tr.name)} <span>· ${esc(tr.role)}</span></div></div>
      <div class="tt-when">${esc(t.days)}, ${esc(t.time)}<small>${t.mode === "online" ? "Live online" : "In person · " + esc(t.batch.replace(" Studio", ""))} · ${t.weeks ? t.weeks + " weeks" : "2 days"}</small></div>
      <div class="tt-seats${left <= 8 ? " low" : ""}"><b>${left} of ${t.seats}</b> seats left<div class="bar"><span style="width:${Math.round(t.taken / t.seats * 100)}%"></span></div></div>
      <div class="tt-buy"><span class="p">${inr(t.price)}${t.mrp > t.price ? `<s>${inr(t.mrp)}</s>` : ""}</span><a class="btn${left <= 8 ? "" : " ghost"}" href="training.html#${t.id}">${SR.isEnrolled("trainings", t.id) ? "View batch" : "Reserve seat"}</a></div>
    </div>`;
  }).join("");
  $("#paths").innerHTML = SR.paths.map(p => `<a class="path-c" href="path.html#${p.id}"><img src="${p.img}" alt=""><div class="b"><span class="m">${p.months} months · ${esc(p.level)}</span><h3>${esc(p.title)}</h3><p>${esc(p.salary)} starting salaries</p><span class="pr">${inr(p.price)}</span></div></a>`).join("");

  /* ---------- Stories ---------- */
  const quote = `<svg class="q" viewBox="0 0 34 31" fill="currentColor" aria-hidden="true"><path d="M19.98 31L19.98 20.62C19.98 14.95 21.07 10.29 23.23 6.65C25.48 3.02 29.07 0.8 34 0L34 5.45C31.06 5.81 28.98 6.96 27.77 8.91C26.56 10.87 25.95 13.97 25.95 18.23L22.06 17.7L33.87 17.7L33.87 31L19.98 31ZM0 31L0 20.62C0 14.95 1.08 10.29 3.24 6.65C5.49 3.02 9.08 0.8 14.02 0L14.02 5.45C11.07 5.81 9 6.96 7.79 8.91C6.58 10.87 5.97 13.97 5.97 18.23L2.08 17.7L13.89 17.7L13.89 31L0 31Z"/></svg>`;
  /* Stories: a sliding carousel (3 / 2 / 1 cards visible), auto-advances, loops */
  const more = SR.moreStories || [];
  const ALL = [...SR.stories, ...more.map((x, k) => ({ ...x, outcome: x.path + " path", result: x.hike === "First job" ? "First job" : x.hike + " salary", months: [5, 4, 3][k] || 4 }))];
  const card = (x, i) => `
    <figure class="story" style="--d:${i % 3}" data-i="${i}">
      <div class="ls-top"><span class="ls-av">${x.face ? `<img src="${x.face}" alt="${esc(x.name)}" loading="lazy">` : `<i class="ini" style="background:${x.color}">${SR.initials(x.name)}</i>`}<span class="ok" title="Verified learner">${icon("check")}</span></span>
        <div class="ls-id"><b>${esc(x.name)}</b><span>${esc(x.role.split(" @ ")[0])}${x.role.includes(" @ ") ? ` at <span class="co" style="display:inline">${esc(x.role.split(" @ ")[1])}</span>` : ""}</span></div></div>
      <blockquote class="ls-q">${esc(x.quote.length > 190 ? x.quote.slice(0, x.quote.lastIndexOf(" ", 180)).replace(/[.,;:]+$/, "") + "…" : x.quote)}</blockquote>
      <div class="ls-rate">${SR.starRow(5, 16)}<span>${esc(x.outcome)}</span></div>
      <figcaption class="ls-path"><span><small>Before</small><b>${esc(x.before)}</b></span><span class="arr"><i></i>${x.months} months</span><span class="to"><small>Now</small><b>${esc(x.result)}</b></span></figcaption>
    </figure>`;
  const track = $("#stories"), car = $("#ls-car"), N = ALL.length, AUTO = 4500;
  // Real cards, then clones of the first three so the loop is seamless
  track.innerHTML = ALL.map(card).join("") + ALL.slice(0, 3).map((x, i) => card(x, i).replace('<figure class="story"', '<figure class="story clone" aria-hidden="true"')).join("");
  $("#ls-prev").firstElementChild.innerHTML = icon("arrowl"); $("#ls-next").firstElementChild.innerHTML = icon("arrow");
  $("#ls-dots").innerHTML = ALL.map((x, i) => `<button type="button" role="tab" aria-label="Story ${i + 1}: ${esc(x.name)}" aria-selected="${!i}" style="--dur:${AUTO}ms"></button>`).join("");
  let idx = 0, timer = null;
  const per = () => parseInt(getComputedStyle(car).getPropertyValue("--per")) || 1;
  const step = () => { const c = track.children[0], g = parseFloat(getComputedStyle(track).columnGap) || 0; return c.getBoundingClientRect().width + g; };
  const paint = (instant) => {
    track.classList.toggle("jump", !!instant);
    track.style.transform = `translateX(${-idx * step()}px)`;
    const p = per(); [...track.children].forEach((c, k) => c.classList.toggle("vis", k >= idx && k < idx + p));
    $$("#ls-dots button").forEach((d, k) => { const on = k === idx % N; if (on && d.getAttribute("aria-selected") === "true") return; d.setAttribute("aria-selected", String(on)); });
    if (instant) void track.offsetWidth;
  };
  const go = (n) => {
    if (n < 0) { idx = N; paint(true); n = N - 1; }
    idx = n; paint(false); restart();
  };
  track.addEventListener("transitionend", e => { if (e.target === track && idx >= N) { idx -= N; paint(true); } });
  const restart = () => {
    clearTimeout(timer);
    $$("#ls-dots button[aria-selected='true']").forEach(d => { d.style.animation = "none"; void d.offsetWidth; d.style.animation = ""; });
    if (reduce || car.classList.contains("paused")) return;
    timer = setTimeout(() => go(idx + 1), AUTO);
  };
  $("#ls-next").addEventListener("click", () => go(idx + 1));
  $("#ls-prev").addEventListener("click", () => go(idx - 1));
  $$("#ls-dots button").forEach((d, k) => d.addEventListener("click", () => go(k)));
  car.addEventListener("mouseenter", () => { car.classList.add("paused"); clearTimeout(timer); });
  car.addEventListener("mouseleave", () => { car.classList.remove("paused"); restart(); });
  car.addEventListener("focusin", () => { car.classList.add("paused"); clearTimeout(timer); });
  car.addEventListener("focusout", () => { car.classList.remove("paused"); restart(); });
  car.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(idx + 1); if (e.key === "ArrowLeft") go(idx - 1); });
  // Swipe on touch screens
  let sx = null;
  track.addEventListener("pointerdown", e => { sx = e.clientX; });
  addEventListener("pointerup", e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1)); });
  addEventListener("resize", () => paint(true));
  if (reduce) car.classList.add("still");
  paint(true);
  // Start sliding (and play the card entrance) once the section is on screen
  if ("IntersectionObserver" in window) { const io2 = new IntersectionObserver(es => { if (es[0].isIntersecting) { $$(".story", track).forEach(c => c.classList.add("in")); restart(); io2.disconnect(); } }, { threshold: .25 }); io2.observe(car); }
  else { $$(".story", track).forEach(c => c.classList.add("in")); restart(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else restart(); });

  $("#ls-sum").innerHTML = `<span class="faces">${SR.stories.map(x => `<img src="${x.face}" alt="">`).join("")}${more.slice(0, 3).map(x => `<i style="background:${x.color}">${SR.initials(x.name)}</i>`).join("")}</span><span>Join <b><span data-count="3400" data-suffix="+">3,400+</span> learners</b> who moved into new roles.</span><a href="placements.html">Read more stories →</a>`;

  /* ---------- Events, verify, FAQ ---------- */
  const ne = SR.events.filter(e => e.date > Date.now()).sort((a, b) => a.date - b.date)[0];
  if (ne) $("#next-event").textContent = `Next: ${ne.title} · ${new Date(ne.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}`;
  $("#verify-form").addEventListener("submit", e => { e.preventDefault(); location.href = "verify.html#" + encodeURIComponent($("#cert-id").value.trim().toUpperCase()); });
  $("#faq").innerHTML = SR.faqHTML(SR.faq);
  // Conic shapes on the verify band (same family as the Figma certificate banner)
  $("#verify-band").insertAdjacentHTML("afterbegin", [[-60, -70, 220, 220, "50%"], [88, 60, 110, 160], [-40, 110, 120, 200]].map(([r, t, w, h, br = 0]) => `<span class="sh" aria-hidden="true" style="right:${r}px;top:${t}px;width:${w}px;height:${h}px;border-radius:${br}"></span>`).join(""));

  // The Figma dashed lines converge on the hero buttons
  const placeLines = () => { const hero = $("#hero"), c = $(".h-cta"); if (!hero || !c) return; const h = hero.getBoundingClientRect(), s = c.getBoundingClientRect(); hero.style.setProperty("--ly", (s.top - h.top + s.height / 2) + "px"); };
  placeLines(); addEventListener("resize", placeLines); document.fonts && document.fonts.ready.then(placeLines);


  /* ---------- Dashboard preview: gentle 3D tilt toward the pointer ---------- */
  const dev = $("#device");
  if (dev && !reduce && matchMedia("(hover: hover)").matches) {
    const box = dev.closest(".showcase") || dev;
    box.addEventListener("pointermove", e => { const r = dev.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; dev.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateZ(0)`; });
    box.addEventListener("pointerleave", () => { dev.style.transform = ""; });
  }

  /* ---------- Dashboard preview ---------- */
  $("#bars").innerHTML = [["M", 1.2], ["T", .5], ["W", 2.1], ["T", .3], ["F", 1.6], ["S", 2.4], ["S", .8]].map(([d, h], i) => `<span><i style="--h:${Math.max(6, h / 2.4 * 78)}px;transition-delay:${.3 + i * .08}s"></i>${d}</span>`).join("");
  $("#sc-courses").innerHTML = [["full-stack", 68], ["react", 42], ["ai-automation", 85]].map(([id, p]) => { const c = SR.course(id); return c ? `<div class="row2"><img src="${c.img}" alt=""><div style="min-width:0"><b>${esc(c.title)}</b><div class="pb"><i style="--w:${p}%"></i></div></div><span class="pct">${p}%</span></div>` : ""; }).join("");

  /* ---------- Count-up numbers + scroll reveal ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 1400;
    if (reduce) { el.textContent = end.toLocaleString("en-IN") + suf; return; }
    const tick = (t) => { const k = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))).toLocaleString("en-IN") + suf; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  $$("#cert-grid > *, #course-grid > *, #tr-grid > *, #paths > *, .step, .teaser").forEach((el, i) => { el.classList.add("rv"); if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", i % 4); });
  if (!("IntersectionObserver" in window) || reduce) { $$("[data-count]").forEach(countUp); $("#device").classList.add("in"); $$(".rv").forEach(el => el.classList.add("in")); return; }
  document.documentElement.classList.add("js-motion");
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add("in"); io.unobserve(el);
    $$("[data-count]", el).forEach(n => { if (n.dataset.start !== "device" || el.id === "device") countUp(n); });
  }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".rv, .h-stats").forEach(el => io.observe(el));
  // Anything already on screen (or a full-page capture) shows immediately
  setTimeout(() => $$(".rv").forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); }), 60);
})();
