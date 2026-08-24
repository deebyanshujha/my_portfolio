import { useState } from "react";
import {
  achievements,
  certifications,
  education,
  profile,
  projects,
  skillGroups,
} from "../../../data/profile";
import type { AppProps } from "../../kernel/appRegistry";
import { useAppCommand } from "../../kernel/appBus";
import {
  AppFrame,
  AppScroll,
  AppToolbar,
  Divider,
  Label,
  ToolbarButton,
} from "../../shell/ApplicationShell";

type View = "pdf" | "text";

export default function ResumeApp({ windowId }: AppProps) {
  // Browsers that cannot display a PDF inline should open on the typeset text
  // rather than showing an empty frame and a fallback notice.
  const [view, setView] = useState<View>(() =>
    typeof navigator !== "undefined" && navigator.pdfViewerEnabled === false ? "text" : "pdf",
  );
  const [failed, setFailed] = useState(false);

  const download = () => {
    const a = document.createElement("a");
    a.href = profile.resumeUrl;
    a.download = "Deebyanshu-Jha-Resume.pdf";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  useAppCommand(windowId, (command, value) => {
    if (command === "download") download();
    if (command === "view") setView(value as View);
  });

  const showText = view === "text" || failed;

  return (
    <AppFrame>
      <AppToolbar>
        <ToolbarButton label="View document" active={!showText} onClick={() => setView("pdf")}>
          Document
        </ToolbarButton>
        <ToolbarButton label="View plain text" active={showText} onClick={() => setView("text")}>
          Plain text
        </ToolbarButton>

        <span className="meta ml-2 truncate" style={{ color: "var(--ink-4)" }}>
          Deebyanshu-Jha-Resume.pdf
        </span>

        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton label="Open in a new tab" onClick={() => window.open(profile.resumeUrl, "_blank", "noopener,noreferrer")}>
            Open
          </ToolbarButton>
          <button
            type="button"
            onClick={download}
            className="flex h-[22px] items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 1.5v6M3.5 5.5 6 8l2.5-2.5M2 10h8" />
            </svg>
            Download
          </button>
        </div>
      </AppToolbar>

      {showText ? (
        <AppScroll className="px-6 py-6">
          <TextResume />
        </AppScroll>
      ) : (
        <div className="relative min-h-0 flex-1" style={{ background: "rgba(0,0,0,0.3)" }}>
          <object
            data={profile.resumeUrl}
            type="application/pdf"
            className="h-full w-full"
            aria-label="Resume PDF"
            onError={() => setFailed(true)}
          >
            {/* browsers that refuse to embed PDFs fall through to here */}
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <p className="font-editorial m-0 italic" style={{ fontSize: "1.1rem", color: "var(--ink-2)" }}>
                  This browser will not embed the PDF.
                </p>
                <button
                  type="button"
                  onClick={() => setView("text")}
                  className="meta mt-3 rounded-md border px-3 py-1.5"
                  style={{ borderColor: "var(--hair-strong)", color: "var(--ink)" }}
                >
                  Read the plain-text version
                </button>
              </div>
            </div>
          </object>
        </div>
      )}
    </AppFrame>
  );
}

/**
 * A typeset fallback built from the same data the rest of the system uses, so
 * the resume is readable even where PDF embedding is blocked. Nothing here is
 * invented — it is the profile data, laid out as a document.
 */
function TextResume() {
  return (
    <article className="mx-auto max-w-[64ch]">
      <h2
        className="font-display m-0 text-[28px] font-bold leading-none"
        style={{ letterSpacing: "-0.04em", color: "var(--ink)" }}
      >
        {profile.name}
      </h2>
      <p className="mb-0 mt-2 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
        {profile.title}
      </p>
      <p className="meta mt-2" style={{ color: "var(--ink-4)" }}>
        {profile.location} · {profile.email} · {profile.phone}
      </p>

      <Section title="Summary">
        <p className="m-0 text-[13px] leading-[1.65]" style={{ color: "var(--ink-2)" }}>
          {profile.summary}
        </p>
      </Section>

      <Section title="Education">
        {education.map((e) => (
          <Row
            key={`${e.school}-${e.period}`}
            left={e.program}
            sub={`${e.school}, ${e.place}`}
            right={e.period}
            note={e.result}
          />
        ))}
      </Section>

      <Section title="Projects">
        {projects.map((p) => (
          <div key={p.id} className="mb-4 last:mb-0">
            <Row left={p.title} sub={p.subtitle} right={p.category} />
            <p className="mb-1 mt-1.5 text-[12.5px] leading-[1.6]" style={{ color: "var(--ink-2)" }}>
              {p.description}
            </p>
            <p className="meta m-0" style={{ color: "var(--ink-4)" }}>
              {p.techStack.join(" · ")}
            </p>
          </div>
        ))}
      </Section>

      <Section title="Skills">
        {skillGroups.map((g) => (
          <div key={g.title} className="mb-2 flex gap-3 text-[12.5px] last:mb-0">
            <span className="w-[150px] shrink-0" style={{ color: "var(--ink-3)" }}>
              {g.title}
            </span>
            <span style={{ color: "var(--ink-2)" }}>{g.skills.join(", ")}</span>
          </div>
        ))}
      </Section>

      <Section title="Achievements">
        {achievements.map((a) => (
          <Row key={a.title} left={a.title} sub={a.description} right={a.date} />
        ))}
      </Section>

      <Section title="Certifications">
        {certifications.map((c) => (
          <Row key={c.credentialId} left={c.title} sub={`${c.issuer} · ${c.credentialId}`} right={c.issued} />
        ))}
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <Label className="mb-2">{title}</Label>
      <Divider className="mb-3" />
      {children}
    </section>
  );
}

function Row({
  left,
  sub,
  right,
  note,
}: {
  left: string;
  sub?: string;
  right?: string;
  note?: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
          {left}
        </span>
        {right && (
          <span className="meta shrink-0" style={{ color: "var(--ink-4)" }}>
            {right}
          </span>
        )}
      </div>
      {sub && (
        <div className="mt-0.5 text-[12.5px] leading-[1.55]" style={{ color: "var(--ink-3)" }}>
          {sub}
        </div>
      )}
      {note && (
        <div className="meta mt-1" style={{ color: "var(--accent-dim)" }}>
          {note}
        </div>
      )}
    </div>
  );
}
