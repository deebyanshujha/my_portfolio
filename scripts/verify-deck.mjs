/**
 * The project deck.
 *
 * The deck is the one place on the landing page where scrolling does not mean
 * scrolling, so the things worth guarding are the deal it makes with the page:
 * three wheel gestures forward, three back, exactly reversible, and the wheel
 * handed over the moment the deck has had its three. The rest — one physical
 * gesture never spending two cards, the stack still reading as a stack — is
 * the sort of thing that breaks quietly.
 *
 * Requires the dev server: npm run dev
 */
import { chromium } from "@playwright/test";

const BASE = process.env.DOS_URL ?? "http://127.0.0.1:5173/";
const out = [];
const fails = [];
const check = (label, ok, detail = "") => {
  (ok ? out : fails).push(`${ok ? "ok  " : "FAIL"} ${label}${detail ? ` -- ${detail}` : ""}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1400);

const deck = page.locator('[aria-roledescription="Project card stack"]');
await deck.waitFor();

const active = async () => {
  const label = await deck.getAttribute("aria-label");
  return label.replace(/^Projects — /, "").split(",")[0];
};
const ORDER = ["Lamb", "ChatterNet", "Project Camp"];
const next = (name, d) => ORDER[(ORDER.indexOf(name) + d + 3) % 3];
// leave the section and come back, the way a reader does — this is also the
// only thing that clears a released deck, so it is worth exercising
const reset = async () => {
  await page.$eval("[data-landing-scroll]", (el) => (el.scrollTop = 0));
  await page.waitForTimeout(500);
  await deck.evaluate((el) => el.scrollIntoView({ behavior: "auto", block: "center" }));
  await page.waitForTimeout(600);
};
const scrollTop = () => page.$eval("[data-landing-scroll]", (el) => el.scrollTop);

// centre the deck the way a reader arriving from above would
await deck.evaluate((el) => el.scrollIntoView({ behavior: "auto", block: "center" }));
await page.waitForTimeout(500);

const wheel = async (dy) => {
  const box = await deck.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, dy);
  await page.waitForTimeout(800);
};

/* ── down ─────────────────────────────────────────────────────── */
check("deck opens on the first project", (await active()) === "Lamb", await active());
const beforeDown = await scrollTop();

const down = [];
for (let i = 0; i < 3; i++) {
  await wheel(120);
  down.push(await active());
}
check("three wheel-downs deal the whole deck", down.join(" > ") === "ChatterNet > Project Camp > Lamb", down.join(" > "));
check("the page never moved while the deck was dealing", Math.abs((await scrollTop()) - beforeDown) < 2, `moved ${(await scrollTop()) - beforeDown}px`);

await page.screenshot({ path: "artifacts/deck-01-rest.png" });

// a fourth wheel-down must belong to the page
await wheel(220);
const afterRelease = await scrollTop();
check("the fourth wheel-down releases the page downward", afterRelease > beforeDown + 40, `moved ${afterRelease - beforeDown}px`);
check("the deck did not steal that scroll", (await active()) === "Lamb", await active());

/* ── up ───────────────────────────────────────────────────────── */
// come back from below, the way a reader scrolling up would
await deck.evaluate((el) => el.scrollIntoView({ behavior: "auto", block: "center" }));
await page.waitForTimeout(600);
const beforeUp = await scrollTop();

const up = [];
for (let i = 0; i < 3; i++) {
  await wheel(-120);
  up.push(await active());
}
check("three wheel-ups run the deck backwards", up.join(" > ") === "Project Camp > ChatterNet > Lamb", up.join(" > "));
check("the page held still through the reverse", Math.abs((await scrollTop()) - beforeUp) < 2, `moved ${(await scrollTop()) - beforeUp}px`);

await wheel(-220);
check("the fourth wheel-up releases the page upward", (await scrollTop()) < beforeUp - 40, `moved ${(await scrollTop()) - beforeUp}px`);

/* ── round trip: down three, up three, same picture ───────────── */
await deck.evaluate((el) => el.scrollIntoView({ behavior: "auto", block: "center" }));
await page.waitForTimeout(600);
await wheel(120);
await wheel(120);
const mid = await active();
await wheel(-120);
await wheel(-120);
check("reverse is exact", (await active()) === "Lamb", `mid ${mid}, back at ${await active()}`);

/* ── one gesture, one card ──────────────────────────────────────
   Dispatched inside the page: a real trackpad emits every 8-16ms, far faster
   than the driver can round-trip, and the coalescing rule is entirely about
   that timing. */
const burst = (deltas, every) =>
  page.evaluate(
    ([ds, ms]) =>
      new Promise((done) => {
        const target = document.querySelector("[data-landing-scroll]");
        let i = 0;
        const tick = () => {
          if (i >= ds.length) return done();
          target.dispatchEvent(
            new WheelEvent("wheel", { deltaY: ds[i++], bubbles: true, cancelable: true }),
          );
          setTimeout(tick, ms);
        };
        tick();
      }),
    [deltas, every],
  );

await deck.evaluate((el) => el.scrollIntoView({ behavior: "auto", block: "center" }));
await page.waitForTimeout(700);

const flickFrom = await active();
// one flick: a rise, then a decaying momentum tail
await burst([40, 90, 120, 96, 70, 48, 30, 18, 10, 6, 3], 14);
await page.waitForTimeout(900);
check("one trackpad flick advances exactly one card", (await active()) === next(flickFrom, 1), await active());

// two flicks with a real lift-off between them must give two cards
const twoFrom = await active();
await burst([90, 120, 80, 40, 16, 6], 14);
await page.waitForTimeout(700);
await burst([90, 120, 80, 40, 16, 6], 14);
await page.waitForTimeout(900);
check("two flicks advance two cards", (await active()) === next(twoFrom, 2), await active());

// a fast continuous mouse spin must not skip cards
await reset();
const spinFrom = await active();
await burst(Array(24).fill(100), 34);
await page.waitForTimeout(900);
const spun = (ORDER.indexOf(await active()) - ORDER.indexOf(spinFrom) + 3) % 3;
check("a continuous spin steps one card at a time", spun === 1 || spun === 2, "advanced " + spun + " over ~0.8s of spinning");

// deliberate, separated notches advance one each
await reset();
const notchFrom = await active();
for (let i = 0; i < 2; i++) {
  await burst([100], 0);
  await page.waitForTimeout(680);
}
check("two deliberate wheel notches advance two cards", (await active()) === next(notchFrom, 2), await active());

/* ── keyboard ─────────────────────────────────────────────────── */
await deck.focus();
const keyFrom = await active();
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(750);
const k1 = await active();
await page.keyboard.press("ArrowUp");
await page.waitForTimeout(750);
check("arrow keys step the deck and step back", k1 === next(keyFrom, 1) && (await active()) === keyFrom, `${keyFrom} > ${k1} > ${await active()}`);

/* ── the stack reads as a stack ───────────────────────────────── */
const geometry = await page.$$eval('[aria-roledescription="Project card stack"] > article', (els) =>
  els.map((el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), z: Number(getComputedStyle(el).zIndex) };
  }),
);
const bottoms = geometry.map((g) => g.bottom).sort((a, b) => a - b);
const spread = bottoms[2] - bottoms[0];
check("the two cards behind show an edge each", spread > 18 && spread < 70, `spread ${spread}px`);
// scaled-down cards have different left edges by definition; what must not
// drift is where the deck sits, so compare centres
const centres = await page.$$eval('[aria-roledescription="Project card stack"] > article', (els) =>
  els.map((el) => {
    const r = el.getBoundingClientRect();
    return Math.round(r.left + r.width / 2);
  }),
);
check("the cards are stacked, not spread sideways", Math.max(...centres) - Math.min(...centres) <= 2, `centre spread ${Math.max(...centres) - Math.min(...centres)}px`);
check("z-order is distinct", new Set(geometry.map((g) => g.z)).size === 3, JSON.stringify(geometry.map((g) => g.z)));

await page.screenshot({ path: "artifacts/deck-02-stack.png" });

/* ── mid-flight: does a card really pass over the others? ─────── */
await reset();
const b2 = await deck.boundingBox();
await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2);
await page.mouse.wheel(0, 120);
await page.waitForTimeout(170);
const flight = await page.$$eval('[aria-roledescription="Project card stack"] > article', (els) =>
  els.map((el) => ({ top: Math.round(el.getBoundingClientRect().top), z: Number(getComputedStyle(el).zIndex) })),
);
const lifted = flight.reduce((a, b) => (a.z > b.z ? a : b));
const rest = flight.filter((f) => f !== lifted);
check("the departing card lifts above the deck mid-flight", lifted.z > 40 && lifted.top < Math.min(...rest.map((r) => r.top)), JSON.stringify(flight));
await page.screenshot({ path: "artifacts/deck-03-inflight.png" });
await page.waitForTimeout(900);

/* ── narrow viewport ──────────────────────────────────────────── */
await page.setViewportSize({ width: 420, height: 820 });
await page.waitForTimeout(400);
await deck.evaluate((el) => el.scrollIntoView({ behavior: "auto", block: "center" }));
await page.waitForTimeout(400);
await page.screenshot({ path: "artifacts/deck-04-narrow.png" });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check("nothing spills sideways at 420px", overflow <= 0, `${overflow}px`);
const card = await page.$eval('[aria-roledescription="Project card stack"] > article', (el) => {
  const r = el.getBoundingClientRect();
  const foot = el.querySelector("a").getBoundingClientRect();
  return { bottom: Math.round(r.bottom), foot: Math.round(foot.bottom) };
});
check("the card's content fits inside it on a phone", card.foot <= card.bottom, JSON.stringify(card));

/* ── touch ────────────────────────────────────────────────────
   The same three-step deal, driven by a finger. What matters as much as the
   cycle is that a swipe the deck does not want reaches the page: the deck
   claims a swipe by cancelling it, so `defaultPrevented` is exactly the
   question "did the deck take this one?". */
const phone = await browser.newPage({
  viewport: { width: 400, height: 820 },
  hasTouch: true,
  isMobile: true,
});
await phone.goto(BASE, { waitUntil: "networkidle" });
await phone.waitForTimeout(1400);

const pdeck = phone.locator('[aria-roledescription="Project card stack"]');
await pdeck.waitFor();
await pdeck.evaluate((el) => el.scrollIntoView({ behavior: "auto", block: "center" }));
await phone.waitForTimeout(600);

const pactive = async () =>
  (await pdeck.getAttribute("aria-label")).replace(/^Projects — /, "").split(",")[0];

/** One finger, one swipe. Returns whether the deck claimed it. */
const swipe = (dy) =>
  pdeck.evaluate(
    (el, delta) =>
      new Promise((done) => {
        const r = el.getBoundingClientRect();
        const x = Math.round(r.left + r.width / 2);
        const y0 = Math.round(r.top + r.height / 2);
        const finger = (cy) =>
          new Touch({ identifier: 1, target: el, clientX: x, clientY: cy });
        const fire = (type, cy) => {
          const ev = new TouchEvent(type, {
            touches: type === "touchend" ? [] : [finger(cy)],
            changedTouches: [finger(cy)],
            bubbles: true,
            cancelable: true,
          });
          el.dispatchEvent(ev);
          return ev.defaultPrevented;
        };
        fire("touchstart", y0);
        let claimed = false;
        let i = 1;
        const steps = 10;
        const tick = () => {
          if (i > steps) {
            fire("touchend", y0 + delta);
            return done(claimed);
          }
          claimed = fire("touchmove", y0 + Math.round((delta * i) / steps)) || claimed;
          i += 1;
          setTimeout(tick, 16);
        };
        tick();
      }),
    dy,
  );

const swiped = [];
for (let i = 0; i < 3; i++) {
  const claimed = await swipe(-120);
  await phone.waitForTimeout(760);
  swiped.push(`${claimed ? "held" : "passed"}:${await pactive()}`);
}
check(
  "three swipes up deal the whole deck, and the deck holds each one",
  swiped.join(" > ") === "held:ChatterNet > held:Project Camp > held:Lamb",
  swiped.join(" > "),
);

const escaped = await swipe(-120);
await phone.waitForTimeout(500);
check("a fourth swipe up is handed to the page", escaped === false, escaped ? "still held" : "");
check("and it did not move the deck", (await pactive()) === "Lamb", await pactive());

// turning around picks the deck back up rather than shutting the reader out
const back = await swipe(120);
await phone.waitForTimeout(760);
check(
  "swiping back down reverses the deck",
  back === true && (await pactive()) === "Project Camp",
  `${back ? "held" : "passed"} at ${await pactive()}`,
);

/* ── reduced motion keeps the state machine ───────────────────── */
await page.setViewportSize({ width: 1440, height: 900 });
const still = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await still.emulateMedia({ reducedMotion: "reduce" });
await still.goto(BASE, { waitUntil: "networkidle" });
await still.waitForTimeout(1200);
const sdeck = still.locator('[aria-roledescription="Project card stack"]');
await sdeck.evaluate((el) => el.scrollIntoView({ behavior: "auto", block: "center" }));
await still.waitForTimeout(400);
const sactive = async () => (await sdeck.getAttribute("aria-label")).replace(/^Projects — /, "").split(",")[0];
const sbefore = await still.$eval("[data-landing-scroll]", (el) => el.scrollTop);
const seq = [];
for (let i = 0; i < 3; i++) {
  const b = await sdeck.boundingBox();
  await still.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await still.mouse.wheel(0, 120);
  await still.waitForTimeout(420);
  seq.push(await sactive());
}
check("reduced motion keeps the same three-step cycle", seq.join(" > ") === "ChatterNet > Project Camp > Lamb", seq.join(" > "));
check("reduced motion still holds the page", Math.abs((await still.$eval("[data-landing-scroll]", (el) => el.scrollTop)) - sbefore) < 2);
await still.screenshot({ path: "artifacts/deck-05-reduced.png" });

await browser.close();
console.log(out.join("\n"));
if (fails.length) {
  console.log("\n" + fails.join("\n"));
  process.exit(1);
}
console.log("\nall good");
