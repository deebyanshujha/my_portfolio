import { useCallback, useRef, type ReactNode } from "react";

/**
 * A keyboard-operable slider. Used for brightness and volume, both of which
 * control something real — the page's own luminance and the Web Audio master
 * gain respectively. Neither claims to touch the operating system.
 */
export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.02,
  onChange,
  label,
  icon,
  format,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  icon?: ReactNode;
  format?: (v: number) => string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pct = ((value - min) / (max - min)) * 100;

  const fromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return value;
      const r = el.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      const raw = min + t * (max - min);
      return Math.round(raw / step) * step;
    },
    [max, min, step, value],
  );

  const begin = (e: React.PointerEvent) => {
    e.preventDefault();
    onChange(fromClientX(e.clientX));
    const move = (ev: PointerEvent) => onChange(fromClientX(ev.clientX));
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const big = (max - min) / 10;
    const map: Record<string, number> = {
      ArrowRight: step,
      ArrowUp: step,
      ArrowLeft: -step,
      ArrowDown: -step,
      PageUp: big,
      PageDown: -big,
    };
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      onChange(e.key === "Home" ? min : max);
      return;
    }
    const delta = map[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    onChange(Math.max(min, Math.min(max, value + delta)));
  };

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(value.toFixed(2))}
      aria-valuetext={format ? format(value) : `${Math.round(pct)}%`}
      onKeyDown={onKeyDown}
      onPointerDown={begin}
      ref={trackRef}
      className="relative h-8 w-full cursor-pointer overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--hair)", background: "rgba(0,0,0,0.32)", touchAction: "none" }}
    >
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-75"
        style={{ width: `${pct}%`, background: "rgba(237,234,228,0.74)" }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center gap-2 px-2.5">
        <span
          className="grid h-4 w-4 shrink-0 place-items-center mix-blend-difference"
          style={{ color: "#fff" }}
        >
          {icon}
        </span>
        <span
          className="meta mix-blend-difference"
          style={{ color: "#fff", letterSpacing: "0.12em" }}
        >
          {format ? format(value) : `${Math.round(pct)}%`}
        </span>
      </div>
    </div>
  );
}
