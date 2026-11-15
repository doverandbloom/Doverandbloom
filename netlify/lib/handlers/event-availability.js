/* GET /.netlify/functions/event-availability
   → { series: { upick: { "2027-06-19": spotsLeft, … }, happyhour: { … }, … } } */
const { availability } = require("../event-capacity.js");

exports.handler = async (event) => {
  try {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ series: await availability(event) }),
    };
  } catch (err) {
    console.error("availability error:", err.message);
    return { statusCode: 500, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Availability unavailable" }) };
  }
};
