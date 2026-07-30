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
      description="A concise overview of backend engineering, systems work, competitive programming, and certifications."
      className="bg-surface/35"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start">
        <motion.div
          className="gradient-border rounded-lg bg-glass-bg shadow-soft"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-border-subtle bg-card text-electric shadow-glow">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="font-code text-xs uppercase tracking-[0.2em] text-secondary">
                  PDF Document
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-primary sm:text-2xl">
                  Deebyanshu Jha Resume
                </h3>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-secondary">
              Built around computer science fundamentals, interpreter design, TCP
              networking, full-stack backend work, competitive programming, and
              certifications.
            </p>

            <div className="mt-6 flex flex-col gap-3 border-t border-border-subtle pt-6 sm:flex-row">
              <MagneticLink
                href={profile.resumeUrl}
                download
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Download Resume
                <Download className="size-4" />
              </MagneticLink>
              <MagneticLink
                href={profile.resumeUrl}
                external
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Preview Resume
                <ExternalLink className="size-4" />
              </MagneticLink>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="overflow-hidden rounded-lg border border-glass-border bg-glass-bg shadow-soft backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
        >
          <iframe
            title="Resume preview"
            src={profile.resumeUrl}
            className="h-[480px] w-full lg:h-full lg:min-h-[480px]"
            loading="lazy"
          />
        </motion.div>
      </div>
    </Section>
  );
}
