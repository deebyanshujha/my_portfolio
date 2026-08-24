import { useEffect, useState, useSyncExternalStore } from "react";
import { TRACKS, audio } from "./audio";
import { settingsStore } from "./settingsStore";
import * as auth from "../spotify/auth";
import * as api from "../spotify/api";
import {
  createDevice,
  waitForDevice,
  type Device,
  type SdkState,
} from "../spotify/player";
import { isConfigured } from "../spotify/config";
import { configuredContextUri, configuredTrackIds } from "../spotify/tracks";

/**
 * The one source of truth for playback.
 *
 * Signal, the Control Centre and the menu bar all read this store — none of
 * them keeps its own idea of what is playing, and none of them invents a track
 * when nothing is. There are exactly two backends:
 *
 *   spotify — real Spotify audio through the Web Playback SDK
 *   system  — the local Web Audio engine, generated live in this tab
 *
 * Both are genuine playback. Neither is ever labelled as the other: when
 * Spotify is not connected the UI says so and offers to connect, rather than
 * dressing the synth up as somebody's streaming account.
 */

export type Backend = "spotify" | "system";

export type SpotifyPhase =
  /** no client id was compiled in */
  | "unconfigured"
  | "disconnected"
  | "connecting"
  | "ready"
  | "error";

export type NowPlaying = {
  id: string;
  title: string;
  artist: string;
  album: string;
  /** seconds */
  duration: number;
  artworkUrl: string | null;
  /** drives the generated cover when there is no artwork */
  hue: number;
  uri?: string;
};

type SpotifyState = {
  phase: SpotifyPhase;
  error: string | null;
  account: string | null;
  premium: boolean;
  deviceId: string | null;
  tracks: NowPlaying[];
  /** where the playlist came from, so the UI can say so rather than imply a curation */
  origin: "configured" | "recent" | "top" | "live" | null;
};

type MusicState = {
  backend: Backend;
  playing: boolean;
  /** true once the visitor has started playback at least once */
  engaged: boolean;
  trackIndex: number;
  spotify: SpotifyState;
};

/** A stable hue per id, so a cover without artwork is at least consistent. */
function hueFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

const SYSTEM_TRACKS: NowPlaying[] = TRACKS.map((t) => ({
  id: t.id,
  title: t.title,
  artist: t.artist,
  album: t.album,
  duration: t.duration,
  artworkUrl: null,
  hue: t.hue,
}));

const fromApi = (t: api.SpotifyTrack): NowPlaying => ({
  id: t.id,
  title: t.title,
  artist: t.artist,
  album: t.album,
  duration: t.duration,
  artworkUrl: t.artworkUrl,
  hue: hueFor(t.id),
  uri: t.uri,
});

let state: MusicState = {
  backend: "system",
  playing: false,
  engaged: false,
  trackIndex: 0,
  spotify: {
    phase: isConfigured() ? "disconnected" : "unconfigured",
    error: null,
    account: null,
    premium: false,
    deviceId: null,
    tracks: [],
    origin: null,
  },
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function commit(next: Partial<MusicState>) {
  state = { ...state, ...next };
  emit();
}

function commitSpotify(next: Partial<SpotifyState>) {
  state = { ...state, spotify: { ...state.spotify, ...next } };
  emit();
}

/* ── Spotify device plumbing ─────────────────────────────────────── */

let device: Device | null = null;
/** set by a fatal SDK error so the device wait can fail fast instead of timing out */
let fatalError: string | null = null;
/** initSpotify is called from both the shell and Signal; only the first does work */
let initialised = false;
/** last position reported by the SDK, and when we heard it */
let sdkPosition = 0;
let sdkPositionAt = 0;
let sdkDuration = 0;

function onSdkState(s: SdkState | null) {
  if (!s) return;
  const t = s.track_window.current_track;
  sdkPosition = s.position / 1000;
  sdkPositionAt = performance.now();
  sdkDuration = s.duration / 1000;

  if (t) {
    const art = t.album.images.length > 1 ? t.album.images[1] : t.album.images[0];
    const playingNow: NowPlaying = {
      id: t.id ?? t.uri,
      uri: t.uri,
      title: t.name,
      artist: t.artists.map((a) => a.name).join(", "),
      album: t.album.name,
      duration: Math.round(t.duration_ms / 1000),
      artworkUrl: art?.url ?? null,
      hue: hueFor(t.id ?? t.uri),
    };
    // keep the playlist in step with whatever the account is actually playing,
    // including tracks queued from outside this tab
    const tracks = state.spotify.tracks.slice();
    const at = tracks.findIndex((x) => x.uri === playingNow.uri);
    if (at === -1) {
      tracks.push(playingNow);
      state = {
        ...state,
        trackIndex: tracks.length - 1,
        spotify: { ...state.spotify, tracks },
      };
    } else {
      state = { ...state, trackIndex: at, spotify: { ...state.spotify, tracks } };
    }
  }

  state = { ...state, playing: !s.paused, engaged: state.engaged || !s.paused };
  emit();
}

/**
 * Fill the playlist.
 *
 * tracks.ts wins whenever it has anything in it. When it is empty — the shipped
 * state — fall back to the connected account's own recent listening, then its
 * top tracks. That is the listener's real data, labelled as such; the
 * alternative is a connected player with an empty shelf and three dead buttons.
 */
async function loadLibrary() {
  const context = configuredContextUri();
  const ids = configuredTrackIds();
  try {
    if (context) {
      commitSpotify({
        tracks: (await api.getContextTracks(context)).map(fromApi),
        origin: "configured",
      });
      return;
    }
    if (ids.length) {
      commitSpotify({ tracks: (await api.getTracks(ids)).map(fromApi), origin: "configured" });
      return;
    }

    const recent = await api.getRecentlyPlayed().catch(() => []);
    if (recent.length) {
      commitSpotify({ tracks: recent.map(fromApi), origin: "recent" });
      return;
    }
    const top = await api.getTopTracks().catch(() => []);
    if (top.length) {
      commitSpotify({ tracks: top.map(fromApi), origin: "top" });
      return;
    }
    // a silent account: mirror whatever it plays next, from wherever
    commitSpotify({ origin: "live" });
  } catch (err) {
    commitSpotify({ error: err instanceof Error ? err.message : String(err) });
  }
}

async function attachDevice(): Promise<string> {
  const settings = settingsStore.get();
  fatalError = null;

  if (!device) {
    device = await createDevice(settings.soundEnabled ? settings.volume : 0, {
      onReady: (deviceId) => {
        commitSpotify({ deviceId, error: null });
        // make this tab the account's active device, without starting anything
        void api.transferPlayback(deviceId, false).catch(() => {});
      },
      onNotReady: () => commitSpotify({ deviceId: null }),
      onState: onSdkState,
      onError: (message, fatal) => {
        if (fatal) fatalError = message;
        commitSpotify({ error: message, phase: fatal ? "error" : state.spotify.phase });
        if (fatal) commit({ backend: "system", playing: false });
      },
    });
  }

  // connect() resolving only means the socket opened; the device id lands later
  return waitForDevice(
    () => state.spotify.deviceId,
    () => fatalError,
  );
}

/* ── position ────────────────────────────────────────────────────── */

function position(): number {
  if (state.backend !== "spotify") return audio.position();
  if (!state.playing) return sdkPosition;
  return Math.min(sdkDuration || Infinity, sdkPosition + (performance.now() - sdkPositionAt) / 1000);
}

/* ── the store ───────────────────────────────────────────────────── */

export const musicStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },

  /** The tracks of the active backend. */
  list: (): NowPlaying[] =>
    state.backend === "spotify" ? state.spotify.tracks : SYSTEM_TRACKS,

  /** What is loaded right now, or null when the active backend has nothing. */
  current(): NowPlaying | null {
    const list = musicStore.list();
    return list[state.trackIndex] ?? list[0] ?? null;
  },

  position,

  /* ── connection ───────────────────────────────────────────────── */

  /**
   * Finish a sign-in redirect and, if there is a session, bring the device up.
   * Safe to call more than once; only the first call does work.
   */
  async initSpotify() {
    if (!isConfigured() || initialised) return;
    initialised = true;
    const outcome = await auth.consumeRedirect();
    if (outcome === "denied") {
      initialised = false;
      commitSpotify({
        phase: "disconnected",
        error:
          "Spotify sign-in did not complete. Check that this exact page URL is a registered redirect URI.",
      });
      return;
    }
    if (outcome === "none" && !auth.hasSession()) {
      initialised = false;
      return;
    }
    await musicStore.connectSpotify();
  },

  /** Sign in, or bring the device up if already signed in. */
  async connectSpotify() {
    if (!isConfigured()) return;
    if (!auth.hasSession()) {
      try {
        await auth.beginLogin();
      } catch (err) {
        commitSpotify({
          phase: "error",
          error: err instanceof Error ? err.message : String(err),
        });
      }
      return;
    }

    commitSpotify({ phase: "connecting", error: null });
    try {
      const profile = await api.getProfile();
      commitSpotify({ account: profile.name, premium: profile.premium });
      if (!profile.premium) {
        commitSpotify({
          phase: "error",
          error:
            "Spotify only allows browser playback on Premium accounts. Signal will keep using System Audio.",
        });
        return;
      }
      await attachDevice();
      await loadLibrary();
      commitSpotify({ phase: "ready" });
      commit({ backend: "spotify", trackIndex: 0, playing: false });
    } catch (err) {
      initialised = false;
      commitSpotify({
        phase: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  disconnectSpotify() {
    device?.destroy();
    device = null;
    fatalError = null;
    initialised = false;
    auth.logout();
    audio.pause();
    state = {
      ...state,
      backend: "system",
      playing: false,
      trackIndex: 0,
      spotify: {
        phase: isConfigured() ? "disconnected" : "unconfigured",
        error: null,
        account: null,
        premium: false,
        deviceId: null,
        tracks: [],
        origin: null,
      },
    };
    emit();
  },

  /** Explicitly fall back to the local engine without dropping the session. */
  useSystemAudio() {
    if (state.backend === "system") return;
    void device?.player.pause().catch(() => {});
    commit({ backend: "system", playing: false, trackIndex: 0 });
  },

  useSpotify() {
    if (state.spotify.phase !== "ready") return;
    audio.pause();
    commit({ backend: "spotify", playing: false, trackIndex: 0 });
  },

  /* ── transport ────────────────────────────────────────────────── */

  play(index = state.trackIndex, from?: number) {
    if (state.backend === "spotify") {
      void musicStore.spotifyPlay(index, from);
      return;
    }
    const resumeAt = from ?? (index === state.trackIndex ? audio.position() : 0);
    audio.play(TRACKS[index], resumeAt >= TRACKS[index].duration ? 0 : resumeAt);
    commit({ trackIndex: index, playing: true, engaged: true });
  },

  async spotifyPlay(index: number, from?: number) {
    const { deviceId, tracks } = state.spotify;
    if (!deviceId) {
      commitSpotify({ error: "The Spotify device is not ready yet." });
      return;
    }
    try {
      const context = configuredContextUri();
      if (tracks.length) {
        if (context) await api.playContext(deviceId, context, index);
        else
          await api.playUris(
            deviceId,
            tracks.map((t) => t.uri!).filter(Boolean),
            index,
            Math.round((from ?? 0) * 1000),
          );
      } else {
        // nothing configured — resume whatever the account already has queued
        await api.resume(deviceId);
      }
      commitSpotify({ error: null });
      commit({ trackIndex: index, playing: true, engaged: true });
    } catch (err) {
      commitSpotify({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  pause() {
    if (state.backend === "spotify") {
      void device?.player.pause().catch(() => {});
    } else {
      audio.pause();
    }
    commit({ playing: false });
  },

  /**
   * Stop, as distinct from pause.
   *
   * Quitting Signal has to silence the machine — audio that outlives the
   * window that owns it is a bug, not a feature. The Spotify session and the
   * device are left intact: the account is still connected, so reopening
   * Signal picks up where it left off rather than making the visitor sign in
   * again.
   */
  stop() {
    if (state.backend === "spotify") {
      void device?.player.pause().catch(() => {});
    } else {
      audio.stop();
    }
    commit({ playing: false });
  },

  toggle() {
    if (state.playing) {
      musicStore.pause();
      return;
    }
    if (state.backend === "spotify") {
      // resume in place if the device already has this track loaded
      if (sdkDuration > 0) {
        void device?.player.resume().catch(() => {});
        commit({ playing: true, engaged: true });
      } else {
        void musicStore.spotifyPlay(state.trackIndex);
      }
      return;
    }
    musicStore.play();
  },

  select(index: number) {
    if (state.backend === "spotify") {
      void musicStore.spotifyPlay(index, 0);
      return;
    }
    audio.stop();
    musicStore.play(index, 0);
  },

  next() {
    const list = musicStore.list();
    if (!list.length) return;
    if (state.backend === "spotify" && !list.some((t) => t.uri)) return;
    musicStore.select((state.trackIndex + 1) % list.length);
  },

  prev() {
    const list = musicStore.list();
    if (!list.length) return;
    // restart the current track if we're more than 3s in — standard transport
    if (position() > 3) {
      if (state.backend === "spotify") void device?.player.seek(0).catch(() => {});
      else musicStore.play(state.trackIndex, 0);
      return;
    }
    musicStore.select((state.trackIndex - 1 + list.length) % list.length);
  },

  seek(seconds: number) {
    const track = musicStore.current();
    if (!track) return;
    const clamped = Math.max(0, Math.min(seconds, track.duration - 0.5));

    if (state.backend === "spotify") {
      sdkPosition = clamped;
      sdkPositionAt = performance.now();
      void device?.player.seek(Math.round(clamped * 1000)).catch(() => {});
      emit();
      return;
    }

    audio.play(track.id === TRACKS[state.trackIndex]?.id ? TRACKS[state.trackIndex] : TRACKS[0], clamped);
    if (state.playing) commit({ engaged: true });
    else {
      audio.pause();
      emit();
    }
  },

  /**
   * Play a track that is not in the current playlist — a search result.
   *
   * It is appended rather than replacing the list, so a search never quietly
   * throws away what was already queued.
   */
  async playTrack(track: NowPlaying) {
    if (state.backend !== "spotify" || !track.uri) return;
    const { deviceId } = state.spotify;
    if (!deviceId) {
      commitSpotify({ error: "The Spotify device is not ready yet." });
      return;
    }
    const tracks = state.spotify.tracks.slice();
    let at = tracks.findIndex((t) => t.uri === track.uri);
    if (at === -1) {
      tracks.push(track);
      at = tracks.length - 1;
      commitSpotify({ tracks });
    }
    await musicStore.spotifyPlay(at, 0);
  },

  /** Keep the Spotify device in step with the system volume slider. */
  setVolume(v: number) {
    void device?.player.setVolume(Math.max(0, Math.min(1, v))).catch(() => {});
  },
};

export function useMusic(): MusicState {
  return useSyncExternalStore(musicStore.subscribe, musicStore.get, () => state);
}

/**
 * Real playback position, polled on a frame loop only while a consumer is
 * mounted. The system backend advances its own generator; the Spotify backend
 * interpolates between SDK state events, which is what every native client
 * does too.
 */
export function usePlaybackPosition(active: boolean): number {
  const [pos, setPos] = useState(() => musicStore.position());
  const { playing, trackIndex, backend } = useMusic();

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      const p = musicStore.position();
      setPos(p);
      if (backend === "system" && playing && p >= TRACKS[trackIndex].duration) musicStore.next();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, playing, trackIndex, backend]);

  return pos;
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** One-line description of where the audio is coming from. */
export function sourceLabel(s: MusicState): string {
  if (s.backend === "spotify") return `Spotify · ${s.spotify.account ?? "connected"}`;
  return "System Audio · synthesised live in this tab";
}
