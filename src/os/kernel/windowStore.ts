import { useSyncExternalStore } from "react";
import type { AppId } from "./appRegistry";

export type Rect = { x: number; y: number; w: number; h: number };

export type WindowState = {
  id: string;
  appId: AppId;
  title: string;
  rect: Rect;
  /** rect to restore to when un-maximizing */
  restoreRect: Rect | null;
  minimized: boolean;
  maximized: boolean;
  z: number;
  /** opaque per-app payload, e.g. which project to select on open */
  payload?: unknown;
};

type State = {
  windows: WindowState[];
  focusedId: string | null;
};

let state: State = { windows: [], focusedId: null };
let zCounter = 100;
let idCounter = 0;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function commit(next: State) {
  state = next;
  emit();
}

const MENUBAR_H = 30;
const DOCK_RESERVE = 108;

function viewport() {
  return {
    w: typeof window === "undefined" ? 1440 : window.innerWidth,
    h: typeof window === "undefined" ? 900 : window.innerHeight,
  };
}

/**
 * Place a new window with a slight cascade so stacked launches stay readable,
 * clamped so it can never open under the dock or off-screen.
 */
function placeRect(w: number, h: number, index: number): Rect {
  const vp = viewport();
  const width = Math.min(w, vp.w - 48);
  const height = Math.min(h, vp.h - MENUBAR_H - DOCK_RESERVE);
  const offset = (index % 6) * 28;
  const x = Math.round((vp.w - width) / 2 + offset - 70);
  const y = Math.round(
    MENUBAR_H + Math.max(16, (vp.h - MENUBAR_H - DOCK_RESERVE - height) / 2.4) + offset,
  );
  return {
    x: Math.max(12, Math.min(x, vp.w - width - 12)),
    y: Math.max(MENUBAR_H + 8, Math.min(y, vp.h - DOCK_RESERVE)),
    w: width,
    h: height,
  };
}

export function maximizedRect(): Rect {
  const vp = viewport();
  return {
    x: 8,
    y: MENUBAR_H + 6,
    w: vp.w - 16,
    h: vp.h - MENUBAR_H - 6 - 92,
  };
}

export const windowStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  open(
    appId: AppId,
    opts: {
      title: string;
      w: number;
      h: number;
      singleton?: boolean;
      payload?: unknown;
    },
  ): string {
    const existing = opts.singleton
      ? state.windows.find((win) => win.appId === appId)
      : undefined;

    if (existing) {
      windowStore.focus(existing.id);
      if (opts.payload !== undefined) {
        commit({
          ...state,
          windows: state.windows.map((win) =>
            win.id === existing.id ? { ...win, payload: opts.payload } : win,
          ),
        });
      }
      return existing.id;
    }

    const id = `win-${++idCounter}`;
    const win: WindowState = {
      id,
      appId,
      title: opts.title,
      rect: placeRect(opts.w, opts.h, state.windows.length),
      restoreRect: null,
      minimized: false,
      maximized: false,
      z: ++zCounter,
      payload: opts.payload,
    };
    commit({ windows: [...state.windows, win], focusedId: id });
    return id;
  },

  close(id: string) {
    const remaining = state.windows.filter((w) => w.id !== id);
    const nextFocus =
      state.focusedId === id
        ? remaining
            .filter((w) => !w.minimized)
            .reduce<WindowState | null>((top, w) => (!top || w.z > top.z ? w : top), null)
            ?.id ?? null
        : state.focusedId;
    commit({ windows: remaining, focusedId: nextFocus });
  },

  closeApp(appId: AppId) {
    state.windows.filter((w) => w.appId === appId).forEach((w) => windowStore.close(w.id));
  },

  focus(id: string) {
    const win = state.windows.find((w) => w.id === id);
    if (!win) return;
    if (state.focusedId === id && !win.minimized) return;
    commit({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, z: ++zCounter, minimized: false } : w,
      ),
      focusedId: id,
    });
  },

  minimize(id: string) {
    const remaining = state.windows.filter((w) => w.id !== id && !w.minimized);
    const nextFocus = remaining.reduce<WindowState | null>(
      (top, w) => (!top || w.z > top.z ? w : top),
      null,
    );
    commit({
      windows: state.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
      focusedId: nextFocus?.id ?? null,
    });
  },

  toggleMaximize(id: string) {
    commit({
      ...state,
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized) {
          return {
            ...w,
            maximized: false,
            rect: w.restoreRect ?? w.rect,
            restoreRect: null,
          };
        }
        return {
          ...w,
          maximized: true,
          restoreRect: w.rect,
          rect: maximizedRect(),
        };
      }),
    });
    windowStore.focus(id);
  },

  setRect(id: string, rect: Rect) {
    commit({
      ...state,
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, rect, maximized: false } : w,
      ),
    });
  },

  setTitle(id: string, title: string) {
    commit({
      ...state,
      windows: state.windows.map((w) => (w.id === id ? { ...w, title } : w)),
    });
  },

  /** Cmd+` — cycle focus through non-minimized windows. */
  cycle() {
    const open = state.windows.filter((w) => !w.minimized).sort((a, b) => a.z - b.z);
    if (open.length < 2) return;
    windowStore.focus(open[0].id);
  },

  /** Keep maximized windows glued to the viewport, un-maximized ones on-screen. */
  reflow() {
    const vp = viewport();
    commit({
      ...state,
      windows: state.windows.map((w) => {
        if (w.maximized) return { ...w, rect: maximizedRect() };
        const width = Math.min(w.rect.w, vp.w - 24);
        const height = Math.min(w.rect.h, vp.h - MENUBAR_H - 24);
        return {
          ...w,
          rect: {
            w: width,
            h: height,
            x: Math.max(12 - width + 80, Math.min(w.rect.x, vp.w - 80)),
            y: Math.max(MENUBAR_H + 4, Math.min(w.rect.y, vp.h - 60)),
          },
        };
      }),
    });
  },

  reset() {
    commit({ windows: [], focusedId: null });
  },
};

export function useWindows(): State {
  return useSyncExternalStore(
    windowStore.subscribe,
    windowStore.get,
    () => ({ windows: [], focusedId: null }) as State,
  );
}
