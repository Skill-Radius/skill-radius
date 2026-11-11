/* Training batch detail — training.html#<training-id> */
(function () {
  const { $, esc, icon, inr, off, fmtDate } = SR;
  function render() {
    const t = SR.training(SR.hashId());
    if (!t) { location.replace(location.hash.length > 1 ? "404.html" : "trainings.html"); return; }
    document.title = t.title + " · SkillRadius";
    const tr = SR.trainer(t.trainer), left = t.seats - t.taken, enrolled = SR.isEnrolled("trainings", t.id);
    const ss = SR.sessionsOf(t);
    const others = SR.openTrainings().filter(x => x.id !== t.id).slice(0, 2);

    $("#main").innerHTML = `
    <section class="hero-tr band">
      <div class="wrap">
        <ol class="crumbs"><li><a href="index.html">Home</a></li><li><a href="trainings.html">Trainings</a></li><li>${esc(t.cat)}</li></ol>
        <div class="row" style="gap:8px;margin-bottom:12px"><span class="pill violet">${t.mode === "online" ? "Live online" : "In-person · " + esc(t.batch)}</span><span class="pill violet">${esc(t.batch)}</span>${left <= 5 ? `<span class="pill red">Only ${left} seats left</span>` : ""}</div>
        <h1>${esc(t.title)}</h1>
        <p class="lead">${esc(t.summary)}</p>
        <div class="facts">
          <span>${icon("cal")}Starts ${fmtDate(t.start, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
          <span>${icon("clock")}${esc(t.days)} · ${esc(t.time)}</span>
          <span>${icon("training")}${t.weeks ? t.weeks + " weeks · " + ss.length + " sessions" : "2-day workshop"}</span>
          <span>${icon("star")}${t.rating} batch rating</span>
        </div>
      </div>
    </section>

    <section class="band section tight">
      <div class="wrap detail">
        <article>
          <section style="margin-top:0">
            <h2>What's included</h2>
            <ul class="check-list outcomes">${t.includes.map(x => `<li>${icon("checkc")}${esc(x)}</li>`).join("")}</ul>
          </section>

          <section>
            <h2>Syllabus</h2>
            <ol class="timeline">${t.syllabus.map(([w, h, d]) => `<li><span class="when">${esc(w)}</span><span class="dot"></span><div><b>${esc(h)}</b><span>${esc(d)}</span></div></li>`).join("")}</ol>
          </section>

          <section>
            <div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0;font-size:22px;font-weight:600">Session calendar</h2><span class="small muted">${ss.length} sessions · ${esc(t.time)}</span></div>
            <div class="card" style="padding:8px 12px"><div class="table-wrap"><table class="sess">
              <thead><tr><th>#</th><th>Date</th><th>Day</th><th>Time</th></tr></thead>
              <tbody>${ss.slice(0, 8).map((d, i) => `<tr><td class="num">${i + 1}</td><td>${fmtDate(d, { day: "numeric", month: "short", year: "numeric" })}</td><td>${d.toLocaleDateString("en-IN", { weekday: "long" })}</td><td>${esc(t.time)}</td></tr>`).join("")}
              ${ss.length > 8 ? `<tr><td colspan="4" class="muted small">+ ${ss.length - 8} more sessions until ${fmtDate(ss[ss.length - 1])}</td></tr>` : ""}</tbody>
            </table></div></div>
          </section>

          <section>
            <h2>Your trainer</h2>
            <div class="card instructor">
              <span class="avatar-i" style="background:${tr.color}">${SR.initials(tr.name)}</span>
              <div><h3>${esc(tr.name)}</h3><p class="small muted">${esc(tr.role)}</p><p style="margin-top:10px">${esc(tr.bio)}</p>${SR.instructors && SR.instructors[t.trainer] ? `<a class="link small" href="instructor.html#${t.trainer}" style="display:inline-block;margin-top:8px">View profile →</a>` : ""}</div>
            </div>
          </section>

          ${t.mode === "in-person" ? `<section><h2>Venue</h2><div class="card row" style="gap:14px;align-items:flex-start">${icon("pin", 'width="22" height="22" style="color:var(--primary)"')}<div><b>SkillRadius ${esc(t.batch)}</b><p class="muted small" style="margin-top:4px">${t.batch.startsWith("Bengaluru") ? "Cinnabar Hills, Embassy Golf Links Business Park, Challaghatta, Bengaluru 560071" : "Address shared with registered learners one week before the workshop."}</p></div></div></section>` : ""}

          <section>
            <h2>Batch FAQ</h2>
            <div class="acc faq">${SR.faqHTML([
              ["What if I miss a session?", "Every session is recorded and posted to your dashboard within a few hours."],
              ["Can I switch batches?", "Yes, once, free of charge, up to 3 days before the start date."],
              ["How do I get the certificate?", "Attend at least 75% of sessions and submit the capstone project."]
            ], false)}</div>
          </section>
        </article>

        <aside class="buy-box">
          <img src="${t.img}" alt="">
          <div class="b">
            ${enrolled ? `
              <span class="pill green" style="justify-self:start">${icon("check")}Your seat is reserved</span>
              <p class="small muted">First session: <b style="color:var(--ink)">${fmtDate(ss[0], { weekday: "short", day: "numeric", month: "short" })}, ${esc(t.time)}</b>. The join link appears on your dashboard 15 minutes before each session.</p>
              <a class="btn lg block" href="dashboard.html#trainings">Open in My Learning</a>
              <button class="btn ghost block" id="ics">${icon("cal")}Add sessions to calendar</button>
            ` : t.closed ? `
              <span class="pill grey" style="justify-self:start">Enrolment closed</span>
              <p class="small muted">This batch is already running. The next one starts ${SR.training(t.next) ? fmtDate(SR.training(t.next).start, { day: "numeric", month: "long" }) : "soon"}.</p>
              <a class="btn lg block" href="training.html#${t.next}">See the next batch</a>
            ` : `
              <div class="price"><b>${inr(t.price)}</b><s>${inr(t.mrp)}</s><span class="pill green">${off(t.price, t.mrp)}% OFF</span></div>
              <div class="seats">${t.taken} of ${t.seats} seats filled · <b style="color:${left <= 5 ? "var(--danger-ink)" : "var(--ink)"}">${left} left</b><div class="bar"><span style="width:${SR.pct(t.taken, t.seats)}%"></span></div></div>
              <a class="btn lg block" href="checkout.html#training/${t.id}">Reserve a seat</a>
              <p class="tiny muted center">Pay in 3 interest-free instalments · Full refund up to 3 days before start</p>
            `}
            <ul>
              <li>${icon("cal")}${fmtDate(t.start, { day: "numeric", month: "long" })}${t.weeks ? " – " + fmtDate(ss[ss.length - 1], { day: "numeric", month: "long" }) : ""}</li>
              <li>${icon("clock")}${esc(t.days)}, ${esc(t.time)}</li>
              <li>${icon(t.mode === "online" ? "video" : "pin")}${t.mode === "online" ? "Live online, with recordings" : "In person at our " + esc(t.batch)}</li>
              <li>${icon("users")}Max ${t.seats} learners</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>

    <section class="band section tight alt">
      <div class="wrap">
        <div class="sec-head left" style="margin-bottom:24px"><h2 style="font-size:26px">Other upcoming batches</h2></div>
        <div class="grid-2">${others.map(o => SR.trainingCard(o)).join("")}</div>
      </div>
    </section>`;

    const ics = $("#ics");
    if (ics) ics.addEventListener("click", () => SR.toast("Calendar invites sent to " + (SR.auth.user() || {}).email));
  }
  addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
  render();
})();
