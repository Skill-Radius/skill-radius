/* Course detail — course.html#<course-id> */
(function () {
  const { $, esc, icon, inr, off, stars } = SR;

  function render() {
    const c = SR.course(SR.hashId());
    if (!c) { location.replace(location.hash.length > 1 ? "404.html" : "courses.html"); return; }
    document.title = c.title + " · SkillRadius";
    const tr = SR.trainer(c.instructor);
    const enrolled = SR.isEnrolled("courses", c.id);
    const prog = enrolled ? SR.progressOf(c.id) : null;
    const lessons = SR.lessons(c);
    const counts = { video: lessons.filter(l => l.type === "video").length, notes: lessons.filter(l => l.type === "notes").length, quiz: lessons.filter(l => l.type === "quiz").length };
    const typeIcon = { video: "play", notes: "notes", quiz: "quiz" };
    const related = SR.courses.filter(x => x.id !== c.id && x.cat === c.cat).concat(SR.courses.filter(x => x.id !== c.id && x.cat !== c.cat)).slice(0, 3);
    const dist = [[5, 62], [4, 24], [3, 9], [2, 3], [1, 2]];
    const user = SR.auth.user();
    const learnerReviews = ((SR.store.get("reviews", {}) || {})[c.id] || []).filter(r => r.status !== "hidden");
    const myReview = user ? learnerReviews.find(r => r.email === user.email) : null;
    const canReview = enrolled && prog && prog.pct >= 20 && !myReview;
    const wished = SR.wishlist().includes(c.id);

    const fi = (n, a = "") => SR.ficon(n, a);
    const revSec = `
          <section class="sec rv-sec">
            <h2>Learner Reviews</h2>
            <div class="rating-summary">
              <div><div class="big">${c.rating}</div><div class="stars">${stars(c.rating)}</div><div class="tiny muted">Course rating · ${c.reviews.toLocaleString("en-IN")} ratings</div></div>
              <div class="bars">${dist.map(([st, p]) => `<div><span>${st} ★</span><span class="bar"><span style="width:${p}%"></span></span><span class="num">${p}%</span></div>`).join("")}</div>
            </div>
            ${canReview ? `<form class="card stack" id="review-form" style="margin-bottom:16px;background:var(--primary-softer);border-color:var(--primary-line)" novalidate>
              <b>How's the course going? Leave a review</b>
              <div class="star-input" role="radiogroup" aria-label="Your rating">${[5, 4, 3, 2, 1].map(n => `<input type="radio" name="rs" id="rs${n}" value="${n}"><label for="rs${n}" title="${n} star${n > 1 ? "s" : ""}">★</label>`).join("")}</div>
              <div class="field"><label for="rv-text" class="sr-only">Your review</label><textarea id="rv-text" placeholder="What did you like? What could be better?" style="min-height:90px"></textarea></div>
              <button class="btn sm" type="submit" style="justify-self:start">Post review</button>
            </form>` : enrolled && !myReview ? `<p class="small muted" style="margin-bottom:14px">You can review this course after completing 20% of it.</p>` : ""}
            <div class="review-list">${learnerReviews.slice().reverse().map(r => `
              <div class="review"><div class="top"><span class="avatar-i" style="background:#3c59c8">${SR.initials(r.name)}</span><div><b>${esc(r.name)}${r.email === (user || {}).email ? ' <span class="pill blue">You</span>' : ""}</b><span class="stars tiny">${stars(r.rating)}</span> <span class="tiny muted">${SR.fmtDate(r.at, { day: "numeric", month: "short" })} · verified learner</span></div></div><p>${esc(r.text)}</p></div>`).join("")}
              ${SR.reviews.map(r => `<div class="review"><div class="top"><span class="avatar-i" style="background:${r.color}">${SR.initials(r.name)}</span><div><b>${esc(r.name)}</b><span class="stars tiny">${stars(r.rating)}</span> <span class="tiny muted">${r.when}</span></div></div><p>${esc(r.text)}</p></div>`).join("")}</div>
          </section>`;

    $("#main").innerHTML = `
    <div class="in">
      <article>
        <ol class="crumbs"><li><a href="index.html">Home</a></li><li><a href="courses.html">Courses</a></li><li><a href="courses.html#cat=${encodeURIComponent(c.cat)}">${esc(c.cat)}</a></li></ol>
        <h1>${esc(c.title)}</h1>
        <p class="sub">${esc(c.subtitle)}</p>
        <section class="sec ov"><h2>Course Overview</h2>${c.overview.map(p => `<p>${esc(p)}</p>`).join("")}</section>
        <section class="sec"><h2>This Course Includes</h2>
          <ul class="inc">${[["schedule", `${c.hours} hours on-demand video`], ["description", `${c.articles} articles`], ["download", `${c.resources} downloadable resources`], ["mobile", "Access on mobile and TV"], ["closed_caption", "Closed captions"], ["award_star", "Certificate of completion"]].map(([i, t]) => `<li>${fi(i)}${t}</li>`).join("")}</ul>
        </section>
        <section class="sec"><h2>What You'll Learn</h2><p class="note">By the end of this course, you will be able to:</p>
          <ul class="out">${c.outcomes.map(o => `<li><i>${fi("check")}</i>${esc(o)}</li>`).join("")}</ul>
        </section>
        <section class="sec"><h2>Curriculum</h2><p class="note">${c.modules.length} modules · ${counts.video} videos · ${counts.notes} notes · ${counts.quiz} quizzes</p>
          <div class="acc" style="margin-top:16px">${c.modules.map((m, mi) => `
            <details ${mi === 0 ? "open" : ""}>
              <summary>Module ${mi + 1}: ${esc(m.title)}<span class="meta">${m.lessons.length} lessons</span>${fi("keyboard_arrow_down")}</summary>
              <ul class="lessons">${m.lessons.map((l, li) => {
                const key = mi + "-" + li, open = enrolled || (mi === 0 && li === 0), done = prog && prog.done.includes(key);
                return `<li>${done ? fi("check_circle", 'style="color:var(--success)"') : fi(l[1] === "video" ? "play_circle" : l[1] === "quiz" ? "quiz" : "description")}
                  ${open ? `<a href="learn.html#${c.id}/${enrolled ? key : "0-0"}" style="text-decoration:none">${esc(l[0])}${!enrolled ? ' <span class="pill blue" style="margin-left:6px">Preview</span>' : ""}</a>` : `<span>${esc(l[0])}</span>`}
                  <span class="d">${open ? esc(l[2]) : fi("lock", 'width="15" height="15"')}</span></li>`; }).join("")}</ul>
            </details>`).join("")}</div>
        </section>
        <section class="sec"><h2>Requirements</h2><ul class="inc">${c.requirements.map(r => `<li>${fi("arrow_forward_ios", 'style="width:14px;height:14px;color:var(--primary)"')}${esc(r)}</li>`).join("")}</ul></section>
        <section class="sec" id="instructor"><h2>Instructor</h2>
          <div class="card instructor" style="margin-top:16px">
            <span class="avatar-i" style="background:${tr.color}">${SR.initials(tr.name)}</span>
            <div><h3>${esc(tr.name)}</h3><p class="small muted">${esc(tr.role)}</p><p style="margin-top:10px">${esc(tr.bio)}</p>${c.instructor !== "skillradius" ? `<a class="link small" href="instructor.html#${c.instructor}" style="display:inline-block;margin-top:8px">View profile →</a>` : ""}</div>
          </div>
        </section>
        ${revSec}
        <section class="sec" id="course-faq"><h2>Frequently asked questions</h2>
          <div class="acc faq" style="margin-top:16px">${SR.faqHTML([
            ["How long do I have access?", "Once you enrol, the course stays in My Learning with lifetime access, including future updates to the lessons."],
            ["Do I get a certificate?", `Yes. Finish every lesson and quiz and a certificate of completion is issued in your dashboard, with an ID anyone can check on the Verify page.`],
            ["Can I learn on my phone?", "Yes. Lessons, notes and quizzes work in any modern browser on phone, tablet or laptop, and your progress syncs across devices."],
            ["What if the course isn't right for me?", "You can request a full refund within 30 days of purchase if you've completed less than 30% of the course. See the Refund Policy for details."],
            ["Who do I ask if I get stuck?", "Use the Q&A on each lesson, or raise a ticket from Help & support. Our team replies within one working day."]
          ], false)}</div>
        </section>
      </article>

      <aside class="pcard">
        <img src="${c.img}" alt="">
        <div class="tint">
          <div class="wh">
            <div class="t">${esc(c.title)}</div>
            <div class="by"><span>Created by <img src="assets/img/logo-mark.svg" alt="">${esc(tr.name === "SkillRadius Studio" ? "SkillRadius" : tr.name)}</span>${c.bestseller ? `<span class="best">${fi("check", 'width="14" height="14"')}Best Seller</span>` : ""}</div>
            <div class="meta"><span>${fi("schedule")}${c.hours} hours</span><span>${fi("dashboard")}${c.modules.length} Modules</span><span class="sr-stars">${SR.starRow(c.rating, 20)} ${c.rating} (${c.reviews.toLocaleString("en-IN")})</span></div>
            ${enrolled ? `
              <div class="prog"><div class="row"><span><span class="pill green">${icon("check")}You're enrolled</span></span><b>${prog.pct}%</b></div><div class="bar"><span style="width:${prog.pct}%"></span></div><span class="tiny muted">${prog.doneCount} of ${prog.total} lessons complete</span></div>
              <a class="btn block buy" href="learn.html#${c.id}">${prog.doneCount ? "Continue learning" : "Start learning"} ${icon("arrow")}</a>`
            : `<div class="price"><b>${inr(c.price)}</b>${c.mrp ? `<s>${inr(c.mrp)}</s><span class="off">${off(c.price, c.mrp)}% OFF</span>` : ""}</div>
              <a class="btn block buy" href="checkout.html#course/${c.id}">${c.price === 0 ? "Enroll for free" : "Buy Now"}</a>
              ${c.price ? `<ul class="assure"><li>${fi("check_circle")}30-day money-back guarantee</li><li>${fi("check_circle")}Lifetime access · price includes GST</li></ul>` : ""}`}
            <div class="acts">${user && !enrolled ? `<button class="btn plain sm" type="button" id="wish" aria-pressed="${wished}">${icon("heart", wished ? 'style="color:var(--live);fill:var(--live)"' : "")}${wished ? "Saved" : "Save to wishlist"}</button>` : ""}${enrolled ? "" : `<a class="btn plain sm" href="learn.html#${c.id}/0-0">${fi("play_circle", 'width="16" height="16"')}Preview first lesson</a>`}<button class="btn plain sm" type="button" id="share">${icon("share")}Share</button></div>
          </div>
          ${!enrolled && c.mrp && SR.offerDaysLeft() ? `<p class="hurry">${SR.offerDaysLeft() === 1 ? "Hurry Up! Last day at this price" : `Hurry Up! ${SR.offerDaysLeft()} Days left at this price`}</p>` : `<div style="height:10px"></div>`}
        </div>
        <h3>Modules</h3>
        <div class="pmods">${c.modules.map((m, mi) => `<details ${enrolled && prog && mi === Math.min(c.modules.length - 1, Math.floor(prog.doneCount / Math.max(1, m.lessons.length))) ? "open" : ""}>
          <summary>Module ${mi + 1}: ${esc(m.title)}${enrolled ? fi("keyboard_arrow_down", 'class="chev"') : fi("lock")}</summary>
          <ul>${m.lessons.map((l, li) => { const key = mi + "-" + li, done = prog && prog.done.includes(key), open = enrolled || (mi === 0 && li === 0);
            return `<li class="${done ? "done" : ""}">${open ? `<a href="learn.html#${c.id}/${enrolled ? key : "0-0"}">${esc(l[0])}</a>` : `<span>${esc(l[0])}</span>`}<span class="d">${done ? "✓" : open ? esc(l[2]) : ""}</span></li>`; }).join("")}</ul>
        </details>`).join("")}</div>
      </aside>
    </div>
    <section class="in" style="display:block;margin-top:72px">
      <h2 style="font-size:clamp(22px,1.62vw,28px);font-weight:600;color:#202020;margin-bottom:24px">You might also like</h2>
      <div class="grid-3" style="gap:24px">${related.map(SR.courseCard).join("")}</div>
    </section>`;

    const w = $("#wish"); if (w) w.addEventListener("click", () => { const on = SR.toggleWish(c.id); SR.toast(on ? "Saved to your wishlist" : "Removed from wishlist"); const y = scrollY; render(); scrollTo(0, y); });
    const rf = $("#review-form");
    if (rf) rf.addEventListener("submit", e => {
      e.preventDefault();
      const r = rf.querySelector('input[name="rs"]:checked'), text = $("#rv-text").value.trim();
      if (!r) { SR.toast("Choose a star rating"); return; }
      if (text.length < 10) { SR.fieldError($("#rv-text"), "Write at least a sentence."); return; }
      // → Replace with POST /api/courses/:id/reviews
      const all = SR.store.get("reviews", {}) || {}; all[c.id] = [...(all[c.id] || []), { name: user.firstName + " " + (user.lastName || "").charAt(0) + ".", email: user.email, rating: +r.value, text, at: Date.now(), status: "published" }];
      SR.store.set("reviews", all); SR.toast("Thanks! Your review is live."); const y = scrollY; render(); scrollTo(0, y);
    });
    $("#share").addEventListener("click", () => {
      const url = location.href;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => SR.toast("Course link copied"), () => SR.toast("Copy this link: " + url));
    });
  }
  addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
  render();
})();
