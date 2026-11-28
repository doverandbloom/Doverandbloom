/* ==========================================================
   Dover & Bloom — basket, ticket booking & waiver signing
   Needs js/catalog.js (prices) and js/main.js (showToast).
   Payment itself happens on Stripe's secure hosted page.
   ========================================================== */

(() => {
  const CHECKOUT_ENDPOINT = "/.netlify/functions/create-checkout";
  const S = CATALOG_SETTINGS;
  const money = (cents) => (cents === 0 ? "Free" : `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const prettyDate = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  };
  const needsBooking = (p) => p.onSite || p.kind === "series" || p.kind === "pickup" || p.kind === "subscription";
  const schedOf = (p) => (p.kind === "series" ? S.schedules[p.series] : null);

  // ---------- storage ----------
  const KEY = "db-basket-v2";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]").filter((i) => CATALOG[i.id] && !CATALOG[i.id].hidden); } catch { return []; } };
  let basket = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(basket)); } catch { /* private mode */ } renderAll(); };

  function addToBasket(entry) {
    const key = [entry.id, entry.date || "", entry.fulfillment || "", entry.palette || ""].join("|");
    const existing = basket.find((i) => i.key === key);
    if (existing) {
      existing.qty = Math.min(existing.qty + entry.qty, CATALOG[entry.id].kind === "ondemand" ? 1 : S.maxTicketsPerOrder);
      if (CATALOG[entry.id].kind === "ondemand") { renderAll(); return showToast("That class is already in your basket"); }
      if (entry.waiver) existing.waiver = entry.waiver; // most recent signature wins
    } else {
      basket.push({ ...entry, key });
    }
    save();
    showToast(`✿ ${CATALOG[entry.id].name} added to your basket`);
  }

  // ---------- show live prices / sold-out state from the catalog ----------
  document.querySelectorAll("[data-product]").forEach((btn) => {
    const p = CATALOG[btn.dataset.product];
    if (!p) return;
    const card = btn.closest(".product");
    const priceEl = card?.querySelector(".price");
    if (priceEl) priceEl.innerHTML = money(p.price) + (p.kind === "subscription" ? ` <small>/ ${esc(p.per)}</small>` : "");
    if (p.soldOut) {
      btn.disabled = true; btn.textContent = "Sold out"; btn.classList.add("btn--ghost");
      if (card && !card.classList.contains("is-sold-out")) {
        card.classList.add("is-sold-out");
        const spot = card.querySelector(".tuber-thumb, .art");
        if (spot) spot.insertAdjacentHTML("beforeend", '<span class="badge badge--sold">Sold out</span>');
      }
    }
  });

  // ---------- ticket / booking dialog ----------
  const dialog = document.createElement("dialog");
  dialog.className = "modal";
  document.body.appendChild(dialog);

  // ---------- Availability (spots left per event date) ----------
  const AVAIL_ENDPOINT = "/.netlify/functions/event-availability";
  let availCache = null;
  async function loadAvailability() {
    if (availCache) return availCache;
    try {
      const res = await fetch(AVAIL_ENDPOINT, { cache: "no-store" });
      if (!res.ok) throw new Error();
      availCache = (await res.json()).series || null;
      setTimeout(() => (availCache = null), 60000); // refresh after a minute
    } catch { availCache = null; }
    return availCache; // null → counts unknown (e.g. previewing locally)
  }
  window.dbLoadAvailability = loadAvailability; // shared with the schedule grids below
  const spotsLabel = (n) => (n == null ? "" : n <= 0 ? " · SOLD OUT" : n <= 5 ? ` · only ${n} left` : ` · ${n} spots left`);
  const visitDetailsHTML = (sched) => `
    <div class="visit-details">
      <p><strong>Good to know</strong></p>
      <ul>${sched.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
    </div>`;

  function openBooking(id, presetDate) {
    const p = CATALOG[id];
    const today = new Date().toISOString().slice(0, 10);
    const sched = schedOf(p);
    const dates = sched ? seriesDates(p.series).filter((d) => d >= today) : [];
    // Ticket-type dropdown (e.g. happy hour: single or plus-one) for schedules with ticketChoice
    const choices = sched && sched.ticketChoice ? Object.keys(CATALOG).filter((k) => CATALOG[k].series === p.series).sort((a, b) => CATALOG[a].spots - CATALOG[b].spots) : null;
    const isUpick = p.series === "upick";
    const choiceLabel = (k) => (CATALOG[k].spots === 2 ? (isUpick ? "Plus-one bundle · 2 people, 2 jars" : "Plus-one · 2 people") : (isUpick ? "Single ticket · 1 jar" : "Single · 1 person"));
    const choiceUnit = (k) => (CATALOG[k].spots === 2 ? (isUpick ? "per bundle · 2 tickets, 2 jars" : "per plus-one ticket · 2 people") : (isUpick ? "per ticket · one jar" : "per person"));
    const bundle = !choices && sched && p.spots === 1 ? Object.entries(CATALOG).find(([, q]) => q.series === p.series && q.spots === 2) : null;
    const unitLabel = p.unit ? `per ${p.unit} · 2 people` : p.kind === "subscription" ? `per bouquet · every ${p.per}` : p.spots === 2 ? (p.series === "upick" ? "per bundle · 2 tickets, 2 jars" : "per bundle · 2 people")
      : `per ${p.kind === "pickup" ? (id === "bulk-diy-event" ? "package" : "bucket") : sched ? sched.unit : p.kind === "class" ? "seat" : "ticket"}`;

    dialog.innerHTML = `
      <form method="dialog" class="modal-body" novalidate>
        <button type="button" class="modal-close" aria-label="Close">×</button>
        <p class="eyebrow">${p.onSite ? "Book your visit" : p.kind === "pickup" ? "Pre-order" : p.kind === "subscription" ? "Flower CSA" : "Register"}</p>
        <h2>${esc(p.name)}</h2>
        <p class="modal-price">${money(p.price)} <span>${unitLabel}</span></p>
        ${bundle ? `<p class="hint">Bringing a friend? The <strong>Plus-One</strong> is ${money(bundle[1].price)} for two (you save ${money(p.price * 2 - bundle[1].price)}).</p>` : ""}

        ${choices ? `
          <label>Ticket type
            <select name="ticket">${choices.map((k) => `<option value="${k}"${k === id ? " selected" : ""}>${choiceLabel(k)} · ${money(CATALOG[k].price)}</option>`).join("")}</select>
          </label>` : ""}
        ${sched && dates.length > 1 ? `
          <label>Choose your date
            <select name="date" required>
              <option value="">Select a date…</option>
              ${dates.map((d) => `<option value="${d}">${prettyDate(d)} · ${esc(sched.time)}</option>`).join("")}
            </select>
          </label>
          <p class="hint">${esc(sched.summary)}, ${esc(sched.time)}.${sched.capacity ? ` Limited to ${sched.capacity} ${p.series === "upick" ? "tickets" : "people"} per date${p.series === "upick" ? ". Each ticket = one jar of flowers" : ""}.` : ""}</p>` : ""}
        ${sched && dates.length === 1 ? `<input type="hidden" name="date" value="${dates[0]}"><p class="when">📅 ${prettyDate(dates[0])} · ${esc(sched.time)} <span class="spots-one"></span></p>${sched.capacity ? `<p class="hint">Limited to ${sched.capacity} people.</p>` : ""}` : ""}
        ${sched && !dates.length ? `<p class="when">This event has already taken place.</p>` : ""}
        ${sched ? visitDetailsHTML(sched) : ""}
        ${p.kind === "pickup" ? `
          <label>Farm pickup date
            <select name="date" required>
              <option value="">Select a Friday…</option>
              ${bulkPickupDates(p).map((d) => `<option value="${d}">${prettyDate(d)} · ${esc(S.bulk.time)}</option>`).join("")}
            </select>
          </label>
          ${p.palette ? `
          <fieldset class="choice">
            <legend>Choose your colors</legend>
            ${Object.entries(S.palettes).map(([k, v]) => `<label class="check"><input type="radio" name="palette" value="${k}"><span><strong>${esc(v.name)}</strong><br><small class="swatch-${k}">${esc(v.hint)}</small></span></label>`).join("")}
          </fieldset>` : ""}
          <p class="hint">Pickup is at the farm on Fridays, ${esc(S.bulk.time)}. Please order at least ${S.bulk.leadDays} days ahead. Flowers come in water, ready to arrange.</p>` : ""}
        ${p.kind === "subscription" ? `
          <fieldset class="choice">
            <legend>How would you like your bouquets?</legend>
            <label class="check"><input type="radio" name="fulfillment" value="delivery"><span><strong>Delivery</strong> on Fridays to homes and offices ${esc(S.csa.deliveryArea)}</span></label>
            <label class="check"><input type="radio" name="fulfillment" value="pickup"><span><strong>Farm pickup</strong> on Fridays, ${esc(S.csa.pickupTime)}</span></label>
          </fieldset>
          <p class="hint">Live more than 5 miles away? Please choose farm pickup. If your delivery address is outside our area, we'll contact you to switch to pickup.</p>
          <p class="when">First ${p.per === "month" ? "bouquet" : "delivery"} ${prettyDate(S.csa.firstDelivery)} · season ends ${prettyDate(S.csa.seasonEnd)}. Nothing is charged today.</p>` : ""}
        ${p.date ? `<p class="when">📅 ${prettyDate(p.date)} · ${esc(p.time)}</p>` : ""}

        <label class="qty-label">Number of ${p.unit ? `${p.unit}s` : p.kind === "subscription" ? "bouquets each time" : p.kind === "pickup" ? (id === "bulk-diy-event" ? "packages" : "buckets") : p.spots === 2 ? "bundles (2 people each)" : sched && sched.unit === "seat" ? "seats" : sched && sched.unit === "person" ? "people" : p.kind === "class" ? "seats" : "tickets"}
          <input type="number" name="qty" value="1" min="1" max="${S.maxTicketsPerOrder}" required>
        </label>

        ${p.onSite ? `
        <fieldset class="waiver">
          <legend>Terms &amp; Liability Waiver <span class="req">required</span></legend>
          <div class="waiver-summary" tabindex="0">
            <p><strong>Please read before you buy.</strong> Dover &amp; Bloom is a working farm. By booking you agree that:</p>
            <ul>
              <li>Farm visits have <strong>inherent risks</strong>, including <strong>bee and wasp stings</strong>, uneven ground, sharp tools, thorny or irritating plants, sun, heat and sudden weather, and you <strong>voluntarily assume these risks</strong>.</li>
              <li>You <strong>release Dover &amp; Bloom</strong>, its owners, family members, staff and volunteers <strong>from liability</strong> for injury, illness, loss or damage, including claims arising from <strong>ordinary negligence</strong>, to the fullest extent allowed by Colorado law.</li>
              <li>You will follow farm rules and staff directions, supervise any children at all times, and carry any medication you need (such as an epinephrine auto-injector).</li>
              <li>Every adult in your party will also sign this waiver at check-in.</li>
            </ul>
            <p><a href="terms.html#waiver" target="_blank" rel="noopener">Read the full Terms &amp; Conditions and Liability Waiver ↗</a></p>
          </div>

          <label>Full legal name of purchaser (your electronic signature)
            <input type="text" name="signer" autocomplete="name" minlength="3" maxlength="100" required placeholder="First and last name">
          </label>

          ${p.adultsOnly ? `<p class="hint">This event is for guests 21 and over.</p>` : `
          <label class="check"><input type="checkbox" name="minors"><span>Guests under 18 will be in my party</span></label>
          <label class="check guardian" hidden><input type="checkbox" name="guardian"><span>I am the parent or legal guardian of every minor in my party (or have written permission from their parent or guardian), and I agree to these terms <strong>on their behalf</strong>.</span></label>`}

          <label class="check"><input type="checkbox" name="agree" required><span>I am 18 or older. I have read and agree to the <a href="terms.html" target="_blank" rel="noopener">Terms &amp; Conditions</a>, including the <strong>Assumption of Risk and Release of Liability</strong>. I understand that I am <strong>giving up legal rights</strong>, including the right to sue.</span></label>
        </fieldset>` : ""}

        <p class="form-error" role="alert"></p>
        <div class="modal-actions">
          <button type="button" class="btn btn--ghost modal-cancel">Cancel</button>
          <button type="submit" class="btn">${p.onSite ? "Sign &amp; add to basket" : "Add to basket"}</button>
        </div>
      </form>`;

    const form = dialog.querySelector("form");
    const err = form.querySelector(".form-error");
    const close = () => dialog.close();
    form.querySelector(".modal-close").onclick = close;
    form.querySelector(".modal-cancel").onclick = close;

    // Update the price line and quantity label when the ticket type changes
    if (form.elements.ticket) form.elements.ticket.onchange = () => {
      const k = form.elements.ticket.value;
      form.querySelector(".modal-price").innerHTML = `${money(CATALOG[k].price)} <span>${choiceUnit(k)}</span>`;
      form.querySelector(".qty-label").firstChild.textContent = CATALOG[k].spots === 2 ? (isUpick ? "Number of bundles " : "Number of plus-one tickets ") : (isUpick ? "Number of tickets " : "Number of people ");
    };

    const minors = form.elements.minors;
    if (minors) minors.onchange = () => { form.querySelector(".guardian").hidden = !minors.checked; };

    form.onsubmit = (e) => {
      e.preventDefault();
      err.textContent = "";
      const f = form.elements;
      const qty = Number(f.qty.value);
      if (!Number.isInteger(qty) || qty < 1 || qty > S.maxTicketsPerOrder) return (err.textContent = `Please choose 1–${S.maxTicketsPerOrder} tickets.`);

      const pid = f.ticket ? f.ticket.value : id; // chosen ticket type, if there is a dropdown
      const pp = CATALOG[pid];
      const entry = { id: pid, qty };
      if (p.kind === "subscription") {
        if (qty > 5) return (err.textContent = "Please choose up to 5 bouquets each time.");
        const how = f.fulfillment.value;
        if (!how) return (err.textContent = "Please choose delivery or farm pickup.");
        entry.fulfillment = how;
      }
      if (p.kind === "pickup") {
        if (!bulkPickupDates(p).includes(f.date.value)) return (err.textContent = "Please choose a Friday pickup date.");
        if (p.palette && !f.palette.value) return (err.textContent = "Please choose your colors: bright & bold, or neutral, pastel & blush.");
        entry.date = f.date.value;
        if (p.palette) entry.palette = f.palette.value;
      }
      if (sched) {
        if (!f.date || !isValidSeriesDate(p.series, f.date.value)) return (err.textContent = "Please choose one of the available dates.");
        const left = sched.capacity && form.dataset.avail ? JSON.parse(form.dataset.avail)[f.date.value] : null;
        // single and plus-one tickets share the same spots; a plus-one uses 2
        const inBasket = basket.filter((i) => CATALOG[i.id].series === p.series && i.date === f.date.value).reduce((n, i) => n + i.qty * (CATALOG[i.id].spots || 1), 0);
        const need = qty * (pp.spots || 1);
        if (left != null && need + inBasket > left) {
          const rest = left - inBasket;
          return (err.textContent = rest <= 0 ? "Sorry, that date is sold out." : `Only ${rest} spot${rest === 1 ? "" : "s"} left on that date${pp.spots === 2 ? ` (each ${pp.unit || "plus-one"} uses 2)` : ""}.`);
        }
        entry.date = f.date.value;
      }
      if (p.onSite) {
        const signer = f.signer.value.trim();
        if (signer.length < 3 || !signer.includes(" ")) return (err.textContent = "Please type your full first and last name to sign.");
        if (f.minors?.checked && !f.guardian.checked) return (err.textContent = "Please confirm you are the parent or guardian of the minors in your party.");
        if (!f.agree.checked) return (err.textContent = "Please agree to the Terms & Liability Waiver to continue.");
        entry.waiver = {
          accepted: true,
          version: S.waiverVersion,
          signer,
          minors: !!f.minors?.checked,
          guardian: !!f.guardian?.checked,
          acceptedAt: new Date().toISOString(),
        };
      }
      addToBasket(entry);
      close();
    };

    dialog.showModal();
    if (presetDate && form.elements.date && form.elements.date.tagName === "SELECT") form.elements.date.value = presetDate;

    // Fill in live "spots left" for each date
    if (sched) {
      loadAvailability().then((all) => {
        const avail = all && all[p.series];
        if (!avail) return;
        form.dataset.avail = JSON.stringify(avail);
        form.querySelectorAll('select[name="date"] option[value]').forEach((o) => {
          if (!o.value) return;
          const n = avail[o.value];
          o.textContent = `${prettyDate(o.value)} · ${sched.time}${spotsLabel(n)}`;
          o.disabled = n != null && n <= 0;
        });
        const one = form.querySelector(".spots-one");
        if (one && dates[0]) one.textContent = spotsLabel(avail[dates[0]]);
      });
    }
  }

  // ---------- basket drawer ----------
  const drawer = document.createElement("aside");
  drawer.className = "drawer";
  drawer.setAttribute("aria-label", "Your basket");
  drawer.innerHTML = `
    <div class="drawer-scrim" data-close></div>
    <div class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="drawer-head"><h2 id="drawer-title">Your Basket</h2><button class="modal-close" data-close aria-label="Close">×</button></div>
      <div class="drawer-items"></div>
      <div class="drawer-foot">
        <div class="subtotal"><span>Due today</span><strong class="drawer-total">$0</strong></div>
        <p class="csa-note" hidden></p>
        <p class="hint">Shipping (tubers) and any taxes are calculated at checkout.</p>
        <p class="form-error drawer-error" role="alert"></p>
        <button class="btn btn-checkout" type="button">Secure Checkout</button>
        <p class="secure-note">🔒 Payments are processed by Stripe. Your card details are encrypted and never touch our website. <a href="terms.html#purchases">Store policies</a></p>
      </div>
    </div>`;
  document.body.appendChild(drawer);
  const itemsEl = drawer.querySelector(".drawer-items");

  const openDrawer = () => { drawer.classList.add("open"); document.body.style.overflow = "hidden"; };
  const closeDrawer = () => { drawer.classList.remove("open"); document.body.style.overflow = ""; };
  drawer.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeDrawer(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  function renderAll() {
    const count = basket.reduce((n, i) => n + i.qty, 0);
    document.querySelectorAll(".cart-count").forEach((el) => (el.textContent = count));

    if (!basket.length) {
      itemsEl.innerHTML = `<p class="empty">Your basket is empty.<br><a href="shop.html">Browse the shop</a></p>`;
    } else {
      itemsEl.innerHTML = basket.map((i) => {
        const p = CATALOG[i.id];
        const when = i.date ? (p.kind === "pickup" ? `Farm pickup ${prettyDate(i.date)} · ${esc(S.bulk.time)}` : `${prettyDate(i.date)} · ${esc(schedOf(p)?.time || "")}`) : p.date ? `${prettyDate(p.date)} · ${esc(p.time)}` : "";
        return `
          <div class="line" data-key="${esc(i.key)}">
            <div>
              <h3>${esc(p.name)}</h3>
              ${when ? `<p class="line-meta">${when}</p>` : ""}
              ${i.palette ? `<p class="line-meta">Colors: ${esc(S.palettes[i.palette].name)}</p>` : ""}
              ${i.waiver ? `<p class="line-waiver">✓ Waiver signed by ${esc(i.waiver.signer)}</p>` : ""}
              ${schedOf(p) ? `<p class="line-meta">${esc(schedOf(p).receiptNote)}</p>` : ""}
              ${p.pickup ? `<p class="line-meta">Farm pickup in May</p>` : ""}
              ${p.kind === "ondemand" ? `<p class="line-meta">${esc(p.length)} video · watch or download any time after checkout</p>` : ""}
              ${p.kind === "subscription" ? `<p class="line-meta">${i.fulfillment === "pickup" ? `Farm pickup ${esc(S.csa.deliveryDay)}s, ${esc(S.csa.pickupTime)}` : `Delivered ${esc(S.csa.deliveryDay)}s ${esc(S.csa.deliveryArea)}`} · ${prettyDate(S.csa.firstDelivery)} – ${prettyDate(S.csa.seasonEnd)}</p>` : ""}
              <div class="stepper">
                <button type="button" data-step="-1" aria-label="Decrease">−</button>
                <span>${i.qty}</span>
                <button type="button" data-step="1" aria-label="Increase">+</button>
                <button type="button" class="remove" data-remove>Remove</button>
              </div>
            </div>
            <strong>${money(p.price * i.qty)}${p.kind === "subscription" ? `<small> / ${esc(p.per)}</small>` : ""}</strong>
          </div>`;
      }).join("");
    }
    const isSub = (i) => CATALOG[i.id].kind === "subscription";
    const subs = basket.filter(isSub), others = basket.filter((i) => !isSub(i));
    const total = others.reduce((s, i) => s + CATALOG[i.id].price * i.qty, 0);
    drawer.querySelector(".drawer-total").textContent = total === 0 ? "$0" : money(total);
    const note = drawer.querySelector(".csa-note");
    note.hidden = !subs.length;
    if (subs.length) {
      const p = CATALOG[subs[0].id];
      note.innerHTML = subs.length > 1 || others.length
        ? `<strong>Your Flower CSA checks out on its own.</strong> Please keep just one CSA plan in your basket and buy other items separately.`
        : `<strong>Flower CSA:</strong> ${money(p.price * subs[0].qty)} every ${esc(p.per)}. Nothing is charged today. Your first charge is on ${prettyDate(S.csa.firstDelivery)}, your first delivery day.`;
    }
    drawer.querySelector(".btn-checkout").disabled = !basket.length || (subs.length > 0 && (subs.length > 1 || others.length > 0));
  }

  itemsEl.addEventListener("click", (e) => {
    const line = e.target.closest(".line");
    if (!line) return;
    const item = basket.find((i) => i.key === line.dataset.key);
    if (e.target.closest("[data-remove]")) basket = basket.filter((i) => i !== item);
    const step = e.target.closest("[data-step]");
    if (step) {
      item.qty += Number(step.dataset.step);
      if (item.qty < 1) basket = basket.filter((i) => i !== item);
      item.qty = Math.min(item.qty, CATALOG[item.id].kind === "ondemand" ? 1 : S.maxTicketsPerOrder);
    }
    save();
  });

  // ---------- checkout ----------
  const checkoutBtn = drawer.querySelector(".btn-checkout");
  const drawerErr = drawer.querySelector(".drawer-error");
  checkoutBtn.addEventListener("click", async () => {
    drawerErr.textContent = "";
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Connecting to secure checkout…";
    try {
      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only ids, quantities, dates and waiver details are sent. Prices are looked up on the server.
        body: JSON.stringify({ items: basket.map(({ id, qty, date, waiver, fulfillment, palette }) => ({ id, qty, date, waiver, fulfillment, palette })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) availCache = null;
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout isn't available right now.");
      window.location.href = data.url; // → Stripe-hosted payment page
    } catch (e) {
      drawerErr.textContent = e.message === "Failed to fetch" ? "Checkout isn't connected yet. Please try again later." : e.message;
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = "Secure Checkout";
    }
  });

  // ---------- wire up buttons ----------
  document.addEventListener("click", (e) => {
    if (e.target.closest(".cart-link")) { e.preventDefault(); openDrawer(); return; }
    const btn = e.target.closest("[data-product]");
    if (!btn || btn.disabled) return;
    const p = CATALOG[btn.dataset.product];
    if (!p) return;
    if (needsBooking(p) || p.kind === "class") openBooking(btn.dataset.product, btn.dataset.date);
    else {
      // a quantity dropdown next to the button (e.g. dahlia tuber pages)
      const pick = btn.dataset.qtyFrom && btn.closest("div, section, article")?.querySelector(btn.dataset.qtyFrom);
      const qty = Math.max(1, Math.min(parseInt(pick?.value, 10) || 1, S.maxTicketsPerOrder));
      addToBasket({ id: btn.dataset.product, qty });
    }
  });

  // Clear basket after a successful order; note a cancelled checkout
  if (document.body.dataset.page === "order-confirmed") { basket = []; save(); }
  if (new URLSearchParams(location.search).get("checkout") === "cancelled") {
    setTimeout(() => showToast("Checkout cancelled. Your basket is saved."), 300);
  }

  renderAll();
})();

/* ---------- Date grids on the Shop page (U-pick, recurring events) ----------
   <div class="upick-schedule" data-series="happyhour,bouquet,brunch"></div> */
(() => {
  const boxes = document.querySelectorAll(".upick-schedule");
  if (!boxes.length) return;
  const SCH = CATALOG_SETTINGS.schedules;
  const today = new Date().toISOString().slice(0, 10);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }); };
  // "8:00 – 10:00 am" / "5:30 pm" → minutes after midnight of the start time
  const startMin = (t) => { const m = t.match(/(\d+):(\d+)\s*(?:–[^ap]*)?(am|pm)?/i); const ap = (t.match(/(am|pm)/i) || [])[1]; let h = +m[1] % 12; if (/pm/i.test(m[3] || ap) && !(/am/i.test(m[3] || "") )) h += 12; return h * 60 + +m[2]; };
  const bookId = (k) => Object.keys(CATALOG).find((id) => CATALOG[id].series === k && CATALOG[id].spots === 1);
  const month = (iso) => { const [y, m] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }); };
  const renderList = (box, list, avail) => {
    const rows = list.flatMap((k) => seriesDates(k).map((d) => ({ k, d }))).filter((r) => r.d >= today)
      .sort((a, b) => (a.d !== b.d ? (a.d < b.d ? -1 : 1) : startMin(SCH[a.k].time) - startMin(SCH[b.k].time)));
    let cur = "";
    box.innerHTML = rows.map(({ k, d }) => {
      const n = avail && avail[k] ? avail[k][d] : null;
      const sold = n != null && n <= 0;
      const spots = n == null ? "" : sold ? "Sold out" : n <= 5 ? `Only ${n} left` : `${n} spots left`;
      const head = month(d) !== cur ? `<h4 class="sched-month">${(cur = month(d))}</h4>` : "";
      return `${head}<div class="sched-row${sold ? " sold" : ""}${n != null && n <= 5 && !sold ? " low" : ""}" data-s="${k}">
        <span class="sched-date">${fmt(d)}</span>
        <span class="sched-name">${SCH[k].name}<small>${SCH[k].time}</small></span>
        <span class="sched-spots">${spots}</span>
        <button type="button" class="btn btn--small${sold ? " btn--ghost" : ""}" data-product="${bookId(k)}" data-date="${d}" ${sold ? "disabled" : ""}>${sold ? "Full" : "Book"}</button>
      </div>`;
    }).join("");
  };
  const render = (avail) => boxes.forEach((box) => {
    const list = (box.dataset.series || "upick").split(",");
    if (list.length > 1) return renderList(box, list, avail);
    // One series (U-pick): a dropdown of upcoming days with spots left, plus a Book button
    const k = list[0];
    const id = bookId(k);
    const days = seriesDates(k).filter((d) => d >= today);
    const left = (d) => (avail && avail[k] ? avail[k][d] : null);
    const prev = box.querySelector("select")?.value;
    const firstOpen = days.find((d) => !(left(d) != null && left(d) <= 0));
    const chosen = prev && days.includes(prev) && !(left(prev) != null && left(prev) <= 0) ? prev : firstOpen;
    const selId = `date-pick-${k}`;
    if (!days.length) { box.innerHTML = `<p class="date-pick-note">This season's ${esc(SCH[k].name)} days have passed. Sign up for our newsletter to hear about next season first.</p>`; return; }
    box.classList.add("date-pick");
    box.innerHTML = `
      <label for="${selId}">Choose a day</label>
      <div class="date-pick-row">
        <select id="${selId}">${days.map((d) => {
          const n = left(d);
          const sold = n != null && n <= 0;
          const note = n == null ? SCH[k].time : sold ? "Sold out" : n <= 5 ? `Only ${n} left` : `${n} of ${SCH[k].capacity} spots left`;
          return `<option value="${d}"${sold ? " disabled" : ""}${d === chosen ? " selected" : ""}>${fmt(d)} · ${note}</option>`;
        }).join("")}</select>
        <button type="button" class="btn" data-product="${id}" data-date="${chosen || ""}"${chosen ? "" : " disabled"}>${chosen ? "Book this day" : "Sold out"}</button>
      </div>
      <p class="date-pick-note">${esc(SCH[k].time)} · ${days.length} days left this season${avail ? "" : " · checking spots…"}</p>`;
    const sel = box.querySelector("select"), btn = box.querySelector("button");
    sel.addEventListener("change", () => { btn.dataset.date = sel.value; });
  });
  render(null);
  (window.dbLoadAvailability ? window.dbLoadAvailability() : Promise.resolve(null)).then((a) => a && render(a));
})();

/* ---------- Date lists on event cards ----------
   <p class="card-dates" data-dates-for="happyhour"></p> → "Dates: Jun 17 · Jul 1, 15, 29 · …" */
(() => {
  const today = new Date().toISOString().slice(0, 10);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  document.querySelectorAll("[data-dates-for]").forEach((el) => {
    const groups = [];
    seriesDates(el.dataset.datesFor).filter((d) => d >= today).forEach((d) => {
      const m = MON[+d.slice(5, 7) - 1], day = +d.slice(8, 10);
      const last = groups[groups.length - 1];
      if (last && last.m === m) last.days.push(day); else groups.push({ m, days: [day] });
    });
    el.innerHTML = groups.length
      ? `<strong>Dates:</strong> ${groups.map((g) => `${g.m} ${g.days.join(", ")}`).join(" · ")}`
      : "<strong>Dates:</strong> all dates for this season have passed";
  });
})();
