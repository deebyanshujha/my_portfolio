import { useEffect, useRef } from "react";
import { motion, motionValue, useSpring, useTransform } from "motion/react";

/**
 * The light in the room.
 *
 * The whole design rests on one claim — "the screen is the only light source" —
 * and this is the part that makes the claim behave like it is true. The glow
 * lives on the machine, not on the cursor: it starts at the machine's screen
 * and *leans* a fraction of the way toward the pointer, the way a lamp's cast
 * shifts when you move around a dark room.
 *
 * That fraction is the whole difference between this and a spotlight that
 * follows the mouse. A blob pinned under the cursor reads as a decoration
 * bolted onto the page; a blob that stays on the machine and leans reads as the
 * room having a light in it.
 *
 * It costs one composited layer. The glow never repaints — only its transform
 * changes — because animating the gradient itself would repaint a full-screen
 * element on every frame.
 */

/** how far the cast leans toward the pointer, as a fraction of the offset */
const LEAN = 0.17;
/** and the ceiling on that lean, in px, so it never leaves the machine */
const LIMIT = 190;

export function RoomLight({ still, dimmed }: { still: boolean; dimmed: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const rawX = useRef(motionValue(0)).current;
  const rawY = useRef(motionValue(0)).current;

  // heavy and slow: the light has mass, and lags the hand that moves it
  const spring = { stiffness: 42, damping: 22, mass: 1.1 };
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);
  const scale = useSpring(dimmed ? 1.25 : 1, { stiffness: 60, damping: 20 });

  useEffect(() => {
    scale.set(dimmed ? 1.25 : 1);
  }, [dimmed, scale]);

  useEffect(() => {
    if (still) return;
    let frame = 0;
    /** the machine's screen — where the light actually comes from */
    let origin: { x: number; y: number } | null = null;

    const findOrigin = () => {
      const screen = document.querySelector("[data-machine-screen]");
      const r = (screen ?? host.current)?.getBoundingClientRect();
      origin = r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    };

    const onMove = (e: PointerEvent) => {
      if (frame) return;
      const { clientX, clientY } = e;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!origin) findOrigin();
        if (!origin) return;
        const clamp = (v: number) => Math.max(-LIMIT, Math.min(LIMIT, v * LEAN));
        rawX.set(clamp(clientX - origin.x));
        rawY.set(clamp(clientY - origin.y));
      });
    };

    const forget = () => {
      origin = null;
    };

    findOrigin();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", forget);
    window.addEventListener("scroll", forget, { passive: true, capture: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", forget);
      window.removeEventListener("scroll", forget, true);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rawX, rawY, still]);

  // the cast fades as it leans: light that has swung wide is light that has
  // further to travel
  const opacity = useTransform([x, y], ([dx, dy]: number[]) => {
    const reach = Math.hypot(dx as number, dy as number) / LIMIT;
    return (dimmed ? 0.34 : 1) * (1 - reach * 0.24);
  });

  if (still) return null;

  return (
    <motion.div
      ref={host}
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-[6%] -z-0"
      style={{
        x,
        y,
        scale,
        opacity,
        width: "min(155vh, 165vw)",
        height: "min(155vh, 165vw)",
        marginLeft: "min(-77.5vh, -82.5vw)",
        marginTop: "min(-77.5vh, -82.5vw)",
        background:
          "radial-gradient(closest-side, rgba(232,184,75,0.085) 0%, rgba(232,184,75,0.038) 34%, rgba(140,132,150,0.026) 58%, transparent 76%)",
        willChange: "transform, opacity",
      }}
    />
  );
}
