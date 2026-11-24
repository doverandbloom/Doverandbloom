/* Staff page for signed waivers (staff-waivers.html).
   The password is checked by netlify/functions/list-waivers.mjs; this page
   keeps it only for the current browser tab (sessionStorage). */
(() => {
  const login = document.querySelector(".staff-login");
  if (!login) return;
  const view = document.querySelector(".staff-view");
  const list = view.querySelector(".staff-list");
  const count = view.querySelector(".staff-count");
  const dateIn = view.querySelector('[name="date"]');
  const qIn = view.querySelector('[name="q"]');
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  let key = "", rows = [];
  try { key = sessionStorage.getItem("db-staff-key") || ""; } catch {}

  async function load() {
    const params = new URLSearchParams();
    if (qIn.value.trim()) params.set("q", qIn.value.trim()); else params.set("date", dateIn.value || today());
    count.textContent = "Loading…";
    const res = await fetch(`/.netlify/functions/list-waivers?${params}`, { headers: { "x-admin-key": key }, cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Couldn't load waivers.");
    rows = data.waivers || [];
    const label = qIn.value.trim() ? `matching “${qIn.value.trim()}”` : `for ${new Date(dateIn.value + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`;
    count.textContent = `${rows.length} signed waiver${rows.length === 1 ? "" : "s"} ${label}`;
    list.innerHTML = rows.map((r) => `
      <article class="waiver-rec">
        <div class="wr-main">
          <h3>${esc(r.name)}</h3>
          <p>${esc(r.activity)} · visit ${esc(r.visitDate)} · signed ${esc(new Date(r.signedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }))}</p>
          <p>${[r.email, r.phone].filter(Boolean).map(esc).join(" · ") || "<em>no contact details</em>"}</p>
          ${r.minors && r.minors.length ? `<p><strong>Children:</strong> ${r.minors.map(esc).join(", ")} <em>(guardian confirmed)</em></p>` : ""}
          <p class="wr-meta">Waiver version ${esc(r.waiverVersion)} · ID ${esc(r.id)}</p>
        </div>
        <img class="wr-sig" src="${esc(r.signature)}" alt="Signature of ${esc(r.name)}">
      </article>`).join("") || `<p class="hint">No waivers yet.</p>`;
  }

  function open() {
    login.hidden = true; view.hidden = false;
    dateIn.value = dateIn.value || today();
    return load();
  }
  login.addEventListener("submit", async (e) => {
    e.preventDefault();
    key = login.elements.pw.value;
    try { await open(); try { sessionStorage.setItem("db-staff-key", key); } catch {} }
    catch (x) { view.hidden = true; login.hidden = false; login.querySelector(".form-error").textContent = x.message; }
  });
  view.querySelector(".staff-load").addEventListener("click", () => load().catch((x) => { count.textContent = x.message; }));
  dateIn.addEventListener("change", () => { qIn.value = ""; load().catch((x) => { count.textContent = x.message; }); });
  qIn.addEventListener("keydown", (e) => { if (e.key === "Enter") load().catch((x) => { count.textContent = x.message; }); });
  view.querySelector(".staff-print").addEventListener("click", () => window.print());
  view.querySelector(".staff-logout").addEventListener("click", () => {
    try { sessionStorage.removeItem("db-staff-key"); } catch {}
    key = ""; rows = []; list.innerHTML = ""; view.hidden = true; login.hidden = false; login.reset();
  });
  view.querySelector(".staff-csv").addEventListener("click", () => {
    const cols = ["visitDate", "signedAt", "name", "email", "phone", "activity", "minors", "waiverVersion", "id"];
    const cell = (v) => `"${String(Array.isArray(v) ? v.join("; ") : v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `waivers-${qIn.value.trim() ? "search" : dateIn.value}.csv`;
    a.click();
  });

  if (key) open().catch(() => { key = ""; view.hidden = true; login.hidden = false; });
})();
