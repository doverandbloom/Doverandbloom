/* Runs a classic (event → { statusCode, headers, body }) handler as a
   current-style Netlify Function (Request → Response).

   Why: the U-pick and event spot counts are stored in Netlify Blobs with
   "strong" consistency, so two people can't both buy the last spot.
   Netlify only provides strong consistency to current-style functions.
   The handlers in netlify/lib/handlers/ keep their original code. */

export const adapt = (handler) => async (req) => {
  const url = new URL(req.url);
  const event = {
    httpMethod: req.method,
    headers: Object.fromEntries(req.headers), // header names are lower-case, as before
    body: req.method === "GET" || req.method === "HEAD" ? null : await req.text(), // raw text: Stripe's signature check needs it unchanged
    isBase64Encoded: false,
    queryStringParameters: Object.fromEntries(url.searchParams),
    rawUrl: req.url,
  };
  const res = await handler(event);
  return new Response(res.body ?? "", { status: res.statusCode || 200, headers: res.headers || {} });
};
