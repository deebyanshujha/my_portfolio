import { useMemo } from "react";
import type { NowPlaying } from "../../kernel/musicStore";

/** Deterministic per-track noise so a cover never changes between renders. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Sleeve art.
 *
 * When the track carries real artwork — anything coming from Spotify does —
 * that is what is shown; the album cover is part of the track's identity and
 * substituting a drawing for it would be a small lie. Everything else gets a
 * procedural composition derived from its id: a ground, a circle and a set of
 * rules, in the spirit of a printed record sleeve.
 */
export function CoverArt({
  track,
  size = 220,
}: {
  track: NowPlaying | null;
  size?: number;
}) {
  if (track?.artworkUrl) {
    return (
      <img
        src={track.artworkUrl}
        alt={`${track.album || track.title} cover art`}
        width={size}
        height={size}
        loading="lazy"
        className="block object-cover"
        style={{ width: size, height: size, background: "var(--ground-2)" }}
      />
    );
  }
  return <GeneratedCover track={track} size={size} />;
}

/** The empty sleeve: shown when nothing is loaded at all. */
function GeneratedCover({ track, size }: { track: NowPlaying | null; size: number }) {
  const id = track?.id ?? "empty";
  const hue = track?.hue ?? 40;
  const art = useMemo(() => {
    const seed = id.split("").reduce((a, c) => a + c.charCodeAt(0) * 31, 7);
    const rnd = seeded(seed);
    const rules = Array.from({ length: 6 }, () => ({
      y: 18 + rnd() * 72,
      w: 18 + rnd() * 64,
      x: 8 + rnd() * 20,
      o: 0.25 + rnd() * 0.65,
    }));
    return {
      cx: 30 + rnd() * 44,
      cy: 26 + rnd() * 40,
      r: 16 + rnd() * 20,
      rotate: -14 + rnd() * 28,
      rules,
    };
  }, [id]);

  const tint = track ? `hsl(${hue} 48% 62%)` : "rgba(237,234,228,0.18)";
  const ground = track ? `hsl(${hue} 20% 11%)` : "#111216";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={track ? `Cover art for ${track.title}` : "No track loaded"}
      style={{ display: "block", borderRadius: "inherit" }}
    >
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ground} />
          <stop offset="100%" stopColor="#07070a" />
        </linearGradient>
        <clipPath id={`c-${id}`}>
          <rect width="100" height="100" />
        </clipPath>
      </defs>

      <g clipPath={`url(#c-${id})`}>
        <rect width="100" height="100" fill={`url(#g-${id})`} />

        <circle
          cx={art.cx}
          cy={art.cy}
          r={art.r}
          fill="none"
          stroke={tint}
          strokeWidth="0.7"
          opacity="0.75"
        />
        <circle cx={art.cx} cy={art.cy} r={art.r * 0.34} fill={tint} opacity="0.16" />

        <g transform={`rotate(${art.rotate} 50 50)`}>
          {art.rules.map((r, i) => (
            <rect
              key={i}
              x={r.x}
              y={r.y}
              width={r.w}
              height="0.9"
              fill={tint}
              opacity={r.o * 0.7}
            />
          ))}
        </g>

        <rect x="8" y="84" width="8" height="8" fill={tint} opacity="0.85" />
        <rect
          x="0.4"
          y="0.4"
          width="99.2"
          height="99.2"
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="0.8"
        />
      </g>
    </svg>
  );
}
