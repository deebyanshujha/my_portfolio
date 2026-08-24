import { useEffect, useRef } from "react";

/**
 * A tiny command bus between the menu bar and application windows.
 *
 * The menus in this system are not decoration — every item dispatches a real
 * command to a real window, and the window handles it. If an app cannot handle
 * a command, the menu does not offer it.
 */
type Handler = (command: string, payload?: unknown) => void;

const handlers = new Map<string, Set<Handler>>();

export const appBus = {
  emit(windowId: string, command: string, payload?: unknown) {
    handlers.get(windowId)?.forEach((h) => h(command, payload));
  },
  on(windowId: string, handler: Handler) {
    const set = handlers.get(windowId) ?? new Set<Handler>();
    set.add(handler);
    handlers.set(windowId, set);
    return () => {
      set.delete(handler);
      if (set.size === 0) handlers.delete(windowId);
    };
  },
};

/** Subscribe a window to its commands. The handler may be inline — it is kept
 *  in a ref so re-renders never churn the subscription. */
export function useAppCommand(windowId: string, handler: Handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(
    () => appBus.on(windowId, (command, payload) => ref.current(command, payload)),
    [windowId],
  );
}
