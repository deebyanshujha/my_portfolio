import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import {
  ArrowDown,
  Download,
  Github,
  Linkedin,
  Mail,
  Sparkles,
} from "lucide-react";
import { heroMetrics, profile } from "../../data/profile";
import { scrollToHash } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { MagneticLink } from "../ui/magnetic-link";

const HeroScene = lazy(() =>
  import("./HeroScene").then((module) => ({ default: module.HeroScene })),
);

const snippets = [
  {
    label: "Compiler Pipeline",
    code: "lexer -> parser -> AST -> resolver",
  },
  {
    label: "Network Loop",
    code: "accept(client); route(room, payload);",
  },
  {
    label: "API Contract",
    code: "POST /projects -> validate -> persist",
  },
];

const typingWords = [
  "backend systems",
  "interpreters",
  "networked tools",
  "clean APIs",
  "algorithmic solutions",
];

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
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

  const typedText = useMemo(
    () => typingWords[wordIndex].slice(0, letters),
    [letters, wordIndex],
  );

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    restDelta: 0.001,
  });

  const orbOpacity = useTransform(progress, [0, 1], [1, 0.35]);
  const orbScale = useTransform(progress, [0, 1], [1, 0.9]);
  const orbY = useTransform(progress, [0, 1], [0, -48]);
  const contentOpacity = useTransform(progress, [0, 1], [1, 0.94]);
  const contentY = useTransform(progress, [0, 1], [0, 18]);
  const metricOpacity = useTransform(progress, [0, 1], [1, 0.86]);
  const metricY = useTransform(progress, [0, 1], [0, 14]);
  const snippetOpacity = useTransform(progress, [0, 1], [1, 0.58]);
  const topSnippetY = useTransform(progress, [0, 1], [14, 0]);
  const middleSnippetY = useTransform(progress, [0, 1], [8, -4]);
  const bottomSnippetY = useTransform(progress, [0, 1], [18, 2]);
  const snippetFilter = useTransform(
    progress,
    [0, 1],
    ["brightness(1)", "brightness(0.86)"],
  );
  const floatingPanels = useMemo(
    () => [
      {
        ...snippets[0],
        duration: 4,
        drift: { y: [0, -6, 0] },
        position: "left-1/2 top-4 -translate-x-1/2 sm:top-5 lg:top-6",
        scrollY: topSnippetY,
      },
      {
        ...snippets[1],
        duration: 4.2,
        drift: { x: [0, 6, 0] },
        position:
          "right-0 top-[62%] -translate-y-1/2 sm:right-1 lg:-right-5 lg:top-[63%]",
        scrollY: middleSnippetY,
      },
      {
        ...snippets[2],
        duration: 4.4,
        drift: { y: [0, 6, 0] },
        position:
          "bottom-12 left-4 sm:bottom-14 sm:left-8 lg:bottom-16 lg:left-10",
        scrollY: bottomSnippetY,
      },
    ],
    [bottomSnippetY, middleSnippetY, topSnippetY],
  );

  return (
    <motion.section
      ref={heroRef}
      id="hero"
      className="relative min-h-screen overflow-hidden pt-32 sm:pt-36"
    >
      <motion.div
        className="absolute left-1/2 top-0 z-0 h-[42rem] w-[84rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(circle,rgba(59,130,246,0.16),rgba(139,92,246,0.08)_38%,transparent_68%)] blur-2xl"
        style={{ opacity: orbOpacity, scale: orbScale, y: orbY }}
      />
      <div className="absolute inset-0 z-0 bg-hero-grid bg-[length:42px_42px] opacity-[0.18] [mask-image:linear-gradient(to_bottom,black,transparent_72%)]" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-14 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(27rem,0.92fr)] lg:gap-12 lg:px-8">
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="max-w-[44rem] lg:pr-4"
        >
          <Badge className="gap-2 border-electric/30 bg-electric/10 text-electric dark:text-blue-100">
            <Sparkles className="size-3.5" />
            {profile.title}
          </Badge>

          <h1 className="mt-7 text-balance font-display text-5xl font-semibold leading-[1.02] text-primary sm:text-6xl lg:text-7xl">
            {profile.name}
            <span className="mt-2 block bg-text-gradient bg-[length:220%_220%] bg-clip-text text-4xl text-transparent animate-shimmer sm:text-5xl lg:text-6xl">
              Reliable software begins with strong fundamentals.
            </span>
          </h1>

          <div className="mt-6 min-h-8 font-code text-sm text-secondary sm:text-base">
            <span className="text-muted">&gt;</span> designing{" "}
            <span className="text-electric">{typedText}</span>
            <span className="ml-1 inline-block h-5 w-[2px] translate-y-1 bg-electric opacity-80" />
          </div>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-secondary sm:text-xl">
            {profile.tagline} I care about backend systems, compilers, operating
            systems, networking, and the kind of problem solving that survives
            production pressure.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <MagneticLink
              href="#projects"
              variant="primary"
              size="lg"
              onClick={(event) => {
                event.preventDefault();
                scrollToHash("#projects");
              }}
            >
              View Projects
              <ArrowDown className="size-4" />
            </MagneticLink>
            <MagneticLink
              href={profile.resumeUrl}
              variant="accent"
              size="lg"
              download
            >
              Download Resume
              <Download className="size-4" />
            </MagneticLink>
            <MagneticLink
              href="#contact"
              variant="secondary"
              size="lg"
              onClick={(event) => {
                event.preventDefault();
                scrollToHash("#contact");
              }}
            >
              Contact Me
              <Mail className="size-4" />
            </MagneticLink>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <MagneticLink
              href={profile.github}
              variant="ghost"
              size="lg"
              external
            >
              <Github className="size-4" />
              GitHub
            </MagneticLink>
            <MagneticLink
              href={profile.linkedin}
              variant="ghost"
              size="lg"
              external
            >
              <Linkedin className="size-4" />
              LinkedIn
            </MagneticLink>
          </div>

          <motion.div
            style={{ opacity: metricOpacity, y: metricY }}
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-stretch"
          >
            {heroMetrics.map((metric) => (
              <div
                key={metric.label}
                className="flex min-h-[5.5rem] flex-col items-center justify-center rounded-lg border border-border-subtle bg-glass-bg p-4 backdrop-blur-xl text-center"
              >
                <p className="font-display text-2xl font-semibold leading-none text-primary">
                  {metric.value}
                </p>
                <p className="mt-2 min-h-[2rem] text-xs font-medium uppercase leading-snug tracking-[0.16em] text-secondary">
                  {metric.label}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <div className="relative mx-auto h-[28rem] w-full max-w-[39rem] sm:h-[33rem] lg:h-[39rem] lg:justify-self-end">
          <div className="absolute left-1/2 top-1/2 z-10 h-[min(21rem,82vw)] w-[min(21rem,82vw)] -translate-x-1/2 -translate-y-1/2 sm:h-[24rem] sm:w-[24rem] lg:h-[26.5rem] lg:w-[26.5rem]">
            <Suspense fallback={null}>
              <HeroScene />
            </Suspense>
          </div>

          {floatingPanels.map((panel) => (
            <div
              key={panel.label}
              aria-hidden
              className={`absolute z-20 ${panel.position}`}
            >
              <motion.div
                style={{
                  opacity: snippetOpacity,
                  y: panel.scrollY,
                  filter: snippetFilter,
                }}
              >
                <motion.div
                  className="w-[12.5rem] rounded-lg border border-border-subtle bg-glass-bg p-3 shadow-soft backdrop-blur-xl sm:w-[14.5rem] sm:p-4 lg:w-[15.75rem]"
                  animate={panel.drift}
                  transition={{
                    duration: panel.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="mb-2 flex items-center gap-2 sm:mb-3">
                    <span className="size-2 rounded-full bg-red-400/80" />
                    <span className="size-2 rounded-full bg-amber-400/80" />
                    <span className="size-2 rounded-full bg-emerald-400/80" />
                    <span className="ml-1 font-code text-[10px] text-secondary sm:ml-2 sm:text-[11px]">
                      {panel.label}
                    </span>
                  </div>
                  <code className="block break-words font-code text-[10px] leading-5 text-secondary sm:text-xs sm:leading-6">
                    {panel.code}
                  </code>
                </motion.div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
