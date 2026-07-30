import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import { focusAreas, profile } from "../../data/profile";
import { Section } from "../shared/Section";
import { FadeIn } from "../shared/FadeIn";

export function About() {
  return (
    <Section
      id="about"
      eyebrow="About"
      title="A fundamentals-first engineer with a systems mindset."
      description="A concise profile for recruiters: academic consistency, hands-on systems projects, and a clear bias toward durable engineering fundamentals."
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <FadeIn>
          <motion.div
            className="gradient-border relative overflow-hidden rounded-lg bg-surface p-6 shadow-soft"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/70 to-transparent" />
            <div className="relative">
              <div className="grid size-20 place-items-center rounded-lg border border-border-subtle bg-glass-bg font-display text-2xl font-semibold text-primary shadow-glow">
                DJ
              </div>
              <p className="mt-6 font-display text-2xl font-semibold text-primary">
                {profile.name}
              </p>
              <p className="mt-2 text-sm font-medium text-secondary">
                {profile.title}
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <MapPin className="size-4 text-electric" />
                {profile.location}
              </p>
              <div className="mt-6 h-px bg-border-subtle" />
              <div className="mt-6 space-y-4">
                <p className="text-base leading-8 text-secondary">
                  {profile.summary}
                </p>
                <p className="text-base leading-8 text-muted">
                  {profile.recruiterNote}
                </p>
              </div>
            </div>
          </motion.div>
        </FadeIn>

        <FadeIn className="grid gap-3 sm:grid-cols-2">
          {focusAreas.map((area) => {
            const Icon = area.icon;
            return (
              <motion.div
                key={area.label}
                className="group rounded-lg border border-border-subtle bg-glass-bg p-5 backdrop-blur-xl transition hover:border-electric/35 hover:bg-hover-bg"
                whileHover={{ y: -5 }}
              >
                <div className="grid size-11 place-items-center rounded-md border border-border-subtle bg-surface text-electric shadow-glow transition group-hover:text-mint">
                  <Icon className="size-5" />
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-primary">
                  {area.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Built through coursework, projects, and deliberate practice.
                </p>
              </motion.div>
            );
          })}
        </FadeIn>
      </div>
    </Section>
  );
}
