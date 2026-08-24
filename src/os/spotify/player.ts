/**
 * The Web Playback SDK device.
 *
 * This is what makes the audio come out of *this* tab rather than out of
 * whatever else the account is signed in to. The SDK script is loaded on
 * demand — never on the landing page, never for a visitor who does not open
 * Signal — and every failure mode it reports is surfaced verbatim rather than
 * swallowed, because "Premium required" is a real answer and a spinner is not.
 */
import { getAccessToken } from "./auth";

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";

/* the slice of the SDK surface this system uses */
type SdkTrack = {
  id: string | null;
  uri: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album: { name: string; images: { url: string; width?: number }[] };
};

export type SdkState = {
  paused: boolean;
  position: number;
  duration: number;
  track_window: { current_track: SdkTrack | null };
};

type SdkPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, cb: (arg: never) => void) => boolean;
  getCurrentState: () => Promise<SdkState | null>;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  setVolume: (v: number) => Promise<void>;
};

declare global {
  interface Window {
    Spotify?: { Player: new (opts: Record<string, unknown>) => SdkPlayer };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (window.Spotify) return Promise.resolve();
  sdkPromise ??= new Promise<void>((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.onerror = () =>
      reject(new Error("The Spotify player could not be loaded — check the network or a blocker."));
    document.head.appendChild(script);
    // the SDK is silent if the account/browser is unsupported; do not hang
    window.setTimeout(
      () => reject(new Error("The Spotify player did not start. This browser may not support it.")),
      15_000,
    );
  });
  return sdkPromise;
}

export type PlayerEvents = {
  onReady: (deviceId: string) => void;
  onNotReady: () => void;
  onState: (state: SdkState | null) => void;
  onError: (message: string, fatal: boolean) => void;
};

export type Device = {
  player: SdkPlayer;
  destroy: () => void;
};

/** Create and connect the device. Rejects with a human-readable reason. */
export async function createDevice(volume: number, events: PlayerEvents): Promise<Device> {
  await loadSdk();
  if (!window.Spotify) throw new Error("The Spotify player is unavailable in this browser.");

  const player = new window.Spotify.Player({
    name: "DOS — Signal",
    volume,
    getOAuthToken: (cb: (token: string) => void) => {
      getAccessToken()
        .then(cb)
        .catch(() => events.onError("The Spotify session expired. Connect again.", true));
    },
  });

  player.addListener("ready", (({ device_id }: { device_id: string }) =>
    events.onReady(device_id)) as never);
  player.addListener("not_ready", (() => events.onNotReady()) as never);
  player.addListener("player_state_changed", ((state: SdkState | null) =>
    events.onState(state)) as never);

  player.addListener("initialization_error", (({ message }: { message: string }) =>
    events.onError(message, true)) as never);
  player.addListener("authentication_error", (({ message }: { message: string }) =>
    events.onError(message, true)) as never);
  player.addListener("account_error", (() =>
    events.onError(
      "This Spotify account cannot stream in the browser — the Web Playback SDK requires Premium.",
      true,
    )) as never);
  player.addListener("playback_error", (({ message }: { message: string }) =>
    events.onError(message, false)) as never);

  const connected = await player.connect();
  if (!connected) throw new Error("The Spotify player refused to connect.");

  return {
    player,
    destroy: () => player.disconnect(),
  };
}

/**
 * `connect()` resolving only means the socket opened — the device id arrives
 * later, on the `ready` event, and until it does there is nothing to play to.
 * Declaring the player usable before that is the difference between a working
 * transport and three buttons that quietly do nothing.
 */
export function waitForDevice(
  getDeviceId: () => string | null,
  getFatalError: () => string | null,
  timeoutMs = 12_000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      const id = getDeviceId();
      if (id) return resolve(id);
      const err = getFatalError();
      if (err) return reject(new Error(err));
      if (Date.now() - started > timeoutMs) {
        return reject(
          new Error("Spotify never handed this tab a device. Check that the account is Premium."),
        );
      }
      window.setTimeout(tick, 120);
    };
    tick();
  });
}
