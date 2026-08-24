import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { animate, motion, useMotionValue } from "motion/react";
import { APPS } from "../kernel/appRegistry";
import { maximizedRect, windowStore, type Rect, type WindowState } from "../kernel/windowStore";
import { audio } from "../kernel/audio";
import { dockRects } from "./dockRects";
import { prefersStill, useSettings } from "../kernel/settingsStore";

const MENUBAR_H = 30;
/** Critically damped: geometry moves fast and lands without overshoot. */
const GEOMETRY_SPRING = { type: "spring", stiffness: 460, damping: 46, mass: 0.72 } as const;
/** Maximize and restore travel further, so they get a tween with a firm ease. */
const ZOOM_TWEEN = { duration: 0.34, ease: [0.32, 0.72, 0, 1] } as const;

type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLES: { edge: Edge; className: string }[] = [
  { edge: "n", className: "left-3 right-3 top-0 h-1.5 cursor-ns-resize" },
  { edge: "s", className: "left-3 right-3 bottom-0 h-1.5 cursor-ns-resize" },
  { edge: "w", className: "top-3 bottom-3 left-0 w-1.5 cursor-ew-resize" },
  { edge: "e", className: "top-3 bottom-3 right-0 w-1.5 cursor-ew-resize" },
  { edge: "nw", className: "left-0 top-0 h-3 w-3 cursor-nwse-resize" },
  { edge: "ne", className: "right-0 top-0 h-3 w-3 cursor-nesw-resize" },
  { edge: "sw", className: "left-0 bottom-0 h-3 w-3 cursor-nesw-resize" },
  { edge: "se", className: "right-0 bottom-0 h-3 w-3 cursor-nwse-resize" },
];

export function Window({ win, focused }: { win: WindowState; focused: boolean }) {
  const app = APPS[win.appId];
  const settings = useSettings();
  const still = prefersStill(settings);
  const Body = app.component;

  /**
   * True once the minimize animation has finished — not while it is running.
   * Restoring clears it on the spot, so the window is paintable again before
   * the first frame of its journey back out of the dock.
   */
  const [parked, setParked] = useState(false);
  if (parked && !win.minimized) setParked(false);

  const target = win.maximized ? maximizedRect() : win.rect;

  // Geometry lives in motion values so a pointer move costs one compositor
  // write instead of a React render; the store is only touched on release.
  const x = useMotionValue(target.x);
  const y = useMotionValue(target.y);
  const w = useMotionValue(target.w);
  const h = useMotionValue(target.h);
  const interacting = useRef(false);
  const live = useRef<Rect>({ ...target });
  /** the previous zoom state, so a maximize/restore can be told from a nudge */
  const wasMaximized = useRef(win.maximized);

  useEffect(() => {
    live.current = { ...target };
    if (interacting.current) return;
    const zooming = wasMaximized.current !== win.maximized;
    wasMaximized.current = win.maximized;
    const opts = still ? { duration: 0.12 } : zooming ? ZOOM_TWEEN : GEOMETRY_SPRING;
    const controls = [
      animate(x, target.x, opts),
      animate(y, target.y, opts),
      animate(w, target.w, opts),
      animate(h, target.h, opts),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [target.x, target.y, target.w, target.h, still, win.maximized, x, y, w, h]);

  const push = useCallback(
    (r: Rect) => {
      live.current = r;
      x.set(r.x);
      y.set(r.y);
      w.set(r.w);
      h.set(r.h);
    },
    [x, y, w, h],
  );

  const beginDrag = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      windowStore.focus(win.id);

      const startX = e.clientX;
      const startY = e.clientY;
      const origin = { ...live.current };
      const wasMaximized = win.maximized;
      const restore = win.restoreRect ?? { ...origin, w: app.width, h: app.height };
      interacting.current = true;

      const move = (ev: PointerEvent) => {
        if (wasMaximized) {
          // dragging a maximized window pulls it back under the cursor
          push({
            w: restore.w,
            h: restore.h,
            x: ev.clientX - restore.w / 2,
            y: Math.max(MENUBAR_H, ev.clientY - 18),
          });
          return;
        }
        push({
          ...origin,
          x: origin.x + (ev.clientX - startX),
          // the title bar can never slip under the menu bar or off the bottom
          y: Math.max(
            MENUBAR_H,
            Math.min(origin.y + (ev.clientY - startY), window.innerHeight - 40),
          ),
        });
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        interacting.current = false;
        windowStore.setRect(win.id, { ...live.current });
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [app.height, app.width, push, win.id, win.maximized, win.restoreRect],
  );

  const beginResize = useCallback(
    (e: ReactPointerEvent, edge: Edge) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      windowStore.focus(win.id);

      const startX = e.clientX;
      const startY = e.clientY;
      const origin = { ...live.current };
      interacting.current = true;

      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let { x: nx, y: ny, w: nw, h: nh } = origin;

        if (edge.includes("e")) nw = origin.w + dx;
        if (edge.includes("s")) nh = origin.h + dy;
        if (edge.includes("w")) {
          nw = origin.w - dx;
          nx = origin.x + dx;
        }
        if (edge.includes("n")) {
          nh = origin.h - dy;
          ny = origin.y + dy;
        }

        // clamp to the app's minimum while keeping the anchored edge fixed
        if (nw < app.minWidth) {
          if (edge.includes("w")) nx = origin.x + origin.w - app.minWidth;
          nw = app.minWidth;
        }
        if (nh < app.minHeight) {
          if (edge.includes("n")) ny = origin.y + origin.h - app.minHeight;
          nh = app.minHeight;
        }
        if (ny < MENUBAR_H) {
          nh += ny - MENUBAR_H;
          ny = MENUBAR_H;
        }

        push({ x: nx, y: ny, w: nw, h: nh });
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        interacting.current = false;
        windowStore.setRect(win.id, { ...live.current });
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [app.minHeight, app.minWidth, push, win.id],
  );

  const close = () => {
    if (settings.soundEnabled) audio.sfx("close");
    windowStore.close(win.id);
  };

  const minimize = () => {
    if (settings.soundEnabled) audio.sfx("click");
    windowStore.minimize(win.id);
  };

  /** vector from the window's centre to its dock icon */
  const dockVector = () => {
    const t = dockRects.target(win.appId);
    return {
      x: t.x - (live.current.x + live.current.w / 2),
      y: t.y - (live.current.y + live.current.h / 2),
    };
  };

  // Opening starts a short way along the line to the dock icon rather than at
  // it: a full genie from a 40px tile reads as a gimmick, a hint of travel
  // reads as the window having come from somewhere.
  const openFrom = () => {
    if (still) return { opacity: 0 };
    const v = dockVector();
    return { opacity: 0, scale: 0.9, x: v.x * 0.16, y: v.y * 0.16 };
  };

  return (
    <motion.div
      role="dialog"
      aria-label={`${app.name} window`}
      className="absolute left-0 top-0"
      style={{
        x,
        y,
        width: w,
        height: h,
        zIndex: win.z,
        transformOrigin: "50% 45%",
        /*
         * A minimized window keeps its full rectangle — only its inner shell
         * scales away — so leaving it hit-testable leaves an invisible pane
         * lying across the desktop. It was catching clicks meant for the
         * widgets underneath and, through the capture handler below,
         * un-minimizing itself: clicking Calendar re-opened Signal.
         */
        pointerEvents: win.minimized ? "none" : "auto",
      }}
      onPointerDownCapture={() => windowStore.focus(win.id)}
      exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={still ? { duration: 0.1 } : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-win"
        style={{
          border: "1px solid var(--win-border)",
          boxShadow: focused ? "var(--shadow-win-focus)" : "var(--shadow-win)",
          background: "var(--win-bg)",
          /*
           * Parked windows stop compositing. A backdrop blur is one of the
           * most expensive things a browser can be asked to keep alive, and
           * an invisible window at the dock was still paying for one on every
           * frame — with several minimized apps that is what the desktop's
           * animations were competing against.
           */
          backdropFilter: parked ? "none" : "blur(var(--blur)) saturate(150%)",
          WebkitBackdropFilter: parked ? "none" : "blur(var(--blur)) saturate(150%)",
          visibility: parked ? "hidden" : "visible",
          transformOrigin: "50% 50%",
        }}
        initial={openFrom()}
        animate={
          win.minimized
            ? { opacity: 0, scale: 0.08, ...dockVector() }
            : { opacity: 1, scale: 1, x: 0, y: 0 }
        }
        onAnimationComplete={() => setParked(win.minimized)}
        transition={
          still
            ? { duration: 0.12 }
            : win.minimized
              ? { duration: 0.34, ease: [0.5, 0, 0.75, 0] }
              : { type: "spring", stiffness: 380, damping: 34, mass: 0.6 }
        }
      >
        {/* inner top bevel — a highlight, not a glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px"
          style={{ background: "var(--win-highlight)" }}
        />

        {/* ── title bar ───────────────────────────────────────── */}
        <div
          onPointerDown={beginDrag}
          onDoubleClick={() => windowStore.toggleMaximize(win.id)}
          className="group/title relative flex h-[38px] shrink-0 cursor-grab items-center gap-2 border-b px-2.5 active:cursor-grabbing"
          style={{
            borderColor: "var(--hair)",
            background: focused
              ? "linear-gradient(180deg, rgba(255,255,255,0.045), transparent)"
              : "transparent",
          }}
        >
          <div
            data-no-drag
            className="flex items-center gap-[3px] rounded-full p-[3px]"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <ChromeButton
              label="Close window"
              onClick={close}
              glyph="close"
              focused={focused}
            />
            <ChromeButton
              label="Minimize window"
              onClick={minimize}
              glyph="minimize"
              focused={focused}
            />
            <ChromeButton
              label={win.maximized ? "Restore window" : "Maximize window"}
              onClick={() => windowStore.toggleMaximize(win.id)}
              glyph="maximize"
              focused={focused}
            />
          </div>

          <span
            className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-[11.5px] font-medium tracking-[0.01em]"
            style={{ color: focused ? "var(--ink-2)" : "var(--ink-3)" }}
          >
            {win.title}
          </span>

          {/* balances the control cluster so the centred title stays centred */}
          <span aria-hidden className="ml-auto w-[52px]" />
        </div>

        {/* ── body ────────────────────────────────────────────── */}
        <div className="relative min-h-0 flex-1">
          <Suspense fallback={<WindowSkeleton />}>
            <Body windowId={win.id} focused={focused} payload={win.payload} />
          </Suspense>
        </div>

        {/* unfocused windows sit back a plane */}
        {!focused && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-win"
            style={{ background: "rgba(6,6,8,0.3)" }}
          />
        )}
      </motion.div>

      {!win.maximized &&
        HANDLES.map((handle) => (
          <div
            key={handle.edge}
            data-no-drag
            onPointerDown={(e) => beginResize(e, handle.edge)}
            className={`absolute ${handle.className}`}
          />
        ))}
    </motion.div>
  );
}

/**
 * The traffic lights.
 *
 * Semantically the familiar red / amber / green so the meaning is legible on
 * sight, but ground down into the DOS palette rather than lifted from Apple:
 * the hues are desaturated and slightly warm, the discs are flatter, and an
 * unfocused window drains them to graphite the way the rest of its chrome
 * recedes. The glyph only appears on approach, which keeps a resting window
 * quiet without ever leaving the buttons ambiguous — colour carries the
 * meaning, the glyph confirms it, and the label carries it for a screen reader.
 */
const LIGHTS = {
  close: { on: "#E0554E", hover: "#F2685F", ink: "#4A0F0B" },
  minimize: { on: "#D9A32F", hover: "#EFB93F", ink: "#3D2A02" },
  maximize: { on: "#48A860", hover: "#57C271", ink: "#062E13" },
} as const;

function ChromeButton({
  label,
  onClick,
  glyph,
  focused,
}: {
  label: string;
  onClick: () => void;
  glyph: "close" | "minimize" | "maximize";
  focused: boolean;
}) {
  const light = LIGHTS[glyph];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="group/light grid h-[13px] w-[13px] place-items-center rounded-full transition-colors"
      style={{
        background: focused ? light.on : "rgba(237,234,228,0.17)",
        boxShadow: focused
          ? "inset 0 0 0 1px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.24)"
          : "inset 0 0 0 1px rgba(0,0,0,0.28)",
        ["--light-hover" as string]: light.hover,
      }}
      onPointerEnter={(e) => {
        e.currentTarget.style.background = light.hover;
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.background = focused ? light.on : "rgba(237,234,228,0.17)";
      }}
    >
      <svg
        width="7"
        height="7"
        viewBox="0 0 8 8"
        className="opacity-0 transition-opacity group-hover/title:opacity-90 group-focus-visible/light:opacity-90"
        style={{ color: light.ink }}
        aria-hidden
      >
        {glyph === "close" && (
          <path
            d="M1.6 1.6 6.4 6.4M6.4 1.6 1.6 6.4"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
          />
        )}
        {glyph === "minimize" && (
          <path d="M1.6 4h4.8" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        )}
        {glyph === "maximize" && (
          <path
            d="M1.5 3.2V1.5h1.7M6.5 4.8v1.7H4.8"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
    </button>
  );
}

function WindowSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="h-3 w-28 rounded" style={{ background: "var(--hair)" }} />
      <div className="h-2 w-full max-w-md rounded" style={{ background: "var(--hair)" }} />
      <div className="h-2 w-3/4 max-w-sm rounded" style={{ background: "var(--hair)" }} />
      <div className="meta mt-auto" style={{ color: "var(--ink-4)" }}>
        Loading module…
      </div>
    </div>
  );
}
