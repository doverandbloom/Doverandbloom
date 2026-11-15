// Current-style Netlify Function. The code lives in netlify/lib/handlers/create-checkout.js
import { adapt } from "../lib/v2.mjs";
import h from "../lib/handlers/create-checkout.js";

export default adapt(h.handler);
