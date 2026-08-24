/**
 * The landing page interactions.
 *
 * Three things that are easy to break without noticing: the room light that
 * leans toward the cursor rather than chasing it, the tagline that comes apart
 * under the hand, and the console nothing advertises. The console has the
 * strictest rule of the three — a hidden thing must never take a keystroke
 * somebody meant for a real field — so that is checked directly.
 *
 * Requires the dev server: npm run dev
 */
import { chromium } from "@playwright/test";

const BASE = process.env.DOS_URL ?? "http://127.0.0.1:5173/";
const ok = [];
const fails = [];
const check = (l, good, d = "") => (good ? ok : fails).push(`${good ? "ok  " : "FAIL"} ${l}${d ? ` -- ${d}` : ""}`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2600);

/* ── 2a · the room's light leans toward the cursor ──────────── */
const lightXform = () =>
  page.evaluate(() => {
    const el = document.querySelector('[aria-hidden="true"].grain > div[style*="radial-gradient"]');
    return el ? getComputedStyle(el).transform : null;
  });

await page.mouse.move(200, 700);
await page.waitForTimeout(900);
const leftLean = await lightXform();
await page.mouse.move(1300, 200);
await page.waitForTimeout(1100);
const rightLean = await lightXform();
check("the room has a light layer", !!leftLean, "no glow element found");
check("the light leans as the cursor moves", leftLean !== rightLean, `${leftLean} -> ${rightLean}`);

const leanDistance = await page.evaluate(() => {
  const el = document.querySelector('[aria-hidden="true"].grain > div[style*="radial-gradient"]');
  const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
  return Math.hypot(m.m41, m.m42);
});
check(
  "the light stays on the machine rather than chasing the pointer",
  leanDistance > 4 && leanDistance < 280,
  `${Math.round(leanDistance)}px from home`,
);
await page.screenshot({ path: "artifacts/landing-light.png" });

/* ── 2b · the tagline takes itself apart ────────────────────── */
await page.evaluate(() => document.querySelector("#about")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(900);

const taglineSpans = async () =>
  page.evaluate(() => {
    const host = [...document.querySelectorAll("#about span")].find(
      (s) => s.textContent?.startsWith("Systems you can take apart") && s.children.length > 4,
    );
    if (!host) return null;
    return [...host.children].map((c) => getComputedStyle(c).transform);
  });

const restXf = await taglineSpans();
check("the tagline is set as separable words", !!restXf && restXf.length === 7, `${restXf?.length} words`);

const box = await page.evaluate(() => {
  const host = [...document.querySelectorAll("#about span")].find(
    (s) => s.textContent?.startsWith("Systems you can take apart") && s.children.length > 4,
  );
  const r = host.getBoundingClientRect();
  return { x: r.left + r.width * 0.3, y: r.top + r.height / 2, left: r.left, right: r.right };
});
await page.mouse.move(box.x, box.y);
await page.waitForTimeout(140);
await page.mouse.move(box.x + 6, box.y);
await page.waitForTimeout(500);
const openXf = await taglineSpans();
const moved = openXf.filter((t, i) => t !== restXf[i]).length;
check("the sentence opens under the cursor", moved >= 2, `${moved} words moved`);
check("only part of the line opens, not all of it", moved < openXf.length, `${moved}/${openXf.length} moved`);
await page.screenshot({ path: "artifacts/landing-takeapart.png" });

await page.mouse.move(box.x, box.y - 400);
await page.waitForTimeout(700);
const closedXf = await taglineSpans();
const stillOpen = closedXf.filter((t, i) => t !== restXf[i]).length;
check("and closes again behind it", stillOpen <= 2, `${stillOpen} still displaced`);

/* ── 3 · the console ────────────────────────────────────────── */
const consoleVisible = () =>
  page.locator('[role="dialog"][aria-label="DOS console"]').isVisible().catch(() => false);

check("nothing advertises the console", !(await consoleVisible()));
await page.keyboard.press("`");
await page.waitForTimeout(500);
check("backtick opens the console", await consoleVisible());

const log = () => page.locator('[aria-label="DOS console"]').innerText();

await page.keyboard.type("whoami");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const who = await log();
check("`whoami` answers with real profile data", who.includes("Deebyanshu Jha") && who.includes("Vellore"), who.slice(-90).replace(/\n/g, " | "));

await page.keyboard.type("projects");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const proj = await log();
check(
  "`projects` lists the real projects",
  proj.includes("Lamb") && proj.includes("ChatterNet") && proj.includes("Project Camp"),
);

await page.keyboard.type("nonsense");
await page.keyboard.press("Enter");
await page.waitForTimeout(250);
check("an unknown command is handled", (await log()).includes("not found"));

await page.keyboard.press("ArrowUp");
await page.waitForTimeout(200);
const recalled = await page.inputValue('[aria-label="Console input"]');
check("history recalls the last command", recalled === "nonsense", recalled);

await page.keyboard.press("Escape");
await page.waitForTimeout(400);
check("Escape closes it", !(await consoleVisible()));

/* the console must never eat a backtick meant for a real field */
await page.keyboard.press("`");
await page.waitForTimeout(400);
await page.click('[aria-label="Console input"]');
await page.fill('[aria-label="Console input"]', "");
await page.keyboard.type("a`b");
const typed = await page.inputValue('[aria-label="Console input"]');
check("a backtick typed inside the console stays text", typed === "a`b", typed);
await page.screenshot({ path: "artifacts/landing-console.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(300);

/* boot really enters the OS — the same door the machine opens */
const fresh = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await fresh.goto(BASE, { waitUntil: "networkidle" });
await fresh.waitForTimeout(2400);
await fresh.keyboard.press("`");
await fresh.waitForTimeout(400);
await fresh.keyboard.type("boot");
await fresh.keyboard.press("Enter");
const dock = fresh.getByRole("toolbar", { name: "Application dock" });
const booted = await dock.waitFor({ state: "visible", timeout: 15000 }).then(() => true).catch(() => false);
check("`boot` enters the system", booted, "never reached the desktop");
await fresh.screenshot({ path: "artifacts/landing-booted.png" });
await fresh.close();

/* ── reduced motion ─────────────────────────────────────────── */
const still = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await still.emulateMedia({ reducedMotion: "reduce" });
await still.goto(BASE, { waitUntil: "networkidle" });
await still.waitForTimeout(1800);
const stillState = await still.evaluate(() => ({
  glow: !!document.querySelector('[aria-hidden="true"].grain > div[style*="radial-gradient"]'),
  tagline: !![...document.querySelectorAll("#about span, #about p")].find((s) =>
    s.textContent?.startsWith("Systems you can take apart"),
  ),
}));
check("reduced motion drops the moving light entirely", !stillState.glow);
check("reduced motion keeps the tagline readable", stillState.tagline);

check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));

await browser.close();
console.log(ok.join("\n"));
if (fails.length) {
  console.log("\n" + fails.join("\n"));
  process.exit(1);
}
console.log("\nlanding ok");
