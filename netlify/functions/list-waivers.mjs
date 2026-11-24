/* ==========================================================
   GET /.netlify/functions/list-waivers?date=2027-06-19
   GET /.netlify/functions/list-waivers?q=smith        (search all)
   Staff only. Send the password in the "x-admin-key" header.
   The password is the WAIVER_ADMIN_PASSWORD environment variable
   in Netlify (mark it as secret). Until it is set, nothing is shown.
   ========================================================== */
import { getStore } from "@netlify/blobs";
import { timingSafeEqual, createHash } from "node:crypto";

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const same = (a, b) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export default async (req) => {
  const secret = process.env.WAIVER_ADMIN_PASSWORD || "";
  if (secret.length < 8) return json(503, { error: "The staff password isn't set up yet. Add WAIVER_ADMIN_PASSWORD in Netlify." });
  const key = req.headers.get("x-admin-key") || "";
  if (!key || !same(key, secret)) {
    await new Promise((r) => setTimeout(r, 600));                     // slow down guessing
    return json(401, { error: "Wrong password." });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") || "";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  if (date && !/^\d{4}-\d{2}(-\d{2})?$/.test(date)) return json(400, { error: "Bad date." });

  const store = getStore("waivers");
  const { blobs } = await store.list(date ? { prefix: date } : {});
  const keys = blobs.map((b) => b.key).sort().reverse().slice(0, 600);
  const out = [];
  for (const k of keys) {
    const r = await store.get(k, { type: "json" });
    if (!r) continue;
    if (q && ![r.name, r.email, r.phone, ...(r.minors || [])].join(" ").toLowerCase().includes(q)) continue;
    out.push(r);
  }
  return json(200, { count: out.length, waivers: out });
};
