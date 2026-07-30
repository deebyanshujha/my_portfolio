import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Github, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { projects } from "../../data/profile";
import type { Project } from "../../types/portfolio";
import { cn } from "../../lib/utils";
import { Section } from "../shared/Section";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { ScrollReveal } from "../shared/ScrollReveal";

const categories = ["All", "Compilers", "Networking", "Full-stack"] as const;

function ProjectArtifact({ project }: { project: Project }) {
  return (
    <div className="relative h-48 overflow-hidden rounded-lg border border-border-subtle bg-surface">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(59,130,246,0.12),transparent_34%),radial-gradient(circle_at_84%_26%,rgba(139,92,246,0.1),transparent_34%),linear-gradient(135deg,rgba(0,0,0,0.03),transparent)] dark:bg-[radial-gradient(circle_at_22%_18%,rgba(59,130,246,0.24),transparent_34%),radial-gradient(circle_at_84%_26%,rgba(139,92,246,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent)]" />
      <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-border-subtle bg-canvas/45 px-4 py-3 backdrop-blur">
        <span className="size-2 rounded-full bg-red-400/80" />
        <span className="size-2 rounded-full bg-amberline/80" />
        <span className="size-2 rounded-full bg-mint/80" />
        <span className="ml-auto font-code text-[11px] text-muted">
          {project.id}.system
        </span>
      </div>
      <div className="relative z-10 p-4 pt-12">
        {project.artifact.map((line, index) => (
          <motion.code
            key={`${project.id}-${line}`}
            className="block font-code text-xs leading-7 text-primary"
          >
            <span className="mr-3 text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            {line}
          </motion.code>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent" />
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.28 }}
      className="group h-full"
    >
      <ScrollReveal enableBrightness className="h-full">
        <div className="gradient-border h-full rounded-lg bg-glass-bg p-4 shadow-soft backdrop-blur-xl transition-transform duration-300 hover:-translate-y-2">
          <ProjectArtifact project={project} />
          <div className="pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="border-electric/25 bg-electric/10 text-electric dark:text-blue-100">
                  {project.category}
                </Badge>
                <h3 className="mt-3 font-display text-2xl font-semibold text-primary">
                  {project.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-secondary">
                  {project.subtitle}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "icon" }),
                    "shrink-0",
                  )}
                  aria-label={`${project.title} GitHub repository`}
                >
                  <Github className="size-4" />
                </a>
                {project.docs ? (
                  <a
                    href={project.docs}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "accent", size: "icon" }),
                      "shrink-0",
                    )}
                    aria-label={`${project.title} documentation`}
                  >
                    <ArrowUpRight className="size-4" />
                  </a>
                ) : null}
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-secondary">
              {project.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <Badge key={tech}>{tech}</Badge>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-code text-xs uppercase tracking-[0.2em] text-muted">
                  Features
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary">
                  {project.features?.slice(0, 2).map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-electric" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-code text-xs uppercase tracking-[0.2em] text-muted">
                  Solved
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-secondary">
                  {project.challenges?.map((challenge) => (
                    <li key={challenge} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" />
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 rounded-md border border-border-subtle bg-hover-bg p-4">
              <p className="font-code text-xs uppercase tracking-[0.2em] text-mint">
                Impact
              </p>
              <p className="mt-2 text-sm leading-6 text-primary">
                {project.impact}
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </motion.article>
  );
}

export function Projects() {
  const [activeCategory, setActiveCategory] =
    useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        activeCategory === "All" || project.category === activeCategory;
      const matchesQuery =
        `${project.title} ${project.description} ${project.techStack.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <Section
      id="projects"
      eyebrow="Projects"
      title="Premium project work with real engineering depth."
      description="Each card highlights the architecture, tradeoffs, and impact behind the work, not just the stack list."
      className="bg-surface/35"
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-md border px-4 py-2 text-sm font-semibold transition",
                activeCategory === category
                  ? "border-electric/45 bg-electric/15 text-electric shadow-glow"
                  : "border-border-subtle bg-hover-bg text-secondary hover:border-border-strong hover:text-primary",
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <label className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            className="h-11 w-full rounded-md border border-border-subtle bg-canvas/72 pl-10 pr-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-electric/45 focus:ring-2 focus:ring-electric/20"
          />
        </label>
      </div>

      <motion.div layout className="grid gap-5 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </motion.div>
    </Section>
  );
}
