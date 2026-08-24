import { useCallback, useEffect, useRef, useState } from "react";
import { launch } from "../kernel/appRegistry";
import { audio } from "../kernel/audio";
import { useSettings } from "../kernel/settingsStore";

type Kind = "volume" | "document" | "source";

type DesktopItem = {
  id: string;
  name: string;
  kind: Kind;
  /** the line a Finder inspector would show under the name */
  meta: string;
  open: () => void;
};

const ITEMS: DesktopItem[] = [
  {
    id: "projects",
    name: "Projects",
    kind: "volume",
    meta: "Volume",
    open: () => launch("projects"),
  },
  {
    id: "resume",
    name: "Resume.pdf",
    kind: "document",
    meta: "PDF document",
    open: () => launch("resume"),
  },
  {
    // an ordinary-looking file that turns out to be a working language REPL
    id: "lamb",
    name: "fib.lamb",
    kind: "source",
    meta: "Lamb source",
    open: () => launch("terminal", { boot: "lamb-file" }),
  },
];

/**
 * The desktop files.
 *
 * Real items, not decoration: click selects, double-click opens, Enter opens
 * the selection, the arrow keys walk the column, and clicking the ground
 * deselects. Each one launches the application that genuinely owns that file.
 *
 * The artwork is drawn at 64px rather than symbol size, with its own gradients,
 * edge lighting and cast shadow, so these read as objects sitting on a desk
 * next to the dock rather than as line icons borrowed from a UI kit.
 */
export function DesktopIcons() {
  const [selected, setSelected] = useState<string | null>(null);
  const settings = useSettings();
  const listRef = useRef<HTMLDivElement>(null);

  const open = useCallback(
    (item: DesktopItem) => {
      if (settings.soundEnabled) audio.sfx("open");
      item.open();
    },
    [settings.soundEnabled],
  );

  // clicking the ground clears the selection, like any desktop
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (listRef.current?.contains(e.target as Node)) return;
      setSelected(null);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  const move = (from: number, delta: number) => {
    const next = ITEMS[(from + delta + ITEMS.length) % ITEMS.length];
    setSelected(next.id);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-item="${next.id}"]`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Desktop items"
      aria-orientation="vertical"
      className="absolute right-3 top-[40px] flex flex-col items-center gap-1.5"
    >
      {ITEMS.map((item, i) => {
        const active = selected === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="option"
            data-item={item.id}
            aria-selected={active}
            aria-label={`${item.name} — ${item.meta}. Double-click or press Enter to open.`}
            title={`${item.name} — double-click to open`}
            onClick={() => setSelected(item.id)}
            onDoubleClick={() => open(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelected(item.id);
                open(item);
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                move(i, 1);
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                move(i, -1);
              }
            }}
            className="group flex w-[104px] flex-col items-center gap-1.5 rounded-xl px-2 pb-1.5 pt-2.5 transition-colors"
            style={{
              background: active ? "rgba(232,184,75,0.15)" : "transparent",
              boxShadow: active ? "inset 0 0 0 1px var(--accent-dim)" : "none",
            }}
          >
            <span
              className="block transition-transform duration-200 group-hover:-translate-y-[2px]"
              style={{
                filter: active
                  ? "drop-shadow(0 6px 14px rgba(232,184,75,0.28)) drop-shadow(0 2px 4px rgba(0,0,0,0.55))"
                  : "drop-shadow(0 5px 12px rgba(0,0,0,0.55))",
              }}
            >
              <ItemArt kind={item.kind} />
            </span>
            <span
              className="max-w-full truncate rounded-[5px] px-1.5 py-[1px] text-[12px] font-medium leading-tight"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "var(--accent-ink)" : "var(--ink)",
                textShadow: active ? "none" : "0 1px 3px rgba(0,0,0,0.95)",
                letterSpacing: "-0.005em",
              }}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── artwork ─────────────────────────────────────────────────────── */

const SIZE = 64;

/**
 * One 64px composition per file type, all lit from the upper-left and built on
 * the same two moves: a body with a vertical gradient, and a bright top edge.
 * Gradient ids are namespaced per kind so several icons can share a document.
 */
function ItemArt({ kind }: { kind: Kind }) {
  if (kind === "volume") return <VolumeArt />;
  return <SheetArt kind={kind} />;
}

function VolumeArt() {
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id="dj-vol-body" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#5A9CFA" />
          <stop offset="52%" stopColor="#3277E8" />
          <stop offset="100%" stopColor="#1F53B8" />
        </linearGradient>
        <linearGradient id="dj-vol-top" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#9FC6FF" />
          <stop offset="100%" stopColor="#4F8DF2" />
        </linearGradient>
      </defs>

      {/* the barrel */}
      <path
        d="M10 18v25c0 4.6 9.8 8.4 22 8.4s22-3.8 22-8.4V18Z"
        fill="url(#dj-vol-body)"
      />
      {/* the seam between platters */}
      <path
        d="M10 30.5c0 4.6 9.8 8.4 22 8.4s22-3.8 22-8.4"
        stroke="rgba(255,255,255,0.26)"
        strokeWidth="1.4"
        fill="none"
      />
      {/* the lit rim down the left */}
      <path
        d="M10.9 20v23"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* the lid */}
      <ellipse cx="32" cy="18" rx="22" ry="8.4" fill="url(#dj-vol-top)" />
      <ellipse
        cx="32"
        cy="18"
        rx="22"
        ry="8.4"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.2"
        fill="none"
      />
      {/* spindle */}
      <ellipse cx="32" cy="18" rx="6.4" ry="2.5" fill="rgba(255,255,255,0.42)" />
      <ellipse cx="32" cy="18" rx="2.4" ry="0.95" fill="rgba(20,42,86,0.55)" />
      {/* the gloss that makes it a solid, not a cylinder outline */}
      <path
        d="M13.5 22.5c2.6 3 8.6 5 14 5.2v20.6c-6-.6-11.4-2.4-14-4.8Z"
        fill="rgba(255,255,255,0.1)"
      />
    </svg>
  );
}

function SheetArt({ kind }: { kind: Kind }) {
  const pdf = kind === "document";
  return (
    <svg width={SIZE} height={SIZE} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`dj-sheet-${kind}`} x1="0.1" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="58%" stopColor="#F1EEE8" />
          <stop offset="100%" stopColor="#DCD7CE" />
        </linearGradient>
        <linearGradient id={`dj-fold-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#CFC9BE" />
          <stop offset="100%" stopColor="#ABA398" />
        </linearGradient>
      </defs>

      {/* the sheet, with the corner turned down */}
      <path
        d="M13 7.5a2.5 2.5 0 0 1 2.5-2.5h21.4L51 19.4V54a2.5 2.5 0 0 1-2.5 2.5h-33A2.5 2.5 0 0 1 13 54Z"
        fill={`url(#dj-sheet-${kind})`}
      />
      <path
        d="M36.9 5 51 19.4H39.4A2.5 2.5 0 0 1 36.9 17Z"
        fill={`url(#dj-fold-${kind})`}
      />
      {/* the paper's own edge highlight */}
      <path
        d="M15.5 6.2h20.6"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {pdf ? (
        <>
          <rect x="19" y="26" width="26" height="9.5" rx="2.4" fill="#E5433C" />
          <text
            x="22"
            y="33.4"
            fill="#fff"
            fontSize="7.4"
            fontWeight="700"
            fontFamily="JetBrains Mono, ui-monospace, monospace"
            letterSpacing="0.5"
          >
            PDF
          </text>
          <path
            d="M20 42h24M20 47.5h16"
            stroke="rgba(22,24,29,0.24)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M25.5 30 19.5 36l6 6M38.5 30l6 6-6 6"
            stroke="#7C4DE0"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M34.6 27.5 29.4 44.5"
            stroke="rgba(124,77,224,0.42)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}

      {/* the sheet lifts very slightly off the desk */}
      <path
        d="M13 51.5h38"
        stroke="rgba(22,24,29,0.07)"
        strokeWidth="1.2"
      />
    </svg>
  );
}
