/* ==========================================================
   Capacity tracking for dated events: U-pick (15/day) and
   happy hours, classes, yoga and brunch (20 each). Schedules with
   capacity: null (one-time special events) are not limited.
   Limits come from CATALOG_SETTINGS.schedules in js/catalog.js.

   Stored in Netlify Blobs, one record per "<series>_<date>" key:
     { confirmed: { <stripe session id>: qty },
       holds:     { <stripe session id>: { qty, exp } } }

   • A HOLD is placed when a customer starts checkout, so two
     people can't both buy the last spots at once. Holds expire
     when the Stripe checkout session expires (30 minutes).
   • The Stripe webhook turns a hold into CONFIRMED after payment,
     or releases it if checkout is abandoned or fully refunded.
   ========================================================== */

const { getStore, connectLambda } = require("@netlify/blobs");
const { CATALOG_SETTINGS, seriesDates } = require("../../js/catalog.js");

const SCHEDULES = CATALOG_SETTINGS.schedules;
const keyFor = (series, date) => `${series}_${date}`;
const capFor = (key) => SCHEDULES[key.split("_")[0]]?.capacity ?? 0;

function store(event) {
  if (event && event.blobs) connectLambda(event); // Lambda-style functions need this
  return getStore({ name: "event-capacity", consistency: "strong" });
}

const empty = () => ({ confirmed: {}, holds: {} });
const sum = (obj, fn = (v) => v) => Object.values(obj).reduce((n, v) => n + fn(v), 0);
const readDay = async (s, key) => (await s.get(key, { type: "json" })) || empty();
const taken = (day, now = Date.now()) =>
  sum(day.confirmed) + sum(Object.values(day.holds).filter((h) => h.exp > now), (h) => h.qty);

const userError = (msg) => Object.assign(new Error(msg), { userFacing: true });
const fullMsg = (key, left) => {
  const name = SCHEDULES[key.split("_")[0]]?.name || "That date";
  return left > 0 ? `Only ${left} spot${left === 1 ? "" : "s"} left for ${name} on that date.` : `Sorry, ${name} on that date just sold out.`;
};

/** { upick: { "2027-06-19": spotsLeft, … }, happyhour: {…}, … } */
async function availability(event) {
  const s = store(event);
  const out = {};
  await Promise.all(Object.keys(SCHEDULES).filter((k) => SCHEDULES[k].capacity).map(async (series) => {
    out[series] = {};
    await Promise.all(seriesDates(series).map(async (date) => {
      const key = keyFor(series, date);
      out[series][date] = Math.max(0, capFor(key) - taken(await readDay(s, key)));
    }));
  }));
  return out;
}

/** `wanted` = { "<series>_<date>": spots }. Throws a friendly error if any lacks room. */
async function checkRoom(event, wanted) {
  const s = store(event);
  for (const [key, qty] of Object.entries(wanted)) {
    const left = capFor(key) - taken(await readDay(s, key));
    if (qty > left) throw userError(fullMsg(key, left));
  }
}

/** Place holds for a checkout session; re-checks room to guard against races. */
async function placeHolds(event, sessionId, wanted, expiresAtMs) {
  const s = store(event);
  for (const [key, qty] of Object.entries(wanted)) {
    const day = await readDay(s, key);
    for (const [id, h] of Object.entries(day.holds)) if (h.exp <= Date.now()) delete day.holds[id];
    day.holds[sessionId] = { qty, exp: expiresAtMs };
    await s.setJSON(key, day);
    if (taken(day) > capFor(key)) {
      await releaseHolds(event, sessionId, wanted);
      throw userError(fullMsg(key, 0));
    }
  }
}

async function confirm(event, sessionId, wanted) {
  const s = store(event);
  for (const [key, qty] of Object.entries(wanted)) {
    const day = await readDay(s, key);
    delete day.holds[sessionId];
    day.confirmed[sessionId] = qty; // paid = always counted, even if the hold had expired
    await s.setJSON(key, day);
  }
}

async function releaseHolds(event, sessionId, wanted) {
  const s = store(event);
  for (const key of Object.keys(wanted)) {
    const day = await readDay(s, key);
    delete day.holds[sessionId];
    await s.setJSON(key, day);
  }
}

/** Free up spots after a full refund (called by the webhook). */
async function cancel(event, sessionId, wanted) {
  const s = store(event);
  for (const key of Object.keys(wanted)) {
    const day = await readDay(s, key);
    delete day.confirmed[sessionId];
    delete day.holds[sessionId];
    await s.setJSON(key, day);
  }
}

// "upick_2027-06-19:2,happyhour_2027-06-17:1"  <->  { "upick_2027-06-19": 2, … }
const encode = (wanted) => Object.entries(wanted).map(([k, q]) => `${k}:${q}`).join(",");
const decode = (str) => Object.fromEntries(String(str || "").split(",").filter(Boolean).map((p) => { const i = p.lastIndexOf(":"); return [p.slice(0, i), Number(p.slice(i + 1))]; }));

module.exports = { availability, checkRoom, placeHolds, confirm, releaseHolds, cancel, encode, decode, keyFor };
