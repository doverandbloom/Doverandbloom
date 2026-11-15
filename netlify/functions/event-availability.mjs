// Current-style Netlify Function. The code lives in netlify/lib/handlers/event-availability.js
import { adapt } from "../lib/v2.mjs";
import h from "../lib/handlers/event-availability.js";

export default adapt(h.handler);
