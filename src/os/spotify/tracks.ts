/**
 * ════════════════════════════════════════════════════════════════════
 *  THE ONE FILE TO EDIT TO CHANGE WHAT SIGNAL PLAYS
 * ════════════════════════════════════════════════════════════════════
 *
 * Paste Spotify links, URIs or bare IDs into `SPOTIFY_TRACKS` below. All three
 * forms work — the parser normalises them:
 *
 *   "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
 *   "spotify:track:4cOdK2wGLETKBW3PvgPWqT"
 *   "4cOdK2wGLETKBW3PvgPWqT"
 *
 * To play a whole playlist or album instead of a hand-picked list, set
 * `SPOTIFY_CONTEXT` to its link/URI and leave `SPOTIFY_TRACKS` empty.
 *
 * Nothing else in the system hard-codes a track. Titles, artists, album names,
 * artwork and durations are all fetched live from Spotify — this file only ever
 * holds identifiers, so it can never fall out of sync with reality.
 *
 * Leaving both empty is a supported state: Signal then plays whatever is
 * already queued on the connected Spotify account, and says so.
 */

/** Tracks to load into Signal's playlist, in order. */
export const SPOTIFY_TRACKS: string[] = [
  // ── add your tracks here, e.g.
  // "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
];

/** A playlist or album to play instead of the list above. */
export const SPOTIFY_CONTEXT: string | null = null;

/* ── parsing ─────────────────────────────────────────────────────── */

const ID = /[A-Za-z0-9]{22}/;

/** Pull a bare Spotify id out of a link, a URI, or an id. */
export function parseId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(ID);
  return match ? match[0] : null;
}

/** Pull the resource type out of a link or URI (`track`, `playlist`, `album`). */
export function parseKind(input: string): "track" | "playlist" | "album" | null {
  const m = input.match(/(track|playlist|album)[/:]/);
  return (m?.[1] as "track" | "playlist" | "album" | undefined) ?? null;
}

/** The configured track ids, de-duplicated and validated. */
export function configuredTrackIds(): string[] {
  const seen = new Set<string>();
  for (const entry of SPOTIFY_TRACKS) {
    const id = parseId(entry);
    if (id) seen.add(id);
  }
  return [...seen];
}

/** The configured playlist/album URI, if one was given. */
export function configuredContextUri(): string | null {
  if (!SPOTIFY_CONTEXT) return null;
  const id = parseId(SPOTIFY_CONTEXT);
  const kind = parseKind(SPOTIFY_CONTEXT) ?? "playlist";
  return id ? `spotify:${kind}:${id}` : null;
}
