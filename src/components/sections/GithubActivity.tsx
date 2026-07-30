import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowUpRight, Github, Terminal } from "lucide-react";
import { profile, projects } from "../../data/profile";
import { Section } from "../shared/Section";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";
import { FadeIn } from "../shared/FadeIn";
import { useRef } from "react";

function CodeTerminal() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 88%", "end 40%"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 28,
    restDelta: 0.001,
  });

  const shellOpacity = useTransform(progress, [0, 1], [0.2, 1]);
  const shellY = useTransform(progress, [0, 1], [18, 0]);
  const lineOneOpacity = useTransform(progress, [0, 0.18], [0, 1]);
  const lineTwoOpacity = useTransform(progress, [0.12, 0.4], [0, 1]);
  const lineThreeOpacity = useTransform(progress, [0.28, 0.62], [0, 1]);
  const lineFourOpacity = useTransform(progress, [0.46, 0.82], [0, 1]);

  return (
    <motion.div
      ref={containerRef}
      style={{ opacity: shellOpacity, y: shellY }}
      className="overflow-hidden rounded-xl border border-border-subtle bg-card shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-border-subtle bg-hover-bg/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-[#ff5f56]" />
          <div className="size-3 rounded-full bg-[#ffbd2e]" />
          <div className="size-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Terminal className="size-3" />
          <span>visitor@portfolio:~</span>
        </div>
        <div className="w-12" />
      </div>

      <div className="p-5 font-code text-sm leading-relaxed text-secondary sm:text-base">
        <motion.div style={{ opacity: lineOneOpacity }} className="flex gap-3">
          <span className="text-emerald-500">➜</span>
          <span className="text-electric">~</span>
          <span className="text-primary">./init_env.sh</span>
        </motion.div>

        <motion.div
          style={{ opacity: lineTwoOpacity }}
          className="mt-2 text-secondary"
        >
          [+] Initializing environment...
        </motion.div>

        <motion.div
          style={{ opacity: lineThreeOpacity }}
          className="mt-1 text-secondary"
        >
          [+] Loading scalable architecture patterns... OK
        </motion.div>

        <motion.div
          style={{ opacity: lineFourOpacity }}
          className="mt-1 text-secondary"
        >
          [+] Compiling source code... OK
          <div className="mt-4">
            <span className="text-electric">System ready.</span> Engineering
            robust solutions for the modern web.
            <div className="mt-2 flex gap-3">
              <span className="text-emerald-500">➜</span>
              <span className="text-electric">~</span>
              <span className="text-muted">_</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function GithubActivity() {
  return (
    <Section
      id="github"
      eyebrow="Open Source & Labs"
      title="Code that maps to real engineering interests."
      description="Exploring compilers, socket programming, and full-stack backend architecture through open repositories."
      className="bg-surface/45"
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <FadeIn>
          <div className="gradient-border rounded-lg bg-glass-bg p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge className="border-electric/25 bg-electric/10 text-blue-100">
                  @{profile.githubUsername}
                </Badge>
                <h3 className="mt-4 font-display text-2xl font-semibold text-primary">
                  Pinned repositories
                </h3>
                <p className="mt-2 text-sm leading-7 text-secondary">
                  A selection of my core projects, highlighting system-level
                  design and scalable APIs.
                </p>
              </div>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ variant: "accent", size: "icon" }),
                  "shrink-0",
                )}
                aria-label="Open GitHub profile"
              >
                <Github className="size-4" />
              </a>
            </div>

            <div className="mt-6 space-y-3">
              {projects.map((project) => (
                <a
                  key={project.id}
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-glass-bg p-4 transition hover:border-electric/30 hover:bg-hover-bg"
                >
                  <div>
                    <p className="font-semibold text-primary">
                      {project.title}
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      {project.subtitle}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-secondary transition group-hover:text-electric" />
                </a>
              ))}
            </div>
          </div>
        </FadeIn>

        <div className="flex flex-col justify-center">
          <FadeIn>
            <CodeTerminal />
          </FadeIn>
        </div>
      </div>
    </Section>
  );
}
