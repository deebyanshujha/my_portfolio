/**
 * What is on the machine's screen before you enter it.
 *
 * Not a logo — a miniature of the desktop that is waiting inside, caught
 * mid-initialisation. Menu bar, a half-drawn window, desktop icons, a boot
 * figure and a recovery rail, all of it slightly unwell: bands tear, one
 * element drops out, the tube rolls.
 *
 * The whole thing is static markup driven by CSS keyframes (see index.css).
 * The two `dos-mini-tear` layers are exact copies of the same markup, clipped
 * to a band and displaced for a few frames at a time — that is the tear. No
 * timers, no re-renders, nothing to schedule.
 */

type Props = {
  /** cursor is near the machine, or it has focus */
  lit: boolean;
  /** the screen has been clicked; the system is stabilising */
  woken: boolean;
  /** reduced motion */
  still: boolean;
};

const ICONS = [
  { label: "projects", fill: 0.9 },
  { label: "resume", fill: 0.55 },
  { label: "————", fill: 0.22 },
];

/** the UI, rendered once for real and twice more as clipped tear copies */
function Face({ lit, woken }: { lit: boolean; woken: boolean }) {
  return (
    <div className="dos-mini-ui absolute inset-0 flex flex-col" style={{ textAlign: "left" }}>
      {/* ── menu bar ───────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-[0.9em] px-[0.85em]"
        style={{
          height: "1.85em",
          borderBottom: "1px solid rgba(237,234,228,0.09)",
          background: "rgba(255,255,255,0.045)",
          fontSize: "0.72em",
          letterSpacing: "0.09em",
        }}
      >
        <span style={{ color: "var(--accent)", fontWeight: 700 }}>◈ DOS</span>
        <span style={{ color: "rgba(237,234,228,0.62)" }}>Finder</span>
        <span className="dos-mini-flicker" style={{ color: "rgba(237,234,228,0.4)" }}>
          View
        </span>
        <span style={{ color: "rgba(237,234,228,0.16)" }}>▚▚▚</span>
        <span className="ml-auto" style={{ color: "rgba(237,234,228,0.45)" }}>
          ⌁
        </span>
        <span className="dos-mini-flicker-2" style={{ color: "rgba(237,234,228,0.6)" }}>
          12:41
        </span>
      </div>

      {/* ── desktop ────────────────────────────────────────── */}
      <div className="relative flex-1">
        {/* a window that never finished painting */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: "4.5%",
            top: "9%",
            width: "46%",
            height: "34%",
            borderRadius: "0.35em",
            border: "1px solid rgba(237,234,228,0.11)",
            background: "rgba(18,19,24,0.72)",
            boxShadow: "0 0.6em 1.4em -0.5em rgba(0,0,0,0.8)",
          }}
        >
          <div
            className="flex items-center gap-[0.35em] px-[0.5em]"
            style={{
              height: "1.4em",
              borderBottom: "1px solid rgba(237,234,228,0.08)",
              background: "rgba(255,255,255,0.05)",
            }}
          >
            {[0.34, 0.2, 0.2].map((o, i) => (
              <span
                key={i}
                style={{
                  width: "0.34em",
                  height: "0.34em",
                  borderRadius: "50%",
                  background: `rgba(237,234,228,${o})`,
                }}
              />
            ))}
            <span
              style={{
                marginLeft: "0.4em",
                fontSize: "0.6em",
                letterSpacing: "0.14em",
                color: "rgba(237,234,228,0.42)",
              }}
            >
              PROJECTS
            </span>
          </div>
          {/* sidebar + rows; the last row gave up halfway */}
          <div className="flex gap-[0.55em] p-[0.55em]">
            <div
              className="dos-mini-hide-sm flex flex-col gap-[0.34em]"
              style={{
                width: "26%",
                paddingRight: "0.45em",
                borderRight: "1px solid rgba(237,234,228,0.07)",
              }}
            >
              {[86, 62, 74].map((w, i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    height: "0.26em",
                    width: `${w}%`,
                    borderRadius: "999px",
                    background: `rgba(237,234,228,${i === 0 ? 0.2 : 0.11})`,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-[0.36em]">
              {[92, 68, 80, 44].map((w, i) => (
                <span
                  key={i}
                  style={{
                    display: "block",
                    height: "0.28em",
                    width: `${w}%`,
                    borderRadius: "999px",
                    background:
                      i === 1
                        ? "var(--accent-dim)"
                        : `rgba(237,234,228,${0.17 - i * 0.02})`,
                    opacity: i === 3 ? 0.35 : 1,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* a second window that only got as far as its chrome */}
        <div
          className="dos-mini-hide-sm absolute overflow-hidden"
          style={{
            left: "24%",
            top: "31%",
            width: "38%",
            height: "20%",
            borderRadius: "0.35em",
            border: "1px solid rgba(237,234,228,0.09)",
            background: "rgba(14,15,19,0.78)",
            boxShadow: "0 0.6em 1.4em -0.5em rgba(0,0,0,0.85)",
          }}
        >
          <div
            className="flex items-center gap-[0.35em] px-[0.5em]"
            style={{
              height: "1.3em",
              borderBottom: "1px solid rgba(237,234,228,0.07)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <span
              style={{
                width: "0.3em",
                height: "0.3em",
                borderRadius: "50%",
                background: "rgba(237,234,228,0.22)",
              }}
            />
            <span
              className="dos-mini-flicker"
              style={{
                marginLeft: "0.3em",
                fontSize: "0.56em",
                letterSpacing: "0.14em",
                color: "rgba(237,234,228,0.34)",
              }}
            >
              TERMINAL
            </span>
          </div>
          <div className="px-[0.55em] pt-[0.4em]">
            <span
              style={{
                fontSize: "0.56em",
                letterSpacing: "0.05em",
                color: "var(--accent-dim)",
              }}
            >
              ~ $ mount /projects
            </span>
          </div>
        </div>

        {/* desktop icons, progressively less rendered down the column */}
        <div
          className="absolute flex flex-col items-center gap-[0.75em]"
          style={{ right: "5%", top: "8%" }}
        >
          {ICONS.map((icon, i) => (
            <div
              key={icon.label}
              className={i === 2 ? "dos-mini-flicker-2 text-center" : "text-center"}
              style={{ opacity: icon.fill }}
            >
              <span
                style={{
                  display: "block",
                  width: "1.7em",
                  height: "1.7em",
                  borderRadius: "0.3em",
                  border: "1px solid rgba(237,234,228,0.2)",
                  background:
                    i === 0
                      ? "linear-gradient(150deg, rgba(232,184,75,0.22), rgba(237,234,228,0.05))"
                      : "rgba(237,234,228,0.05)",
                }}
              />
              <span
                className="dos-mini-hide-sm block"
                style={{
                  marginTop: "0.28em",
                  fontSize: "0.55em",
                  letterSpacing: "0.1em",
                  color: "rgba(237,234,228,0.4)",
                }}
              >
                {icon.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── boot figure ──────────────────────────────────── */}
        <div
          className="absolute text-center"
          style={{ left: "50%", bottom: "16%", transform: "translateX(-50%)", width: "62%" }}
        >
          <div className="relative inline-block">
            <span
              className="font-display"
              style={{
                fontSize: "1.12em",
                fontWeight: 800,
                letterSpacing: "0.3em",
                color: "var(--accent)",
                textShadow: "0 0 1.4em var(--accent-glow)",
              }}
            >
              DOS SYSTEM
            </span>
            {/* phosphor ghost */}
            <span
              aria-hidden
              className="dos-mini-ghost font-display absolute left-0 top-0"
              style={{
                fontSize: "1.12em",
                fontWeight: 800,
                letterSpacing: "0.3em",
                color: "var(--accent)",
                opacity: 0,
              }}
            >
              DOS SYSTEM
            </span>
          </div>

          <div
            style={{
              marginTop: "0.3em",
              fontSize: "0.62em",
              letterSpacing: "0.26em",
              color: lit && !woken ? "var(--accent)" : "rgba(237,234,228,0.45)",
              transition: "color .35s ease",
            }}
          >
            {woken ? "STABILISING" : lit ? "PRESS TO ENTER" : "INITIALISING"}
          </div>

          {/* bar + read-out, stepping together */}
          <div className="mt-[0.7em] flex items-center gap-[0.6em]">
            <span
              className="relative block flex-1 overflow-hidden"
              style={{
                height: "0.34em",
                borderRadius: "999px",
                background: "rgba(237,234,228,0.1)",
              }}
            >
              <span
                className="dos-mini-bar absolute inset-0 block"
                style={{
                  borderRadius: "999px",
                  background: "var(--accent)",
                  opacity: 0.85,
                  transform: "scaleX(0.62)",
                }}
              />
            </span>
            <span
              className="block overflow-hidden"
              style={{
                height: "1.35em",
                fontSize: "0.6em",
                letterSpacing: "0.08em",
                color: "rgba(237,234,228,0.62)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span
                className="dos-mini-pct block"
                style={{ transform: "translateY(-25%)", lineHeight: "1.35em" }}
              >
                <span className="block" style={{ height: "1.35em" }}>
                  34%
                </span>
                <span className="block" style={{ height: "1.35em" }}>
                  41%
                </span>
                <span className="block" style={{ height: "1.35em" }}>
                  58%
                </span>
                <span className="block" style={{ height: "1.35em" }}>
                  62%
                </span>
                <span className="block" style={{ height: "1.35em" }}>
                  67%
                </span>
                <span className="block" style={{ height: "1.35em" }}>
                  79%
                </span>
                <span className="block" style={{ height: "1.35em" }}>
                  84%
                </span>
                <span className="block" style={{ height: "1.35em" }}>
                  91%
                </span>
              </span>
            </span>
          </div>
        </div>

        {/* ── recovery rail ────────────────────────────────── */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center gap-[0.9em] px-[0.85em]"
          style={{
            height: "1.5em",
            borderTop: "1px solid rgba(237,234,228,0.07)",
            fontSize: "0.56em",
            letterSpacing: "0.13em",
            color: "rgba(237,234,228,0.34)",
          }}
        >
          <span style={{ color: "var(--accent-dim)" }}>[OK]</span>
          <span>KERNEL</span>
          <span style={{ color: "var(--accent-dim)" }}>[OK]</span>
          <span>PROJECTS</span>
          <span className="dos-mini-flicker">[--]</span>
          <span className="dos-mini-flicker">USER ENV</span>
          <span className="dos-mini-caret ml-auto" style={{ color: "var(--accent)" }}>
            ▌
          </span>
        </div>
      </div>
    </div>
  );
}

export function ScreenFace({ lit, woken, still }: Props) {
  const face = <Face lit={lit} woken={woken} />;

  return (
    <div
      aria-hidden
      data-dos-screen
      className="dos-mini pointer-events-none absolute inset-0 overflow-hidden"
      data-lit={lit ? "true" : "false"}
      data-woken={woken ? "true" : "false"}
      data-still={still ? "true" : "false"}
      style={{
        opacity: woken ? 1 : lit ? 0.97 : 0.62,
        filter: `saturate(${lit ? 1 : 0.85}) brightness(${woken ? 1.14 : lit ? 1.02 : 0.82})`,
        transition: "opacity .5s ease, filter .5s ease",
      }}
    >
      <div className="dos-mini-jitter absolute inset-0">
        {face}
        {/* clipped copies: invisible at rest, displaced for a few frames */}
        <div className="dos-mini-tear dos-mini-tear-a absolute inset-0">{face}</div>
        <div className="dos-mini-tear dos-mini-tear-b absolute inset-0">{face}</div>
      </div>

      {/* slow luminance roll */}
      <div
        className="dos-mini-roll absolute inset-x-0"
        style={{
          height: "38%",
          background:
            "linear-gradient(180deg, transparent, rgba(255,255,255,0.045), transparent)",
        }}
      />
      {/* one bright line crossing the tube */}
      <div
        className="dos-mini-sweep absolute inset-x-0"
        style={{
          height: "9%",
          background:
            "linear-gradient(180deg, transparent, rgba(232,184,75,0.16) 45%, rgba(255,255,255,0.1) 55%, transparent)",
        }}
      />
    </div>
  );
}
