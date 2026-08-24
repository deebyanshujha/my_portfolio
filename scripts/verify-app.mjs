/**
 * End-to-end walkthrough of DOS.
 *
 * Drives the real experience: landing -> machine -> boot -> desktop, then every
 * application, window behaviour, dock, menu bar, Control Centre, terminal and
 * the compact layout. Screenshots land in artifacts/ for a visual pass.
 *
 * Requires the dev server: npm run dev
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import {
  auditCalendar,
  auditClock,
  auditIconPalette,
  auditSpotlight,
  auditDesktopFiles,
  auditMusic,
  auditWallpaper,
  auditWindowControls,
} from "./verify-desktop.mjs";

// 127.0.0.1 rather than localhost: it is the origin the dev server pins to,
// and the only http host Spotify accepts as a redirect URI
const BASE = process.env.DOS_URL ?? "http://127.0.0.1:5173/";
const OUT = "artifacts";
const failures = [];
const notes = [];

const check = (label, ok, detail = "") => {
  if (ok) notes.push(`  ok   ${label}`);
  else failures.push(`  FAIL ${label}${detail ? ` -- ${detail}` : ""}`);
};

const dock = (page, name) =>
  page.getByRole("toolbar", { name: "Application dock" }).getByRole("button", { name: new RegExp(`^${name} — `) });

const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });

/** Close every window so each app is verified from a clean desktop. */
const closeAll = async (page) => {
  await page
    .getByRole("menuitem", { name: "Window", exact: true })
    .click()
    .catch(() => {});
  await page
    .getByRole("menuitem", { name: "Close All Windows" })
    .click()
    .catch(() => {});
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);
};

/** A window counts as open only if it is painted, not merely present in the DOM. */
const isShown = (win) =>
  win
    .evaluate((n) => {
      const inner = n.firstElementChild;
      const r = n.getBoundingClientRect();
      return Number(getComputedStyle(inner).opacity) > 0.6 && r.width > 100 && r.height > 100;
    })
    .catch(() => false);


/**
 * The landing page at every size that matters.
 *
 * The oversized wordmark is the whole reason this exists: the column has to be
 * allowed to outgrow the viewport, and everything below the fold has to be
 * reachable rather than clipped away.
 */
const LANDING_SIZES = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [390, 844],
];

async function auditLanding(browser) {
  for (const [width, height] of LANDING_SIZES) {
    const at = `${width}x${height}`;
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: width < 500,
      hasTouch: width < 500,
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2400);

    const scroller = page.locator("[data-landing-scroll]");
    check(`landing ${at}: scroll container exists`, (await scroller.count()) === 1);

    const before = await page.evaluate(() => {
      const el = document.querySelector("[data-landing-scroll]");
      return {
        overflow: getComputedStyle(el).overflowY,
        room: el.scrollHeight - el.clientHeight,
        pageOverflowX:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        animations: document
          .getAnimations()
          .filter((a) => a.playState === "running").length,
      };
    });
    check(
      `landing ${at}: scrolls rather than clips`,
      before.overflow === "auto",
      `overflow-y=${before.overflow}`,
    );
    check(`landing ${at}: no horizontal overflow`, before.pageOverflowX <= 1, `${before.pageOverflowX}px`);

    /* the screen is alive before you ever touch it */
    const screen = page.locator("[data-dos-screen]");
    check(`landing ${at}: monitor shows a running system`, (await screen.count()) === 1);
    check(
      `landing ${at}: monitor screen is mid-initialisation`,
      (await screen.first().innerText()).includes("DOS SYSTEM"),
    );
    check(`landing ${at}: screen animates`, before.animations > 4, `${before.animations} running`);

    /* everything below the fold is reachable */
    const bottom = await page.evaluate(() => {
      const el = document.querySelector("[data-landing-scroll]");
      el.scrollTop = el.scrollHeight;
      return el.scrollTop > 0 || el.scrollHeight <= el.clientHeight + 1;
    });
    check(`landing ${at}: the column scrolls to its end`, bottom);
    await page.waitForTimeout(400);

    // bring the name and the rail into view the way a reader would
    await page.evaluate(() => {
      document.querySelector("[data-landing-meta]").scrollIntoView({ block: "end" });
    });
    await page.waitForTimeout(500);

    const after = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      const meta = document.querySelector("[data-landing-meta]");
      const w = h1.getBoundingClientRect();
      const m = meta.getBoundingClientRect();
      const screen = document.querySelector("[data-dos-screen]").getBoundingClientRect();
      return {
        wordmark: { top: w.top, bottom: w.bottom, left: w.left, right: w.right, h: w.height },
        meta: { top: m.top, bottom: m.bottom, h: m.height },
        screen: { w: screen.width, h: screen.height },
        vw: window.innerWidth,
        vh: window.innerHeight,
      };
    });

    check(
      `landing ${at}: whole wordmark is reachable`,
      after.wordmark.h > 20 &&
        after.wordmark.top > -1 &&
        after.wordmark.bottom <= after.vh + 1,
      `top ${Math.round(after.wordmark.top)}, bottom ${Math.round(after.wordmark.bottom)} of ${after.vh}`,
    );
    check(
      `landing ${at}: wordmark is not cut off sideways`,
      after.wordmark.left > -2 && after.wordmark.right <= after.vw + 2,
    );
    check(
      `landing ${at}: metadata rail is reachable`,
      after.meta.h > 5 && after.meta.bottom <= after.vh + 1 && after.meta.top >= -1,
      `bottom ${Math.round(after.meta.bottom)} of ${after.vh}`,
    );
    check(
      `landing ${at}: monitor keeps a sane size`,
      after.screen.w > 180 && after.screen.h > 110,
      `${Math.round(after.screen.w)}x${Math.round(after.screen.h)}`,
    );

    await shot(page, `00-landing-${at}`);
    await page.close();
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  await auditLanding(browser);

  await page.goto(BASE, { waitUntil: "networkidle" });

  /* landing */
  await page.waitForTimeout(2200);
  check(
    "landing shows the name",
    await page.getByRole("heading", { name: "Deebyanshu Jha" }).isVisible(),
  );
  const machine = page.getByRole("button", { name: /Enter DOS/i });
  check("machine is present and labelled", await machine.isVisible());
  await machine.hover();
  await page.waitForTimeout(500);
  await shot(page, "01-landing");

  /* entry + boot */
  const screenBox = await page.locator("[data-dos-screen]").boundingBox();
  await machine.click();
  // the screen wakes in place first, then the push begins
  await page.waitForTimeout(600);
  const pushOrigin = await page.evaluate(() => {
    const layer = document.querySelector(".z-boot");
    if (!layer) return null;
    const r = layer.getBoundingClientRect();
    return { w: r.width, h: r.height, vw: window.innerWidth };
  });
  check(
    "entry pushes the machine's own screen into the viewport",
    !!pushOrigin && pushOrigin.w < pushOrigin.vw * 0.92 && pushOrigin.w > screenBox.width * 0.5,
    pushOrigin ? `layer started ${Math.round(pushOrigin.w)}px wide, screen is ${Math.round(screenBox.width)}px` : "no push layer",
  );
  await page.waitForTimeout(400);
  await shot(page, "02-entering");
  await page.waitForTimeout(600);
  check(
    "boot sequence runs",
    await page.getByText("System initialising").isVisible().catch(() => false),
  );
  await shot(page, "03-boot");

  /* desktop */
  await page.waitForSelector('[role="toolbar"][aria-label="Application dock"]', {
    timeout: 8000,
  });
  await page.waitForTimeout(800);
  check("dock present", await page.getByRole("toolbar", { name: "Application dock" }).isVisible());
  check("menu bar present", await page.getByRole("menubar").isVisible());
  check(
    "desktop icons present",
    await page.getByRole("option", { name: /fib\.lamb/ }).isVisible(),
  );
  await shot(page, "04-desktop");

  /* every application opens */
  const APPS = [
    "Terminal",
    "Projects",
    "About",
    "Resume",
    "Skills",
    "Achievements",
    "GitHub",
    "Signal",
    "Settings",
  ];
  for (const name of APPS) {
    await closeAll(page);
    await dock(page, name).click();
    const win = page.getByRole("dialog", { name: `${name} window` });
    await win.waitFor({ state: "visible", timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(650);
    check(`${name} opens and is painted`, await isShown(win));
    await shot(page, `05-app-${name.toLowerCase()}`);
  }

  /* window behaviour */
  await closeAll(page);
  await dock(page, "Projects").click();
  const proj = page.getByRole("dialog", { name: "Projects window" });
  await proj.waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  const before = await proj.boundingBox();
  await page.mouse.move(before.x + before.width / 2, before.y + 18);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 - 180, before.y + 120, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(450);
  const after = await proj.boundingBox();
  check("window drags", Math.abs(after.x - before.x) > 100, `moved ${Math.round(after.x - before.x)}px`);

  await proj.getByRole("button", { name: "Maximize window" }).click();
  await page.waitForTimeout(600);
  const max = await proj.boundingBox();
  check("window maximizes", max.width > 1300, `width ${Math.round(max.width)}`);
  await shot(page, "06-maximized");
  await proj.getByRole("button", { name: "Restore window" }).click();
  await page.waitForTimeout(600);

  await proj.getByRole("button", { name: "Minimize window" }).click();
  await page.waitForTimeout(700);
  const minimized = await proj
    .evaluate((n) => Number(getComputedStyle(n.firstElementChild).opacity) < 0.15)
    .catch(() => true);
  check("window minimizes", minimized);
  await dock(page, "Projects").click();
  await page.waitForTimeout(600);
  check("window restores from the dock", await proj.isVisible());

  /* projects navigation */
  await proj.getByText("Lamb", { exact: true }).first().click();
  await page.waitForTimeout(500);
  check("project opens to its files", await proj.getByText("stack.json").isVisible());
  await shot(page, "07-projects-detail");
  await proj.getByRole("button", { name: "Close window" }).click();
  await page.waitForTimeout(300);

  /* menu bar */
  await dock(page, "Terminal").click();
  await page.waitForTimeout(500);
  await page.getByRole("menuitem", { name: "Shell", exact: true }).click();
  await page.waitForTimeout(300);
  check("app menu opens", await page.getByRole("menu", { name: "Shell" }).isVisible());
  await shot(page, "08-menu");
  await page.getByRole("menuitem", { name: /neofetch/ }).click();
  await page.waitForTimeout(500);
  check("menu item actually runs a command", await page.getByText(/dosh 1\.0/).isVisible());

  /* terminal */
  const input = page.getByRole("textbox", { name: "Terminal input" });
  await input.click();
  await input.fill("help");
  await input.press("Enter");
  await page.waitForTimeout(350);
  check("terminal help works", await page.getByText("Available commands").isVisible());

  await input.fill("lamb");
  await input.press("Enter");
  await page.waitForTimeout(400);
  const lambInput = page.getByRole("textbox", { name: "Lamb interpreter input" });
  check("lamb REPL starts", await lambInput.isVisible());
  await lambInput.fill(":sample");
  await lambInput.press("Enter");
  await page.waitForTimeout(600);
  check(
    "lamb actually evaluates fib(12) = 144",
    await page.getByText("144", { exact: true }).isVisible(),
  );
  await shot(page, "09-terminal-lamb");

  /* control centre */
  await page.getByRole("button", { name: "Control Centre" }).click();
  await page.waitForTimeout(400);
  const cc = page.getByRole("dialog", { name: "Control Centre" });
  check("control centre opens", await cc.isVisible());
  const bright = cc.getByRole("slider", { name: "Display brightness" });
  await bright.focus();
  for (let i = 0; i < 4; i++) await bright.press("ArrowLeft");
  await page.waitForTimeout(300);
  const brightness = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--brightness").trim(),
  );
  check("brightness slider changes a real value", Number(brightness) < 1, `--brightness=${brightness}`);
  await shot(page, "10-control-centre");
  const vol = cc.getByRole("slider", { name: "Volume" });
  await vol.focus();
  await vol.press("ArrowRight");
  await page.waitForTimeout(200);
  check("volume slider is keyboard operable", true);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  /* settings changes something real */
  await dock(page, "Settings").click();
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /Interstellar/ }).click();
  await page.waitForTimeout(350);
  const wall = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--wall-a").trim(),
  );
  check("wallpaper setting applies", wall === "#101822", `--wall-a=${wall}`);
  await shot(page, "11-settings");

  /* keyboard */
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(600);
  check(
    "Ctrl+K opens a terminal",
    (await page.getByRole("dialog", { name: "Terminal window" }).count()) > 0,
  );

  /* desktop files, window controls, playback, wallpaper */
  const tools = { check, shot, dock, closeAll, isShown };
  await auditDesktopFiles(page, tools);
  await auditWindowControls(page, tools);
  await auditMusic(page, tools);
  await auditWallpaper(page, tools);
  await auditCalendar(page, tools);
  await auditClock(page, tools);
  await auditSpotlight(page, tools);
  await auditIconPalette(page, tools);

  /* compact layout */
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(BASE, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(2000);
  await shot(mobile, "12-mobile-landing");
  await mobile.getByRole("button", { name: /Enter DOS/i }).click();
  await mobile.waitForTimeout(4200);
  check(
    "compact shell replaces the desktop",
    await mobile.getByRole("navigation", { name: "Applications" }).isVisible(),
  );
  await shot(mobile, "13-mobile-shell");
  await mobile.getByRole("button", { name: "Projects", exact: true }).click();
  await mobile.waitForTimeout(700);
  check("compact shell switches apps", await mobile.getByText("ChatterNet").first().isVisible());
  await shot(mobile, "14-mobile-projects");

  /* report */
  const realErrors = consoleErrors.filter((e) => !/favicon|manifest|404/i.test(e));
  check("no console errors", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));

  await browser.close();

  console.log(notes.join("\n"));
  if (failures.length) {
    console.log("\n" + failures.join("\n"));
    console.log(`\n${failures.length} check(s) failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${notes.length} checks passed. Screenshots in ${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
