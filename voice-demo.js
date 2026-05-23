/* Voice-Tracking Hero Demo
   ------------------------------------------------------------------
   Self-contained demo that animates the core USP: speak → food entries
   appear with macros. Loops. Reuses the app's visual vocabulary
   (food rows, source badges, accent color).

   Mount: <div data-tenzo-voice-demo></div>
   Auto-discovers all mounts on DOMContentLoaded. */

(function () {
  const SCRIPT = [
    "200 Gramm Hähnchenbrust gegrillt",
    "mit 250 Gramm Reis",
    "und etwas Brokkoli",
  ];
  const ENTRIES = [
    { name: "Hähnchenbrust",    grams: 200, kcal: 330, p: 42, c: 0,  f: 7,    src: "voice" },
    { name: "Reis (gekocht)",   grams: 250, kcal: 325, p: 6,  c: 70, f: 0.7,  src: "voice" },
    { name: "Brokkoli",         grams: 150, kcal: 51,  p: 4,  c: 7,  f: 0.6,  src: "voice" },
  ];

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function buildBars(count) {
    const wrap = el("div", "vd-bars");
    for (let i = 0; i < count; i++) {
      const b = el("span", "vd-bar");
      b.style.setProperty("--i", i);
      wrap.appendChild(b);
    }
    return wrap;
  }

  function entryRow(e) {
    const row = el("div", "vd-row vd-row-enter");
    row.innerHTML = `
      <div class="vd-row-meta">
        <span class="vd-badge">TENZO</span>
        <span class="vd-name">${e.name}</span>
      </div>
      <span class="vd-pill">${e.grams}<span class="vd-pill-u">g</span></span>
      <span class="vd-kcal">${e.kcal}</span>
    `;
    return row;
  }

  function build(mount) {
    mount.classList.add("vd-root");
    mount.innerHTML = "";

    // Phone frame
    const phone = el("div", "vd-phone");
    const screen = el("div", "vd-screen");

    // Status row (mic state)
    const status = el("div", "vd-status");
    status.innerHTML = `
      <span class="vd-mic">
        <span class="vd-mic-dot"></span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="3" width="6" height="12" rx="3"/>
          <path d="M5 11a7 7 0 0 0 14 0"/>
          <path d="M12 18v3"/>
        </svg>
      </span>
      <span class="vd-status-text">Hört zu …</span>
    `;

    // Waveform
    const wave = buildBars(28);

    // Transcript area
    const transcript = el("div", "vd-transcript");
    transcript.innerHTML = `<span class="vd-q">„</span><span class="vd-typed"></span><span class="vd-caret"></span><span class="vd-q vd-q-close">"</span>`;

    // Entries list
    const list = el("div", "vd-list");
    const listLabel = el("div", "vd-list-label", "ZUGEORDNET — MITTAGESSEN");

    // Totals strip
    const totals = el("div", "vd-totals");
    totals.innerHTML = `
      <span class="vd-t-kcal"><span class="vd-t-num">0</span> kcal</span>
      <span class="vd-t-macros">
        <span class="vd-t-m" style="--c:var(--vdt-p)">P <span data-key="p">0</span></span>
        <span class="vd-t-m" style="--c:var(--vdt-c)">K <span data-key="c">0</span></span>
        <span class="vd-t-m" style="--c:var(--vdt-f)">F <span data-key="f">0</span></span>
      </span>
    `;

    screen.appendChild(status);
    screen.appendChild(wave);
    screen.appendChild(transcript);
    screen.appendChild(listLabel);
    screen.appendChild(list);
    screen.appendChild(totals);
    phone.appendChild(screen);
    mount.appendChild(phone);

    return {
      mount, phone, screen, status, wave, transcript, list, totals,
      typed: transcript.querySelector(".vd-typed"),
      caret: transcript.querySelector(".vd-caret"),
      statusText: status.querySelector(".vd-status-text"),
      micDot: status.querySelector(".vd-mic-dot"),
      tKcal: totals.querySelector(".vd-t-num"),
      tP: totals.querySelector('[data-key="p"]'),
      tC: totals.querySelector('[data-key="c"]'),
      tF: totals.querySelector('[data-key="f"]'),
    };
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Type-on starting from where the existing text already is — so previously
  // typed segments stay on screen instead of being wiped and re-typed
  // (which was the main source of the hero-demo flicker).
  async function typeLine(refs, text, perChar = 28, startAt = 0) {
    for (let i = startAt; i <= text.length; i++) {
      refs.typed.textContent = text.slice(0, i);
      await wait(perChar + Math.random() * 18);
    }
  }

  async function runOnce(refs) {
    // Cancel any animateNum tickers from a previous iteration before we
    // reset to 0 — otherwise the prior tick keeps firing and races with
    // the new animation, showing flicker between the two values.
    cancelNumAnims(refs);

    // reset
    refs.typed.textContent = "";
    refs.list.innerHTML = "";
    refs.tKcal.textContent = "0";
    refs.tP.textContent = "0";
    refs.tC.textContent = "0";
    refs.tF.textContent = "0";
    refs.statusText.textContent = "Hört zu …";
    refs.phone.classList.add("vd-listening");

    await wait(500);

    let totals = { kcal: 0, p: 0, c: 0, f: 0 };
    for (let i = 0; i < SCRIPT.length; i++) {
      if (i > 0) refs.typed.textContent = refs.typed.textContent + " ";
      const startAt = refs.typed.textContent.length;
      await typeLine(refs, refs.typed.textContent + SCRIPT[i], 28, startAt);
      // Append entry shortly after
      await wait(180);
      const row = entryRow(ENTRIES[i]);
      refs.list.appendChild(row);
      // Animate totals up
      const next = {
        kcal: totals.kcal + ENTRIES[i].kcal,
        p: totals.p + ENTRIES[i].p,
        c: totals.c + ENTRIES[i].c,
        f: totals.f + ENTRIES[i].f,
      };
      animateNum(refs.tKcal, totals.kcal, next.kcal, 600, Math.round);
      animateNum(refs.tP, totals.p, next.p, 600, (v) => Math.round(v));
      animateNum(refs.tC, totals.c, next.c, 600, (v) => Math.round(v));
      animateNum(refs.tF, totals.f, next.f, 600, (v) => Math.round(v));
      totals = next;
      await wait(420);
    }

    // settle
    refs.statusText.textContent = "Eingetragen ✓";
    refs.phone.classList.remove("vd-listening");
    refs.phone.classList.add("vd-done");
    await wait(2600);
    refs.phone.classList.remove("vd-done");
  }

  // Cancellation tokens per DOM node so a newer animateNum() call supersedes
  // any older ticker still running on the same node. Without this, three
  // animateNums per iteration overlap with the next iteration's reset, and
  // the textContent visibly oscillates between old-final and new-interpolating
  // values every frame.
  const animTokens = new WeakMap();

  function animateNum(node, from, to, dur, fmt) {
    const token = (animTokens.get(node) ?? 0) + 1;
    animTokens.set(node, token);
    const t0 = performance.now();
    const tick = (t) => {
      if (animTokens.get(node) !== token) return; // superseded — bail
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = from + (to - from) * e;
      node.textContent = (fmt || ((x) => x.toFixed(1)))(v);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function cancelNumAnims(refs) {
    // Bump the token on every animated node so any in-flight ticker bails.
    for (const node of [refs.tKcal, refs.tP, refs.tC, refs.tF]) {
      animTokens.set(node, (animTokens.get(node) ?? 0) + 1);
    }
  }

  function start(mount) {
    const refs = build(mount);
    let stopped = false;
    let running = false; // single-loop guard — IO toggling shouldn't spawn duplicates
    const loop = async () => {
      if (running) return;
      running = true;
      try {
        while (!stopped) {
          await runOnce(refs);
          await wait(800);
        }
      } finally {
        running = false;
      }
    };
    // Pause when offscreen for perf. Toggling stopped is fine; calling loop()
    // a second time while one is mid-iteration is what caused double-stepping
    // before — `running` now guards that.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && stopped) { stopped = false; loop(); }
        if (!e.isIntersecting) { stopped = true; }
      }
    }, { threshold: 0.15 });
    io.observe(mount);
    loop();
  }

  function init() {
    document.querySelectorAll("[data-tenzo-voice-demo]").forEach(start);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
