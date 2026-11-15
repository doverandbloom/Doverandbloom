/* ==========================================================
   On-demand class downloads.

   GET /.netlify/functions/class-downloads?session_id=cs_...
   → { classes: [{ id, name, length, url }], farm: { address, map } }

   "farm" is included only when the order includes a visit to the farm
   (tickets, classes, bulk pickup or CSA pickup). The address lives in
   netlify/lib/farm.js, not in the public website code.

   Download links are given out only after Stripe confirms the order
   was paid. The links themselves are kept in Netlify environment
   variables, never in the public website code:

     CLASS_URL_ONDEMAND_REGENERATIVE
     CLASS_URL_ONDEMAND_COMPOST
     CLASS_URL_ONDEMAND_SOIL
     CLASS_URL_ONDEMAND_COVER_CROPS
     CLASS_URL_ONDEMAND_DAHLIAS

   Each one is a share link to the video (Google Drive, Vimeo, Dropbox…)
   with downloading allowed. See README.md.
   ========================================================== */

const Stripe = require("stripe");
const { CATALOG } = require("../../js/catalog.js");
const { FARM_ADDRESS, mapsLink } = require("../lib/farm.js");

const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});
const envName = (id) => "CLASS_URL_" + id.toUpperCase().replace(/-/g, "_");

exports.handler = async (event) => {
  const sessionId = (event.queryStringParameters || {}).session_id || "";
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) return json(400, { error: "Missing or invalid order link." });
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: "Downloads are not configured yet." });

  try {
    const session = await Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(sessionId);
    // "no_payment_required" = a Flower CSA whose first charge is on the first delivery day
    if (!["paid", "no_payment_required"].includes(session.payment_status)) return json(402, { error: "This order hasn't been paid yet." });
    const paid = session.payment_status === "paid";
    const ids = paid ? String(session.metadata?.ondemand || "").split(",").filter((id) => CATALOG[id]?.kind === "ondemand") : [];
    return json(200, {
      ...(session.metadata?.farm_visit === "yes" && { farm: { address: FARM_ADDRESS, map: mapsLink(FARM_ADDRESS) } }),
      classes: ids.map((id) => ({ id, name: CATALOG[id].name.replace(/^On-Demand Class: /, ""), length: CATALOG[id].length, url: process.env[envName(id)] || null })),
    });
  } catch (err) {
    console.error("class-downloads:", err.message);
    return json(404, { error: "We couldn't find that order." });
  }
};
