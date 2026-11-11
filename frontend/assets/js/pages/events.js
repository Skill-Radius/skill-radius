/* Free events — spotlight on the next event, upcoming agenda, past recordings */
(function () {
  const { $, esc, icon } = SR;
  const fi = (n, a = "") => SR.ficon(n, a);
  const now = Date.now();
  let type = "All";
  const isReg = (id) => SR.eventRegs().includes(id);
  const when = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
  const host = (h) => `<div class="ev-host"><span class="avatar-i" style="background:${h.color}">${SR.initials(h.name)}</span><span><b>${esc(h.name)}</b><small>${esc(h.role)}</small></span></div>`;
  const action = (e, big) => {
    const full = e.registered >= e.seats;
    return isReg(e.id) ? `<button class="btn ${big ? "" : "sm "}ok" type="button" data-ics="${e.id}">${icon("cal")}Added · Add to calendar</button>`
      : `<button class="btn ${big ? "" : "sm"}" type="button" data-reg="${e.id}" ${full ? "disabled" : ""}>${full ? "Event full" : "Register free"}${full ? "" : icon("arrow")}</button>`;
  };
  const seats = (e) => { const p = Math.round(e.registered / e.seats * 100); return `<div class="ev-seats${p > 85 ? " hot" : ""}"><div class="bar"><i style="width:${p}%"></i></div><span><b>${e.seats - e.registered}</b> of ${e.seats} seats left</span></div>`; };

  function render() {
    const up = SR.events.filter(e => e.date > now).sort((a, b) => a.date - b.date);
    const next = up[0];
    $("#spot").innerHTML = next ? (() => { const d = new Date(next.date), h = SR.trainer(next.host); return `
      <article class="ev-spot">
        <div class="im"><img src="${next.img}" alt=""><span class="lbl"><i></i>Next live event</span></div>
        <div class="b">
          <div class="tags"><span>${esc(next.type)}</span><span class="free">Free</span></div>
          <h2><a href="event.html#${next.id}">${esc(next.title)}</a></h2>
          <p>${esc(next.desc)}</p>
          <div class="ev-when"><span>${icon("cal")}${when(d)}</span><span>${fi("schedule")}${next.mins} min · Live online</span></div>
          <div class="ev-cd" data-countdown="${next.date}"><span class="l">Starts in</span><span class="cdn-t" aria-live="off"></span></div>
          ${host(h)}
          <div class="acts">${action(next, true)}<a class="btn ghost" href="event.html#${next.id}">Event details</a></div>
          ${seats(next)}
        </div>
      </article>`; })() : "";
    const rest = up.slice(1);
    const types = ["All", ...new Set(rest.map(e => e.type))];
    $("#types").innerHTML = types.map(t => `<button type="button" class="bl-cat" aria-pressed="${t === type}" data-type="${t}">${t}<span>${t === "All" ? rest.length : rest.filter(e => e.type === t).length}</span></button>`).join("");
    const list = rest.filter(e => type === "All" || e.type === type);
    $("#upcoming").innerHTML = list.length ? list.map((e, i) => { const d = new Date(e.date), h = SR.trainer(e.host); return `
      <article class="ev-row" style="--i:${i}">
        <div class="dt"><span>${d.toLocaleDateString("en-IN", { month: "short" })}</span><b>${d.getDate()}</b><small>${d.toLocaleDateString("en-IN", { weekday: "short" })}</small></div>
        <img src="${e.img}" alt="" loading="lazy">
        <div class="mid"><div class="tags"><span>${esc(e.type)}</span>${isReg(e.id) ? `<span class="ok">${icon("check")}Registered</span>` : ""}</div>
          <h3><a href="event.html#${e.id}">${esc(e.title)}</a></h3>
          <div class="ev-when"><span>${fi("schedule")}${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} · ${e.mins} min</span></div>
          ${host(h)}</div>
        <div class="end">${seats(e)}${action(e)}</div>
      </article>`; }).join("") : `<div class="empty">${icon("cal")}<h3>No more ${type === "All" ? "events" : type.toLowerCase() + "s"} scheduled yet</h3><p>Subscribe below and we'll tell you when the next one opens.</p></div>`;
    $("#past").innerHTML = SR.events.filter(e => e.date <= now).sort((a, b) => b.date - a.date).map(e => { const d = new Date(e.date), h = SR.trainer(e.host); return `
      <article class="ev-rec">
        <button type="button" class="im" data-video data-v-title="${esc(e.title)}" data-v-sub="${esc(e.type)} recording · ${d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}${h ? " · " + esc(h.name) : ""}" data-v-poster="${e.img}" data-v-mins="${e.mins}" data-v-src="${esc(e.video || "")}" aria-label="Watch the recording of ${esc(e.title)}"><img src="${e.img}" alt="" loading="lazy"><span class="play">${fi("play_circle")}</span><span class="dur">${e.mins}:00</span></button>
        <div class="b"><span class="k">${esc(e.type)} · ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span><h3><a href="event.html#${e.id}">${esc(e.title)}</a></h3>${host(h)}</div>
      </article>`; }).join("");
    SR.tickCountdowns && SR.tickCountdowns();
  }

  document.addEventListener("click", ev => {
    const t = ev.target.closest("[data-type]"); if (t) { type = t.dataset.type; render(); return; }
    const r = ev.target.closest("[data-reg]"); if (!r) return;
    SR.registerEvent(SR.events.find(x => x.id === r.dataset.reg), render);
  });
  $("#ev-nl").addEventListener("submit", e => { e.preventDefault(); const i = $("#ev-email"), v = i.value.trim(); if (!SR.validEmail(v)) { SR.toast("Enter a valid email address."); i.focus(); return; } e.target.innerHTML = `<p class="sr-band-ok">${icon("check")}Done. The next schedule goes to ${esc(v)}.</p>`; });
  render();
})();
