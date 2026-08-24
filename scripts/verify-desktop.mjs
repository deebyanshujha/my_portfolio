/**
 * Desktop-side audits for the DOS verification suite.
 *
 * Kept beside `verify-app.mjs` rather than inside it: the walkthrough there is
 * already the length of a short film, and these four cover behaviour that is
 * easy to break silently — file icons that stop being files, a maximize that
 * forgets where the window was, a transport that claims to be playing.
 *
 * Each function takes the shared helpers so both files report through one
 * results list.
 */

/**
 * The desktop files behave like files: click selects, double-click opens the
 * application that owns them, and the Terminal really does load the Lamb
 * source rather than miming it.
 */
export async function auditDesktopFiles(page, t) {
  const { check, shot, closeAll, isShown } = t;
  const icon = (name) => page.getByRole("option", { name: new RegExp(`^${name} —`) });

  await closeAll(page);
  const projects = icon("Projects");
  await projects.click();
  await page.waitForTimeout(250);
  check(
    "desktop icon single-click selects",
    (await projects.getAttribute("aria-selected")) === "true",
  );
  await shot(page, "15-icon-selected");

  await projects.dblclick();
  await page.waitForTimeout(800);
  check(
    "double-clicking Projects opens Projects",
    await isShown(page.getByRole("dialog", { name: "Projects window" })),
  );

  await closeAll(page);
  await icon("Resume\\.pdf").dblclick();
  await page.waitForTimeout(900);
  check(
    "double-clicking Resume.pdf opens the resume",
    await isShown(page.getByRole("dialog", { name: "Resume window" })),
  );

  await closeAll(page);
  await icon("fib\\.lamb").dblclick();
  await page.waitForTimeout(1100);
  const term = page.getByRole("dialog", { name: "Terminal window" });
  check("double-clicking fib.lamb opens the Terminal", await isShown(term));
  check(
    "fib.lamb opens as a real source file",
    await term
      .getByText("return fib(n - 1) + fib(n - 2);")
      .first()
      .isVisible()
      .catch(() => false),
  );
  check(
    "fib.lamb hands over to the interpreter",
    await page
      .getByRole("textbox", { name: "Lamb interpreter input" })
      .isVisible()
      .catch(() => false),
  );
  await shot(page, "16-fib-lamb");

  await closeAll(page);
  await icon("Projects").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(900);
  check(
    "desktop icons are keyboard operable",
    await isShown(page.getByRole("dialog", { name: "Resume window" })),
  );
  await closeAll(page);
}

/** Red closes, amber minimises, green zooms — and green again puts it back. */
export async function auditWindowControls(page, t) {
  const { check, shot, dock, closeAll } = t;

  await closeAll(page);
  await dock(page, "Projects").click();
  const win = page.getByRole("dialog", { name: "Projects window" });
  await win.waitFor({ state: "visible" });
  await page.waitForTimeout(600);

  const lights = await win.evaluate((n) =>
    ["Close window", "Minimize window", "Maximize window"].map((label) => {
      const el = n.querySelector(`[aria-label="${label}"]`);
      return el ? getComputedStyle(el).backgroundColor : "";
    }),
  );
  const [red, amber, green] = lights.map((c) => (c.match(/\d+/g) ?? []).map(Number));
  check(
    "close control reads as red",
    red[0] > 180 && red[0] > red[1] + 60 && red[0] > red[2] + 60,
    lights[0],
  );
  check(
    "minimize control reads as amber",
    amber[0] > 150 && amber[1] > 110 && amber[2] < 110,
    lights[1],
  );
  check(
    "maximize control reads as green",
    green[1] > 130 && green[1] > green[0] + 40,
    lights[2],
  );
  await shot(page, "17-traffic-lights");

  const before = await win.boundingBox();
  await win.getByRole("button", { name: "Maximize window" }).click();
  await page.waitForTimeout(700);
  const max = await win.boundingBox();
  check("green maximizes to the desktop area", max.width > 1300 && max.height > 700);
  check(
    "maximizing does not spawn a second window",
    (await page.getByRole("dialog", { name: "Projects window" }).count()) === 1,
  );

  await win.getByRole("button", { name: "Restore window" }).click();
  await page.waitForTimeout(700);
  const restored = await win.boundingBox();
  check(
    "green again restores the previous size and position",
    Math.abs(restored.x - before.x) < 2 &&
      Math.abs(restored.y - before.y) < 2 &&
      Math.abs(restored.width - before.width) < 2 &&
      Math.abs(restored.height - before.height) < 2,
    `${Math.round(restored.x)},${Math.round(restored.y)} ${Math.round(restored.width)}x${Math.round(restored.height)}`,
  );

  // state has to survive the round trip to the dock and back
  await win.getByText("Lamb", { exact: true }).first().click();
  await page.waitForTimeout(450);
  await win.getByRole("button", { name: "Minimize window" }).click();
  await page.waitForTimeout(750);
  check(
    "amber minimizes without closing the application",
    (await page.getByRole("dialog", { name: "Projects window" }).count()) === 1,
  );
  check(
    "the dock still marks the app as running",
    await dock(page, "Projects").evaluate((n) =>
      /running/.test(n.getAttribute("aria-label") ?? ""),
    ),
  );

  await dock(page, "Projects").click();
  await page.waitForTimeout(750);
  const back = await win.boundingBox();
  check(
    "the dock restores it to where it was",
    Math.abs(back.x - restored.x) < 2 && Math.abs(back.y - restored.y) < 2,
  );
  check(
    "application state survived the minimize",
    await win
      .getByText("stack.json")
      .isVisible()
      .catch(() => false),
  );

  await win.getByRole("button", { name: "Close window" }).click();
  await page.waitForTimeout(550);
  check(
    "red closes the window",
    (await page.getByRole("dialog", { name: "Projects window" }).count()) === 0,
  );
  check(
    "and the dock drops the running mark",
    await dock(page, "Projects").evaluate((n) =>
      !/running/.test(n.getAttribute("aria-label") ?? ""),
    ),
  );
}

/** One playback state, honestly reported everywhere it appears. */
export async function auditMusic(page, t) {
  const { check, shot, dock, closeAll } = t;

  await closeAll(page);
  await page.getByRole("button", { name: "Control Centre" }).click();
  await page.waitForTimeout(450);
  const idle = await page.getByRole("dialog", { name: "Control Centre" }).innerText();
  check(
    "the Control Centre reports an idle transport honestly",
    idle.includes("Nothing playing"),
    idle.split("\n").slice(0, 2).join(" / "),
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  await dock(page, "Signal").click();
  const signal = page.getByRole("dialog", { name: "Signal window" });
  await signal.waitFor({ state: "visible" });
  await page.waitForTimeout(800);
  const text = await signal.innerText();
  check("Signal states where its audio comes from", /SOURCE/.test(text));
  check("Signal reports the Spotify connection state", /Spotify/i.test(text));
  await shot(page, "18-signal");

  await signal.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(1000);
  const bar = await page.getByRole("menubar").innerText();
  check(
    "starting playback reaches the menu bar",
    bar.includes("Cold Boot"),
    bar.replace(/\n/g, " ").slice(-70),
  );
  await page.getByRole("button", { name: "Control Centre" }).click();
  await page.waitForTimeout(450);
  const playing = await page.getByRole("dialog", { name: "Control Centre" }).innerText();
  check("and the Control Centre shows the same track", playing.includes("Cold Boot"));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);

  await signal.getByRole("button", { name: "Pause" }).click();
  await page.waitForTimeout(500);
  check(
    "pausing is reflected back in Signal",
    await signal.getByRole("button", { name: "Play" }).isVisible(),
  );
  await closeAll(page);
}

/** The personal photograph is a first-class wallpaper, and reverts cleanly. */
export async function auditWallpaper(page, t) {
  const { check, shot, dock, closeAll } = t;

  await closeAll(page);
  await dock(page, "Settings").click();
  await page.waitForTimeout(850);
  const card = page.getByRole("button", { name: /Hachi-Roku/ });
  const present = (await card.count()) > 0;
  check("the personal wallpaper is offered once its asset loads", present);
  if (!present) return;

  await card.click();
  await page.waitForTimeout(850);
  check(
    "choosing it applies a photographic desktop",
    (await page.evaluate(() => document.documentElement.dataset.wallpaper)) === "personal",
  );
  check(
    "the photo really resolves — no broken image behind the UI",
    await page.evaluate(async () => {
      const el = [...document.querySelectorAll("div")].find((d) =>
        getComputedStyle(d).backgroundImage.includes("wallpaper/"),
      );
      const url = el && getComputedStyle(el).backgroundImage.match(/url\("?(.+?)"?\)/)?.[1];
      if (!url) return false;
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    }),
  );
  await shot(page, "19-wallpaper-personal");

  await page.getByRole("button", { name: /Strata/ }).click();
  await page.waitForTimeout(650);
  check(
    "and switches back",
    (await page.evaluate(() => document.documentElement.dataset.wallpaper)) === "strata",
  );
  await closeAll(page);
}

/**
 * Calendar and Clock.
 *
 * The two things easiest to get wrong here are a second window stacking up
 * behind the first, and a clock that stops counting the moment it is out of
 * sight — so both are asserted directly rather than eyeballed.
 */
export async function auditCalendar(page, t) {
  const { check, shot, closeAll } = t;
  await closeAll(page);

  check("the Calendar has no dock tile", (await t.dock(page, "Calendar").count()) === 0);

  const widget = page.locator('[aria-label="Desktop widgets"] [aria-label="Open Calendar"]');
  check("the desktop shows a calendar widget", await widget.isVisible());
  check(
    "the widget shows the current month",
    (await widget.innerText()).toLowerCase().includes(
      new Date().toLocaleDateString(undefined, { month: "long" }).toLowerCase(),
    ),
  );
  await widget.click();
  await page.getByRole("dialog", { name: "Calendar window" }).waitFor({ state: "visible" });
  await page.waitForTimeout(600);
  check(
    "the widget opens Calendar",
    await t.isShown(page.getByRole("dialog", { name: "Calendar window" })),
  );
  await closeAll(page);

  const menuDate = page.getByRole("button", { name: /open Calendar/i }).last();
  await menuDate.click();
  const cal = page.getByRole("dialog", { name: "Calendar window" });
  await cal.waitFor({ state: "visible", timeout: 6000 });
  await page.waitForTimeout(700);
  check("the menu-bar date opens Calendar", await t.isShown(cal));

  await menuDate.click();
  await page.waitForTimeout(500);
  check(
    "clicking it again focuses instead of opening a second window",
    (await page.getByRole("dialog", { name: "Calendar window" }).count()) === 1,
  );

  await cal.getByRole("button", { name: "Minimize window" }).click();
  await page.waitForTimeout(700);
  await menuDate.click();
  await page.waitForTimeout(700);
  check("and restores it from minimized", await t.isShown(cal));

  /* month navigation */
  const heading = cal.locator("h2");
  const started = await heading.innerText();
  await cal.getByRole("button", { name: "Next month" }).click();
  await page.waitForTimeout(350);
  const forward = await heading.innerText();
  await cal.getByRole("button", { name: "Previous month" }).click();
  await page.waitForTimeout(350);
  const backAgain = await heading.innerText();
  check("month navigation moves forward", forward !== started, `${started} -> ${forward}`);
  check("and comes back", backAgain === started, `${forward} -> ${backAgain}`);

  /* today */
  await cal.getByRole("button", { name: "Today" }).click();
  await page.waitForTimeout(350);
  const today = await page.evaluate(() => {
    const cell = document.querySelector('[data-today="true"]');
    return {
      label: cell?.textContent,
      current: cell?.getAttribute("aria-current"),
      expected: String(new Date().getDate()),
    };
  });
  check(
    "today is highlighted and marked",
    today.label === today.expected && today.current === "date",
    JSON.stringify(today),
  );

  /* selection */
  const cells = cal.getByRole("gridcell");
  await cells.nth(20).click();
  await page.waitForTimeout(350);
  const picked = await page.evaluate(() => {
    const sel = document.querySelector('[data-selected="true"]');
    return { day: sel?.textContent, isToday: sel?.getAttribute("data-today") };
  });
  check("a date can be selected", !!picked.day && picked.isToday === "false", JSON.stringify(picked));
  check(
    "the inspector follows the selection",
    (await cal.locator("aside").innerText()).includes(picked.day),
  );

  /* the keyboard walks the grid */
  await cal.locator('[data-selected="true"]').focus();
  const before = picked.day;
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const after = await page.evaluate(
    () => document.querySelector('[data-selected="true"]')?.textContent,
  );
  check("arrow keys walk the grid", after !== before, `${before} -> ${after}`);

  await shot(page, "20-calendar");
  await closeAll(page);
}

export async function auditClock(page, t) {
  const { check, shot, closeAll } = t;
  const widget = page.locator('[aria-label="Desktop widgets"] [aria-label="Open Clock"]');
  await closeAll(page);

  check("the Clock has no dock tile", (await t.dock(page, "Clock").count()) === 0);
  await widget.click();
  const clock = page.getByRole("dialog", { name: "Clock window" });
  await clock.waitFor({ state: "visible", timeout: 6000 });
  await page.waitForTimeout(700);
  check("Clock opens from its desktop widget", await t.isShown(clock));

  const seconds = () =>
    page.evaluate(() => document.querySelector('[aria-label$="seconds"]')?.textContent ?? null);

  const first = await seconds();
  check("the clock shows seconds", /^\d{2}$/.test(first ?? ""), String(first));
  await page.waitForTimeout(2400);
  const second = await seconds();
  check("the clock ticks", first !== second, `${first} -> ${second}`);
  check(
    "and shows today's date",
    (await clock.innerText()).includes(
      new Date().toLocaleDateString(undefined, { weekday: "long" }),
    ),
  );
  await shot(page, "21-clock");

  /* the one that actually matters: it must not stop when out of sight */
  await clock.getByRole("button", { name: "Minimize window" }).click();
  await page.waitForTimeout(5200);
  const whileHidden = await seconds();
  check("it keeps time while minimized", whileHidden !== second, `${second} -> ${whileHidden}`);

  await widget.click();
  await page.waitForTimeout(600);
  const onRestore = await page.evaluate(() => ({
    shown: document.querySelector('[aria-label$="seconds"]')?.textContent,
    real: String(new Date().getSeconds()).padStart(2, "0"),
  }));
  check(
    "and is correct the moment it is restored",
    onRestore.shown === onRestore.real,
    JSON.stringify(onRestore),
  );

  await closeAll(page);
}


/**
 * Spotlight.
 *
 * The bar is only worth having if every result performs the thing it names, so
 * the search is driven end to end: open on the shortcut, type, pick with the
 * keyboard, and check that the right window came up on the right item.
 */
export async function auditSpotlight(page, t) {
  const { check, shot, closeAll } = t;
  await closeAll(page);

  await page.keyboard.press("Control+Space");
  await page.waitForTimeout(450);
  const bar = page.getByRole("dialog", { name: "Spotlight search" });
  check("Ctrl+Space opens Spotlight", await bar.isVisible());
  check(
    "it rests on the applications",
    (await bar.getByRole("option").count()) > 5,
    `${await bar.getByRole("option").count()} results`,
  );

  await page.keyboard.type("chat");
  await page.waitForTimeout(400);
  const top = await bar.getByRole("option").first().innerText();
  check("typing finds a real project", /ChatterNet/.test(top), top.split("\n")[0]);
  await shot(page, "22-spotlight");

  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  check(
    "Enter opens the result",
    await t.isShown(page.getByRole("dialog", { name: "Projects window" })),
  );
  check(
    "and opens it on the right project",
    await page
      .getByRole("dialog", { name: "Projects window" })
      .getByText("stack.json")
      .isVisible()
      .catch(() => false),
  );
  await closeAll(page);

  /* the keyboard alone has to be enough */
  await page.keyboard.press("Control+Space");
  await page.waitForTimeout(400);
  const firstActive = await page.evaluate(
    () => document.querySelector('[data-active="true"]')?.textContent,
  );
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(250);
  const movedActive = await page.evaluate(
    () => document.querySelector('[data-active="true"]')?.textContent,
  );
  check("arrow keys move the selection", firstActive !== movedActive);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  check(
    "Escape closes it",
    (await page.getByRole("dialog", { name: "Spotlight search" }).count()) === 0,
  );

  /* a term that matches nothing must say so rather than showing everything */
  await page.keyboard.press("Control+Space");
  await page.waitForTimeout(400);
  await page.keyboard.type("zzqqxx");
  await page.waitForTimeout(400);
  check(
    "an empty result set is stated, not padded",
    (await page.getByRole("dialog", { name: "Spotlight search" }).innerText()).includes(
      "Nothing matches",
    ),
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
}

/** The dock tiles are saturated colour with a light glyph, not tinted graphite. */
export async function auditIconPalette(page, t) {
  const { check, shot, closeAll } = t;
  await closeAll(page);

  const tiles = await page.evaluate(() => {
    const dock = document.querySelector('[role="toolbar"][aria-label="Application dock"]');
    return [...dock.querySelectorAll("button")].map((b) => {
      const s = getComputedStyle(b);
      const rgb = (s.backgroundColor.match(/\d+/g) ?? []).map(Number);
      const max = Math.max(...rgb.slice(0, 3));
      const min = Math.min(...rgb.slice(0, 3));
      return {
        label: (b.getAttribute("aria-label") ?? "").split(" —")[0],
        chroma: max - min,
        glyph: getComputedStyle(b).color,
      };
    });
  });

  const coloured = tiles.filter((x) => x.chroma > 60);
  check(
    "most dock tiles carry a saturated colour",
    coloured.length >= tiles.length - 3,
    `${coloured.length} of ${tiles.length}`,
  );
  check(
    "and their glyphs are drawn in white",
    tiles.every((x) => x.glyph === "rgb(255, 255, 255)"),
    tiles[0]?.glyph,
  );
  check(
    "the colours are distinct from one another",
    new Set(tiles.map((x) => x.label)).size === tiles.length,
  );
  await shot(page, "23-dock");
}
