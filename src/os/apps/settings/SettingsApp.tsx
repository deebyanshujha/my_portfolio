import { useState } from "react";
import { audio } from "../../kernel/audio";
import {
  settingsStore,
  useSettings,
  usePhotoWallpapers,
  WALLPAPERS,
  type AccentId,
  type MotionMode,
} from "../../kernel/settingsStore";
import type { AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import {
  AppFrame,
  AppScroll,
  AppSidebar,
  Divider,
  Label,
  SidebarItem,
  SidebarLabel,
} from "../../shell/ApplicationShell";
import { Slider } from "../../shell/Slider";

type Pane = "appearance" | "motion" | "sound" | "system";

const ACCENTS: { id: AccentId; name: string; swatch: string }[] = [
  { id: "phosphor", name: "Phosphor", swatch: "#E8B84B" },
  { id: "signal", name: "Signal", swatch: "#5FD3B8" },
  { id: "ember", name: "Ember", swatch: "#E2775A" },
];

const MOTION: { id: MotionMode; name: string; hint: string }[] = [
  { id: "full", name: "Full", hint: "Every transition, ignoring the OS preference" },
  { id: "reduced", name: "Follow system", hint: "Honours prefers-reduced-motion" },
  { id: "off", name: "Off", hint: "Animation suppressed everywhere" },
];

export default function SettingsApp({ windowId }: AppProps) {
  const settings = useSettings();
  // every wallpaper is an optional asset — no card until its file loads
  const loaded = usePhotoWallpapers();
  const [pane, setPane] = useState<Pane>("appearance");
  const [confirmReset, setConfirmReset] = useState(false);

  useAppCommand(windowId, (command) => {
    if (command === "reset") setConfirmReset(true);
  });

  return (
    <AppFrame>
      <div className="flex min-h-0 flex-1">
        <AppSidebar width={162}>
          <SidebarLabel>Settings</SidebarLabel>
          <SidebarItem active={pane === "appearance"} onClick={() => setPane("appearance")}>
            Appearance
          </SidebarItem>
          <SidebarItem active={pane === "motion"} onClick={() => setPane("motion")}>
            Motion
          </SidebarItem>
          <SidebarItem active={pane === "sound"} onClick={() => setPane("sound")}>
            Sound
          </SidebarItem>
          <SidebarItem active={pane === "system"} onClick={() => setPane("system")}>
            System
          </SidebarItem>
        </AppSidebar>

        <AppScroll className="px-5 py-5">
          {pane === "appearance" && (
            <>
              <Label className="mb-2.5">Wallpaper</Label>
              <div className="grid grid-cols-2 gap-2.5">
                {WALLPAPERS.filter((w) => loaded.get(w.id) === true).map((w) => {
                  const active = settings.wallpaper === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => settingsStore.set({ wallpaper: w.id })}
                      aria-pressed={active}
                      className="overflow-hidden rounded-[10px] border text-left transition-colors"
                      style={{ borderColor: active ? "var(--accent)" : "var(--hair)" }}
                    >
                      <span
                        className="block h-[74px] w-full"
                        style={{
                          backgroundImage: `linear-gradient(180deg, rgba(4,5,8,0.5), rgba(4,5,8,0.25)), url("${w.photo}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center 42%",
                          filter: "saturate(0.78) brightness(0.9)",
                        }}
                      />
                      <span className="block px-2.5 py-2">
                        <span className="block text-[12.5px]" style={{ color: "var(--ink)" }}>
                          {w.name}
                        </span>
                        <span className="meta mt-0.5 block" style={{ color: "var(--ink-4)" }}>
                          {w.note}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <Label className="mb-2.5 mt-6">Accent</Label>
              <div className="flex gap-2">
                {ACCENTS.map((a) => {
                  const active = settings.accent === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => settingsStore.set({ accent: a.id })}
                      aria-pressed={active}
                      className="flex flex-1 items-center gap-2 rounded-[9px] border px-3 py-2.5 transition-colors"
                      style={{ borderColor: active ? "var(--accent)" : "var(--hair)" }}
                    >
                      <span className="h-3 w-3 rounded-full" style={{ background: a.swatch }} />
                      <span className="text-[12.5px]" style={{ color: active ? "var(--ink)" : "var(--ink-2)" }}>
                        {a.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <Label className="mb-2.5 mt-6">Brightness</Label>
              <Slider
                label="Display brightness"
                value={settings.brightness}
                min={0.35}
                max={1}
                onChange={(v) => settingsStore.set({ brightness: v })}
                format={(v) => `${Math.round(((v - 0.35) / 0.65) * 100)}%`}
              />
              <p className="meta mt-2" style={{ color: "var(--ink-4)" }}>
                Dims this page with an overlay. A browser cannot change the real display.
              </p>

              <Divider className="my-6" />

              <Toggle
                title="Interface effects"
                hint="Background blur behind windows, the dock and the menu bar. Turning this off is noticeably faster on integrated graphics."
                on={settings.effects}
                onChange={(v) => settingsStore.set({ effects: v })}
              />
            </>
          )}

          {pane === "motion" && (
            <>
              <Label className="mb-2.5">Animation</Label>
              <div className="space-y-2">
                {MOTION.map((m) => {
                  const active = settings.motion === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => settingsStore.set({ motion: m.id })}
                      aria-pressed={active}
                      className="flex w-full items-start gap-3 rounded-[10px] border p-3 text-left transition-colors"
                      style={{
                        borderColor: active ? "var(--accent)" : "var(--hair)",
                        background: active ? "var(--accent-glow)" : "transparent",
                      }}
                    >
                      <span
                        aria-hidden
                        className="mt-[3px] grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border"
                        style={{ borderColor: active ? "var(--accent)" : "var(--hair-strong)" }}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                        )}
                      </span>
                      <span>
                        <span className="block text-[13px]" style={{ color: "var(--ink)" }}>
                          {m.name}
                        </span>
                        <span className="mt-0.5 block text-[12px]" style={{ color: "var(--ink-3)" }}>
                          {m.hint}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="meta mt-4" style={{ color: "var(--ink-4)" }}>
                Follow system is the default. Nothing in this environment depends on animation to
                be usable.
              </p>
            </>
          )}

          {pane === "sound" && (
            <>
              <Label className="mb-2.5">Volume</Label>
              <Slider
                label="Volume"
                value={settings.soundEnabled ? settings.volume : 0}
                onChange={(v) => {
                  settingsStore.set({ volume: v, soundEnabled: v > 0 });
                  audio.setEnabled(v > 0);
                  audio.setVolume(v);
                }}
              />
              <Divider className="my-5" />
              <Toggle
                title="Interface sounds"
                hint="Short tones when windows open and close, and the start-up chime."
                on={settings.soundEnabled}
                onChange={(v) => {
                  settingsStore.set({ soundEnabled: v });
                  audio.setEnabled(v);
                  if (v) audio.sfx("click");
                }}
              />
              <p className="meta mt-4" style={{ color: "var(--ink-4)" }}>
                This controls audio produced by this site only — it cannot touch system volume.
              </p>
            </>
          )}

          {pane === "system" && (
            <>
              <Label className="mb-2.5">About this system</Label>
              <dl className="m-0 grid grid-cols-[128px,1fr] gap-y-2 text-[12.5px]">
                {[
                  ["System", "DOS 1.0"],
                  ["Runtime", "React 18 · Vite 6 · TypeScript"],
                  ["Motion", "Motion 12"],
                  ["Audio", "Web Audio API, synthesised in-tab"],
                  ["Data", "Static, from this repository"],
                  ["Network", "GitHub REST, unauthenticated"],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="meta" style={{ color: "var(--ink-4)" }}>
                      {k}
                    </dt>
                    <dd className="m-0" style={{ color: "var(--ink-2)" }}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <Divider className="my-6" />

              <Label className="mb-2">Reset</Label>
              <p className="mb-3 mt-0 text-[12.5px]" style={{ color: "var(--ink-3)" }}>
                Clears wallpaper, accent, motion, sound and brightness, and lets the boot sequence
                play again on the next visit.
              </p>
              {confirmReset ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      settingsStore.reset();
                      audio.setEnabled(true);
                      audio.setVolume(0.6);
                      setConfirmReset(false);
                    }}
                    className="rounded-md px-3 py-1.5 text-[12px] font-medium"
                    style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
                  >
                    Reset everything
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-md border px-3 py-1.5 text-[12px]"
                    style={{ borderColor: "var(--hair-strong)", color: "var(--ink-2)" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="rounded-md border px-3 py-1.5 text-[12px]"
                  style={{ borderColor: "var(--hair-strong)", color: "var(--ink)" }}
                >
                  Reset to defaults…
                </button>
              )}
            </>
          )}
        </AppScroll>
      </div>
    </AppFrame>
  );
}

function Toggle({
  title,
  hint,
  on,
  onChange,
}: {
  title: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[13px]" style={{ color: "var(--ink)" }}>
          {title}
        </div>
        <div className="mt-1 text-[12px] leading-[1.55]" style={{ color: "var(--ink-3)" }}>
          {hint}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        onClick={() => onChange(!on)}
        className="relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-full border transition-colors"
        style={{
          borderColor: on ? "var(--accent)" : "var(--hair-strong)",
          background: on ? "var(--accent)" : "rgba(255,255,255,0.06)",
        }}
      >
        <span
          className="absolute top-1/2 block h-[16px] w-[16px] -translate-y-1/2 rounded-full transition-all"
          style={{
            left: on ? 19 : 3,
            background: on ? "var(--accent-ink)" : "var(--ink-2)",
          }}
        />
      </button>
    </div>
  );
}
