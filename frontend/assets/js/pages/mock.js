/* Mock test — mock-test.html#<cert-id>
   Untimed practice with instant feedback. Uses the same question bank as the
   exam (shuffled, 10 questions). Best score is saved per certification. */
(function () {
  if (!SR.auth.require()) return;
  const { $, $$, esc, icon, pct } = SR;
  const c = SR.cert(SR.hashId());
  if (!c || !SR.isEnrolled("certs", c.id)) { location.replace(c ? "certification.html#" + c.id : "certifications.html"); return; }

  // Same generator the exam uses for certifications without a written bank
  const BANK = c.exam.bank && SR.examBanks && SR.examBanks[c.exam.bank];
  const N = BANK ? 20 : 10, L = "ABCDEF", NUM = ["", "ONE", "TWO", "THREE", "FOUR"];
  function bank() {
    if (BANK) return BANK.map(b => { const o = b.o.map((_, k) => k); for (let k = o.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [o[k], o[j]] = [o[j], o[k]]; } const multi = Array.isArray(b.a), at = (k) => o.indexOf(k); return { s: b.d, q: b.q, o: o.map(k => b.o[k]), a: multi ? b.a.map(at).sort((x, y) => x - y) : at(b.a), multi, n: multi ? b.a.length : 1, e: b.e }; });
    if (c.id === "python") return SR.examQuestions;
    const others = SR.certifications.filter(x => x.id !== c.id), fm = others.flatMap(o => o.modules), fs = others.flatMap(o => o.skills);
    return Array.from({ length: c.exam.questions }, (_, i) => {
      const useMod = i % 2 === 0, pool = useMod ? c.modules : c.skills, right = pool[Math.floor(i / 2) % pool.length];
      const wp = (useMod ? fm : fs).filter(x => !pool.includes(x)), wrong = [0, 1, 2].map(k => wp[(i * 5 + k * 7 + 3) % wp.length]);
      const pos = (i * 3 + 1) % 4, o = [...wrong]; o.splice(pos, 0, right);
      return { s: c.modules[Math.floor(i / c.exam.questions * c.modules.length)], q: useMod ? `Which of these topics is part of the ${c.title} syllabus?` : `Which skill does the ${c.title} exam assess?`, o, a: pos };
    });
  }
  const right = (q, g) => q.multi ? Array.isArray(g) && g.length === q.a.length && g.every(v => q.a.includes(v)) : g === q.a;
  const isCorrectOpt = (q, k) => q.multi ? q.a.includes(k) : k === q.a;
  const explain = (q) => q.e ? q.e : `The correct answer is “${q.o[q.a]}”.${q.s ? ` Review the “${q.s}” module if this one tripped you up.` : ""}`;

  let qs, i, answers;
  function start() {
    const b = [...bank()];
    for (let k = b.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [b[k], b[j]] = [b[j], b[k]]; }
    qs = b.slice(0, N); i = 0; answers = new Array(qs.length).fill(null);
    show();
  }

  function header() {
    const best = ((SR.store.get("mocks", {}) || {})[c.id]) || null;
    return `<ol class="crumbs"><li><a href="certification.html#${c.id}">${esc(c.title)}</a></li><li>${BANK ? "Practice exam" : "Mock test"}</li></ol>
      <div class="row" style="justify-content:space-between;margin-bottom:16px"><div><h1 style="font-size:24px;font-weight:600">${BANK ? "Practice exam" : "Mock test"}</h1><p class="small muted">${N} practice questions${BANK ? " from the full exam bank" : ""} · untimed · every answer explained${best != null ? ` · your best: <b>${best}%</b>` : ""}</p></div><a class="btn plain sm" href="certification.html#${c.id}">${icon("arrowl")}Back to program</a></div>`;
  }

  function show() {
    const q = qs[i], answered = answers[i] !== null;
    $("#main").innerHTML = `<div class="wrap" style="max-width:860px">${header()}
      <div class="bar" style="margin-bottom:14px"><span style="width:${pct(i, qs.length)}%;background:var(--primary)"></span></div>
      <div class="quiz">
        <span class="count">Question ${i + 1} of ${qs.length}${q.s ? " · " + esc(q.s) : ""}</span>
        <p class="q" style="font-size:18px;font-weight:600;color:var(--ink)">${esc(q.q.replace(/\s*\(Choose [A-Z]+\.\)$/, ""))}${q.multi ? ` <span style="color:var(--primary);white-space:nowrap">(Choose ${NUM[q.n]}.)</span>` : ""}</p>
        ${q.code ? `<pre class="code">${esc(q.code)}</pre>` : ""}
        <div class="options" role="${q.multi ? "group" : "radiogroup"}">${q.o.map((o, k) => { const picked = q.multi ? (answers[i] || []).includes(k) : answers[i] === k; return `<label class="opt ${answered ? (isCorrectOpt(q, k) ? "correct" : picked ? "wrong" : "") : ""}"><input type="${q.multi ? "checkbox" : "radio"}" name="opt" value="${k}" ${picked ? "checked" : ""} ${answered ? "disabled" : ""}><span>${esc(o)}</span><span class="letter">${L[k]}</span></label>`; }).join("")}</div>
        ${answered ? `<div class="alert ${right(q, answers[i]) ? "ok" : "error"}">${icon(right(q, answers[i]) ? "check" : "info")}<span><b>${right(q, answers[i]) ? "Correct." : "Not quite."}</b> ${q.multi && !right(q, answers[i]) ? `The correct answers are ${q.a.map(k => L[k]).join(" and ")}. ` : ""}${esc(explain(q))}</span></div>` : ""}
        <div class="actions"><span class="small muted">${answers.filter((a, k) => a !== null && right(qs[k], a)).length} correct so far</span>
          ${answered ? `<button class="btn sm" id="next">${i === qs.length - 1 ? "See results" : "Next question"} ${icon("arrow")}</button>` : `<button class="btn sm" id="check" disabled>Check answer</button>`}</div>
      </div></div>`;
    const sel = () => $$('input[name="opt"]:checked').map(x => +x.value);
    $$('input[name="opt"]').forEach(r => r.addEventListener("change", () => { const ch = $("#check"); if (ch) ch.disabled = q.multi ? sel().length !== q.n : !sel().length; }));
    const ch = $("#check"); if (ch) ch.addEventListener("click", () => { const v = sel(); if (!v.length) return; answers[i] = q.multi ? v : v[0]; show(); });
    const nx = $("#next"); if (nx) nx.addEventListener("click", () => { if (i < qs.length - 1) { i++; show(); } else result(); });
  }

  function result() {
    const nRight = qs.filter((q, k) => right(q, answers[k])).length, p = pct(nRight, qs.length), ready = p >= Math.max(c.exam.pass + 10, 70);
    const all = SR.store.get("mocks", {}) || {}; all[c.id] = Math.max(all[c.id] || 0, p); SR.store.set("mocks", all);
    const weak = [...new Set(qs.filter((q, k) => !right(q, answers[k])).map(q => q.s).filter(Boolean))];
    $("#main").innerHTML = `<div class="wrap" style="max-width:860px">${header()}
      <div class="quiz"><div class="quiz-result"><span class="pill ${ready ? "green" : "amber"}">${ready ? "You look ready" : "Keep practising"}</span><div class="score">${p}%</div><p class="muted">${nRight} of ${qs.length} correct. The real exam needs ${c.exam.scaled ? "a scaled " + c.exam.scaled.pass + "/" + c.exam.scaled.max + " (about " + c.exam.pass + "%)" : c.exam.pass + "%"}. ${ready ? "You're scoring comfortably above the pass mark." : "Aim for 70%+ in practice before you book the exam."}</p></div>
        ${weak.length ? `<div><b>${BANK ? "Review these domains:" : "Review these modules:"}</b><div class="row" style="gap:6px;margin-top:8px">${weak.map(w => `<span class="pill amber">${esc(w)}</span>`).join("")}</div></div>` : ""}
        <div class="actions"><button class="btn plain sm" id="again">${icon("retry")}Try another set</button>${ready ? `<a class="btn sm" href="exam-rules.html#${c.id}">Go to the real exam ${icon("arrow")}</a>` : `<a class="btn sm" href="certification.html#${c.id}">Back to study modules</a>`}</div>
      </div></div>`;
    $("#again").addEventListener("click", start);
  }
  start();
})();
addEventListener("hashchange", () => location.reload());
