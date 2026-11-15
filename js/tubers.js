/* ==========================================================
   Dover & Bloom — dahlia tuber shop
   • Grid of variety cards with filters (color, dahlia type, price,
     availability) and sorting.
   • Each card links to the variety's own page (product.html#tuber-…):
     photo gallery, price, availability, details, FAQs, related varieties.
   Everything is read from js/catalog.js (group: "tuber").
   ========================================================== */
(() => {
  const root = document.getElementById("tuber-shop");

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (c) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;

  // Color filters (dot color and a soft tint for photo placeholders)
  const COLORS = {
    blush: { label: "Blush", swatch: "#f2c4c0", tint: "#f8e3df" },
    bronze: { label: "Bronze", swatch: "#a8693c", tint: "#ecd9c6" },
    burgundy: { label: "Burgundy", swatch: "#6e1f33", tint: "#ead0d5" },
    coral: { label: "Coral", swatch: "#ec7a62", tint: "#f9dcd3" },
    orange: { label: "Orange", swatch: "#ee8a3a", tint: "#f8e0c8" },
    peach: { label: "Peach", swatch: "#f4b593", tint: "#fae6d9" },
    pink: { label: "Pink", swatch: "#e98aae", tint: "#f8dde7" },
    purple: { label: "Purple", swatch: "#7d55a8", tint: "#e6dcef" },
    raspberry: { label: "Raspberry", swatch: "#b8285a", tint: "#f1d3dd" },
    red: { label: "Red", swatch: "#c2302e", tint: "#f2d2cf" },
    salmon: { label: "Salmon", swatch: "#f09a86", tint: "#fbe1da" },
    white: { label: "White", swatch: "#f6f3ea", tint: "#efece2" },
    yellow: { label: "Yellow", swatch: "#f2c94c", tint: "#faefcc" },
  };
  const PRICES = [
    { id: "under15", label: "Under $15", test: (c) => c < 1500 },
    { id: "15to25", label: "$15 – $25", test: (c) => c >= 1500 && c <= 2500 },
    { id: "over25", label: "Over $25", test: (c) => c > 2500 },
  ];

  // American Dahlia Society classification labels
  const ADS_SIZE = { AA: "Giant, over 10 in", A: "Large, 8–10 in", B: "Medium, 6–8 in", BB: "Small, 4–6 in", M: "Miniature, up to 4 in",
    BA: "Ball, over 3.5 in", MB: "Miniature ball, 2–3.5 in", P: "Pompon, up to 2 in" };
  const ADS_FORM = { FD: "Formal decorative", ID: "Informal decorative", SC: "Semi-cactus", C: "Straight cactus", IC: "Incurved cactus",
    LC: "Laciniated", BA: "Ball", MB: "Miniature ball", P: "Pompon", WL: "Waterlily", AN: "Anemone", CO: "Collarette", S: "Single",
    MS: "Mignon single", O: "Orchid", NO: "Novelty open", NC: "Novelty closed", ST: "Stellar", PE: "Peony" };
  const ADS_COLOR = { W: "White", Y: "Yellow", OR: "Orange", PK: "Pink", DP: "Dark pink", R: "Red", DR: "Dark red", L: "Lavender",
    PR: "Purple", LB: "Light blend", BR: "Bronze", FL: "Flame", DB: "Dark blend", V: "Variegated", BI: "Bicolor" };
  // "BA/MB" → "Ball, over 3.5 in or Miniature ball, 2–3.5 in (BA/MB)"
  const code = (table, c) => {
    const labels = String(c).split("/").map((x) => table[x.trim()]).filter(Boolean);
    return labels.length ? `${labels.join(" or ")} <span class="tv-code">(${esc(c)})</span>` : esc(c);
  };

  const tubers = Object.entries(CATALOG)
    .filter(([, p]) => p.group === "tuber")
    .map(([id, p]) => ({ id, ...p, title: p.name.replace(/^Dahlia tuber: /, "").replace(/ \(bundle of 5\)$/i, ""), photos: p.photos || (p.photo ? [p.photo] : []) }));
  const forms = [...new Set(tubers.map((t) => t.form).filter(Boolean))].sort();
  tubers.forEach((t) => (t.colors = t.colors || []));
  const colorCount = (c) => tubers.filter((t) => t.colors.includes(c)).length;
  const main = (t) => t.colors[0];

  const state = { colors: new Set(), form: "", price: "", available: false, sort: "featured" };
  const pageURL = (t) => `product.html#${t.id}`;

  const thumbHTML = (t, cls = "") => t.photos.length
    ? `<img src="${esc(t.photos[0])}" alt="${esc(t.title)} dahlia" loading="lazy" class="${cls}">`
    : `<span class="ts-placeholder ${cls}" style="background:${main(t) ? COLORS[main(t)].tint : "var(--cream-deep)"}"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#i-dahlia"/></svg></span>`;
  const dot = (t, c = main(t)) => (c ? `<i class="ts-dot" style="background:${COLORS[c].swatch}" title="${esc(COLORS[c].label)}"></i>` : "");
  const subline = (t) => t.form === "Mixed" ? "Unidentified varieties" : [t.form, t.colors.map((c) => COLORS[c].label).join(", ")].filter(Boolean).join(" · ") || "Grown and divided on our farm";
  const cardHTML = (t, small = false) => `
      <a class="ts-card${small ? " ts-card--small" : ""}${t.soldOut ? " is-sold-out" : ""}" href="${pageURL(t)}" data-tuber="${t.id}"${small ? "" : ` id="${t.id}"`}>
        <span class="ts-img">${thumbHTML(t)}${t.soldOut ? '<span class="ts-tag">Sold out</span>' : ""}${t.photos.length > 1 && !small ? `<span class="ts-more">${t.photos.length} photos</span>` : ""}</span>
        <span class="ts-body">
          <span class="ts-name">${esc(t.title)}</span>
          ${small ? "" : `<span class="ts-sub">${esc(subline(t))}</span>`}
          <span class="ts-row"><span class="ts-price">${money(t.price)}</span>${dot(t)}</span>
        </span>
      </a>`;

  function related(t) {
    return tubers.filter((o) => o.id !== t.id && o.form !== "Mixed")
      .map((o) => ({ o, score: (o.colors.some((c) => t.colors.includes(c)) ? 2 : 0) + (t.form && o.form === t.form ? 1 : 0) }))
      .sort((a, b) => b.score - a.score || a.o.title.localeCompare(b.o.title))
      .slice(0, 4).map((r) => r.o);
  }

  // ---------- full variety page (used by product.html) ----------
  function varietyHTML(id) {
    const t = tubers.find((x) => x.id === id);
    if (!t) return "";
    const desc = t.desc || (t.form === "Mixed"
      ? "An unidentified tuber from our beds. We don't know which variety it is, so it's a surprise when it blooms. A fun, budget-friendly way to try something new."
      : "Grown in our no-till beds, dug by hand, divided and stored over the winter. Each tuber has at least one visible eye and is labeled by variety.");
    const a = t.ads || {};
    const glance = [
      ["Height", t.height && esc(t.height)],
      ["Bloom size", t.size && esc(t.size)],
      ["Size class", a.size && code(ADS_SIZE, a.size)],
      ["Form", a.form ? code(ADS_FORM, a.form) : t.form === "Mixed" ? "Unidentified varieties" : t.form && esc(t.form)],
      ["ADS color", a.color && code(ADS_COLOR, a.color)],
      ["Color", t.colorName ? esc(t.colorName) : t.colors.map((c) => COLORS[c].label).join(", ")],
    ].filter(([, v]) => v);
    return `
      <div class="tv-layout">
        <div class="tv-gallery">
          <div class="tv-main">${t.photos.length
            ? `<img src="${esc(t.photos[0])}" alt="${esc(t.title)} dahlia, photo 1 of ${t.photos.length}">${t.photos.length > 1 ? `<span class="tv-counter">1 / ${t.photos.length}</span>` : ""}`
            : `<span class="ts-placeholder" style="background:${main(t) ? COLORS[main(t)].tint : "var(--cream-deep)"}"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#i-dahlia"/></svg><em>Photos coming soon</em></span>`}
          </div>
          ${t.photos.length > 1 ? `<div class="tv-thumbs">${t.photos.map((src, i) => `
            <button type="button" class="tv-thumb${i === 0 ? " is-active" : ""}" data-i="${i}" aria-label="Show photo ${i + 1}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
        </div>
        <div class="tv-info">
          <p class="eyebrow">Dahlia tubers</p>
          <h1>${esc(t.title)}</h1>
          <p class="tv-price">${money(t.price)} <span>per tuber</span></p>
          ${t.colors.length ? `<p class="tv-pills">${t.colors.map((c) => `<span class="tv-pill">${dot(t, c)}${esc(COLORS[c].label)}</span>`).join("")}</p>` : ""}
          ${t.soldOut
            ? `<button type="button" class="tv-status" disabled>Sold out</button>
               <p class="tv-waitlist">Want this one next season? <a href="contact.html#tubers">Join the waitlist</a></p>`
            : `<button type="button" class="btn tv-buy" data-product="${t.id}">Add to basket</button>`}
          <p class="tv-desc">${esc(desc)}</p>
          ${t.note ? `<p class="tv-desc tv-desc--note">${esc(t.note)}</p>` : ""}
          ${glance.length ? `<h3 class="tv-h">At a glance</h3>
          <dl class="tv-details">${glance.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
          ${t.ads ? `<p class="tv-note">Codes follow the American Dahlia Society classification.</p>` : ""}` : ""}
          <h3 class="tv-h tv-h--rule">Frequently asked questions</h3>
          <details class="tv-more">
            <summary>Tuber shipping &amp; pickup</summary>
            <p>Tubers ship in spring (typically April–May), once it's safe to plant, to US addresses only. You can also pick up at the farm by arrangement.</p>
          </details>
          <details class="tv-more">
            <summary>Planting &amp; care</summary>
            <p>Plant after your last frost in full sun, about 4–6 inches deep with the eye facing up. Don't water until you see sprouts. Stake tall varieties early and pinch young plants for more stems.</p>
          </details>
          <details class="tv-more">
            <summary>Our guarantee</summary>
            <p>Every tuber arrives with at least one visible eye, and named varieties are labeled. If one arrives damaged, email us a photo within 7 days and we'll make it right.</p>
          </details>
          <details class="tv-more">
            <summary>Terms of service</summary>
            <p>Read our full store policies, including tuber shipping, substitutions and refunds, in our <a href="terms.html#purchases">Terms &amp; Conditions</a>.</p>
          </details>
        </div>
      </div>
      <div class="tv-related">
        <h2 class="tv-related-title"><svg aria-hidden="true"><use href="#i-sprig"/></svg>You may also like<svg aria-hidden="true"><use href="#i-sprig"/></svg></h2>
        <div class="tv-related-grid">${related(t).map((o) => cardHTML(o, true)).join("")}</div>
      </div>`;
  }
  // photo thumbnails on a variety page
  function bindVariety(container, id) {
    const t = tubers.find((x) => x.id === id);
    container.querySelectorAll(".tv-thumb").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      const img = container.querySelector(".tv-main img");
      img.src = t.photos[i]; img.alt = `${t.title} dahlia, photo ${i + 1} of ${t.photos.length}`;
      const ctr = container.querySelector(".tv-counter"); if (ctr) ctr.textContent = `${i + 1} / ${t.photos.length}`;
      container.querySelectorAll(".tv-thumb").forEach((x) => x.classList.toggle("is-active", x === b));
    }));
  }
  window.DB_TUBERS = { varietyHTML, bindVariety, find: (id) => tubers.find((x) => x.id === id) };

  if (!root) return;

  // ---------- layout ----------
  root.innerHTML = `
    <div class="ts-bar">
      <button type="button" class="ts-toggle btn btn--ghost btn--small" aria-expanded="false" aria-controls="ts-filters">Filter &amp; sort</button>
      <div class="ts-filters" id="ts-filters">
        <fieldset class="ts-group ts-colors">
          <legend>Color</legend>
          <div class="ts-chips">${Object.keys(COLORS).map((c) => `<label class="ts-chip"><input type="checkbox" value="${c}"><span><i style="background:${COLORS[c].swatch}"></i>${COLORS[c].label} <em>${colorCount(c)}</em></span></label>`).join("")}</div>
        </fieldset>
        <label class="ts-group">Dahlia type
          <select class="ts-form"><option value="">All types</option>${forms.map((f) => `<option>${esc(f)}</option>`).join("")}</select>
        </label>
        <label class="ts-group">Price
          <select class="ts-price"><option value="">Any price</option>${PRICES.map((p) => `<option value="${p.id}">${p.label}</option>`).join("")}</select>
        </label>
        <label class="ts-group">Sort by
          <select class="ts-sort">
            <option value="featured">Featured</option>
            <option value="az">Name, A–Z</option>
            <option value="za">Name, Z–A</option>
            <option value="low">Price, low to high</option>
            <option value="high">Price, high to low</option>
          </select>
        </label>
        <label class="ts-avail"><input type="checkbox" class="ts-available"> Available only</label>
      </div>
    </div>
    <div class="ts-status"><span class="ts-count" aria-live="polite"></span><button type="button" class="ts-clear" hidden>Clear filters</button></div>
    <nav class="ts-pager" aria-label="Variety pages, top" hidden></nav>
    <div class="ts-grid"></div>
    <nav class="ts-pager" aria-label="Variety pages, bottom" hidden></nav>`;

  const grid = root.querySelector(".ts-grid");
  const count = root.querySelector(".ts-count");
  const clearBtn = root.querySelector(".ts-clear");
  const pagers = [...root.querySelectorAll(".ts-pager")];
  const PER_PAGE = 30;
  // remember the page, so coming back from a variety page lands where you were
  try { state.page = Math.max(1, parseInt(sessionStorage.getItem("db-tuber-page"), 10) || 1); } catch { state.page = 1; }

  function filtered() {
    let list = tubers.filter((t) =>
      (!state.colors.size || t.colors.some((c) => state.colors.has(c))) &&
      (!state.form || t.form === state.form) &&
      (!state.price || PRICES.find((p) => p.id === state.price).test(t.price)) &&
      (!state.available || !t.soldOut));
    const byName = (a, b) => a.title.localeCompare(b.title);
    if (state.sort === "az") list.sort(byName);
    else if (state.sort === "za") list.sort((a, b) => byName(b, a));
    else if (state.sort === "low") list.sort((a, b) => a.price - b.price || byName(a, b));
    else if (state.sort === "high") list.sort((a, b) => b.price - a.price || byName(a, b));
    else list.sort((a, b) => (a.form === "Mixed" ? -1 : b.form === "Mixed" ? 1 : 0) || (!!a.soldOut - !!b.soldOut) || byName(a, b));
    return list;
  }

  function pagerHTML(page, pages) {
    const btn = (n, label, cls = "", aria = "") => `<button type="button" class="ts-page ${cls}" data-page="${n}"${aria}>${label}</button>`;
    return btn(page - 1, "‹ Prev", "ts-page--step", page === 1 ? " disabled" : ' aria-label="Previous page"') +
      Array.from({ length: pages }, (_, i) => btn(i + 1, i + 1, "", i + 1 === page ? ' aria-current="page"' : ` aria-label="Page ${i + 1}"`)).join("") +
      btn(page + 1, "Next ›", "ts-page--step", page === pages ? " disabled" : ' aria-label="Next page"');
  }

  function render(resetPage) {
    const list = filtered();
    const active = state.colors.size || state.form || state.price || state.available;
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (resetPage) state.page = 1;
    state.page = Math.min(Math.max(1, state.page), pages);
    try { sessionStorage.setItem("db-tuber-page", state.page); } catch {}
    const start = (state.page - 1) * PER_PAGE, shown = list.slice(start, start + PER_PAGE);
    count.textContent = pages > 1
      ? `Showing ${start + 1}–${start + shown.length} of ${list.length} varieties`
      : `Showing ${list.length} of ${tubers.length} varieties`;
    clearBtn.hidden = !active;
    pagers.forEach((nav) => { nav.hidden = pages < 2; nav.innerHTML = pages < 2 ? "" : pagerHTML(state.page, pages); });
    grid.innerHTML = list.length ? shown.map((t) => `
      ${cardHTML(t)}`).join("")
      : `<p class="ts-empty">No varieties match those filters. <button type="button" class="ts-clear-inline">Clear filters</button></p>`;
  }

  // ---------- filter events ----------
  root.querySelector(".ts-colors").addEventListener("change", (e) => {
    if (e.target.checked) state.colors.add(e.target.value); else state.colors.delete(e.target.value);
    render(true);
  });
  root.querySelector(".ts-form").addEventListener("change", (e) => { state.form = e.target.value; render(true); });
  root.querySelector(".ts-price").addEventListener("change", (e) => { state.price = e.target.value; render(true); });
  root.querySelector(".ts-sort").addEventListener("change", (e) => { state.sort = e.target.value; render(true); });
  root.querySelector(".ts-available").addEventListener("change", (e) => { state.available = e.target.checked; render(true); });
  function clearAll() {
    state.colors.clear(); state.form = ""; state.price = ""; state.available = false;
    root.querySelectorAll(".ts-colors input, .ts-available").forEach((i) => (i.checked = false));
    root.querySelector(".ts-form").value = ""; root.querySelector(".ts-price").value = "";
    render(true);
  }
  clearBtn.addEventListener("click", clearAll);
  pagers.forEach((nav) => nav.addEventListener("click", (e) => {
    const b = e.target.closest("[data-page]");
    if (!b || b.disabled) return;
    state.page = +b.dataset.page;
    render();
    // jump to the top of the list, below the sticky header and category row
    const top = root.querySelector(".ts-status").getBoundingClientRect().top + window.scrollY - 150;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  }));
  grid.addEventListener("click", (e) => { if (e.target.closest(".ts-clear-inline")) clearAll(); });
  const toggle = root.querySelector(".ts-toggle");
  toggle.addEventListener("click", () => {
    const openNow = root.classList.toggle("filters-open");
    toggle.setAttribute("aria-expanded", openNow);
  });

  render();
})();
