import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { education, profile, projects, skillGroups } from "../data/profile";

/**
 * The console.
 *
 * Nothing on the page mentions it. It opens on the backtick — the key every
 * developer has pressed in a game to see whether anyone left a console in — and
 * it answers with real data out of `profile.ts`, so exploring it is rewarded
 * with facts rather than a joke.
 *
 * Rules it keeps, so that a hidden thing never becomes an obstacle:
 *  · it never steals a keystroke from a real input, anywhere
 *  · Escape or the × closes it; the backtick only opens
 *  · it is off the tab order and `aria-hidden` while closed
 *  · it never opens on touch, where there is no backtick to press
 */

type Line = { kind: "in" | "out" | "note"; text: string };

const BANNER: Line[] = [
  { kind: "note", text: "DOS 1.0 — console" },
  { kind: "note", text: "type `help` for commands, `exit` to close" },
];

export function Console({ still, onBoot }: { still: boolean; onBoot: () => void }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const say = useCallback(
    (out: string[]) => setLines((l) => [...l, ...out.map((text) => ({ kind: "out" as const, text }))]),
    [],
  );

  const run = useCallback(
    (raw: string) => {
      const cmd = raw.trim();
      if (!cmd) return;
      setLines((l) => [...l, { kind: "in", text: cmd }]);
      setHistory((h) => [cmd, ...h].slice(0, 40));
      setCursor(-1);

      const [name, ...rest] = cmd.toLowerCase().split(/\s+/);
      const arg = rest.join(" ");

      switch (name) {
        case "help":
          say([
            "whoami      who is behind this",
            "projects    what has been built",
            "skills      what it was built with",
            "edu         where the training came from",
            "contact     how to reach him",
            "open <n>    open project n on GitHub",
            "boot        enter the system",
            "clear       wipe the console",
            "exit        close it",
          ]);
          break;
        case "whoami":
          say([profile.name, profile.title, profile.location, "", profile.tagline]);
          break;
        case "projects":
          say(
            projects.flatMap((p, i) => [
              `${String(i + 1).padStart(2, "0")}  ${p.title} — ${p.subtitle}`,
              `    ${p.techStack.join(" · ")}`,
            ]),
          );
          break;
        case "skills":
          say(skillGroups.map((g) => `${g.title.padEnd(24)}${g.skills.join(", ")}`));
          break;
        case "edu":
        case "education":
          say(education.map((e) => `${e.period.padEnd(20)}${e.school} — ${e.result}`));
          break;
        case "contact":
          say([
            `email     ${profile.email}`,
            `github    ${profile.github}`,
            `linkedin  ${profile.linkedin}`,
          ]);
          break;
        case "open": {
          const at = Number.parseInt(arg, 10) - 1;
          const project = projects[at];
          if (!project) {
            say([`no project ${arg || "?"} — try \`projects\``]);
            break;
          }
          say([`opening ${project.title}…`]);
          window.open(project.github, "_blank", "noopener,noreferrer");
          break;
        }
        case "boot":
          say(["booting…"]);
          window.setTimeout(() => {
            setOpen(false);
            onBoot();
          }, 420);
          break;
        case "clear":
          setLines(BANNER);
          break;
        case "exit":
        case "quit":
          setOpen(false);
          break;
        default:
          say([`${name}: not found — try \`help\``]);
      }
    },
    [onBoot, say],
  );

  /* the one key that opens it */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "`" && e.key !== "~") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      // A text field always wins the keystroke — including this console's own,
      // where a backtick is somebody quoting `help`, not asking to close.
      // Escape and the × are how it shuts, which is why neither of those is
      // ambiguous the way a toggle would be.
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines, open]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      run(value);
      setValue("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(cursor + 1, history.length - 1);
      if (next >= 0) {
        setCursor(next);
        setValue(history[next]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = cursor - 1;
      setCursor(next);
      setValue(next >= 0 ? history[next] : "");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-x-0 top-0 z-[60] flex justify-center px-3"
          initial={still ? { opacity: 0 } : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={still ? { opacity: 0 } : { opacity: 0, y: -14 }}
          transition={{ duration: still ? 0.12 : 0.34, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-label="DOS console"
        >
          <div
            className="mt-3 w-full max-w-[680px] overflow-hidden rounded-lg border font-mono shadow-2xl"
            style={{
              borderColor: "var(--hair-strong)",
              background: "rgba(10,10,12,0.93)",
              backdropFilter: "blur(14px)",
            }}
            onClick={() => inputRef.current?.focus()}
          >
            <div
              className="flex items-center gap-2 border-b px-3 py-1.5"
              style={{ borderColor: "var(--hair)" }}
            >
              <span className="text-[10px] tracking-[0.18em]" style={{ color: "var(--accent)" }}>
                ◈ DOS
              </span>
              <span className="text-[10px]" style={{ color: "var(--ink-4)" }}>
                console
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close console"
                className="ml-auto text-[13px] leading-none"
                style={{ color: "var(--ink-4)" }}
              >
                ×
              </button>
            </div>

            <div
              ref={logRef}
              className="scroll-thin max-h-[46vh] overflow-y-auto px-3 py-2 text-[12px] leading-[1.75]"
            >
              {lines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color:
                      line.kind === "in"
                        ? "var(--ink)"
                        : line.kind === "note"
                          ? "var(--accent-dim)"
                          : "var(--ink-2)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {line.kind === "in" ? `> ${line.text}` : line.text}
                </div>
              ))}
            </div>

            <div
              className="flex items-center gap-2 border-t px-3 py-2"
              style={{ borderColor: "var(--hair)" }}
            >
              <span style={{ color: "var(--accent)" }}>{">"}</span>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                spellCheck={false}
                autoComplete="off"
                aria-label="Console input"
                className="w-full bg-transparent text-[12px] outline-none"
                style={{ color: "var(--ink)" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
