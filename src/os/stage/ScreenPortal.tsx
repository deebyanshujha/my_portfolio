import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { hasBootedBefore, useStage } from "./StageProvider";
import { BootSequence } from "../shell/BootSequence";
import { prefersStill, useSettings } from "../kernel/settingsStore";

/** the boot screen's own ground, so the portal and the boot read as one surface */
const BOOT_GROUND =
  "radial-gradient(120% 100% at 50% 30%, #14120e 0%, #0a0a0b 55%, #060607 100%)";

const OPEN = [0.76, 0, 0.24, 1] as const;
const FULL = "inset(0px 0px 0px 0px round 0px)";

/**
 * The way in.
 *
 * The machine's screen opens into a window the size of the viewport: a clip
 * that starts exactly on the screen's rect and widens to the edges while the
 * room recedes behind it. Nothing inside is scaled — the boot surface is
 * already at its final size and the clip only uncovers it — so there is no
 * stretched texture, no animated corner radius, and no text resampling
 * mid-move. The screen's light blooms out of the spot you pressed and settles
 * into the boot ground.
 *
 * Leaving is a cross-fade: the desktop mounts underneath while the system
 * initialises, so by the time this layer fades away there is nothing left to
 * build — the desktop is simply uncovered.
 */
export function ScreenPortal() {
  const { stage, originRect, finishEntering } = useStage();
  const settings = useSettings();
  const still = prefersStill(settings);
  const [short] = useState(hasBootedBefore);

  const active = stage === "entering" || stage === "booting";

  const [vp, setVp] = useState(() => ({
    w: typeof window === "undefined" ? 0 : window.innerWidth,
    h: typeof window === "undefined" ? 0 : window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // only a real push opens from the screen; a restart from the desktop, or a
  // visitor who asked for less motion, fades straight in
  const fromScreen = stage === "entering" && !!originRect && !still && vp.w > 0;
  const r = originRect;
  const startClip =
    fromScreen && r
      ? `inset(${r.top}px ${vp.w - r.right}px ${vp.h - r.bottom}px ${r.left}px round 13px)`
      : FULL;
  const cx = r ? r.left + r.width / 2 : vp.w / 2;
  const cy = r ? r.top + r.height / 2 : vp.h / 2;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="portal"
          className="fixed inset-0 z-boot overflow-hidden"
          style={{ background: BOOT_GROUND, willChange: "clip-path, opacity" }}
          initial={{ clipPath: startClip, opacity: fromScreen ? 1 : 0 }}
          animate={{ clipPath: FULL, opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: still ? 0.2 : 0.55, ease: [0.4, 0, 0.2, 1] },
          }}
          transition={
            fromScreen ? { duration: 0.9, ease: OPEN } : { duration: 0.3 }
          }
          onAnimationComplete={() => finishEntering()}
        >
          {/* the screen's light, flooding out from where it was pressed */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(60vmax 60vmax at ${cx}px ${cy}px, rgba(232,184,75,0.26), rgba(232,184,75,0.06) 45%, transparent 70%)`,
            }}
            initial={{ opacity: fromScreen ? 1 : 0 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: "easeOut", delay: 0.2 }}
          />

          {stage === "booting" && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <BootSequence short={short} />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
