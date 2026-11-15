/* ==========================================================
   Newsletter sign-up → Kit (kit.com)

   POST /.netlify/functions/subscribe   { email }
   Adds the email to your Kit form, so it shows up in Kit under
   Subscribers. If the form has "Send incentive email" turned on
   (Kit's double opt-in), Kit emails a confirm button first.

   Environment variables (Netlify → Site configuration → Env vars):
     KIT_API_KEY = your Kit API key (Kit → Settings → Developer).
                   A v4 key (starts with "kit_") or the older v3 API Key
                   both work; the v3 key uses Kit's v3 form-subscribe call.
     KIT_FORM_ID = optional. Defaults to 10191112, the Dover & Bloom
                   landing page on Kit. Set it only to use a different form.
   The key stays on the server and is never sent to the browser.
   ========================================================== */

const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Please enter a valid email address." }); }

  // bots fill in the hidden "company" field; people never see it
  if (body.company) return json(200, { ok: true });

  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return json(400, { error: "Please enter a valid email address." });

  const KIT_API_KEY = process.env.KIT_API_KEY;
  const KIT_FORM_ID = process.env.KIT_FORM_ID || "10191112"; // Dover & Bloom landing page on Kit
  if (!KIT_API_KEY || !/^\d+$/.test(KIT_FORM_ID || "")) {
    console.error("subscribe: KIT_API_KEY or KIT_FORM_ID is not set");
    return json(500, { error: "Sign-ups aren't connected yet. Please email andrea@doverandbloom.com to join the list." });
  }

  try {
    if (!KIT_API_KEY.startsWith("kit_")) {
      // older v3 API Key: one public form-subscribe call
      const v3 = await fetch(`https://api.convertkit.com/v3/forms/${KIT_FORM_ID}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ api_key: KIT_API_KEY, email }),
      });
      if (v3.status === 422) return json(400, { error: "Please enter a valid email address." });
      if (!v3.ok) throw new Error(`v3 form ${v3.status}: ${(await v3.text()).slice(0, 300)}`);
      return json(200, { ok: true });
    }
    const res = await fetch(`https://api.kit.com/v4/forms/${KIT_FORM_ID}/subscribers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-Kit-Api-Key": KIT_API_KEY },
      body: JSON.stringify({ email_address: email }),
    });
    if (res.status === 404) {
      // first-time subscriber: create them, then add them to the form
      const created = await fetch("https://api.kit.com/v4/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Kit-Api-Key": KIT_API_KEY },
        body: JSON.stringify({ email_address: email }),
      });
      if (!created.ok) throw new Error(`create ${created.status}: ${(await created.text()).slice(0, 300)}`);
      const retry = await fetch(`https://api.kit.com/v4/forms/${KIT_FORM_ID}/subscribers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Kit-Api-Key": KIT_API_KEY },
        body: JSON.stringify({ email_address: email }),
      });
      if (!retry.ok) throw new Error(`form ${retry.status}: ${(await retry.text()).slice(0, 300)}`);
      return json(200, { ok: true });
    }
    if (res.status === 422) return json(400, { error: "Please enter a valid email address." });
    if (!res.ok) throw new Error(`form ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return json(200, { ok: true });
  } catch (err) {
    console.error("subscribe:", err.message);
    return json(502, { error: "Something went wrong. Please try again, or email andrea@doverandbloom.com." });
  }
};
