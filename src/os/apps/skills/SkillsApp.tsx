import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { skillGroups } from "../../../data/profile";
import type { AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import { AppFrame, AppScroll, Chip, Label } from "../../shell/ApplicationShell";

/**
 * Skills as a system diagram rather than a logo wall.
 *
 * The seven groups are laid out as modules on a fixed dependency graph — what
 * rests on what — so the picture says something a badge grid cannot: the
 * foundations are at the bottom and everything above is built on them.
 */
type ModuleId =
  | "Core CS"
  | "Programming Languages"
  | "Systems"
  | "Databases"
  | "Backend"
  | "Tools"
  | "Frontend";

const LAYOUT: Record<ModuleId, { x: number; y: number; tier: string }> = {
  "Core CS": { x: 50, y: 87, tier: "Foundation" },
  "Programming Languages": { x: 27, y: 65, tier: "Language layer" },
  Systems: { x: 73, y: 65, tier: "Language layer" },
  Databases: { x: 20, y: 41, tier: "Service layer" },
  Backend: { x: 55, y: 41, tier: "Service layer" },
  Tools: { x: 80, y: 41, tier: "Service layer" },
  Frontend: { x: 44, y: 17, tier: "Surface" },
};

const EDGES: [ModuleId, ModuleId][] = [
  ["Core CS", "Programming Languages"],
  ["Core CS", "Systems"],
  ["Programming Languages", "Databases"],
  ["Programming Languages", "Backend"],
  ["Systems", "Backend"],
  ["Systems", "Tools"],
  ["Databases", "Backend"],
  ["Backend", "Frontend"],
  ["Tools", "Backend"],
  ["Tools", "Frontend"],
];

export default function SkillsApp({ windowId }: AppProps) {
  const [active, setActive] = useState<ModuleId | null>(null);
  const [hovered, setHovered] = useState<ModuleId | null>(null);

  useAppCommand(windowId, (command) => {
    if (command === "clear") setActive(null);
  });

  const lit = hovered ?? active;

  /** A module is lit when it is the subject or directly wired to it. */
  const related = useMemo(() => {
    if (!lit) return null;
    const set = new Set<ModuleId>([lit]);
    EDGES.forEach(([a, b]) => {
      if (a === lit) set.add(b);
      if (b === lit) set.add(a);
    });
    return set;
  }, [lit]);

  const selected = skillGroups.find((g) => g.title === active) ?? null;

  return (
    <AppFrame>
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <div className="relative min-h-[300px] min-w-0 flex-1 overflow-hidden px-6 py-4">
          {/* measured ground, same language as the desktop wallpaper */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(237,234,228,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(237,234,228,0.028) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />

          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {EDGES.map(([a, b]) => {
              const on = related ? related.has(a) && related.has(b) : false;
              return (
                <line
                  key={`${a}-${b}`}
                  x1={`${LAYOUT[a].x}%`}
                  y1={`${LAYOUT[a].y}%`}
                  x2={`${LAYOUT[b].x}%`}
                  y2={`${LAYOUT[b].y}%`}
                  stroke={on ? "var(--accent)" : "var(--hair-strong)"}
                  strokeWidth={on ? 1.2 : 1}
                  opacity={related ? (on ? 0.85 : 0.15) : 0.45}
                  style={{ transition: "opacity .25s ease, stroke .25s ease" }}
                />
              );
            })}
          </svg>

          {(Object.keys(LAYOUT) as ModuleId[]).map((id, i) => {
            const group = skillGroups.find((g) => g.title === id);
            if (!group) return null;
            const dimmed = related ? !related.has(id) : false;
            const isSubject = lit === id;
            return (
              <motion.button
                key={id}
                type="button"
                onPointerEnter={() => setHovered(id)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(id)}
                onBlur={() => setHovered(null)}
                onClick={() => setActive(active === id ? null : id)}
                aria-pressed={active === id}
                aria-label={`${id} — ${group.skills.length} capabilities`}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[9px] border px-3 py-2 text-left"
                style={{
                  left: `${LAYOUT[id].x}%`,
                  top: `${LAYOUT[id].y}%`,
                  minWidth: 128,
                  borderColor: isSubject ? "var(--accent)" : "var(--hair-strong)",
                  background: isSubject ? "var(--accent-glow)" : "rgba(14,15,19,0.86)",
                  opacity: dimmed ? 0.35 : 1,
                  transition: "opacity .25s ease, border-color .2s ease, background .2s ease",
                }}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: dimmed ? 0.35 : 1, scale: 1 }}
                transition={{ duration: 0.32, delay: i * 0.045 }}
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: isSubject ? "var(--accent)" : "var(--ink-3)",
                      boxShadow: isSubject ? "0 0 8px var(--accent)" : "none",
                    }}
                  />
                  <span className="text-[12px] font-medium" style={{ color: "var(--ink)" }}>
                    {id}
                  </span>
                </div>
                <div className="meta mt-1" style={{ color: isSubject ? "var(--accent-dim)" : "var(--ink-3)" }}>
                  {group.skills.length} modules
                </div>
              </motion.button>
            );
          })}

          <div className="pointer-events-none absolute bottom-3 left-3">
            <span className="meta" style={{ color: "var(--ink-4)" }}>
              Hover to trace dependencies · click to inspect
            </span>
          </div>
        </div>

        {/* inspector */}
        <div
          className="flex w-full shrink-0 flex-col border-t sm:w-[236px] sm:border-l sm:border-t-0"
          style={{ borderColor: "var(--hair)", background: "rgba(0,0,0,0.16)" }}
        >
          <AppScroll className="p-4">
            {selected ? (
              <>
                <Label className="mb-1">{LAYOUT[selected.title as ModuleId].tier}</Label>
                <h3
                  className="font-display m-0 text-[17px] font-bold leading-tight"
                  style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}
                >
                  {selected.title}
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.skills.map((s) => (
                    <Chip key={s} tone="accent">
                      {s}
                    </Chip>
                  ))}
                </div>
                <Label className="mb-1.5 mt-5">Wired to</Label>
                <ul className="m-0 list-none space-y-1 p-0">
                  {EDGES.filter(([a, b]) => a === selected.title || b === selected.title).map(
                    ([a, b]) => {
                      const other = a === selected.title ? b : a;
                      const upstream = b === selected.title;
                      return (
                        <li
                          key={`${a}-${b}`}
                          className="flex items-center gap-2 text-[12px]"
                          style={{ color: "var(--ink-2)" }}
                        >
                          <span className="meta" style={{ color: "var(--ink-4)" }}>
                            {upstream ? "↑" : "↓"}
                          </span>
                          {other}
                        </li>
                      );
                    },
                  )}
                </ul>
              </>
            ) : (
              <>
                <Label className="mb-2">Capability map</Label>
                <p className="m-0 text-[12.5px] leading-[1.6]" style={{ color: "var(--ink-3)" }}>
                  Seven modules, wired by what depends on what. Core computer science sits at the
                  bottom; everything above it is built on that layer.
                </p>
                <div className="mt-5 space-y-2">
                  {["Foundation", "Language layer", "Service layer", "Surface"].map((tier) => (
                    <div key={tier} className="flex items-baseline gap-2">
                      <span className="meta w-[92px]" style={{ color: "var(--ink-4)" }}>
                        {tier}
                      </span>
                      <span className="text-[12px]" style={{ color: "var(--ink-2)" }}>
                        {(Object.keys(LAYOUT) as ModuleId[])
                          .filter((m) => LAYOUT[m].tier === tier)
                          .join(", ")}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </AppScroll>
        </div>
      </div>
    </AppFrame>
  );
}
