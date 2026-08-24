import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MenuBar } from "./MenuBar";
import { Dock } from "./Dock";
import { DesktopIcons } from "./DesktopIcons";
import { DesktopWidgets } from "./DesktopWidgets";
import { Spotlight, SPOTLIGHT_EVENT } from "./Spotlight";
import { DesktopContextMenu, type ContextPoint } from "./ContextMenu";
import { Window } from "./Window";
import { useWindows, windowStore } from "../kernel/windowStore";
import { launch } from "../kernel/appRegistry";
import { appBus } from "../kernel/appBus";
import { musicStore } from "../kernel/musicStore";
import {
  prefersStill,
  usePhotoWallpapers,
  wallpaperById,
  useSettings,
} from "../kernel/settingsStore";

export function Desktop() {
  const { windows, focusedId } = useWindows();
  const settings = useSettings();
  const still = prefersStill(settings);
  const [menu, setMenu] = useState<ContextPoint | null>(null);
  const [spotlight, setSpotlight] = useState(false);

  useShortcuts({ toggleSpotlight: () => setSpotlight((v) => !v) });

  // keep windows sane when the viewport changes
  useEffect(() => {
    const onResize = () => windowStore.reflow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Quitting Signal silences the machine. The audio belongs to the application,
  // so it must not outlive its window — whether that window was closed from its
  // own traffic light, the dock, the menu bar, or Close All Windows.
  useEffect(
    () =>
      windowStore.onClosed((appId) => {
        if (appId === "music") musicStore.stop();
      }),
    [],
  );

  // An operating system with nothing open is a blank wall. Arriving for the
  // first time opens About, so there is something to read immediately and the
  // window system demonstrates itself. Returning visitors keep their desktop.
  useEffect(() => {
    if (windowStore.get().windows.length > 0) return;
    const timer = window.setTimeout(() => {
      if (windowStore.get().windows.length === 0) launch("about");
    }, 620);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest("[data-window-layer] > *"))
          return;
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <Wallpaper />

      <motion.div
        className="absolute inset-0"
        initial={still ? { opacity: 0 } : { opacity: 0, scale: 1.015 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: still ? 0.2 : 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <MenuBar />
        <DesktopWidgets />
        <DesktopIcons />

        {/* The layer spans the desktop so windows can sit anywhere, but it must
            not swallow clicks meant for the ground or the desktop icons — only
            the windows themselves take pointer events. */}
        <div
          data-window-layer
          className="pointer-events-none absolute inset-0 z-windows"
        >
          <AnimatePresence>
            {windows.map((win) => (
              <Window
                key={win.id}
                win={win}
                focused={win.id === focusedId && !win.minimized}
              />
            ))}
          </AnimatePresence>
        </div>

        <Dock />
      </motion.div>

      <AnimatePresence>
        {menu && <DesktopContextMenu at={menu} onClose={() => setMenu(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {spotlight && <Spotlight onClose={() => setSpotlight(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Wallpaper() {
  const settings = useSettings();
  const loaded = usePhotoWallpapers();
  const chosen = wallpaperById(settings.wallpaper);
  // the generated ground below is what shows while the photograph decodes
  const photo = chosen && loaded.get(chosen.id) === true ? chosen.photo : null;

  if (photo) return <PhotoWallpaper src={photo} />;

  return (
    <div
      className="grain absolute inset-0"
      style={{ background: "var(--wall-b)" }}
    >
      {/* one light source, high and off-centre — the same idea as the landing
          page, carried inside the machine */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(140% 96% at 62% -12%, var(--wall-a) 0%, var(--wall-b) 58%, #020203 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 46% at 62% -4%, var(--wall-c), transparent 72%)",
        }}
      />

      {/* strata: wide, very low-contrast bands that give the ground a horizon
          without becoming a picture competing with the windows */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(178deg, rgba(237,234,228,0.028) 0 1px, transparent 1px 190px)",
          maskImage:
            "linear-gradient(180deg, transparent 4%, #000 46%, transparent 96%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 4%, #000 46%, transparent 96%)",
        }}
      />

      {/* measured grid — structure you only notice if you look for it */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(237,234,228,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(237,234,228,0.03) 1px, transparent 1px)",
          backgroundSize: "78px 78px",
          maskImage:
            "radial-gradient(96% 74% at 62% -4%, #000 8%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(96% 74% at 62% -4%, #000 8%, transparent 72%)",
        }}
      />

      {/* the single diagonal shaft the light casts across the desk */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(196deg, transparent 34%, rgba(237,234,228,0.032) 52%, transparent 66%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 100% at 50% 42%, transparent 42%, rgba(0,0,0,0.62) 100%)",
        }}
      />
    </div>
  );
}

/**
 * A photograph as ground.
 *
 * Not stretched and not blurred into paste: the image is cover-cropped a little
 * above centre so the subject survives every aspect ratio, then graded down —
 * desaturated slightly, darkened, and weighted at the top and bottom edges
 * where the menu bar and the dock have to stay legible. The same grain and
 * vignette as the generated wallpapers keep it inside the DOS look instead of
 * turning the desktop into someone's photo viewer.
 */
function PhotoWallpaper({ src }: { src: string }) {
  return (
    <div
      className="grain absolute inset-0 overflow-hidden"
      style={{ background: "var(--wall-b)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url("${src}")`,
          backgroundSize: "cover",
          backgroundPosition: "center 42%",
          filter: "saturate(0.7) contrast(1.02) brightness(0.88)",
        }}
      />
      {/* the overall scrim: enough to sit UI on, not enough to lose the photo */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(6,7,10,0.42)" }}
      />
      {/* chrome bands — menu bar at the top, dock at the bottom */}
      <div
        className="absolute inset-x-0 top-0 h-[22%]"
        style={{
          background: "linear-gradient(180deg, rgba(4,5,8,0.7), transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[26%]"
        style={{
          background: "linear-gradient(0deg, rgba(4,5,8,0.66), transparent)",
        }}
      />
      {/* the column the desktop icons live in */}
      <div
        className="absolute inset-y-0 right-0 w-[220px]"
        style={{
          background: "linear-gradient(270deg, rgba(4,5,8,0.6), transparent)",
        }}
      />
      {/* the same corner falloff every DOS wallpaper has */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(126% 100% at 50% 44%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </div>
  );
}

/** Global keyboard interaction. Deliberately narrow so browser keys still work. */
function useShortcuts({ toggleSpotlight }: { toggleSpotlight: () => void }) {
  // held in a ref so the listener is bound once and never churns
  const spotlight = useRef(toggleSpotlight);
  spotlight.current = toggleSpotlight;

  useEffect(() => {
    let typed = "";
    let typedAt = 0;

    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Spotlight. ⌘+Space is the muscle memory, but macOS itself claims it
      // before the browser ever sees it, so Ctrl+Space is the one that reliably
      // lands — both are bound and whichever arrives wins.
      if (mod && (e.code === "Space" || e.key === " ")) {
        // (the menu bar reaches the same toggle through SPOTLIGHT_EVENT below)
        e.preventDefault();
        spotlight.current();
        return;
      }

      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        launch("terminal");
        return;
      }

      const focused = windowStore.get().focusedId;
      if (mod && e.key.toLowerCase() === "w" && focused) {
        e.preventDefault();
        windowStore.close(focused);
        return;
      }
      if (mod && e.key.toLowerCase() === "m" && focused) {
        e.preventDefault();
        windowStore.minimize(focused);
        return;
      }
      if (mod && e.key === ",") {
        e.preventDefault();
        launch("settings");
        return;
      }
      if (mod && e.key === "`") {
        e.preventDefault();
        windowStore.cycle();
        return;
      }
      // Escape closes the front window, but only once every popover is gone —
      // the menus and Control Centre take the first Escape themselves
      if (e.key === "Escape" && focused) {
        if (document.querySelector("[data-overlay]")) return;
        windowStore.close(focused);
        return;
      }
      // space is the transport key, but only on the bare desktop
      if (e.key === " " && !typing && !mod && !focused) {
        e.preventDefault();
        musicStore.toggle();
        return;
      }

      // hidden: type `lamb` anywhere on the desktop
      if (!typing && !mod && /^[a-z]$/.test(e.key)) {
        const now = Date.now();
        typed = now - typedAt > 1200 ? e.key : typed + e.key;
        typedAt = now;
        if (typed.endsWith("lamb")) {
          typed = "";
          const existing = windowStore
            .get()
            .windows.find((w) => w.appId === "terminal");
          if (existing) {
            windowStore.focus(existing.id);
            appBus.emit(existing.id, "run", "lamb");
          } else {
            launch("terminal", { boot: "lamb" });
          }
        }
      }
    };

    // the menu bar's magnifier asks for the same toggle the key does, rather
    // than owning a second copy of the state
    const onRequest = () => spotlight.current();

    window.addEventListener("keydown", onKey);
    window.addEventListener(SPOTLIGHT_EVENT, onRequest);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(SPOTLIGHT_EVENT, onRequest);
    };
  }, []);
}
