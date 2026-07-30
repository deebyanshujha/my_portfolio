import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "./ScrollReveal";

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
    <section
      id={id}
      className={cn("section-pad scroll-mt-24", className)}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="mb-5 max-w-3xl">
          <p
            className="font-code text-xs font-semibold uppercase tracking-[0.28em] text-electric"
          >
            {eyebrow}
          </p>
          <h2
            className="mt-2 text-balance font-display text-3xl font-semibold text-primary sm:text-4xl lg:text-5xl"
          >
            {title}
          </h2>
          {description ? (
            <p
              className="mt-3 text-base leading-8 text-secondary sm:text-lg"
            >
              {description}
            </p>
          ) : null}
        </ScrollReveal>
        {children}
      </div>
    </section>
  );
}
