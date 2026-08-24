/**
 * The hero name.
 *
 * The name is the largest thing on the site and the one most likely to break
 * quietly: it is measured rather than sized, so a probe that mis-measures shows
 * up as a wrapped line or a collision with the rail rather than as an error.
 * Nine viewports, plus the two live layers — the per-character drift and the
 * light the cursor carries along the word.
 *
 * Requires the dev server: npm run dev
 */
import { chromium } from "@playwright/test";

const BASE = process.env.DOS_URL ?? "http://127.0.0.1:5173/";
const fails = [];
const ok = [];
const check = (l, good, d = "") => (good ? ok : fails).push(`${good ? "ok  " : "FAIL"} ${l}${d ? ` -- ${d}` : ""}`);

const browser = await chromium.launch();

const SIZES = [
  [1920, 1080],
  [1440, 900],
  [1280, 720],
  [1024, 1366],
  [820, 1180],
  [768, 500],
  [480, 900],
  [390, 844],
  [320, 640],
];

for (const [w, h] of SIZES) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);

  const m = await page.evaluate(() => {
    const h1 = document.querySelector('h1[aria-label="Deebyanshu Jha"]');
    const row = h1.querySelector("[data-wordmark-row]");
    const rail = document.querySelector("[data-landing-meta]");
    const r = row.getBoundingClientRect();
    const hb = h1.getBoundingClientRect();
    const rb = rail.getBoundingClientRect();
    const letters = [...h1.querySelectorAll("[data-wordmark-row] > span")].map((s) => {
      const b = s.getBoundingClientRect();
      return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom) };
    });
    return {
      lines: row.getClientRects().length,
      rowW: Math.round(r.width),
      hostW: Math.round(hb.width),
      rowLeft: Math.round(r.left),
      rowRight: Math.round(r.right),
      hostLeft: Math.round(hb.left),
      hostRight: Math.round(hb.right),
      rowTop: Math.round(r.top),
      rowBottom: Math.round(r.bottom),
      hostTop: Math.round(hb.top),
      hostBottom: Math.round(hb.bottom),
      railTop: Math.round(rb.top),
      fontSize: getComputedStyle(h1).fontSize,
      letters,
      docOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  const tag = `${w}x${h}`;
  check(`${tag} name stays on one line`, m.lines === 1, `${m.lines} lines`);
  check(
    `${tag} name fits its column`,
    m.rowLeft >= m.hostLeft - 1 && m.rowRight <= m.hostRight + 1,
    `row ${m.rowLeft}..${m.rowRight} in ${m.hostLeft}..${m.hostRight}`,
  );
  check(`${tag} no horizontal page overflow`, m.docOverflow <= 0, `${m.docOverflow}px`);
  check(
    `${tag} nothing clipped vertically`,
    m.rowTop >= m.hostTop - 1 && m.rowBottom <= m.hostBottom + 1,
    `row ${m.rowTop}..${m.rowBottom} in ${m.hostTop}..${m.hostBottom}`,
  );
  check(`${tag} name does not collide with the meta rail`, m.rowBottom <= m.railTop + 1, `name ends ${m.rowBottom}, rail starts ${m.railTop}`);
  check(
    `${tag} name uses the width it is given`,
    m.rowW / m.hostW > 0.55,
    `${Math.round((m.rowW / m.hostW) * 100)}% of the column at ${m.fontSize}`,
  );

  await page.screenshot({ path: `artifacts/hero-${w}x${h}.png` });
  await page.close();
}

/* ── the letters actually move, and keep moving ─────────────── */
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3000);

const sample = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('h1[aria-label="Deebyanshu Jha"] .dos-letter')].map((el) => {
      const t = getComputedStyle(el).transform;
      return t === "none" ? "none" : t;
    }),
  );

const a = await sample();
await page.waitForTimeout(1300);
const b = await sample();
check("every character carries its own drift animation", a.length >= 12, `${a.length} animated letters`);
const moved = a.filter((t, i) => t !== b[i]).length;
check("the characters keep moving on their own", moved >= a.length * 0.5, `${moved}/${a.length} changed over 1.3s`);
const distinct = new Set(a).size;
check("characters are out of phase with each other", distinct >= 5, `${distinct} distinct transforms`);

/* ── the cursor lights the name ─────────────────────────────── */
const letterBox = await page.evaluate(() => {
  const els = [...document.querySelectorAll('h1[aria-label="Deebyanshu Jha"] [data-wordmark-row] > span')];
  const first = els[1].getBoundingClientRect();
  const last = els[els.length - 1].getBoundingClientRect();
  return {
    near: { x: first.left + first.width / 2, y: first.top + first.height / 2 },
    far: { x: last.left + last.width / 2, y: last.top + last.height / 2 },
  };
});
const colourOf = (which) =>
  page.evaluate((w) => {
    const els = [...document.querySelectorAll('h1[aria-label="Deebyanshu Jha"] [data-wordmark-row] > span')];
    const el = w === "near" ? els[1] : els[els.length - 1];
    // descend to the glyph itself: a scoped querySelector would still match
    // against document ancestry and hand back an outer wrapper
    let leaf = el;
    while (leaf.firstElementChild) leaf = leaf.firstElementChild;
    return getComputedStyle(leaf).color + "|" + getComputedStyle(leaf).textShadow;
  }, which);

await page.mouse.move(letterBox.far.x, letterBox.far.y + 400);
await page.waitForTimeout(600);
const restNear = await colourOf("near");
await page.mouse.move(letterBox.near.x, letterBox.near.y);
await page.waitForTimeout(600);
const litNear = await colourOf("near");
const litFar = await colourOf("far");
check("a character warms as the cursor reaches it", litNear !== restNear, `${restNear} -> ${litNear}`);
check("the light is local, not the whole word", litNear !== litFar, "far letter matched the near one");
await page.screenshot({ path: "artifacts/hero-lit.png" });

/* ── reduced motion ─────────────────────────────────────────── */
const still = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await still.emulateMedia({ reducedMotion: "reduce" });
await still.goto(BASE, { waitUntil: "networkidle" });
await still.waitForTimeout(2200);
const stillState = await still.evaluate(() => {
  const h1 = document.querySelector('h1[aria-label="Deebyanshu Jha"]');
  const drift = [...h1.querySelectorAll(".dos-letter")].map((e) => getComputedStyle(e).animationName);
  return {
    visible: h1.getBoundingClientRect().width > 100,
    text: h1.getAttribute("aria-label"),
    drifting: drift.filter((n) => n !== "none").length,
    lines: h1.querySelector("[data-wordmark-row]").getClientRects().length,
  };
});
check("reduced motion still shows the whole name", stillState.visible && stillState.lines === 1);
check("reduced motion runs no drift animation", stillState.drifting === 0, `${stillState.drifting} animating`);
await still.screenshot({ path: "artifacts/hero-reduced.png" });

await browser.close();
console.log(ok.join("\n"));
if (fails.length) {
  console.log("\n" + fails.join("\n"));
  process.exit(1);
}
console.log("\nhero ok");
