import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Landing } from "../landing/Landing";
import { Desktop } from "./shell/Desktop";
import { MobileShell } from "./shell/mobile/MobileShell";
import { ScreenPortal } from "./stage/ScreenPortal";
import { useStage } from "./stage/StageProvider";
import { applySettings, settingsStore, useSettings } from "./kernel/settingsStore";
import { audio } from "./kernel/audio";
import { musicStore } from "./kernel/musicStore";

/** Below this width the desktop metaphor is replaced rather than squeezed. */
const DESKTOP_MIN = 900;

function useIsCompact(): boolean {
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.innerWidth < DESKTOP_MIN,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${DESKTOP_MIN - 1}px)`);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return compact;
}

export function Experience() {
  const { stage } = useStage();
  const settings = useSettings();
  const compact = useIsCompact();

  // push persisted settings into CSS variables before first paint of the shell
  useEffect(() => {
    applySettings(settingsStore.get());
  }, []);

  // A Spotify sign-in redirect lands back on the landing page, not inside
  // Signal, so the authorisation code has to be consumed here — otherwise it
  // would sit in the URL until the visitor happened to open the music app.
  useEffect(() => {
    void musicStore.initSpotify();
  }, []);

  useEffect(() => {
    audio.setEnabled(settings.soundEnabled);
    audio.setVolume(settings.volume);
    musicStore.setVolume(settings.soundEnabled ? settings.volume : 0);
  }, [settings.soundEnabled, settings.volume]);

  const inside = stage === "desktop";

  return (
    <div className="relative h-full w-full">
      <AnimatePresence>
        {stage !== "desktop" && (
          <motion.div
            key="landing"
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Landing />
          </motion.div>
        )}
      </AnimatePresence>

      {inside && (compact ? <MobileShell /> : <Desktop />)}

      <ScreenPortal />

      {/* real display dimming, driven by the Control Centre brightness slider */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1250]"
        style={{
          background: "#000",
          opacity: 1 - settings.brightness,
          transition: "opacity .15s linear",
        }}
      />
    </div>
  );
}
