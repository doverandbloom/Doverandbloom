/* ==========================================================
   Stripe webhook — keeps spot counts for U-pick and events accurate.

   Set up in Stripe Dashboard → Developers → Webhooks → Add endpoint:
     URL:    https://YOURDOMAIN/.netlify/functions/stripe-webhook
     Events: checkout.session.completed
             checkout.session.expired
             charge.refunded
   Then copy the signing secret (whsec_…) into Netlify as
     STRIPE_WEBHOOK_SECRET
   ========================================================== */

const Stripe = require("stripe");
const cap = require("../event-capacity.js");
const { CATALOG_SETTINGS } = require("../../../js/catalog.js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  const sig = event.headers["stripe-signature"];

  let evt;
  try {
    // Verifies the request really came from Stripe
    evt = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return { statusCode: 400, body: "Bad signature" };
  }

  try {
    const obj = evt.data.object;
    if (evt.type === "checkout.session.completed" || evt.type === "checkout.session.expired") {
      const wanted = cap.decode(obj.metadata?.spots);
      if (Object.keys(wanted).length) {
        if (evt.type === "checkout.session.completed") await cap.confirm(event, obj.id, wanted);
        else await cap.releaseHolds(event, obj.id, wanted);
      }
    }
    // Flower CSA: end the subscription automatically when the season ends
    if (evt.type === "checkout.session.completed" && obj.mode === "subscription" && obj.subscription) {
      const end = Math.floor(Date.parse(CATALOG_SETTINGS.csa.seasonEnd + "T23:59:00-06:00") / 1000);
      if (end > Date.now() / 1000) await stripe.subscriptions.update(obj.subscription, { cancel_at: end, proration_behavior: "none" });
    }
    if (evt.type === "charge.refunded" && obj.refunded && obj.payment_intent) {
      // Full refund → give the spots back
      const sessions = await stripe.checkout.sessions.list({ payment_intent: obj.payment_intent, limit: 1 });
      const s = sessions.data[0];
      const wanted = cap.decode(s?.metadata?.spots);
      if (s && Object.keys(wanted).length) await cap.cancel(event, s.id, wanted);
    }
  } catch (err) {
    console.error("Webhook handling error:", err.message);
    return { statusCode: 500, body: "Error" }; // Stripe will retry
  }
  return { statusCode: 200, body: "ok" };
};
