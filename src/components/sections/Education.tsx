import { motion } from "motion/react";
import { GraduationCap } from "lucide-react";
import { education } from "../../data/profile";
import { Section } from "../shared/Section";
import { FadeIn } from "../shared/FadeIn";

export function Education() {
  return (
    <Section
      id="education"
      eyebrow="Education"
      title="Strong academic base with consistent performance."
      description="Computer Science depth, IoT specialization, and a track record of high academic results."
      className="bg-surface/45"
    >
      <div className="relative">
        <div className="absolute left-5 top-4 hidden h-[calc(100%-2rem)] w-px bg-gradient-to-b from-electric via-violet to-transparent md:block" />
        <FadeIn className="space-y-4">
          {education.map((item, index) => (
            <motion.article
              key={`${item.school}-${item.period}`}
              className="relative rounded-lg border border-border-subtle bg-glass-bg p-5 shadow-soft backdrop-blur-xl md:ml-14"
              whileHover={{ x: 6 }}
            >
              <div className="absolute -left-[3.55rem] top-5 hidden size-10 place-items-center rounded-md border border-border-subtle bg-canvas text-electric shadow-glow md:grid">
                <GraduationCap className="size-5" />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold text-primary">
                    {item.school}
                  </h3>
                  <p className="mt-1 text-sm text-secondary">{item.place}</p>
                  <p className="mt-4 text-base leading-7 text-secondary">
                    {item.program}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="font-code text-sm text-electric">
                    {item.period}
                  </p>
                  <p className="mt-2 rounded-md border border-border-subtle bg-card px-3 py-2 text-sm font-semibold text-primary">
                    {item.result}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </FadeIn>
      </div>
    </Section>
  );
}
