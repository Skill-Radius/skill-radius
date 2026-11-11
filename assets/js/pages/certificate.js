/* Certificate — certificate.html#<CERT-ID>
   Renders the learner's own certificates, plus any public record in the
   registry (so a shared link works for employers too). */
(function () {
  const { $, esc, icon, fmtDate } = SR;
  const id = SR.hashId().toUpperCase();
  const user = SR.auth.user();
  const mine = user ? (SR.store.get("certificates", []) || []).find(c => c.id === id) : null;
  const reg = SR.registry[id];
  if (!mine && !reg) {
    $("#main").innerHTML = `<div class="wrap narrow"><div class="empty" style="margin-top:40px">${icon("file")}<h3>Certificate not found</h3><p>We couldn't find a certificate with the ID “${esc(id)}”.</p><div class="btn-row"><a class="btn" href="verify.html">Verify another ID</a>${user ? `<a class="btn ghost" href="dashboard.html#certificates">My certificates</a>` : ""}</div></div></div>`;
    return;
  }

  const prog = mine && mine.kind === "Certification" ? SR.cert(mine.ref) : null;
  const course = mine && mine.kind === "Course" ? SR.course(mine.ref) : null;
  const d = mine ? {
    name: `${user.firstName} ${user.lastName || ""}`.trim(),
    program: mine.title, level: prog ? `${prog.level} (${prog.code})` : "Course Completion",
    issued: mine.issued, score: mine.score,
    duration: prog ? `${prog.months} Months Program` : course ? `${course.hours} hours · ${course.modules.length} modules` : "",
    skills: prog ? prog.skills : course ? course.outcomes.slice(0, 4).map(o => o.split(" ").slice(0, 3).join(" ")) : [],
    valid: mine.validYears ? new Date(new Date(mine.issued).setFullYear(new Date(mine.issued).getFullYear() + mine.validYears)) : null,
    kind: mine.kind
  } : {
    name: reg.name, program: reg.program, level: reg.code ? `Course Completion (${reg.code})` : "", issued: reg.issued, score: reg.score,
    duration: "", skills: [], valid: reg.valid, kind: "Certificate"
  };
  const fresh = mine && Date.now() - mine.issued < 2 * 864e5;
  document.title = `${d.program} · Certificate · SkillRadius`;

  $("#main").innerHTML = `
  <div class="wrap" style="max-width:1000px">
    ${user && mine ? `<ol class="crumbs"><li><a href="dashboard.html">My Learning</a></li><li><a href="dashboard.html#certificates">Certificates</a></li><li>${esc(id)}</li></ol>` : ""}
    ${fresh ? `<div class="center congrats" style="margin-bottom:22px"><h1 style="font-size:clamp(22px,3vw,28px);font-weight:600">🎉 Congratulations! Your Certificate is Ready</h1><p class="muted" style="margin-top:6px">You have successfully ${prog ? `passed the ${esc(prog.title)} exam with ${esc(d.score.split(" ")[0])} score` : `completed ${esc(d.program)}`}.</p></div>` : ""}

    <div class="cert-sheet" id="sheet" role="img" aria-label="Certificate for ${esc(d.name)}, ${esc(d.program)}">
      <svg class="corner bl" viewBox="0 0 100 100" aria-hidden="true"><path d="M0 100V20a80 80 0 0 1 80 80z" fill="url(#g-b)" opacity=".85"/><path d="M0 100V55l45 45z" fill="url(#g-a)"/></svg>
      <svg class="corner tr" viewBox="0 0 100 100" aria-hidden="true"><path d="M0 100V20a80 80 0 0 1 80 80z" fill="url(#g-b)" opacity=".85"/><path d="M0 100V55l45 45z" fill="url(#g-a)"/></svg>
      <div class="frame"></div>
      <div class="inner">
        <div class="top"><span class="brand">${SR.logo()}<span>SkillRadius</span></span><span class="id">Certificate ID: ${esc(id)}</span></div>
        <div class="certify">This is to certify that</div>
        <div class="mid">
          <div class="name">${esc(d.name)}</div>
          <div class="line">has successfully completed the ${d.kind === "Certification" ? "program" : "course"} in</div>
          <div class="program">${esc(d.program)}</div>
          ${d.level ? `<div class="lvl">${esc(d.level)}</div>` : ""}
          <div class="facts3">
            <div><span>Completion Date</span><b>${fmtDate(d.issued, { day: "numeric", month: "long", year: "numeric" })}</b></div>
            ${d.duration ? `<div><span>Duration</span><b>${esc(d.duration)}</b></div>` : ""}
            <div><span>Score Achieved</span><b>${esc(d.score)}</b></div>
            ${d.valid ? `<div><span>Valid Until</span><b>${fmtDate(d.valid, { day: "numeric", month: "short", year: "numeric" })}</b></div>` : ""}
          </div>
          ${d.skills.length ? `<div class="chips">${d.skills.map(s => `<span>${esc(s)}</span>`).join("")}</div>` : ""}
        </div>
        <div class="sigs">
          <div class="sig" style="text-align:left"><span class="s">Rahul Sharma</span><b>Dr. Rahul Sharma</b>Director, SkillRadius Academy</div>
          <svg class="seal" viewBox="0 0 100 100" aria-hidden="true"><path d="M40 0l8 14 12-12 2 18 18-6-6 18 18 2-12 12 14 8-14 8 12 12-18 2 6 18-18-6-2 18-12-12-8 14-8-14-12 12-2-18-18 6 6-18-18-2 12-12-14-8 14-8z" transform="translate(10 0) scale(.9)" fill="url(#g-b)"/><circle cx="50" cy="50" r="22" fill="#fff" opacity=".9"/><path d="M40 51l7 7 13-15" stroke="#3c59c8" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <div class="sig" style="text-align:right"><span class="s">Priya Singh</span><b>Priya Singh</b>Head of Certification Board</div>
        </div>
      </div>
      <div class="foot"><span>Verify this certificate at skillradius.in/verify</span><span>Issued by SkillRadius Institute of Technology</span></div>
    </div>

    <div class="cert-actions no-print">
      <button class="btn" id="pdf">${icon("download")}Download PDF</button>
      <a class="btn ghost" target="_blank" rel="noopener" href="https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(d.program)}&organizationName=SkillRadius&certId=${encodeURIComponent(id)}">${icon("share")}Share to LinkedIn</a>
      <a class="btn ghost" href="verify.html#${encodeURIComponent(id)}">${icon("search")}Verify Certificate</a>
      <button class="btn plain" id="copy">${icon("copy")}Copy link</button>
      ${user ? `<a class="btn plain" href="dashboard.html#certificates">${icon("arrowl")}Back to Hub</a>` : ""}
    </div>
    <p class="tiny muted center no-print" style="margin-top:14px">Your certificate is permanently stored in your SkillRadius account and can be verified at skillradius.in/verify.</p>
  </div>`;

  $("#pdf").addEventListener("click", () => {
    // Opens the browser's print dialog; choose "Save as PDF". The print CSS prints only the certificate.
    try { window.print(); } catch { }
    setTimeout(() => SR.toast("Choose “Save as PDF” in the print dialog to download"), 300);
  });
  $("#copy").addEventListener("click", () => (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => SR.toast("Certificate link copied"), () => SR.toast("Copy this link: " + location.href)));
})();
addEventListener("hashchange", () => location.reload());
