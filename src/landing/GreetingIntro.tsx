import { motion } from "motion/react";
import { useEffect } from "react";

const GREETINGS = ["Hello", "Hola", "Bonjour", "こんにちは", "नमस्ते"];

/** seconds each word owns — identical for every word, including the last */
const SLOT = 0.62;
const FADE_IN = 0.32;
const FADE_OUT = 0.24;
const TOTAL = GREETINGS.length * SLOT;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN = [0.64, 0, 0.78, 0] as const;
const LIFT = [0.76, 0, 0.24, 1] as const;

/**
 * Hello, in a few languages, before the room comes up.
 *
 * Every word is in the DOM from the first frame, stacked in a single grid cell,
 * so the Devanagari and Japanese glyphs are laid out and rasterised before their
 * turn — nothing pops in on a font fallback mid-sequence, and the block never
 * changes size. The whole timeline is handed to the animation engine up front
 * as keyframes (opacity and transform only), rather than stepped through React
 * state, so a busy main thread cannot stretch one word or clip another.
 *
 * `onReveal` fires while the last word is holding, so the landing can mount
 * underneath; `onDone` starts the curtain lift.
 */
export function GreetingIntro({
  onReveal,
  onDone,
}: {
  onReveal: () => void;
  onDone: () => void;
}) {
  useEffect(() => {
    const reveal = window.setTimeout(
      onReveal,
      ((GREETINGS.length - 1) * SLOT + FADE_IN) * 1000,
    );
    const done = window.setTimeout(onDone, TOTAL * 1000);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(done);
    };
  }, [onReveal, onDone]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1000]"
      style={{ willChange: "transform" }}
      initial={{ transform: "translateY(0%)" }}
      animate={{ transform: "translateY(0%)" }}
      exit={{ transform: "translateY(-100%)" }}
      transition={{ duration: 0.95, ease: LIFT }}
    >
      <div
        className="absolute inset-0 grid place-items-center"
        style={{ background: "var(--ground)" }}
      >
        <motion.div
          className="grid font-sans text-[clamp(2.75rem,8vw,6.25rem)] font-light leading-[1.15] tracking-[0.01em]"
          style={{ color: "var(--ink)" }}
          exit={{ opacity: 0, transform: "translateY(-28px)" }}
          transition={{ duration: 0.45, ease: EASE_IN }}
        >
          {GREETINGS.map((word, i) => {
            const last = i === GREETINGS.length - 1;
            const span = SLOT + FADE_OUT;
            return (
              <motion.span
                key={word}
                className="whitespace-nowrap text-center [grid-area:1/1]"
                initial={{ opacity: 0, transform: "translateY(14px)" }}
                animate={
                  last
                    ? { opacity: 1, transform: "translateY(0px)" }
                    : {
                        opacity: [0, 1, 1, 0],
                        transform: [
                          "translateY(14px)",
                          "translateY(0px)",
                          "translateY(0px)",
                          "translateY(-12px)",
                        ],
                      }
                }
                transition={
                  last
                    ? { delay: i * SLOT, duration: FADE_IN, ease: EASE_OUT }
                    : {
                        delay: i * SLOT,
                        duration: span,
                        times: [0, FADE_IN / span, SLOT / span, 1],
                        ease: [EASE_OUT, "linear", EASE_IN],
                      }
                }
              >
                {word}
              </motion.span>
            );
          })}
        </motion.div>

        {/* a hairline that fills over the exact length of the sequence */}
        <div
          className="absolute bottom-[clamp(2rem,8vh,4.5rem)] left-1/2 h-px w-[min(38vw,220px)] -translate-x-1/2 overflow-hidden"
          style={{ background: "var(--hair)" }}
        >
          <motion.div
            className="h-full w-full origin-left"
            style={{ background: "var(--accent-dim)" }}
            initial={{ transform: "scaleX(0)" }}
            animate={{ transform: "scaleX(1)" }}
            transition={{ duration: TOTAL, ease: "linear" }}
          />
        </div>
      </div>

      {/* the curtain's trailing edge: a shallow curve, so the lift reads as a
          sheet being drawn up rather than a hard rectangle sliding away */}
      <div
        className="absolute inset-x-[-10%] top-full h-[14vh]"
        style={{
          background: "var(--ground)",
          borderRadius: "0 0 50% 50% / 0 0 100% 100%",
        }}
      />
    </motion.div>
  );
}
