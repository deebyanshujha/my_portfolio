import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useStage } from "../os/stage/StageProvider";
import { prefersStill, useSettings } from "../os/kernel/settingsStore";
import { ScreenFace } from "./ScreenFace";

/**
 * The machine.
 *
 * Built entirely from CSS 3D transforms rather than WebGL: it stays crisp at
 * any DPI, costs nothing to render, and — critically — its screen is a real DOM
 * node, so the entry transition can measure it and physically expand it into
 * the desktop instead of cross-fading to a different page.
 */
export function Machine() {
  const { stage, enter } = useStage();
  const settings = useSettings();
  const still = prefersStill(settings);

  const screenRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const woken = stage !== "landing";

  // cursor-driven perspective — tracked at the window level so the machine
  // responds to approach, not just to direct hover
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 110, damping: 20, mass: 0.6 };
  const rx = useSpring(useTransform(py, [-1, 1], [7, -7]), spring);
  const ry = useSpring(useTransform(px, [-1, 1], [-11, 11]), spring);
  const glareX = useTransform(px, [-1, 1], ["12%", "88%"]);

  useEffect(() => {
    if (still || woken) return;
    const onMove = (e: PointerEvent) => {
      const el = frameRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // normalise against a generous radius so the effect eases in from afar
      px.set(Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width * 1.5))));
      py.set(Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height * 1.8))));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, still, woken]);

  const activate = useCallback(() => {
    const el = screenRef.current;
    if (!el || stage !== "landing") return;
    enter(el.getBoundingClientRect());
  }, [enter, stage]);

  const lit = hovered || woken;

  return (
    <div
      ref={frameRef}
      className="relative select-none"
      style={{ perspective: 1500, perspectiveOrigin: "50% 42%" }}
    >
      {/* light the machine throws onto the floor — the room's only source */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[62%] -z-10 h-[420px] w-[900px] max-w-[130vw] -translate-x-1/2 rounded-[50%]"
        style={{
          background:
            "radial-gradient(closest-side, var(--accent-glow), transparent 72%)",
          filter: "blur(28px)",
        }}
        animate={{ opacity: woken ? 1 : lit ? 0.85 : 0.4, scale: lit ? 1.06 : 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />

      <motion.button
        type="button"
        onClick={activate}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label="Enter DOS — wake the machine and open the desktop"
        className="group relative block cursor-pointer rounded-[26px] focus-visible:outline-none"
        style={{
          transformStyle: "preserve-3d",
          rotateX: still ? 0 : rx,
          rotateY: still ? 0 : ry,
        }}
        animate={{
          scale: stage === "waking" ? 0.985 : 1,
          y: stage === "waking" ? 2 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── display slab ─────────────────────────────────────── */}
        <div
          className="relative w-[min(560px,46vw)] min-w-[300px] rounded-[22px] p-[10px]"
          style={{
            transformStyle: "preserve-3d",
            background:
              "linear-gradient(168deg, #4a4b50 0%, #2c2d31 26%, #202126 62%, #35363b 100%)",
            boxShadow: [
              "inset 0 1px 0 rgba(255,255,255,0.22)",
              "inset 0 -1px 0 rgba(0,0,0,0.6)",
              "0 40px 90px -30px rgba(0,0,0,0.9)",
              "0 2px 0 rgba(0,0,0,0.5)",
            ].join(","),
          }}
        >
          {/* brushed-aluminium grain */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[22px] opacity-[0.22]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(94deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 3px)",
            }}
          />
          {/* specular sweep that tracks the cursor across the bezel */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{
              background: `linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.16) 46%, transparent 68%)`,
              maskImage: "linear-gradient(#000,#000)",
              left: still ? "0%" : undefined,
              x: still ? 0 : undefined,
              backgroundPositionX: still ? "50%" : glareX,
              backgroundSize: "220% 100%",
              opacity: lit ? 0.9 : 0.5,
              transition: "opacity .5s ease",
            }}
          />

          {/* ── the screen: a real DOM node the transition can measure ── */}
          <div
            ref={screenRef}
            data-machine-screen
            className="relative aspect-[16/10] w-full overflow-hidden rounded-[13px]"
            style={{
              background: "#060607",
              boxShadow:
                "inset 0 0 0 1px rgba(0,0,0,0.9), inset 0 2px 14px rgba(0,0,0,0.85)",
            }}
          >
            {/* phosphor bloom */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 90% at 50% 42%, rgba(232,184,75,0.18), rgba(24,22,18,0.9) 62%, #060607 100%)",
              }}
              animate={{ opacity: woken ? 1 : lit ? 0.72 : 0.34 }}
              transition={{ duration: woken ? 0.22 : 0.55, ease: "easeOut" }}
            />

            {/* the system already running inside — a miniature of the desktop,
                caught mid-initialisation */}
            <ScreenFace lit={lit} woken={woken} still={still} />

            {/* scanline sweep on wake */}
            {stage === "waking" && !still && (
              <motion.div
                aria-hidden
                className="absolute inset-x-0 h-[42%]"
                style={{
                  background:
                    "linear-gradient(180deg, transparent, rgba(255,255,255,0.14), transparent)",
                }}
                initial={{ top: "-42%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 0.42, ease: "easeIn" }}
              />
            )}

            {/* glass reflection — a slanted highlight, present at all times */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(158deg, rgba(255,255,255,0.07) 0%, transparent 34%)",
              }}
            />
            {/* CRT-ish scanlines, extremely subtle */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.28]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0 1px, transparent 1px 3px)",
              }}
            />
          </div>

          {/* chin */}
          <div className="flex h-7 items-center justify-center">
            <span
              className="font-display text-[10px] font-bold"
              style={{ letterSpacing: "0.4em", color: "rgba(255,255,255,0.3)" }}
            >
              DJ
            </span>
          </div>
        </div>

        {/* ── stand ─────────────────────────────────────────────── */}
        <div className="relative mx-auto" style={{ transformStyle: "preserve-3d" }}>
          <div
            className="mx-auto h-[74px] w-[11%] min-w-[42px]"
            style={{
              background:
                "linear-gradient(96deg, #26272b 0%, #4c4d52 30%, #3a3b40 55%, #202125 100%)",
              clipPath: "polygon(16% 0, 84% 0, 100% 100%, 0% 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          />
          <div
            className="mx-auto h-[11px] w-[40%] min-w-[150px] rounded-[5px]"
            style={{
              background:
                "linear-gradient(180deg, #55565b 0%, #303136 45%, #17181b 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.24), 0 14px 30px -14px rgba(0,0,0,0.95)",
            }}
          />
        </div>

        {/* contact shadow */}
        <div
          aria-hidden
          className="mx-auto mt-1 h-6 w-[46%] rounded-[50%]"
          style={{
            background: "radial-gradient(closest-side, rgba(0,0,0,0.75), transparent)",
            filter: "blur(9px)",
          }}
        />
      </motion.button>
    </div>
  );
}
