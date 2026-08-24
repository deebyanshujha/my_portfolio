import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useStage } from "../stage/StageProvider";
import { SystemMark } from "./AppGlyph";
import { audio } from "../kernel/audio";
import { prefersStill, useSettings } from "../kernel/settingsStore";

const LINES = [
  { label: "Kernel loaded", detail: "dos/core" },
  { label: "Runtime initialised", detail: "react 18 · vite 6" },
  { label: "Developer environment loaded", detail: "vellore, in" },
  { label: "Projects mounted", detail: "3 volumes" },
  { label: "Git repository connected", detail: "deebyanshujha" },
  { label: "Terminal ready", detail: "type `help`" },
];

const STEP = 175;
const LEAD = 320;

export function BootSequence({ short }: { short: boolean }) {
  const { finishBoot, skip } = useStage();
  const settings = useSettings();
  const still = prefersStill(settings);
  const [shown, setShown] = useState(0);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);

  const total = useMemo(
    () => (short || still ? 620 : LEAD + LINES.length * STEP + 620),
    [short, still],
  );

  useEffect(() => {
    if (settings.soundEnabled) audio.sfx("boot");
  }, [settings.soundEnabled]);

  useEffect(() => {
    const timers: number[] = [];
    if (!short && !still) {
      LINES.forEach((_, i) => {
        timers.push(window.setTimeout(() => setShown(i + 1), LEAD + i * STEP));
      });
      timers.push(
        window.setTimeout(() => setReady(true), LEAD + LINES.length * STEP + 90),
      );
    } else {
      setShown(LINES.length);
      timers.push(window.setTimeout(() => setReady(true), 220));
    }
    timers.push(window.setTimeout(() => setFlash(true), total - 260));
    timers.push(window.setTimeout(finishBoot, total));
    return () => timers.forEach(window.clearTimeout);
  }, [finishBoot, short, still, total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [skip]);

  return (
    <div
      className="grain absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 30%, #14120e 0%, #0a0a0b 55%, #060607 100%)",
      }}
      role="status"
      aria-live="polite"
      aria-label="System initialising"
    >
      <div className="flex h-full flex-col justify-center px-[clamp(1.5rem,8vw,7rem)]">
        <div className="w-full max-w-[520px]">
          {/* the mark, drawn as a hairline */}
          <motion.div
            style={{ color: "var(--ink)" }}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <SystemMark size={40} drawn />
          </motion.div>

          <div className="meta mt-5" style={{ color: "var(--ink-2)" }}>
            System initialising
          </div>

          {/* progress rule */}
          <div className="relative mt-3 h-px w-full" style={{ background: "var(--hair)" }}>
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{ background: "var(--accent)" }}
              initial={{ width: "0%" }}
              animate={{ width: `${(shown / LINES.length) * 100}%` }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            />
          </div>

          <ul className="mt-6 space-y-[7px]">
            {LINES.map((line, i) => (
              <motion.li
                key={line.label}
                className="flex items-baseline gap-3 font-mono text-[11px] tracking-[0.06em]"
                initial={{ opacity: 0, y: 6 }}
                animate={i < shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <span style={{ color: "var(--accent-dim)" }}>[ OK ]</span>
                <span style={{ color: "var(--ink-2)" }}>{line.label}</span>
                <span className="ml-auto" style={{ color: "var(--ink-4)" }}>
                  {line.detail}
                </span>
              </motion.li>
            ))}
          </ul>

          <motion.div
            className="mt-8 font-display text-[13px] font-bold"
            style={{ letterSpacing: "0.34em", color: "var(--accent)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            SYSTEM READY
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-[clamp(1.5rem,8vw,7rem)] pb-6">
        <span className="meta" style={{ color: "var(--ink-4)" }}>
          DOS · Deebyanshu Jha
        </span>
        <button
          ref={skipRef}
          type="button"
          onClick={skip}
          className="meta rounded-full border px-3 py-1.5 transition-colors hover:text-[var(--ink)]"
          style={{ borderColor: "var(--hair)", color: "var(--ink-3)" }}
        >
          Skip
        </button>
      </div>

      {/* white-point flash into the desktop */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "#f6f3ec" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: flash && !still ? 0.14 : 0 }}
        transition={{ duration: 0.26 }}
      />
    </div>
  );
}
