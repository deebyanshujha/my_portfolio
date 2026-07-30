import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { codingProfiles } from "../../data/profile";
import { Section } from "../shared/Section";
import { FadeIn } from "../shared/FadeIn";

export function CodingProfiles() {
  return (
    <Section
      id="coding"
      eyebrow="Coding Profiles"
      title="Practice history across competitive programming platforms."
    >
      <FadeIn className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {codingProfiles.map((profile) => {
          const Icon = profile.icon;
          return (
            <motion.a
              key={profile.platform}
              href={profile.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-border-subtle bg-glass-bg p-5 backdrop-blur-xl transition hover:border-electric/35 hover:bg-hover-bg"
              whileHover={{ y: -6 }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="grid size-11 place-items-center rounded-md border border-border-subtle bg-surface text-electric">
                  <Icon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-secondary transition group-hover:text-electric" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-primary">
                {profile.platform}
              </h3>
              <div className="mt-4 space-y-3">
                {profile.stats.map((stat) => (
                  <div
                    key={`${profile.platform}-${stat.label}-${stat.value}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-canvas/56 px-3 py-2"
                  >
                    <span className="text-sm text-secondary">{stat.label}</span>
                    <span className="text-right text-sm font-semibold text-primary">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.a>
          );
        })}
      </FadeIn>
    </Section>
  );
}
