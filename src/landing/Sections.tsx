import { motion } from "motion/react";
import { education, focusAreas, profile, skillGroups } from "../data/profile";
import { ProjectDeck } from "./ProjectDeck";
import { TakeApart } from "./TakeApart";

/**
 * Everything below the machine.
 *
 * The hero is a dark room with one lit object in it; this is the opposite —
 * paper, wide margins, numbered sections, and the work set large. Scrolling out
 * of the room and onto the page is the point, so the two halves are allowed to
 * look nothing alike.
 *
 * Every fact here is read out of `src/data/profile.ts`. Nothing is invented,
 * and nothing is a metric: no scores, no rankings, no counters. Those live
 * inside the system, in Resume and Achievements, where they belong.
 */

const rise = (still: boolean, delay = 0) => ({
  initial: still ? { opacity: 0 } : { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: {
    duration: still ? 0.3 : 0.75,
    delay: still ? 0 : delay,
    ease: [0.16, 1, 0.3, 1] as const,
  },
});

function Heading({
  index,
  title,
  aside,
}: {
  index: string;
  title: string;
  aside?: string;
}) {
  return (
    <div
      className="mb-10 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t pt-4"
      style={{ borderColor: "var(--p-line)" }}
    >
      <span className="rule-number">{index}</span>
      <h2
        className="font-display m-0 font-bold"
        style={{
          fontSize: "clamp(1.6rem, 3.4vw, 2.5rem)",
          letterSpacing: "-0.035em",
          lineHeight: 1,
          color: "var(--p-ink)",
        }}
      >
        {title}
      </h2>
      {aside && (
        <span className="p-meta ml-auto" style={{ color: "var(--p-ink-4)" }}>
          {aside}
        </span>
      )}
    </div>
  );
}

const Shell = ({ children, id }: { children: React.ReactNode; id: string }) => (
  <section id={id} className="mx-auto w-full max-w-[1180px] px-[clamp(1.25rem,5vw,4rem)]">
    {children}
  </section>
);

/* ── 01 · what I build ───────────────────────────────────────────── */

export function Intro({ still }: { still: boolean }) {
  return (
    <Shell id="about">
      <motion.div {...rise(still)} className="pt-[clamp(4rem,10vh,7rem)]">
        <Heading index="01" title="What I build" aside={profile.location} />

        <p
          className="m-0 max-w-[24ch] font-display font-bold"
          style={{
            fontSize: "clamp(1.9rem, 4.6vw, 3.4rem)",
            letterSpacing: "-0.04em",
            lineHeight: 1.04,
            color: "var(--p-ink)",
          }}
        >
          {/* the line means what it says, so it does what it says */}
          <TakeApart still={still} text="Systems you can take apart and understand." />
        </p>

        <div className="mt-9 grid gap-x-[clamp(2rem,6vw,5rem)] gap-y-8 md:grid-cols-2">
          <p
            className="m-0 max-w-[46ch]"
            style={{ fontSize: "clamp(1rem,1.4vw,1.15rem)", lineHeight: 1.62, color: "var(--p-ink-2)" }}
          >
            {profile.summary}
          </p>

          <div>
            <div className="p-meta">Currently focused on</div>
            <ul className="m-0 mt-3.5 flex list-none flex-wrap gap-2 p-0">
              {focusAreas.map((area) => (
                <li
                  key={area.label}
                  className="rounded-full border px-3 py-1.5 text-[12.5px]"
                  style={{
                    borderColor: "var(--p-line)",
                    color: "var(--p-ink-2)",
                    background: "var(--p-bg-2)",
                  }}
                >
                  {area.label}
                </li>
              ))}
            </ul>

            <p
              className="mt-6 max-w-[42ch] border-l-2 pl-4"
              style={{
                borderColor: "var(--p-accent)",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                color: "var(--p-ink-2)",
              }}
            >
              {profile.recruiterNote}
            </p>
          </div>
        </div>
      </motion.div>
    </Shell>
  );
}

/* ── 02 · projects ───────────────────────────────────────────────
   Not a grid. The three projects are one deck, dealt with the wheel — the
   state machine that makes three scrolls a full cycle lives in ProjectDeck. */

export function Work({ still }: { still: boolean }) {
  return (
    <Shell id="work">
      <div className="flex min-h-[100svh] flex-col justify-center pb-[clamp(3rem,8vh,5rem)] pt-[clamp(5rem,13vh,9rem)]">
        <motion.div {...rise(still)}>
          <Heading index="02" title="Selected work" aside="Scroll through the deck" />
        </motion.div>

        <ProjectDeck still={still} />
      </div>
    </Shell>
  );
}

/* ── 03 · toolkit ────────────────────────────────────────────────── */

export function Toolkit({ still }: { still: boolean }) {
  return (
    <Shell id="toolkit">
      <div className="pt-[clamp(5rem,13vh,9rem)]">
        <motion.div {...rise(still)}>
          <Heading index="03" title="Toolkit" aside="What I reach for" />
        </motion.div>

        <div className="grid gap-x-[clamp(1.5rem,4vw,3.5rem)] gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, i) => (
            <motion.div key={group.title} {...rise(still, i * 0.04)}>
              <div
                className="flex items-baseline gap-2.5 border-b pb-2.5"
                style={{ borderColor: "var(--p-line)" }}
              >
                <span
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--p-ink)", letterSpacing: "-0.015em" }}
                >
                  {group.title}
                </span>
                <span className="p-meta ml-auto">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <ul className="m-0 mt-3.5 flex list-none flex-wrap gap-x-3 gap-y-2 p-0">
                {group.skills.map((skill) => (
                  <li key={skill} className="text-[13.5px]" style={{ color: "var(--p-ink-2)" }}>
                    {skill}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* ── 04 · background ─────────────────────────────────────────────── */

export function Background({ still }: { still: boolean }) {
  return (
    <Shell id="background">
      <div className="pt-[clamp(5rem,13vh,9rem)]">
        <motion.div {...rise(still)}>
          <Heading index="04" title="Background" aside="Education" />
        </motion.div>

        <div className="flex flex-col">
          {education.map((item, i) => (
            <motion.div
              key={`${item.school}-${item.period}`}
              {...rise(still, i * 0.05)}
              className="grid gap-x-8 gap-y-2 border-b py-6 md:grid-cols-[9rem_1fr]"
              style={{ borderColor: "var(--p-line-2)" }}
            >
              <div className="p-meta pt-1">{item.period}</div>
              <div>
                <div
                  className="text-[clamp(1.05rem,1.8vw,1.3rem)] font-semibold"
                  style={{ color: "var(--p-ink)", letterSpacing: "-0.02em" }}
                >
                  {item.school}
                </div>
                <div className="mt-1.5 text-[14px]" style={{ color: "var(--p-ink-2)" }}>
                  {item.program}
                </div>
                <div className="mt-1 text-[13px]" style={{ color: "var(--p-ink-3)" }}>
                  {item.place}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* ── 05 · contact ────────────────────────────────────────────────── */

export function Contact({ still }: { still: boolean }) {
  const links = [
    { label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    { label: "GitHub", value: `@${profile.githubUsername}`, href: profile.github },
    { label: "LinkedIn", value: "in/deebyanshujha", href: profile.linkedin },
  ];

  return (
    <div
      className="mt-[clamp(5rem,14vh,10rem)]"
      style={{
        background: "linear-gradient(168deg, #16181d 0%, #101217 60%, #0b0d11 100%)",
      }}
    >
      <Shell id="contact">
        <motion.div {...rise(still)} className="py-[clamp(4rem,12vh,8rem)]">
          <div
            className="mb-10 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t pt-4"
            style={{ borderColor: "rgba(255,255,255,0.14)" }}
          >
            <span className="rule-number" style={{ color: "#F0783F" }}>
              05
            </span>
            <h2
              className="font-display m-0 font-bold"
              style={{
                fontSize: "clamp(1.6rem, 3.4vw, 2.5rem)",
                letterSpacing: "-0.035em",
                lineHeight: 1,
                color: "#F7F5F1",
              }}
            >
              Get in touch
            </h2>
          </div>

          <p
            className="m-0 max-w-[18ch] font-display font-bold"
            style={{
              fontSize: "clamp(2.2rem, 6.5vw, 4.6rem)",
              letterSpacing: "-0.045em",
              lineHeight: 0.98,
              color: "#F7F5F1",
            }}
          >
            Let’s build something solid.
          </p>

          <div className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-3">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="group block border-t pt-4 transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.14)" }}
              >
                <span className="p-meta block" style={{ color: "rgba(247,245,241,0.42)" }}>
                  {link.label}
                </span>
                <span
                  className="mt-2 block break-all text-[clamp(0.95rem,1.5vw,1.15rem)] transition-colors group-hover:text-[#F0783F]"
                  style={{ color: "#F7F5F1", letterSpacing: "-0.015em" }}
                >
                  {link.value}
                </span>
              </a>
            ))}
          </div>

          <div
            className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-5"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <span className="p-meta" style={{ color: "rgba(247,245,241,0.36)" }}>
              {profile.name}
            </span>
            <span className="p-meta" style={{ color: "rgba(247,245,241,0.24)" }}>
              DOS — System 1.0
            </span>
            <button
              type="button"
              onClick={() =>
                document
                  .querySelector("[data-landing-scroll]")
                  ?.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" })
              }
              className="p-meta ml-auto transition-colors hover:text-[#F0783F]"
              style={{ color: "rgba(247,245,241,0.5)" }}
            >
              ↑ Back to the machine
            </button>
          </div>
        </motion.div>
      </Shell>
    </div>
  );
}
