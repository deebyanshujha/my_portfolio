import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { projects } from "../data/profile";
import type { Project } from "../types/portfolio";

/**
 * The project deck.
 *
 * Three projects, one physical stack, cycled with the wheel. Two integers, and
 * they are deliberately kept apart:
 *
 *   phase  ∈ {0, 1, 2}   which way round the deck is sitting
 *   travel ∈ [0, 3]      how much of its wheel budget the deck has left
 *
 * `phase` is the whole arrangement. Rotate it and the deck rotates; three
 * steps in either direction is the identity, so a full cycle always lands on
 * the exact arrangement it started from:
 *
 *   phase  0        1        2        (3 ≡ 0)
 *   deck   A B C    B C A    C A B    A B C
 *
 * `travel` is only the deal with the page: 0 is the top boundary (one more
 * wheel-up and the page is released upward), 3 the bottom. Entering from above
 * sets it to 0, from below to 3, so either way the deck owes exactly three
 * transitions before it hands the wheel back.
 *
 * Keeping them apart matters. Folding the budget into the arrangement — the
 * obvious trick, since 0 and 3 draw the same picture — means re-entering the
 * section quietly snaps the deck back to project A, and the reader's first
 * notch appears to do nothing at all.
 *
 * Every transform is derived from a card's depth (0, 1, 2) at the current
 * phase, never from its own previous transform, so the animation cannot leak
 * back into the arrangement and ↓↓↓↑↑↑ is exact.
 */

const COUNT = projects.length; // 3

/* ── timing ──────────────────────────────────────────────────────
   Tuned against a real wheel and a real trackpad: long enough that a card
   visibly travels, short enough that three of them is not a chore. */
const FLIGHT = 620; // ms — one card's trip to the back of the deck
const LOCK = 560; // ms — no second transition can start inside this
const GAP = 120; // ms — quiet gap that marks the end of a physical gesture
const HELD = 1100; // ms — a gesture held this long is a deliberate second step
const LIFT = 0.4; // point in the flight where the card crosses the others
const BAND = 0.34; // how near the viewport centre the deck must sit to capture

/* ── the stack at rest ───────────────────────────────────────────
   Offsets are deliberately small. Each card behind shows about fifteen pixels
   of its own edge — enough to read as "there are more of these", not enough to
   stop reading as one object. */
const REST = [
  { y: 0, scale: 1, rotate: 0 },
  { y: 30, scale: 0.958, rotate: -1.15 },
  { y: 60, scale: 0.916, rotate: 1.4 },
] as const;

/* The cards behind are held back with a wash of the paper colour rather than
   opacity — a see-through card would show the card underneath it — but only
   enough to drop them a step. Push it further and the stack stops reading as
   three cards and starts reading as one card with a shadow. */
const VEIL = [0, 0.2, 0.36] as const;
const BASE_Z = [30, 20, 10] as const;

const SHADOW = [
  "0 26px 60px -26px rgba(22,24,29,0.42), 0 2px 8px rgba(22,24,29,0.06)",
  "0 16px 34px -22px rgba(22,24,29,0.30), 0 1px 4px rgba(22,24,29,0.05)",
  "0 10px 22px -18px rgba(22,24,29,0.24), 0 1px 3px rgba(22,24,29,0.04)",
] as const;

/** The arc a card takes on its way to the back: lift, over, behind, settle. */
const flightTo = (dir: 1 | -1) => {
  const out = {
    y: [REST[0].y, -54, REST[2].y],
    scale: [REST[0].scale, 1.035, REST[2].scale],
    rotate: [REST[0].rotate, -3.2, REST[2].rotate],
  };
  if (dir === 1) return out;
  // scrolling back plays the same arc backwards, exactly
  return {
    y: [...out.y].reverse(),
    scale: [...out.scale].reverse(),
    rotate: [...out.rotate].reverse(),
  };
};

type Move = { index: number; dir: 1 | -1; raised: boolean };

export function ProjectDeck({ still }: { still: boolean }) {
  const [phase, setPhase] = useState(0);
  const [move, setMove] = useState<Move | null>(null);

  const deckRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);
  /** The wheel budget. Not state: nothing on screen is drawn from it. */
  const travelRef = useRef(0);
  const armed = useRef(false);
  /**
   * Which direction the deck has already handed back to the page: 0 while the
   * deck still owes transitions, 1 once it has released downward, -1 upward.
   * Directional rather than a flat lock, so a reader who scrolls one notch too
   * far can turn around and walk back through the deck instead of being shut
   * out of it until they leave the section.
   */
  const released = useRef<0 | 1 | -1>(0);
  const lastAccept = useRef(0);
  const lastWheel = useRef(0);
  const peakAbs = useRef(0);
  const timers = useRef<number[]>([]);

  const active = projects[phase];

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  /**
   * Rotate the deck one step. The card that flies is the one leaving the top
   * (going down) or the one arriving at it (coming back).
   */
  const commit = useCallback(
    (next: number, dir: 1 | -1) => {
      const flier = dir === 1 ? phaseRef.current : next;
      phaseRef.current = next;
      setPhase(next);
      clearTimers();

      if (still) {
        setMove(null);
        return;
      }
      // z-index is a step, not a curve: the card crosses the others at LIFT
      setMove({ index: flier, dir, raised: dir === 1 });
      timers.current.push(
        window.setTimeout(
          () => setMove((m) => (m ? { ...m, raised: dir === -1 } : m)),
          FLIGHT * LIFT,
        ),
        window.setTimeout(() => setMove(null), FLIGHT + 90),
      );
    },
    [still],
  );

  /** Spend one of the deck's three, if it has one left in this direction. */
  const attempt = useCallback(
    (dir: 1 | -1) => {
      const budget = travelRef.current + dir;
      if (budget < 0 || budget > COUNT) return false; // boundary — release the page
      travelRef.current = budget;
      commit((phaseRef.current + dir + COUNT) % COUNT, dir);
      return true;
    },
    [commit],
  );

  /** Keyboard and the index rail rotate the deck without touching the budget. */
  const cycle = useCallback(
    (dir: 1 | -1) => commit((phaseRef.current + dir + COUNT) % COUNT, dir),
    [commit],
  );

  const jumpTo = useCallback(
    (index: number) => {
      if (index === phaseRef.current) return;
      // one forward step, or anything else read as a step back
      const dir: 1 | -1 = (index - phaseRef.current + COUNT) % COUNT === 1 ? 1 : -1;
      commit(index, dir);
    },
    [commit],
  );

  /* ── wheel capture ─────────────────────────────────────────────
     One listener on the landing's scroller, doing rect maths only while the
     wheel is actually turning. No scroll listener, no observer loop. */
  useEffect(() => {
    const scroller: HTMLElement | Window =
      (document.querySelector("[data-landing-scroll]") as HTMLElement | null) ?? window;

    const anchor = () => {
      const deck = deckRef.current;
      if (!deck) return;
      const r = deck.getBoundingClientRect();
      const drift = r.top + r.height / 2 - window.innerHeight / 2;
      if (Math.abs(drift) < 28) return;
      deck.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
    };

    const onWheel = (event: Event) => {
      const e = event as WheelEvent;
      if (e.ctrlKey || Math.abs(e.deltaY) < 2) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const deck = deckRef.current;
      if (!deck) return;
      const r = deck.getBoundingClientRect();
      const vh = window.innerHeight;
      const inBand = Math.abs(r.top + r.height / 2 - vh / 2) < vh * BAND;

      // outside the deck's neighbourhood: forget everything
      if (!inBand) {
        armed.current = false;
        released.current = 0;
        return;
      }

      const dir: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      const now = performance.now();

      // the deck has already given this direction back to the page
      if (released.current === dir) return;
      // …but turning around picks the deck back up where it was left
      released.current = 0;

      if (!armed.current) {
        armed.current = true;
        // entering from above owes three downs; entering from below, three ups
        travelRef.current = dir === 1 ? 0 : COUNT;
        anchor();
      }

      const gap = now - lastWheel.current;
      const abs = Math.abs(e.deltaY);
      const since = now - lastAccept.current;
      lastWheel.current = now;

      // One physical gesture spends one transition. A gesture ends at a quiet
      // gap; inside one, a trackpad's momentum tail only ever decays, so the
      // only way to earn a second step without lifting off is to push harder
      // than the gesture's own peak — or to keep pushing for a long time,
      // which is what a continuous wheel spin looks like.
      if (gap >= GAP) peakAbs.current = 0;
      const surge = abs > peakAbs.current * 1.05;
      peakAbs.current = Math.max(peakAbs.current, abs);
      const fresh = gap >= GAP || surge || since >= HELD;

      if (since < (still ? 220 : LOCK) || !fresh) {
        e.preventDefault(); // hold the deck still while it finishes moving
        return;
      }

      lastAccept.current = now;
      if (attempt(dir)) {
        e.preventDefault();
      } else {
        released.current = dir; // the page takes it from here
      }
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [attempt, still]);

  /**
   * The wheel handler only re-reads the deck's position while the wheel is
   * turning, so a jump that never touches it — the nav, a scrollbar drag, a
   * keyboard page — would otherwise leave the deck armed to whatever it was
   * doing last. One observer, no callbacks on the scroll path.
   */
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) return;
        armed.current = false;
        released.current = 0;
      },
      {
        root: document.querySelector("[data-landing-scroll]"),
        rootMargin: "-40% 0px -40% 0px",
      },
    );
    io.observe(deck);
    return () => io.disconnect();
  }, []);

  /* ── touch ─────────────────────────────────────────────────────
     Same budget, same release: a swipe up is a wheel down.

     Ownership is decided in the first few pixels of the swipe, before the
     browser's own touch slop runs out, and the whole swipe then belongs either
     to the deck or to the page. Deciding late is what makes these things feel
     broken — either the page jerks a few pixels before the deck grabs it, or,
     worse, a blanket `touch-action` keeps the page from ever scrolling under
     the finger and the reader is stuck on the card. */
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    let startY = 0;
    let dir: 1 | -1 | 0 = 0;
    let capture = false;
    let spent = false;

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      dir = 0;
      capture = false;
      spent = false;
    };

    const onMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;

      if (dir === 0) {
        if (Math.abs(dy) < 5) return; // not yet a direction
        dir = dy < 0 ? 1 : -1;

        // the deck already gave the page this direction
        if (released.current === dir) return;
        if (!armed.current) {
          armed.current = true;
          travelRef.current = dir === 1 ? 0 : COUNT;
        }
        const budget = travelRef.current + dir;
        if (budget < 0 || budget > COUNT) {
          released.current = dir; // at the boundary — this swipe is the page's
          return;
        }
        released.current = 0;
        capture = true;
      }

      if (!capture) return;
      e.preventDefault(); // the deck has this one

      if (!spent && Math.abs(dy) >= 44) {
        spent = true;
        attempt(dir as 1 | -1);
      }
    };

    // a new finger always gets a fresh transition
    const onEnd = () => {
      dir = 0;
      capture = false;
      spent = false;
    };

    deck.addEventListener("touchstart", onStart, { passive: true });
    deck.addEventListener("touchmove", onMove, { passive: false });
    deck.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      deck.removeEventListener("touchstart", onStart);
      deck.removeEventListener("touchmove", onMove);
      deck.removeEventListener("touchend", onEnd);
    };
  }, [attempt]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      cycle(1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      cycle(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      window.open(active.github, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="grid gap-[clamp(1.75rem,4vw,3rem)] lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      {/* ── the rail: a system readout, not a control panel ──────── */}
      <div className="flex flex-col gap-6 lg:pt-2">
        <div>
          <div className="p-meta">Projects</div>
          <div
            className="font-display mt-1.5 font-bold tabular-nums"
            style={{
              fontSize: "clamp(2.4rem,5vw,3.2rem)",
              letterSpacing: "-0.05em",
              lineHeight: 0.9,
              color: "var(--p-ink)",
            }}
          >
            {String(phase + 1).padStart(2, "0")}
            <span style={{ color: "var(--p-ink-4)" }}>/{String(COUNT).padStart(2, "0")}</span>
          </div>
        </div>

        {/* three wheel interactions, three marks */}
        <div className="flex items-center gap-2" aria-hidden>
          {projects.map((p, i) => (
            <motion.span
              key={p.id}
              className="block rounded-full"
              style={{ height: 6 }}
              initial={false}
              // literal rather than var(--p-accent)/var(--p-line): these are
              // interpolated frame by frame, and a custom property is opaque
              // to the animator
              animate={{
                width: i === phase ? 18 : 6,
                backgroundColor: i === phase ? "#e05a24" : "rgba(22,24,29,0.16)",
              }}
              transition={still ? { duration: 0.15 } : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>

        <ul className="m-0 flex list-none flex-col p-0">
          {projects.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => jumpTo(i)}
                className="flex w-full items-baseline gap-3 border-t py-2.5 text-left"
                style={{ borderColor: "var(--p-line-2)" }}
                aria-current={i === phase ? "true" : undefined}
              >
                <span
                  className="p-meta"
                  style={{ color: i === phase ? "var(--p-accent)" : undefined }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-[14px] transition-colors"
                  style={{
                    color: i === phase ? "var(--p-ink)" : "var(--p-ink-3)",
                    letterSpacing: "-0.015em",
                    fontWeight: i === phase ? 600 : 400,
                  }}
                >
                  {p.title}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p
          className="p-meta m-0 hidden leading-[1.9] lg:block"
          style={{ color: "var(--p-ink-4)" }}
        >
          Scroll to deal
          <br />↑ ↓ to step through
        </p>
      </div>

      {/* ── the stack ─────────────────────────────────────────────── */}
      <div
        ref={deckRef}
        tabIndex={0}
        role="group"
        aria-roledescription="Project card stack"
        aria-label={`Projects — ${active.title}, ${phase + 1} of ${COUNT}. Use the arrow keys to step through the deck.`}
        onKeyDown={onKeyDown}
        className="deck relative outline-none"
        // --card-h and the room the two cards behind need is set in index.css,
        // beside the rest of the paper's metrics. No touch-action here on
        // purpose — the touch handler decides ownership per swipe.

      >
        {/* the deck's label changes as it turns, but a changed label is not
            announced — this is what actually tells a screen reader that the
            wheel did something */}
        <p className="sr-only" aria-live="polite">
          Project {phase + 1} of {COUNT}: {active.title}
        </p>

        {projects.map((project, i) => {
          const depth = (i - phase + COUNT) % COUNT;
          const flying = move?.index === i;
          const rest = REST[depth];

          return (
            <motion.article
              key={project.id}
              aria-hidden={depth !== 0}
              onClick={depth === 0 ? undefined : () => jumpTo(i)}
              className="absolute inset-x-0 top-0 overflow-hidden"
              style={{
                height: "var(--card-h)",
                borderRadius: 4,
                background: "var(--p-card)",
                transformOrigin: "50% 62%",
                cursor: depth === 0 ? "default" : "pointer",
                willChange: "transform",
              }}
              initial={false}
              animate={{
                ...(flying && move && !still ? flightTo(move.dir) : rest),
                zIndex: flying && move ? (move.raised ? 44 : 12) : BASE_Z[depth],
                boxShadow: SHADOW[depth],
              }}
              transition={
                still
                  ? { duration: 0.2, ease: "linear" }
                  : flying
                    ? {
                        duration: FLIGHT / 1000,
                        times: [0, LIFT, 1],
                        ease: [
                          [0.32, 0, 0.4, 1],
                          [0.25, 0.8, 0.3, 1],
                        ],
                        zIndex: { duration: 0 },
                        boxShadow: { duration: FLIGHT / 1000 },
                      }
                    : {
                        type: "spring",
                        stiffness: 210,
                        damping: 27,
                        mass: 0.9,
                        zIndex: { duration: 0 },
                        boxShadow: { duration: 0.5 },
                      }
              }
            >
              <Card project={project} index={i} hero={depth === 0} />

              {/* What a card behind shows is its edge, so the strip that sticks
                  out has to be blank card stock. Without this the reader gets
                  the tail of another card's tech list poking out from under the
                  hero, which reads as clutter rather than as depth. */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--p-card) 46%)",
                }}
                initial={false}
                animate={{ opacity: depth === 0 ? 0 : 1 }}
                transition={still ? { duration: 0.2 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* cards behind recede into the paper rather than turning
                  transparent — a translucent card would show the one under it */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "var(--p-bg)" }}
                initial={false}
                animate={{ opacity: VEIL[depth] }}
                transition={still ? { duration: 0.2 } : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: "inset 0 0 0 1px var(--p-line)", borderRadius: 4 }}
              />
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

/* ── one card ────────────────────────────────────────────────────
   Every fact is read straight out of the project record. Editorial, not
   product: a rule, a number, a name set large, and the metadata kept quiet at
   the foot where a spec sheet keeps it. */
function Card({ project, index, hero }: { project: Project; index: number; hero: boolean }) {
  return (
    <div className="flex h-full flex-col p-[clamp(1.5rem,2.8vw,2.5rem)]">
      <div
        className="flex items-baseline gap-4 border-b pb-3"
        style={{ borderColor: "var(--p-line)" }}
      >
        <span className="p-meta" style={{ color: "var(--p-accent)" }}>
          Project / {String(index + 1).padStart(2, "0")}
        </span>
        <span className="p-meta">{project.category}</span>
        <span className="p-meta ml-auto" style={{ color: "var(--p-ink-4)" }}>
          {project.id}
        </span>
      </div>

      <h3
        className="font-display m-0 mt-[clamp(1rem,2.2vw,1.6rem)] font-bold"
        style={{
          fontSize: "clamp(2rem,4vw,3rem)",
          letterSpacing: "-0.045em",
          lineHeight: 0.98,
          color: "var(--p-ink)",
        }}
      >
        {project.title}
      </h3>
      <div
        className="mt-2 text-[clamp(0.85rem,1.2vw,1rem)]"
        style={{ color: "var(--p-ink-3)", letterSpacing: "-0.01em" }}
      >
        {project.subtitle}
      </div>

      <p
        className="m-0 mt-[clamp(0.9rem,1.8vw,1.4rem)] max-w-[54ch]"
        style={{
          fontSize: "clamp(0.9rem,1.15vw,0.98rem)",
          lineHeight: 1.6,
          color: "var(--p-ink-2)",
        }}
      >
        {project.description}
      </p>

      <ul className="m-0 mt-[clamp(0.9rem,1.8vw,1.35rem)] flex list-none flex-col gap-2 p-0">
        {project.features.slice(0, 2).map((feature) => (
          <li
            key={feature}
            className="flex gap-3 text-[13.5px]"
            style={{ color: "var(--p-ink-2)", lineHeight: 1.5 }}
          >
            <span aria-hidden style={{ color: "var(--p-accent)" }}>
              —
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/* the closing line of the spec, set as a marginal note — it is what the
          project is *for*, which is the last thing worth reading on a card */}
      <p
        className="m-0 mt-auto max-w-[46ch] border-l-2 pl-4 text-[13px] italic"
        style={{
          borderColor: "var(--p-accent)",
          color: "var(--p-ink-3)",
          lineHeight: 1.55,
          // bottom-anchored when the card has slack, but never flush against
          // the feature list when it does not
          marginTop: "auto",
          paddingTop: "clamp(0.9rem, 2vw, 1.4rem)",
        }}
      >
        {project.impact}
      </p>

      <div
        className="mt-[clamp(1rem,2.2vw,1.6rem)] flex flex-col items-start gap-3 border-t pt-4 sm:flex-row sm:items-end sm:gap-x-6"
        style={{ borderColor: "var(--p-line-2)" }}
      >
        <div className="min-w-0 flex-1">
          <div className="p-meta">Built with</div>
          <div
            className="mt-1.5 font-mono text-[11.5px]"
            style={{ color: "var(--p-ink-2)", letterSpacing: "0.01em" }}
          >
            {project.techStack.join("  ·  ")}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-5">
          <Outbound href={project.github} reachable={hero}>
            Source
          </Outbound>
          {project.docs && (
            <Outbound href={project.docs} reachable={hero}>
              Docs
            </Outbound>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The page's outbound link. Cards behind the hero are `aria-hidden`, so their
 * links are taken out of the tab order too — a stack should never hide focus
 * behind itself.
 */
function Outbound({
  href,
  reachable,
  children,
}: {
  href: string;
  reachable: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={reachable ? 0 : -1}
      className="pull inline-flex items-center gap-1.5 text-[13.5px] font-medium"
      style={{ color: "var(--p-ink)" }}
    >
      {children}
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" />
      </svg>
    </a>
  );
}
