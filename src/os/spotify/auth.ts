/**
 * Authorization Code with PKCE.
 *
 * No client secret is used, stored, or required — the verifier proves the
 * exchange came from the same browser that started it. Tokens live in
 * localStorage so a reload does not force a second round trip, and every access
 * token is refreshed a minute before it actually expires so a request never
 * fails on a clock edge.
 */
import { SPOTIFY_ACCOUNTS, SPOTIFY_CLIENT_ID, SCOPES, isConfigured, redirectUri } from "./config";

const TOKEN_KEY = "dos:spotify:token";
const VERIFIER_KEY = "dos:spotify:verifier";

export type Tokens = {
  accessToken: string;
  refreshToken: string | null;
  /** epoch ms */
  expiresAt: number;
};

export class SpotifyAuthError extends Error {}

/* ── storage ─────────────────────────────────────────────────────── */

function readTokens(): Tokens | null {
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Tokens;
    return parsed.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

function writeTokens(t: Tokens | null) {
  try {
    if (t) window.localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode — the session simply will not survive a reload */
  }
}

/* ── PKCE primitives ─────────────────────────────────────────────── */

function randomVerifier(length = 96): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/* ── flow ────────────────────────────────────────────────────────── */

/** Send the browser to Spotify's consent screen. */
export async function beginLogin(): Promise<void> {
  if (!isConfigured()) throw new SpotifyAuthError("No Spotify client id is configured.");
  const verifier = randomVerifier();
  const challenge = await challengeFor(verifier);
  try {
    window.sessionStorage.setItem(VERIFIER_KEY, verifier);
  } catch {
    throw new SpotifyAuthError("Session storage is unavailable, so sign-in cannot be completed.");
  }

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.assign(`${SPOTIFY_ACCOUNTS}/authorize?${params}`);
}

async function exchange(body: Record<string, string>): Promise<Tokens> {
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID, ...body }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new SpotifyAuthError(
      json.error_description ?? json.error ?? `Spotify rejected the token request (${res.status}).`,
    );
  }
  const tokens: Tokens = {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? readTokens()?.refreshToken ?? null,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  writeTokens(tokens);
  return tokens;
}

/**
 * Complete a redirect back from Spotify, if this load is one.
 *
 * Returns `"signed-in"`, `"denied"` (the user said no, or Spotify errored), or
 * `"none"`. In every case the query string is scrubbed so a refresh does not
 * try to reuse a spent authorisation code.
 */
export async function consumeRedirect(): Promise<"signed-in" | "denied" | "none"> {
  if (typeof window === "undefined") return "none";
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return "none";

  const clean = () =>
    window.history.replaceState({}, "", window.location.pathname + window.location.hash);

  if (error || !code) {
    clean();
    return "denied";
  }

  let verifier: string | null = null;
  try {
    verifier = window.sessionStorage.getItem(VERIFIER_KEY);
    window.sessionStorage.removeItem(VERIFIER_KEY);
  } catch {
    /* ignore */
  }
  clean();
  if (!verifier) return "denied";

  try {
    await exchange({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    });
    return "signed-in";
  } catch {
    return "denied";
  }
}

/** True when a token (possibly expired but refreshable) is on hand. */
export function hasSession(): boolean {
  const t = readTokens();
  return !!t && (t.expiresAt > Date.now() || !!t.refreshToken);
}

let refreshing: Promise<Tokens> | null = null;

/**
 * A currently-valid access token, refreshing if needed. Concurrent callers
 * share one refresh rather than racing each other into a rate limit.
 */
export async function getAccessToken(): Promise<string> {
  const tokens = readTokens();
  if (!tokens) throw new SpotifyAuthError("Not signed in to Spotify.");
  if (tokens.expiresAt - 60_000 > Date.now()) return tokens.accessToken;

  if (!tokens.refreshToken) {
    logout();
    throw new SpotifyAuthError("The Spotify session expired. Connect again.");
  }

  refreshing ??= exchange({
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
  }).finally(() => {
    refreshing = null;
  });

  try {
    return (await refreshing).accessToken;
  } catch (err) {
    logout();
    throw err;
  }
}

export function logout() {
  writeTokens(null);
}
