import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type SectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ id, eyebrow, title, description, children, className }: SectionProps) {
  return (
    <motion.section
      id={id}
      className={cn("section-pad scroll-mt-24", className)}
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <motion.p
            className="font-code text-xs font-semibold uppercase tracking-[0.28em] text-electric"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05, duration: 0.5 }}
          >
            {eyebrow}
          </motion.p>
          <motion.h2
            className="mt-3 text-balance font-display text-3xl font-semibold text-white sm:text-4xl lg:text-5xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.58 }}
          >
            {title}
          </motion.h2>
          {description ? (
            <motion.p
              className="mt-4 text-base leading-8 text-zinc-400 sm:text-lg"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16, duration: 0.58 }}
            >
              {description}
            </motion.p>
          ) : null}
        </div>
        {children}
      </div>
    </motion.section>
  );
}
