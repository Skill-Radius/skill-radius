/* Certification study notes — cert-notes.html#<cert-id>/<module-index>/<lesson-index>
   Figma frame "notes": module list on the left, lesson notes on the right, prev/next at the bottom.
   Finishing the last lesson of a module marks it complete (store "certprog"), which unlocks the test
   once every module is done. Replace LESSON() with notes from your CMS. */
(function () {
  if (!SR.auth.require()) return;
  const { $, $$, esc, icon } = SR;
  const fi = (n, a = "") => SR.ficon(n, a);
  const [cid, mRaw, lRaw] = SR.hashId().split("/");
  const c = SR.cert(cid);
  if (!c) { location.replace("certifications.html"); return; }
  if (!SR.isEnrolled("certs", c.id)) { location.replace("certification.html#" + c.id); return; }
  const PER = 4;

  // Notes content. Module 4 of Python matches the Figma file; others follow the same structure.
  const PY4 = [
    { t: "if, elif and else Statements", h: "What are Control Flow Statements?", p: "Control flow statements allow you to control the order in which your code executes. Python supports three main types of control flow: conditional statements (if/elif/else), loops (for and while), and jump statements (break, continue, pass).",
      code: "# Example: if-elif-else statement\nscore = 85\nif score >= 90:\n    print('Grade: A')\nelif score >= 75:\n    print('Grade: B')\nelse:\n    print('Grade: C')",
      kc: [["if statement", "Executes a block of code only if the condition is True."], ["elif statement", "Checks another condition if the previous one was False."], ["else statement", "Executes if none of the above conditions are True."], ["Nested conditions", "You can nest if statements inside other if statements."]],
      tr: "Write a program that checks if a number is positive, negative, or zero using if-elif-else." },
    { t: "for Loops", h: "Repeating work with for", p: "A for loop runs a block of code once for every item in a sequence, such as a list, a string or a range of numbers.",
      code: "# Example: looping over a list\nskills = ['Python', 'SQL', 'Git']\nfor skill in skills:\n    print('Learning', skill)", kc: [["range()", "Generates a sequence of numbers to loop over."], ["enumerate()", "Gives you the index and the item together."], ["Iterating strings", "A string is a sequence, so you can loop over its characters."], ["Loop variables", "The loop variable takes each value in turn."]], tr: "Print the squares of the numbers 1 to 10 using a for loop and range()." },
    { t: "while Loops", h: "Looping until a condition changes", p: "A while loop keeps running as long as its condition is True. Make sure something inside the loop eventually makes the condition False.",
      code: "# Example: countdown\nn = 3\nwhile n > 0:\n    print(n)\n    n -= 1\nprint('Lift off!')", kc: [["Condition", "Checked before every pass through the loop."], ["Infinite loops", "Happen when the condition never becomes False."], ["Counters", "A variable you update each pass to move towards the end."], ["Sentinel values", "A special input that tells the loop to stop."]], tr: "Keep asking for a password until the user types the right one." },
    { t: "break, continue and pass", h: "Jumping out of loops", p: "Jump statements change the normal flow of a loop: break stops it, continue skips to the next pass, and pass does nothing as a placeholder.",
      code: "# Example: skip odd numbers, stop at 8\nfor n in range(1, 20):\n    if n % 2:\n        continue\n    if n > 8:\n        break\n    print(n)", kc: [["break", "Exits the nearest loop immediately."], ["continue", "Skips the rest of this pass and starts the next one."], ["pass", "A statement that does nothing; useful while sketching code."], ["for … else", "The else block runs only if the loop wasn't broken."]], tr: "Find the first number above 100 that is divisible by 7, then stop." }
  ];
  function LESSON(mi, li) {
    if (c.id === "python" && mi === 3) return PY4[li];
    const m = c.modules[mi], topic = m.replace(/^(Introduction to |Advanced )/, "");
    const kinds = ["Key ideas", "Worked example", "Common mistakes", "Practice & recap"];
    return {
      t: `${kinds[li]}: ${m}`, h: li === 0 ? `What is ${topic}?` : li === 1 ? `${topic} in practice` : li === 2 ? `Avoiding mistakes with ${topic}` : `Recap: ${topic}`,
      p: `${m} is one of the ${c.modules.length} modules in the ${c.title} program. In this lesson you'll ${li === 0 ? "learn the core ideas and the vocabulary you'll use throughout the module" : li === 1 ? "work through a realistic example step by step" : li === 2 ? "look at the mistakes learners make most often, and how to spot them" : "review the module and check you're ready for the quiz"}.`,
      code: `# ${m}\n# Lesson ${mi + 1}.${li + 1} — ${kinds[li].toLowerCase()}\n# Follow along in your own editor, then try the exercise below.`,
      kc: c.skills.slice(0, 4).map((s, i) => [s, `How ${s} connects to ${topic.toLowerCase()} in real projects${i === 0 ? "." : ", with an example from industry."}`]),
      tr: `Apply what you learned about ${topic.toLowerCase()} to a small project of your own, then compare it with the module notes.`
    };
  }

  let mi = Math.max(0, Math.min(c.modules.length - 1, +mRaw || 0)), li = Math.max(0, Math.min(PER - 1, +lRaw || 0));
  const prog = () => Math.min((SR.store.get("certprog", {}) || {})[c.id] || 0, c.modules.length);
  const setProg = (n) => { const all = SR.store.get("certprog", {}) || {}; all[c.id] = Math.max(all[c.id] || 0, n); SR.store.set("certprog", all); };
  let sideOpen = false;

  function render() {
    const L = LESSON(mi, li), done = prog(), last = mi === c.modules.length - 1 && li === PER - 1;
    document.title = `Module ${mi + 1}: ${c.modules[mi]} · SkillRadius`;
    $("#main").innerHTML = `
      <aside class="nt-side" aria-label="Modules" data-open="${sideOpen}">
        <h2>Modules</h2>
        <button class="nt-side-toggle" type="button" id="side-t" aria-expanded="${sideOpen}">Module ${mi + 1} of ${c.modules.length} · ${done} complete ${fi("keyboard_arrow_down", 'width="20" height="20"')}</button>
        ${c.modules.map((m, i) => `<a href="#${c.id}/${i}/0" class="${i < done && i !== mi ? "done" : ""}" ${i === mi ? 'aria-current="page"' : ""}><span class="n">${i < done && i !== mi ? fi("check") : i + 1}</span><span>${esc(m)}</span></a>`).join("")}
      </aside>
      <div class="nt-main">
        <article class="nt-body">
          <nav class="nt-crumb" aria-label="Breadcrumb"><a href="certifications.html">Certifications</a>  /  <a href="certification.html#${c.id}">${esc(c.title.replace(/^Certified (Advanced )?/, ""))}</a>  /  Module ${mi + 1}:  ${esc(c.modules[mi])}</nav>
          <h1>Module ${mi + 1}: ${esc(c.modules[mi])}</h1>
          <p class="ls">Lesson ${mi + 1}.${li + 1} — ${esc(L.t)}</p>
          <h2>${esc(L.h)}</h2>
          <p class="p">${esc(L.p)}</p>
          <pre class="nt-code">${esc(L.code).split("\n").map(l => /^\s*#/.test(l) || /print\(/.test(l) ? `<span class="c">${l}</span>` : l).join("\n")}</pre>
          <h3>Key Concepts</h3>
          <div class="kc">${L.kc.map(([k, v]) => `<div><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join("")}</div>
          <div class="try">💡  Try It Yourself:  ${esc(L.tr)}</div>
        </article>
        <nav class="nt-nav" aria-label="Lessons">
          <a class="btn prev" href="#${c.id}/${li ? mi : mi - 1}/${li ? li - 1 : PER - 1}" ${mi === 0 && li === 0 ? 'aria-disabled="true" tabindex="-1"' : ""}>← Previous Lesson</a>
          <div class="mid">Lesson ${mi + 1}.${li + 1}  of  ${mi + 1}.${PER}<div class="bar"><span style="width:${SR.pct(done, c.modules.length)}%"></span></div></div>
          ${last ? `<a class="btn" href="${done >= c.modules.length - 1 ? `exam-rules.html#${c.id}` : `#${c.id}/${done}/0`}" id="next">${done >= c.modules.length - 1 ? "Finish & Take Test →" : "Next Lesson →"}</a>`
            : `<a class="btn" href="#${c.id}/${li < PER - 1 ? mi : mi + 1}/${li < PER - 1 ? li + 1 : 0}" id="next">${li < PER - 1 ? "Next Lesson →" : "Next Module →"}</a>`}
        </nav>
      </div>`;
    $("#next").addEventListener("click", () => {
      if (li === PER - 1 && mi >= prog()) {
        setProg(mi + 1);
        SR.toast(mi + 1 >= c.modules.length ? "All modules complete. The test is unlocked." : `Module ${mi + 1} complete`);
      }
    });
    $("#side-t").addEventListener("click", () => { sideOpen = !sideOpen; render(); });
  }
  addEventListener("hashchange", () => { const [, m, l] = SR.hashId().split("/"); mi = Math.max(0, Math.min(c.modules.length - 1, +m || 0)); li = Math.max(0, Math.min(PER - 1, +l || 0)); sideOpen = false; render(); scrollTo(0, 0); });
  render();
})();
