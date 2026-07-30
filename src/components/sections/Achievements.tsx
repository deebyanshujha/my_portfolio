import { motion } from "motion/react";
import { Award, BadgeCheck } from "lucide-react";
import { achievements, certifications } from "../../data/profile";
import { Section } from "../shared/Section";
import { Badge } from "../ui/badge";
import { FadeIn } from "../shared/FadeIn";

export function Achievements() {
  return (
    <Section
      id="achievements"
      eyebrow="Achievements"
      title="Signals of consistency, curiosity, and technical range."
      description="A timeline of verified competitive programming, academic, research, and certification milestones."
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="relative">
          <div className="absolute bottom-0 left-4 top-2 w-px bg-gradient-to-b from-electric via-violet to-transparent" />
          <FadeIn className="space-y-5">
            {achievements.map((achievement) => (
              <div key={achievement.title} className="flex gap-4">
                <div className="flex w-8 shrink-0 justify-center pt-5">
                  <span className="relative z-10 grid size-8 place-items-center rounded-md border border-border-subtle bg-canvas text-electric">
                    <Award className="size-4" />
                  </span>
                </div>
                <motion.article className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-glass-bg p-5 backdrop-blur-xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="border-violet/25 bg-violet/10 text-violet">
                      {achievement.category}
                    </Badge>
                    <span className="font-code text-xs text-secondary">
                      {achievement.date}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-semibold text-primary">
                    {achievement.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-secondary">
                    {achievement.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {achievement.details.map((detail) => (
                      <Badge key={detail}>{detail}</Badge>
                    ))}
                  </div>
                </motion.article>
              </div>
            ))}
          </FadeIn>
        </div>

        <FadeIn className="rounded-lg border border-border-subtle bg-glass-bg p-5 shadow-soft lg:self-start">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md border border-border-subtle bg-card text-mint">
              <BadgeCheck className="size-5" />
            </div>
            <div>
              <p className="font-code text-xs uppercase tracking-[0.2em] text-secondary">
                Certifications
              </p>
              <h3 className="font-display text-xl font-semibold text-primary">
                Verified learning milestones
              </h3>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {certifications.map((certification) => (
              <article
                key={certification.credentialId}
                className="rounded-lg border border-border-subtle bg-card p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-primary">
                      {certification.title}
                    </h4>
                    <p className="mt-1 text-sm text-secondary">
                      {certification.issuer} - {certification.issued}
                    </p>
                  </div>
                  <span className="font-code text-[11px] text-secondary">
                    {certification.credentialId}
                  </span>
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
        </FadeIn>
      </div>
    </Section>
  );
}
