import { motion } from "motion/react";
import { GraduationCap } from "lucide-react";
import { education } from "../../data/profile";
import { Section } from "../shared/Section";

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
        <div className="space-y-4">
          {education.map((item, index) => (
            <motion.article
              key={`${item.school}-${item.period}`}
              className="relative rounded-lg border border-white/10 bg-canvas/66 p-5 shadow-soft backdrop-blur-xl md:ml-14"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.55 }}
              whileHover={{ x: 6 }}
            >
              <div className="absolute -left-[3.55rem] top-5 hidden size-10 place-items-center rounded-md border border-white/12 bg-canvas text-electric shadow-glow md:grid">
                <GraduationCap className="size-5" />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">{item.school}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{item.place}</p>
                  <p className="mt-4 text-base leading-7 text-zinc-300">{item.program}</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-code text-sm text-electric">{item.period}</p>
                  <p className="mt-2 rounded-md border border-white/10 bg-white/6 px-3 py-2 text-sm font-semibold text-white">
                    {item.result}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </Section>
  );
}
