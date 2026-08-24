import { useSyncExternalStore } from "react";

export type WallpaperId =
  | "steveg"
  | "anfield"
  | "zoro"
  | "interstellar"
  | "summit"
  | "kohli"
  | "personal";

export type AccentId = "phosphor" | "signal" | "ember";
export type MotionMode = "full" | "reduced" | "off";

export type Settings = {
  wallpaper: WallpaperId;
  accent: AccentId;
  motion: MotionMode;
  effects: boolean;
  soundEnabled: boolean;
  volume: number; // 0..1
  brightness: number; // 0.35..1
};

const wallpaperSrc = (file: string) =>
  `${import.meta.env.BASE_URL}wallpaper/${file}`;

export type Wallpaper = {
  id: WallpaperId;
  name: string;
  note: string;
  /** the colours behind and around the photo, so the grade stays consistent */
  vars: { a: string; b: string; c: string };
  photo: string;
};

/**
 * Drop a photo in `public/wallpaper/` and add a row here and it becomes a
 * selectable wallpaper. Each one is probed before it is offered, so a missing
 * file hides its own card rather than showing the desktop a broken image.
 */
export const WALLPAPERS: Wallpaper[] = [
  {
    id: "steveg",
    name: "Captain",
    note: "Steven Gerrard, Anfield, knee-slide",
    vars: { a: "#1d1113", b: "#08060a", c: "rgba(214,90,80,0.09)" },
    photo: wallpaperSrc("steveg.jpg"),
  },
  {
    id: "anfield",
    name: "Never Walk Alone",
    note: "The Kop, scarves up",
    vars: { a: "#1e1012", b: "#070508", c: "rgba(220,70,70,0.10)" },
    photo: wallpaperSrc("anfield.jpg"),
  },
  {
    id: "zoro",
    name: "Three Swords",
    note: "Ink, with one red accent",
    vars: { a: "#16161a", b: "#08080a", c: "rgba(200,60,60,0.08)" },
    photo: wallpaperSrc("zoro.jpg"),
  },
  {
    id: "interstellar",
    name: "Interstellar",
    note: "Cold horizon, long falloff",
    vars: { a: "#101822", b: "#04060a", c: "rgba(140,180,215,0.08)" },
    photo: wallpaperSrc("interstellar.jpg"),
  },
  {
    id: "summit",
    name: "Summit",
    note: "Alpenglow under a clear sky",
    vars: { a: "#111524", b: "#04050b", c: "rgba(226,160,90,0.08)" },
    photo: wallpaperSrc("summit.jpg"),
  },
  {
    id: "kohli",
    name: "Chase",
    note: "Virat Kohli, floodlit",
    vars: { a: "#141a16", b: "#05070a", c: "rgba(120,190,140,0.07)" },
    photo: wallpaperSrc("kohli.jpg"),
  },
  {
    id: "personal",
    name: "Hachi-Roku",
    note: "Personal photograph, graded for readability",
    vars: { a: "#141a1e", b: "#05070a", c: "rgba(160,190,205,0.07)" },
    photo: wallpaperSrc("deebyanshu.jpg"),
  },
];

export const wallpaperById = (id: WallpaperId): Wallpaper | undefined =>
  WALLPAPERS.find((w) => w.id === id);

/* ── photo availability ──────────────────────────────────────────────
   Every wallpaper is an optional asset. Each is probed exactly once and every
   consumer subscribes to the answers rather than guessing. An id missing from
   the map is still being probed. */

const photoReady = new Map<WallpaperId, boolean>();
const photoListeners = new Set<() => void>();
/** rebuilt on every settle so useSyncExternalStore sees a stable snapshot */
let photoSnapshot: ReadonlyMap<WallpaperId, boolean> = new Map();
let probed = false;

function settle(id: WallpaperId, ok: boolean) {
  photoReady.set(id, ok);
  photoSnapshot = new Map(photoReady);
  photoListeners.forEach((l) => l());
  if (id !== state.wallpaper) return;
  if (ok) {
    // the chosen photo has arrived — repaint the ground under it
    applySettings(state);
    return;
  }
  // never leave the desktop pointing at a wallpaper that cannot load
  const alternative = WALLPAPERS.find(
    (w) => w.id !== id && photoReady.get(w.id) === true,
  );
  if (alternative) settingsStore.set({ wallpaper: alternative.id });
  else applySettings(state);
}

function probePhotos() {
  if (probed || typeof window === "undefined") return;
  probed = true;
  // the selected wallpaper first: it is the one the desktop is waiting on
  const order = [...WALLPAPERS].sort((a, b) =>
    a.id === state.wallpaper ? -1 : b.id === state.wallpaper ? 1 : 0,
  );
  for (const wall of order) {
    const img = new Image();
    img.onload = () => settle(wall.id, true);
    img.onerror = () => settle(wall.id, false);
    img.src = wall.photo;
  }
}

export const photoWallpapers = {
  snapshot: () => photoSnapshot,
  subscribe(l: () => void) {
    photoListeners.add(l);
    probePhotos();
    return () => photoListeners.delete(l);
  },
};

const NO_PHOTOS: ReadonlyMap<WallpaperId, boolean> = new Map();

/** Which wallpaper photographs have loaded. An absent id is still pending. */
export function usePhotoWallpapers(): ReadonlyMap<WallpaperId, boolean> {
  return useSyncExternalStore(
    photoWallpapers.subscribe,
    photoWallpapers.snapshot,
    () => NO_PHOTOS,
  );
}

const KEY = "dos:settings";

const DEFAULTS: Settings = {
  wallpaper: "interstellar",
  accent: "phosphor",
  // follow the operating system by default; "full" is an explicit opt-out
  motion: "reduced",
  effects: true,
  soundEnabled: true,
  volume: 0.6,
  brightness: 1,
};

function read(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const stored = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
    // a wallpaper that no longer exists — an earlier build's generated grounds,
    // say — must not strand a returning visitor on a background we cannot draw
    if (!wallpaperById(stored.wallpaper)) stored.wallpaper = DEFAULTS.wallpaper;
    return stored;
  } catch {
    return DEFAULTS;
  }
}

let state: Settings = read();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Push settings into CSS custom properties / data attributes on <html>. */
export function applySettings(s: Settings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const wall = wallpaperById(s.wallpaper) ?? WALLPAPERS[0];
  // Each wallpaper's colours are graded to its photograph, so they paint the
  // ground immediately — the photo itself only appears once it has decoded,
  // which means no flash of an unrelated background while it loads.
  const ready = photoReady.get(wall.id) === true;
  root.style.setProperty("--wall-a", wall.vars.a);
  root.style.setProperty("--wall-b", wall.vars.b);
  root.style.setProperty("--wall-c", wall.vars.c);
  root.style.setProperty(
    "--wall-photo",
    ready ? `url("${wall.photo}")` : "none",
  );
  root.dataset.wallpaper = wall.id;
  root.style.setProperty("--brightness", String(s.brightness));
  root.dataset.accent = s.accent;
  root.dataset.motion = s.motion;
  root.dataset.effects = s.effects ? "on" : "off";
}

export const settingsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  set(patch: Partial<Settings>) {
    state = { ...state, ...patch };
    applySettings(state);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — settings stay in-memory for this session */
    }
    emit();
  },
  reset() {
    state = { ...DEFAULTS };
    applySettings(state);
    try {
      window.localStorage.removeItem(KEY);
      window.sessionStorage.removeItem("dos:booted");
    } catch {
      /* ignore */
    }
    emit();
  },
};

export function useSettings(): Settings {
  return useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.get,
    () => DEFAULTS,
  );
}

/** True when animation should be suppressed (user setting or OS preference). */
export function prefersStill(s: Settings): boolean {
  if (s.motion === "off") return true;
  if (s.motion === "full") return false;
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
