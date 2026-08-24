import { useSyncExternalStore } from "react";

export type WallpaperId = "strata" | "aperture" | "meridian" | "carbon" | "personal";

/**
 * Drop a photo at this path and it becomes a selectable wallpaper. Nothing
 * else needs changing: the option appears in Settings once the file loads and
 * stays hidden if it is missing, so the desktop can never show a broken image.
 */
export const PERSONAL_WALLPAPER_SRC = `${import.meta.env.BASE_URL}wallpaper/deebyanshu.jpg`;
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

export const WALLPAPERS: {
  id: WallpaperId;
  name: string;
  note: string;
  vars: { a: string; b: string; c: string };
  /** a photograph rather than a generated ground */
  photo?: string;
}[] = [
  {
    id: "strata",
    name: "Strata",
    note: "Deep indigo, single light source",
    vars: { a: "#101218", b: "#05060a", c: "rgba(232,184,75,0.07)" },
  },
  {
    id: "aperture",
    name: "Aperture",
    note: "Cold graphite, wide falloff",
    vars: { a: "#14161c", b: "#0a0b0e", c: "rgba(148,163,184,0.08)" },
  },
  {
    id: "meridian",
    name: "Meridian",
    note: "Warm horizon at low elevation",
    vars: { a: "#1a1512", b: "#08070a", c: "rgba(226,140,90,0.09)" },
  },
  {
    id: "carbon",
    name: "Carbon",
    note: "Near-black, minimum luminance",
    vars: { a: "#0c0c0e", b: "#050506", c: "rgba(237,234,228,0.04)" },
  },
  {
    id: "personal",
    name: "Hachi-Roku",
    note: "Personal photograph, graded for readability",
    // the colours behind and around the photo, so the grade stays consistent
    vars: { a: "#141a1e", b: "#05070a", c: "rgba(160,190,205,0.07)" },
    photo: PERSONAL_WALLPAPER_SRC,
  },
];

/* ── photo availability ──────────────────────────────────────────────
   The personal wallpaper is an optional asset. We probe it once, and
   every consumer subscribes to the answer rather than guessing. */

let photoReady: boolean | null = null;
const photoListeners = new Set<() => void>();

function probePhoto() {
  if (photoReady !== null || typeof window === "undefined") return;
  const img = new Image();
  img.onload = () => {
    photoReady = true;
    photoListeners.forEach((l) => l());
    // a photo chosen in a previous session becomes valid again
    applySettings(state);
  };
  img.onerror = () => {
    photoReady = false;
    photoListeners.forEach((l) => l());
    // never leave the desktop pointing at a wallpaper that cannot load
    if (state.wallpaper === "personal") settingsStore.set({ wallpaper: "strata" });
  };
  img.src = PERSONAL_WALLPAPER_SRC;
}

export const photoWallpaper = {
  /** null while the probe is still in flight */
  available: () => photoReady,
  subscribe(l: () => void) {
    photoListeners.add(l);
    probePhoto();
    return () => photoListeners.delete(l);
  },
};

export function usePhotoWallpaper(): boolean | null {
  return useSyncExternalStore(
    photoWallpaper.subscribe,
    photoWallpaper.available,
    () => null,
  );
}

const KEY = "dos:settings";

const DEFAULTS: Settings = {
  wallpaper: "strata",
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
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
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
  let wall = WALLPAPERS.find((w) => w.id === s.wallpaper) ?? WALLPAPERS[0];
  // a photo wallpaper only counts once the file has actually loaded
  if (wall.photo && photoReady !== true) wall = WALLPAPERS[0];
  root.style.setProperty("--wall-a", wall.vars.a);
  root.style.setProperty("--wall-b", wall.vars.b);
  root.style.setProperty("--wall-c", wall.vars.c);
  root.style.setProperty("--wall-photo", wall.photo ? `url("${wall.photo}")` : "none");
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
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get, () => DEFAULTS);
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
