import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, motionValue, useSpring, useTransform, type MotionValue } from "motion/react";

const NAME = "DEEBYANSHU JHA";
const TRACKING = -0.055;
/**
 * The gap between the two names, in em.
 *
 * Tight tracking closes a real word space almost completely — at −0.055em the
 * name reads as one long word — so the space is a box of its own. The probe
 * below renders the identical box, because a probe that measures a real space
 * character while the heading renders a fixed one is a probe that quietly
 * mis-sizes the heading.
 */
const WORD_GAP = 0.3;
/** how far the light reaches, in multiples of a character's own width */
const REACH = 3.4;

/**
 * The name, set as large as the viewport allows — and alive.
 *
 * Two things are going on, and they are deliberately different in kind.
 *
 * The *size* is measured, never guessed: the string is laid out once at a
 * reference size and the real font-size derived from the ratio, so the intended
 * −0.055em tracking survives at every width. Justifying the letters to the edges
 * instead would fight the typeface and read as stretched. The result is clamped
 * by height as well, so a wide, short window cannot push the name into the rail
 * beneath it.
 *
 * The *motion* is two layers that never touch each other's transform. The inner
 * span carries a slow CSS drift with a per-character delay, so the name always
 * has a pulse of its own; the outer span carries a spring driven by the cursor.
 * The room has one light source in it — the machine — and the pointer moves
 * where that light falls, so letters lift and warm as it passes over them. It
 * reads as a ridge travelling along the name rather than fourteen elements
 * doing the same thing at once.
 *
 * Cost: one pointer listener for the whole name, one rAF, and a cache of letter
 * centres. Asking each letter for its own rect on every frame is the obvious
 * way to write this and it is thirteen forced layouts per mouse move.
 */
export function Wordmark({ still }: { still: boolean }) {
  const wrap = useRef<HTMLHeadingElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const row = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | null>(null);
  // the reveal masks each letter; once it has landed the masks come off, so the
  // living motion underneath has somewhere to move
  const [revealed, setRevealed] = useState(still);

  const letters = useMemo(() => NAME.split(""), []);

  /* one motion value per character — the light's strength on that letter.
     Made directly rather than with useMotionValue, which cannot be called in a
     loop; the value is identical either way. */
  const near = useRef<MotionValue<number>[]>([]);
  if (near.current.length !== letters.length) {
    near.current = letters.map((_, i) => near.current[i] ?? motionValue(0));
  }

  useLayoutEffect(() => {
    const measure = () => {
      const container = wrap.current;
      const text = probe.current;
      if (!container || !text) return;
      const natural = text.getBoundingClientRect().width;
      if (!natural) return;
      // the probe renders at 100px; scale that to the available width
      const byWidth = (container.clientWidth / natural) * 100;
      // and never so tall that it crowds the rail below it
      setSize(Math.max(1, Math.min(byWidth, window.innerHeight * 0.34)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    window.addEventListener("resize", measure);
    // fonts land after first paint; remeasure once they do
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  /* ── the light ──────────────────────────────────────────────── */
  useEffect(() => {
    if (still) return;
    /** letter centres, in viewport coordinates — read on change, not on move */
    let cells: { x: number; y: number; w: number }[] = [];
    let frame = 0;

    const remeasure = () => {
      const host = row.current;
      if (!host) return;
      cells = [...host.children].map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
      });
    };

    const apply = (cx: number, cy: number) => {
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const value = near.current[i];
        if (!value || !cell || !cell.w) continue;
        // vertical distance counts for less: the light falls along the line
        const d = Math.hypot(cx - cell.x, (cy - cell.y) * 0.55) / (cell.w * REACH);
        value.set(Math.max(0, 1 - d));
      }
    };

    const onMove = (e: PointerEvent) => {
      if (frame) return; // one read per frame, never one per event
      const { clientX, clientY } = e;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!cells.length) remeasure();
        apply(clientX, clientY);
      });
    };

    // the name is re-laid-out by resize and by the entry animation settling
    const onLayout = () => {
      cells = [];
    };

    remeasure();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, { passive: true, capture: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [still, size, revealed]);

  return (
    <h1
      ref={wrap}
      className="font-display m-0 w-full font-extrabold uppercase"
      style={{
        fontSize: size ? `${size}px` : "11vw",
        lineHeight: 0.78,
        letterSpacing: `${TRACKING}em`,
        color: "var(--ink)",
        visibility: size ? "visible" : "hidden",
        // room for the letters to breathe without any of it clipping
        paddingTop: "0.08em",
        paddingBottom: "0.1em",
      }}
      aria-label="Deebyanshu Jha"
    >
      {/* offscreen probe at a known size, used only for measurement — the same
          glyphs and the same word box as the heading below it */}
      <span
        ref={probe}
        aria-hidden
        className="flex"
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "nowrap",
          // a flex box shrinks to fit its container, and an absolutely
          // positioned one would quietly measure the column instead of the
          // name — which sizes the heading from its own output
          width: "max-content",
          fontSize: 100,
          letterSpacing: `${TRACKING}em`,
          fontWeight: 800,
          pointerEvents: "none",
        }}
      >
        {letters.map((ch, i) =>
          ch === " " ? <span key={i} style={{ width: `${WORD_GAP}em` }} /> : <span key={i}>{ch}</span>,
        )}
      </span>

      <span ref={row} data-wordmark-row className="flex whitespace-nowrap">
        {letters.map((ch, i) =>
          ch === " " ? (
            <span key={i} aria-hidden style={{ width: `${WORD_GAP}em` }} />
          ) : (
            <Letter
              key={i}
              ch={ch}
              index={i}
              still={still}
              revealed={revealed}
              near={near.current[i]}
              onRevealed={i === letters.length - 1 ? () => setRevealed(true) : undefined}
            />
          ),
        )}
      </span>
    </h1>
  );
}

/* ── one character ───────────────────────────────────────────────── */

function Letter({
  ch,
  index,
  still,
  revealed,
  near,
  onRevealed,
}: {
  ch: string;
  index: number;
  still: boolean;
  revealed: boolean;
  near: MotionValue<number>;
  onRevealed?: () => void;
}) {
  const lit = useSpring(near, { stiffness: 220, damping: 24, mass: 0.5 });

  const y = useTransform(lit, [0, 1], ["0em", "-0.052em"]);
  const shadow = useTransform(
    lit,
    (v) => `0 ${0.02 + v * 0.05}em ${0.05 + v * 0.22}em rgba(232,184,75,${v * 0.3})`,
  );
  // the light warms the letter towards phosphor rather than just brightening it
  const color = useTransform(
    lit,
    (v) => `color-mix(in srgb, var(--accent) ${Math.round(v * 42)}%, var(--ink))`,
  );

  return (
    <span aria-hidden className="block" style={{ overflow: revealed ? "visible" : "hidden" }}>
      {/* the entry reveal */}
      <motion.span
        className="block"
        initial={still ? { opacity: 0 } : { y: "108%" }}
        animate={still ? { opacity: 1 } : { y: "0%" }}
        transition={
          still
            ? { duration: 0.3, delay: 0.2 }
            : { duration: 1.15, delay: 0.62 + index * 0.028, ease: [0.16, 1, 0.3, 1] }
        }
        onAnimationComplete={onRevealed}
      >
        {/* the two live layers, kept on separate elements so the CSS drift and
            the sprung lift can never overwrite one another's transform */}
        <motion.span className="block" style={still ? undefined : { y }}>
          <span
            className={still ? "block" : "dos-letter block"}
            // a prime-ish stride keeps neighbouring letters out of phase, so the
            // line breathes instead of falling into a visible wave
            style={still ? undefined : { animationDelay: `${(index * 137) % 900}ms` }}
          >
            <motion.span className="block" style={still ? undefined : { textShadow: shadow, color }}>
              {ch}
            </motion.span>
          </span>
        </motion.span>
      </motion.span>
    </span>
  );
}
