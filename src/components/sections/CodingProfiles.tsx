import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { codingProfiles } from "../../data/profile";
import { Section } from "../shared/Section";

export function CodingProfiles() {
  return (
    <Section
      id="coding"
      eyebrow="Coding Profiles"
      title="Practice history across competitive programming platforms."
      description="Only verified URLs and stats from the resume/content document are shown."
    >
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-120px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      >
        {codingProfiles.map((profile) => {
          const Icon = profile.icon;
          return (
            <motion.a
              key={profile.platform}
              href={profile.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-white/10 bg-white/6 p-5 backdrop-blur-xl transition hover:border-electric/35 hover:bg-white/8"
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -6 }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="grid size-11 place-items-center rounded-md border border-white/10 bg-surface text-electric">
                  <Icon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-zinc-500 transition group-hover:text-electric" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-white">{profile.platform}</h3>
              <div className="mt-4 space-y-3">
                {profile.stats.map((stat) => (
                  <div
                    key={`${profile.platform}-${stat.label}-${stat.value}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-canvas/56 px-3 py-2"
                  >
                    <span className="text-sm text-zinc-500">{stat.label}</span>
                    <span className="text-right text-sm font-semibold text-zinc-200">{stat.value}</span>
                  </div>
                ))}
              </div>
            </motion.a>
          );
        })}
      </motion.div>
    </Section>
  );
}
