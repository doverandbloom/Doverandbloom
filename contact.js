/* ==========================================================
   Contact form
   Submissions go to Netlify Forms (spam-filtered, emailed to you):
   Netlify → Site → Forms → "contact" → Form notifications.
   Arriving from a "Request a date" button (contact.html#bloom-bar,
   #private-event, #bulk-flowers …) pre-selects the topic.
   ========================================================== */

(() => {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  const topic = form.elements.topic;
  const eventBox = form.querySelector(".event-fields");
  const venue = form.querySelector(".venue-field");
  const pkg = form.elements.package;
  const err = form.querySelector(".form-error");
  const success = document.querySelector(".form-success");
  const EVENT_TOPICS = ["private-event", "bloom-bar", "bulk-flowers"];

  function syncTopic() {
    const t = topic.value;
    eventBox.hidden = !EVENT_TOPICS.includes(t);
    venue.hidden = t !== "bloom-bar";
    form.querySelector(".addons-field").hidden = t !== "private-event";
    form.querySelector(".bloombar-addons").hidden = t !== "bloom-bar";
    form.querySelector('label[for="c-guests"]').firstChild.textContent = t === "bulk-flowers" ? "Number of arrangements (approx.)" : "Number of guests";
    form.querySelector('label[for="c-date"]').firstChild.textContent = t === "bulk-flowers" ? "Date you need flowers" : "Preferred date";
    form.querySelector('label[for="c-package"]').hidden = t === "bulk-flowers";
    pkg.querySelectorAll("optgroup").forEach((g) => { g.hidden = g.dataset.for !== t; g.disabled = g.dataset.for !== t; });
    if (pkg.selectedOptions[0]?.parentElement?.disabled) pkg.value = "";
  }

  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1)).replace(/^contact--/, "");
    if ([...topic.options].some((o) => o.value === h)) { topic.value = h; syncTopic(); }
  }
  topic.addEventListener("change", syncTopic);
  window.addEventListener("hashchange", fromHash);
  fromHash();
  syncTopic();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const f = form.elements;
    if (f["bot-field"].value) return; // spam bot
    if (f.name.value.trim().length < 2) return (err.textContent = "Please add your name."), f.name.focus();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) return (err.textContent = "Please check your email address. We need it to reply."), f.email.focus();
    if (f.message.value.trim().length < 5) return (err.textContent = "Please add a short message."), f.message.focus();

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      if (!res.ok) throw new Error();
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch {
      err.innerHTML = "We couldn't send your message just now. Please try again, or email us at <strong>andrea@doverandbloom.com</strong>.";
      btn.disabled = false; btn.textContent = "Send message";
    }
  });

  // Copy-to-clipboard for the email address
  document.querySelectorAll("[data-copy]").forEach((b) =>
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Copied"; }
      catch { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); getSelection().removeAllRanges(); getSelection().addRange(r); b.textContent = "Selected"; }
      setTimeout(() => (b.textContent = "Copy"), 2000);
    })
  );
})();
