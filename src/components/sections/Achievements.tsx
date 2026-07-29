import { motion } from "motion/react";
import { Award, BadgeCheck } from "lucide-react";
import { achievements, certifications } from "../../data/profile";
import { Section } from "../shared/Section";
import { Badge } from "../ui/badge";

export function Achievements() {
  return (
    <Section
      id="achievements"
      eyebrow="Achievements"
      title="Signals of consistency, curiosity, and technical range."
      description="A timeline of verified competitive programming, academic, research, and certification milestones."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative">
          <div className="absolute left-4 top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-electric via-violet to-transparent" />
          <div className="space-y-5">
            {achievements.map((achievement, index) => (
              <motion.article
                key={achievement.title}
                className="relative ml-10 rounded-lg border border-white/10 bg-white/6 p-5 backdrop-blur-xl"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.55 }}
              >
                <span className="absolute -left-[2.15rem] top-6 grid size-8 place-items-center rounded-md border border-white/12 bg-canvas text-electric">
                  <Award className="size-4" />
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="border-violet/25 bg-violet/10 text-violet">{achievement.category}</Badge>
                  <span className="font-code text-xs text-zinc-500">{achievement.date}</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold text-white">{achievement.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{achievement.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {achievement.details.map((detail) => (
                    <Badge key={detail}>{detail}</Badge>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.aside
          className="gradient-border rounded-lg bg-zinc-950/70 p-5 shadow-soft"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md border border-white/10 bg-white/6 text-mint">
              <BadgeCheck className="size-5" />
            </div>
            <div>
              <p className="font-code text-xs uppercase tracking-[0.2em] text-zinc-500">Certifications</p>
              <h3 className="font-display text-xl font-semibold text-white">Verified learning milestones</h3>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {certifications.map((certification) => (
              <article key={certification.credentialId} className="rounded-lg border border-white/10 bg-white/6 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{certification.title}</h4>
                    <p className="mt-1 text-sm text-zinc-500">
                      {certification.issuer} - {certification.issued}
                    </p>
                  </div>
                  <span className="font-code text-[11px] text-zinc-500">{certification.credentialId}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {certification.skills.map((skill) => (
                    <Badge key={skill} className="bg-canvas/60">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </motion.aside>
      </div>
    </Section>
  );
}
