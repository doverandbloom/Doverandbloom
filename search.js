/* ==========================================================
   Dover & Bloom — site search
   Opens from the magnifying-glass button (or press "/").
   On first use it reads every page of the site and indexes
   headings, products, packages, blog posts, FAQs and terms,
   so new content is searchable automatically — no setup.
   ========================================================== */

(() => {
  const PAGES = ["index.html", "story.html", "shop.html", "contact.html", "terms.html"]; // blog hidden for now: add "blog.html" back to include it
  const PAGE_NAMES = { "index.html": "Home", "story.html": "Our Story", "shop.html": "Shop", "blog.html": "Blog", "contact.html": "Contact", "terms.html": "Terms" };
  const SUGGESTED = ["U-pick tickets", "Happy hour", "Yoga", "Bouquet class", "Brunch", "Pumpkin", "Wreath", "Bloom bar", "Bridal shower"];

  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, "and");
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- build the index from a page's HTML ----------
  function indexDoc(doc, page) {
    const out = [];
    const main = doc.querySelector("main");
    if (!main) return out;
    const add = (title, text, el, kind) => {
      title = clean(title); text = clean(text);
      if (!title) return;
      const anchor = el && (el.id ? el : el.closest("[id]"));
      const hash = anchor && anchor.id && !anchor.id.startsWith("nl-") ? `#${anchor.id}` : "";
      out.push({ title, text, url: page + hash, kind, page: PAGE_NAMES[page] });
    };
    const h1 = main.querySelector("h1");
    add(h1 ? h1.textContent : PAGE_NAMES[page], main.querySelector(".lede")?.textContent || "", null, "Page");

    main.querySelectorAll(".product").forEach((el) => {
      const section = el.closest("section")?.querySelector("h2")?.textContent || "Shop";
      add(el.querySelector("h3")?.textContent,
        [el.querySelector(".meta")?.textContent, el.querySelector(".desc")?.textContent, el.querySelector(".features")?.textContent, el.querySelector(".price")?.textContent].join(" · "),
        el, clean(section));
      if (el.dataset.item) out[out.length - 1].url = "product.html#" + el.dataset.item;
    });
    main.querySelectorAll(".post, .post-feature").forEach((el) => {
      const p = [...el.querySelectorAll("p")].find((x) => !x.querySelector("time"));
      add(el.querySelector("h3, h2")?.textContent, p?.textContent || "", null, "Blog post");
    });
    main.querySelectorAll(".pillar, .person, .values > div, .timeline li").forEach((el) => {
      add(el.querySelector("h3")?.textContent, el.querySelector("p:last-of-type")?.textContent, el, PAGE_NAMES[page]);
    });
    main.querySelectorAll("details").forEach((el) => {
      add(el.querySelector("summary")?.textContent, el.textContent.replace(el.querySelector("summary")?.textContent || "", ""), el, "FAQ");
    });
    main.querySelectorAll("h2").forEach((h) => {
      if (h.closest(".product, .post, .post-feature, .newsletter")) return;
      let text = "", n = h.nextElementSibling;
      while (n && text.length < 400 && !/^H[12]$/.test(n.tagName)) { text += " " + n.textContent; n = n.nextElementSibling; }
      if (!text) text = h.parentElement?.querySelector("p")?.textContent || "";
      add(h.textContent, text, h.id ? h : h.closest("section, [id]"), page === "terms.html" ? "Terms" : PAGE_NAMES[page]);
    });
    return out;
  }

  let indexPromise = null;
  function getIndex() {
    if (indexPromise) return indexPromise;
    const here = location.pathname.split("/").pop() || "index.html";
    indexPromise = Promise.all(PAGES.map(async (page) => {
      try {
        if (page === here || (page === "index.html" && document.querySelector("[data-view]"))) {
          // in the single-file preview, only the home view belongs to index.html
          const homeView = document.querySelector('[data-view="home"]');
          return indexDoc(homeView ? { querySelector: (sel) => (sel === "main" ? homeView : null) } : document, page);
        }
        const res = await fetch(page);
        if (!res.ok) throw new Error();
        return indexDoc(new DOMParser().parseFromString(await res.text(), "text/html"), page);
      } catch { return page === here ? indexDoc(document, page) : []; }
    })).then((lists) => {
      // dahlia varieties are drawn by js/tubers.js, so index them straight from the catalog
      if (typeof CATALOG !== "undefined") lists.push(Object.entries(CATALOG).filter(([, p]) => p.group === "tuber").map(([id, p]) => ({
        title: p.name.replace(/^Dahlia tuber: /, ""), text: [p.form, (p.colors || []).join(" "), p.colorName, "dahlia tuber", p.soldOut ? "sold out" : ""].filter(Boolean).join(" "),
        url: "product.html#" + id, kind: "Dahlia Tubers", page: "Shop" })));
      const seen = new Set();
      return lists.flat().filter((e) => { const k = e.title + e.url; if (seen.has(k)) return false; seen.add(k); return true; })
        .map((e) => ({ ...e, _t: norm(e.title), _x: norm(e.text + " " + e.kind) }));
    });
    return indexPromise;
  }

  // ---------- search ----------
  function search(index, q) {
    const terms = norm(q).split(/[^a-z0-9$]+/).filter((t) => t.length > 1 || /\d/.test(t));
    if (!terms.length) return [];
    return index.map((e) => {
      let score = 0;
      for (const t of terms) {
        const stem = t.length > 4 ? t.replace(/(es|s)$/, "") : t;
        const inT = e._t.includes(stem), inX = e._x.includes(stem);
        if (!inT && !inX) return null;
        score += (inT ? 6 : 0) + (inX ? 1 : 0) + (e._t.startsWith(stem) ? 3 : 0);
      }
      if (e.kind === "Page") score -= 2;
      return { e, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 12).map((r) => r.e);
  }

  function highlight(text, q) {
    let html = esc(text);
    norm(q).split(/[^a-z0-9]+/).filter((t) => t.length > 1).forEach((t) => {
      html = html.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>");
    });
    return html;
  }
  function snippet(text, q) {
    const t = norm(q).split(/\s+/)[0] || "";
    const i = Math.max(0, norm(text).indexOf(t) - 50);
    const s = text.slice(i, i + 150);
    return (i > 0 ? "…" : "") + s + (text.length > i + 150 ? "…" : "");
  }

  // ---------- UI ----------
  const dlg = document.createElement("dialog");
  dlg.className = "search-dialog";
  dlg.setAttribute("aria-label", "Search the site");
  dlg.innerHTML = `
    <div class="search-box">
      <svg class="search-icon" aria-hidden="true"><use href="#i-search"/></svg>
      <label class="sr-only" for="site-search-input">Search Dover &amp; Bloom</label>
      <input id="site-search-input" type="search" placeholder="Search flowers, tickets, events…" autocomplete="off" spellcheck="false">
      <button type="button" class="search-close" aria-label="Close search">Esc</button>
    </div>
    <div class="search-results" role="listbox" aria-label="Results"></div>`;
  document.body.appendChild(dlg);
  const input = dlg.querySelector("input");
  const results = dlg.querySelector(".search-results");
  let active = -1;

  function renderSuggestions() {
    results.innerHTML = `<p class="search-hint">Try searching for</p><div class="search-chips">${SUGGESTED.map((s) => `<button type="button" data-q="${esc(s)}">${esc(s)}</button>`).join("")}</div>`;
  }

  async function run() {
    const q = input.value.trim();
    if (!q) return renderSuggestions();
    const index = await getIndex();
    if (input.value.trim() !== q) return; // typed more meanwhile
    const hits = search(index, q);
    active = -1;
    results.innerHTML = hits.length
      ? hits.map((h, i) => `
        <a class="search-hit" role="option" id="hit-${i}" href="${esc(h.url)}">
          <span class="search-kind">${esc(h.kind)}${h.kind !== h.page ? ` · ${esc(h.page)}` : ""}</span>
          <strong>${highlight(h.title, q)}</strong>
          ${h.text ? `<span class="search-snip">${highlight(snippet(h.text, q), q)}</span>` : ""}
        </a>`).join("")
      : `<p class="search-empty">No results for “${esc(q)}”.<br>Try a different word, or <a href="contact.html">ask us directly</a>.</p>`;
  }

  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 120); });
  input.addEventListener("keydown", (e) => {
    const hits = [...results.querySelectorAll(".search-hit")];
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!hits.length) return;
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + hits.length) % hits.length;
      hits.forEach((h, i) => h.classList.toggle("active", i === active));
      hits[active].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", hits[active].id);
    } else if (e.key === "Enter" && hits.length) {
      e.preventDefault();
      (hits[active] || hits[0]).click();
    }
  });
  results.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-q]");
    if (chip) { input.value = chip.dataset.q; run(); input.focus(); return; }
    if (e.target.closest("a")) dlg.close();
  });
  dlg.querySelector(".search-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  function open() {
    if (!dlg.open) dlg.showModal();
    input.select();
    if (!input.value) renderSuggestions();
    getIndex(); // warm up
  }
  document.addEventListener("click", (e) => { if (e.target.closest(".search-btn")) { e.preventDefault(); open(); } });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && !document.querySelector("dialog[open]")) {
      e.preventDefault(); open();
    }
  });
})();
