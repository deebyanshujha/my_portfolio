import { motion } from "motion/react";
import {
  ArrowDown,
  Download,
  Github,
  Linkedin,
  Mail,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { heroMetrics, profile } from "../../data/profile";
import { scrollToHash } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { MagneticLink } from "../ui/magnetic-link";

const HeroScene = lazy(() => import("./HeroScene").then((module) => ({ default: module.HeroScene })));

const snippets = [
  { label: "compiler pipeline", code: "lexer -> parser -> AST -> resolver" },
  { label: "network loop", code: "accept(client); route(room, payload);" },
  { label: "api contract", code: "POST /projects -> validate -> persist" },
];

const typingWords = ["backend systems", "interpreters", "networked tools", "clean APIs", "algorithmic solutions"];

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const [letters, setLetters] = useState(0);

  useEffect(() => {
    const word = typingWords[wordIndex];
    const isComplete = letters === word.length;
    const timer = window.setTimeout(
      () => {
        if (isComplete) {
          setLetters(0);
          setWordIndex((current) => (current + 1) % typingWords.length);
        } else {
          setLetters((current) => current + 1);
        }
      },
      isComplete ? 1100 : 56,
    );

    return () => window.clearTimeout(timer);
  }, [letters, wordIndex]);

  const typedText = useMemo(() => typingWords[wordIndex].slice(0, letters), [letters, wordIndex]);

  return (
    <section id="hero" className="relative min-h-screen overflow-hidden pt-32 sm:pt-36">
      <motion.div
        className="absolute left-1/2 top-0 z-0 h-[42rem] w-[84rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(circle,rgba(59,130,246,0.16),rgba(139,92,246,0.08)_38%,transparent_68%)] blur-2xl"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 z-0 bg-hero-grid bg-[length:42px_42px] opacity-[0.18] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      <Suspense fallback={null}>
        <HeroScene />
      </Suspense>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-14 px-4 pb-16 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <Badge className="gap-2 border-electric/30 bg-electric/10 text-blue-100">
            <Sparkles className="size-3.5" />
            {profile.title}
          </Badge>

          <h1 className="mt-7 text-balance font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {profile.name}
            <span className="block bg-text-gradient bg-[length:220%_220%] bg-clip-text text-transparent animate-shimmer">
              builds from first principles.
            </span>
          </h1>

          <div className="mt-6 min-h-8 font-code text-sm text-zinc-400 sm:text-base">
            <span className="text-zinc-600">&gt;</span> designing{" "}
            <span className="text-blue-200">{typedText}</span>
            <motion.span
              className="ml-1 inline-block h-5 w-[2px] translate-y-1 bg-electric"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            />
          </div>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
            {profile.tagline} I care about backend systems, compilers, operating systems, networking, and the kind of problem solving that survives production pressure.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <MagneticLink href="#projects" variant="primary" size="lg" onClick={(event) => {
              event.preventDefault();
              scrollToHash("#projects");
            }}>
              View Projects
              <ArrowDown className="size-4" />
            </MagneticLink>
            <MagneticLink href={profile.resumeUrl} variant="accent" size="lg" download>
              Download Resume
              <Download className="size-4" />
            </MagneticLink>
            <MagneticLink href="#contact" variant="secondary" size="lg" onClick={(event) => {
              event.preventDefault();
              scrollToHash("#contact");
            }}>
              Contact Me
              <Mail className="size-4" />
            </MagneticLink>
            <MagneticLink href={profile.github} variant="ghost" size="lg" external>
              <Github className="size-4" />
              GitHub
            </MagneticLink>
            <MagneticLink href={profile.linkedin} variant="ghost" size="lg" external>
              <Linkedin className="size-4" />
              LinkedIn
            </MagneticLink>
          </div>

          <motion.div
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
            }}
          >
            {heroMetrics.map((metric) => (
              <motion.div
                key={metric.label}
                className="rounded-lg border border-white/10 bg-white/6 p-4 backdrop-blur-xl"
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <p className="font-display text-2xl font-semibold text-white">{metric.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{metric.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="relative min-h-[360px] lg:min-h-[560px]" aria-hidden>
          {snippets.map((snippet, index) => (
            <motion.div
              key={snippet.label}
              className="absolute hidden w-72 rounded-lg border border-white/10 bg-zinc-950/70 p-4 shadow-soft backdrop-blur-xl md:block"
              style={{
                left: index === 1 ? "38%" : index === 2 ? "18%" : "3%",
                top: index === 1 ? "50%" : index === 2 ? "72%" : "16%",
              }}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: [0, -9, 0] }}
              transition={{
                opacity: { duration: 0.5, delay: 0.5 + index * 0.16 },
                y: { repeat: Infinity, duration: 4 + index * 0.8, ease: "easeInOut" },
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="size-2 rounded-full bg-red-400/80" />
                <span className="size-2 rounded-full bg-amberline/80" />
                <span className="size-2 rounded-full bg-mint/80" />
                <span className="ml-2 font-code text-[11px] text-zinc-500">{snippet.label}</span>
              </div>
              <code className="font-code text-xs leading-6 text-zinc-300">{snippet.code}</code>
            </motion.div>
          ))}
          <motion.div
            className="absolute bottom-6 right-4 hidden items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs text-zinc-400 backdrop-blur-xl lg:flex"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <MousePointer2 className="size-3.5 text-electric" />
            Cursor glow enabled
          </motion.div>
        </div>
      </div>
    </section>
  );
}
