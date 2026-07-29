import { chromium } from "@playwright/test";

const url = process.env.PORTFOLIO_URL ?? "http://127.0.0.1:5173/";

async function launchBrowser() {
  const attempts = [
    () => chromium.launch({ headless: true }),
    () => chromium.launch({ headless: true, channel: "msedge" }),
    () => chromium.launch({ headless: true, channel: "chrome" }),
  ];

  let lastError;
  for (const launch of attempts) {
    try {
      return await launch();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function assertVisible(locator, label) {
  if (!(await locator.isVisible({ timeout: 12000 }))) {
    throw new Error(`${label} was not visible`);
  }
}

const browser = await launchBrowser();

try {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    permissions: ["clipboard-write"],
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

  await assertVisible(page.getByRole("heading", { level: 1, name: /Deebyanshu Jha/i }), "hero heading");
  await assertVisible(page.getByRole("heading", { name: /Premium project work/i }), "projects heading");

  await page.getByRole("button", { name: "Networking" }).click();
  await assertVisible(page.getByRole("heading", { name: "ChatterNet" }), "Networking project filter result");

  await page.getByRole("button", { name: "All" }).click();
  await page.getByPlaceholder("Search projects").fill("Lamb");
  await assertVisible(page.getByRole("heading", { name: "Lamb" }), "project search result");

  await page.keyboard.press("Control+K");
  await assertVisible(page.getByPlaceholder("Search sections, projects, links"), "command palette");
  await page.getByPlaceholder("Search sections, projects, links").fill("Copy email");
  await page.getByRole("button", { name: /Copy email/i }).last().click();
  await assertVisible(page.getByText("Email copied"), "copy email toast");

  await page.goto(new URL("/not-a-route", url).toString(), { waitUntil: "networkidle" });
  await assertVisible(page.getByText("404"), "404 route");

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await mobile.getByLabel("Toggle navigation").click();
  await assertVisible(mobile.getByRole("button", { name: "About" }), "mobile navigation");

  console.table([
    { check: "desktop landing", status: "passed" },
    { check: "project filtering/search", status: "passed" },
    { check: "command palette/copy email", status: "passed" },
    { check: "404 route", status: "passed" },
    { check: "mobile navigation", status: "passed" },
  ]);
  await context.close();
} finally {
  await browser.close();
}
