import { motion } from "motion/react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { profile } from "../../data/profile";
import { Section } from "../shared/Section";
import { MagneticLink } from "../ui/magnetic-link";

export function Resume() {
  return (
    <Section
      id="resume"
      eyebrow="Resume"
      title="Resume preview and direct download."
      description="The resume asset is the PDF you provided: main_resume_me (1).pdf."
      className="bg-surface/35"
    >
      <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <motion.div
          className="gradient-border rounded-lg bg-zinc-950/70 p-6 shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="grid size-14 place-items-center rounded-lg border border-white/10 bg-white/6 text-electric shadow-glow">
            <FileText className="size-6" />
          </div>
          <h3 className="mt-6 font-display text-2xl font-semibold text-white">Deebyanshu Jha Resume</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Built around computer science fundamentals, interpreter design, TCP networking, full-stack backend work, competitive programming, and certifications.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <MagneticLink href={profile.resumeUrl} download variant="primary" size="lg">
              Download Resume
              <Download className="size-4" />
            </MagneticLink>
            <MagneticLink href={profile.resumeUrl} external variant="secondary" size="lg">
              Preview Resume
              <ExternalLink className="size-4" />
            </MagneticLink>
          </div>
        </motion.div>

        <motion.div
          className="min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-canvas/72 shadow-soft backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
        >
          <iframe title="Resume preview" src={profile.resumeUrl} className="h-[560px] w-full" loading="lazy" />
        </motion.div>
      </div>
    </Section>
  );
}
