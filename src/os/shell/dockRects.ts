import type { AppId } from "../kernel/appRegistry";

/**
 * Live positions of the dock icons, published by <Dock/> on layout so window
 * minimise/restore animations can actually travel to the right icon instead of
 * guessing at the centre of the screen.
 */
const rects = new Map<AppId, DOMRect>();

export const dockRects = {
  set(id: AppId, rect: DOMRect) {
    rects.set(id, rect);
  },
  get(id: AppId): DOMRect | undefined {
    return rects.get(id);
  },
  /** Centre point to animate toward, falling back to the middle of the dock. */
  target(id: AppId): { x: number; y: number } {
    const r = rects.get(id);
    if (r) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    return { x: window.innerWidth / 2, y: window.innerHeight - 46 };
  },
};
