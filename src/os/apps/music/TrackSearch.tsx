import { useCallback, useEffect, useRef, useState } from "react";
import { musicStore, type NowPlaying } from "../../kernel/musicStore";
import { SpotifyApiError, searchTracks, SEARCH_PAGE } from "../../spotify/api";
import { CoverArt } from "./CoverArt";

/**
 * Signal's search.
 *
 * Two sources, deliberately ranked. The loaded playlist is filtered first and
 * always — it is instant, it works with no network and no Spotify session, and
 * it is the only group that can exist offline. When a session *is* connected,
 * the same query goes to Spotify's catalogue after a short pause and lands
 * underneath as a second group.
 *
 * The catalogue side is a real search, which means it has states: typing,
 * loading, results, nothing found, refused, and a page at a time. Spotify caps
 * `/v1/search` at ten items, so depth is `offset` and a Load-more, never a
 * bigger `limit` — a request for fifty comes back with ten and no complaint.
 *
 * Playback state is not duplicated here. Choosing a catalogue result hands the
 * track to `musicStore.playTrack`, which owns the queue and the device; this
 * component never learns what is playing.
 *
 * Keyboard: `/` or ⌘/Ctrl+K focuses the field from anywhere in the window,
 * arrows walk the results, Enter plays the highlighted one, Escape clears and
 * then releases focus.
 */

type Group = { label: string; tracks: NowPlaying[]; remote: boolean };

/** long enough that a typist is not searched on every keystroke */
const DEBOUNCE = 320;
const MIN_QUERY = 2;

const matches = (track: NowPlaying, q: string) =>
  `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(q);

type RemoteState = {
  /** the query these results belong to, so a stale response cannot land */
  query: string;
  tracks: NowPlaying[];
  offset: number;
  total: number;
  more: boolean;
  loading: "idle" | "first" | "more";
  error: string | null;
};

const EMPTY: RemoteState = {
  query: "",
  tracks: [],
  offset: 0,
  total: 0,
  more: false,
  loading: "idle",
  error: null,
};

export function TrackSearch({
  playlist,
  canSearchRemote,
  onConnect,
  focused,
}: {
  playlist: NowPlaying[];
  canSearchRemote: boolean;
  /** offered when the catalogue is out of reach */
  onConnect?: () => void;
  /** only the front window may claim the shortcuts */
  focused: boolean;
}) {
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<RemoteState>(EMPTY);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  /** whether the highlight moved by key — a hover must not scroll the list */
  const byKey = useRef(false);
  /** bumped on every new query, so an in-flight page cannot apply to the next */
  const run = useRef(0);

  const q = query.trim().toLowerCase();
  const local = q ? playlist.filter((t) => matches(t, q)) : [];

  const known = new Set(playlist.map((t) => t.uri));
  const fresh = remote.query === q ? remote.tracks.filter((t) => !known.has(t.uri)) : [];

  const groups: Group[] = [];
  if (local.length) groups.push({ label: "In this playlist", tracks: local, remote: false });
  if (fresh.length) groups.push({ label: "On Spotify", tracks: fresh, remote: true });
  const flat = groups.flatMap((g) => g.tracks);

  /** one page of catalogue results, appended or replacing */
  const fetchPage = useCallback(
    async (text: string, offset: number) => {
      const ticket = offset === 0 ? ++run.current : run.current;
      setRemote((r) => ({
        ...r,
        query: text,
        loading: offset === 0 ? "first" : "more",
        error: null,
        ...(offset === 0 ? { tracks: [], offset: 0, total: 0, more: false } : {}),
      }));

      try {
        const page = await searchTracks(text, offset);
        if (ticket !== run.current) return; // the query moved on
        setRemote((r) => {
          const seen = new Set(offset === 0 ? [] : r.tracks.map((t) => t.uri));
          const added = page.items
            .filter((t) => t.uri && !seen.has(t.uri))
            .map((t) => ({ ...t, hue: 0 }));
          return {
            query: text,
            tracks: offset === 0 ? added : [...r.tracks, ...added],
            offset: page.offset,
            total: page.total,
            more: page.more,
            loading: "idle",
            error: null,
          };
        });
      } catch (err) {
        if (ticket !== run.current) return;
        const message =
          err instanceof SpotifyApiError
            ? err.message
            : "Could not reach Spotify. Check the connection and try again.";
        setRemote((r) => ({ ...r, query: text, loading: "idle", error: message }));
      }
    },
    [],
  );

  /* the catalogue query, debounced so typing does not spray requests */
  useEffect(() => {
    if (!canSearchRemote || q.length < MIN_QUERY) {
      run.current += 1; // abandon anything in flight
      setRemote(EMPTY);
      return;
    }
    const timer = window.setTimeout(() => void fetchPage(q, 0), DEBOUNCE);
    return () => window.clearTimeout(timer);
  }, [q, canSearchRemote, fetchPage]);

  useEffect(() => setActive(0), [query]);

  // Walking the list with the arrows has to bring the highlighted row along.
  // Hovering must not: scrolling a half-visible row into view slides the list
  // under the cursor, which then highlights a different row.
  useEffect(() => {
    if (!byKey.current) return;
    byKey.current = false;
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  /*
   * `/` and ⌘/Ctrl+K reach the field whenever Signal is the front window.
   *
   * Bound on window in the capture phase: the keystroke never reaches the
   * desktop's own handler, so Ctrl+K focuses this search instead of opening a
   * Terminal for as long as Signal has focus, and goes back to the Terminal the
   * moment it does not.
   */
  useEffect(() => {
    if (!focused) return;
    const onKey = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      const mod = ev.metaKey || ev.ctrlKey;

      if (mod && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        ev.stopPropagation();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (ev.key === "/" && !typing && !mod) {
        ev.preventDefault();
        ev.stopPropagation();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [focused]);

  const play = useCallback((track: NowPlaying, isRemote: boolean) => {
    if (isRemote) {
      // musicStore owns the queue and the device; Signal only points at a track
      void musicStore.playTrack(track);
      return;
    }
    const at = musicStore.list().findIndex((t) => t.id === track.id);
    if (at >= 0) musicStore.select(at);
  }, []);

  const loadMore = useCallback(() => {
    if (remote.loading !== "idle" || !remote.more) return;
    void fetchPage(remote.query, remote.offset + SEARCH_PAGE);
  }, [fetchPage, remote.loading, remote.more, remote.offset, remote.query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (query) setQuery("");
      else inputRef.current?.blur();
      return;
    }
    if (!flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      byKey.current = true;
      // walking off the end asks for the next page rather than wrapping past it
      if (active === flat.length - 1 && remote.more) loadMore();
      setActive((i) => (i + 1) % flat.length);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      byKey.current = true;
      setActive((i) => (i - 1 + flat.length) % flat.length);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[active];
      if (!hit) return;
      play(hit, fresh.includes(hit));
    }
  };

  const searching = remote.loading === "first";
  const nothingAnywhere =
    !flat.length && !searching && !remote.error && q.length >= MIN_QUERY;

  let index = -1;

  return (
    <div className="border-b px-3 py-2.5" style={{ borderColor: "var(--hair)" }}>
      <div
        className="flex items-center gap-2 rounded-lg border px-2.5"
        style={{ borderColor: "var(--hair)", background: "rgba(0,0,0,0.24)" }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ color: "var(--ink-4)", flexShrink: 0 }} aria-hidden>
          <circle cx="7" cy="7" r="4.6" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          type="text"
          role="searchbox"
          aria-label={canSearchRemote ? "Search Spotify and this playlist" : "Search songs"}
          placeholder={canSearchRemote ? "Search Spotify" : "Search songs"}
          spellCheck={false}
          autoComplete="off"
          className="w-full bg-transparent py-1.5 text-[12.5px] outline-none placeholder:text-[var(--ink-4)]"
          style={{ color: "var(--ink)" }}
        />
        {searching ? (
          <span className="dos-spin shrink-0" aria-hidden />
        ) : query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="shrink-0 text-[13px] leading-none transition-colors hover:text-[var(--ink)]"
            style={{ color: "var(--ink-4)" }}
          >
            ×
          </button>
        ) : (
          <kbd className="meta shrink-0" style={{ color: "var(--ink-4)" }}>
            /
          </kbd>
        )}
      </div>

      {/* the catalogue is out of reach: say so plainly rather than pretending
          the playlist filter is a Spotify search */}
      {!canSearchRemote && !q && (
        <div className="mt-2 px-0.5">
          <div className="text-[11px] leading-[1.5]" style={{ color: "var(--ink-4)" }}>
            Connect Spotify to search the catalogue.
          </div>
          {onConnect && (
            <button
              type="button"
              onClick={onConnect}
              className="meta mt-1.5 rounded border px-2 py-1 transition-colors hover:text-[var(--ink)]"
              style={{ borderColor: "var(--hair)", color: "var(--ink-3)" }}
            >
              Connect Spotify
            </button>
          )}
        </div>
      )}

      {/* Paging means the result list has no natural ceiling, and the sidebar
          does — without a bound, forty results push the library and the
          transport out of the window entirely. */}
      {q && (
        <div className="scroll-thin mt-2 flex flex-col gap-2 overflow-y-auto pr-0.5"
          style={{ maxHeight: "min(38vh, 340px)" }}>
          <div role="listbox" aria-label="Song results" className="flex flex-col gap-2">
            {groups.map((group) => (
              <div key={group.label}>
                <div
                  className="meta flex items-baseline gap-1.5 px-0.5 pb-1"
                  style={{ color: "var(--ink-4)" }}
                >
                  <span>{group.label}</span>
                  {group.remote && remote.total > 0 && (
                    <span style={{ color: "var(--ink-4)", opacity: 0.7 }}>
                      {group.tracks.length} of {remote.total}
                    </span>
                  )}
                </div>
                {group.tracks.map((track) => {
                  index += 1;
                  const isActive = index === active;
                  const at = index;
                  return (
                    <button
                      key={`${group.label}-${track.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      ref={isActive ? activeRef : undefined}
                      onPointerEnter={() => setActive(at)}
                      onClick={() => play(track, group.remote)}
                      className="flex w-full items-center gap-2 rounded-md p-1 text-left"
                      style={{ background: isActive ? "rgba(255,255,255,0.08)" : "transparent" }}
                    >
                      <span className="shrink-0 overflow-hidden rounded-[3px]">
                        {/* Spotify artwork, shown as supplied and unaltered */}
                        <CoverArt track={track} size={26} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px]" style={{ color: "var(--ink)" }}>
                          {track.title}
                        </span>
                        <span
                          className="block truncate text-[10px]"
                          style={{ color: "var(--ink-4)" }}
                        >
                          {track.artist}
                          {track.album ? ` · ${track.album}` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {searching && (
            <div className="meta px-0.5" style={{ color: "var(--ink-4)" }}>
              Searching Spotify…
            </div>
          )}

          {remote.error && (
            <div className="px-0.5">
              <div className="text-[11px] leading-[1.5]" style={{ color: "var(--ink-3)" }}>
                {remote.error}
              </div>
              <button
                type="button"
                onClick={() => void fetchPage(q, 0)}
                className="meta mt-1.5 rounded border px-2 py-1 transition-colors hover:text-[var(--ink)]"
                style={{ borderColor: "var(--hair)", color: "var(--ink-3)" }}
              >
                Try again
              </button>
            </div>
          )}

          {remote.more && !remote.error && remote.query === q && (
            <button
              type="button"
              onClick={loadMore}
              disabled={remote.loading !== "idle"}
              className="meta rounded border px-2 py-1.5 transition-colors hover:text-[var(--ink)] disabled:opacity-50"
              style={{ borderColor: "var(--hair)", color: "var(--ink-3)" }}
            >
              {remote.loading === "more" ? "Loading…" : `Load ${SEARCH_PAGE} more`}
            </button>
          )}

          {nothingAnywhere && (
            <div className="px-0.5 py-1">
              <div className="text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                No song matches “{query}”
              </div>
              {!canSearchRemote && (
                <div className="meta mt-1" style={{ color: "var(--ink-4)" }}>
                  Connect Spotify to search beyond this playlist
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
