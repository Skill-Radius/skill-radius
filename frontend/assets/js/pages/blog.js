/* Blog — blog.html (list, search, categories) and article.html#<slug> */
(function () {
  const { $, esc, icon } = SR;
  const page = document.querySelector('meta[name="sr-page"]').content;
  const author = (k) => SR.trainer(k);
  const byline = (p) => `${esc(author(p.author).name)} · ${SR.fmtDate(p.date, { day: "numeric", month: "short", year: "numeric" })} · ${p.read} min read`;
  const av = (k) => { const a = author(k); return `<span class="avatar-i" style="background:${a.color}">${SR.initials(a.name)}</span>`; };
  const date = (p) => SR.fmtDate(p.date, { day: "numeric", month: "short", year: "numeric" });
  const card = (p, i = 0) => `<article class="post-card" style="--i:${i}"><div class="im"><img src="${p.img}" alt="" loading="lazy"><span class="cat">${esc(p.cat)}</span></div><div class="b"><h3><a href="article.html#${p.slug}">${esc(p.title)}</a></h3><p>${esc(p.excerpt)}</p><div class="by">${av(p.author)}<span><b>${esc(author(p.author).name)}</b>${date(p)} · ${p.read} min read</span><i class="go">${icon("arrow")}</i></div></div></article>`;

  if (page === "blog") {
    let cat = "All", q = "";
    const posts = [...SR.posts].sort((a, b) => b.date - a.date);
    const cats = ["All", ...new Set(posts.map(p => p.cat))];
    function render() {
      $("#cats").innerHTML = cats.map(c => `<button type="button" class="bl-cat" aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}<span>${c === "All" ? posts.length : posts.filter(p => p.cat === c).length}</span></button>`).join("");
      const list = posts.filter(p => (cat === "All" || p.cat === cat) && (!q || (p.title + " " + p.excerpt + " " + p.cat).toLowerCase().includes(q.toLowerCase())));
      $("#count").textContent = `${list.length} article${list.length === 1 ? "" : "s"}${q ? ` for “${q}”` : ""}`;
      const [first, ...rest] = list, top = first && cat === "All" && !q;
      const popular = [...posts].sort((a, b) => b.read - a.read).slice(0, 3);
      $("#featured").innerHTML = top ? `
        <article class="bl-feat">
          <a class="im" href="article.html#${first.slug}" tabindex="-1" aria-hidden="true"><img src="${first.img}" alt=""></a>
          <div class="b"><div class="tags"><span class="new">Latest</span><span class="cat">${esc(first.cat)}</span></div>
            <h2><a href="article.html#${first.slug}">${esc(first.title)}</a></h2><p>${esc(first.excerpt)}</p>
            <div class="by">${av(first.author)}<span><b>${esc(author(first.author).name)}</b>${date(first)} · ${first.read} min read</span></div>
            <a class="btn" href="article.html#${first.slug}">Read article ${icon("arrow")}</a></div>
        </article>
        <aside class="bl-pop"><h3>${SR.ficon("bookmark_check")}Editor's picks</h3><ol>${popular.map((p, i) => `<li><a href="article.html#${p.slug}"><span class="n">0${i + 1}</span><span class="t"><b>${esc(p.title)}</b><small>${esc(p.cat)} · ${p.read} min</small></span><img src="${p.img}" alt=""></a></li>`).join("")}</ol>
          <a class="bl-write" href="teach.html"><b>Write for SkillRadius</b><span>Share what you know with 50,000+ learners →</span></a></aside>` : "";
      const grid = top ? rest : list;
      $("#grid").innerHTML = grid.length ? grid.map((p, i) => card(p, i)).join("") : (list.length ? "" : `<div class="empty" style="grid-column:1/-1">${icon("search")}<h3>No articles found</h3><p>Try a different word or topic.</p><button class="btn ghost sm" type="button" data-cat="All">Show all articles</button></div>`);
    }
    document.addEventListener("click", e => { const c = e.target.closest("[data-cat]"); if (c) { cat = c.dataset.cat; if (c.closest(".empty")) { q = ""; $("#q").value = ""; } render(); } });
    $("#search-form").addEventListener("submit", e => { e.preventDefault(); q = $("#q").value.trim(); render(); });
    $("#q").addEventListener("input", e => { q = e.target.value.trim(); render(); });
    $("#blog-nl").addEventListener("submit", e => { e.preventDefault(); const i = $("#blog-email"), v = i.value.trim(); if (!SR.validEmail(v)) { SR.toast("Enter a valid email address."); i.focus(); return; } e.target.innerHTML = `<p class="sr-band-ok">${icon("check")}You're subscribed. The next issue lands in ${esc(v)}.</p>`; });
    render();
    return;
  }

  function renderArticle() {
    const p = SR.posts.find(x => x.slug === SR.hashId());
    if (!p) { location.replace(SR.hashId() ? "404.html" : "blog.html"); return; }
    document.title = p.title + " · SkillRadius Blog";
    const a = author(p.author), fi = (n, x = "") => SR.ficon(n, x);
    let hi = 0;
    const body = p.body.map(([t, v]) => t === "h" ? `<h2 id="h${++hi}">${esc(v)}</h2>` : t === "ul" ? `<ul>${v.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : t === "quote" ? `<blockquote><svg viewBox="0 0 34 31" fill="currentColor" aria-hidden="true"><path d="M19.98 31V20.62c0-5.67 1.09-10.33 3.25-13.97C25.48 3.02 29.07.8 34 0v5.45c-2.94.36-5.02 1.51-6.23 3.46-1.21 1.96-1.82 5.06-1.82 9.32l-3.89-.53h11.81V31H19.98ZM0 31V20.62C0 14.95 1.08 10.29 3.24 6.65 5.49 3.02 9.08.8 14.02 0v5.45C11.07 5.81 9 6.96 7.79 8.91c-1.21 1.96-1.82 5.06-1.82 9.32l-3.89-.53h11.81V31H0Z"/></svg>${esc(v)}</blockquote>` : `<p>${esc(v)}</p>`).join("");
    const heads = p.body.filter(([t]) => t === "h").map(([, v], i) => [`h${i + 1}`, v]);
    const related = SR.posts.filter(x => x.slug !== p.slug).sort((x, y) => (y.cat === p.cat) - (x.cat === p.cat)).slice(0, 3);
    const relCourse = SR.publicCourses().find(c => c.cat === p.cat) || SR.publicCourses()[0];
    const share = encodeURIComponent(location.href);
    $("#main").innerHTML = `
      <section class="ar-hero">
        <div class="ph-shapes" aria-hidden="true"><i class="c"></i><i></i><i class="c"></i><i></i><i class="c"></i><i class="c"></i></div>
        <div class="wrap">
          <ol class="ph-crumb" aria-label="Breadcrumb"><li><a href="index.html">Home</a></li><li><a href="blog.html">Blog</a></li><li>${esc(p.cat)}</li></ol>
          <span class="ar-cat">${esc(p.cat)}</span>
          <h1>${esc(p.title)}</h1>
          <p class="ar-dek">${esc(p.excerpt)}</p>
          <div class="ar-meta"><a class="ar-au" href="instructor.html#${p.author}"><span class="avatar-i" style="background:${a.color}">${SR.initials(a.name)}</span><span><b>${esc(a.name)}</b><small>${esc(a.role)}</small></span></a>
            <span class="ar-d">${fi("schedule")}${SR.fmtDate(p.date, { day: "numeric", month: "long", year: "numeric" })}</span><span class="ar-d">${fi("auto_stories")}${p.read} min read</span></div>
        </div>
      </section>
      <div class="wrap ar-cover"><img src="${p.img}" alt=""></div>
      <div class="wrap ar-layout">
        <aside class="ar-share" aria-label="Share">
          <span>Share</span>
          <a target="_blank" rel="noopener" aria-label="Share on WhatsApp" href="https://wa.me/?text=${encodeURIComponent(p.title)}%20${share}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.2Z"/></svg></a>
          <a target="_blank" rel="noopener" aria-label="Share on LinkedIn" href="https://www.linkedin.com/sharing/share-offsite/?url=${share}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5Z"/></svg></a>
          <a target="_blank" rel="noopener" aria-label="Share on X" href="https://x.com/intent/post?text=${encodeURIComponent(p.title)}&url=${share}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg></a>
          <button type="button" id="copy" aria-label="Copy link">${icon("copy")}</button>
        </aside>
        <article class="ar-body">
          <div class="prose">${body}</div>
          <div class="ar-tags"><span>Filed under</span><a href="blog.html">${esc(p.cat)}</a><a href="blog.html">Careers</a><a href="blog.html">Learning</a></div>
          <div class="ar-author"><span class="avatar-i" style="background:${a.color}">${SR.initials(a.name)}</span><div><small>Written by</small><b>${esc(a.name)}</b><span>${esc(a.role)}</span><p>${esc(a.bio || "")}</p><a class="link small" href="instructor.html#${p.author}">View profile ${icon("arrow")}</a></div></div>
        </article>
        <aside class="ar-side">
          ${heads.length ? `<nav class="ar-toc" aria-label="In this article"><b>In this article</b><div class="lg-prog" aria-hidden="true"><i id="ar-bar"></i></div><ol>${heads.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join("")}</ol></nav>` : ""}
          <a class="ar-course" href="course.html#${relCourse.id}"><img src="${relCourse.img}" alt=""><div><small>Learn this properly</small><b>${esc(relCourse.title)}</b><span>${relCourse.hours} hours · ${relCourse.price ? SR.inr(relCourse.price) : "Free"}</span><em>View course ${icon("arrow")}</em></div></a>
        </aside>
      </div>
      <section class="ar-more"><div class="wrap"><div class="ar-more-h"><h2>Keep reading</h2><a class="link" href="blog.html">All articles ${icon("arrow")}</a></div><div class="bl-grid">${related.map((x, i) => card(x, i)).join("")}</div></div></section>`;
    $("#copy").addEventListener("click", () => (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => SR.toast("Link copied"), () => SR.toast(location.href)));
    const links = [...document.querySelectorAll(".ar-toc a")];
    links.forEach(l => l.addEventListener("click", e => { e.preventDefault(); const t = $(l.getAttribute("href")); if (t) scrollTo({ top: t.getBoundingClientRect().top + scrollY - 100, behavior: "smooth" }); }));
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(l => l.classList.toggle("on", l.getAttribute("href") === "#" + en.target.id)); }), { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll(".ar-body h2").forEach(h => io.observe(h));
    const bar = $("#ar-bar"), art = $(".ar-body");
    const prog = () => { if (!bar) return; const r = art.getBoundingClientRect(), p2 = Math.min(1, Math.max(0, (-r.top + innerHeight * .25) / Math.max(1, r.height - innerHeight * .5))); bar.style.width = (p2 * 100).toFixed(1) + "%"; };
    removeEventListener("scroll", window.__arProg || (() => {})); window.__arProg = prog; addEventListener("scroll", prog, { passive: true }); prog();
  }
  addEventListener("hashchange", () => { renderArticle(); scrollTo(0, 0); });
  renderArticle();
})();
