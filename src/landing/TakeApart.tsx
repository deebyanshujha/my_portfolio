import { useCallback, useMemo, useRef } from "react";
import { motion, motionValue, useSpring, useTransform, type MotionValue } from "motion/react";

/**
 * A sentence that takes itself apart.
 *
 * The line it was written for is "Systems you can take apart and understand."
 * — so it does. Run a cursor along it and the sentence separates under your
 * hand, and closes again behind you. The interaction and the copy mean the same
 * thing, which is the only reason it earns its place: the same effect on a
 * sentence about anything else would be decoration.
 *
 * Two decisions carry it.
 *
 * It comes apart at the *words*, not the characters. Per-character was the
 * first version and it was wrong: at headline size the seam opened inside
 * words — "y ou", "understan d" — which reads as a typo, not as a mechanism.
 * Words are the joints this sentence actually has.
 *
 * And it opens *locally*, around the pointer. A line that opens uniformly is a
 * hover state. A line that opens where you touch it is a thing being handled.
 *
 * Transform and opacity only, one listener, geometry cached between moves and
 * dropped on leave. Under `prefers-reduced-motion` it is plain text with no
 * listener at all.
 */

/** how far the seam reaches, in multiples of a word's own width */
const REACH = 2.1;
/** how far a word slides at full strength, in em */
const SPREAD = 0.14;

export function TakeApart({
  text,
  still,
  className,
  style,
}: {
  text: string;
  still: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const row = useRef<HTMLSpanElement>(null);

  // the trailing space is kept on the word so the line breaks where it always
  // would; a separate space element would be a break opportunity of its own
  const words = useMemo(() => text.split(" "), [text]);

  /** per-word seam strength, signed: negative pushes left, positive right */
  const pull = useRef<MotionValue<number>[]>([]);
  if (pull.current.length !== words.length) {
    pull.current = words.map((_, i) => pull.current[i] ?? motionValue(0));
  }

  const cells = useRef<{ x: number; w: number }[]>([]);
  const frame = useRef(0);

  const remeasure = useCallback(() => {
    const host = row.current;
    if (!host) return;
    cells.current = [...host.children].map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, w: r.width || 24 };
    });
  }, []);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (still || frame.current) return;
      const cx = e.clientX;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (!cells.current.length) remeasure();
        for (let i = 0; i < cells.current.length; i++) {
          const cell = cells.current[i];
          const value = pull.current[i];
          if (!cell || !value) continue;
          const dx = cell.x - cx;
          const strength = Math.max(0, 1 - Math.abs(dx) / (cell.w * REACH));
          // sign carries the direction, so the seam parts rather than shifting
          value.set(Math.sign(dx) * strength * strength);
        }
      });
    },
    [remeasure, still],
  );

  const close = useCallback(() => {
    for (const value of pull.current) value.set(0);
    cells.current = [];
  }, []);

  if (still) return <span className={className} style={style}>{text}</span>;

  return (
    <span
      ref={row}
      className={className}
      style={{ ...style, cursor: "default" }}
      onPointerEnter={remeasure}
      onPointerMove={onMove}
      onPointerLeave={close}
    >
      {words.map((word, i) => (
        <Word key={i} word={word} last={i === words.length - 1} pull={pull.current[i]} />
      ))}
    </span>
  );
}

function Word({
  word,
  last,
  pull,
}: {
  word: string;
  last: boolean;
  pull: MotionValue<number>;
}) {
  const eased = useSpring(pull, { stiffness: 250, damping: 24, mass: 0.5 });
  const x = useTransform(eased, (v) => `${v * SPREAD}em`);
  // a word pushed aside lifts a little off the line, so the seam has depth
  // rather than only width
  const y = useTransform(eased, (v) => `${-Math.abs(v) * 0.035}em`);
  const opacity = useTransform(eased, (v) => 1 - Math.abs(v) * 0.12);

  return (
    <motion.span style={{ display: "inline-block", x, y, opacity, whiteSpace: "pre" }}>
      {last ? word : `${word} `}
    </motion.span>
  );
}
