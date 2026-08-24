# DOS — Deebyanshu Jha

An interactive desktop environment that happens to contain a portfolio.

Two stages. A typography-led landing page with a Mac-inspired machine standing in
a dark room, and — once you switch it on — a small operating system with a window
manager, a dock, a menu bar, a control centre and nine applications.

**Live:** https://deebyanshujha.github.io/my_portfolio/

---

## The idea

One rule drives the whole art direction: **the screen is the only light source.**
The landing environment is monochrome graphite, so every warm value in the frame is
light spilling out of the machine — the hover state, the floor pool, the glow on the
letterforms, the accent inside the OS. Nothing is warm for decoration.

The transition is not a page navigation. The machine's screen is a real DOM node;
clicking it wakes the display, dims the room, and expands that same surface to fill
the viewport on a single compositor transform. You enter the object you clicked.

## Not faking things

Every control in here does what it says:

- **The Lamb terminal easter egg is a real interpreter.** `lamb` in the Terminal
  drops into a working scanner → recursive-descent parser → AST → environment-chained
  evaluator ([`lamb.ts`](src/os/apps/terminal/lamb.ts)) supporting variables, closures,
  recursion, control flow and lexical scope — a small, genuine version of the
  [Lamb](https://github.com/deebyanshujha/Lamb) project it references. `:sample`
  actually computes `fib(12)`.
- **Signal plays real Spotify audio** through the Web Playback SDK, authorised with
  Authorization Code + PKCE — no client secret exists anywhere in this codebase. When
  Spotify is not connected it says so and offers to connect; it never dresses the
  local engine up as somebody's streaming account. The fallback is the **System Audio**
  engine, which synthesises its tracks live with the Web Audio API — real transport,
  real seeking, real volume, and a waveform drawn from the actual analyser node.
  Playback state lives in one store, so Signal, the Control Centre and the menu bar
  can never disagree.
- **The GitHub app talks to the GitHub API** and falls back to repository data from
  this codebase when it is rate-limited or offline, saying so in the toolbar.
- **Brightness dims the page** and says so; **volume drives the Web Audio master gain**
  and says it controls this site only. Neither pretends to touch the operating system.
- **The battery indicator only renders where the Battery Status API exists.** The
  network indicator reflects `navigator.onLine`.
- **Every menu item runs a command.** There is no decorative UI.

## Applications

| | |
|---|---|
| **Terminal** | `help` `about` `projects` `open <id>` `skills` `education` `achievements` `resume` `github` `contact` `neofetch` `history` `clear` `lamb` — plus a few that are not on the list |
| **Projects** | Finder-style: each project is a volume containing real files built from its data |
| **About** | Identity, summary, the numbers, focus areas, education |
| **Resume** | The PDF, with a typeset text fallback for browsers that will not embed one |
| **Skills** | A dependency graph of capability modules, not a logo wall |
| **Achievements** | Milestones and credentials, with credential IDs printed so they can be checked |
| **GitHub** | Live repositories, languages, stars, recent pushes |
| **Signal** | Spotify player (Web Playback SDK), or the local synthesis engine, with real album art |
| **Settings** | Wallpaper, accent, motion, interface effects, sound |

## Keyboard

`⌘/Ctrl K` terminal · `⌘W` close · `⌘M` minimize · `⌘,` settings · `` ⌘` `` cycle
windows · `Esc` close the front window · `Space` play/pause on the bare desktop ·
`⌘.` show hidden files in Projects. Typing `lamb` anywhere on the desktop does
something.

## Architecture

```
src/
  landing/            the room, the machine, the wordmark
  os/
    stage/            landing → waking → entering → booting → desktop
    kernel/           windowStore · appRegistry · settingsStore · musicStore · audio · appBus
    shell/            Desktop · MenuBar · Dock · Window · ControlCenter · mobile/
    apps/             the nine applications
  data/profile.ts     every fact on the site, in one file
```

Windows are managed centrally — applications receive `{ windowId, focused, payload }`
and compose shared primitives from `ApplicationShell`, which is what keeps nine
applications reading as one system. Window geometry lives in motion values so a drag
costs one compositor write instead of a React render. Each app is code-split.

Below 900px the desktop metaphor is replaced rather than squeezed: the same
applications become full-bleed sheets with an app bar.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind 3 · Motion 12. That is the entire runtime
dependency list — the machine, the icons and the sleeve art are all CSS and hand-drawn
SVG, and the audio is synthesised rather than shipped.

## Run it

```bash
npm install
npm run dev          # http://127.0.0.1:5173/
```

### Spotify (optional)

Signal runs on System Audio out of the box. To make it a real Spotify player:

1. Create an app at [developer.spotify.com](https://developer.spotify.com/dashboard).
2. Add both URLs as **Redirect URIs**, exactly as written:

   ```
   http://127.0.0.1:5173/
   https://deebyanshujha.github.io/my_portfolio/
   ```

   Spotify does not accept `http://localhost` — insecure redirects must use the
   literal loopback IP. The dev server is pinned to `127.0.0.1:5173` for exactly
   this reason, and Signal warns you (with a one-click fix) if the page is open
   on the wrong host.
3. Put the client id in `.env.local` for local development:

   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   ```

The client id is public by design — PKCE exists so a browser app never needs a
secret, and there is none here. Browser playback requires a Premium account;
anything else is reported honestly rather than silently degraded.

**Deploying.** `.env.local` is git-ignored, so it does not exist in CI — a build that
relied on it alone would compile an empty client id, and Signal would quietly drop to
System Audio on the deployed site while working perfectly on localhost. The id is
therefore also committed in [`.env.production`](.env.production), which is what the
GitHub Pages build uses. A `VITE_SPOTIFY_CLIENT_ID` repository secret overrides it if
you would rather keep it out of the repository.

The other half of a working deploy is the redirect URI: it has to match the deployed
page byte for byte, base path and trailing slash included. Signal prints the exact URI
the current build will send, under **Source**, whenever it is not connected — paste
that into the allow-list in the Spotify dashboard.

**Choosing what plays:** [`src/os/spotify/tracks.ts`](src/os/spotify/tracks.ts) is the
only file to edit. Paste Spotify links, URIs or bare ids into `SPOTIFY_TRACKS`, or set
`SPOTIFY_CONTEXT` to a playlist or album. Titles, artists, artwork and durations are
fetched live, so nothing in the UI can fall out of sync.

With both left empty — the shipped state — Signal falls back to the connected account's
own recent listening, then its top tracks, and labels the column accordingly
("Recently played", "Your top tracks"). That is real listening history, never a playlist
invented on anyone's behalf.

### Desktop wallpapers

Every wallpaper is a photograph, and they live in [`public/wallpaper/`](public/wallpaper).
To add one, drop the file there and add a row to `WALLPAPERS` in
[`src/os/kernel/settingsStore.ts`](src/os/kernel/settingsStore.ts) — an id, a name, a
note, and the three colours the desktop should use as ground behind it.

Each image is probed once before it is offered, so a missing file hides its own card in
Settings rather than showing a broken image, and a wallpaper chosen in an earlier
session that no longer resolves falls back to one that does. Photographs are
cover-cropped and graded — desaturated, darkened, weighted at the top and bottom edges
— so the menu bar, dock and desktop icons stay legible over any of them.

`public/` is the only place these belong. `dist/` is build output: anything dropped
there is deleted by the next build.

## Checks

```bash
npm run lint         # tsc -b
npm run build
npm run verify:app   # Playwright walkthrough (needs the dev server running)
```

`verify:app` drives the real experience end to end — the landing page at four viewport
sizes (scrolling, the full wordmark, the metadata rail, the live monitor screen), entry,
boot, every application, window drag/maximize/minimize/restore, the traffic-light
controls, the desktop files, the dock, a working menu item, the Control Centre sliders,
the Lamb interpreter, playback state across all three surfaces, the wallpaper switch and
the compact layout — and writes screenshots to `artifacts/`.

## Deployment

`.github/workflows/deploy.yml` builds with the correct Vite base path and publishes
to GitHub Pages on every push to `main`.
