import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import {
  Copy,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { profile } from "../../data/profile";
import { copyToClipboard } from "../../lib/utils";
import { useToast } from "../../hooks/useToast";
import { Section } from "../shared/Section";
import { Button } from "../ui/button";
import { MagneticLink } from "../ui/magnetic-link";
import { FadeIn } from "../shared/FadeIn";

const contactLinks = [
  {
    label: "Email",
    value: profile.email,
    href: `mailto:${profile.email}`,
    icon: Mail,
  },
  {
    label: "Phone",
    value: profile.phone,
    href: `tel:${profile.phone.replace(/\s/g, "")}`,
    icon: Phone,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/deebyanshujha",
    href: profile.linkedin,
    icon: Linkedin,
  },
  {
    label: "GitHub",
    value: "github.com/deebyanshujha",
    href: profile.github,
    icon: Github,
  },
  {
    label: "Location",
    value: profile.location,
    href: "#contact",
    icon: MapPin,
  },
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
    const subject = encodeURIComponent(
      `Portfolio contact from ${form.name || "Recruiter"}`,
    );
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    );
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    toast({
      title: "Opening email client",
      description: "Your message is ready to send.",
    });
  }

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Let us talk about internships, engineering roles, and ambitious systems."
      description="Use the form, copy the email, or jump directly to GitHub and LinkedIn."
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <FadeIn className="space-y-3">
          {contactLinks.map((item) => {
            const Icon = item.icon;
            const external = item.href.startsWith("http");
            return (
              <motion.a
                key={item.label}
                href={item.href}
                target={external ? "_blank" : undefined}
                className="group flex items-center gap-4 rounded-lg border border-border-subtle bg-glass-bg p-4 backdrop-blur-xl transition hover:border-electric/30 hover:bg-hover-bg"
              >
                <span className="grid size-11 place-items-center rounded-md border border-border-subtle bg-surface text-electric">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                    {item.label}
                  </span>
                  <span className="mt-1 block break-words text-sm font-medium text-primary">
                    {item.value}
                  </span>
                </span>
              </motion.a>
            );
          })}
          <div className="flex flex-wrap gap-3 pt-3">
            <Button variant="accent" size="lg" onClick={handleCopyEmail}>
              <Copy className="size-4" />
              Copy Email
            </Button>
            <MagneticLink
              href={profile.github}
              external
              variant="secondary"
              size="lg"
            >
              <Github className="size-4" />
              GitHub
            </MagneticLink>
          </div>
        </FadeIn>

        <FadeIn>
          <form
            onSubmit={handleSubmit}
            className="gradient-border rounded-lg bg-glass-bg p-5 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-secondary">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-md border border-border-subtle bg-canvas/72 px-4 text-sm text-primary outline-none transition placeholder:text-muted focus:border-electric/45 focus:ring-2 focus:ring-electric/20"
                  placeholder="Your name"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-secondary">
                  Email
                </span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-md border border-border-subtle bg-canvas/72 px-4 text-sm text-primary outline-none transition placeholder:text-muted focus:border-electric/45 focus:ring-2 focus:ring-electric/20"
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-secondary">
                Message
              </span>
              <textarea
                required
                rows={8}
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                className="w-full resize-none rounded-md border border-border-subtle bg-canvas/72 px-4 py-3 text-sm leading-7 text-primary outline-none transition placeholder:text-muted focus:border-electric/45 focus:ring-2 focus:ring-electric/20"
                placeholder="Tell me about the role, team, or problem space."
              />
            </label>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="mt-5 w-full sm:w-auto"
            >
              Send Message
              <Send className="size-4" />
            </Button>
          </form>
        </FadeIn>
      </div>
    </Section>
  );
}
