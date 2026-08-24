import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";

/**
 * The entrance.
 *
 * A sheet of paper covers the room, and a small drawn figure standing at the
 * bottom of it takes hold of a tab, leans back, and pulls the whole thing down
 * out of the frame — the way you would yank a roller blind. That gesture is the
 * reason the sheet moves: the tug is slow and heavy, the sheet gives way, runs,
 * overshoots, and settles, and the figure is left standing on the room it just
 * uncovered. He looks at what he has done, waves, and goes.
 *
 * Paper is not an arbitrary choice: the landing page is a dark room above and
 * warm paper below, and this is the paper arriving early to hide the room. The
 * figure is drawn in the same ink as the sections underneath it, with a
 * paper-coloured halo so he still reads once the dark room is what is behind
 * him — and he stands off to one side, because the middle of this page is
 * already occupied by the machine and a very large name.
 *
 * It runs once per page load. Coming back from the desktop does not replay it —
 * the module-level `introDone` outlives React, but not a refresh, which is the
 * distinction the sequence actually wants. Anyone who prefers reduced motion
 * never sees it at all.
 */

/** Set when the sequence finishes, so a re-mount does not replay it. */
let introDone = false;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (v: number) => 1 - Math.pow(1 - v, 3);

/** Seconds. The whole thing, start to gone. */
const T = {
  appear: 0.0,
  reach: 0.28,
  grip: 0.48,
  tug: 0.6,
  release: 0.76,
  landed: 1.44,
  settled: 1.6,
  react: 1.72,
  leave: 2.05,
  end: 2.25,
} as const;

/** How far the figure drags the sheet before it gives way, in px. */
const TUG = 40;

/* ── the figure's geometry ───────────────────────────────────────────
   One coordinate system for the whole character, in its own px, drawn on
   screen at SCALE. The arms are drawn from the shoulders to wherever the
   hands are, so "the hands hold the tab" is literally true rather than
   approximately staged — which is also why the tab's height is derived
   from the grip rather than typed in twice. */

const FIG = {
  w: 132,
  h: 168,
  headR: 15,
  headY: 56,
  neckY: 71,
  hipY: 118,
  shoulderY: 82,
  shoulderX: 15,
  /** where the hands sit while gripping — clear of the head, arms extended */
  gripY: 4,
  gripX: 30,
  /** hands at rest, before the reach and after the release */
  restY: 112,
  restX: 21,
};

/** drawn size / coordinate size */
const SCALE = 1.24;
/** how far the figure's feet sit above the bottom of the viewport */
const FLOOR = 14;
/** the tab has to be exactly where the raised hands are, or he grips air */
const TAB_BOTTOM = FLOOR + (FIG.h - FIG.gripY) * SCALE;

/**
 * Where he stands, as a fraction of the viewport width.
 *
 * Not the middle: the middle of this landing page is the machine, the tagline
 * and the centre of a wordmark set in letters taller than he is. Off to one
 * side he uncovers the page instead of standing in front of it.
 */
const ANCHOR = 0.2;
/** how far the sheet hangs past the left and right edges */
const OVER = 0.06;

/**
 * He is drawn as ink with a paper-coloured halo, like a sticker.
 *
 * The alternative was recolouring him as the background changed underneath —
 * but the background he ends on is a dark room carrying a wordmark in huge
 * pale letters, so there is no single colour that reads against all of it. An
 * outline reads against all of it.
 */
const STICKER =
  "drop-shadow(0 0 2px rgba(247,244,238,0.95)) drop-shadow(0 0 5px rgba(247,244,238,0.8))";
const INK = "#17171b";

export function Curtain({ onDone }: { onDone?: () => void }) {
  // read once: the sequence is two seconds long, and a viewport that changes
  // mid-pull is not worth a re-render
  const { vw, vh } = useMemo(
    () =>
      typeof window === "undefined"
        ? { vw: 1440, vh: 900 }
        : { vw: window.innerWidth, vh: window.innerHeight },
    [],
  );

  /**
   * Both the figure and the tab are placed from this one number, in pixels.
   * The tab lives inside a sheet that overhangs the viewport, so a percentage
   * would mean two different distances for the two of them — and they have to
   * agree exactly. Clamped so he cannot hang off the edge of a phone.
   */
  const anchorX = Math.max(vw * ANCHOR, (FIG.w * SCALE) / 2 + 10);

  /** the master clock — every part of the scene is derived from it */
  const t = useMotionValue(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const controls = animate(t, T.end, { duration: T.end, ease: "linear" });
    controls.then(() => {
      introDone = true;
      setGone(true);
      onDone?.();
    });
    return () => controls.stop();
  }, [onDone, t]);

  /* ── the sheet ──────────────────────────────────────────────────
     Still, then heavy while it is dragged, then it runs away faster than
     the figure could pull it, overshoots the bottom edge and rebounds
     once before it settles out of frame. */
  /**
   * The overshoot has to be *visible*, which means the rebound brings the
   * sheet's trailing edge back inside the viewport for a moment. Landing at
   * `vh + 30` puts it just out of frame; the bounce to `vh - 24` shows a
   * sliver of it again before it finally drops away.
   */
  const sheetY = useTransform(
    t,
    [T.grip, T.tug, T.release, T.landed, T.settled, T.settled + 0.16],
    [0, TUG * 0.45, TUG, vh + 30, vh - 24, vh + 140],
    {
      // heavy, heavy, then loose: the resistance is in the easing
      ease: [
        (v) => v * v,
        (v) => v * v,
        (v) => v * v * v,
        (v) => 1 - Math.pow(1 - v, 3),
        (v) => v * v,
      ],
      clamp: true,
    },
  );

  /**
   * Paper under tension is not quite the size it was. A fraction of a percent
   * across is enough — it is felt rather than seen, which is the point.
   */
  const squeeze = useTransform(
    t,
    [T.grip, T.release, T.release + 0.12],
    [1, 0.996, 1],
    { clamp: true },
  );

  /** the tiny wobble of something under tension, and the snap when it lets go */
  const tilt = useTransform(
    t,
    [T.grip, T.tug, T.release, T.release + 0.12, T.landed],
    [0, -0.5, -0.75, 0.5, 0],
    { clamp: true },
  );

  /* ── the hands ──────────────────────────────────────────────────
     Up to the tab, down with it while it resists, then flung back as the
     sheet tears out of the grip.

     While he is gripping, the hands are read *from* the sheet rather than
     animated alongside it. Two keyframe tracks with the same numbers still
     drift apart the moment their easings differ, and a grip that drifts is
     the one thing this whole sequence cannot afford. The drag is a screen
     distance and the hands live in the figure's own coordinates, hence the
     divide by SCALE. */
  const RELEASED_HAND = FIG.gripY + TUG / SCALE;
  /** how far the sheet has escaped past the grip, 0..1 */
  const torn = useTransform(sheetY, (sy) => clamp01((sy - TUG) / 150));

  /** the small "there you go" once the room is uncovered: a hop and a cheer */
  const cheer = useTransform(
    t,
    [T.settled, T.react, T.react + 0.2, T.leave],
    [0, 1, 0.5, 0.3],
    { clamp: true },
  );

  const handY = useTransform([t, sheetY, torn, cheer], ([tv, sy, k, c]: number[]) => {
    // reaching up for it — the only phase the clock owns, because nothing is
    // moving yet for the hands to be read from
    if (sy <= 0 && tv < T.grip) {
      const r = clamp01((tv - T.reach) / (T.grip - T.reach));
      return FIG.restY + (FIG.gripY - FIG.restY) * easeOut(r);
    }
    // held: the grip is defined by where the sheet is, not by a parallel
    // keyframe track that happens to start with the same numbers
    if (k <= 0) return FIG.gripY + sy / SCALE;
    // torn out of his hands as the sheet runs away, then thrown up again for
    // the cheer — the arms are the only part of him big enough to react with
    const dropped = RELEASED_HAND + (FIG.restY - RELEASED_HAND) * easeOut(k);
    return dropped + (58 - dropped) * c;
  });

  const handSpread = useTransform([t, torn, cheer], ([tv, k, c]: number[]) => {
    if (k > 0) {
      const base = FIG.gripX + (FIG.restX - FIG.gripX) * easeOut(k);
      return base + (38 - base) * c;
    }
    const r = clamp01((tv - T.reach) / (T.grip - T.reach));
    return FIG.restX + (FIG.gripX - FIG.restX) * r;
  });

  const handXL = useTransform(handSpread, (s) => FIG.w / 2 - s);
  const handXR = useTransform(handSpread, (s) => FIG.w / 2 + s);

  /**
   * Leaning back into the pull.
   *
   * This turns the body only, never the arms. Rotating the whole figure also
   * rotates its hands, which slides them off a tab that is not rotating with
   * them — the lean has to be something the body does underneath a grip that
   * stays put.
   */
  const lean = useTransform([sheetY, torn], ([sy, k]: number[]) => {
    if (k <= 0) return -3.5 * clamp01(sy / TUG); // into the pull
    // the snap forward when it gives, then upright again
    return k < 0.35 ? -3.5 + 7 * (k / 0.35) : 3.5 * (1 - clamp01((k - 0.35) / 0.65));
  });

  /** the little hop of satisfaction once the room is uncovered */
  const hop = useTransform(
    t,
    [T.settled, T.react, T.react + 0.12, T.leave],
    [0, -16, 0, 0],
    { clamp: true },
  );

  const figureOpacity = useTransform(
    t,
    [T.appear, T.reach - 0.06, T.leave, T.end],
    [0, 1, 1, 0],
    { clamp: true },
  );

  const figureScale = useTransform(t, [T.leave, T.end], [1, 0.94], { clamp: true });

  if (gone) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1240] overflow-hidden"
    >
      {/* ══ the sheet ════════════════════════════════════════════ */}
      {/* Wider and taller than the viewport on every side but the bottom: the
          sheet tilts under tension, and a sheet exactly the size of the screen
          would show a wedge of the page at a corner the moment it did. Its
          bottom edge still sits on the bottom of the viewport, which is what
          the tab is measured from. */}
      <motion.div
        className="pointer-events-auto absolute"
        style={{
          left: `${-OVER * 100}%`,
          right: `${-OVER * 100}%`,
          // just enough overhang to hide the wedge the tilt would otherwise
          // open at a top corner — any more and the tug would reveal nothing
          top: -14,
          bottom: 0,
          y: sheetY,
          rotate: tilt,
          scaleX: squeeze,
          transformOrigin: "50% 0%",
          willChange: "transform",
        }}
      >
        <div
          className="grain absolute inset-0"
          style={{
            background:
              "linear-gradient(178deg, #fffdf9 0%, #f6f3ed 46%, #ece7de 100%)",
            // the top edge is the one doing the revealing, so that is the edge
            // that casts — downward shadow here would fall off the screen
            boxShadow:
              "0 -22px 48px -10px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        />

        {/* the tab he takes hold of — placed at the grip, not near it */}
        <div
          className="absolute -translate-x-1/2"
          style={{ left: anchorX + vw * OVER, bottom: TAB_BOTTOM - 7 }}
        >
          <div
            style={{
              width: FIG.gripX * 2 * SCALE + 26,
              height: 14,
              borderRadius: 7,
              background: "#e2dbcd",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.13)",
            }}
          />
        </div>
      </motion.div>

      {/* ══ the figure ═══════════════════════════════════════════
          Fixed to the floor of the viewport. Only the hands travel, which
          is what makes it read as him moving the sheet rather than the
          sheet moving past him. */}
      <motion.div
        className="absolute"
        style={{
          left: anchorX,
          bottom: FLOOR,
          width: FIG.w * SCALE,
          height: FIG.h * SCALE,
          opacity: figureOpacity,
          // centred with `x`, not a utility class: Motion writes the whole
          // transform, so a translate coming from CSS would be overwritten
          x: "-50%",
          y: hop,
          scale: figureScale,
          filter: STICKER,
          willChange: "transform, opacity",
        }}
      >
        <Figure
          handXL={handXL}
          handXR={handXR}
          handY={handY}
          lean={lean}
          t={t}
        />
      </motion.div>
    </div>
  );
}

/* ── the drawing ─────────────────────────────────────────────────── */

type MV = ReturnType<typeof useMotionValue<number>>;

/**
 * Deliberately a drawing and not a rig: round caps, uneven weights, a head
 * that is very slightly off-round, and one eyebrow higher than the other. The
 * arms are the only part that is computed — they are drawn from each shoulder
 * to the hand, so the grip holds whatever the hands are holding.
 */
function Figure({
  handXL,
  handXR,
  handY,
  lean,
  t,
}: {
  handXL: MV;
  handXR: MV;
  handY: MV;
  lean: MV;
  t: MV;
}) {
  const { w, h, headR, headY, neckY, hipY, shoulderY, shoulderX } = FIG;
  const midX = w / 2;

  /**
   * The elbow rides between shoulder and hand, pushed out to the side — but
   * only as far as the pose leaves room for. An arm stretched straight
   * overhead has nowhere to put a bend, and keeping the full offset there
   * bows it around the head like a jug handle.
   */
  const bow = useTransform(handY, (hy) => 3 + 13 * (1 - clamp01((shoulderY - hy) / 70)));
  const elbowXL = useTransform([handXL, bow], ([hx, bw]: number[]) => {
    const sx = midX - shoulderX;
    return sx + (hx - sx) * 0.5 - bw;
  });
  const elbowXR = useTransform([handXR, bow], ([hx, bw]: number[]) => {
    const sx = midX + shoulderX;
    return sx + (hx - sx) * 0.5 + bw;
  });
  const elbowY = useTransform(handY, (hy) => shoulderY + (hy - shoulderY) * 0.52 + 5);

  /** squint of effort while pulling, back to a grin once it is done */
  const mouth = useTransform(
    t,
    [T.grip, T.release, T.release + 0.5, T.settled],
    [0, 1, 1, 0],
    { clamp: true },
  );
  const mouthPath = useTransform(mouth, (m) => {
    // 0: a small open smile   1: a flat, gritted line
    const dip = 4 * (1 - m);
    return `M${midX - 6},${headY + 5} Q${midX},${headY + 5 + dip} ${midX + 6},${headY + 5}`;
  });
  const browY = useTransform(mouth, (m) => headY - 6 - m * 1.5);

  const common = {
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      width={w * SCALE}
      height={h * SCALE}
      viewBox={`0 0 ${w} ${h}`}
      style={{ overflow: "visible" }}
    >
      {/* the ground he is standing on — a scribbled line, not a rule */}
      <motion.path
        d={`M${midX - 34},${h - 3} C${midX - 14},${h - 5} ${midX + 10},${h - 1} ${midX + 33},${h - 4}`}
        stroke={INK}
        strokeWidth={2}
        opacity={0.32}
        {...common}
      />

      {/* Everything the lean turns: legs, torso, head, face. The arms come
          after this group, in un-rotated space, so the grip stays on the tab
          however far he leans. */}
      <motion.g style={{ rotate: lean, originX: `${midX}px`, originY: `${h}px` }}>
      {/* legs — braced apart, one knee bent more than the other */}
      <motion.path
        d={`M${midX},${hipY} C${midX - 8},${hipY + 18} ${midX - 17},${hipY + 30} ${midX - 21},${h - 6}`}
        stroke={INK}
        strokeWidth={3.4}
        {...common}
      />
      <motion.path
        d={`M${midX},${hipY} C${midX + 9},${hipY + 17} ${midX + 16},${hipY + 32} ${midX + 20},${h - 6}`}
        stroke={INK}
        strokeWidth={3.4}
        {...common}
      />
      {/* feet */}
      <motion.path
        d={`M${midX - 21},${h - 6} l-9,1`}
        stroke={INK}
        strokeWidth={3.4}
        {...common}
      />
      <motion.path
        d={`M${midX + 20},${h - 6} l9,1.5`}
        stroke={INK}
        strokeWidth={3.4}
        {...common}
      />

      {/* torso — a slight curve, never a straight line */}
      <motion.path
        d={`M${midX},${neckY} C${midX + 2},${neckY + 16} ${midX - 2},${hipY - 16} ${midX},${hipY}`}
        stroke={INK}
        strokeWidth={3.6}
        {...common}
      />

      {/* head — very slightly an ellipse, so it looks drawn */}
      <motion.ellipse
        cx={midX}
        cy={headY}
        rx={headR}
        ry={headR * 1.06}
        stroke={INK}
        strokeWidth={3.4}
        {...common}
      />
      {/* eyes */}
      <motion.circle cx={midX - 5.5} cy={headY - 1} r={1.9} fill={INK} />
      <motion.circle cx={midX + 5.5} cy={headY - 1} r={1.9} fill={INK} />
      {/* one brow higher than the other — the whole personality budget */}
      <motion.path
        d={useTransform(browY, (y) => `M${midX - 9},${y + 1} l6,-1.5`)}
        stroke={INK}
        strokeWidth={2}
        {...common}
      />
      <motion.path
        d={useTransform(browY, (y) => `M${midX + 3},${y - 1.5} l6,1.5`)}
        stroke={INK}
        strokeWidth={2}
        {...common}
      />
      <motion.path d={mouthPath} stroke={INK} strokeWidth={2.2} {...common} />
      </motion.g>

      {/* Arms and hands, drawn last and outside the leaning group.
          Shoulder → elbow → hand, where the hand is wherever the grip is —
          which is the whole trick: the arms are recomputed to reach the tab
          rather than posed to look as though they do. */}
      <motion.path
        d={useTransform(
          [elbowXL, elbowY, handXL, handY],
          ([ex, ey, hx, hy]: number[]) =>
            `M${midX - shoulderX},${shoulderY} Q${ex},${ey} ${hx},${hy}`,
        )}
        stroke={INK}
        strokeWidth={3.2}
        {...common}
      />
      <motion.path
        d={useTransform(
          [elbowXR, elbowY, handXR, handY],
          ([ex, ey, hx, hy]: number[]) =>
            `M${midX + shoulderX},${shoulderY} Q${ex},${ey} ${hx},${hy}`,
        )}
        stroke={INK}
        strokeWidth={3.2}
        {...common}
      />

      {/* hands — small closed fists on the tab */}
      <motion.circle cx={handXL} cy={handY} r={4.6} fill={INK} />
      <motion.circle cx={handXR} cy={handY} r={4.6} fill={INK} />
    </svg>
  );
}

/** True when the entrance has already run in this page load. */
export const curtainPlayed = () => introDone;

/** Records the entrance as run without playing it — the reduced-motion path. */
export function skipCurtain() {
  introDone = true;
}
