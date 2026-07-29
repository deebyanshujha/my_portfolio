import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const url = process.env.PORTFOLIO_URL ?? "http://127.0.0.1:5173/";
const outputDir = path.resolve("artifacts");

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

function hashText(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

async function sampleCanvas(page) {
  return page.locator("canvas").evaluate((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");

    if (!gl) {
      return { rect, width: canvas.width, height: canvas.height, nonEmptySamples: 0, dataUrl: canvas.toDataURL() };
    }

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const pixel = new Uint8Array(4);
    let nonEmptySamples = 0;

    for (let xStep = 1; xStep <= 7; xStep += 1) {
      for (let yStep = 1; yStep <= 7; yStep += 1) {
        const x = Math.floor((width * xStep) / 8);
        const y = Math.floor((height * yStep) / 8);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        const intensity = pixel[0] + pixel[1] + pixel[2] + pixel[3];
        if (intensity > 12) nonEmptySamples += 1;
      }
    }

    return { rect, width, height, nonEmptySamples, dataUrl: canvas.toDataURL("image/png") };
  });
}

async function verifyViewport(browser, viewport, label) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await page.waitForTimeout(900);

  const first = await sampleCanvas(page);
  await page.mouse.move(Math.round(viewport.width * 0.74), Math.round(viewport.height * 0.38), { steps: 12 });
  await page.waitForTimeout(700);
  const second = await sampleCanvas(page);

  if (second.width < 250 || second.height < 250) {
    throw new Error(`${label}: hero canvas is too small (${second.width}x${second.height})`);
  }

  if (second.nonEmptySamples < 3) {
    throw new Error(`${label}: hero canvas appears blank (${second.nonEmptySamples} non-empty samples)`);
  }

  if (hashText(first.dataUrl) === hashText(second.dataUrl)) {
    throw new Error(`${label}: hero canvas did not change after time/pointer movement`);
  }

  await page.screenshot({ path: path.join(outputDir, `hero-${label}.png`), fullPage: false });
  await page.close();
  return {
    label,
    canvas: `${second.width}x${second.height}`,
    nonEmptySamples: second.nonEmptySamples,
    screenshot: `artifacts/hero-${label}.png`,
  };
}

await mkdir(outputDir, { recursive: true });
const browser = await launchBrowser();

try {
  const results = [];
  results.push(await verifyViewport(browser, { width: 1440, height: 1000 }, "desktop"));
  results.push(await verifyViewport(browser, { width: 390, height: 844 }, "mobile"));
  console.table(results);
} finally {
  await browser.close();
}
