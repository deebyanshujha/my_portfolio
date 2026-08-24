import { useState } from "react";
import { education, focusAreas, heroMetrics, profile } from "../../../data/profile";
import type { AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import { AppFrame, AppScroll, Chip, Divider, ExternalAction, Label } from "../../shell/ApplicationShell";
import { SystemMark } from "../../shell/AppGlyph";

export default function AboutApp({ windowId }: AppProps) {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — the address is on screen either way
      setCopied(false);
    }
  };

  useAppCommand(windowId, (command) => {
    if (command === "copy-email") void copyEmail();
  });

  return (
    <AppFrame>
      <AppScroll>
        {/* identity plate */}
        <div className="relative overflow-hidden px-6 pb-5 pt-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(90% 120% at 12% -20%, var(--accent-glow), transparent 62%)",
            }}
          />
          <div className="relative flex items-start gap-4">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-[13px] border"
              style={{
                borderColor: "var(--hair-strong)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--ink)",
              }}
            >
              <SystemMark size={30} />
            </div>
            <div className="min-w-0">
              <h2
                className="font-display m-0 text-[26px] font-bold leading-none"
                style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}
              >
                {profile.name}
              </h2>
              <p className="mb-0 mt-1.5 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
                {profile.title}
              </p>
              <p className="meta mt-2" style={{ color: "var(--ink-4)" }}>
                {profile.location}
              </p>
            </div>
          </div>

          <p
            className="font-editorial relative mb-0 mt-5 italic"
            style={{ fontSize: "1.06rem", lineHeight: 1.5, color: "var(--ink)" }}
          >
            {profile.tagline}
          </p>
        </div>

        <Divider />

        <div className="px-6 py-5">
          <p className="m-0 text-[13.5px] leading-[1.68]" style={{ color: "var(--ink-2)" }}>
            {profile.summary}
          </p>
          <p className="mb-0 mt-3 text-[13px] leading-[1.65]" style={{ color: "var(--ink-3)" }}>
            {profile.recruiterNote}
          </p>
        </div>

        <Divider />

        {/* the numbers, stated plainly */}
        <div
          className="grid grid-cols-2 gap-px sm:grid-cols-4"
          style={{ background: "var(--hair)" }}
        >
          {heroMetrics.map((m) => (
            <div key={m.label} className="p-4" style={{ background: "rgba(14,15,19,0.55)" }}>
              <div
                className="font-display text-[20px] font-bold leading-none"
                style={{ letterSpacing: "-0.03em", color: "var(--ink)" }}
              >
                {m.value}
              </div>
              <div className="meta mt-2" style={{ color: "var(--ink-3)" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-5">
          <Label className="mb-2.5">Focus</Label>
          <div className="flex flex-wrap gap-1.5">
            {focusAreas.map((f) => (
              <Chip key={f.label}>{f.label}</Chip>
            ))}
          </div>
        </div>

        <Divider />

        <div className="px-6 py-5">
          <Label className="mb-3">Education</Label>
          <ol className="m-0 list-none space-y-3 p-0">
            {education.map((e) => (
              <li key={`${e.school}-${e.period}`} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--accent-dim)" }}
                />
                <div className="min-w-0">
                  <div className="text-[13px]" style={{ color: "var(--ink)" }}>
                    {e.program}
                  </div>
                  <div className="mt-0.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
                    {e.school} · {e.place}
                  </div>
                  <div className="meta mt-1" style={{ color: "var(--ink-4)" }}>
                    {e.result} — {e.period}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Divider />

        <div className="flex flex-wrap items-center gap-2 px-6 py-5">
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              borderColor: copied ? "var(--accent)" : "var(--hair-strong)",
              color: copied ? "var(--accent)" : "var(--ink)",
            }}
          >
            {copied ? "Copied" : profile.email}
          </button>
          <ExternalAction href={profile.linkedin}>LinkedIn</ExternalAction>
          <ExternalAction href={profile.github}>GitHub</ExternalAction>
        </div>
      </AppScroll>
    </AppFrame>
  );
}
