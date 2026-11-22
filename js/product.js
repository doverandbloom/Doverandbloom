/* ==========================================================
   Dover & Bloom — individual product pages (product.html#<item>)
   Every item on the Shop page has its own page here. Details come
   from the Shop page cards (title, description, what's included,
   price, button) plus js/catalog.js (dates, visit details, prices),
   so the two can never get out of sync. Dahlia varieties use the
   variety layout from js/tubers.js.
   ========================================================== */
(() => {
  const root = document.getElementById("product-page");
  if (!root) return;
  const S = CATALOG_SETTINGS;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (c) => (c === 0 ? "Free" : `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`);
  const prettyDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }); };

  // "#upick-jar" on the live site; "#product--upick-jar" in the single-file preview
  function currentId() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h.includes("--")) return h;
    const [view, id] = h.split("--");
    return view === "product" ? id : null;
  }

  // ---------- read every item from the Shop page ----------
  let shopItems = null;
  async function loadShop() {
    if (shopItems) return shopItems;
    const html = await (await fetch("shop.html")).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    shopItems = [...doc.querySelectorAll("article.product[data-item]")].filter((card) => !card.closest("[data-off]")).map((card) => { // hidden items have no page
      const sec = card.closest("section.shop-section");
      return { id: card.dataset.item, card, sec, section: { id: sec.id, name: sec.querySelector("h2").textContent } };
    });
    return shopItems;
  }

  const unitFor = (p) => {
    if (!p) return "";
    if (p.kind === "subscription") return `per bouquet · every ${p.per}`;
    if (p.kind === "pickup") return "per bucket";
    if (p.spots === 2) return p.unit ? `per ${p.unit} · 2 people` : "for 2 people";
    if (p.kind === "series") return `per ${S.schedules[p.series]?.unit || "ticket"}`;
    if (p.kind === "ondemand") return "video class";
    if (p.kind === "class") return "per seat";
    return "";
  };

  function relatedCard(it) {
    const c = it.card;
    const art = c.querySelector(".art");
    const p = CATALOG[it.id];
    const price = p ? money(p.price) : c.querySelector(".price")?.textContent || "";
    return `<a class="pp-mini" href="product.html#${it.id}">
      <span class="pp-mini-art ${[...art.classList].filter((x) => x.startsWith("bg-")).join(" ")}">${art.querySelector("svg")?.outerHTML || ""}${p?.soldOut ? '<span class="ts-tag">Sold out</span>' : ""}</span>
      <span class="pp-mini-body"><span class="pp-mini-name">${esc(c.querySelector("h3").textContent)}</span><span class="pp-mini-price">${esc(price)}</span></span>
    </a>`;
  }

  // date buttons for a recurring / dated event
  function datesHTML(p, id) {
    if (!p || p.kind !== "series") return "";
    const today = new Date().toISOString().slice(0, 10);
    const sched = S.schedules[p.series];
    const dates = seriesDates(p.series).filter((d) => d >= today);
    if (!dates.length) return `<p class="pp-note">All dates for this season have passed.</p>`;
    return `<h3 class="tv-h">Upcoming dates</h3>
      <p class="pp-note">${esc(sched.time)}${sched.capacity ? ` · limited to ${sched.capacity} ${p.series === "upick" ? "tickets" : "people"} per date` : ""}. Choose a date to book.</p>
      <div class="pp-dates" data-series="${p.series}">${dates.map((d) => `<button type="button" class="pp-date" data-product="${esc(id)}" data-date="${d}"><b>${prettyDate(d)}</b><span class="pp-left"></span></button>`).join("")}</div>`;
  }

  function sectionExtras(it, p) {
    const sec = it.sec;
    const parts = [];
    const sched = p && p.kind === "series" ? S.schedules[p.series] : null;
    if (sched?.details?.length) parts.push(`<h3 class="tv-h">Good to know</h3><ul class="pp-list">${sched.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>`);
    else if (sec.querySelector(".visit-details")) parts.push(`<h3 class="tv-h">Good to know</h3>${sec.querySelector(".visit-details ul").outerHTML.replace("<ul", '<ul class="pp-list"')}`);
    // every ticket that brings guests to the farm shows our welcoming-farm note
    if (p?.onSite) parts.push(`<p class="pp-welcome">We’re building a <strong>kind, welcoming farm</strong> for everyone. We reserve the right to refuse service to anyone who isn’t on board with that. <a href="terms.html#welcoming">Read more</a></p>`);
    const strip = [...sec.querySelectorAll(".info-strip > div")];
    if (strip.length) parts.push(`<h3 class="tv-h tv-h--rule">Frequently asked questions</h3>${strip.map((d) => {
      const title = d.querySelector("strong").textContent;
      const body = d.innerHTML.replace(/<strong>.*?<\/strong>/, "");
      return `<details class="tv-more"><summary>${esc(title)}</summary><p>${body}</p></details>`;
    }).join("")}`);
    const addon = sec.querySelector(".addon-note");
    if (addon) parts.push(`<p class="addon-note">${addon.innerHTML}</p>`);
    const waiver = sec.querySelector(".waiver-notice");
    if (waiver) parts.push(`<p class="waiver-notice">${waiver.innerHTML}</p>`);
    return parts.join("");
  }

  function actionHTML(it, p) {
    const foot = it.card.querySelector(".foot");
    const btn = foot?.querySelector("button, a");
    if (p?.soldOut) return `<button type="button" class="tv-status" disabled>Sold out</button>`;
    if (!btn) return "";
    if (btn.disabled) return `<button type="button" class="tv-status" disabled>${esc(btn.textContent.trim())}</button>`; // e.g. "Coming soon"
    const label = btn.textContent.trim();
    const big = { Book: "Book now", "Book tickets": "Book tickets", Add: "Add to basket", "Pre-order": "Pre-order", Subscribe: "Subscribe", "Buy class": "Buy this class", Register: "Register", "Get tickets": "Get tickets" }[label] || label;
    if (btn.tagName === "A") return `<a class="btn pp-buy" href="${esc(btn.getAttribute("href"))}">${esc(big)}</a>`;
    return `<button type="button" class="btn pp-buy" data-product="${esc(btn.dataset.product)}">${esc(big)}</button>`;
  }

  async function render() {
    const id = currentId();
    if (id === null) return; // another page is showing (preview)
    window.scrollTo({ top: 0, behavior: "instant" });

    // ---- dahlia varieties ----
    if (CATALOG[id]?.group === "tuber" && window.DB_TUBERS) {
      const t = window.DB_TUBERS.find(id);
      root.innerHTML = `${crumbs("dahlia-tubers", "Dahlia Tubers", t.title)}<div class="pp-variety">${window.DB_TUBERS.varietyHTML(id)}</div>`;
      window.DB_TUBERS.bindVariety(root, id);
      document.title = `${t.title} Dahlia Tuber | Dover & Bloom`;
      return;
    }

    let items;
    try { items = await loadShop(); } catch { root.innerHTML = notFound(); return; }
    const it = items.find((x) => x.id === id);
    if (!it) { root.innerHTML = notFound(); return; }
    const c = it.card, p = CATALOG[id];
    const art = c.querySelector(".art");
    const artClasses = [...art.classList].filter((x) => x.startsWith("bg-")).join(" ");
    const short = c.querySelector("h3").textContent;
    const title = it.section.id === "flower-csa" ? `Flower CSA: ${short}` : short;
    const meta = c.querySelector(".meta")?.innerHTML || "";
    const desc = c.querySelector(".desc")?.innerHTML || "";
    const feats = c.querySelector(".features");
    const priceText = p ? money(p.price) : c.querySelector(".price")?.textContent || "";
    let related = items.filter((x) => x.section.id === it.section.id && x.id !== id);
    if (related.length < 2) related = related.concat(items.filter((x) => x.section.id === "events" && x.id !== id)); // suggest events
    related = related.slice(0, 4);
    const fixedDate = p && p.date ? `<p class="pp-when">📅 ${prettyDate(p.date)} · ${esc(p.time)}</p>` : "";

    root.innerHTML = `
      ${crumbs(it.section.id, it.section.name, title)}
      <div class="tv-layout pp-layout">
        <div class="tv-gallery">
          <div class="tv-main pp-art ${artClasses}">
            ${art.querySelector("svg")?.outerHTML || ""}
            ${[...art.querySelectorAll(".badge, .date-chip")].map((b) => b.outerHTML).join("")}
            ${p?.soldOut ? '<span class="badge badge--sold">Sold out</span>' : ""}
          </div>
        </div>
        <div class="tv-info">
          <p class="eyebrow">${esc(it.section.name)}</p>
          <h1>${esc(title)}</h1>
          ${priceText ? `<p class="tv-price">${esc(priceText)} <span>${esc(unitFor(p))}</span></p>` : ""}
          ${meta ? `<p class="pp-meta">${meta}</p>` : ""}
          ${fixedDate}
          <div class="pp-actions">${actionHTML(it, p)}</div>
          ${desc ? `<p class="tv-desc">${desc}</p>` : ""}
          ${feats ? `<h3 class="tv-h">What's included</h3>${feats.outerHTML}` : ""}
          ${datesHTML(p, id)}
          ${sectionExtras(it, p)}
        </div>
      </div>
      ${related.length ? `<div class="tv-related">
        <h2 class="tv-related-title"><svg aria-hidden="true"><use href="#i-sprig"/></svg>You may also like<svg aria-hidden="true"><use href="#i-sprig"/></svg></h2>
        <div class="tv-related-grid">${related.map(relatedCard).join("")}</div>
      </div>` : ""}`;
    document.title = `${title} | Dover & Bloom`;

    // live "spots left" on the date buttons
    const box = root.querySelector(".pp-dates");
    if (box && window.dbLoadAvailability) {
      window.dbLoadAvailability().then((all) => {
        const avail = all && all[box.dataset.series];
        if (!avail) return;
        box.querySelectorAll(".pp-date").forEach((b) => {
          const n = avail[b.dataset.date];
          if (n == null) return;
          b.querySelector(".pp-left").textContent = n <= 0 ? "Sold out" : n <= 5 ? `${n} left` : `${n} spots`;
          if (n <= 0) { b.disabled = true; b.classList.add("is-full"); }
        });
      });
    }
  }

  const crumbs = (secId, secName, title) => `
    <nav class="pp-crumbs" aria-label="Breadcrumb"><a href="shop.html">Shop</a><span>›</span>${secId === "u-pick" ? "" : `<a href="shop.html#${secId}">${esc(secName)}</a><span>›</span>`}<span aria-current="page">${esc(title)}</span></nav>`; // U-pick has no category page of its own
  const notFound = () => `
    <div class="pp-missing"><h1>We couldn't find that item</h1><p>It may have sold out or moved. <a href="shop.html">Browse the shop</a> or <a href="contact.html">ask us</a>.</p></div>`;

  window.addEventListener("hashchange", render);
  render();
})();
