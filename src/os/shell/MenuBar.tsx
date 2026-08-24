import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { APPS, launch } from "../kernel/appRegistry";
import { useWindows } from "../kernel/windowStore";
import { appMenus } from "./appMenus";
import { ControlCenter } from "./ControlCenter";
import { SPOTLIGHT_EVENT } from "./Spotlight";
import { SystemMark } from "./AppGlyph";
import { useStage } from "../stage/StageProvider";
import { musicStore, useMusic } from "../kernel/musicStore";
import { useBattery, useClock, useOnline } from "./systemStatus";
import type { AppMenu } from "../kernel/appRegistry";

export function MenuBar() {
  const { windows, focusedId } = useWindows();
  const { sleep, restart } = useStage();
  const [open, setOpen] = useState<string | null>(null);
  const [cc, setCc] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const focused = windows.find((w) => w.id === focusedId && !w.minimized) ?? null;
  const app = focused ? APPS[focused.appId] : null;
  const menus = appMenus(focused?.appId ?? null, focused?.id ?? null);

  const systemMenu: AppMenu = {
    title: "DOS",
    items: [
      { kind: "item", label: "About This System", run: () => launch("about") },
      {
        kind: "item",
        label: "Spotlight…",
        shortcut: "⌃Space",
        run: () => window.dispatchEvent(new Event(SPOTLIGHT_EVENT)),
      },
      { kind: "item", label: "Settings…", shortcut: "⌘,", run: () => launch("settings") },
      { kind: "separator" },
      { kind: "item", label: "Restart", run: () => restart() },
      { kind: "item", label: "Sleep — back to landing", run: () => sleep() },
    ],
  };

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={barRef}
      className="chrome fixed inset-x-0 top-0 z-menubar flex h-[30px] items-stretch border-b px-2 text-[12.5px]"
      style={{ borderColor: "var(--hair)" }}
      role="menubar"
      aria-label="System menu bar"
    >
      <MenuTitle
        menu={systemMenu}
        open={open === "__system"}
        onOpen={() => setOpen(open === "__system" ? null : "__system")}
        onHover={() => open && setOpen("__system")}
        onClose={() => setOpen(null)}
        windowId={focused?.id ?? ""}
        mark
      />

      <span
        className="flex items-center px-2 text-[12.5px] font-semibold"
        style={{ color: "var(--ink)" }}
      >
        {app?.name ?? "Desktop"}
      </span>

      {menus.map((menu) => (
        <MenuTitle
          key={menu.title}
          menu={menu}
          open={open === menu.title}
          onOpen={() => setOpen(open === menu.title ? null : menu.title)}
          onHover={() => open && setOpen(menu.title)}
          onClose={() => setOpen(null)}
          windowId={focused?.id ?? ""}
        />
      ))}

      <div className="ml-auto flex items-center gap-1">
        <MusicIndicator />
        <SpotlightButton />
        <StatusCluster />
        <button
          type="button"
          aria-label="Control Centre"
          aria-expanded={cc}
          title="Control Centre"
          onClick={(e) => {
            e.stopPropagation();
            setCc((v) => !v);
            setOpen(null);
          }}
          className="grid h-[22px] w-[26px] place-items-center rounded transition-colors hover:bg-[rgba(255,255,255,0.09)]"
          style={{ background: cc ? "rgba(255,255,255,0.11)" : "transparent" }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: "var(--ink-2)" }}>
            <path d="M2 4.5h12M2 11.5h12" opacity="0.5" />
            <circle cx="6" cy="4.5" r="1.9" fill="var(--chrome-bg)" />
            <circle cx="10.5" cy="11.5" r="1.9" fill="var(--chrome-bg)" />
          </svg>
        </button>
        <Clock />
      </div>

      <AnimatePresence>{cc && <ControlCenter onClose={() => setCc(false)} />}</AnimatePresence>
    </div>
  );
}

function MenuTitle({
  menu,
  open,
  onOpen,
  onHover,
  onClose,
  windowId,
  mark,
}: {
  menu: AppMenu;
  open: boolean;
  onOpen: () => void;
  onHover: () => void;
  onClose: () => void;
  windowId: string;
  mark?: boolean;
}) {
  return (
    <div className="relative flex items-stretch">
      <button
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={onOpen}
        onPointerEnter={onHover}
        className="flex items-center rounded px-2 transition-colors"
        style={{
          background: open ? "rgba(255,255,255,0.11)" : "transparent",
          color: mark ? "var(--ink)" : "var(--ink-2)",
        }}
      >
        {mark ? <SystemMark size={17} /> : menu.title}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            data-overlay
            aria-label={menu.title}
            className="popover absolute left-0 top-[28px] min-w-[218px] rounded-[10px] border p-1"
            style={{
              borderColor: "var(--win-border)",
              boxShadow: "0 26px 60px -18px rgba(0,0,0,0.9), inset 0 1px 0 var(--win-highlight)",
            }}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
          >
            {menu.items.map((item, i) =>
              item.kind === "separator" ? (
                <div key={i} className="my-1 h-px" style={{ background: "var(--hair)" }} />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    item.run(windowId);
                    onClose();
                  }}
                  className="flex w-full items-center gap-6 rounded-md px-2.5 py-[6px] text-left text-[12.5px] transition-colors hover:bg-[rgba(255,255,255,0.1)]"
                  style={{ color: "var(--ink-2)" }}
                >
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="font-mono text-[10.5px]" style={{ color: "var(--ink-4)" }}>
                      {item.shortcut}
                    </span>
                  )}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Spotlight's affordance.
 *
 * Spotlight was reachable only by knowing the chord, which is fine for the
 * people who already guess it and invisible to everyone else. The magnifier is
 * the macOS place to put it; the chord is printed beside it where there is room
 * for it, so the shortcut teaches itself rather than living in a tooltip nobody
 * hovers.
 *
 * Ctrl rather than ⌘ deliberately: macOS claims ⌘+Space for its own Spotlight
 * before the browser ever sees the key, so Ctrl+Space is the one that actually
 * lands here. Both are bound; only the reliable one is advertised.
 */
function SpotlightButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(SPOTLIGHT_EVENT))}
      aria-label="Spotlight — Control Space"
      title="Spotlight — Ctrl+Space"
      className="flex h-[22px] items-center gap-1.5 rounded px-1.5 transition-colors hover:bg-[rgba(255,255,255,0.09)]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ color: "var(--ink-2)" }}
        aria-hidden
      >
        <circle cx="7" cy="7" r="4.4" />
        <path d="m10.4 10.4 3.1 3.1" />
      </svg>
      {/* the chord itself, given up first when the bar runs out of room */}
      <span
        aria-hidden
        className="hidden text-[10.5px] tabular-nums lg:block"
        style={{ color: "var(--ink-4)", letterSpacing: "0.04em" }}
      >
        ⌃Space
      </span>
    </button>
  );
}

/**
 * The menu-bar transport read-out.
 *
 * Three states, all of them true: playing (bars move, title shown), paused
 * (bars flat, title shown) and inactive (nothing in the bar at all). It reads
 * the same store as Signal and the Control Centre, so it can never disagree
 * with them.
 */
function MusicIndicator() {
  const music = useMusic();
  const track = musicStore.current();
  if (!music.engaged || !track) return null;
  return (
    <button
      type="button"
      onClick={() => launch("music")}
      aria-label={`${music.playing ? "Playing" : "Paused"}: ${track.title} by ${track.artist}. Open Signal.`}
      title={`${music.playing ? "Playing" : "Paused"} — ${track.title} · ${track.artist}`}
      className="flex h-[22px] max-w-[190px] items-center gap-[5px] rounded px-2 transition-colors hover:bg-[rgba(255,255,255,0.09)]"
    >
      <span
        className="hidden truncate text-[11.5px] lg:block"
        style={{ color: music.playing ? "var(--ink-2)" : "var(--ink-3)" }}
      >
        {track.title}
      </span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="block w-[2px] rounded-full"
          style={{ background: "var(--ink-2)", height: 4 }}
          animate={music.playing ? { height: [4, 12, 6, 10, 4] } : { height: 4 }}
          transition={
            music.playing
              ? { duration: 1.1 + i * 0.22, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
        />
      ))}
    </button>
  );
}

function StatusCluster() {
  const online = useOnline();
  const battery = useBattery();

  return (
    <div className="flex items-center gap-2 px-1" style={{ color: "var(--ink-2)" }}>
      {battery && (
        <span
          className="flex items-center gap-1"
          title={`Battery ${Math.round(battery.level * 100)}%${battery.charging ? " — charging" : ""}`}
          aria-label={`Battery ${Math.round(battery.level * 100)} percent`}
        >
          <span className="meta" style={{ color: "var(--ink-3)" }}>
            {Math.round(battery.level * 100)}
          </span>
          <span
            className="relative block h-[9px] w-[18px] rounded-[2px] border"
            style={{ borderColor: "var(--ink-3)" }}
          >
            <span
              className="absolute inset-[1.5px] left-[1.5px] rounded-[1px]"
              style={{
                width: `calc(${Math.max(6, battery.level * 100)}% - 3px)`,
                background: battery.charging ? "var(--accent)" : "var(--ink-2)",
              }}
            />
          </span>
        </span>
      )}
      <span
        title={online ? "Network connected" : "Offline"}
        aria-label={online ? "Network connected" : "Offline"}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M2 6.2a9 9 0 0 1 12 0" opacity={online ? 0.85 : 0.2} />
          <path d="M4.4 8.8a5.6 5.6 0 0 1 7.2 0" opacity={online ? 0.85 : 0.2} />
          <circle cx="8" cy="11.8" r="1" fill="currentColor" stroke="none" opacity={online ? 0.9 : 0.35} />
          {!online && <path d="M3 13 13 3" stroke="currentColor" strokeWidth="1.2" />}
        </svg>
      </span>
    </div>
  );
}

/**
 * The date and time readout — and the system's calendar and clock affordance.
 *
 * Two buttons rather than one: the date opens Calendar, the time opens Clock,
 * which is both what the surface is about and what anyone reaching for it
 * expects. `launch` focuses an existing singleton window and un-minimises it,
 * so pressing either one twice raises what is already open instead of stacking
 * a second copy.
 */
function Clock() {
  const now = useClock();
  const chip =
    "rounded px-1.5 py-[3px] text-[12px] tabular-nums transition-colors hover:bg-[rgba(255,255,255,0.09)]";

  return (
    <div className="flex items-center pr-1">
      <button
        type="button"
        onClick={() => launch("calendar")}
        aria-label={`${now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })} — open Calendar`}
        title="Open Calendar"
        className={`hidden sm:block ${chip}`}
        style={{ color: "var(--ink-2)" }}
      >
        {now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
      </button>
      <button
        type="button"
        onClick={() => launch("clock")}
        aria-label={`${now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} — open Clock`}
        title="Open Clock"
        className={chip}
        style={{ color: "var(--ink)" }}
      >
        <time dateTime={now.toISOString()}>
          {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </time>
      </button>
    </div>
  );
}
