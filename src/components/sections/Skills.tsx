import { motion } from "motion/react";
import { skillGroups } from "../../data/profile";
import { cn } from "../../lib/utils";
import { Section } from "../shared/Section";
import { Badge } from "../ui/badge";
import { FadeIn } from "../shared/FadeIn";

const accentMap = {
  blue: "text-electric group-hover:border-electric/40 group-hover:shadow-glow",
  violet: "text-violet group-hover:border-violet/40 group-hover:shadow-violet",
  mint: "text-mint group-hover:border-mint/35 group-hover:shadow-[0_0_38px_rgba(52,211,153,0.14)]",
  amber:
    "text-amberline group-hover:border-amberline/35 group-hover:shadow-[0_0_38px_rgba(245,158,11,0.14)]",
};

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="Skills"
      title="A compact toolkit for building reliable software."
      description="The stack is intentionally grounded in what appears in the resume and content document."
    >
      <FadeIn className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group) => {
          const Icon = group.icon;
          return (
            <motion.article
              key={group.title}
              className={cn(
                "group rounded-lg border border-border-subtle bg-glass-bg p-5 backdrop-blur-xl transition duration-300",
                accentMap[group.accent],
              )}
              whileHover={{ y: -7, scale: 1.01 }}
            >
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-md border border-border-subtle bg-surface">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary">
                  {group.title}
                </h3>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <Badge key={skill} className="bg-canvas/60">
                    {skill}
                  </Badge>
                ))}
              </div>
            </motion.article>
          );
        })}
      </FadeIn>
    </Section>
  );
}
