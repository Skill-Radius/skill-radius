/* Support tickets — support.html (list + new) and support.html#<ticket-id> (thread)
   Replies from the admin panel appear in the thread. */
(function () {
  if (!SR.auth.require()) return;
  const { $, esc, icon } = SR;
  const user = SR.auth.user();
  const mine = () => SR.tickets().filter(t => t.email === user.email);
  const statusPill = (s) => `<span class="status ${s === "Open" ? "open" : s === "Answered" ? "answered" : "closed"}">${s}</span>`;
  const when = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  function list() {
    const ts = mine().sort((a, b) => b.updated - a.updated);
    const orders = SR.orders();
    $("#main").innerHTML = `
    <div class="wrap" style="max-width:1000px">
      <div class="view-head results-bar"><div><h1 style="font-size:28px;font-weight:600">Support</h1><p class="muted">We reply within one working day. Most questions are answered in the <a class="link" href="help.html">Help center</a>.</p></div></div>
      <div class="grid-2" style="align-items:start;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr)">
        <section class="card stack">
          <h2 style="font-size:19px;font-weight:600">Your tickets</h2>
          ${ts.length ? `<div class="stack" style="gap:10px">${ts.map(t => `<a class="card" href="#${t.id}" style="text-decoration:none;padding:14px 16px;display:grid;gap:4px"><span class="row" style="justify-content:space-between"><b>${esc(t.subject)}</b>${statusPill(t.status)}</span><span class="small muted">${t.id} · ${esc(t.topic)} · updated ${when(t.updated)}</span></a>`).join("")}</div>`
            : `<div class="empty" style="padding:28px 16px">${icon("help")}<h3>No tickets yet</h3><p class="small">When you raise a ticket, you can follow the conversation here.</p></div>`}
        </section>
        <form class="card stack" id="new" novalidate>
          <h2 style="font-size:19px;font-weight:600">Raise a ticket</h2>
          <div class="field"><label for="t-topic">Topic <span class="req">*</span></label><select id="t-topic"><option value="">Choose a topic</option><option>Payment or invoice</option><option>Refund request</option><option>Course access</option><option>Live session or recording</option><option>Exam or certificate</option><option>Account</option><option>Something else</option><option>Grievance / complaint</option></select></div>
          <div class="field"><label for="t-order">Related order <span class="tiny muted">(optional)</span></label><select id="t-order"><option value="">None</option>${orders.slice().reverse().map(o => `<option value="${o.id}">${o.id} · ${esc(o.title.slice(0, 40))}</option>`).join("")}</select></div>
          <div class="field"><label for="t-subject">Subject <span class="req">*</span></label><input id="t-subject" placeholder="e.g. Invoice shows the wrong GSTIN"></div>
          <div class="field"><label for="t-msg">Describe the issue <span class="req">*</span></label><textarea id="t-msg" placeholder="What happened, and what did you expect?"></textarea></div>
          <div class="field"><label for="t-file">Screenshot <span class="tiny muted">(optional)</span></label><input id="t-file" type="file" accept="image/*,.pdf"></div>
          <button class="btn" type="submit" style="justify-self:start">Submit ticket</button>
        </form>
      </div>
    </div>`;
    const pre = SR.session.get("ticketPrefill");
    if (pre) { $("#t-topic").value = pre.topic || ""; $("#t-order").value = pre.order || ""; $("#t-subject").value = pre.subject || ""; SR.session.del("ticketPrefill"); $("#t-msg").focus(); }
    $("#new").addEventListener("submit", e => {
      e.preventDefault();
      const f = { topic: $("#t-topic").value, subject: $("#t-subject").value.trim(), msg: $("#t-msg").value.trim() };
      SR.fieldError($("#t-topic"), f.topic ? "" : "Choose a topic.");
      SR.fieldError($("#t-subject"), f.subject ? "" : "Add a short subject.");
      SR.fieldError($("#t-msg"), f.msg.length >= 10 ? "" : "Describe the issue in a sentence or two.");
      if (!f.topic || !f.subject || f.msg.length < 10) return;
      // → Replace with POST /api/tickets
      const all = SR.tickets(), now = Date.now();
      const t = { id: "TKT-" + (5200 + all.length + 1), email: user.email, name: user.firstName + " " + (user.lastName || ""), topic: f.topic, subject: f.subject, order: $("#t-order").value, status: "Open", created: now, updated: now, file: $("#t-file").files[0] ? $("#t-file").files[0].name : "",
        messages: [{ from: "learner", text: f.msg, at: now }] };
      all.push(t); SR.saveTickets(all);
      location.hash = t.id;
    });
  }

  function thread(id) {
    const t = mine().find(x => x.id === id);
    if (!t) { location.hash = ""; return; }
    $("#main").innerHTML = `
    <div class="wrap" style="max-width:820px">
      <a class="link" href="support.html" id="back">${icon("arrowl")}All tickets</a>
      <div class="card stack" style="margin-top:14px">
        <div class="row" style="justify-content:space-between"><div><h1 style="font-size:22px;font-weight:600">${esc(t.subject)}</h1><p class="small muted">${t.id} · ${esc(t.topic)}${t.order ? ` · <a class="link" href="invoice.html#${t.order}">${t.order}</a>` : ""} · opened ${when(t.created)}</p></div>${statusPill(t.status)}</div>
        <div class="thread">${t.messages.map(m => `<div class="msg ${m.from === "learner" ? "me" : "them"}">${m.from === "learner" ? "" : `<b style="display:block;font-size:13px">SkillRadius Support</b>`}${esc(m.text)}<small>${when(m.at)}</small></div>`).join("")}
          ${t.messages.length === 1 ? `<div class="msg them"><b style="display:block;font-size:13px">SkillRadius Support</b>Thanks for writing in. We've received your ticket and will reply within one working day.<small>Automatic reply</small></div>` : ""}</div>
        ${t.status === "Closed" ? `<p class="small muted center">This ticket is closed. <button class="link" id="reopen" style="border:0;background:none;font-size:inherit">Reopen it</button> if you still need help.</p>`
          : `<form class="stack" id="reply" novalidate><div class="field"><label for="r-msg" class="sr-only">Your reply</label><textarea id="r-msg" placeholder="Write a reply" style="min-height:90px"></textarea></div><div class="row" style="justify-content:space-between"><button class="btn plain sm" type="button" id="close">Mark as resolved</button><button class="btn" type="submit">Send reply</button></div></form>`}
      </div>
    </div>`;
    const save = (fn) => { const all = SR.tickets(), x = all.find(y => y.id === t.id); fn(x); x.updated = Date.now(); SR.saveTickets(all); thread(t.id); };
    $("#back").addEventListener("click", e => { e.preventDefault(); history.pushState(null, "", "support.html"); list(); });
    const r = $("#reply"); if (r) r.addEventListener("submit", e => { e.preventDefault(); const v = $("#r-msg").value.trim(); if (!v) { SR.fieldError($("#r-msg"), "Write a message first."); return; } save(x => { x.messages.push({ from: "learner", text: v, at: Date.now() }); x.status = "Open"; }); });
    const c = $("#close"); if (c) c.addEventListener("click", () => save(x => x.status = "Closed"));
    const ro = $("#reopen"); if (ro) ro.addEventListener("click", () => save(x => x.status = "Open"));
  }

  const route = () => location.hash.length > 1 ? thread(location.hash.slice(1)) : list();
  addEventListener("hashchange", route);
  route();
})();
