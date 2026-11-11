/* Help center — categories, search across articles, helpful-vote */
(function () {
  const { $, $$, esc, icon } = SR;
  const all = SR.help.flatMap(c => c.items.map(([q, a]) => ({ cat: c, q, a })));

  $("#cats").innerHTML = SR.help.map(c => `<a class="help-cat" href="#${c.id}" data-cat="${c.id}"><span class="ic">${icon(c.icon)}</span><span><b>${esc(c.title)}</b><span>${c.items.length} articles</span></span></a>`).join("");

  const feedback = `<div class="row small muted" style="padding:0 20px 16px;gap:8px">Was this helpful? <button class="btn plain sm" data-vote="yes">Yes</button><button class="btn plain sm" data-vote="no">No</button></div>`;
  const article = (x, open) => `<details ${open ? "open" : ""}><summary>${esc(x.q)}${icon("plus")}</summary><div class="body">${esc(x.a)}</div>${feedback}</details>`;

  function showTopic() {
    const c = SR.help.find(x => x.id === location.hash.slice(1));
    $$(".help-cat").forEach(a => a.style.borderColor = c && a.dataset.cat === c.id ? "var(--primary)" : "");
    if (!c) { $("#topic").innerHTML = `<h2 style="font-size:22px;font-weight:600;margin-bottom:14px">Popular questions</h2><div class="acc faq">${["How do I get a GST invoice?", "How do refunds work?", "Where do I find the join link?", "When can I take the exam?", "What happens if I fail?", "How does the proctored exam work?"].map(q => all.find(x => x.q === q)).filter(Boolean).map(x => article(x)).join("")}</div>`; return; }
    $("#topic").innerHTML = `<h2 style="font-size:22px;font-weight:600;margin-bottom:14px">${esc(c.title)}</h2><div class="acc faq">${c.items.map(([q, a], i) => article({ q, a }, i === 0)).join("")}</div>`;
  }
  function search(q) {
    const box = $("#results");
    if (!q) { box.hidden = true; return; }
    const words = q.toLowerCase().split(/\s+/);
    const hits = all.filter(x => words.every(w => (x.q + " " + x.a + " " + x.cat.title).toLowerCase().includes(w)));
    box.hidden = false;
    box.innerHTML = `<h2 style="font-size:20px;font-weight:600;margin-bottom:12px">${hits.length} result${hits.length === 1 ? "" : "s"} for “${esc(q)}”</h2>` +
      (hits.length ? `<div class="acc faq">${hits.map((x, i) => article(x, i === 0)).join("")}</div>` : `<div class="empty">${icon("help")}<h3>No answers found</h3><p>Try other words, or <a class="link" href="support.html">raise a ticket</a> and we'll help.</p></div>`);
  }
  $("#search-form").addEventListener("submit", e => { e.preventDefault(); search($("#q").value.trim()); });
  let t; $("#q").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => search(e.target.value.trim()), 200); });
  document.addEventListener("click", e => {
    const v = e.target.closest("[data-vote]"); if (!v) return;
    v.parentElement.innerHTML = v.dataset.vote === "yes" ? "Thanks for the feedback!" : `Sorry about that. <a class="link" href="support.html">Raise a ticket</a> and we'll help.`;
  });
  addEventListener("hashchange", () => { showTopic(); $("#topic").scrollIntoView({ behavior: "smooth", block: "start" }); });
  showTopic();
})();
