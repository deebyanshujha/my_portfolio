import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { audio } from "../kernel/audio";
import { windowStore } from "../kernel/windowStore";

/**
 * landing  — the machine sits in the room, untouched
 * waking   — the screen has been clicked; it lights up, the room dims
 * entering — the screen is expanding to fill the viewport (camera push-in)
 * booting  — full-screen; the system initialises
 * desktop  — you are inside
 */
export type Stage = "landing" | "waking" | "entering" | "booting" | "desktop";

type StageContext = {
  stage: Stage;
  /** viewport rect of the machine's screen at the moment of entry */
  originRect: DOMRect | null;
  enter: (rect: DOMRect) => void;
  finishEntering: () => void;
  finishBoot: () => void;
  /** back to the landing page, windows intact */
  sleep: () => void;
  /** replay the boot sequence from the desktop */
  restart: () => void;
  skip: () => void;
};

const Ctx = createContext<StageContext | null>(null);

const BOOTED_KEY = "dos:booted";

function hasBootedBefore(): boolean {
  try {
    return window.sessionStorage.getItem(BOOTED_KEY) === "1";
  } catch {
    return false;
  }
}

function markBooted() {
  try {
    window.sessionStorage.setItem(BOOTED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function StageProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>("landing");
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const enter = useCallback(
    (rect: DOMRect) => {
      if (stage !== "landing") return;
      setOriginRect(rect);
      setStage("waking");
      audio.resume();
      audio.sfx("click");
      // the screen wakes in place, then the camera pushes into it
      after(520, () => setStage("entering"));
    },
    [after, stage],
  );

  const finishEntering = useCallback(() => {
    setStage((s) => (s === "entering" ? "booting" : s));
  }, []);

  const finishBoot = useCallback(() => {
    markBooted();
    setStage("desktop");
  }, []);

  const skip = useCallback(() => {
    clearTimers();
    markBooted();
    setStage("desktop");
  }, [clearTimers]);

  const sleep = useCallback(() => {
    clearTimers();
    setStage("landing");
    setOriginRect(null);
  }, [clearTimers]);

  const restart = useCallback(() => {
    clearTimers();
    windowStore.reset();
    setStage("booting");
  }, [clearTimers]);

  const value = useMemo<StageContext>(
    () => ({
      stage,
      originRect,
      enter,
      finishEntering,
      finishBoot,
      sleep,
      restart,
      skip,
    }),
    [stage, originRect, enter, finishEntering, finishBoot, sleep, restart, skip],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStage(): StageContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStage must be used within StageProvider");
  return ctx;
}

export { hasBootedBefore };
