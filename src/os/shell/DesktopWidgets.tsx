import { useMemo } from "react";
import { launch } from "../kernel/appRegistry";
import { useNow } from "./systemStatus";

/**
 * The widgets column.
 *
 * Two panels pinned to the left edge of the desktop: the time, and the month.
 * They are not decoration — each one is a button onto the application that owns
 * it, so the widget is the way in and the window is the detail view. Both read
 * the same boundary-aligned clock the menu bar and the Clock app use, so
 * nothing on screen can disagree about what time it is.
 *
 * They sit on the desktop plane, beneath the window layer, and take pointer
 * events only on themselves — dragging a window over them, or right-clicking
 * the ground beside them, behaves exactly as before.
 */

const pad = (n: number) => String(n).padStart(2, "0");

function greeting(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Good night";
}

export function DesktopWidgets() {
  return (
    <div
      // the desktop shell itself only renders at 900px and up, so there is no
      // width at which this column would be cramped
      className="pointer-events-none absolute left-4 top-[42px] z-desktop flex w-[248px] flex-col gap-3"
      aria-label="Desktop widgets"
    >
      <ClockWidget />
      <CalendarWidget />
    </div>
  );
}

/* ── shared panel ────────────────────────────────────────────────── */

function Panel({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="glass pointer-events-auto block w-full rounded-[18px] border p-4 text-left transition-colors hover:border-[var(--hair-strong)]"
      style={{
        borderColor: "var(--win-border)",
        boxShadow: "0 18px 44px -20px rgba(0,0,0,0.85), inset 0 1px 0 var(--win-highlight)",
      }}
    >
      {children}
    </button>
  );
}

/* ── the time ────────────────────────────────────────────────────── */

function ClockWidget() {
  const now = useNow(1000);
  const h = now.getHours();

  const hour12 = useMemo(
    () => !!Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12,
    [],
  );
  const shown = hour12 ? h % 12 || 12 : h;

  return (
    <Panel label="Open Clock" onClick={() => launch("clock")}>
      <div className="text-[12.5px]" style={{ color: "var(--ink-2)" }}>
        {greeting(h)}
      </div>

      <div className="mt-1 flex items-baseline gap-1">
        <time
          dateTime={now.toISOString()}
          className="font-display text-[34px] font-bold leading-none tabular-nums"
          style={{ letterSpacing: "-0.045em", color: "var(--ink)" }}
        >
          {hour12 ? shown : pad(shown)}
          <span style={{ color: "var(--ink-4)" }}>:</span>
          {pad(now.getMinutes())}
        </time>
        {hour12 ? (
          <span className="meta" style={{ color: "var(--ink-3)" }}>
            {h < 12 ? "AM" : "PM"}
          </span>
        ) : (
          // a 24-hour locale has no meridiem to show, so the slot carries the
          // seconds instead — same treatment as the Clock app gives them
          <span
            className="font-display text-[15px] font-bold tabular-nums"
            style={{ letterSpacing: "-0.02em", color: "var(--accent)" }}
          >
            {pad(now.getSeconds())}
          </span>
        )}
      </div>

      <div className="mt-2 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
        {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </div>
    </Panel>
  );
}

/* ── the month ───────────────────────────────────────────────────── */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function CalendarWidget() {
  // a minute is fine here: the grid only changes at midnight
  const today = useNow(60_000);

  const { weeks, weekdays } = useMemo(() => {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    // the widget follows the locale's own first day, as the Calendar app does
    let weekStart = 1;
    try {
      type WeekInfoLocale = Intl.Locale & {
        weekInfo?: { firstDay: number };
        getWeekInfo?: () => { firstDay: number };
      };
      const locale = new Intl.Locale(navigator.language) as WeekInfoLocale;
      const info = locale.getWeekInfo?.() ?? locale.weekInfo;
      if (info?.firstDay) weekStart = info.firstDay % 7;
    } catch {
      /* ISO default */
    }

    const lead = (first.getDay() - weekStart + 7) % 7;
    const total = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: total }, (_, i) => i + 1),
    ];
    while (cells.length % 7) cells.push(null);

    const narrow = new Intl.DateTimeFormat(undefined, { weekday: "narrow" });
    return {
      weeks: Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7)),
      // 4 Jan 1970 was a Sunday, which makes the offset arithmetic trivial
      weekdays: Array.from({ length: 7 }, (_, i) =>
        narrow.format(new Date(Date.UTC(1970, 0, 4 + ((weekStart + i) % 7)))),
      ),
    };
  }, [today]);

  const date = startOfDay(today).getDate();

  return (
    <Panel label="Open Calendar" onClick={() => launch("calendar")}>
      <div
        className="meta"
        style={{ color: "var(--accent)", letterSpacing: "0.18em" }}
      >
        {today.toLocaleDateString(undefined, { month: "long" })}
      </div>

      <div className="mt-2.5 grid grid-cols-7 gap-y-1 text-center">
        {weekdays.map((d, i) => (
          <span
            key={i}
            className="text-[9.5px] font-medium"
            style={{ color: "var(--ink-4)", letterSpacing: "0.06em" }}
          >
            {d}
          </span>
        ))}

        {weeks.flat().map((day, i) =>
          day === null ? (
            <span key={i} aria-hidden />
          ) : (
            <span key={i} className="grid place-items-center py-[1px]">
              <span
                className="grid h-[19px] w-[19px] place-items-center rounded-full text-[11px] tabular-nums"
                style={
                  day === date
                    ? { background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 700 }
                    : { color: "var(--ink-2)" }
                }
              >
                {day}
              </span>
            </span>
          ),
        )}
      </div>
    </Panel>
  );
}
