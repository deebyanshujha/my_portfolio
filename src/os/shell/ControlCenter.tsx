import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Slider } from "./Slider";
import { settingsStore, useSettings } from "../kernel/settingsStore";
import { audio } from "../kernel/audio";
import { musicStore, useMusic, usePlaybackPosition, formatTime } from "../kernel/musicStore";
import { launch } from "../kernel/appRegistry";
import { CoverArt } from "../apps/music/CoverArt";
import { Label } from "./ApplicationShell";

export function ControlCenter({ onClose }: { onClose: () => void }) {
  const settings = useSettings();
  const music = useMusic();
  const spotify = music.spotify;
  const loaded = musicStore.current();
  // nothing has been started yet: say so rather than naming a track that is
  // sitting at 0:00 and has never been heard
  const track = music.engaged ? loaded : null;
  const pos = usePlaybackPosition(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // dismiss on outside click or Escape — the panel is a real popover
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <motion.div
      ref={panelRef}
      tabIndex={-1}
      data-overlay
      role="dialog"
      aria-label="Control Centre"
      className="popover absolute right-2 top-[34px] z-overlay w-[300px] rounded-[14px] border p-3 outline-none"
      style={{
        borderColor: "var(--win-border)",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.9), inset 0 1px 0 var(--win-highlight)",
      }}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── now playing ─────────────────────────────────────────
          Reads the same store Signal does. With nothing loaded it says so and
          offers the way in, rather than showing a track that is not playing. */}
      <div
        className="flex gap-3 rounded-[10px] border p-2.5"
        style={{ borderColor: "var(--hair)", background: "rgba(255,255,255,0.03)" }}
      >
        <button
          type="button"
          onClick={() => launch("music")}
          aria-label="Open Signal"
          className="shrink-0 overflow-hidden rounded-md"
          style={{ width: 52, height: 52 }}
        >
          <CoverArt track={track} size={52} />
        </button>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[12.5px] font-medium"
            style={{ color: track ? "var(--ink)" : "var(--ink-3)" }}
          >
            {track?.title ?? "Nothing playing"}
          </div>
          <div className="truncate text-[11px]" style={{ color: "var(--ink-3)" }}>
            {track?.artist ??
              (spotify.phase === "ready" ? "Spotify · connected" : "Spotify not connected")}
          </div>
          <div className="mt-1.5 flex items-center gap-1">
            <TransportButton
              label="Previous track"
              onClick={() => musicStore.prev()}
              d="M11 4 5 8l6 4V4ZM4 4v8"
              disabled={!loaded}
            />
            <TransportButton
              label={music.playing ? "Pause" : "Play"}
              onClick={() => musicStore.toggle()}
              d={music.playing ? "M5.5 3.5v9M10.5 3.5v9" : "M5 3.5v9l7-4.5-7-4.5Z"}
              filled={!music.playing}
              primary
              disabled={!loaded}
            />
            <TransportButton
              label="Next track"
              onClick={() => musicStore.next()}
              d="M5 4l6 4-6 4V4ZM12 4v8"
              disabled={!loaded}
            />
            <span className="meta ml-auto" style={{ color: "var(--ink-4)" }}>
              {track ? formatTime(pos) : "—:——"}
            </span>
          </div>
        </div>
      </div>

      {/* ── display ─────────────────────────────────────────── */}
      <Label className="mb-1.5 mt-3">Display · dims this page</Label>
      <Slider
        label="Display brightness"
        value={settings.brightness}
        min={0.35}
        max={1}
        onChange={(v) => settingsStore.set({ brightness: v })}
        format={(v) => `${Math.round(((v - 0.35) / 0.65) * 100)}%`}
        icon={
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4" strokeLinecap="round" />
          </svg>
        }
      />

      {/* ── sound ───────────────────────────────────────────── */}
      <Label className="mb-1.5 mt-3">Sound · this site only</Label>
      <Slider
        label="Volume"
        value={settings.soundEnabled ? settings.volume : 0}
        onChange={(v) => {
          settingsStore.set({ volume: v, soundEnabled: v > 0 });
          audio.setEnabled(v > 0);
          audio.setVolume(v);
          musicStore.setVolume(v);
        }}
        icon={
          settings.soundEnabled && settings.volume > 0 ? (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M4 6H2v4h2l3.5 3V3L4 6Z" strokeLinejoin="round" />
              <path d="M10.5 6a3 3 0 0 1 0 4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M4 6H2v4h2l3.5 3V3L4 6Z" strokeLinejoin="round" />
              <path d="M10.5 6.5l3 3M13.5 6.5l-3 3" strokeLinecap="round" />
            </svg>
          )
        }
      />

      {/* ── toggles ─────────────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Toggle
          label="Effects"
          hint="Background blur"
          on={settings.effects}
          onChange={(v) => settingsStore.set({ effects: v })}
        />
        <Toggle
          label="Reduce Motion"
          hint="Fewer animations"
          on={settings.motion !== "full"}
          onChange={(v) => settingsStore.set({ motion: v ? "reduced" : "full" })}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          launch("settings");
          onClose();
        }}
        className="meta mt-3 w-full rounded-md border py-2 transition-colors hover:text-[var(--ink)]"
        style={{ borderColor: "var(--hair)", color: "var(--ink-3)" }}
      >
        All Settings
      </button>
    </motion.div>
  );
}

function TransportButton({
  label,
  onClick,
  d,
  filled,
  primary,
  disabled,
}: {
  label: string;
  onClick: () => void;
  d: string;
  filled?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-6 w-6 place-items-center rounded-md transition-colors enabled:hover:bg-[rgba(255,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-35"
      style={{ color: primary ? "var(--ink)" : "var(--ink-2)" }}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <path d={d} />
      </svg>
    </button>
  );
}

function Toggle({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${label} — ${hint}`}
      onClick={() => onChange(!on)}
      className="rounded-[10px] border p-2.5 text-left transition-colors"
      style={{
        borderColor: on ? "var(--accent-dim)" : "var(--hair)",
        background: on ? "var(--accent-glow)" : "rgba(255,255,255,0.03)",
      }}
    >
      <div className="text-[11.5px] font-medium" style={{ color: on ? "var(--accent)" : "var(--ink-2)" }}>
        {label}
      </div>
      <div className="mt-0.5 text-[10px]" style={{ color: "var(--ink-4)" }}>
        {hint}
      </div>
    </button>
  );
}
