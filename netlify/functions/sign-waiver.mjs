/* ==========================================================
   POST /.netlify/functions/sign-waiver
   Saves a signed Terms & Liability Waiver from the check-in iPad
   (waiver.html) to Netlify Blobs, store "waivers".

   Each waiver is one record, keyed by visit date so staff can
   look up a day at a time:  2027-06-19/2027-06-19T15-04-11-123Z-ab12cd
   The record holds the signer's details, the minors in their care,
   the waiver version they agreed to, the time, and the signature
   image (PNG). Nothing here is public: staff read waivers through
   list-waivers, which needs the WAIVER_ADMIN_PASSWORD.
   ========================================================== */
import { getStore } from "@netlify/blobs";
import catalog from "../../js/catalog.js";

const { CATALOG_SETTINGS } = catalog;
const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const clean = (v, max = 200) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });
  let b;
  try { b = await req.json(); } catch { return json(400, { error: "Something went wrong. Please try again." }); }
  if (b.company) return json(200, { ok: true });                      // spam trap

  const name = clean(b.name, 100);
  const email = clean(b.email, 254).toLowerCase();
  const phone = clean(b.phone, 30);
  const visit = clean(b.visitDate, 10);
  const activity = clean(b.activity, 60);
  const minors = (Array.isArray(b.minors) ? b.minors : []).map((m) => clean(m, 80)).filter(Boolean).slice(0, 12);
  const sig = String(b.signature || "");

  if (name.length < 3 || !/\s/.test(name)) return json(400, { error: "Please enter your full first and last name." });
  if (email && !EMAIL.test(email)) return json(400, { error: "Please check your email address." });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visit)) return json(400, { error: "Please check the visit date." });
  if (b.agree !== true) return json(400, { error: "Please check the box to agree to the Terms & Liability Waiver." });
  if (minors.length && b.guardian !== true) return json(400, { error: "Please confirm you are the parent or legal guardian of the minors listed." });
  if (b.version !== CATALOG_SETTINGS.waiverVersion) return json(409, { error: "The waiver was just updated. Please reload the page and sign again." });
  if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(sig) || sig.length < 1500 || sig.length > 400000) {
    return json(400, { error: "Please sign in the signature box." });
  }

  const now = new Date();
  const id = `${now.toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id, visitDate: visit, signedAt: now.toISOString(), name, email, phone, activity,
    minors, guardianConfirmed: minors.length ? true : false,
    waiverVersion: CATALOG_SETTINGS.waiverVersion,
    device: clean(req.headers.get("user-agent"), 200),
    ip: clean(req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for"), 60),
    signature: sig,
  };
  try {
    await getStore("waivers").setJSON(`${visit}/${id}`, record);
  } catch (err) {
    console.error("sign-waiver:", err.message);
    return json(500, { error: "We couldn't save your waiver. Please let a team member know." });
  }
  return json(200, { ok: true, id });
};
