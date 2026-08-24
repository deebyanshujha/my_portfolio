import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { windowStore } from "./windowStore";

export type AppId =
  | "terminal"
  | "projects"
  | "about"
  | "resume"
  | "github"
  | "skills"
  | "achievements"
  | "music"
  | "calendar"
  | "clock"
  | "settings";

export type AppProps = {
  windowId: string;
  focused: boolean;
  payload?: unknown;
};

export type MenuItem =
  | { kind: "item"; label: string; shortcut?: string; run: (windowId: string) => void }
  | { kind: "separator" };

export type AppMenu = { title: string; items: MenuItem[] };

export type AppDefinition = {
  id: AppId;
  name: string;
  /** one-line description shown in the dock tooltip and About This System */
  blurb: string;
  /**
   * The icon's colour. Saturated: the tile is filled with it and the glyph is
   * drawn in white on top, the way a desktop icon set reads at a glance.
   */
  tint: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  singleton: boolean;
  /** shown in the dock, in this order */
  inDock: boolean;
  /** shown on the desktop as a file/volume icon */
  onDesktop: boolean;
  component: LazyExoticComponent<ComponentType<AppProps>>;
};

export const APPS: Record<AppId, AppDefinition> = {
  terminal: {
    id: "terminal",
    name: "Terminal",
    blurb: "A shell into the portfolio",
    tint: "#2C3038",
    width: 720,
    height: 460,
    minWidth: 420,
    minHeight: 260,
    singleton: false,
    inDock: true,
    onDesktop: false,
    component: lazy(() => import("../apps/terminal/TerminalApp")),
  },
  projects: {
    id: "projects",
    name: "Projects",
    blurb: "Browse the work as a filesystem",
    tint: "#3B82F6",
    width: 900,
    height: 580,
    minWidth: 560,
    minHeight: 380,
    singleton: true,
    inDock: true,
    onDesktop: true,
    component: lazy(() => import("../apps/projects/ProjectsApp")),
  },
  about: {
    id: "about",
    name: "About",
    blurb: "Who is behind this machine",
    tint: "#18B6CE",
    width: 620,
    height: 500,
    minWidth: 420,
    minHeight: 380,
    singleton: true,
    inDock: true,
    onDesktop: false,
    component: lazy(() => import("../apps/about/AboutApp")),
  },
  resume: {
    id: "resume",
    name: "Resume",
    blurb: "The document, viewable and downloadable",
    tint: "#EF4444",
    width: 780,
    height: 640,
    minWidth: 460,
    minHeight: 380,
    singleton: true,
    inDock: true,
    onDesktop: true,
    component: lazy(() => import("../apps/resume/ResumeApp")),
  },
  skills: {
    id: "skills",
    name: "Skills",
    blurb: "Capability map of the system",
    tint: "#8B5CF6",
    width: 860,
    height: 560,
    minWidth: 520,
    minHeight: 400,
    singleton: true,
    inDock: true,
    onDesktop: false,
    component: lazy(() => import("../apps/skills/SkillsApp")),
  },
  achievements: {
    id: "achievements",
    name: "Achievements",
    blurb: "Unlocked over time, with receipts",
    tint: "#F59E0B",
    width: 780,
    height: 560,
    minWidth: 480,
    minHeight: 380,
    singleton: true,
    inDock: true,
    onDesktop: false,
    component: lazy(() => import("../apps/achievements/AchievementsApp")),
  },
  github: {
    id: "github",
    name: "GitHub",
    blurb: "Live repositories and recent pushes",
    tint: "#2A2F36",
    width: 820,
    height: 580,
    minWidth: 500,
    minHeight: 380,
    singleton: true,
    inDock: true,
    onDesktop: false,
    component: lazy(() => import("../apps/github/GithubApp")),
  },
  music: {
    id: "music",
    name: "Signal",
    blurb: "Spotify playback, or the local engine",
    tint: "#FB3B5C",
    width: 840,
    height: 540,
    minWidth: 520,
    minHeight: 400,
    singleton: true,
    inDock: true,
    onDesktop: false,
    component: lazy(() => import("../apps/music/MusicApp")),
  },
  calendar: {
    id: "calendar",
    name: "Calendar",
    blurb: "The month, and what day it is",
    tint: "#E5484D",
    width: 760,
    height: 560,
    minWidth: 480,
    minHeight: 420,
    singleton: true,
    // opened from the desktop widget rather than the dock
    inDock: false,
    onDesktop: false,
    component: lazy(() => import("../apps/calendar/CalendarApp")),
  },
  clock: {
    id: "clock",
    name: "Clock",
    blurb: "Local time, to the second",
    tint: "#5A6472",
    width: 560,
    height: 420,
    minWidth: 380,
    minHeight: 340,
    singleton: true,
    // opened from the desktop widget rather than the dock
    inDock: false,
    onDesktop: false,
    component: lazy(() => import("../apps/clock/ClockApp")),
  },
  settings: {
    id: "settings",
    name: "Settings",
    blurb: "Tune the environment",
    tint: "#6B7280",
    width: 700,
    height: 540,
    minWidth: 460,
    minHeight: 400,
    singleton: true,
    inDock: true,
    onDesktop: false,
    component: lazy(() => import("../apps/settings/SettingsApp")),
  },
};

export const DOCK_ORDER: AppId[] = [
  "terminal",
  "projects",
  "about",
  "resume",
  "skills",
  "achievements",
  "github",
  "music",
  "settings",
];

/** Everything launchable, dock or not — used by Spotlight and the compact shell. */
export const ALL_APPS: AppId[] = [...DOCK_ORDER, "calendar", "clock"];

export function launch(id: AppId, payload?: unknown): string {
  const app = APPS[id];
  return windowStore.open(id, {
    title: app.name,
    w: app.width,
    h: app.height,
    singleton: app.singleton,
    payload,
  });
}
