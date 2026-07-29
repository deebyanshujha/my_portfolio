import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import { focusAreas, profile } from "../../data/profile";
import { Section } from "../shared/Section";

export function About() {
  return (
    <Section
      id="about"
      eyebrow="About"
      title="A fundamentals-first engineer with a systems mindset."
      description="A concise profile for recruiters: academic consistency, hands-on systems projects, and a clear bias toward durable engineering fundamentals."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          className="gradient-border relative overflow-hidden rounded-lg bg-surface p-6 shadow-soft"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.25 }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/70 to-transparent" />
          <div className="relative">
            <div className="grid size-20 place-items-center rounded-lg border border-white/12 bg-white/8 font-display text-2xl font-semibold text-white shadow-glow">
              DJ
            </div>
            <p className="mt-6 font-display text-2xl font-semibold text-white">{profile.name}</p>
            <p className="mt-2 text-sm font-medium text-zinc-400">{profile.title}</p>
            <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
              <MapPin className="size-4 text-electric" />
              {profile.location}
            </p>
            <div className="mt-6 h-px bg-white/10" />
            <div className="mt-6 space-y-4">
              <p className="text-base leading-8 text-zinc-300">{profile.summary}</p>
              <p className="text-base leading-8 text-zinc-400">{profile.recruiterNote}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="grid gap-3 sm:grid-cols-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-120px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {focusAreas.map((area) => {
            const Icon = area.icon;
            return (
              <motion.div
                key={area.label}
                className="group rounded-lg border border-white/10 bg-white/6 p-5 backdrop-blur-xl transition hover:border-electric/35 hover:bg-white/8"
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -5 }}
              >
                <div className="grid size-11 place-items-center rounded-md border border-white/10 bg-surface text-electric shadow-glow transition group-hover:text-mint">
                  <Icon className="size-5" />
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-white">{area.label}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Built through coursework, projects, and deliberate practice.
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}
