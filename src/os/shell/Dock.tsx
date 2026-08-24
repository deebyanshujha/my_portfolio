import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { APPS, DOCK_ORDER, launch, type AppId } from "../kernel/appRegistry";
import { useWindows, windowStore } from "../kernel/windowStore";
import { AppGlyph } from "./AppGlyph";
import { dockRects } from "./dockRects";
import { audio } from "../kernel/audio";
import { prefersStill, useSettings } from "../kernel/settingsStore";

const BASE = 52;
const MAX_BOOST = 30;
const REACH = 110;

export function Dock() {
  const { windows } = useWindows();
  const settings = useSettings();
  const still = prefersStill(settings);
  const pointerX = useMotionValue(Number.POSITIVE_INFINITY);
  const [hovering, setHovering] = useState(false);

  const running = new Set(windows.map((w) => w.appId));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-dock flex justify-center pb-3">
      <motion.div
        role="toolbar"
        aria-label="Application dock"
        onPointerMove={(e) => {
          pointerX.set(e.clientX);
          setHovering(true);
        }}
        onPointerLeave={() => {
          pointerX.set(Number.POSITIVE_INFINITY);
          setHovering(false);
        }}
        className="chrome pointer-events-auto flex items-end gap-[6px] rounded-[18px] border px-[10px] pb-[8px] pt-[9px]"
        style={{
          borderColor: "var(--win-border)",
          boxShadow: "0 22px 60px -18px rgba(0,0,0,0.85), inset 0 1px 0 var(--win-highlight)",
        }}
      >
        {DOCK_ORDER.map((id) => (
          <DockIcon
            key={id}
            id={id}
            pointerX={pointerX}
            hovering={hovering && !still}
            running={running.has(id)}
            soundOn={settings.soundEnabled}
          />
        ))}
      </motion.div>
    </div>
  );
}

function DockIcon({
  id,
  pointerX,
  hovering,
  running,
  soundOn,
}: {
  id: AppId;
  pointerX: MotionValue<number>;
  hovering: boolean;
  running: boolean;
  soundOn: boolean;
}) {
  const app = APPS[id];
  const ref = useRef<HTMLButtonElement>(null);
  const [bouncing, setBouncing] = useState(false);
  const [tip, setTip] = useState(false);

  // publish this icon's position so minimise animations can travel to it
  useEffect(() => {
    const publish = () => {
      if (ref.current) dockRects.set(id, ref.current.getBoundingClientRect());
    };
    publish();
    window.addEventListener("resize", publish);
    const t = window.setInterval(publish, 1500);
    return () => {
      window.removeEventListener("resize", publish);
      window.clearInterval(t);
    };
  }, [id]);

  // distance-based magnification, computed from the live pointer position
  const distance = useTransform(pointerX, (px) => {
    const el = ref.current;
    if (!el || !hovering) return REACH * 2;
    const r = el.getBoundingClientRect();
    return Math.abs(px - (r.left + r.width / 2));
  });
  const rawSize = useTransform(distance, [0, REACH], [BASE + MAX_BOOST, BASE], {
    clamp: true,
  });
  const size = useSpring(rawSize, { stiffness: 340, damping: 26, mass: 0.5 });

  const activate = () => {
    const open = windowStore.get().windows.filter((w) => w.appId === id);
    const focusedId = windowStore.get().focusedId;

    if (open.length === 0) {
      if (soundOn) audio.sfx("open");
      setBouncing(true);
      window.setTimeout(() => setBouncing(false), 520);
      launch(id);
      return;
    }
    // clicking the active app minimises it; clicking a background app raises it
    const isActive = open.some((w) => w.id === focusedId && !w.minimized);
    if (isActive) {
      windowStore.minimize(open.find((w) => w.id === focusedId)!.id);
    } else {
      const restore = open.find((w) => w.minimized) ?? open[open.length - 1];
      windowStore.focus(restore.id);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md border px-2 py-1 text-[11px]"
        style={{
          borderColor: "var(--win-border)",
          background: "var(--popover-bg)",
          color: "var(--ink)",
        }}
        initial={false}
        animate={{ opacity: tip ? 1 : 0, y: tip ? 0 : 4 }}
        transition={{ duration: 0.16 }}
        aria-hidden
      >
        {app.name}
      </motion.div>

      <motion.button
        ref={ref}
        type="button"
        onClick={activate}
        onPointerEnter={() => setTip(true)}
        onPointerLeave={() => setTip(false)}
        onFocus={() => setTip(true)}
        onBlur={() => setTip(false)}
        // the running dot is decorative; the state has to be in the label too
        aria-label={`${app.name} — ${app.blurb}${running ? " — running" : ""}`}
        title={app.name}
        className="relative grid place-items-center rounded-[12px] border"
        style={{
          width: size,
          height: size,
          // the glyph is drawn in the tile's own light, not in the app colour
          color: "#fff",
          borderColor: "rgba(255,255,255,0.14)",
          backgroundColor: app.tint,
          // one gloss pass over a flat fill: a highlight down the top-left and a
          // shade into the bottom-right, so every tile is lit from the same
          // direction as the rest of the environment
          backgroundImage:
            "linear-gradient(158deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 38%, rgba(0,0,0,0.10) 62%, rgba(0,0,0,0.26) 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -1px 0 rgba(0,0,0,0.36), 0 8px 18px -8px rgba(0,0,0,0.95)",
        }}
        animate={bouncing ? { y: [0, -16, 0, -6, 0] } : { y: 0 }}
        transition={bouncing ? { duration: 0.52, ease: "easeOut" } : { duration: 0.2 }}
      >
        <span className="scale-[0.82]">
          <AppGlyph id={id} />
        </span>
      </motion.button>

      <span
        aria-hidden
        className="mt-[5px] h-[3px] w-[3px] rounded-full transition-opacity"
        style={{
          background: "var(--ink)",
          opacity: running ? 0.85 : 0,
        }}
      />
    </div>
  );
}
