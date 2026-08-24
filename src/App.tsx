import { MotionConfig } from "motion/react";
import { StageProvider } from "./os/stage/StageProvider";
import { Experience } from "./os/Experience";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StageProvider>
        <a
          href="#dos-main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[2000] focus:rounded-md focus:px-3 focus:py-2"
          style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          Skip to content
        </a>
        <main id="dos-main" className="h-full w-full">
          <Experience />
        </main>
      </StageProvider>
    </MotionConfig>
  );
}
