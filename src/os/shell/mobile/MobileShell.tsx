import { Suspense, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ALL_APPS, APPS, type AppId } from "../../kernel/appRegistry";
import { AppGlyph, SystemMark } from "../AppGlyph";
import { useStage } from "../../stage/StageProvider";
import { useClock } from "../systemStatus";

/**
 * DOS on a small screen.
 *
 * A desktop metaphor does not survive a 390px viewport, so it is not forced:
 * the same applications are presented as full-bleed sheets with a scrolling app
 * bar. The visual system, data and interactions are identical — only the window
 * manager is replaced by something a thumb can actually drive.
 */
// Calendar and Clock have no dock tile on the desktop — they live in the
// widgets column — but the compact shell has no widgets, so it lists them.
const MOBILE_APPS: AppId[] = ALL_APPS;

export function MobileShell() {
  const [appId, setAppId] = useState<AppId>("about");
  const { sleep } = useStage();
  const now = useClock();
  const app = APPS[appId];
  const Body = app.component;

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--wall-b)" }}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 60% -10%, var(--wall-a) 0%, var(--wall-b) 65%, #030304 100%)",
        }}
      />

      <header
        className="chrome relative z-10 flex h-[46px] shrink-0 items-center gap-2 border-b px-3"
        style={{ borderColor: "var(--hair)" }}
      >
        <button
          type="button"
          onClick={sleep}
          aria-label="Back to the landing page"
          className="grid h-7 w-7 place-items-center rounded-md"
          style={{ color: "var(--ink)" }}
        >
          <SystemMark size={17} />
        </button>
        <span className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
          {app.name}
        </span>
        <span className="meta ml-auto" style={{ color: "var(--ink-4)" }}>
          {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={appId}
            className="h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense
              fallback={
                <div className="meta p-5" style={{ color: "var(--ink-4)" }}>
                  Loading {app.name}…
                </div>
              }
            >
              <Body windowId={`mobile-${appId}`} focused />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav
        className="chrome scroll-thin relative z-10 flex shrink-0 gap-1 overflow-x-auto border-t px-2 py-2"
        style={{ borderColor: "var(--hair)", paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-label="Applications"
      >
        {MOBILE_APPS.map((id) => {
          const a = APPS[id];
          const active = id === appId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setAppId(id)}
              aria-current={active}
              aria-label={a.name}
              className="flex min-w-[62px] flex-col items-center gap-1 rounded-lg px-1.5 py-1.5 transition-colors"
              style={{ background: active ? "rgba(255,255,255,0.08)" : "transparent" }}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-[9px] border"
                style={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.14)",
                  backgroundColor: a.tint,
                  backgroundImage:
                    "linear-gradient(158deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 38%, rgba(0,0,0,0.10) 62%, rgba(0,0,0,0.26) 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              >
                <span className="scale-[0.62]">
                  <AppGlyph id={id} />
                </span>
              </span>
              <span
                className="text-[9.5px] tracking-[0.04em]"
                style={{ color: active ? "var(--ink)" : "var(--ink-3)" }}
              >
                {a.name}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
