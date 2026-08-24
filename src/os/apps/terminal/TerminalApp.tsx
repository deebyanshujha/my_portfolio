import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  achievements,
  certifications,
  codingProfiles,
  education,
  heroMetrics,
  profile,
  projects,
  skillGroups,
} from "../../../data/profile";
import { launch, type AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import { LambSession, LambError, LAMB_SAMPLE } from "./lamb";

type Tone = "dim" | "accent" | "error" | "strong";
type Line = { text: string; tone?: Tone };
type Block = { id: number; echo?: { prompt: string; command: string }; lines: Line[] };

const dim = (text: string): Line => ({ text, tone: "dim" });
const strong = (text: string): Line => ({ text, tone: "strong" });
const accent = (text: string): Line => ({ text, tone: "accent" });
const plain = (text: string): Line => ({ text });
const blank = (): Line => ({ text: "" });

const pad = (s: string, n: number) => s.padEnd(n, " ");

type Ctx = {
  print: (lines: Line[]) => void;
  clear: () => void;
  enterLamb: () => void;
  exitLamb: () => void;
  history: string[];
};

type Command = {
  name: string;
  summary: string;
  hidden?: boolean;
  run: (args: string[], ctx: Ctx) => Line[] | void;
};

/* ── the command set ─────────────────────────────────────────── */

const COMMANDS: Command[] = [
  {
    name: "help",
    summary: "list every command",
    run: () => [
      strong("Available commands"),
      blank(),
      ...COMMANDS.filter((c) => !c.hidden).map((c) =>
        plain(`  ${pad(c.name, 14)}${c.summary}`),
      ),
      blank(),
      dim("  Arrow keys walk history · Tab completes · Ctrl+L clears"),
      dim("  Some commands are not on this list."),
    ],
  },
  {
    name: "about",
    summary: "who is Deebyanshu Jha",
    run: () => [
      strong(profile.name),
      dim(profile.title),
      blank(),
      ...wrap(profile.summary, 74).map(plain),
      blank(),
      ...wrap(profile.recruiterNote, 74).map(dim),
      blank(),
      plain(`  location   ${profile.location}`),
      plain(`  email      ${profile.email}`),
      plain(`  github     ${profile.github}`),
      plain(`  linkedin   ${profile.linkedin}`),
    ],
  },
  {
    name: "projects",
    summary: "list projects — `open <id>` for detail",
    run: (args) => {
      if (args[0]) return describeProject(args[0]);
      return [
        strong("Projects"),
        blank(),
        ...projects.flatMap((p) => [
          plain(`  ${pad(p.id, 16)}${p.title} — ${p.subtitle}`),
          dim(`  ${pad("", 16)}${p.category} · ${p.techStack.slice(0, 3).join(", ")}`),
        ]),
        blank(),
        dim("  open <id>    read the project file"),
      ];
    },
  },
  {
    name: "open",
    summary: "open a project, or an app by name",
    run: (args, ctx) => {
      const key = (args[0] ?? "").toLowerCase();
      if (!key) return [{ text: "usage: open <project-id | app>", tone: "error" }];
      const project = projects.find((p) => p.id === key);
      if (project) {
        launch("projects", { select: project.id });
        ctx.print([dim(`Mounting ${project.title} in Projects…`)]);
        return;
      }
      const apps = ["projects", "about", "resume", "github", "skills", "achievements", "music", "settings", "terminal"] as const;
      const app = apps.find((a) => a === key);
      if (app) {
        launch(app);
        ctx.print([dim(`Launching ${app}…`)]);
        return;
      }
      return [{ text: `open: no such project or app: ${key}`, tone: "error" }];
    },
  },
  {
    name: "skills",
    summary: "capability breakdown",
    run: () => [
      strong("Skills"),
      blank(),
      ...skillGroups.flatMap((g) => [
        accent(`  ${g.title}`),
        plain(`    ${g.skills.join(" · ")}`),
      ]),
    ],
  },
  {
    name: "education",
    summary: "academic record",
    run: () => [
      strong("Education"),
      blank(),
      ...education.flatMap((e) => [
        plain(`  ${e.program}`),
        dim(`  ${e.school}, ${e.place} — ${e.result} (${e.period})`),
        blank(),
      ]),
    ],
  },
  {
    name: "achievements",
    summary: "milestones and credentials",
    run: () => [
      strong("Achievements"),
      blank(),
      ...achievements.flatMap((a) => [
        plain(`  ${a.title}`),
        dim(`  ${a.category} · ${a.date}`),
        ...wrap(a.description, 70).map((l) => dim(`  ${l}`)),
        blank(),
      ]),
      strong(`Certifications (${certifications.length})`),
      ...certifications.map((c) => dim(`  ${pad(c.issuer, 14)}${c.title}`)),
    ],
  },
  {
    name: "resume",
    summary: "open the resume document",
    run: (_a, ctx) => {
      launch("resume");
      ctx.print([dim("Opening Resume…"), plain(`  ${profile.resumeUrl}`)]);
    },
  },
  {
    name: "github",
    summary: "open the repository browser",
    run: (_a, ctx) => {
      launch("github");
      ctx.print([dim(`Opening GitHub for @${profile.githubUsername}…`)]);
    },
  },
  {
    name: "contact",
    summary: "how to reach me",
    run: () => [
      strong("Contact"),
      blank(),
      ...codingProfiles.map((c) => plain(`  ${pad(c.platform, 14)}${c.href}`)),
      plain(`  ${pad("Email", 14)}${profile.email}`),
      plain(`  ${pad("LinkedIn", 14)}${profile.linkedin}`),
    ],
  },
  {
    name: "neofetch",
    summary: "system summary",
    run: () => {
      const art = [
        "   ██████╗      ██╗ ",
        "   ██╔══██╗     ██║ ",
        "   ██║  ██║     ██║ ",
        "   ██║  ██║██   ██║ ",
        "   ██████╔╝╚█████╔╝ ",
        "   ╚═════╝  ╚════╝  ",
      ];
      const info = [
        `${profile.name.toLowerCase().replace(" ", "")}@dos`,
        "─────────────────────────────",
        `OS         DOS 1.0 (web)`,
        `Host       ${profile.location}`,
        `Kernel     react 18 · vite 6`,
        `Shell      dosh 1.0`,
        `Education  B.Tech CSE (IoT), VIT`,
        `CGPA       ${heroMetrics[1].value}`,
        `Solved     ${heroMetrics[0].value} DSA problems`,
        `Projects   ${projects.length} mounted`,
        `Languages  C++ · Java · C · JS · Python`,
      ];
      const rows = Math.max(art.length, info.length);
      return Array.from({ length: rows }, (_, i) => {
        const left = pad(art[i] ?? "", 22);
        const right = info[i] ?? "";
        return i < 2 ? accent(left + right) : plain(left + right);
      });
    },
  },
  {
    name: "whoami",
    summary: "current user",
    run: () => [plain("guest — welcome. Try `about`, then `projects`.")],
  },
  {
    name: "date",
    summary: "current date and time",
    run: () => [plain(new Date().toString())],
  },
  {
    name: "echo",
    summary: "print the arguments",
    run: (args) => [plain(args.join(" "))],
  },
  {
    name: "history",
    summary: "recent commands",
    run: (_a, ctx) =>
      ctx.history.length
        ? ctx.history.map((h, i) => dim(`  ${pad(String(i + 1), 5)}${h}`))
        : [dim("  nothing yet")],
  },
  {
    name: "clear",
    summary: "clear the screen",
    run: (_a, ctx) => ctx.clear(),
  },
  {
    name: "lamb",
    summary: "start the Lamb interpreter",
    run: (_a, ctx) => {
      ctx.enterLamb();
    },
  },
  {
    name: "exit",
    summary: "close this terminal",
    run: () => [dim("Use the close button, or ⌘W. This shell has nowhere to go.")],
  },

  /* — not advertised by `help` — */
  {
    name: "sudo",
    summary: "",
    hidden: true,
    run: (args) => [
      { text: `guest is not in the sudoers file.`, tone: "error" },
      dim(
        args.length
          ? `This incident has been logged, admired, and filed under "${args.join(" ")}".`
          : "This incident has been logged and quietly admired.",
      ),
    ],
  },
  {
    name: "ls",
    summary: "",
    hidden: true,
    run: () => [
      plain("  Projects/   Resume.pdf   fib.lamb   .config"),
      dim("  Double-click them on the desktop. `open <id>` works too."),
    ],
  },
  {
    name: "cat",
    summary: "",
    hidden: true,
    run: (args) => {
      const f = (args[0] ?? "").toLowerCase();
      if (f === "fib.lamb") return LAMB_SAMPLE.split("\n").map(plain);
      if (f === ".config" || f === "config")
        return [dim("  accent=phosphor  motion=full  effects=on  sound=on")];
      return [{ text: `cat: ${args[0] ?? ""}: no such file`, tone: "error" }];
    },
  },
  {
    name: "uptime",
    summary: "",
    hidden: true,
    run: () => [
      plain(
        `  up ${Math.floor(performance.now() / 1000)}s · load average: curiosity, caffeine, consistency`,
      ),
    ],
  },
  {
    name: "matrix",
    summary: "",
    hidden: true,
    run: () => [
      dim("  This is a portfolio, not a hacker film."),
      dim("  Try `lamb` instead — that one is real."),
    ],
  },
  {
    name: "fortune",
    summary: "",
    hidden: true,
    run: () => [
      plain(`  "${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}"`),
    ],
  },
];

const FORTUNES = [
  "A tree-walk interpreter is just a very opinionated for-loop.",
  "Every race condition is a lesson you only learn once. Twice.",
  "The parser is easy. The error messages are the hard part.",
  "Read the RFC. It is shorter than the Stack Overflow thread.",
  "Correctness first. Then measure. Then optimise.",
];

/* ── helpers ─────────────────────────────────────────────────── */

function wrap(text: string, width: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + w).length > width) {
      lines.push(line.trimEnd());
      line = "";
    }
    line += w + " ";
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

function describeProject(id: string): Line[] {
  const p = projects.find((x) => x.id === id.toLowerCase());
  if (!p) return [{ text: `projects: unknown project '${id}'`, tone: "error" }];
  return [
    strong(`${p.title} — ${p.subtitle}`),
    dim(`${p.category} · ${p.github}`),
    blank(),
    ...wrap(p.description, 74).map(plain),
    blank(),
    accent("  Stack"),
    plain(`    ${p.techStack.join(" · ")}`),
    blank(),
    accent("  Features"),
    ...p.features.flatMap((f) => wrap(f, 68).map((l, i) => plain(`    ${i ? "  " : "· "}${l}`))),
    blank(),
    accent("  Engineering notes"),
    ...p.challenges.flatMap((f) => wrap(f, 68).map((l, i) => dim(`    ${i ? "  " : "· "}${l}`))),
  ];
}

const TONE: Record<Tone, string> = {
  dim: "var(--ink-3)",
  accent: "var(--accent)",
  error: "#e2775a",
  strong: "var(--ink)",
};

/* ── the app ─────────────────────────────────────────────────── */

let blockId = 0;

export default function TerminalApp({ windowId, focused, payload }: AppProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => [
    {
      id: blockId++,
      lines: [
        accent(`DOS shell 1.0 — ${profile.name}`),
        dim("Type `help` to begin. Everything here is real data."),
        blank(),
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState<number | null>(null);
  const [lambMode, setLambMode] = useState(false);
  const lamb = useRef<LambSession | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const print = useCallback((lines: Line[], echo?: { prompt: string; command: string }) => {
    setBlocks((b) => [...b, { id: blockId++, echo, lines }]);
  }, []);

  const enterLamb = useCallback(() => {
    lamb.current = new LambSession();
    setLambMode(true);
    print([
      accent("Lamb 0.1 — tree-walk interpreter"),
      dim("A working subset of Deebyanshu's Lamb, running here in the browser."),
      dim("Try:  fun fib(n) { if (n <= 1) return n; return fib(n-1) + fib(n-2); }"),
      dim("      print fib(12);"),
      dim("`:sample` runs the example · `:exit` returns to the shell"),
    ]);
  }, [print]);

  const exitLamb = useCallback(() => {
    setLambMode(false);
    lamb.current = null;
    print([dim("Leaving Lamb.")]);
  }, [print]);

  const ctx = useMemo<Ctx>(
    () => ({
      print,
      clear: () => setBlocks([]),
      enterLamb,
      exitLamb,
      history,
    }),
    [print, enterLamb, exitLamb, history],
  );

  const submit = useCallback(
    (raw: string) => {
      const line = raw.trim();
      const echo = { prompt: lambMode ? "lamb>" : "~ $", command: line };
      if (!line) {
        print([], echo);
        return;
      }
      setHistory((h) => [...h, line]);
      setHistIndex(null);

      if (lambMode) {
        if (line === ":exit" || line === "exit") {
          print([], echo);
          exitLamb();
          return;
        }
        const source = line === ":sample" ? LAMB_SAMPLE : line;
        const listing = line === ":sample" ? LAMB_SAMPLE.split("\n").map(dim) : [];
        try {
          const out = lamb.current!.run(source);
          print([...listing, ...(out.length ? out.map(plain) : [dim("(no output)")])], echo);
        } catch (err) {
          print(
            [
              ...listing,
              {
                text: err instanceof LambError ? err.message : String(err),
                tone: "error",
              },
            ],
            echo,
          );
        }
        return;
      }

      const [name, ...args] = line.split(/\s+/);
      const cmd = COMMANDS.find((c) => c.name === name.toLowerCase());
      if (!cmd) {
        const near = COMMANDS.filter((c) => !c.hidden && c.name.startsWith(name[0] ?? ""))
          .map((c) => c.name)
          .slice(0, 4);
        print(
          [
            { text: `dosh: command not found: ${name}`, tone: "error" },
            dim(near.length ? `  did you mean: ${near.join(", ")}?` : "  try `help`"),
          ],
          echo,
        );
        return;
      }
      const result = cmd.run(args, ctx);
      if (result) print(result, echo);
      else if (cmd.name !== "clear") print([], echo);
    },
    [ctx, exitLamb, lambMode, print],
  );

  // Boot payloads. `lamb` drops straight into the REPL; `lamb-file` is what
  // double-clicking fib.lamb on the desktop sends — it opens the file the way a
  // shell would, showing the real source before handing you the interpreter
  // that runs it.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const boot = (payload as { boot?: string } | undefined)?.boot;
    if (boot === "lamb") enterLamb();
    if (boot === "lamb-file") {
      print(
        [
          dim("  ~/Desktop/fib.lamb · Lamb source · 5 lines"),
          ...LAMB_SAMPLE.split("\n").map(plain),
        ],
        { prompt: "~ $", command: "cat fib.lamb" },
      );
      enterLamb();
      print([dim("Run it with `:sample`, or type your own Lamb.")]);
    }
  }, [enterLamb, payload, print]);

  useAppCommand(windowId, (command, value) => {
    if (command === "clear") setBlocks([]);
    if (command === "run") submit(String(value));
    if (command === "help") print([dim(String(value))]);
  });

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [blocks]);

  useEffect(() => {
    if (focused) inputRef.current?.focus();
  }, [focused]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit(input);
      setInput("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next = histIndex === null ? history.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(next);
      setInput(history[next]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIndex === null) return;
      const next = histIndex + 1;
      if (next >= history.length) {
        setHistIndex(null);
        setInput("");
      } else {
        setHistIndex(next);
        setInput(history[next]);
      }
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (lambMode) return;
      const matches = COMMANDS.filter((c) => !c.hidden && c.name.startsWith(input.trim()));
      if (matches.length === 1) setInput(matches[0].name + " ");
      else if (matches.length > 1) print(matches.map((m) => dim(`  ${m.name}`)));
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      setBlocks([]);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      print([dim(`${lambMode ? "lamb>" : "~ $"} ${input}^C`)]);
      setInput("");
    }
  };

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: "rgba(6,6,8,0.55)" }}
      onClick={() => inputRef.current?.focus()}
    >
      <div
        ref={scroller}
        className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 font-mono text-[12.5px] leading-[1.55]"
      >
        {blocks.map((b) => (
          <div key={b.id}>
            {b.echo && (
              <div>
                <span style={{ color: "var(--accent-dim)" }}>{b.echo.prompt}</span>{" "}
                <span style={{ color: "var(--ink-2)" }}>{b.echo.command}</span>
              </div>
            )}
            {b.lines.map((l, i) => (
              <div
                key={i}
                className="whitespace-pre-wrap break-words"
                style={{ color: l.tone ? TONE[l.tone] : "var(--ink-2)" }}
              >
                {l.text || " "}
              </div>
            ))}
          </div>
        ))}

        <div className="flex items-center gap-2">
          <span style={{ color: lambMode ? "var(--accent)" : "var(--accent-dim)" }}>
            {lambMode ? "lamb>" : "~ $"}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label={lambMode ? "Lamb interpreter input" : "Terminal input"}
            className="flex-1 bg-transparent font-mono text-[12.5px] outline-none"
            style={{ color: "var(--ink)", caretColor: "var(--accent)" }}
          />
        </div>
      </div>
    </div>
  );
}
