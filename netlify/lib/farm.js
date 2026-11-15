/* Farm details used only on the server.
   The street address is given to paying customers (Stripe checkout page,
   payment line items and the order confirmation page) and is never put in
   the public website code. To change it, edit FARM_ADDRESS below, or set a
   FARM_ADDRESS environment variable in Netlify, which takes priority. */
const FARM_ADDRESS = process.env.FARM_ADDRESS || "2055 Dover Street, Lakewood, CO 80226";
const mapsLink = (address) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(address);
module.exports = { FARM_ADDRESS, mapsLink };
