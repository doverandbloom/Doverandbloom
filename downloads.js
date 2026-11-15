/* On-demand class downloads on the order confirmation page.
   The page URL carries ?session_id=… from Stripe; bookmark it to come back any time. */
(() => {
  const box = document.querySelector(".downloads");
  const farmBox = document.querySelector(".farm-address");
  if (!box) return;
  const id = new URLSearchParams(location.search).get("session_id");
  if (!id) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  fetch(`/.netlify/functions/class-downloads?session_id=${encodeURIComponent(id)}`, { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => {
      if (data.farm && farmBox) {
        farmBox.querySelector(".farm-address-line").textContent = data.farm.address;
        farmBox.querySelector(".farm-map").href = data.farm.map;
        farmBox.hidden = false;
      }
      const list = data.classes || [];
      if (!list.length) return;
      box.hidden = false;
      box.querySelector(".download-list").innerHTML = list.map((c) => `
        <li>
          <span><strong>${esc(c.name)}</strong><small>${esc(c.length)} video</small></span>
          ${c.url ? `<a class="btn btn--small" href="${esc(c.url)}" target="_blank" rel="noopener">Watch or download</a>` : `<em>Available soon. We'll email you when it's ready.</em>`}
        </li>`).join("");
    })
    .catch(() => {});
})();
