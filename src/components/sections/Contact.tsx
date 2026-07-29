import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { Copy, Github, Linkedin, Mail, MapPin, Phone, Send } from "lucide-react";
import { profile } from "../../data/profile";
import { copyToClipboard } from "../../lib/utils";
import { useToast } from "../../hooks/useToast";
import { Section } from "../shared/Section";
import { Button } from "../ui/button";
import { MagneticLink } from "../ui/magnetic-link";

const contactLinks = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}`, icon: Mail },
  { label: "Phone", value: profile.phone, href: `tel:${profile.phone.replace(/\s/g, "")}`, icon: Phone },
  { label: "LinkedIn", value: "linkedin.com/in/deebyanshujha", href: profile.linkedin, icon: Linkedin },
  { label: "GitHub", value: "github.com/deebyanshujha", href: profile.github, icon: Github },
  { label: "Location", value: profile.location, href: "#contact", icon: MapPin },
];

export function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  async function handleCopyEmail() {
    await copyToClipboard(profile.email);
    toast({ title: "Email copied", description: profile.email });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = encodeURIComponent(`Portfolio contact from ${form.name || "Recruiter"}`);
    const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    toast({ title: "Opening email client", description: "Your message is ready to send." });
  }

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Let us talk about internships, engineering roles, and ambitious systems."
      description="Use the form, copy the email, or jump directly to GitHub and LinkedIn."
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div
          className="space-y-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {contactLinks.map((item) => {
            const Icon = item.icon;
            const external = item.href.startsWith("http");
            return (
              <motion.a
                key={item.label}
                href={item.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="group flex items-center gap-4 rounded-lg border border-white/10 bg-white/6 p-4 backdrop-blur-xl transition hover:border-electric/30 hover:bg-white/8"
                variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
              >
                <span className="grid size-11 place-items-center rounded-md border border-white/10 bg-surface text-electric">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{item.label}</span>
                  <span className="mt-1 block break-words text-sm font-medium text-zinc-200">{item.value}</span>
                </span>
              </motion.a>
            );
          })}
          <div className="flex flex-wrap gap-3 pt-3">
            <Button variant="accent" size="lg" onClick={handleCopyEmail}>
              <Copy className="size-4" />
              Copy Email
            </Button>
            <MagneticLink href={profile.github} external variant="secondary" size="lg">
              <Github className="size-4" />
              GitHub
            </MagneticLink>
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="gradient-border rounded-lg bg-zinc-950/70 p-5 shadow-soft"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-300">Name</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="h-12 w-full rounded-md border border-white/10 bg-canvas/72 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-electric/45 focus:ring-2 focus:ring-electric/20"
                placeholder="Your name"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-300">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="h-12 w-full rounded-md border border-white/10 bg-canvas/72 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-electric/45 focus:ring-2 focus:ring-electric/20"
                placeholder="you@example.com"
              />
            </label>
          </div>
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium text-zinc-300">Message</span>
            <textarea
              required
              rows={8}
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="w-full resize-none rounded-md border border-white/10 bg-canvas/72 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-600 focus:border-electric/45 focus:ring-2 focus:ring-electric/20"
              placeholder="Tell me about the role, team, or problem space."
            />
          </label>
          <Button type="submit" variant="primary" size="lg" className="mt-5 w-full sm:w-auto">
            Send Message
            <Send className="size-4" />
          </Button>
        </motion.form>
      </div>
    </Section>
  );
}
