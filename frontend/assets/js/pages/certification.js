/* Certification detail — certification.html#<cert-id>
   Follows the Figma "Course Page" frame: hero + stat bar, course preview, what you'll get,
   career benefits, certificate banner, about the domain, curriculum.
   Enrolled learners see "Enrolled" with Take Test / View Notes (Figma "post Enrollment"). */
(function () {
  const { $, $$, esc, icon, inr, pct } = SR;
  const fi = (n, a = "") => SR.ficon(n, a);

  // Banner shapes measured in the Figma "CertBanner" (x in px of a 1728 frame, y relative to the banner)
  const SHAPES = [[-51, -54, 280, 280, "50%", "from 135deg, #fff, #728aff 80%, #4e6cff"], [-51, 126, 93, 211], [-51, 33, 185, 186, "50%"], [298, 17, 138, 142],
    [1527, -146, 138, 442], [1476, -44, 140, 140, "50%"], [1596, 75, 213, 484], [1689, 104, 233, 233, "50%", "from 135deg, #4e6cff, #728aff 20%, #fff"]];
  const shapes = () => SHAPES.map(([x, y, w, h, r = "0", g]) => `<span class="sh" aria-hidden="true" style="left:${(x / 17.28).toFixed(2)}%;top:${y}px;width:${w}px;height:${h}px;border-radius:${r};${g ? `background:conic-gradient(${g})` : ""}"></span>`).join("");
  // "The X Industry Professional is a premium…" or "… helps you validate…" depending on how the summary starts
  const descOf = (c, suffix = "") => /^(A|An) /.test(c.summary) ? `The ${c.title} ${c.level}${suffix} is ${c.summary.charAt(0).toLowerCase() + c.summary.slice(1)}` : c.summary;
  const LESSONS = ["Concepts & walkthrough video", "Hands-on exercise", "Module notes", "Module quiz"];

  function render() {
    const c = SR.cert(SR.hashId());
    if (!c) { location.replace(location.hash.length > 1 ? "404.html" : "certifications.html"); return; }
    document.title = c.title + " · SkillRadius";
    const enrolled = SR.isEnrolled("certs", c.id);
    const done = Math.min((SR.store.get("certprog", {}) || {})[c.id] || 0, c.modules.length);
    const ready = done >= c.modules.length;
    const certificate = (SR.store.get("certificates", []) || []).find(x => x.ref === c.id);
    const attempts = ((SR.store.get("attempts", {}) || {})[c.id]) || [];
    const passed = attempts.some(a => SR.examPassed(c, a));
    const mock = (SR.store.get("mocks", {}) || {})[c.id];
    const area = c.title.replace(/^Certified (Advanced )?/, "");
    const short = area.replace(/ Development$| Design$/, (m) => m);

    const cta = enrolled
      ? `<div class="cd-enrolled"><b>Enrolled ${fi("check")}</b><span class="cd-note" style="margin:0">Certificate valid for ${c.validity} years from completion date${ready ? "" : ` · ${done}/${c.modules.length} modules complete`}</span></div>
         <div class="cd-btns">
           ${ready ? `<a class="btn" href="exam-rules.html#${c.id}">Take Test ${icon("arrow")}</a>`
             : `<a class="btn" href="cert-notes.html#${c.id}/${done}" data-lock="1">Take Test ${icon("arrow")}</a>`}
           <a class="btn ghost" href="cert-notes.html#${c.id}/${Math.min(done, c.modules.length - 1)}">View Notes ${fi("arrow_outward", 'style="width:16px;height:16px"')}</a>
           ${certificate ? `<a class="btn green" href="certificate.html#${certificate.id}" style="width:auto;padding:0 26px">View Your Certificate ${icon("arrow")}</a>` : ""}
         </div>`
      : `<div class="cd-price"><s>${inr(c.mrp)}</s><b>${inr(c.price)}</b><span class="cd-pill">${c.validity} Years Validity</span></div>
         <p class="cd-note">Certificate valid for ${c.validity} years from completion date</p>
         <div class="cd-btns"><a class="btn" href="checkout.html#cert/${c.id}">Enroll Now ${icon("arrow")}</a><button class="btn ghost" type="button" id="to-syllabus">View Syllabus ${icon("arrow", 'style="transform:rotate(90deg)"')}</button></div>`;

    $("#main").innerHTML = `
    <section class="cd-hero">
      <div class="in">
        <div class="txt">
          <nav class="cd-crumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span>/</span><a href="certifications.html">Certifications</a><span>/</span>${esc(short)}</nav>
          <span class="cd-eyebrow">Certification</span>
          <h1>${esc(c.title)}</h1>
          <p class="lvl">${esc(c.level)}  (${esc(c.code)})</p>
          <p class="desc">${esc(descOf(c))}</p>
          ${cta}
          <p class="cd-badges">ISO CERTIFIED  ·  MSME REGISTERED  ·  GDPR COMPLIANT  ·  AI-PROCTORED</p>
        </div>
        <div class="cd-img"><img src="${c.img}" alt=""></div>
      </div>
    </section>
    <div class="cd-stats"><div class="in">
      <div><b>${c.enrolled.toLocaleString("en-IN")}</b><span>Students Enrolled</span></div><div><b>${c.rating} ★</b><span>Average Rating</span></div><div><b>${c.months}</b><span>Months Program</span></div><div><b>${c.passRate}%</b><span>Pass Rate</span></div>
    </div></div>

    ${enrolled ? `<section class="cd-hub"><div class="in">
      <div class="hub-card">
        <div class="hh"><h2>Your study modules</h2><span class="cd-pill ${ready ? "ok" : ""}">${done}/${c.modules.length} complete</span></div>
        <div class="bar" style="margin:12px 0 16px"><span style="width:${pct(done, c.modules.length)}%"></span></div>
        <ol class="hub-mods">${c.modules.map((m, i) => `<li class="${i < done ? "done" : i === done ? "cur" : ""}"><span class="n">${i < done ? fi("check") : i + 1}</span><a href="cert-notes.html#${c.id}/${i}/0">${esc(m)}</a><span class="st">${i < done ? "Done" : i === done ? "Continue →" : fi("lock")}</span></li>`).join("")}</ol>
      </div>
      <div class="hub-card">
        <div class="hh"><h2>Proctored exam</h2><span class="cd-pill ${passed ? "ok" : ""}">${passed ? "Passed" : ready ? "Unlocked" : "Locked"}</span></div>
        <div class="exam4"><div><b>${c.exam.questions}</b><span>Questions</span></div><div><b>${c.exam.minutes} min</b><span>Duration</span></div><div><b>${SR.passMark(c)}</b><span>Pass score</span></div><div><b>${c.exam.retakeDays ? c.exam.retakeDays + " days" : "∞"}</b><span>${c.exam.retakeDays ? "Retake wait" : "Attempts"}</span></div></div>
        ${attempts.length ? `<table class="att"><thead><tr><th>Attempt</th><th>Date</th><th>Score</th><th>Result</th></tr></thead><tbody>${attempts.map((a, i) => { const p = SR.examScore(c, a), ok = SR.examPassed(c, a); return `<tr><td>#${i + 1}</td><td>${SR.fmtDate(a.date, { day: "numeric", month: "short" })}</td><td>${a.score}/${a.total}</td><td><span class="pill ${ok ? "green" : "red"}">${ok ? "Passed" : "Failed"} · ${p}</span></td></tr>`; }).join("")}</tbody></table>`
          : `<p class="small muted">${ready ? "You've finished every module. Read the rules, then start when you're ready." : `Finish all ${c.modules.length} modules in the notes to unlock the exam.`}</p>`}
        <div class="cd-btns" style="margin-top:6px">
          ${ready ? `<a class="btn" href="exam-rules.html#${c.id}">${attempts.length ? "Retake test" : "Take Test"} ${icon("arrow")}</a>` : `<a class="btn" href="cert-notes.html#${c.id}/${done}/0">Continue module ${icon("arrow")}</a>`}
          <a class="btn ghost" href="mock-test.html#${c.id}">${c.exam.bank ? "Practice exam" : "Mock test"}${mock != null ? ` · best ${mock}%` : ""}</a>
        </div>
      </div>
    </div></section>` : ""}

    <section class="cd-sec cd-prev"><div class="in">
      <span class="k">Course Preview</span>
      <h2>Get a glimpse of what you'll learn in this certification program.</h2>
      <div class="cd-video"><img src="${c.img}" alt="">
        <div class="t"><small>SkillRadius</small><h3>Industrial Certification in ${esc(area)} for Real-World Applications</h3><p>This comprehensive certification program equips you with advanced ${esc(c.skills[0])} skills.</p></div>
        <button type="button" aria-label="Play the preview video" data-video data-v-title="${esc(c.title)}" data-v-sub="Course preview · Industrial Certification in ${esc(area)}" data-v-poster="${c.img}" data-v-mins="3" data-v-src="${esc(c.video || "")}">${fi("play_circle")}</button>
      </div>
    </div></section>

    <section class="cd-sec cd-get"><div class="in">
      <h2>What You'll Get</h2><p class="sub">Everything you need to succeed in your certification journey.</p>
      <div class="tick3">${SR.certWhatYouGet.map(x => `<div><i>${fi("check")}</i>${esc(x.replace("{v}", c.validity))}</div>`).join("")}</div>
    </div></section>

    <section class="cd-sec cd-ben"><div class="in">
      <h2>How It Benefits Your Career</h2><p class="sub">Unlock new opportunities and accelerate your professional growth.</p>
      <div class="ben2">${SR.certBenefits.map(([ic, t]) => `<div><i>${fi(ic)}</i>${esc(t)}</div>`).join("")}</div>
    </div></section>

    <section class="cd-banner">
      ${shapes()}
      <div class="c">
        <div class="trophy" aria-hidden="true">${fi("rewarded_ads")}</div>
        <h2>${c.validity}-Year Valid Certificate</h2>
        <p>Your certification is valid for ${c.validity} years from the date of completion. Each certificate comes with a unique ID for easy verification.</p>
        <div class="chips">
          <div><b>${fi("local_police")}Secure Verification</b><span>Unique ID for instant verification</span></div>
          <div><b>${fi("captive_portal")}Globally Recognised</b><span>Accepted by employers worldwide</span></div>
          <div><b>${fi("cards_stack")}Digital &amp; Print</b><span>Digital and printable formats</span></div>
        </div>
      </div>
    </section>

    <section class="cd-about"><div class="in">
      <div>
        <h2>About the Domain</h2>
        <p class="lv">${esc(c.title)} ${esc(c.level)} (${esc(c.code)})</p>
        <p class="p">${esc(descOf(c, " certification"))} This certification validates advanced expertise in ${esc(c.skills.slice(0, -1).join(", "))} and ${esc(c.skills[c.skills.length - 1])}.</p>
        <p class="p" id="more-text" hidden>You'll study ${c.modules.length} modules over ${c.months} months at your own pace, practise with module quizzes and mock tests, then sit a ${c.exam.minutes}-minute proctored exam. Score ${c.exam.scaled ? c.exam.scaled.pass + " out of " + c.exam.scaled.max : c.exam.pass + "%"} or more to earn a certificate with a unique ID that employers can verify online.</p>
        <button class="more" type="button" id="read-more" aria-expanded="false" aria-controls="more-text">Read More →</button>
        <ul>
          <li>High demand for certified professionals in the industry</li>
          <li>Rapidly growing field with excellent career prospects</li>
          <li>Competitive salaries for skilled professionals</li>
          <li>Global recognition and career opportunities</li>
          <li>Essential skills for modern technology landscape</li>
        </ul>
      </div>
      <aside class="ind">
        <h3>Industry Benefits</h3>
        ${fi("business_center")}
        <div class="g">
          <div><b>Skill Validation</b><span>Validates professional expertise in domain</span>${fi("verified")}</div>
          <div><b>Career Growth</b><span>Opens new professional opportunities</span>${fi("show_chart")}</div>
          <div><b>Global Recognition</b><span>Recognised across the industry</span>${fi("captive_portal")}</div>
          <div><b>Industry Trust</b><span>Trusted by leading employers</span>${fi("security")}</div>
        </div>
      </aside>
    </div></section>

    <section class="cd-sec cd-learn" id="syllabus"><div class="in">
      <h2>What You'll Learn</h2><p class="sub">Explore the comprehensive curriculum designed to transform your skills and advance your career.</p>
      <div class="tiles"><div><b>${c.modules.length}</b><span>Learning Modules</span></div><div><b>${c.modules.length * 4}</b><span>Total Lessons</span></div><div><b>3</b><span>Content Types</span></div></div>
      <div class="mods">${c.modules.map((m, i) => `<details><summary>MODULE ${i + 1}:  ${esc(m)}${fi("keyboard_arrow_down")}</summary>
        <div class="body"><ul>${LESSONS.map((l, j) => `<li>${fi(j === 3 ? "quiz" : j === 2 ? "description" : j === 1 ? "edit" : "play_circle")}Lesson ${i + 1}.${j + 1} · ${esc(l)}</li>`).join("")}</ul></div></details>`).join("")}</div>
    </div></section>

    <section class="cd-sec cd-extra"><div class="in">
      <div class="ex-card"><h3>Exam format</h3><div class="exam4"><div><b>${c.exam.questions}</b><span>${c.exam.pro ? "Scenario-based questions" : "Multiple-choice questions"}</span></div><div><b>${c.exam.minutes} min</b><span>Time limit</span></div><div><b>${SR.passMark(c)}</b><span>Score to pass</span></div><div><b>${c.exam.retakeDays ? c.exam.retakeDays + "d" : "∞"}</b><span>${c.exam.retakeDays ? "Wait between attempts" : "Free retakes"}</span></div></div></div>
      <div class="ex-card"><h3>Skills you'll prove</h3><div class="skills">${c.skills.map(x => `<span class="cd-pill">${esc(x)}</span>`).join("")}</div>
        <h3 style="margin-top:22px">Who it's for</h3><p class="small muted">Working professionals and final-year students who want employers to see proof of ${esc(c.skills.slice(0, 2).join(" and "))} skills.</p></div>
    </div></section>

    <section class="cd-sec cd-faq"><div class="in" style="max-width:900px">
      <h2>Frequently asked questions</h2>
      <div class="acc faq" style="margin-top:24px;text-align:left">${SR.faqHTML([
        ["Who is this certification for?", `Professionals and final-year students who want to prove ${c.skills.slice(0, 3).join(", ")} skills to employers.`],
        ["How long do I have to finish?", `You get ${c.months} months of access to the study material and can sit the exam any time in that window.`],
        ["What happens if I fail the exam?", "You can retake it as many times as you need at no extra cost. Your best score is the one that appears on your certificate."],
        ["How do employers verify my certificate?", "Every certificate has a unique ID. Employers enter it on our Verify page to see your name, program, score and validity."],
        ["Can I get a refund?", "Yes, within 30 days of purchase if you've completed less than 30% of the material and haven't attempted the exam."]
      ])}</div>
    </div></section>

    ${enrolled ? "" : `<section class="s-cta cd-cta">
      <img class="arc" src="assets/img/deco/cta-arc.svg" alt="" aria-hidden="true">
      <div class="in"><h2>Ready to get <span class="hl">certified?</span></h2><p>${inr(c.price)} · ${c.months} months access · ${c.exam.retakeDays ? "Retake after " + c.exam.retakeDays + " days" : "Unlimited exam attempts"}</p>
      <div class="cta-btns"><a class="btn" href="checkout.html#cert/${c.id}">Enroll Now</a><a class="btn ghost" href="certifications.html">Compare certifications</a></div></div>
    </section>`}`;

    const ts = $("#to-syllabus"); if (ts) ts.addEventListener("click", () => { $("#syllabus").scrollIntoView({ behavior: "smooth" }); });
    const rm = $("#read-more"); rm.addEventListener("click", () => { const t = $("#more-text"), open = t.hidden; t.hidden = !open; rm.textContent = open ? "Read Less ←" : "Read More →"; rm.setAttribute("aria-expanded", String(open)); });
    const lock = $("[data-lock]"); if (lock) lock.addEventListener("click", () => SR.toast(`Finish all ${c.modules.length} modules in the notes to unlock the test. You're on module ${done + 1}.`));
  }
  addEventListener("hashchange", () => { render(); scrollTo(0, 0); });
  render();
})();
