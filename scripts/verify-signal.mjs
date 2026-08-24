import { chromium } from "@playwright/test";

/**
 * Signal's Spotify search, driven against a stubbed Spotify.
 *
 * Nothing here talks to Spotify. The token, the Web Playback SDK device and
 * every /v1 response are stood in for, so what is under test is exactly the
 * part that is mine: which endpoint is called, with which paging parameters,
 * how the results are mapped and rendered, and where a click ends up.
 */

const BASE = process.env.DOS_URL ?? "http://127.0.0.1:5173/";
const ok = [];
const fails = [];
const check = (l, good, d = "") => (good ? ok : fails).push(`${good ? "ok  " : "FAIL"} ${l}${d ? ` -- ${d}` : ""}`);

const track = (i, q) => ({
  id: `id${i}`,
  uri: `spotify:track:uri${i}`,
  name: `${q} result ${i}`,
  duration_ms: 180000 + i * 1000,
  artists: [{ name: `Artist ${i}` }],
  album: {
    name: `Album ${i}`,
    images: [
      { url: "https://i.scdn.co/image/big", width: 640 },
      { url: `https://i.scdn.co/image/mid${i}`, width: 300 },
    ],
  },
});

const browser = await chromium.launch();

async function session({ empty = false, fail = 0 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const calls = [];

  // a signed-in session and a Web Playback device, without Spotify
  await ctx.addInitScript(() => {
    localStorage.setItem(
      "dos:spotify:token",
      JSON.stringify({ accessToken: "stub-token", expiresAt: Date.now() + 3600_000, refreshToken: "r" }),
    );
    let readyCb = null;
    window.Spotify = {
      Player: class {
        constructor() {
          this.listeners = {};
        }
        addListener(evt, cb) {
          this.listeners[evt] = cb;
          if (evt === "ready") readyCb = cb;
          return true;
        }
        async connect() {
          setTimeout(() => readyCb?.({ device_id: "stub-device" }), 30);
          return true;
        }
        disconnect() {}
        async getCurrentState() {
          return null;
        }
        async togglePlay() {}
        async pause() {}
        async resume() {}
        async nextTrack() {}
        async previousTrack() {}
        async seek() {}
        async setVolume() {}
      },
    };
  });

  await ctx.route("https://sdk.scdn.co/**", (r) => r.fulfill({ status: 200, body: "" }));

  await ctx.route("https://api.spotify.com/**", async (route) => {
    const url = new URL(route.request().url());
    calls.push({
      path: url.pathname,
      params: Object.fromEntries(url.searchParams),
      method: route.request().method(),
      body: route.request().postData(),
    });
    const json = (o, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(o) });

    if (url.pathname === "/v1/me") return json({ display_name: "Tester", id: "t", product: "premium" });
    if (url.pathname === "/v1/search") {
      if (fail) return json({ error: { status: fail } }, fail);
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const q = url.searchParams.get("q");
      if (empty) return json({ tracks: { items: [], total: 0, next: null } });
      const items = Array.from({ length: 10 }, (_, k) => track(offset + k, q));
      return json({
        tracks: { items, total: 42, next: offset + 10 < 42 ? "next-page" : null },
      });
    }
    if (url.pathname === "/v1/me/player/recently-played") return json({ items: [] });
    if (url.pathname === "/v1/me/top/tracks") return json({ items: [] });
    return json({}, 204);
  });

  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);

  // straight into the system, then open Signal
  await page.getByRole("button", { name: /Enter DOS/i }).click();
  await page.getByRole("toolbar", { name: "Application dock" }).waitFor({ timeout: 20000 });
  await page
    .getByRole("toolbar", { name: "Application dock" })
    .getByRole("button", { name: /^Signal — / })
    .click();
  await page.getByRole("dialog", { name: "Signal window" }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(1200);

  return { ctx, page, calls, errors };
}

/* ── a real search, paged ────────────────────────────────────── */
{
  const { ctx, page, calls, errors } = await session();
  const field = page.getByRole("searchbox");
  check("the field offers a catalogue search once connected", (await field.getAttribute("placeholder")) === "Search Spotify", await field.getAttribute("placeholder"));

  await field.fill("midnight");
  await page.waitForTimeout(1100);

  const searches = calls.filter((c) => c.path === "/v1/search");
  check("it calls /v1/search", searches.length >= 1, `${searches.length} calls`);
  check("it asks for tracks", searches[0]?.params.type === "track", searches[0]?.params.type);
  check("it respects the 10-item cap", searches[0]?.params.limit === "10", searches[0]?.params.limit);
  check("the first page starts at offset 0", searches[0]?.params.offset === "0", searches[0]?.params.offset);
  check("the query is sent", searches[0]?.params.q === "midnight", searches[0]?.params.q);

  // scoped to the search: the desktop icons behind Signal are options too
  const options = page.getByRole("listbox", { name: "Song results" }).getByRole("option");
  await options.first().waitFor({ timeout: 5000 });
  check("ten results render", (await options.count()) === 10, `${await options.count()}`);

  const firstRow = await options.first().innerText();
  check("a result shows the track name", firstRow.includes("midnight result 0"), firstRow.replace(/\n/g, " | "));
  check("a result shows artist and album", firstRow.includes("Artist 0") && firstRow.includes("Album 0"), firstRow.replace(/\n/g, " | "));
  const art = await options.first().locator("img").getAttribute("src").catch(() => null);
  check("a result shows Spotify's own artwork, unaltered", art === "https://i.scdn.co/image/mid0", String(art));

  const panel = page.getByRole("dialog", { name: "Signal window" });
  check(
    "the group is counted against the catalogue total",
    /10\s+of\s+42/i.test(await panel.innerText()),
    "no count shown",
  );

  /* ── load more ── */
  const more = page.getByRole("button", { name: /Load 10 more/i });
  check("a load-more is offered while Spotify says there is more", await more.isVisible());
  await more.click();
  await page.waitForTimeout(900);
  const paged = calls.filter((c) => c.path === "/v1/search");
  check("the next page uses offset, not a bigger limit", paged.at(-1)?.params.offset === "10" && paged.at(-1)?.params.limit === "10", JSON.stringify(paged.at(-1)?.params));
  check("the second page is appended, not swapped in", (await options.count()) === 20, `${await options.count()} rows`);

  await page.screenshot({ path: "artifacts/signal-search.png" });

  /* ── a result reaches the existing player ── */
  await options.nth(3).click();
  await page.waitForTimeout(900);
  const play = calls.filter((c) => c.method === "PUT" && c.path.startsWith("/v1/me/player/play"));
  check("choosing a result reaches the existing playback path", play.length === 1, `${play.length} play calls`);
  check(
    "and it plays that track's URI on this device",
    !!play[0] && play[0].body.includes("spotify:track:uri3") && play[0].path.includes("play"),
    play[0]?.body?.slice(0, 120),
  );
  check("no page errors", errors.length === 0, errors[0] ?? "");
  await ctx.close();
}

/* ── typing does not spray requests ──────────────────────────── */
{
  const { ctx, page, calls } = await session();
  const field = page.getByRole("searchbox");
  for (const ch of "electric") {
    await field.press(ch);
    await page.waitForTimeout(45);
  }
  await page.waitForTimeout(1200);
  const searches = calls.filter((c) => c.path === "/v1/search");
  check("typing eight characters costs one search, not eight", searches.length === 1, `${searches.length} requests`);
  check("and it searches the whole word", searches[0]?.params.q === "electric", searches[0]?.params.q);
  await ctx.close();
}

/* ── nothing found ───────────────────────────────────────────── */
{
  const { ctx, page } = await session({ empty: true });
  await page.getByRole("searchbox").fill("qqqzzz");
  await page.waitForTimeout(1200);
  const panel = await page.getByRole("dialog", { name: "Signal window" }).innerText();
  check("an empty catalogue result says so", panel.includes("No song matches"), panel.slice(0, 120).replace(/\n/g, " | "));
  check("and offers no load-more", !(await page.getByRole("button", { name: /Load 10 more/i }).isVisible().catch(() => false)));
  await ctx.close();
}

/* ── Spotify refuses ─────────────────────────────────────────── */
{
  const { ctx, page, calls } = await session({ fail: 429 });
  await page.getByRole("searchbox").fill("anything");
  await page.waitForTimeout(1300);
  const panel = await page.getByRole("dialog", { name: "Signal window" }).innerText();
  check("a refused search is reported, not swallowed", /rate-limit/i.test(panel), panel.slice(0, 160).replace(/\n/g, " | "));
  const retry = page.getByRole("button", { name: /Try again/i });
  check("and can be retried", await retry.isVisible());
  const before = calls.filter((c) => c.path === "/v1/search").length;
  await retry.click();
  await page.waitForTimeout(700);
  check("retry really re-requests", calls.filter((c) => c.path === "/v1/search").length > before);
  await page.screenshot({ path: "artifacts/signal-error.png" });
  await ctx.close();
}

/* ── not connected ───────────────────────────────────────────── */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.getByRole("button", { name: /Enter DOS/i }).click();
  await page.getByRole("toolbar", { name: "Application dock" }).waitFor({ timeout: 20000 });
  await page
    .getByRole("toolbar", { name: "Application dock" })
    .getByRole("button", { name: /^Signal — / })
    .click();
  await page.getByRole("dialog", { name: "Signal window" }).waitFor({ timeout: 8000 });
  await page.waitForTimeout(800);

  const panel = await page.getByRole("dialog", { name: "Signal window" }).innerText();
  check("without a session it asks for one instead of faking results", panel.includes("Connect Spotify to search the catalogue"), panel.slice(0, 200).replace(/\n/g, " | "));
  check("the placeholder does not promise Spotify", (await page.getByRole("searchbox").getAttribute("placeholder")) === "Search songs");
  await page.screenshot({ path: "artifacts/signal-disconnected.png" });
  await ctx.close();
}

await browser.close();
console.log(ok.join("\n"));
if (fails.length) {
  console.log("\n" + fails.join("\n"));
  process.exit(1);
}
console.log("\nsignal ok");
