/**
 * Spotify configuration.
 *
 * The client id is a *public* identifier — Authorization Code with PKCE exists
 * precisely so a browser app never needs a client secret, and there is none
 * anywhere in this codebase. Set it at build time:
 *
 *   .env.local
 *   VITE_SPOTIFY_CLIENT_ID=your_client_id
 *
 * Then add the redirect URI printed by `redirectUri()` to the app's allow-list
 * in the Spotify developer dashboard.
 */

export const SPOTIFY_CLIENT_ID = (
  (import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined) ?? ""
).trim();

/**
 * Where Spotify sends the browser back to. It has to match the dashboard entry
 * byte for byte, so it is derived from the deployed base path rather than typed
 * twice.
 */
export function redirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

/**
 * Only what the player actually needs:
 * - streaming + the two connect scopes: the Web Playback SDK device
 * - read/modify playback state: transport, seek, volume
 * - read-private/read-email: the account tier check, so an unsupported account
 *   can be reported honestly instead of failing silently
 */
export const SCOPES = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-read-private",
  "user-read-email",
  // used only when tracks.ts is left empty: Signal then plays the account's
  // own recent listening rather than sitting on an empty playlist
  "user-read-recently-played",
  "user-top-read",
].join(" ");

/**
 * Spotify rejects `http://localhost` redirect URIs — insecure redirects have to
 * use the literal loopback address. Opening the dev server on the wrong host is
 * otherwise an invisible failure that only shows up as INVALID_CLIENT on the
 * consent screen, so the app says so itself.
 */
export function loopbackProblem(): string | null {
  if (typeof window === "undefined") return null;
  const { hostname, protocol } = window.location;
  if (protocol === "https:") return null;
  if (hostname === "127.0.0.1" || hostname === "[::1]") return null;
  return `Spotify does not accept "${hostname}" in an http redirect URI. Open this page on 127.0.0.1 instead.`;
}

/** The same page, on the host Spotify will actually accept. */
export function loopbackUrl(): string {
  const u = new URL(window.location.href);
  u.hostname = "127.0.0.1";
  return u.toString();
}

export const isConfigured = () => SPOTIFY_CLIENT_ID.length > 0;

export const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";
export const SPOTIFY_API = "https://api.spotify.com/v1";
