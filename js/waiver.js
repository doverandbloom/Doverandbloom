/* Check-in waiver for the farm iPad (waiver.html).
   Shows the current Terms & Liability Waiver, takes a finger signature,
   and saves everything through netlify/functions/sign-waiver.mjs.
   After a guest signs, the page thanks them and resets for the next guest. */
(() => {
  const form = document.querySelector(".waiver-form");
  if (!form) return;
  const VERSION = CATALOG_SETTINGS.waiverVersion;
  const err = form.querySelector(".form-error");
  const textBox = form.querySelector(".waiver-text");
  const done = document.querySelector(".kiosk-done");
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

  // ---- the waiver text, straight from the Terms page so it always matches
  form.querySelector(".waiver-version").textContent = `Version ${VERSION}`;
  fetch("terms.html", { cache: "no-store" }).then((r) => r.text()).then((html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const body = doc.querySelector(".legal-body");
    const stop = body && body.querySelector("#media");               // sections 1–7: the waiver itself
    if (!body) throw new Error();
    const frag = document.createElement("div");
    for (const el of [...body.children]) {
      if (el === stop) break;
      frag.appendChild(el.cloneNode(true));
    }
    frag.querySelectorAll("a").forEach((a) => a.replaceWith(...a.childNodes));
    textBox.replaceChildren(frag);
  }).catch(() => { textBox.textContent = "The waiver couldn't load. Please ask a team member for a paper copy."; });

  // ---- minors: ask for the guardian's agreement only when children are listed
  const guardian = form.querySelector(".guardian-check");
  const minorsBox = form.elements.minors;
  minorsBox.addEventListener("input", () => { guardian.hidden = !minorsBox.value.trim(); });

  // ---- signature pad
  const canvas = form.querySelector(".sig-pad");
  const ctx = canvas.getContext("2d");
  let drawing = false, inked = 0, last = null;
  function size() {
    const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1f2b17"; ctx.lineWidth = 2.6;
    inked = 0;
  }
  const pt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener("pointerdown", (e) => { drawing = true; last = pt(e); canvas.setPointerCapture(e.pointerId); canvas.parentElement.classList.add("signed"); });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pt(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    inked += Math.hypot(p.x - last.x, p.y - last.y); last = p;
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((t) => canvas.addEventListener(t, () => { drawing = false; }));
  function clearSig() { ctx.clearRect(0, 0, canvas.width, canvas.height); inked = 0; canvas.parentElement.classList.remove("signed"); }
  form.querySelector(".sig-clear").addEventListener("click", clearSig);
  window.addEventListener("resize", () => { if (!inked) size(); });

  function reset() {
    form.reset(); clearSig(); guardian.hidden = true; err.textContent = "";
    form.elements.visitDate.value = today();
    done.hidden = true; form.hidden = false; window.scrollTo(0, 0);
  }

  // ---- submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const f = form.elements;
    const minors = f.minors.value.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
    if (f.name.value.trim().split(/\s+/).length < 2) return fail("Please enter your full first and last name.", f.name);
    if (minors.length && !f.guardian.checked) return fail("Please confirm you are the parent or legal guardian of the children listed.", f.guardian);
    if (!f.agree.checked) return fail("Please check the box to agree to the waiver.", f.agree);
    if (inked < 60) return fail("Please sign in the box with your finger.", canvas);

    const btn = form.querySelector(".kiosk-submit");
    btn.disabled = true; btn.textContent = "Saving…";
    try {
      const res = await fetch("/.netlify/functions/sign-waiver", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name.value, email: f.email.value, phone: f.phone.value, visitDate: f.visitDate.value,
          activity: f.activity.value, minors, guardian: f.guardian.checked, agree: f.agree.checked,
          version: VERSION, signature: canvas.toDataURL("image/png"), company: f.company.value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "We couldn't save your waiver. Please let a team member know.");
      showDone(f.name.value.trim().split(/\s+/)[0]);
    } catch (x) {
      fail(/fetch|network/i.test(x.message) ? "No internet connection. Please let a team member know." : x.message);
    } finally {
      btn.disabled = false; btn.textContent = "Submit my waiver";
    }
  });
  function fail(msg, el) { err.textContent = msg; (el || err).scrollIntoView({ block: "center", behavior: "smooth" }); return false; }

  // ---- thank-you screen, then reset for the next guest
  let timer;
  function showDone(first) {
    form.hidden = true; done.hidden = false; done.querySelector(".done-name").textContent = first;
    window.scrollTo(0, 0); done.focus();
    let n = 10; const c = done.querySelector(".done-count"); c.textContent = n;
    clearInterval(timer);
    timer = setInterval(() => { n -= 1; c.textContent = n; if (n <= 0) { clearInterval(timer); reset(); } }, 1000);
  }
  done.querySelector(".kiosk-next").addEventListener("click", () => { clearInterval(timer); reset(); });

  form.elements.visitDate.value = today();
  requestAnimationFrame(size);
})();
