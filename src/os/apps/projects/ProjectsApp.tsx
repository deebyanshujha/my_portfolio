import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { profile, projects } from "../../../data/profile";
import type { Project } from "../../../types/portfolio";
import type { AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import {
  AppFrame,
  AppScroll,
  AppSidebar,
  AppToolbar,
  Chip,
  ExternalAction,
  Label,
  SidebarItem,
  SidebarLabel,
  ToolbarButton,
} from "../../shell/ApplicationShell";

type Category = "All" | Project["category"] | "Archive";
const CATEGORIES: Category[] = ["All", "Compilers", "Networking", "Full-stack", "Archive"];

type VFile = { name: string; kind: "md" | "json" | "code" | "link"; body: string[] };

/** Each project is presented as a small volume with real files inside it. */
function filesFor(p: Project): VFile[] {
  return [
    {
      name: "README.md",
      kind: "md",
      body: [
        `# ${p.title}`,
        `> ${p.subtitle}`,
        "",
        p.description,
        "",
        "## Impact",
        p.impact,
        "",
        "## Repository",
        p.github,
        ...(p.docs ? ["", "## Documentation", p.docs] : []),
      ],
    },
    {
      name: "stack.json",
      kind: "json",
      body: [
        "{",
        `  "project": "${p.id}",`,
        `  "category": "${p.category}",`,
        `  "stack": [`,
        ...p.techStack.map((t, i) => `    "${t}"${i < p.techStack.length - 1 ? "," : ""}`),
        "  ]",
        "}",
      ],
    },
    {
      name: "FEATURES.md",
      kind: "md",
      body: ["# Key features", "", ...p.features.map((f) => `- ${f}`)],
    },
    {
      name: "NOTES.md",
      kind: "md",
      body: [
        "# Engineering notes",
        "",
        ...p.challenges.map((c) => `- ${c}`),
        "",
        "## Why it mattered",
        p.impact,
      ],
    },
    { name: sourceName(p), kind: "code", body: p.artifact },
  ];
}

function sourceName(p: Project) {
  if (p.category === "Compilers") return "fib.lamb";
  if (p.category === "Networking") return "server.cpp";
  return "routes.js";
}

const SECRET: VFile = {
  name: ".origin",
  kind: "md",
  body: [
    "# Why Lamb exists",
    "",
    "Reading about compilers is not the same as writing one.",
    "Lamb started as a way to find out which parts of the theory I had",
    "actually understood — the answer, at first, was fewer than expected.",
    "",
    "The scanner took an evening. The resolver took a fortnight.",
    "",
    "## Documentation",
    profile.lambDocs,
  ],
};

export default function ProjectsApp({ windowId, payload }: AppProps) {
  const [category, setCategory] = useState<Category>("All");
  const [selectedId, setSelectedId] = useState<string | null>(
    (payload as { select?: string } | undefined)?.select ?? null,
  );
  const [fileName, setFileName] = useState<string>("README.md");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showHidden, setShowHidden] = useState(false);

  const visible = useMemo(
    () =>
      category === "All" || category === "Archive"
        ? projects
        : projects.filter((p) => p.category === category),
    [category],
  );

  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const files = useMemo(() => {
    if (!selected) return [];
    const base = filesFor(selected);
    return showHidden && selected.id === "lamb" ? [...base, SECRET] : base;
  }, [selected, showHidden]);
  const file = files.find((f) => f.name === fileName) ?? files[0] ?? null;

  useEffect(() => {
    const next = (payload as { select?: string } | undefined)?.select;
    if (next) {
      setSelectedId(next);
      setFileName("README.md");
    }
  }, [payload]);

  useAppCommand(windowId, (command, value) => {
    if (command === "view") setView(value as "grid" | "list");
    if (command === "toggle-hidden") setShowHidden((v) => !v);
    if (command === "back") setSelectedId(null);
    if (command === "open-repo" && selected) {
      window.open(selected.github, "_blank", "noopener,noreferrer");
    }
  });

  return (
    <AppFrame>
      <AppToolbar>
        <ToolbarButton
          label="Back to volumes"
          onClick={() => setSelectedId(null)}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.5 2 3.5 6l4 4" />
          </svg>
        </ToolbarButton>

        <div className="flex min-w-0 items-center gap-1.5 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
          <span>Volumes</span>
          {selected && (
            <>
              <span style={{ color: "var(--ink-4)" }}>/</span>
              <span style={{ color: "var(--ink-2)" }}>{selected.title}</span>
              <span style={{ color: "var(--ink-4)" }}>/</span>
              <span style={{ color: "var(--ink)" }}>{file?.name}</span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {!selected && (
            <>
              <ToolbarButton label="Grid view" active={view === "grid"} onClick={() => setView("grid")}>
                <GridIcon />
              </ToolbarButton>
              <ToolbarButton label="List view" active={view === "list"} onClick={() => setView("list")}>
                <ListIcon />
              </ToolbarButton>
            </>
          )}
          {selected && (
            <ExternalAction href={selected.github} primary>
              Repository
            </ExternalAction>
          )}
        </div>
      </AppToolbar>

      <div className="flex min-h-0 flex-1">
        <AppSidebar>
          <SidebarLabel>Volumes</SidebarLabel>
          {CATEGORIES.map((c) => (
            <SidebarItem
              key={c}
              active={category === c}
              onClick={() => {
                setCategory(c);
                setSelectedId(null);
                setShowHidden(c === "Archive");
              }}
              count={
                c === "All"
                  ? projects.length
                  : c === "Archive"
                    ? undefined
                    : projects.filter((p) => p.category === c).length
              }
              icon={<DiskIcon />}
            >
              {c}
            </SidebarItem>
          ))}

          <SidebarLabel>Elsewhere</SidebarLabel>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-md px-2 py-[6px] text-[12.5px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
            style={{ color: "var(--ink-2)" }}
          >
            github.com/{profile.githubUsername}
          </a>
        </AppSidebar>

        {!selected ? (
          <AppScroll className="p-4">
            {category === "Archive" && (
              <p className="meta mb-4" style={{ color: "var(--ink-4)" }}>
                Archive shows hidden files inside each volume · ⌘. toggles them
              </p>
            )}
            {view === "grid" ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
                {visible.map((p, i) => (
                  <motion.button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(p.id);
                      setFileName("README.md");
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="group rounded-[10px] border p-3 text-left transition-colors hover:border-[var(--hair-strong)]"
                    style={{ borderColor: "var(--hair)", background: "rgba(255,255,255,0.022)" }}
                  >
                    <FolderIcon />
                    <div className="mt-2.5 text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                      {p.title}
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                      {p.subtitle}
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {p.techStack.slice(0, 3).map((t) => (
                        <Chip key={t}>{t}</Chip>
                      ))}
                    </div>
                    <div className="meta mt-2.5" style={{ color: "var(--ink-4)" }}>
                      {filesFor(p).length} items
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-[8px] border" style={{ borderColor: "var(--hair)" }}>
                <div
                  className="meta grid grid-cols-[1fr,110px,90px] gap-2 border-b px-3 py-1.5"
                  style={{ borderColor: "var(--hair)" }}
                >
                  <span>Name</span>
                  <span>Kind</span>
                  <span>Items</span>
                </div>
                {visible.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(p.id);
                      setFileName("README.md");
                    }}
                    className="grid w-full grid-cols-[1fr,110px,90px] gap-2 border-b px-3 py-2 text-left text-[12.5px] transition-colors last:border-0 hover:bg-[rgba(255,255,255,0.05)]"
                    style={{ borderColor: "var(--hair)", color: "var(--ink-2)" }}
                  >
                    <span className="truncate" style={{ color: "var(--ink)" }}>
                      {p.title}
                    </span>
                    <span style={{ color: "var(--ink-3)" }}>{p.category}</span>
                    <span style={{ color: "var(--ink-3)" }}>{filesFor(p).length}</span>
                  </button>
                ))}
              </div>
            )}
          </AppScroll>
        ) : (
          <div className="flex min-h-0 flex-1">
            <div
              className="scroll-thin w-[186px] max-w-[38%] shrink-0 overflow-y-auto border-r p-2"
              style={{ borderColor: "var(--hair)" }}
            >
              <Label className="px-1.5 pb-1">{selected.title}</Label>
              {files.map((f) => (
                <SidebarItem
                  key={f.name}
                  active={f.name === file?.name}
                  onClick={() => setFileName(f.name)}
                  icon={<FileIcon kind={f.kind} />}
                >
                  {f.name}
                </SidebarItem>
              ))}
            </div>

            <AppScroll className="p-5">
              {file && <FileBody file={file} />}
            </AppScroll>
          </div>
        )}
      </div>
    </AppFrame>
  );
}

function FileBody({ file }: { file: VFile }) {
  if (file.kind === "json" || file.kind === "code") {
    return (
      <pre
        className="m-0 overflow-x-auto rounded-[8px] border p-4 font-mono text-[12px] leading-[1.7]"
        style={{ borderColor: "var(--hair)", background: "rgba(0,0,0,0.28)", color: "var(--ink-2)" }}
      >
        {file.body.join("\n")}
      </pre>
    );
  }

  return (
    <div className="max-w-[62ch]">
      {file.body.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-3" />;
        if (line.startsWith("> "))
          return (
            <p
              key={i}
              className="font-editorial mb-4 mt-1 italic"
              style={{ fontSize: "1.02rem", color: "var(--ink-2)" }}
            >
              {line.slice(2)}
            </p>
          );
        if (line.startsWith("## "))
          return (
            <Label key={i} className="mb-1.5 mt-5">
              {line.slice(3)}
            </Label>
          );
        if (line.startsWith("# "))
          return (
            <h2
              key={i}
              className="font-display m-0 mb-1 text-[22px] font-bold"
              style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}
            >
              {line.slice(2)}
            </h2>
          );
        if (line.startsWith("- "))
          return (
            <div key={i} className="mb-1.5 flex gap-2.5 text-[13px] leading-[1.6]">
              <span style={{ color: "var(--accent-dim)" }}>·</span>
              <span style={{ color: "var(--ink-2)" }}>{line.slice(2)}</span>
            </div>
          );
        if (line.startsWith("http"))
          return (
            <a
              key={i}
              href={line}
              target="_blank"
              rel="noreferrer noopener"
              className="mb-1 block break-all font-mono text-[12px] underline decoration-dotted underline-offset-4"
              style={{ color: "var(--accent)" }}
            >
              {line}
            </a>
          );
        return (
          <p key={i} className="mb-2 mt-0 text-[13.5px] leading-[1.65]" style={{ color: "var(--ink-2)" }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

/* ── small icons ─────────────────────────────────────────────── */

const FolderIcon = () => (
  <svg width="34" height="26" viewBox="0 0 34 26" fill="none" aria-hidden>
    <path
      d="M1 24V4a1 1 0 0 1 1-1h9l2.4 3H32a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1Z"
      fill="rgba(217,178,106,0.12)"
      stroke="rgba(217,178,106,0.5)"
    />
  </svg>
);

const DiskIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1.5" y="2.5" width="9" height="7" rx="1.5" />
    <path d="M1.5 5.5h9" opacity="0.5" />
  </svg>
);

const GridIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1" y="1" width="4" height="4" /><rect x="7" y="1" width="4" height="4" />
    <rect x="1" y="7" width="4" height="4" /><rect x="7" y="7" width="4" height="4" />
  </svg>
);

const ListIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    <path d="M1.5 2.5h9M1.5 6h9M1.5 9.5h9" />
  </svg>
);

function FileIcon({ kind }: { kind: VFile["kind"] }) {
  const color =
    kind === "json" ? "#D9B26A" : kind === "code" ? "var(--accent)" : "var(--ink-3)";
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" fill="none" stroke={color} strokeWidth="1.2" aria-hidden>
      <path d="M1.5 1h5l3 3v7h-8z" />
      <path d="M6.5 1v3h3" opacity="0.6" />
    </svg>
  );
}
