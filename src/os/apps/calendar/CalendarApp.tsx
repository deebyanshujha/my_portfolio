import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import { useNow } from "../../shell/systemStatus";
import { AppFrame, AppToolbar, Label, ToolbarButton } from "../../shell/ApplicationShell";

/**
 * Calendar.
 *
 * A real month grid, not a picture of one: the weeks are computed from the
 * actual civil calendar, the week starts on the locale's own first day, today
 * is derived from the live clock rather than from a render-time snapshot, and
 * the inspector shows facts about the selected date that are calculated, never
 * stored. There are no events in here, because there is no event store — an
 * empty agenda pane would be a promise the system cannot keep.
 */

const MS_DAY = 86_400_000;

/** Midnight, local time — the only sane anchor for whole-day arithmetic. */
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * The first day of the week for the current locale — Monday across most of the
 * world, Sunday in the US and a handful of others. Chromium exposes it; where
 * it does not, Monday is the ISO default.
 */
function firstWeekday(): number {
  type WeekInfoLocale = Intl.Locale & {
    weekInfo?: { firstDay: number };
    getWeekInfo?: () => { firstDay: number };
  };
  try {
    const locale = new Intl.Locale(navigator.language) as WeekInfoLocale;
    const info = locale.getWeekInfo?.() ?? locale.weekInfo;
    // the spec numbers Monday 1 … Sunday 7; JS Date numbers Sunday 0 … Saturday 6
    if (info?.firstDay) return info.firstDay % 7;
  } catch {
    /* fall through */
  }
  return 1;
}

/** ISO-8601 week number: the week containing the year's first Thursday is 1. */
function isoWeek(date: Date): number {
  const d = startOfDay(date);
  // shift to the Thursday of this ISO week
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * MS_DAY));
}

const dayOfYear = (d: Date) =>
  Math.round((startOfDay(d).getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / MS_DAY) + 1;

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** "Today", "Tomorrow", "12 days from now", "3 days ago". */
function relative(target: Date, today: Date): string {
  const days = Math.round((startOfDay(target).getTime() - startOfDay(today).getTime()) / MS_DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `${days} days from now` : `${-days} days ago`;
}

export default function CalendarApp({ windowId }: AppProps) {
  // the live clock, so a window left open overnight rolls "today" forward
  const today = useNow(60_000);
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const gridRef = useRef<HTMLDivElement>(null);
  const weekStart = useMemo(firstWeekday, []);

  const goToday = useCallback(() => {
    const now = startOfDay(new Date());
    setCursor(now);
    setSelected(now);
  }, []);

  useAppCommand(windowId, (command) => {
    if (command === "today") goToday();
    if (command === "prev-month") setCursor((c) => addMonths(c, -1));
    if (command === "next-month") setCursor((c) => addMonths(c, 1));
  });

  /* the grid: whole weeks, padded from the previous and next months */
  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const lead = (first.getDay() - weekStart + 7) % 7;
    const start = addDays(first, -lead);
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)),
    );
  }, [cursor, weekStart]);

  const weekdayNames = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
    // 4 Jan 1970 was a Sunday, which makes the offset arithmetic trivial
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(Date.UTC(1970, 0, 4 + ((weekStart + i) % 7)))),
    );
  }, [weekStart]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  /* arrow keys walk the grid the way a date picker should */
  const onGridKey = (e: React.KeyboardEvent) => {
    const step =
      e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? 7 : e.key === "ArrowUp" ? -7 : 0;
    if (step) {
      e.preventDefault();
      const next = addDays(selected, step);
      setSelected(next);
      if (next.getMonth() !== cursor.getMonth() || next.getFullYear() !== cursor.getFullYear()) {
        setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
      }
      return;
    }
    if (e.key === "PageUp") {
      e.preventDefault();
      setCursor((c) => addMonths(c, -1));
    }
    if (e.key === "PageDown") {
      e.preventDefault();
      setCursor((c) => addMonths(c, 1));
    }
    if (e.key === "Home") {
      e.preventDefault();
      goToday();
    }
  };

  // keep the roving focus on the selected cell so the keyboard walk is visible
  useEffect(() => {
    const cell = gridRef.current?.querySelector<HTMLButtonElement>('[data-selected="true"]');
    if (cell && gridRef.current?.contains(document.activeElement)) cell.focus();
  }, [selected]);

  const details: [string, string][] = [
    ["Weekday", selected.toLocaleDateString(undefined, { weekday: "long" })],
    ["ISO date", iso(selected)],
    ["Week", `W${String(isoWeek(selected)).padStart(2, "0")} of ${selected.getFullYear()}`],
    ["Day of year", `${dayOfYear(selected)} of ${dayOfYear(new Date(selected.getFullYear(), 11, 31))}`],
    ["Relative", relative(selected, today)],
  ];

  return (
    <AppFrame>
      <AppToolbar>
        <ToolbarButton label="Previous month" onClick={() => setCursor(addMonths(cursor, -1))}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3.5 5.5 8l4.5 4.5" />
          </svg>
        </ToolbarButton>
        <ToolbarButton label="Next month" onClick={() => setCursor(addMonths(cursor, 1))}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3.5 10.5 8 6 12.5" />
          </svg>
        </ToolbarButton>

        <h2
          className="font-display m-0 ml-1 text-[15px] font-semibold"
          style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}
          aria-live="polite"
        >
          {monthLabel}
        </h2>

        <button
          type="button"
          onClick={goToday}
          className="meta ml-auto rounded-md border px-2.5 py-1.5 transition-colors hover:text-[var(--ink)]"
          style={{ borderColor: "var(--hair)", color: "var(--ink-3)" }}
        >
          Today
        </button>
      </AppToolbar>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 md:flex-row md:gap-4 md:overflow-hidden">
        {/* ── the month ─────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid grid-cols-7 gap-1 pb-1.5">
            {weekdayNames.map((name) => (
              <div key={name} className="meta text-center" style={{ color: "var(--ink-4)" }}>
                {name}
              </div>
            ))}
          </div>

          <div
            ref={gridRef}
            role="grid"
            aria-label={monthLabel}
            onKeyDown={onGridKey}
            className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-1"
          >
            {weeks.flat().map((day) => {
              const outside = day.getMonth() !== cursor.getMonth();
              const isToday = sameDay(day, today);
              const isSelected = sameDay(day, selected);
              return (
                <button
                  key={day.getTime()}
                  type="button"
                  role="gridcell"
                  data-selected={isSelected}
                  data-today={isToday}
                  tabIndex={isSelected ? 0 : -1}
                  aria-selected={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={day.toLocaleDateString(undefined, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  onClick={() => {
                    setSelected(day);
                    if (outside) setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
                  }}
                  className={`relative grid min-h-[38px] place-items-center rounded-lg text-[13px] tabular-nums transition-colors ${
                    isToday ? "" : "hover:bg-[rgba(255,255,255,0.06)]"
                  }`}
                  style={{
                    // today is a filled disc; selection is a ring, so a
                    // selected today can show both without competing
                    background: isToday
                      ? "var(--accent)"
                      : isSelected
                        ? "rgba(255,255,255,0.07)"
                        : "transparent",
                    boxShadow: isSelected ? "inset 0 0 0 1px var(--accent-dim)" : "none",
                    color: isToday
                      ? "var(--accent-ink)"
                      : outside
                        ? "var(--ink-4)"
                        : isSelected
                          ? "var(--ink)"
                          : "var(--ink-2)",
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── the selected date ─────────────────────────────── */}
        <aside
          className="mt-4 shrink-0 rounded-xl border p-4 md:mt-0 md:w-[228px]"
          style={{ borderColor: "var(--hair)", background: "rgba(0,0,0,0.18)" }}
        >
          <Label>Selected</Label>
          <div
            className="font-display mt-2 text-[38px] font-bold leading-none tabular-nums"
            style={{ letterSpacing: "-0.04em", color: "var(--ink)" }}
          >
            {selected.getDate()}
          </div>
          <div className="mt-1.5 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
            {selected.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </div>

          <dl className="m-0 mt-4 flex flex-col gap-2.5">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="meta" style={{ color: "var(--ink-4)" }}>
                  {label}
                </dt>
                <dd className="m-0 mt-0.5 text-[12px]" style={{ color: "var(--ink-2)" }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="meta mt-4 leading-relaxed" style={{ color: "var(--ink-4)" }}>
            No calendar is connected, so there is nothing scheduled to show.
          </p>
        </aside>
      </div>
    </AppFrame>
  );
}
