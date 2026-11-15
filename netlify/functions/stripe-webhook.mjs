// Current-style Netlify Function. The code lives in netlify/lib/handlers/stripe-webhook.js
import "stripe"; // listed here so Netlify packages it with this function
import "@netlify/blobs"; // listed here so Netlify packages it with this function
import { adapt } from "../lib/v2.mjs";
import h from "../lib/handlers/stripe-webhook.js";

export default adapt(h.handler);
