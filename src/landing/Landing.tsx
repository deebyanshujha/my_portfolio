import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Machine } from "./Machine";
import { Wordmark } from "./Wordmark";
import { Background, Contact, Intro, Toolkit, Work } from "./Sections";
import { RoomLight } from "./RoomLight";
import { Console } from "./Console";
import { GreetingIntro } from "./GreetingIntro";
import { useStage } from "../os/stage/StageProvider";
import { prefersStill, useSettings } from "../os/kernel/settingsStore";

const META = [
  "Vellore, IN",
  "B.Tech CSE — IoT",
  "Compilers / Networks / Backend",
];

const NAV = [
  { id: "about", label: "What I build" },
  { id: "work", label: "Work" },
  { id: "toolkit", label: "Toolkit" },
  { id: "contact", label: "Contact" },
];

/**
 * The landing page.
 *
 * Two halves that are deliberately unlike each other. The hero is a dark room
 * with a single lit object in it — the machine is the only light source, and
 * pressing its screen is how you get inside the system. Everything below is
 * paper: warm, bright, wide-margined, and set as an editorial spec of the work.
 * Scrolling reads as walking out of the room and into the portfolio.
 *
 * Layout note: the room is painted on a layer locked to the viewport and the
 * content scrolls above it. The paper sections are opaque, so they cover the
 * room as they arrive rather than fighting it.
 */
export function Landing() {
  const { stage, enter } = useStage();
  const settings = useSettings();
  const still = prefersStill(settings);
  const pushing = stage !== "landing";
  const [greeting, setGreeting] = useState(!still);

  const scroller = useRef<HTMLDivElement>(null);
  const finishGreeting = useCallback(() => setGreeting(false), []);

  /**
   * The console's `boot` command, which has to arrive at exactly the same
   * place the machine's own screen does — the entry transition measures the
   * screen and expands it, so it needs that node, not a synthetic rect.
   */
  const bootFromConsole = () => {
    if (stage !== "landing") return;
    const screen = document.querySelector("[data-machine-screen]");
    if (screen) enter(screen.getBoundingClientRect());
  };

  const jump = (id: string) => {
    scroller.current
      ?.querySelector(`#${id}`)
      ?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  };

  // the "camera push": layers recede at different rates so the frame reads as
  // depth rather than a flat zoom
  const dolly = (depth: number) =>
    still
      ? { opacity: pushing ? 0 : 1 }
      : {
          scale: pushing ? 1 + depth * 0.5 : 1,
          opacity: pushing ? 0.14 : 1,
          filter: pushing ? `blur(${depth * 22}px)` : "blur(0px)",
        };

  const dollyT = { duration: 0.85, ease: [0.76, 0, 0.24, 1] as const };

  return (
    <div className="relative h-full w-full">
      {/* ── the room: locked to the viewport, never scrolls ────── */}
      <div
        aria-hidden
        className="grain pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(128% 88% at 50% 6%, #1e1d22 0%, #131317 44%, #0b0b0e 100%)",
        }}
      >
        <RoomLight still={still} dimmed={pushing} />
        <div
          className="absolute inset-x-0 bottom-0 h-[46%]"
          style={{
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.5))",
          }}
        />
      </div>

      {/* ── the content ────────────────────────────────────────── */}
      <div
        ref={scroller}
        data-landing-scroll
        className="scroll-thin absolute inset-0 overflow-x-hidden"
        style={{ overflowY: pushing ? "hidden" : "auto" }}
      >
        {/* ══ the room ══════════════════════════════════════════ */}
        <div className="relative flex min-h-full flex-col justify-between gap-[clamp(1rem,3.5vh,2.75rem)] px-[clamp(1.25rem,4vw,3.5rem)] py-[clamp(1.25rem,3vw,2.25rem)]">
          <motion.header
            className="flex items-start justify-between gap-6"
            initial={{ opacity: 0, y: -8 }}
            animate={pushing ? { opacity: 0, y: -18 } : { opacity: 1, y: 0 }}
            transition={pushing ? dollyT : { duration: 0.7, delay: 0.1 }}
          >
            <div className="flex items-baseline gap-3">
              <span
                className="font-display text-[13px] font-bold"
                style={{ letterSpacing: "0.3em", color: "var(--ink)" }}
              >
                DOS
              </span>
              <span className="meta">System 1.0</span>
            </div>

            {/* section jumps — the page has somewhere to go now */}
            <nav
              className="hidden items-center gap-5 md:flex"
              aria-label="Sections"
            >
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jump(item.id)}
                  className="meta transition-colors hover:text-[var(--ink)]"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <span
              className="meta hidden items-center gap-1.5 md:inline-flex"
              style={{ color: "var(--ink-4)" }}
            >
              <kbd
                className="rounded border px-1.5 py-[1px] font-mono text-[11px] leading-[1.4]"
                style={{
                  borderColor: "var(--hair-strong)",
                  color: "var(--ink-3)",
                }}
              >
                `
              </kbd>
              for a console
            </span>
            <span className="meta text-right md:hidden">Software Engineer</span>
          </motion.header>

          {/* ── stage ────────────────────────────────────────── */}
          <div className="relative flex flex-1 flex-col items-center justify-center gap-[clamp(1.5rem,4vh,3rem)]">
            <motion.div
              className="relative"
              initial={
                still ? { opacity: 0 } : { opacity: 0, y: 28, scale: 0.965 }
              }
              animate={
                pushing
                  ? dolly(0.9)
                  : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
              }
              transition={
                pushing
                  ? dollyT
                  : { duration: 1.15, delay: 0.15, ease: [0.16, 1, 0.3, 1] }
              }
            >
              <Machine />
            </motion.div>

            <motion.p
              className="font-editorial m-0 max-w-[26ch] text-center italic"
              style={{
                fontSize: "clamp(1.05rem, 1.9vw, 1.55rem)",
                color: "var(--ink-2)",
                lineHeight: 1.35,
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={
                pushing
                  ? dolly(0.55)
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              transition={pushing ? dollyT : { duration: 0.9, delay: 0.95 }}
            >
              A portfolio you have to switch on.
            </motion.p>
          </div>

          {/* ── name + rail ──────────────────────────────────── */}
          <motion.footer
            className="shrink-0"
            animate={pushing ? dolly(0.28) : {}}
            transition={pushing ? dollyT : undefined}
          >
            <Wordmark still={still} />
            <motion.div
              data-landing-meta
              className="mt-[clamp(0.75rem,2vh,1.5rem)] flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3"
              style={{ borderColor: "var(--hair)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: pushing ? 0 : 1 }}
              transition={{ duration: 0.8, delay: pushing ? 0 : 1.5 }}
            >
              {META.map((m) => (
                <span key={m} className="meta">
                  {m}
                </span>
              ))}
              {/* The console is no longer hidden, only quiet. It is marked
                  where the key exists — never on touch, where there is no
                  backtick to press and the hint would be a dead end. */}
              <span
                className="meta hidden items-center gap-1.5 md:inline-flex"
                style={{ color: "var(--ink-4)" }}
              >
                <kbd
                  className="rounded border px-1.5 py-[1px] font-mono text-[11px] leading-[1.4]"
                  style={{
                    borderColor: "var(--hair-strong)",
                    color: "var(--ink-3)",
                  }}
                >
                  `
                </kbd>
                for a console
              </span>

              <span
                className="meta ml-auto"
                style={{ color: "var(--accent-dim)" }}
              >
                ↑ Press the screen to enter · scroll for the work
              </span>
            </motion.div>
          </motion.footer>
        </div>

        {/* ══ the page ══════════════════════════════════════════ */}
        {!pushing && (
          <div className="paper relative">
            {/* the seam: the room's light spills onto the first inch of paper */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-40"
              style={{
                background:
                  "linear-gradient(180deg, rgba(224,90,36,0.1), rgba(224,90,36,0) 78%)",
              }}
            />
            <Intro still={still} />
            <Work still={still} />
            <Toolkit still={still} />
            <Background still={still} />
            <Contact still={still} />
          </div>
        )}
      </div>

      <Console still={still} onBoot={bootFromConsole} />
      <AnimatePresence>
        {greeting && <GreetingIntro onDone={finishGreeting} />}
      </AnimatePresence>
    </div>
  );
}
