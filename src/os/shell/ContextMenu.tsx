import { useEffect } from "react";
import { motion } from "motion/react";
import { launch } from "../kernel/appRegistry";
import { windowStore } from "../kernel/windowStore";
import { settingsStore, useSettings, WALLPAPERS } from "../kernel/settingsStore";

export type ContextPoint = { x: number; y: number };

export function DesktopContextMenu({
  at,
  onClose,
}: {
  at: ContextPoint;
  onClose: () => void;
}) {
  const settings = useSettings();

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [onClose]);

  const nextWallpaper = () => {
    const i = WALLPAPERS.findIndex((w) => w.id === settings.wallpaper);
    settingsStore.set({ wallpaper: WALLPAPERS[(i + 1) % WALLPAPERS.length].id });
  };

  const items = [
    { label: "New Terminal", run: () => launch("terminal") },
    { label: "Open Projects", run: () => launch("projects") },
    { sep: true as const },
    {
      label: `Next Wallpaper — ${WALLPAPERS[(WALLPAPERS.findIndex((w) => w.id === settings.wallpaper) + 1) % WALLPAPERS.length].name}`,
      run: nextWallpaper,
    },
    { label: "Tidy Windows", run: () => windowStore.reflow() },
    { sep: true as const },
    { label: "Settings…", run: () => launch("settings") },
  ];

  // keep the menu inside the viewport
  const x = Math.min(at.x, window.innerWidth - 220);
  const y = Math.min(at.y, window.innerHeight - items.length * 30 - 40);

  return (
    <motion.div
      role="menu"
      data-overlay
      aria-label="Desktop actions"
      className="popover fixed z-overlay w-[212px] rounded-[10px] border p-1"
      style={{
        left: x,
        top: y,
        borderColor: "var(--win-border)",
        boxShadow: "0 26px 60px -18px rgba(0,0,0,0.9), inset 0 1px 0 var(--win-highlight)",
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) =>
        "sep" in item ? (
          <div key={i} className="my-1 h-px" style={{ background: "var(--hair)" }} />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={() => {
              item.run();
              onClose();
            }}
            className="w-full truncate rounded-md px-2.5 py-[6px] text-left text-[12.5px] transition-colors hover:bg-[rgba(255,255,255,0.1)]"
            style={{ color: "var(--ink-2)" }}
          >
            {item.label}
          </button>
        ),
      )}
    </motion.div>
  );
}
