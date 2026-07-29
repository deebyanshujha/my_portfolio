import { ArrowUp } from "lucide-react";
import { profile, socialLinks } from "../../data/profile";
import { scrollToHash } from "../../lib/utils";
import { Button } from "../ui/button";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface/70 py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-display text-lg font-semibold text-white">{profile.name}</p>
          <p className="mt-1 text-sm text-zinc-500">Copyright 2026. Built for clarity, speed, and recruiter focus.</p>
        </div>
        <div className="flex items-center gap-2">
          {socialLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
                className="grid size-10 place-items-center rounded-md border border-white/10 bg-white/6 text-zinc-400 transition hover:border-white/20 hover:text-white"
                aria-label={link.label}
              >
                <Icon className="size-4" />
              </a>
            );
          })}
          <Button variant="accent" size="icon" onClick={() => scrollToHash("#hero")} aria-label="Back to top">
            <ArrowUp className="size-4" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
