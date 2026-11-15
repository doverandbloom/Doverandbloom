/* ==========================================================
   Shop category pages
   shop.html            → overview of every category
   shop.html#events     → only the Events page (same for every category)
   Each category gets its own title, breadcrumb and ribbon highlight.
   In the single-file preview the address looks like #shop--events.
   ========================================================== */
(() => {
  const sections = [...document.querySelectorAll(".shop-section")];
  if (!sections.length) return;
  const head = document.querySelector(".page-head");
  const crumbs = document.querySelector(".shop-crumbs");
  const overview = document.querySelector(".shop-overview");
  const pills = [...document.querySelectorAll(".shop-nav a")];
  const name = (sec) => sec.querySelector("h2").textContent;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Overview tiles, built from each category's own heading, intro and first picture
  overview.innerHTML = `<div class="shop-cats">${sections.map((sec) => {
    const art = sec.querySelector(".art");
    const intro = sec.querySelector(".shop-section-head p")?.textContent || "";
    const blurb = intro.split(/(?<=\.)\s/)[0];
    const count = sec.querySelectorAll("article.product").length;
    const icon = sec.id === "dahlia-tubers" ? '<svg viewBox="0 0 100 100"><use href="#i-dahlia"/></svg>' : art?.querySelector("svg")?.outerHTML || "";
    const bg = sec.id === "dahlia-tubers" ? "bg-coral" : [...(art?.classList || [])].filter((c) => c.startsWith("bg-")).join(" ");
    return `<a class="shop-cat" href="shop.html#${sec.id}">
      <span class="shop-cat-art ${bg}">${icon}</span>
      <span class="shop-cat-body"><span class="shop-cat-name">${esc(name(sec))}</span><span class="shop-cat-blurb">${esc(blurb)}</span>
      <span class="shop-cat-more">${sec.id === "dahlia-tubers" ? "Browse varieties" : `${count} ${count === 1 ? "item" : "items"}`} →</span></span>
    </a>`;
  }).join("")}</div>`;

  function currentCategory() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return { sec: null };
    const preview = !!document.querySelector("[data-view]");
    const [view, anchor] = h.includes("--") ? h.split("--") : preview ? [h, ""] : ["shop", h];
    if (view !== "shop") return { other: true };
    if (!anchor) return { sec: null };
    const el = document.getElementById(anchor);
    const sec = el && (el.classList.contains("shop-section") ? el : el.closest(".shop-section"));
    return { sec, el: sec && el !== sec ? el : null };
  }

  function show() {
    const { sec, el, other } = currentCategory();
    if (other) return; // another page is showing (preview)
    sections.forEach((s) => (s.hidden = sec ? s !== sec : true));
    overview.hidden = !!sec;
    head.hidden = !!sec;
    crumbs.hidden = !sec;
    if (sec) crumbs.innerHTML = `<a href="shop.html">Shop</a><span>›</span><span aria-current="page">${esc(name(sec))}</span>`;
    pills.forEach((a) => {
      const id = (a.getAttribute("href").split("#")[1] || "").replace(/^shop--/, "");
      const on = sec ? id === sec.id : id === "";
      a.classList.toggle("active", on);
      if (on) { a.setAttribute("aria-current", "page"); a.scrollIntoView({ block: "nearest", inline: "center" }); }
      else a.removeAttribute("aria-current");
    });
    const title = sec ? `${name(sec)} | Dover & Bloom` : "Shop | Dover & Bloom";
    document.title = title;
    requestAnimationFrame(() => {
      document.title = title; // the preview's page switcher may have renamed the tab meanwhile
      el ? el.scrollIntoView({ block: "center" }) : window.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  window.addEventListener("hashchange", show);
  show();
})();
