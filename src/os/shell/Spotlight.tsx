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
 * The shape is macOS's: a single wide slab of vibrant glass hanging in the
 * upper third of the screen, an oversized field with no chrome of its own, and
 * a preview column that describes whatever the cursor is on. The preview is
 * what makes it feel like a finder rather than a menu — it means arrowing
 * through results *tells you something*, so the keyboard is a real way to
 * browse the system and not just a faster way to click.
 *
 * Matching is a scored subsequence: an exact prefix beats a word prefix beats
 * scattered letters, so "pr" finds Projects before Terminal and "chn" still
 * finds ChatterNet. Shorter names win ties, which is what makes single letters
 * behave.
 */

type Group = "Applications" | "Projects" | "Files" | "Links" | "System";

type Result = {
  id: string;
  title: string;
  subtitle: string;
  group: Group;
  /** extra words that should match but are not displayed */
  keywords?: string;
  appId?: AppId;
  /** the preview column: a paragraph, then labelled rows */
  blurb?: string;
  detail?: { label: string; value: string }[];
  /** what Return will do, in words */
  action: string;
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
      blurb: APPS[id].blurb,
      detail: [{ label: "Kind", value: "Application" }],
      action: "Open",
      run: () => launch(id),
    }));

    const work: Result[] = projects.map((p) => ({
      id: `project:${p.id}`,
      title: p.title,
      subtitle: `${p.category} · ${p.subtitle}`,
      group: "Projects",
      keywords: p.techStack.join(" "),
      appId: "projects",
      blurb: p.description,
      detail: [
        { label: "Category", value: p.category },
        { label: "Stack", value: p.techStack.join(", ") },
      ],
      action: "Open in Projects",
      run: () => launch("projects", { select: p.id }),
    }));

    const files: Result[] = [
      {
        id: "file:resume",
        title: "Resume.pdf",
        subtitle: "The document, viewable and downloadable",
        group: "Files",
        appId: "resume",
        blurb: `${profile.name} — ${profile.title}. The same document a recruiter would be sent, readable here and downloadable as a PDF.`,
        detail: [
          { label: "Kind", value: "PDF document" },
          { label: "Opens in", value: "Resume" },
        ],
        action: "Open",
        run: () => launch("resume"),
      },
      {
        id: "file:lamb",
        title: "fib.lamb",
        subtitle: "Lamb source — opens in the Terminal",
        group: "Files",
        keywords: "interpreter repl fibonacci",
        appId: "terminal",
        blurb:
          "A short program in Lamb, the interpreted language in this portfolio. It runs for real in the Terminal's interpreter.",
        detail: [
          { label: "Kind", value: "Lamb source" },
          { label: "Opens in", value: "Terminal" },
        ],
        action: "Run",
        run: () => launch("terminal", { boot: "lamb-file" }),
      },
    ];

    const links: Result[] = [
      {
        id: "link:github",
        title: "GitHub",
        subtitle: profile.github.replace("https://", ""),
        group: "Links",
        blurb: "Every project in this system, as source.",
        detail: [{ label: "Address", value: profile.github }],
        action: "Open in a new tab",
        run: () => external(profile.github),
      },
      {
        id: "link:linkedin",
        title: "LinkedIn",
        subtitle: profile.linkedin.replace("https://www.", ""),
        group: "Links",
        blurb: "Experience, education and the rest of the professional record.",
        detail: [{ label: "Address", value: profile.linkedin }],
        action: "Open in a new tab",
        run: () => external(profile.linkedin),
      },
      {
        id: "link:email",
        title: "Email",
        subtitle: profile.email,
        group: "Links",
        keywords: "contact mail",
        blurb: "Opens a new message in your mail client.",
        detail: [
          { label: "Address", value: profile.email },
          { label: "Location", value: profile.location },
        ],
        action: "Compose",
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
        blurb: "Starts or stops whatever Signal is playing, without opening it.",
        action: "Toggle",
        run: () => musicStore.toggle(),
      },
      {
        id: "sys:tidy",
        title: "Tidy Windows",
        subtitle: "Bring every window back on screen",
        group: "System",
        blurb: "Pulls any window that has drifted off the edge back into the viewport.",
        action: "Tidy",
        run: () => windowStore.reflow(),
      },
      {
        id: "sys:close",
        title: "Close All Windows",
        subtitle: "Clear the desktop",
        group: "System",
        blurb: "Closes every open window. Nothing is saved anywhere, so nothing is lost.",
        action: "Close all",
        run: () => windowStore.reset(),
      },
      {
        id: "sys:restart",
        title: "Restart System",
        subtitle: "Replay the boot sequence",
        group: "System",
        blurb: "Clears the desktop and plays the boot sequence again from the beginning.",
        action: "Restart",
        run: () => restart(),
      },
      {
        id: "sys:sleep",
        title: "Sleep",
        subtitle: "Back to the landing page",
        group: "System",
        keywords: "exit landing shutdown",
        blurb: "Leaves the desktop and returns to the landing page. The desktop is kept as it is.",
        action: "Sleep",
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

  const selected = results[active] ?? null;
  let lastGroup = "";

  return (
    <motion.div
      data-overlay
      className="fixed inset-0 z-overlay flex justify-center px-4 pt-[13vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "rgba(4,5,8,0.34)", backdropFilter: "blur(3px)" }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Spotlight search"
        className="spotlight-glass relative h-fit w-full max-w-[720px] overflow-hidden rounded-[20px] border"
        style={{
          borderColor: "rgba(255,255,255,0.16)",
          boxShadow:
            "0 60px 130px -30px rgba(0,0,0,0.95), 0 12px 40px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.10)",
        }}
        /* the macOS pop: a short, slightly overshooting spring rather than a
           fade, so it reads as something arriving in front of the desktop */
        initial={{ opacity: 0, y: -14, scale: 0.965 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.975, transition: { duration: 0.12 } }}
        transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.7 }}
      >
        {/* ── the field ─────────────────────────────────────── */}
        <div className="flex items-center gap-3.5 px-5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{ color: "var(--ink-3)", flexShrink: 0 }}
            aria-hidden
          >
            <circle cx="9.5" cy="9.5" r="6.4" />
            <path d="m14.4 14.4 4.4 4.4" />
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
            aria-activedescendant={selected ? `spotlight-${selected.id}` : undefined}
            aria-label="Search applications, projects and system actions"
            placeholder="Spotlight Search"
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent py-[18px] text-[22px] font-light outline-none placeholder:text-[var(--ink-4)]"
            style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}
          />
          <kbd className="meta shrink-0" style={{ color: "var(--ink-4)" }}>
            esc
          </kbd>
        </div>

        {/* Everything below the field only exists when there is something to
            show — an empty Spotlight is a field, not a panel with a hole in it. */}
        {(results.length > 0 || query.trim()) && (
          <div className="flex border-t" style={{ borderColor: "rgba(255,255,255,0.09)" }}>
            {/* ── the results ───────────────────────────────── */}
            <div
              ref={listRef}
              id="spotlight-results"
              role="listbox"
              aria-label="Results"
              className="scroll-thin max-h-[42vh] min-w-0 flex-1 overflow-y-auto p-2"
            >
              {results.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <div className="text-[13.5px]" style={{ color: "var(--ink-2)" }}>
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
                      <div
                        className="meta px-2.5 pb-1 pt-2.5"
                        style={{ color: "var(--ink-4)" }}
                      >
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
                      className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-[7px] text-left"
                      style={{
                        background: isActive ? "rgba(255,255,255,0.13)" : "transparent",
                        boxShadow: isActive ? "inset 0 0 0 1px rgba(255,255,255,0.09)" : "none",
                      }}
                    >
                      <ResultIcon result={r} size={30} />
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[13.5px]"
                          style={{ color: "var(--ink)" }}
                        >
                          {r.title}
                        </span>
                        <span
                          className="block truncate text-[11.5px] leading-tight"
                          style={{ color: "var(--ink-3)" }}
                        >
                          {r.subtitle}
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ── the preview ───────────────────────────────── */}
            {selected && <Preview result={selected} />}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * The right-hand column: what the cursor is currently on, described.
 *
 * Hidden on narrow viewports — below roughly 640px the list itself is the
 * whole panel, and a 200px column beside it would leave neither readable.
 */
function Preview({ result }: { result: Result }) {
  return (
    <div
      className="hidden w-[248px] shrink-0 flex-col border-l px-4 py-5 sm:flex"
      style={{ borderColor: "rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.025)" }}
    >
      <div className="flex flex-col items-center text-center">
        <ResultIcon result={result} size={64} />
        <div
          className="mt-3 text-[14px] font-medium leading-tight"
          style={{ color: "var(--ink)" }}
        >
          {result.title}
        </div>
        <div className="meta mt-1" style={{ color: "var(--ink-4)" }}>
          {result.group}
        </div>
      </div>

      {result.blurb && (
        <p
          className="mt-3.5 text-[11.5px] leading-relaxed"
          style={{ color: "var(--ink-3)" }}
        >
          {result.blurb}
        </p>
      )}

      {result.detail && result.detail.length > 0 && (
        <dl
          className="mt-3.5 space-y-1.5 border-t pt-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {result.detail.map((row) => (
            <div key={row.label} className="flex gap-2 text-[11px] leading-snug">
              <dt className="shrink-0" style={{ color: "var(--ink-4)" }}>
                {row.label}
              </dt>
              <dd className="min-w-0 flex-1 break-words text-right" style={{ color: "var(--ink-2)" }}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div
        className="mt-auto flex items-center justify-center gap-1.5 pt-4 text-[11px]"
        style={{ color: "var(--ink-4)" }}
      >
        <kbd className="meta">↵</kbd>
        <span>{result.action}</span>
      </div>
    </div>
  );
}

/** An app tile where the result belongs to one, a neutral mark otherwise. */
function ResultIcon({ result, size }: { result: Result; size: number }) {
  const radius = Math.round(size * 0.26);

  if (result.appId) {
    const app = APPS[result.appId];
    return (
      <span
        className="grid shrink-0 place-items-center border"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          color: "#fff",
          borderColor: "rgba(255,255,255,0.14)",
          backgroundColor: app.tint,
          backgroundImage:
            "linear-gradient(158deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 38%, rgba(0,0,0,0.10) 62%, rgba(0,0,0,0.26) 100%)",
        }}
      >
        {/* AppGlyph draws at a fixed size, so the tile scales it rather than
            keeping a second copy of every icon at a second size */}
        <span style={{ transform: `scale(${(size / 30) * 0.62})` }}>
          <AppGlyph id={result.appId} />
        </span>
      </span>
    );
  }

  const glyphSize = Math.round(size * 0.5);
  return (
    <span
      className="grid shrink-0 place-items-center border"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        borderColor: "var(--hair)",
        background: "rgba(255,255,255,0.05)",
        color: "var(--ink-3)",
      }}
      aria-hidden
    >
      {result.group === "Links" ? (
        <svg width={glyphSize} height={glyphSize} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 9.5 13 3M9.5 3H13v3.5" />
          <path d="M13 10v2.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5H6" />
        </svg>
      ) : (
        <svg width={glyphSize} height={glyphSize} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="2.4" />
          <path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3" opacity="0.7" />
        </svg>
      )}
    </span>
  );
}
