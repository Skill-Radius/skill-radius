/* Assignment submission — assignment.html#<training-id>
   Learners submit a link and/or file; trainers grade it in trainer.html
   and the score and feedback show up here. */
(function () {
  if (!SR.auth.require()) return;
  const { $, esc, icon } = SR;
  const t = SR.training(SR.hashId());
  if (!t || !SR.isEnrolled("trainings", t.id)) { location.replace("dashboard.html#trainings"); return; }
  const tr = SR.trainer(t.trainer);
  const all = () => SR.store.get("submissions", {}) || {};
  const mine = () => all()[t.id] || [];
  const due = t.assignment ? new Date(new Date().setHours(23, 59, 0, 0) + t.assignment.dueInDays * 864e5) : null;
  const when = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  function render() {
    const current = t.assignment ? mine().find(s => s.title === t.assignment.title) : null;
    const past = mine().filter(s => !t.assignment || s.title !== t.assignment.title);
    $("#main").innerHTML = `
    <div class="wrap" style="max-width:960px">
      <ol class="crumbs"><li><a href="dashboard.html#trainings">My Trainings</a></li><li>${esc(t.title)}</li><li>Assignments</li></ol>
      ${t.assignment ? `
      <div class="grid-2 assign-grid" style="align-items:start">
        <section class="card stack">
          <div class="row" style="justify-content:space-between"><span class="pill violet">${esc(t.batch)}</span>${current ? (current.score != null ? `<span class="pill green">Reviewed · ${current.score}/${current.max}</span>` : `<span class="pill blue">Submitted</span>`) : `<span class="pill amber">Due ${SR.fmtDate(due, { weekday: "short", day: "numeric", month: "short" })}, 11:59 pm</span>`}</div>
          <h1 style="font-size:26px;font-weight:600">${esc(t.assignment.title)}</h1>
          <p class="muted">Set by <b style="color:var(--ink)">${esc(tr.name)}</b> for ${esc(t.title)}.</p>
          <h2 style="font-size:17px;font-weight:600;margin-top:6px">What to build</h2>
          <p>Use what we covered in the last two sessions to build <b>${esc(t.assignment.title.toLowerCase())}</b>. Keep it small and working: it's better to finish a simple version than to half-finish a big one.</p>
          <ul class="check-list small">${["Push your code to a public GitHub repository", "Add a README with setup steps and a screenshot", "Write 3–5 lines on what you'd improve with more time"].map(x => `<li>${icon("check")}${x}</li>`).join("")}</ul>
          <h2 style="font-size:17px;font-weight:600;margin-top:6px">How it's graded (10 points)</h2>
          <div class="table-wrap"><table class="tbl"><tbody>
            ${[["Works as described", 4], ["Code is clean and readable", 3], ["README and setup steps", 2], ["Reflection", 1]].map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right;font-weight:600">${v}</td></tr>`).join("")}
          </tbody></table></div>
        </section>
        <section class="card stack">
          ${current && current.score != null ? `
            <h2 style="font-size:19px;font-weight:600">Feedback from ${esc(current.reviewedBy)}</h2>
            <div style="display:flex;align-items:baseline;gap:8px"><b style="font-size:40px;color:var(--success-ink)">${current.score}</b><span class="muted">/ ${current.max}</span></div>
            <p>${esc(current.feedback)}</p><p class="tiny muted">Reviewed ${when(current.reviewedAt)}</p>`
          : `
            <h2 style="font-size:19px;font-weight:600">${current ? "Your submission" : "Submit your work"}</h2>
            ${current ? `<div class="alert ok">${icon("check")}<span>Submitted ${when(current.at)}. You can resubmit until the due date.</span></div>` : ""}
            <form class="stack" id="form" novalidate>
              <div class="field"><label for="a-link">Repository or project link <span class="req">*</span></label><input id="a-link" placeholder="https://github.com/you/project" value="${esc(current ? current.link : "")}"></div>
              <div class="field"><label for="a-file">Attach a file <span class="tiny muted">(optional · zip or PDF, max 20 MB)</span></label><input id="a-file" type="file" accept=".zip,.pdf,.png,.jpg">${current && current.file ? `<span class="hint">Current file: ${esc(current.file)}</span>` : ""}</div>
              <div class="field"><label for="a-notes">Notes for your trainer</label><textarea id="a-notes" style="min-height:100px" placeholder="What you'd improve, or anything you got stuck on">${esc(current ? current.notes : "")}</textarea></div>
              <label class="checkbox"><input type="checkbox" id="a-own"><span>This is my own work.</span></label>
              <button class="btn" type="submit" style="justify-self:start">${current ? "Resubmit" : "Submit assignment"}</button>
            </form>`}
        </section>
      </div>` : `<div class="empty">${icon("notes")}<h3>No open assignments</h3><p>Your trainer hasn't set an assignment for this batch yet.</p></div>`}
      ${past.length ? `<section class="card" style="margin-top:20px"><h2 style="font-size:19px;font-weight:600;margin-bottom:12px">Previous assignments</h2><div class="table-wrap"><table class="tbl"><thead><tr><th>Assignment</th><th>Submitted</th><th>Score</th><th>Feedback</th></tr></thead><tbody>${past.map(s => `<tr><td><b>${esc(s.title)}</b></td><td>${SR.fmtDate(s.at, { day: "numeric", month: "short" })}</td><td>${s.score != null ? `<span class="pill green">${s.score}/${s.max}</span>` : `<span class="pill blue">In review</span>`}</td><td class="small muted" style="min-width:220px">${esc(s.feedback || "Waiting for review")}</td></tr>`).join("")}</tbody></table></div></section>` : ""}
    </div>`;
    const f = $("#form");
    if (f) f.addEventListener("submit", e => {
      e.preventDefault();
      const link = $("#a-link").value.trim();
      const okLink = /^https?:\/\/\S+\.\S+/.test(link);
      SR.fieldError($("#a-link"), okLink ? "" : "Add a full link starting with https://");
      const own = $("#a-own").checked; $("#a-own").closest("label").style.color = own ? "" : "var(--danger)";
      if (!okLink || !own) return;
      const file = $("#a-file").files[0];
      if (file && file.size > 20 * 1024 * 1024) { SR.fieldError($("#a-file"), "Files must be 20 MB or smaller."); return; }
      // → Replace with POST /api/trainings/:id/submissions (upload the file to storage)
      const store = all(), list = store[t.id] || [];
      const entry = { title: t.assignment.title, link, file: file ? file.name : (list.find(s => s.title === t.assignment.title) || {}).file || "", notes: $("#a-notes").value.trim(), at: Date.now(), learner: SR.auth.user().email, name: SR.auth.user().firstName + " " + (SR.auth.user().lastName || "") };
      store[t.id] = [...list.filter(s => s.title !== t.assignment.title), entry];
      SR.store.set("submissions", store);
      render(); SR.toast("Assignment submitted. Your trainer will review it within 3 days.");
    });
  }
  render();
  addEventListener("hashchange", () => location.reload());
})();
