/* Careers — perks, open roles with team filter, application modal */
(function () {
  const { $, icon, esc } = SR;
  $("#perks").innerHTML = [
    ["heart", "Health cover", "For you, your partner, kids and parents."],
    ["book", "Free learning", "Every SkillRadius program, plus a ₹50,000 yearly learning budget."],
    ["home", "Hybrid work", "3 days in our Bengaluru office, 2 from anywhere."],
    ["trend", "ESOPs", "Every full-time teammate owns a part of SkillRadius."]
  ].map(([i, t, d], n) => `<div class="cr-perk" style="--i:${n}"><span class="ic">${icon(i)}</span><h3>${t}</h3><p>${d}</p></div>`).join("");

  let team = "All";
  const teams = ["All", ...new Set(SR.jobs.map(j => j.team))];
  function render() {
    $("#teams").innerHTML = teams.map(t => `<button type="button" class="bl-cat" aria-pressed="${t === team}" data-team="${esc(t)}">${esc(t)}<span>${t === "All" ? SR.jobs.length : SR.jobs.filter(j => j.team === t).length}</span></button>`).join("");
    $("#jobs").innerHTML = SR.jobs.filter(j => team === "All" || j.team === team).map(j => `
      <article class="job"><span class="jic">${esc(j.team.slice(0, 2))}</span><div><span class="jt">${esc(j.team)}</span><h3>${esc(j.title)}</h3><p>${esc(j.desc)}</p>
        <div class="meta"><span>${icon("pin")}${esc(j.location)}</span><span>${icon("clock")}${esc(j.type)}</span><span>${icon("award")}${esc(j.exp)}</span></div></div>
        <button class="btn" type="button" data-apply="${j.id}">Apply ${icon("arrow")}</button></article>`).join("");
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-team]"); if (t) { team = t.dataset.team; render(); return; }
    const a = e.target.closest("[data-apply]"); if (!a) return;
    const j = SR.jobs.find(x => x.id === a.dataset.apply) || { title: "General application", reqs: [] };
    const m = SR.modal(`<h2>${esc(j.title)}</h2>${j.reqs.length ? `<ul class="check-list small">${j.reqs.map(r => `<li>${icon("check")}${esc(r)}</li>`).join("")}</ul>` : ""}
      <form class="stack" data-lead="job" id="job-form">
        <div class="field"><label for="j-name">Full name <span class="req">*</span></label><input id="j-name" name="name" data-req autocomplete="name"></div>
        <div class="field"><label for="j-email">Email <span class="req">*</span></label><input id="j-email" name="email" type="email" data-req data-kind="email" autocomplete="email"></div>
        <div class="field"><label for="j-phone">Phone <span class="req">*</span></label><input id="j-phone" name="phone" data-req data-kind="phone" inputmode="numeric" autocomplete="tel"></div>
        <div class="field"><label for="j-link">LinkedIn or portfolio</label><input id="j-link" name="link" data-kind="url" placeholder="https://"></div>
        <div class="field"><label for="j-cv">Resume (PDF or Word) <span class="req">*</span></label><input id="j-cv" name="resume" type="file" accept=".pdf,.doc,.docx" data-req data-msg="Attach your resume."></div>
        <div class="btn-row"><button class="btn plain" type="button" data-close>Cancel</button><button class="btn" type="submit">Send application</button></div>
      </form>`, null, { wide: true });
    SR.leadForm(m.el.querySelector("#job-form"), { type: "job", extra: { role: j.title }, title: "Application sent", message: "Our hiring team reviews every application within a week." });
  });
  render();
})();
