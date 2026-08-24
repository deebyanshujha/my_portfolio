import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { hasBootedBefore, useStage } from "./StageProvider";
import { BootSequence } from "../shell/BootSequence";
import { prefersStill, useSettings } from "../kernel/settingsStore";
import { ScreenFace } from "../../landing/ScreenFace";

/**
 * The camera push-in.
 *
 * A full-viewport layer is pre-transformed to sit exactly on top of the
 * machine's screen, then released to identity. Because only `transform` and
 * `opacity` animate, the whole move is a single compositor job — and because
 * the layer starts life *as* the screen, you are physically entering the object
 * you clicked rather than cross-fading to a different page.
 */
export function ScreenPortal() {
  const { stage, originRect, finishEntering } = useStage();
  const settings = useSettings();
  const still = prefersStill(settings);
  const [short] = useState(hasBootedBefore);

  const active = stage === "entering" || stage === "booting";

  // recompute the start transform against the live viewport
  const [vp, setVp] = useState(() => ({
    w: typeof window === "undefined" ? 0 : window.innerWidth,
    h: typeof window === "undefined" ? 0 : window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!active || !originRect || vp.w === 0) {
    return active ? (
      <div className="fixed inset-0 z-boot">
        <BootSequence short={short} />
      </div>
    ) : null;
  }

  const sx = originRect.width / vp.w;
  const sy = originRect.height / vp.h;

  return (
    <motion.div
      className="fixed inset-0 z-boot overflow-hidden"
      style={{
        transformOrigin: "0 0",
        background: "#060607",
        willChange: "transform, border-radius",
      }}
      initial={
        still
          ? { opacity: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0 }
          : {
              x: originRect.left,
              y: originRect.top,
              scaleX: sx,
              scaleY: sy,
              borderRadius: 13 / Math.min(sx, sy),
            }
      }
      animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0, opacity: 1 }}
      transition={
        still
          ? { duration: 0.25 }
          : { duration: 0.92, ease: [0.76, 0, 0.24, 1] }
      }
      onAnimationComplete={() => finishEntering()}
    >
      {/* The screen's own surface carries through the push. Without texture the
          move reads as a plain dark rectangle growing; with scanlines and a
          warming bloom you can actually see the display rushing towards you. */}
      {stage === "entering" && (
        <>
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 42%, rgba(232,184,75,0.22), rgba(24,22,18,0.92) 58%, #060607 100%)",
            }}
            animate={{ opacity: [1, 0.8, 0.55] }}
            transition={{ duration: 0.92 }}
          />
          {/* the desktop that was on the machine's screen rides the push in and
              magnifies with it, so the surface you clicked is visibly the
              surface that becomes the display — then it dissolves into boot */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.85, 0] }}
            transition={{ duration: 0.92, times: [0, 0.3, 0.6], ease: "easeIn" }}
          >
            <ScreenFace lit woken still={still} />
          </motion.div>
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0 1px, transparent 1px 3px)",
              // the lines are baked into the layer, so the scale-up magnifies
              // them exactly as a real display surface would magnify
              transform: `scaleY(${1 / Math.max(sy, 0.001)})`,
              transformOrigin: "50% 50%",
            }}
          />
          {/* the wake scan, continuing from where the machine left off */}
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-[30%]"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)",
            }}
            initial={{ top: "0%" }}
            animate={{ top: "100%", opacity: [0.9, 0.9, 0] }}
            transition={{ duration: 0.92, ease: "easeOut" }}
          />
        </>
      )}
      {stage === "booting" && <BootSequence short={short} />}
    </motion.div>
  );
}
