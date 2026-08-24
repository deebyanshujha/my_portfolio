/**
 * The Spotify Web API calls this system actually makes.
 *
 * Every one of them goes through `call()`, which attaches a fresh bearer token
 * and retries exactly once on a 401 — that covers the one case a token can go
 * stale mid-flight without turning a real authorisation failure into a loop.
 */
import { SPOTIFY_API } from "./config";
import { getAccessToken, logout } from "./auth";

export class SpotifyApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type SpotifyTrack = {
  id: string;
  uri: string;
  title: string;
  artist: string;
  album: string;
  /** seconds */
  duration: number;
  artworkUrl: string | null;
};

type RawTrack = {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  artists?: { name: string }[];
  album?: { name?: string; images?: { url: string; width: number }[] };
};

function toTrack(raw: RawTrack): SpotifyTrack {
  const images = raw.album?.images ?? [];
  // the middle image where there is one: full size is 640px of wasted bytes for
  // a 216px cover
  const art = images.length > 1 ? images[1] : images[0];
  return {
    id: raw.id,
    uri: raw.uri,
    title: raw.name,
    artist: (raw.artists ?? []).map((a) => a.name).join(", ") || "Unknown artist",
    album: raw.album?.name ?? "",
    duration: Math.round(raw.duration_ms / 1000),
    artworkUrl: art?.url ?? null,
  };
}

async function call<T>(path: string, init: RequestInit = {}, retry = true): Promise<T | null> {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (res.status === 401 && retry) return call<T>(path, init, false);
  if (res.status === 401) {
    logout();
    throw new SpotifyApiError("The Spotify session is no longer valid.", 401);
  }
  if (res.status === 403) {
    throw new SpotifyApiError(
      "Spotify refused the request. Web playback needs a Premium account.",
      403,
    );
  }
  if (res.status === 404) {
    throw new SpotifyApiError("No active Spotify device.", 404);
  }
  if (res.status === 429) {
    throw new SpotifyApiError("Spotify is rate-limiting this session. Try again shortly.", 429);
  }
  if (!res.ok) {
    throw new SpotifyApiError(`Spotify request failed (${res.status}).`, res.status);
  }
  if (res.status === 204) return null;
  return (await res.json().catch(() => null)) as T | null;
}

/* ── account ─────────────────────────────────────────────────────── */

export async function getProfile(): Promise<{ name: string; premium: boolean }> {
  const me = await call<{ display_name?: string; id: string; product?: string }>("/me");
  return {
    name: me?.display_name || me?.id || "Spotify",
    premium: me?.product === "premium",
  };
}

/* ── library ─────────────────────────────────────────────────────── */

/** Up to 50 tracks per call; the configured list is chunked for us. */
export async function getTracks(ids: string[]): Promise<SpotifyTrack[]> {
  const out: SpotifyTrack[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await call<{ tracks: (RawTrack | null)[] }>(`/tracks?ids=${chunk.join(",")}`);
    for (const raw of data?.tracks ?? []) if (raw) out.push(toTrack(raw));
  }
  return out;
}

/** The first page of a playlist or album, flattened to tracks. */
export async function getContextTracks(uri: string): Promise<SpotifyTrack[]> {
  const [, kind, id] = uri.split(":");
  if (kind === "album") {
    const album = await call<{ name: string; images?: { url: string; width: number }[]; tracks: { items: RawTrack[] } }>(
      `/albums/${id}`,
    );
    return (album?.tracks.items ?? []).map((raw) =>
      toTrack({ ...raw, album: { name: album?.name, images: album?.images } }),
    );
  }
  const data = await call<{ items: { track: RawTrack | null }[] }>(
    `/playlists/${id}/tracks?limit=50`,
  );
  return (data?.items ?? []).map((i) => i.track).filter((t): t is RawTrack => !!t).map(toTrack);
}

/**
 * The account's own recent listening.
 *
 * Used only when `tracks.ts` has been left empty. This is the listener's real
 * history, not a playlist invented on their behalf — and Signal labels it as
 * exactly that.
 */
export async function getRecentlyPlayed(): Promise<SpotifyTrack[]> {
  const data = await call<{ items: { track: RawTrack | null }[] }>(
    "/me/player/recently-played?limit=50",
  );
  const seen = new Set<string>();
  const out: SpotifyTrack[] = [];
  for (const item of data?.items ?? []) {
    if (!item.track || seen.has(item.track.id)) continue;
    seen.add(item.track.id);
    out.push(toTrack(item.track));
  }
  return out.slice(0, 25);
}

/** A brand-new account has no history; fall back to its top tracks. */
export async function getTopTracks(): Promise<SpotifyTrack[]> {
  const data = await call<{ items: RawTrack[] }>("/me/top/tracks?limit=25&time_range=short_term");
  return (data?.items ?? []).map(toTrack);
}

/**
 * Search the catalogue. Only reachable while a session is connected.
 *
 * Spotify caps `/v1/search` at 10 items per request, so depth comes from
 * `offset` rather than from asking for a bigger page — asking for 50 does not
 * fail loudly, it just returns 10 and quietly loses the rest.
 *
 * `total` is what Spotify claims exists, which is not the same as what it will
 * actually hand over; `more` is the honest answer to "is there another page",
 * taken from whether Spotify itself offered a `next` link.
 */
export const SEARCH_PAGE = 10;

export type SearchPage = {
  items: SpotifyTrack[];
  offset: number;
  total: number;
  more: boolean;
};

export async function searchTracks(query: string, offset = 0): Promise<SearchPage> {
  const params = new URLSearchParams({
    type: "track",
    limit: String(SEARCH_PAGE),
    offset: String(offset),
    q: query,
  });
  const data = await call<{
    tracks?: { items: (RawTrack | null)[]; total?: number; next?: string | null };
  }>(`/search?${params}`);

  const raw = data?.tracks;
  const items = (raw?.items ?? []).filter((t): t is RawTrack => !!t).map(toTrack);
  return {
    items,
    offset,
    total: raw?.total ?? items.length,
    more: !!raw?.next && items.length > 0,
  };
}

/* ── transport ───────────────────────────────────────────────────── */

export const transferPlayback = (deviceId: string, play = false) =>
  call("/me/player", {
    method: "PUT",
    body: JSON.stringify({ device_ids: [deviceId], play }),
  });

export const playUris = (deviceId: string, uris: string[], offset = 0, positionMs = 0) =>
  call(`/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    body: JSON.stringify({ uris, offset: { position: offset }, position_ms: positionMs }),
  });

export const playContext = (deviceId: string, contextUri: string, offset = 0) =>
  call(`/me/player/play?device_id=${deviceId}`, {
    method: "PUT",
    body: JSON.stringify({ context_uri: contextUri, offset: { position: offset } }),
  });

export const resume = (deviceId: string) =>
  call(`/me/player/play?device_id=${deviceId}`, { method: "PUT" });
