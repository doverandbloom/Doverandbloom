/* ==========================================================
   Secure checkout — creates a Stripe Checkout Session.

   Why this is secure:
   • Card details are typed on Stripe's PCI-compliant hosted page,
     never on our site, so we never see or store card numbers.
   • Prices come from js/catalog.js on the SERVER. Whatever price a
     browser sends is ignored, so nobody can tamper with totals.
   • U-pick days (15) and happy hours, classes, yoga and brunch (20 each) have limited spots. Spots are
     checked and held here, then confirmed by stripe-webhook.js.
   • Tickets for on-farm activities are rejected unless the buyer
     has signed the current version of the Terms & Liability Waiver.
     The signature, timestamp and terms version are saved on the
     Stripe payment so you have a record for every order.

   Required environment variable (Netlify → Site settings → Env vars):
     STRIPE_SECRET_KEY = sk_live_… (or sk_test_… while testing)
   Optional:
     STRIPE_TAX = "true"  → Stripe Tax calculates and adds sales tax at
       checkout. Turn on Stripe Tax and add your farm address in Stripe first.
     STRIPE_TOS_CONSENT = "true"  → also show Stripe's own required
       "I agree to the Terms of Service" checkbox. Only turn this on
       after adding your terms page URL in Stripe Dashboard →
       Settings → Public details, or Stripe will refuse the session.
   ========================================================== */

const Stripe = require("stripe");
const { CATALOG, CATALOG_SETTINGS, isValidSeriesDate, bulkPickupDates } = require("../../../js/catalog.js");
const capacity = require("../event-capacity.js");
const { FARM_ADDRESS } = require("../farm.js");
const SCHEDULES = CATALOG_SETTINGS.schedules;

const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

const clean = (v, max = 120) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max);

const prettyDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: "Checkout is not configured yet." });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Invalid request." }); }

  const items = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  if (!items.length) return json(400, { error: "Your basket is empty." });

  const lineItems = [];
  const metadata = { waiver_version: CATALOG_SETTINGS.waiverVersion };
  let needsShipping = false;
  let ticketCount = 0;
  let waiverRecord = null;
  let farmVisit = false; // true when the order brings someone to the farm
  const spotsWanted = {}; // { "<series>_<date>": spots }  (spots = people)

  // Flower CSA subscriptions are billed on their own schedule, so they check out separately
  const subs = items.filter((r) => CATALOG[r.id]?.kind === "subscription");
  if (subs.length && subs.length !== items.length) {
    return json(400, { error: "Please check out your Flower CSA subscription on its own. Remove the other items, then add them back after." });
  }
  if (subs.length > 1) return json(400, { error: "Please choose one Flower CSA plan per checkout." });

  for (const [i, raw] of items.entries()) {
    const product = CATALOG[raw.id];
    if (!product) return json(400, { error: "An item in your basket is no longer available." });
    if (product.soldOut) return json(400, { error: `${product.name} is sold out.` });

    const qty = Number(raw.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > CATALOG_SETTINGS.maxTicketsPerOrder) {
      return json(400, { error: `Please check the quantity for ${product.name}.` });
    }

    let description = "";
    if (product.kind === "series") {
      const sched = SCHEDULES[product.series];
      if (!sched || !isValidSeriesDate(product.series, raw.date)) {
        return json(400, { error: `Please choose one of the available dates for ${product.name}.` });
      }
      if (sched.capacity) { // only limited events are counted
        const key = capacity.keyFor(product.series, raw.date);
        spotsWanted[key] = (spotsWanted[key] || 0) + qty * (product.spots || 1);
      }
      description = `${prettyDate(raw.date)} · ${sched.time} · ${sched.receiptNote}`;
    } else if (product.kind === "pickup") {
      if (!bulkPickupDates(product).includes(raw.date)) {
        return json(400, { error: `Please choose an available Friday pickup date for ${product.name}.` });
      }
      const pal = CATALOG_SETTINGS.palettes[raw.palette];
      if (product.palette && !pal) return json(400, { error: `Please choose a color palette for ${product.name}.` });
      description = `${pal ? `Colors: ${pal.name} · ` : ""}Farm pickup ${prettyDate(raw.date)} · ${CATALOG_SETTINGS.bulk.time}`;
      metadata[`pickup_${i + 1}`] = `${raw.id} x${qty} | ${raw.date}${pal ? ` | colors: ${pal.name}` : ""}`;
    } else if (product.date) {
      if (product.date < new Date().toISOString().slice(0, 10)) {
        return json(400, { error: `${product.name} has already taken place.` });
      }
      description = `${prettyDate(product.date)} · ${product.time}`;
    }

    // ---- Terms & liability waiver gate ----
    if (product.onSite) {
      const w = raw.waiver || {};
      const signer = clean(w.signer, 100);
      if (w.accepted !== true || w.version !== CATALOG_SETTINGS.waiverVersion || signer.length < 3) {
        return json(400, {
          error: `Please read and sign the Terms & Liability Waiver for ${product.name}.`,
        });
      }
      if (w.minors && w.guardian !== true) {
        return json(400, { error: "A parent or legal guardian must agree on behalf of minors." });
      }
      if (product.adultsOnly && w.minors) {
        return json(400, { error: `${product.name} is for guests 21 and over.` });
      }
      ticketCount += qty * (product.spots || 1);
      description += `${description ? " · " : ""}Waiver signed by ${signer}`;
      waiverRecord = waiverRecord || { signer, at: clean(w.acceptedAt, 40), minors: !!w.minors };
      metadata[`item_${i + 1}`] = clean(
        `${raw.id} x${qty} | ${raw.date || product.date} | signed: ${signer} | minors: ${w.minors ? "yes (guardian agreed)" : "no"} | at: ${clean(w.acceptedAt, 40)}`,
        480
      );
    }

    if (CATALOG_SETTINGS.shipsKinds.includes(product.group)) needsShipping = true;

    if (product.kind === "ondemand") {
      if (qty !== 1) return json(400, { error: `${product.name} is a single download. Please choose 1.` });
      description = `${product.length} video class · Watch or download any time from your order confirmation page`;
      metadata.ondemand = [metadata.ondemand, raw.id].filter(Boolean).join(",");
    }

    if (product.kind === "subscription") {
      if (qty > 5) return json(400, { error: "Please choose up to 5 bouquets per delivery." });
      if (!["delivery", "pickup"].includes(raw.fulfillment)) return json(400, { error: "Please choose delivery or farm pickup for your Flower CSA." });
      const csa = CATALOG_SETTINGS.csa;
      const how = raw.fulfillment === "delivery"
        ? `delivered ${csa.deliveryDay}s ${csa.deliveryArea}`
        : `picked up at the farm ${csa.deliveryDay}s, ${csa.pickupTime}`;
      description = `${qty > 1 ? qty + " bouquets" : "One bouquet"} every ${product.per}, ${how}, ${prettyDate(csa.firstDelivery)} – ${prettyDate(csa.seasonEnd)}`;
      if (raw.fulfillment === "delivery") needsShipping = true;
      metadata.csa_plan = raw.id;
      metadata.csa_fulfillment = raw.fulfillment;
    }

    const visitsFarm = product.onSite || product.kind === "pickup" || (product.kind === "subscription" && raw.fulfillment === "pickup");
    if (visitsFarm) {
      farmVisit = true;
      description += `${description ? " · " : ""}Farm: ${FARM_ADDRESS}`;
    }

    lineItems.push({
      quantity: qty,
      price_data: {
        currency: CATALOG_SETTINGS.currency,
        unit_amount: product.price, // ← server-side price, never the browser's
        product_data: { name: product.name, ...(description && { description: clean(description, 300) }) },
        ...(product.kind === "subscription" && { recurring: { interval: product.interval, interval_count: product.intervalCount } }),
      },
    });
  }

  if (waiverRecord) {
    metadata.waiver_signer = waiverRecord.signer;
    metadata.waiver_accepted_at = waiverRecord.at || new Date().toISOString();
    metadata.ticket_count = String(ticketCount);
  }

  for (const [key, qty] of Object.entries(spotsWanted)) {
    if (qty > CATALOG_SETTINGS.maxTicketsPerOrder) return json(400, { error: `That's more guests than one order allows for ${SCHEDULES[key.split("_")[0]].name} on a single date.` });
  }
  const hasDated = Object.keys(spotsWanted).length > 0;
  if (hasDated) {
    metadata.spots = capacity.encode(spotsWanted);
    try { await capacity.checkRoom(event, spotsWanted); }
    catch (err) { return json(err.userFacing ? 409 : 500, { error: err.userFacing ? err.message : "We couldn't check availability. Please try again." }); }
  }

  // Visit details for Stripe's payment page (full details for one event type, short notes for several)
  const seriesInCart = [...new Set(items.map((i) => CATALOG[i.id]?.series).filter(Boolean))];
  const visitInfo = seriesInCart.length === 1
    ? `${SCHEDULES[seriesInCart[0]].name.toUpperCase()} DETAILS: ${SCHEDULES[seriesInCart[0]].details.join(" ")}`
    : seriesInCart.map((k) => `${SCHEDULES[k].name}: ${SCHEDULES[k].time}. ${SCHEDULES[k].receiptNote}.`).join("\n");
  const isSubscription = subs.length > 0;
  const csa = CATALOG_SETTINGS.csa;
  const firstChargeTs = Math.floor(Date.UTC(...csa.firstDelivery.split("-").map((n, i) => (i === 1 ? n - 1 : +n)), 15) / 1000);
  const deferFirstCharge = isSubscription && firstChargeTs - Date.now() / 1000 > 2 * 86400;
  if (farmVisit) metadata.farm_visit = "yes";
  const submitMessage = [
    farmVisit && `FARM ADDRESS: ${FARM_ADDRESS}. Check in at the front of the farm.`,
    isSubscription && `FLOWER CSA: Your first charge is on ${prettyDate(csa.firstDelivery)}, the day of your first delivery, and then every billing period until the season ends on ${prettyDate(csa.seasonEnd)}. Your subscription ends automatically after the season. You can cancel any time by emailing us.`,
    seriesInCart.length > 0 && visitInfo,
    waiverRecord && `By paying you confirm that you signed the Dover & Bloom Terms & Liability Waiver (version ${CATALOG_SETTINGS.waiverVersion}). Every adult in your party will also sign at check-in.`,
    !waiverRecord && !isSubscription && "By paying you agree to the Dover & Bloom Terms & Conditions.",
  ].filter(Boolean).join("\n\n").slice(0, 1200);

  const siteUrl = process.env.URL || `https://${event.headers.host}`;
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // unpaid sessions release their held spots after 30 min
      line_items: lineItems,
      metadata,
      ...(isSubscription
        ? { subscription_data: { metadata, description: "Dover & Bloom Flower CSA", ...(deferFirstCharge && { trial_end: firstChargeTs }) } }
        : { payment_intent_data: { metadata } }),
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      ...(needsShipping && { shipping_address_collection: { allowed_countries: ["US"] } }),
      ...(process.env.STRIPE_TOS_CONSENT === "true" && { consent_collection: { terms_of_service: "required" } }),
      ...(process.env.STRIPE_TAX === "true" && { automatic_tax: { enabled: true } }), // Stripe Tax adds sales tax at checkout
      custom_text: { submit: { message: submitMessage } },
      success_url: `${siteUrl}/order-confirmed.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop.html?checkout=cancelled`,
    });
    if (hasDated) {
      try {
        await capacity.placeHolds(event, session.id, spotsWanted, session.expires_at * 1000);
      } catch (err) {
        await stripe.checkout.sessions.expire(session.id).catch(() => {});
        return json(err.userFacing ? 409 : 500, { error: err.userFacing ? err.message : "We couldn't reserve your spot. Please try again." });
      }
    }
    return json(200, { url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    return json(502, { error: "We couldn't start checkout. Please try again in a moment." });
  }
};
