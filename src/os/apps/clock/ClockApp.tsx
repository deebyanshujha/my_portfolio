import { useMemo } from "react";
import type { AppProps } from "../../kernel/appRegistry";
import { useNow } from "../../shell/systemStatus";
import { prefersStill, useSettings } from "../../kernel/settingsStore";
import { AppFrame, Label } from "../../shell/ApplicationShell";

/**
 * Clock.
 *
 * The digital read-out is the primary display; the dial beside it is there
 * because a clock face communicates *where you are in the hour* at a glance in
 * a way that digits never do. Both are driven by the same tick.
 *
 * The tick lives in `useNow`, which schedules each update onto the next real
 * second boundary and resyncs on visibility — so the seconds change when the
 * second changes, and a window that was minimised (or a tab that was
 * backgrounded and throttled) shows the true time the moment it comes back
 * rather than resuming from wherever it had counted to.
 */

const pad = (n: number) => String(n).padStart(2, "0");

export default function ClockApp({ focused }: AppProps) {
  const now = useNow(1000);
  const settings = useSettings();
  const still = prefersStill(settings);

  const zone = useMemo(() => {
    const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
    // "India Standard Time" rather than "Asia/Calcutta" — the IANA id is an
    // implementation detail, and some of them are decades out of date
    const long = new Intl.DateTimeFormat(undefined, { timeZoneName: "long" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value;
    // the offset the browser reports is minutes *behind* UTC, hence the flip
    const offset = -new Date().getTimezoneOffset();
    const sign = offset < 0 ? "-" : "+";
    const abs = Math.abs(offset);
    return {
      name: long ?? (timeZone ?? "Local").replace(/_/g, " "),
      id: timeZone ?? "Local",
      utc: `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`,
    };
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  // a 12-hour read-out where the locale asks for one, without losing the
  // 24-hour clock the dial is drawn from
  const hour12 = useMemo(
    () => !!Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hour12,
    [],
  );
  const displayHour = hour12 ? h % 12 || 12 : h;
  const meridiem = h < 12 ? "AM" : "PM";

  // fractional positions so the hands sit between marks like a real movement
  const secondAngle = s * 6;
  const minuteAngle = m * 6 + s * 0.1;
  const hourAngle = (h % 12) * 30 + m * 0.5;

  return (
    <AppFrame>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-7 overflow-auto p-6 sm:flex-row sm:gap-10">
        {/* ── the dial ──────────────────────────────────────── */}
        <Dial
          hourAngle={hourAngle}
          minuteAngle={minuteAngle}
          secondAngle={secondAngle}
          sweeping={focused && !still}
        />

        {/* ── the read-out ──────────────────────────────────── */}
        <div className="min-w-0 text-center sm:text-left">
          <Label>{zone.name}</Label>

          <div className="mt-2 flex items-baseline justify-center gap-1.5 sm:justify-start">
            <time
              dateTime={now.toISOString()}
              className="font-display font-bold tabular-nums"
              style={{
                fontSize: "clamp(2.6rem, 8vw, 4rem)",
                letterSpacing: "-0.045em",
                lineHeight: 0.9,
                color: "var(--ink)",
              }}
            >
              {hour12 ? displayHour : pad(displayHour)}
              <span style={{ color: "var(--ink-4)" }}>:</span>
              {pad(m)}
            </time>
            <span
              className="font-display font-bold tabular-nums"
              style={{
                fontSize: "clamp(1.1rem, 3vw, 1.5rem)",
                letterSpacing: "-0.02em",
                color: "var(--accent)",
              }}
              aria-label={`${s} seconds`}
            >
              {pad(s)}
            </span>
            {hour12 && (
              <span className="meta ml-1" style={{ color: "var(--ink-3)" }}>
                {meridiem}
              </span>
            )}
          </div>

          <div
            className="mt-3 text-[14px]"
            style={{ color: "var(--ink-2)", letterSpacing: "-0.005em" }}
          >
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

          <div
            className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1.5 border-t pt-3 sm:justify-start"
            style={{ borderColor: "var(--hair)" }}
          >
            <Reading label="Zone" value={`${zone.id} · ${zone.utc}`} />
            <Reading label="24-hour" value={`${pad(h)}:${pad(m)}:${pad(s)}`} />
            <Reading
              label="UTC"
              value={`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`}
            />
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="meta" style={{ color: "var(--ink-4)" }}>
        {label}
      </div>
      <div className="mt-0.5 text-[12px] tabular-nums" style={{ color: "var(--ink-2)" }}>
        {value}
      </div>
    </div>
  );
}

/**
 * The face. Drawn on the same 1.6px monoline language as the dock glyph so the
 * application and its icon are visibly the same object, with the hour marks
 * weighted heavier than the minute ticks the way a printed dial is.
 */
function Dial({
  hourAngle,
  minuteAngle,
  secondAngle,
  sweeping,
}: {
  hourAngle: number;
  minuteAngle: number;
  secondAngle: number;
  sweeping: boolean;
}) {
  const ticks = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        i,
        hour: i % 5 === 0,
      })),
    [],
  );

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-hidden
      style={{ width: "min(200px, 42vh)", height: "min(200px, 42vh)", flexShrink: 0 }}
    >
      {/* the case */}
      <circle cx="100" cy="100" r="94" fill="rgba(255,255,255,0.022)" />
      <circle cx="100" cy="100" r="94" stroke="var(--hair-strong)" strokeWidth="1.6" fill="none" />
      {/* light from the upper left, matching every other surface in the system */}
      <path
        d="M35 41a94 94 0 0 0-28 52"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {ticks.map(({ i, hour }) => (
        <line
          key={i}
          x1="100"
          y1={hour ? 16 : 18}
          x2="100"
          y2={hour ? 27 : 22}
          stroke={hour ? "var(--ink-3)" : "var(--ink-4)"}
          strokeWidth={hour ? 2 : 1}
          strokeLinecap="round"
          transform={`rotate(${i * 6} 100 100)`}
        />
      ))}

      {/* hour */}
      <line
        x1="100"
        y1="112"
        x2="100"
        y2="54"
        stroke="var(--ink)"
        strokeWidth="5.5"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 100 100)`}
      />
      {/* minute */}
      <line
        x1="100"
        y1="116"
        x2="100"
        y2="32"
        stroke="var(--ink-2)"
        strokeWidth="3.5"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 100 100)`}
      />
      {/* second — the only warm element, as on the landing page */}
      <line
        x1="100"
        y1="122"
        x2="100"
        y2="26"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
        transform={`rotate(${secondAngle} 100 100)`}
        style={
          // eased so the hand steps like a quartz movement rather than snapping;
          // suppressed at 0° or it would wind all the way back anticlockwise
          sweeping && secondAngle !== 0
            ? { transition: "transform 120ms cubic-bezier(0.34, 1.4, 0.64, 1)" }
            : undefined
        }
      />
      <circle cx="100" cy="100" r="5" fill="var(--ink)" />
      <circle cx="100" cy="100" r="2" fill="var(--accent)" />
    </svg>
  );
}
