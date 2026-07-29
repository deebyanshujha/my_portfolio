import { motion } from "motion/react";
import { ArrowUpRight, Github } from "lucide-react";
import { profile, projects } from "../../data/profile";
import { Section } from "../shared/Section";
import { Badge } from "../ui/badge";
import { buttonVariants } from "../ui/button";
import { cn } from "../../lib/utils";

const githubStatsUrl = `https://github-readme-stats.vercel.app/api?username=${profile.githubUsername}&show_icons=true&hide_border=true&theme=transparent&title_color=93C5FD&text_color=D4D4D8&icon_color=8B5CF6&bg_color=00000000`;
const topLanguagesUrl = `https://github-readme-stats.vercel.app/api/top-langs/?username=${profile.githubUsername}&layout=compact&hide_border=true&theme=transparent&title_color=93C5FD&text_color=D4D4D8&bg_color=00000000`;
const contributionUrl = `https://github-readme-activity-graph.vercel.app/graph?username=${profile.githubUsername}&theme=react-dark&hide_border=true&bg_color=09090B&color=93C5FD&line=8B5CF6&point=34D399&area=true`;

export function GithubActivity() {
  return (
    <Section
      id="github"
      eyebrow="GitHub Activity"
      title="Open repositories that map to real engineering interests."
      description="GitHub activity, language distribution, contribution graph, and pinned repositories for fast recruiter scanning."
      className="bg-surface/45"
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div
          className="gradient-border rounded-lg bg-zinc-950/70 p-5 shadow-soft"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge className="border-electric/25 bg-electric/10 text-blue-100">@{profile.githubUsername}</Badge>
              <h3 className="mt-4 font-display text-2xl font-semibold text-white">Pinned repositories</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                Compiler design, socket programming, and full-stack backend architecture.
              </p>
            </div>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "accent", size: "icon" }), "shrink-0")}
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
                className="group flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/6 p-4 transition hover:border-electric/30 hover:bg-white/8"
              >
                <div>
                  <p className="font-semibold text-white">{project.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{project.subtitle}</p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-zinc-500 transition group-hover:text-electric" />
              </a>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-5">
          <motion.div
            className="grid gap-5 md:grid-cols-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {[githubStatsUrl, topLanguagesUrl].map((src, index) => (
              <motion.div
                key={src}
                className="rounded-lg border border-white/10 bg-canvas/70 p-3 shadow-soft backdrop-blur-xl"
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              >
                <img
                  src={src}
                  alt={index === 0 ? "GitHub statistics for Deebyanshu Jha" : "Top GitHub languages for Deebyanshu Jha"}
                  className="h-auto w-full rounded-md"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </motion.div>
          <motion.div
            className="rounded-lg border border-white/10 bg-canvas/70 p-3 shadow-soft backdrop-blur-xl"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img
              src={contributionUrl}
              alt="GitHub contribution graph for Deebyanshu Jha"
              className="h-auto w-full rounded-md"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
