import { useCallback, useEffect, useState } from "react";
import { profile, projects } from "../../../data/profile";
import type { AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import {
  AppFrame,
  AppScroll,
  AppToolbar,
  ExternalAction,
  Label,
  ToolbarButton,
} from "../../shell/ApplicationShell";

type Repo = {
  id: number | string;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string | null;
};

type User = {
  login: string;
  name: string | null;
  avatar_url?: string;
  bio: string | null;
  public_repos: number;
  followers: number;
};

type Source = "live" | "cache" | "offline";

const CACHE_KEY = "dos:github";
const CACHE_TTL = 10 * 60 * 1000;

/** Used when GitHub is unreachable or rate-limited. Real repositories, from the
 *  same project data the rest of the system uses — just without live counts. */
const FALLBACK: { user: User; repos: Repo[] } = {
  user: {
    login: profile.githubUsername,
    name: profile.name,
    bio: profile.tagline,
    public_repos: projects.length,
    followers: 0,
  },
  repos: projects.map((p) => ({
    id: p.id,
    name: p.github.split("/").pop() ?? p.title,
    description: p.subtitle,
    html_url: p.github,
    language: p.techStack[0],
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: null,
  })),
};

const LANGUAGE_COLOR: Record<string, string> = {
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  "Node.js": "#8cc84b",
};

function ago(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))}mo ago`;
  return `${Math.floor(diff / (365 * day))}y ago`;
}

export default function GithubApp({ windowId }: AppProps) {
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [source, setSource] = useState<Source>("live");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"updated" | "stars" | "name">("updated");

  const load = useCallback(async (force = false) => {
    setLoading(true);
    if (!force) {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as {
            at: number;
            user: User;
            repos: Repo[];
          };
          if (Date.now() - cached.at < CACHE_TTL) {
            setUser(cached.user);
            setRepos(cached.repos);
            setSource("cache");
            setLoading(false);
            return;
          }
        }
      } catch {
        /* corrupt cache — fall through to the network */
      }
    }

    try {
      const [u, r] = await Promise.all([
        fetch(`https://api.github.com/users/${profile.githubUsername}`),
        fetch(
          `https://api.github.com/users/${profile.githubUsername}/repos?sort=updated&per_page=30`,
        ),
      ]);
      if (!u.ok || !r.ok)
        throw new Error(`GitHub responded ${u.status}/${r.status}`);
      const userJson = (await u.json()) as User;
      const repoJson = (await r.json()) as Repo[];
      setUser(userJson);
      setRepos(repoJson);
      setSource("live");
      try {
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ at: Date.now(), user: userJson, repos: repoJson }),
        );
      } catch {
        /* storage full or blocked — the data is still in memory */
      }
    } catch {
      // rate-limited, offline, or blocked: show the known repositories instead
      setUser(FALLBACK.user);
      setRepos(FALLBACK.repos);
      setSource("offline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useAppCommand(windowId, (command) => {
    if (command === "refresh") void load(true);
  });

  const sorted = [...(repos ?? [])].sort((a, b) => {
    if (sort === "stars") return b.stargazers_count - a.stargazers_count;
    if (sort === "name") return a.name.localeCompare(b.name);
    return (
      new Date(b.pushed_at ?? 0).getTime() -
      new Date(a.pushed_at ?? 0).getTime()
    );
  });

  return (
    <AppFrame>
      <AppToolbar>
        <ToolbarButton
          label="Sort by last push"
          active={sort === "updated"}
          onClick={() => setSort("updated")}
        >
          Recent
        </ToolbarButton>
        <ToolbarButton
          label="Sort by stars"
          active={sort === "stars"}
          onClick={() => setSort("stars")}
        >
          Stars
        </ToolbarButton>
        <ToolbarButton
          label="Sort by name"
          active={sort === "name"}
          onClick={() => setSort("name")}
        >
          Name
        </ToolbarButton>

        <span
          className="meta ml-auto flex items-center gap-1.5"
          style={{ color: "var(--ink-4)" }}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background:
                source === "offline"
                  ? "#e2775a"
                  : source === "cache"
                    ? "var(--ink-3)"
                    : "var(--accent)",
            }}
          />
          {source === "offline"
            ? "Local data"
            : source === "cache"
              ? "Cached"
              : "Live"}
        </span>
        <ToolbarButton
          label="Refresh from GitHub"
          onClick={() => void load(true)}
        >
          Refresh
        </ToolbarButton>
      </AppToolbar>

      <AppScroll>
        {/* profile header */}
        <div className="flex items-start gap-4 px-5 py-5">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              className="shrink-0 rounded-[12px] border"
              style={{ borderColor: "var(--hair-strong)" }}
            />
          ) : (
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-[12px] border font-display text-[18px] font-bold"
              style={{
                borderColor: "var(--hair-strong)",
                color: "var(--ink-3)",
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Deebyanshu Jha"
                className="h-full w-full rounded-[11px] object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2
              className="m-0 text-[16px] font-semibold"
              style={{ color: "var(--ink)" }}
            >
              {user?.name ?? profile.name}
            </h2>
            <p
              className="m-0 mt-0.5 font-mono text-[12px]"
              style={{ color: "var(--ink-3)" }}
            >
              @{user?.login ?? profile.githubUsername}
            </p>
            {user?.bio && (
              <p
                className="mb-0 mt-2 text-[12.5px]"
                style={{ color: "var(--ink-2)" }}
              >
                {user.bio}
              </p>
            )}
            <div className="mt-2.5 flex gap-4">
              <Stat label="Repositories" value={user?.public_repos ?? "—"} />
              <Stat label="Followers" value={user?.followers ?? "—"} />
              <Stat label="Listed here" value={sorted.length} />
            </div>
          </div>
          <ExternalAction href={profile.github}>Profile</ExternalAction>
        </div>

        <Label className="px-5 pb-2">Repositories</Label>

        {loading && !repos ? (
          <div className="space-y-2 px-5 pb-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[68px] animate-pulse rounded-[10px] border"
                style={{
                  borderColor: "var(--hair)",
                  background: "rgba(255,255,255,0.02)",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 px-5 pb-5">
            {sorted.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer noopener"
                className="block rounded-[10px] border p-3 transition-colors hover:border-[var(--hair-strong)]"
                style={{
                  borderColor: "var(--hair)",
                  background: "rgba(255,255,255,0.018)",
                }}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="truncate font-mono text-[13px]"
                    style={{ color: "var(--ink)" }}
                  >
                    {repo.name}
                  </span>
                  <span
                    className="meta ml-auto shrink-0"
                    style={{ color: "var(--ink-4)" }}
                  >
                    {repo.pushed_at
                      ? `pushed ${ago(repo.pushed_at)}`
                      : "see repository"}
                  </span>
                </div>
                {repo.description && (
                  <p
                    className="mb-0 mt-1.5 line-clamp-2 text-[12.5px]"
                    style={{ color: "var(--ink-3)" }}
                  >
                    {repo.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {repo.language && (
                    <span
                      className="flex items-center gap-1.5 text-[11.5px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            LANGUAGE_COLOR[repo.language] ?? "var(--ink-3)",
                        }}
                      />
                      {repo.language}
                    </span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span
                      className="text-[11.5px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      ★ {repo.stargazers_count}
                    </span>
                  )}
                  {repo.forks_count > 0 && (
                    <span
                      className="text-[11.5px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      ⑂ {repo.forks_count}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {source === "offline" && (
          <p className="meta px-5 pb-5" style={{ color: "var(--ink-4)" }}>
            GitHub could not be reached, so these are the repositories recorded
            in this system. Star and fork counts are only shown when the API
            answers.
          </p>
        )}
      </AppScroll>
    </AppFrame>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ color: "var(--ink)" }}
      >
        {value}
      </span>
      <span className="meta" style={{ color: "var(--ink-4)" }}>
        {label}
      </span>
    </span>
  );
}
