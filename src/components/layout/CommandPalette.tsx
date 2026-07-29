import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Command,
  Copy,
  FileText,
  Github,
  Mail,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { navItems, profile, projects } from "../../data/profile";
import { copyToClipboard, scrollToHash } from "../../lib/utils";
import { useToast } from "../../hooks/useToast";

type CommandAction = {
  label: string;
  helper: string;
  icon: typeof Search;
  action: () => void;
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const actions = useMemo<CommandAction[]>(
    () => [
      ...navItems.map((item) => ({
        label: `Go to ${item.label}`,
        helper: item.href,
        icon: Command,
        action: () => scrollToHash(item.href),
      })),
      ...projects.map((project) => ({
        label: `Open ${project.title} repository`,
        helper: project.github,
        icon: Github,
        action: () => window.open(project.github, "_blank", "noreferrer"),
      })),
      {
        label: "Copy email",
        helper: profile.email,
        icon: Copy,
        action: async () => {
          await copyToClipboard(profile.email);
          toast({ title: "Email copied", description: profile.email });
        },
      },
      {
        label: "Download resume",
        helper: profile.resumeUrl,
        icon: FileText,
        action: () => window.open(profile.resumeUrl, "_blank", "noreferrer"),
      },
      {
        label: "Open LinkedIn",
        helper: profile.linkedin,
        icon: ArrowUpRight,
        action: () => window.open(profile.linkedin, "_blank", "noreferrer"),
      },
      {
        label: "Email Deebyanshu",
        helper: profile.email,
        icon: Mail,
        action: () => window.open(`mailto:${profile.email}`, "_self"),
      },
    ],
    [toast],
  );

  const filteredActions = actions.filter((action) =>
    `${action.label} ${action.helper}`.toLowerCase().includes(query.toLowerCase()),
  );

  function runAction(action: CommandAction) {
    action.action();
    setIsOpen(false);
    setQuery("");
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[75] grid place-items-start bg-canvas/65 px-4 pt-24 backdrop-blur-md sm:place-items-center sm:pt-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => setIsOpen(false)}
        >
          <motion.div
            className="gradient-border w-full max-w-2xl rounded-lg bg-zinc-950/90 p-2 shadow-soft"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
              <Search className="size-5 text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sections, projects, links"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
              />
              <kbd className="rounded border border-white/10 bg-white/6 px-2 py-1 font-code text-[10px] text-zinc-500">
                ESC
              </kbd>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={`${action.label}-${action.helper}`}
                    className="group flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition hover:bg-white/8"
                    onClick={() => runAction(action)}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/6 text-zinc-400 group-hover:text-white">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{action.label}</span>
                      <span className="mt-0.5 block truncate font-code text-xs text-zinc-500">{action.helper}</span>
                    </span>
                  </button>
                );
              })}
              {!filteredActions.length ? (
                <div className="px-3 py-10 text-center text-sm text-zinc-500">No matching command</div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
