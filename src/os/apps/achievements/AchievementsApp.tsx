import { useState } from "react";
import { motion } from "motion/react";
import { achievements, certifications, codingProfiles } from "../../../data/profile";
import type { AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import {
  AppFrame,
  AppScroll,
  AppToolbar,
  Chip,
  ExternalAction,
  Label,
  ToolbarButton,
} from "../../shell/ApplicationShell";

type Tab = "trophies" | "credentials";

const CATEGORY_GLYPH: Record<string, string> = {
  "Problem Solving": "M2 8.5 6 12l8-9",
  "Competitive Programming": "M8 1.5 10 6l4.5.6-3.3 3.2.8 4.6L8 12.2 4 14.4l.8-4.6L1.5 6.6 6 6Z",
  Research: "M6.5 1.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM10.2 10.2 14.5 14.5",
  Academic: "M8 2 15 5.5 8 9 1 5.5Zm5 5.6v3.2c0 1.2-2.2 2.2-5 2.2s-5-1-5-2.2V7.6",
};

export default function AchievementsApp({ windowId }: AppProps) {
  const [tab, setTab] = useState<Tab>("trophies");
  const [openId, setOpenId] = useState<string | null>(achievements[0]?.title ?? null);

  useAppCommand(windowId, (command, value) => {
    if (command === "tab") setTab(value as Tab);
  });

  const categories = Array.from(new Set(achievements.map((a) => a.category)));

  return (
    <AppFrame>
      <AppToolbar>
        <ToolbarButton label="Achievements" active={tab === "trophies"} onClick={() => setTab("trophies")}>
          Achievements
        </ToolbarButton>
        <ToolbarButton label="Credentials" active={tab === "credentials"} onClick={() => setTab("credentials")}>
          Credentials
        </ToolbarButton>
        <span className="meta ml-auto" style={{ color: "var(--ink-4)" }}>
          {tab === "trophies"
            ? `${achievements.length} unlocked · ${categories.length} categories`
            : `${certifications.length} issued`}
        </span>
      </AppToolbar>

      <AppScroll>
        {tab === "trophies" ? (
          <div className="p-4">
            <div className="space-y-2">
              {achievements.map((a, i) => {
                const open = openId === a.title;
                return (
                  <motion.div
                    key={a.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: i * 0.05 }}
                    className="overflow-hidden rounded-[10px] border"
                    style={{
                      borderColor: open ? "var(--hair-strong)" : "var(--hair)",
                      background: open ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.018)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : a.title)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border"
                        style={{
                          borderColor: "var(--accent-dim)",
                          background: "var(--accent-glow)",
                          color: "var(--accent)",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d={CATEGORY_GLYPH[a.category] ?? CATEGORY_GLYPH["Problem Solving"]} />
                        </svg>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                          {a.title}
                        </span>
                        <span className="meta mt-1 block" style={{ color: "var(--ink-4)" }}>
                          {a.category} · {a.date}
                        </span>
                      </span>

                      <span
                        aria-hidden
                        className="shrink-0 transition-transform"
                        style={{
                          color: "var(--ink-3)",
                          transform: open ? "rotate(90deg)" : "none",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4.5 2.5 8 6l-3.5 3.5" />
                        </svg>
                      </span>
                    </button>

                    {open && (
                      <div className="border-t px-3 pb-3 pt-3" style={{ borderColor: "var(--hair)" }}>
                        <p className="m-0 text-[13px] leading-[1.65]" style={{ color: "var(--ink-2)" }}>
                          {a.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {a.details.map((d) => (
                            <Chip key={d}>{d}</Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <Label className="mb-2 mt-6">Verify</Label>
            <div className="flex flex-wrap gap-2">
              {codingProfiles.map((p) => (
                <ExternalAction key={p.platform} href={p.href}>
                  {p.platform}
                </ExternalAction>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="overflow-hidden rounded-[10px] border" style={{ borderColor: "var(--hair)" }}>
              {certifications.map((c, i) => (
                <div
                  key={c.credentialId}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b p-3 last:border-0"
                  style={{
                    borderColor: "var(--hair)",
                    background: i % 2 ? "rgba(255,255,255,0.015)" : "transparent",
                  }}
                >
                  <span className="min-w-[52%] flex-1 text-[13px]" style={{ color: "var(--ink)" }}>
                    {c.title}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                    {c.issuer}
                  </span>
                  <span className="meta ml-auto" style={{ color: "var(--ink-4)" }}>
                    {c.issued}
                  </span>
                  <span
                    className="w-full break-all font-mono text-[10.5px]"
                    style={{ color: "var(--ink-4)" }}
                  >
                    ID {c.credentialId}
                  </span>
                </div>
              ))}
            </div>
            <p className="meta mt-3" style={{ color: "var(--ink-4)" }}>
              Credential IDs are printed so any of these can be checked with the issuer.
            </p>
          </div>
        )}
      </AppScroll>
    </AppFrame>
  );
}
