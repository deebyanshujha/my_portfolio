import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ALL_APPS, APPS, launch, type AppId } from "../kernel/appRegistry";
import { windowStore } from "../kernel/windowStore";
import { musicStore } from "../kernel/musicStore";
import { useStage } from "../stage/StageProvider";
import { AppGlyph } from "./AppGlyph";
import { profile, projects } from "../../data/profile";

/**
 * Asks the desktop to toggle Spotlight.
 *
 * Spotlight's open state belongs to <Desktop/> and the menu bar is its
 * sibling, so the two talk through one event rather than lifting the state or
 * drilling a prop through the bar. It lives here rather than in Desktop so the
 * menu bar can name it without the two importing each other.
 */
export const SPOTLIGHT_EVENT = "dos:spotlight";

/**
 * Spotlight.
 *
 * One field over everything, opened with Ctrl/⌘+Space. It searches what the
 * system actually contains — the applications, the real projects, the desktop
 * files, the outbound links and a handful of system actions — and every result
 * performs the thing it names. There is nothing in here that only looks
 * searchable.
 *
 * Matching is a scored subsequence: an exact prefix beats a word prefix beats
 * scattered letters, so "pr" finds Projects before Terminal and "chn" still
 * finds ChatterNet. Shorter names win ties, which is what makes single letters
 * behave.
 */

type Result = {
  id: string;
  title: string;
  subtitle: string;
  group: "Applications" | "Projects" | "Files" | "Links" | "System";
  /** extra words that should match but are not displayed */
  keywords?: string;
  appId?: AppId;
  run: () => void;
};

/* ── scoring ─────────────────────────────────────────────────────── */

function score(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (!n) return 1;
  if (h === n) return 1000;
  if (h.startsWith(n)) return 800 - h.length;
  // a prefix of any word: "chat" in "Multi-Client TCP Chat Server"
  if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(h)) return 600 - h.length;
  if (h.includes(n)) return 400 - h.length;

  // scattered letters, in order — contiguous runs score higher
  let i = 0;
  let hits = 0;
  let run = 0;
  let best = 0;
  for (const ch of h) {
    if (i < n.length && ch === n[i]) {
      i++;
      hits++;
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  if (i < n.length) return 0;
  return 120 + hits * 4 + best * 6 - h.length * 0.5;
}

export function Spotlight({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { sleep, restart } = useStage();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const open = (fn: () => void) => {
    fn();
    onClose();
  };

  const external = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

  const catalogue = useMemo<Result[]>(() => {
    const apps: Result[] = ALL_APPS.map((id) => ({
      id: `app:${id}`,
      title: APPS[id].name,
      subtitle: APPS[id].blurb,
      group: "Applications",
      appId: id,
      run: () => launch(id),
    }));

    const work: Result[] = projects.map((p) => ({
      id: `project:${p.id}`,
      title: p.title,
      subtitle: `${p.category} · ${p.subtitle}`,
      group: "Projects",
      keywords: p.techStack.join(" "),
      appId: "projects",
      run: () => launch("projects", { select: p.id }),
    }));

    const files: Result[] = [
      {
        id: "file:resume",
        title: "Resume.pdf",
        subtitle: "The document, viewable and downloadable",
        group: "Files",
        appId: "resume",
        run: () => launch("resume"),
      },
      {
        id: "file:lamb",
        title: "fib.lamb",
        subtitle: "Lamb source — opens in the Terminal",
        group: "Files",
        keywords: "interpreter repl fibonacci",
        appId: "terminal",
        run: () => launch("terminal", { boot: "lamb-file" }),
      },
    ];

    const links: Result[] = [
      {
        id: "link:github",
        title: "GitHub",
        subtitle: profile.github.replace("https://", ""),
        group: "Links",
        run: () => external(profile.github),
      },
      {
        id: "link:linkedin",
        title: "LinkedIn",
        subtitle: profile.linkedin.replace("https://www.", ""),
        group: "Links",
        run: () => external(profile.linkedin),
      },
      {
        id: "link:email",
        title: "Email",
        subtitle: profile.email,
        group: "Links",
        keywords: "contact mail",
        run: () => external(`mailto:${profile.email}`),
      },
    ];

    const system: Result[] = [
      {
        id: "sys:play",
        title: "Play / Pause",
        subtitle: "Toggle the transport",
        group: "System",
        keywords: "music signal spotify",
        run: () => musicStore.toggle(),
      },
      {
        id: "sys:tidy",
        title: "Tidy Windows",
        subtitle: "Bring every window back on screen",
        group: "System",
        run: () => windowStore.reflow(),
      },
      {
        id: "sys:close",
        title: "Close All Windows",
        subtitle: "Clear the desktop",
        group: "System",
        run: () => windowStore.reset(),
      },
      {
        id: "sys:restart",
        title: "Restart System",
        subtitle: "Replay the boot sequence",
        group: "System",
        run: () => restart(),
      },
      {
        id: "sys:sleep",
        title: "Sleep",
        subtitle: "Back to the landing page",
        group: "System",
        keywords: "exit landing shutdown",
        run: () => sleep(),
      },
    ];

    return [...apps, ...work, ...files, ...links, ...system];
  }, [restart, sleep]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) {
      // the resting state is the applications, in dock order
      return catalogue.filter((r) => r.group === "Applications");
    }
    return catalogue
      .map((r) => {
        const best = Math.max(
          score(r.title, q),
          score(r.subtitle, q) * 0.45,
          r.keywords ? score(r.keywords, q) * 0.4 : 0,
        );
        return { r, best };
      })
      .filter((x) => x.best > 0)
      .sort((a, b) => b.best - a.best)
      .slice(0, 9)
      .map((x) => x.r);
  }, [catalogue, query]);

  // any change to the result set puts the cursor back on the best match
  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) open(hit.run);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <motion.div
      data-overlay
      className="fixed inset-0 z-overlay flex justify-center px-4 pt-[14vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "rgba(4,5,8,0.42)", backdropFilter: "blur(2px)" }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Spotlight search"
        className="popover relative h-fit w-full max-w-[560px] overflow-hidden rounded-[16px] border"
        style={{
          borderColor: "var(--win-border)",
          boxShadow: "0 40px 100px -24px rgba(0,0,0,0.92), inset 0 1px 0 var(--win-highlight)",
        }}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.985 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── the field ─────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 border-b px-4"
          style={{ borderColor: "var(--hair)" }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            style={{ color: "var(--ink-3)", flexShrink: 0 }}
            aria-hidden
          >
            <circle cx="7.8" cy="7.8" r="5.3" />
            <path d="m11.8 11.8 3.7 3.7" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            type="text"
            role="combobox"
            aria-expanded
            aria-controls="spotlight-results"
            aria-activedescendant={results[active] ? `spotlight-${results[active].id}` : undefined}
            aria-label="Search applications, projects and system actions"
            placeholder="Search DOS"
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent py-4 text-[17px] outline-none placeholder:text-[var(--ink-4)]"
            style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}
          />
          <kbd className="meta shrink-0" style={{ color: "var(--ink-4)" }}>
            esc
          </kbd>
        </div>

        {/* ── the results ───────────────────────────────────── */}
        <div
          ref={listRef}
          id="spotlight-results"
          role="listbox"
          aria-label="Results"
          className="scroll-thin max-h-[46vh] overflow-y-auto p-1.5"
        >
          {results.length === 0 && (
            <div className="px-3 py-6 text-center">
              <div className="text-[13px]" style={{ color: "var(--ink-2)" }}>
                Nothing matches “{query}”
              </div>
              <div className="meta mt-1.5" style={{ color: "var(--ink-4)" }}>
                Try an application, a project, or “sleep”
              </div>
            </div>
          )}

          {results.map((r, i) => {
            const heading = r.group !== lastGroup ? r.group : null;
            lastGroup = r.group;
            const isActive = i === active;
            return (
              <div key={r.id}>
                {heading && (
                  <div className="meta px-2.5 pb-1 pt-2" style={{ color: "var(--ink-4)" }}>
                    {heading}
                  </div>
                )}
                <button
                  type="button"
                  id={`spotlight-${r.id}`}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => open(r.run)}
                  className="flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left"
                  style={{ background: isActive ? "rgba(255,255,255,0.09)" : "transparent" }}
                >
                  <ResultIcon result={r} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px]" style={{ color: "var(--ink)" }}>
                      {r.title}
                    </span>
                    <span
                      className="block truncate text-[11.5px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {r.subtitle}
                    </span>
                  </span>
                  {isActive && (
                    <kbd className="meta shrink-0" style={{ color: "var(--ink-4)" }}>
                      ↵
                    </kbd>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** An app tile where the result belongs to one, a neutral mark otherwise. */
function ResultIcon({ result }: { result: Result }) {
  if (result.appId) {
    const app = APPS[result.appId];
    return (
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] border"
        style={{
          color: "#fff",
          borderColor: "rgba(255,255,255,0.14)",
          backgroundColor: app.tint,
          backgroundImage:
            "linear-gradient(158deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 38%, rgba(0,0,0,0.10) 62%, rgba(0,0,0,0.26) 100%)",
        }}
      >
        <span className="scale-[0.62]">
          <AppGlyph id={result.appId} />
        </span>
      </span>
    );
  }
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] border"
      style={{
        borderColor: "var(--hair)",
        background: "rgba(255,255,255,0.05)",
        color: "var(--ink-3)",
      }}
      aria-hidden
    >
      {result.group === "Links" ? (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 9.5 13 3M9.5 3H13v3.5" />
          <path d="M13 10v2.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5H6" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="2.4" />
          <path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3" opacity="0.7" />
        </svg>
      )}
    </span>
  );
}
