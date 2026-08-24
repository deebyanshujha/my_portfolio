import type { ReactNode } from "react";

/**
 * Shared layout primitives for every application.
 *
 * Apps compose these instead of styling from scratch, which is what keeps nine
 * separate applications reading as one operating system: identical toolbar
 * height, identical hairlines, identical label voice, identical scroll gutters.
 */

export function AppFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex h-full min-h-0 w-full flex-col ${className}`}>{children}</div>;
}

export function AppToolbar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex h-9 shrink-0 items-center gap-2 border-b px-3 ${className}`}
      style={{ borderColor: "var(--hair)", background: "rgba(255,255,255,0.018)" }}
    >
      {children}
    </div>
  );
}

export function AppScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`scroll-thin min-h-0 flex-1 overflow-y-auto ${className}`}>{children}</div>
  );
}

export function AppSidebar({
  children,
  width = 172,
}: {
  children: ReactNode;
  width?: number;
}) {
  return (
    <aside
      className="scroll-thin flex h-full shrink-0 flex-col gap-1 overflow-y-auto border-r p-2"
      style={{
        width,
        maxWidth: "40%",
        borderColor: "var(--hair)",
        background: "rgba(0,0,0,0.14)",
      }}
    >
      {children}
    </aside>
  );
}

export function SidebarLabel({ children }: { children: ReactNode }) {
  return (
    <div className="meta px-2 pb-1 pt-3 first:pt-1" style={{ color: "var(--ink-4)" }}>
      {children}
    </div>
  );
}

export function SidebarItem({
  active,
  onClick,
  icon,
  children,
  count,
}: {
  active?: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="flex w-full items-center gap-2 rounded-md px-2 py-[6px] text-left text-[12.5px] transition-colors"
      style={{
        background: active ? "rgba(255,255,255,0.07)" : "transparent",
        color: active ? "var(--ink)" : "var(--ink-2)",
      }}
    >
      {icon && <span className="grid h-4 w-4 shrink-0 place-items-center opacity-70">{icon}</span>}
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span className="ml-auto font-mono text-[10px]" style={{ color: "var(--ink-4)" }}>
          {count}
        </span>
      )}
    </button>
  );
}

/** 10px uppercase section marker — the system's one label voice. */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`meta ${className}`}>{children}</div>;
}

export function Chip({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent";
}) {
  return (
    <span
      className="inline-flex items-center rounded-[5px] border px-[7px] py-[3px] font-mono text-[10.5px] tracking-[0.04em]"
      style={
        tone === "accent"
          ? {
              borderColor: "var(--accent-dim)",
              color: "var(--accent)",
              background: "var(--accent-glow)",
            }
          : { borderColor: "var(--hair)", color: "var(--ink-2)" }
      }
    >
      {children}
    </span>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full ${className}`} style={{ background: "var(--hair)" }} />;
}

export function ToolbarButton({
  children,
  onClick,
  active,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className="flex h-[22px] items-center gap-1.5 rounded-md px-2 text-[11px] transition-colors hover:bg-[rgba(255,255,255,0.07)]"
      style={{
        background: active ? "rgba(255,255,255,0.09)" : "transparent",
        color: active ? "var(--ink)" : "var(--ink-2)",
      }}
    >
      {children}
    </button>
  );
}

/** Link out of the environment. Always shows where it goes. */
export function ExternalAction({
  href,
  children,
  primary,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors"
      style={
        primary
          ? {
              borderColor: "var(--accent)",
              background: "var(--accent)",
              color: "var(--accent-ink)",
            }
          : { borderColor: "var(--hair-strong)", color: "var(--ink)" }
      }
    >
      {children}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M4 2h6v6M10 2 2.5 9.5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div>
        <p
          className="font-editorial m-0 italic"
          style={{ fontSize: "1.15rem", color: "var(--ink-2)" }}
        >
          {title}
        </p>
        {hint && (
          <p className="meta mt-2" style={{ color: "var(--ink-4)" }}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
