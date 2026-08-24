import type { AppId } from "../kernel/appRegistry";

/**
 * One hand-drawn glyph per application, all built on the same 28×28 grid with
 * 1.6px strokes so the dock reads as a single icon set rather than a pile of
 * borrowed logos.
 *
 * Most marks are pure monoline. Calendar and Clock carry a little more inside
 * them — a filled header band, a tinted face, a highlight arc — because a month
 * grid and a clock face have to survive being read at 40px, and an outline
 * alone goes to mush at that size. The fills are all `currentColor` at low
 * alpha, so they inherit each app's anodized tint exactly as the strokes do and
 * the family still holds together.
 */
export function AppGlyph({ id }: { id: AppId }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 28 28",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (id) {
    case "terminal":
      return (
        <svg {...common}>
          <path d="M7 9.5 11.5 14 7 18.5" />
          <path d="M14 19h7" />
        </svg>
      );
    case "projects":
      return (
        <svg {...common}>
          <path d="M5 20V9a1 1 0 0 1 1-1h4.6l1.8 2.2H22a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
          <path d="M5 13h18" opacity={0.45} />
        </svg>
      );
    case "about":
      return (
        <svg {...common}>
          <rect x="4.5" y="7" width="19" height="14" rx="2" />
          <circle cx="10.5" cy="13" r="2.4" />
          <path
            d="M16 12h4M16 16h4M7 19c.6-1.6 2-2.4 3.5-2.4S13.4 17.4 14 19"
            opacity={0.7}
          />
        </svg>
      );
    case "resume":
      return (
        <svg {...common}>
          <path d="M7 4.5h9L21 9.5V23a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 7 23V5a.5.5 0 0 1 .5-.5Z" />
          <path d="M16 4.5v5h5" opacity={0.6} />
          <path d="M10.5 14h7M10.5 17.5h7M10.5 21h4" opacity={0.7} />
        </svg>
      );
    case "github":
      return (
        <svg {...common}>
          <circle cx="8" cy="7.5" r="2.4" />
          <circle cx="8" cy="20.5" r="2.4" />
          <circle cx="19" cy="14" r="2.4" />
          <path d="M8 10v8" />
          <path d="M8 14h5.5a3.5 3.5 0 0 0 3.5-.4" opacity={0.8} />
        </svg>
      );
    case "skills":
      return (
        <svg {...common}>
          <circle cx="14" cy="6.5" r="2.2" />
          <circle cx="6.5" cy="18" r="2.2" />
          <circle cx="21.5" cy="18" r="2.2" />
          <circle cx="14" cy="14" r="1.6" opacity={0.7} />
          <path
            d="M14 8.7v3.7M12.6 15.1 8.2 17M15.5 15.1 19.8 17M8.7 18h10.6"
            opacity={0.75}
          />
        </svg>
      );
    case "achievements":
      return (
        <svg {...common}>
          <path d="M14 4.5 21 8.2v6.1c0 3.9-2.8 7.2-7 9.2-4.2-2-7-5.3-7-9.2V8.2Z" />
          <path d="M10.8 13.8 13.2 16.2 17.6 11.6" opacity={0.85} />
        </svg>
      );
    case "music":
      return (
        <svg {...common}>
          <path
            d="M8 18V8.5M13 21V6M18 18V8.5M23 15v-4M3 15v-4"
            opacity={0.9}
          />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          {/* the two hangers, above the body so the silhouette reads as a wall
              calendar rather than a plain window */}
          <path d="M9.5 4v3.4M18.5 4v3.4" />
          {/* body */}
          <rect x="4.2" y="6.4" width="19.6" height="17.4" rx="2.6" />
          {/* header band: the layer that makes it a calendar at a glance */}
          <path
            d="M4.2 9a2.6 2.6 0 0 1 2.6-2.6h14.4A2.6 2.6 0 0 1 23.8 9v2.2H4.2Z"
            fill="currentColor"
            fillOpacity={0.26}
            stroke="none"
          />
          <path d="M4.2 11.2h19.6" opacity={0.55} />
          {/* date grid — three rows, thinning out the way a month does */}
          <g stroke="none" fill="currentColor">
            <rect
              x="7.4"
              y="13.9"
              width="2.5"
              height="2.1"
              rx="0.7"
              fillOpacity={0.5}
            />
            <rect
              x="12.1"
              y="13.9"
              width="2.5"
              height="2.1"
              rx="0.7"
              fillOpacity={0.5}
            />
            <rect
              x="16.8"
              y="13.9"
              width="2.5"
              height="2.1"
              rx="0.7"
              fillOpacity={0.5}
            />
            {/* today */}
            <rect
              x="7.4"
              y="17.7"
              width="2.5"
              height="2.1"
              rx="0.7"
              fillOpacity={0.95}
            />
            <rect
              x="12.1"
              y="17.7"
              width="2.5"
              height="2.1"
              rx="0.7"
              fillOpacity={0.5}
            />
            <rect
              x="16.8"
              y="17.7"
              width="2.5"
              height="2.1"
              rx="0.7"
              fillOpacity={0.28}
            />
            <rect
              x="7.4"
              y="21.5"
              width="2.5"
              height="1.4"
              rx="0.7"
              fillOpacity={0.28}
            />
          </g>
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          {/* the face, tinted so the dial reads as a solid object */}
          <circle
            cx="14"
            cy="14.4"
            r="9.4"
            fill="currentColor"
            fillOpacity={0.14}
          />
          <circle cx="14" cy="14.4" r="9.4" />
          {/* light falling on the upper-left, the same direction as the tile */}
          <path
            d="M7.9 7.6a9.4 9.4 0 0 0-2.9 5.4"
            opacity={0.75}
            strokeWidth={1.9}
          />
          {/* quarter marks only — twelve ticks turn to noise at dock size */}
          <g opacity={0.62}>
            <path d="M14 6.6v1.6M14 20.6v1.6M6.2 14.4h1.6M20.2 14.4h1.6" />
          </g>
          {/* hands at 10:10 — the pose a clock is most legible in */}
          <path d="M14 14.4 9.9 11.2" strokeWidth={1.8} />
          <path d="M14 14.4 18.7 10.3" strokeWidth={1.6} />
          <circle
            cx="14"
            cy="14.4"
            r="1.15"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M4.5 9.5h19M4.5 18.5h19" opacity={0.55} />
          <circle cx="11" cy="9.5" r="2.6" />
          <circle cx="18" cy="18.5" r="2.6" />
        </svg>
      );
    default:
      return null;
  }
}

/** The DJ system mark, drawable as a hairline outline for the boot sequence. */
export function SystemMark({
  size = 24,
  drawn = false,
}: {
  size?: number;
  drawn?: boolean;
}) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.png`}
      alt="Deebyanshu Jha"
      width={size}
      height={size}
      aria-hidden={drawn ? undefined : true}
      className="rounded-[25%] object-cover"
    />
  );
}
