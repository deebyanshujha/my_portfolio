import { AnimatePresence, motion } from "motion/react";
import { Command, Github, Linkedin, Mail, Menu, X } from "lucide-react";
import { useState } from "react";
import { navItems, profile } from "../../data/profile";
import { cn, scrollToHash } from "../../lib/utils";
import { Button } from "../ui/button";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  function handleNav(href: string) {
    setIsOpen(false);
    scrollToHash(href);
  }

  return (
    <motion.header
      className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-lg border border-white/10 bg-canvas/72 px-3 py-2 shadow-soft backdrop-blur-xl sm:px-4">
        <a
          href="#hero"
          onClick={(event) => {
            event.preventDefault();
            scrollToHash("#hero");
          }}
          className="flex items-center gap-3"
          aria-label="Go to hero"
        >
          <span className="grid size-9 place-items-center rounded-md border border-white/12 bg-white/8 font-display text-sm font-semibold text-white">
            DJ
          </span>
          <span className="hidden text-sm font-semibold text-white sm:block">Deebyanshu Jha</span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <button
              key={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-400 transition hover:bg-white/8 hover:text-white"
              onClick={() => handleNav(item.href)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <a
            className="hidden rounded-md p-2 text-zinc-400 transition hover:bg-white/8 hover:text-white sm:inline-flex"
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            aria-label="Open GitHub"
          >
            <Github className="size-4" />
          </a>
          <a
            className="hidden rounded-md p-2 text-zinc-400 transition hover:bg-white/8 hover:text-white sm:inline-flex"
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="Open LinkedIn"
          >
            <Linkedin className="size-4" />
          </a>
          <a
            className="hidden rounded-md p-2 text-zinc-400 transition hover:bg-white/8 hover:text-white sm:inline-flex"
            href={`mailto:${profile.email}`}
            aria-label="Send email"
          >
            <Mail className="size-4" />
          </a>
          <Button
            variant="secondary"
            size="sm"
            className="hidden border-white/10 bg-white/6 px-3 text-zinc-300 md:inline-flex"
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          >
            <Command className="size-4" />
            <span className="font-code text-[11px]">Ctrl K</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen((current) => !current)}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="mx-auto mt-2 max-w-7xl overflow-hidden rounded-lg border border-white/10 bg-canvas/88 p-2 shadow-soft backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.24 }}
          >
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  className={cn(
                    "rounded-md px-3 py-3 text-left text-sm font-medium text-zinc-300 transition",
                    "hover:bg-white/8 hover:text-white",
                  )}
                  onClick={() => handleNav(item.href)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
