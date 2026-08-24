import { useEffect, useRef } from "react";
import { audio } from "../../kernel/audio";
import {
  formatTime,
  musicStore,
  sourceLabel,
  usePlaybackPosition,
  useMusic,
  type NowPlaying,
} from "../../kernel/musicStore";
import { loopbackProblem, loopbackUrl, redirectUri } from "../../spotify/config";
import { settingsStore, useSettings } from "../../kernel/settingsStore";
import type { AppProps } from "../../kernel/appRegistry";
import { AppFrame, AppScroll, Label } from "../../shell/ApplicationShell";
import { CoverArt } from "./CoverArt";
import { TrackSearch } from "./TrackSearch";

/**
 * What the left column is actually showing. An account's own history is real
 * data, but it is not a playlist somebody curated — the heading says which.
 */
const PLAYLIST_LABEL: Record<string, string> = {
  system: "Library",
  configured: "Playlist",
  recent: "Recently played",
  top: "Your top tracks",
  live: "Now playing",
};

export default function MusicApp({ focused }: AppProps) {
  const music = useMusic();
  const settings = useSettings();
  const track = musicStore.current();
  const list = musicStore.list();
  const pos = usePlaybackPosition(true);
  const progress = track ? Math.min(1, pos / track.duration) : 0;

  // bring a stored Spotify session back up when Signal opens
  useEffect(() => {
    void musicStore.initSpotify();
  }, []);

  return (
    <AppFrame>
      <div className="flex min-h-0 flex-1">
        {/* library */}
        <div
          className="flex w-[232px] max-w-[44%] shrink-0 flex-col border-r"
          style={{ borderColor: "var(--hair)", background: "rgba(0,0,0,0.18)" }}
        >
          <SourcePanel music={music} />
          <TrackSearch
            playlist={list}
            canSearchRemote={music.backend === "spotify" && music.spotify.phase === "ready"}
            onConnect={
              music.spotify.phase === "unconfigured"
                ? undefined
                : () => void musicStore.connectSpotify()
            }
            focused={focused}
          />

          <div className="px-3 pb-1 pt-3">
            <Label>{PLAYLIST_LABEL[music.backend === "spotify" ? music.spotify.origin ?? "live" : "system"]}</Label>
            <div className="mt-1 truncate text-[12.5px]" style={{ color: "var(--ink-2)" }}>
              {track?.album || "—"}
            </div>
          </div>
          <AppScroll className="px-2 pb-2">
            {list.length === 0 && <EmptyPlaylist backend={music.backend} />}
            {list.map((t: NowPlaying, i: number) => {
              const active = i === music.trackIndex;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => musicStore.select(i)}
                  aria-current={active}
                  className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                  style={{ background: active ? "rgba(255,255,255,0.075)" : "transparent" }}
                >
                  <span className="shrink-0 overflow-hidden rounded-[4px]">
                    <CoverArt track={t} size={30} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[12.5px]"
                      style={{ color: active ? "var(--ink)" : "var(--ink-2)" }}
                    >
                      {t.title}
                    </span>
                    <span
                      className="block truncate text-[10.5px] leading-tight"
                      style={{ color: "var(--ink-4)" }}
                    >
                      {t.artist}
                    </span>
                  </span>
                  {active && music.playing ? (
                    <Bars />
                  ) : (
                    <span className="meta shrink-0 tabular-nums" style={{ color: "var(--ink-4)" }}>
                      {formatTime(t.duration)}
                    </span>
                  )}
                </button>
              );
            })}
          </AppScroll>
        </div>

        {/* now playing */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(90% 70% at 50% 0%, hsl(${track?.hue ?? 40} 40% 30% / 0.28), transparent 68%)`,
            }}
          />

          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 py-6">
            <div
              className="overflow-hidden rounded-[14px] border"
              style={{
                borderColor: "var(--hair-strong)",
                boxShadow: "0 24px 60px -20px rgba(0,0,0,0.9)",
                width: "min(216px, 42vh)",
                height: "min(216px, 42vh)",
              }}
            >
              <CoverArt track={track} size={216} />
            </div>

            <div className="max-w-full px-4 text-center">
              <h2
                className="font-display m-0 truncate text-[20px] font-bold leading-tight"
                style={{ letterSpacing: "-0.03em", color: track ? "var(--ink)" : "var(--ink-3)" }}
              >
                {track?.title ?? "Nothing loaded"}
              </h2>
              <p className="meta mt-1.5 truncate" style={{ color: "var(--ink-3)" }}>
                {track ? [track.artist, track.album].filter(Boolean).join(" · ") : sourceLabel(music)}
              </p>
            </div>

            {/* the local engine is the only source whose waveform we can read;
                Spotify audio is rendered by the SDK, not routed through us */}
            {music.backend === "system" && (
              <Waveform active={focused && music.playing} hue={track?.hue ?? 40} />
            )}
          </div>

          {/* transport */}
          <div className="relative border-t px-6 py-4" style={{ borderColor: "var(--hair)" }}>
            <Scrubber
              progress={progress}
              duration={track?.duration ?? 0}
              position={track ? pos : 0}
              onSeek={(t) => musicStore.seek(t)}
            />

            <div className="mt-3 flex items-center gap-2">
              <Transport label="Previous track" onClick={() => musicStore.prev()} d="M12.5 4 6 8.5l6.5 4.5V4ZM4.5 4v9" />
              <Transport
                label={music.playing ? "Pause" : "Play"}
                onClick={() => musicStore.toggle()}
                d={music.playing ? "M6 3.5v10M11 3.5v10" : "M5.5 3.5v10l8-5-8-5Z"}
                filled={!music.playing}
                big
              />
              <Transport label="Next track" onClick={() => musicStore.next()} d="M4.5 4 11 8.5 4.5 13V4ZM12.5 4v9" />

              <div className="ml-auto flex w-[132px] items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: "var(--ink-3)" }} aria-hidden>
                  <path d="M4 6H2v4h2l3.5 3V3L4 6Z" strokeLinejoin="round" />
                  <path d="M10.5 6a3 3 0 0 1 0 4" strokeLinecap="round" />
                </svg>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.02}
                  value={settings.soundEnabled ? settings.volume : 0}
                  aria-label="Volume"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    settingsStore.set({ volume: v, soundEnabled: v > 0 });
                    audio.setEnabled(v > 0);
                    audio.setVolume(v);
                    musicStore.setVolume(v);
                  }}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full"
                  style={{
                    background: `linear-gradient(90deg, var(--ink-2) ${(settings.soundEnabled ? settings.volume : 0) * 100}%, var(--hair-strong) 0%)`,
                  }}
                />
              </div>
            </div>

            <p className="meta mt-3 truncate" style={{ color: "var(--ink-4)" }}>
              {sourceLabel(music)}
            </p>
          </div>
        </div>
      </div>
    </AppFrame>
  );
}

/**
 * Where the audio comes from, stated plainly.
 *
 * Every phase of the Spotify connection has its own honest copy — not
 * configured, not connected, connecting, connected, or refused — and none of
 * them pretends a track is playing that is not. The local engine stays
 * reachable underneath as a clearly-labelled alternative, never as a stand-in.
 */
function SourcePanel({ music }: { music: ReturnType<typeof useMusic> }) {
  const sp = music.spotify;
  // sign-in cannot work from a host Spotify will not accept as a redirect URI,
  // and the failure otherwise only shows up on Spotify's own error page
  const loopback = sp.phase === "ready" ? null : loopbackProblem();

  return (
    <div className="border-b px-3 py-3" style={{ borderColor: "var(--hair)" }}>
      <div className="flex items-center gap-2">
        <Dot phase={sp.phase} />
        <Label>Source</Label>
        {music.backend === "spotify" ? (
          <span className="meta ml-auto" style={{ color: "var(--accent)" }}>
            Spotify
          </span>
        ) : (
          <span className="meta ml-auto" style={{ color: "var(--ink-4)" }}>
            System audio
          </span>
        )}
      </div>

      <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-3)" }}>
        {sp.phase === "unconfigured" &&
          "Spotify is not configured for this build. Add VITE_SPOTIFY_CLIENT_ID and this becomes a real Spotify player."}
        {sp.phase === "disconnected" && "Not connected. Signal can stream from Spotify Premium."}
        {sp.phase === "connecting" && "Connecting to Spotify…"}
        {sp.phase === "ready" &&
          `Connected as ${sp.account ?? "Spotify"}${
            sp.origin === "recent"
              ? " — playing from your recent listening."
              : sp.origin === "top"
                ? " — playing from your top tracks."
                : "."
          }`}
        {sp.phase === "error" && (sp.error ?? "Spotify is unavailable.")}
      </p>

      {/* Until the connection is actually up, the single most useful fact is
          which redirect URI this build will send Spotify — a deployed origin
          that is not on the dashboard's allow-list fails with nothing else to
          go on. */}
      {sp.phase !== "ready" && (
        <p
          className="mt-1.5 break-all font-mono text-[10px] leading-relaxed"
          style={{ color: "var(--ink-4)" }}
        >
          Redirect URI · {redirectUri()}
        </p>
      )}

      {loopback && sp.phase !== "unconfigured" && (
        <div
          className="mt-2 rounded-md border p-2"
          style={{ borderColor: "var(--accent-dim)", background: "var(--accent-glow)" }}
        >
          <p className="m-0 text-[11px] leading-snug" style={{ color: "var(--accent)" }}>
            {loopback}
          </p>
          <a
            href={loopbackUrl()}
            className="meta mt-1.5 inline-block underline"
            style={{ color: "var(--accent)" }}
          >
            Reopen on 127.0.0.1
          </a>
        </div>
      )}
      {sp.phase !== "unconfigured" && sp.error && sp.phase !== "error" && (
        <p className="meta mt-1.5" style={{ color: "var(--ink-4)" }}>
          {sp.error}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {(sp.phase === "disconnected" || sp.phase === "error") && !loopback && (
          <PanelButton
            primary
            onClick={() => void musicStore.connectSpotify()}
            label={sp.phase === "error" ? "Try again" : "Connect Spotify"}
          />
        )}
        {sp.phase === "ready" && music.backend !== "spotify" && (
          <PanelButton primary onClick={() => musicStore.useSpotify()} label="Use Spotify" />
        )}
        {sp.phase === "ready" && (
          <PanelButton onClick={() => musicStore.disconnectSpotify()} label="Disconnect" />
        )}
        {music.backend === "spotify" && (
          <PanelButton onClick={() => musicStore.useSystemAudio()} label="System audio" />
        )}
      </div>
    </div>
  );
}

function Dot({ phase }: { phase: string }) {
  const color =
    phase === "ready"
      ? "var(--accent)"
      : phase === "connecting"
        ? "var(--ink-3)"
        : phase === "error"
          ? "#E0554E"
          : "var(--ink-4)";
  return (
    <span
      aria-hidden
      className="block h-[6px] w-[6px] shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

function PanelButton({
  label,
  onClick,
  primary,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="meta rounded-md border px-2 py-1.5 transition-colors"
      style={{
        borderColor: primary ? "var(--accent-dim)" : "var(--hair)",
        background: primary ? "var(--accent-glow)" : "transparent",
        color: primary ? "var(--accent)" : "var(--ink-3)",
      }}
    >
      {label}
    </button>
  );
}

function EmptyPlaylist({ backend }: { backend: string }) {
  return (
    <div
      className="m-1 rounded-md border border-dashed p-3"
      style={{ borderColor: "var(--hair)" }}
    >
      <div className="text-[11.5px]" style={{ color: "var(--ink-2)" }}>
        No tracks configured
      </div>
      <p className="meta mt-1.5 leading-relaxed" style={{ color: "var(--ink-4)" }}>
        {backend === "spotify"
          ? "Signal is mirroring whatever this Spotify account plays. Add track links to src/os/spotify/tracks.ts for a fixed playlist."
          : "The local engine has no tracks loaded."}
      </p>
    </div>
  );
}

function Scrubber({
  progress,
  duration,
  position,
  onSeek,
}: {
  progress: number;
  duration: number;
  position: number;
  onSeek: (t: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const seekFrom = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * duration);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="meta w-[34px] tabular-nums" style={{ color: "var(--ink-4)" }}>
        {formatTime(position)}
      </span>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
        onPointerDown={(e) => seekFrom(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") onSeek(Math.min(duration, position + 5));
          if (e.key === "ArrowLeft") onSeek(Math.max(0, position - 5));
        }}
        className="group relative h-4 flex-1 cursor-pointer"
      >
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ background: "var(--hair-strong)" }} />
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
          style={{ width: `${progress * 100}%`, background: "var(--ink)" }}
        />
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `${progress * 100}%`, background: "var(--ink)" }}
        />
      </div>
      <span className="meta w-[34px] text-right tabular-nums" style={{ color: "var(--ink-4)" }}>
        {formatTime(duration)}
      </span>
    </div>
  );
}

/** Live output of the music bus — this is the actual signal, not a loop. */
function Waveform({ active, hue }: { active: boolean; hue: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const analyser = audio.getAnalyser();
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const data = new Uint8Array(analyser?.fftSize ?? 1024);

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (el.width !== w * dpr || el.height !== h * dpr) {
        el.width = w * dpr;
        el.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `hsl(${hue} 42% 68% / ${active ? 0.85 : 0.28})`;

      if (analyser && active) {
        analyser.getByteTimeDomainData(data);
        for (let i = 0; i < w; i++) {
          const v = data[Math.floor((i / w) * data.length)] / 128 - 1;
          const y = h / 2 + v * (h / 2) * 0.9;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i, y);
        }
      } else {
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
      }
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active, hue]);

  return <canvas ref={canvas} className="h-8 w-full max-w-[320px]" aria-hidden />;
}

function Bars() {
  return (
    <span className="flex shrink-0 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-[2px] rounded-full"
          style={{
            height: 8,
            background: "var(--accent)",
            animation: `dosBars 1s ${i * 0.18}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`@keyframes dosBars{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}`}</style>
    </span>
  );
}

function Transport({
  label,
  onClick,
  d,
  filled,
  big,
}: {
  label: string;
  onClick: () => void;
  d: string;
  filled?: boolean;
  big?: boolean;
}) {
  const size = big ? 38 : 30;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid place-items-center rounded-full border transition-colors hover:bg-[rgba(255,255,255,0.08)]"
      style={{
        width: size,
        height: size,
        borderColor: big ? "var(--hair-strong)" : "transparent",
        color: "var(--ink)",
      }}
    >
      <svg
        width={big ? 17 : 15}
        height={big ? 17 : 15}
        viewBox="0 0 17 17"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d={d} />
      </svg>
    </button>
  );
}
