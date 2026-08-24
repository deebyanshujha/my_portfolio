import { profile } from "../../data/profile";
import { appBus } from "../kernel/appBus";
import { APPS, launch, type AppId, type AppMenu } from "../kernel/appRegistry";
import { windowStore } from "../kernel/windowStore";
import { musicStore } from "../kernel/musicStore";

const openExternal = (href: string) => window.open(href, "_blank", "noopener,noreferrer");

const sep = { kind: "separator" } as const;

/**
 * Real menus. Every item below performs an action — there is no placeholder
 * item in this system, and an app only advertises what it can actually do.
 */
export function appMenus(appId: AppId | null, windowId: string | null): AppMenu[] {
  const windowMenu: AppMenu = {
    title: "Window",
    items: [
      {
        kind: "item",
        label: "Minimize",
        shortcut: "⌘M",
        run: (id) => id && windowStore.minimize(id),
      },
      {
        kind: "item",
        label: "Zoom",
        run: (id) => id && windowStore.toggleMaximize(id),
      },
      sep,
      {
        kind: "item",
        label: "Close Window",
        shortcut: "⌘W",
        run: (id) => id && windowStore.close(id),
      },
      {
        kind: "item",
        label: "Close All Windows",
        run: () => windowStore.reset(),
      },
    ],
  };

  const helpFor = (title: string, body: string): AppMenu => ({
    title: "Help",
    items: [
      {
        kind: "item",
        label: `What is ${title}?`,
        run: (id) => appBus.emit(id, "help", body),
      },
      sep,
      { kind: "item", label: "Open Terminal", shortcut: "⌘K", run: () => launch("terminal") },
    ],
  });

  if (!appId || !windowId) {
    return [
      {
        title: "Go",
        items: [
          { kind: "item", label: "Projects", run: () => launch("projects") },
          { kind: "item", label: "About", run: () => launch("about") },
          { kind: "item", label: "Resume", run: () => launch("resume") },
          { kind: "item", label: "Terminal", shortcut: "⌘K", run: () => launch("terminal") },
        ],
      },
    ];
  }

  const app = APPS[appId];

  switch (appId) {
    case "terminal":
      return [
        {
          title: "Shell",
          items: [
            { kind: "item", label: "New Terminal", shortcut: "⌘N", run: () => launch("terminal") },
            { kind: "item", label: "Clear", shortcut: "⌃L", run: (id) => appBus.emit(id, "clear") },
            sep,
            {
              kind: "item",
              label: "Run `neofetch`",
              run: (id) => appBus.emit(id, "run", "neofetch"),
            },
            { kind: "item", label: "Run `help`", run: (id) => appBus.emit(id, "run", "help") },
          ],
        },
        windowMenu,
        helpFor(app.name, "Type `help` for the command list. Arrow keys walk history; Tab completes."),
      ];

    case "projects":
      return [
        {
          title: "File",
          items: [
            {
              kind: "item",
              label: "Open Repository",
              shortcut: "⌘↩",
              run: (id) => appBus.emit(id, "open-repo"),
            },
            { kind: "item", label: "Back to Volumes", run: (id) => appBus.emit(id, "back") },
          ],
        },
        {
          title: "View",
          items: [
            { kind: "item", label: "as Grid", shortcut: "⌘1", run: (id) => appBus.emit(id, "view", "grid") },
            { kind: "item", label: "as List", shortcut: "⌘2", run: (id) => appBus.emit(id, "view", "list") },
            sep,
            {
              kind: "item",
              label: "Show Hidden Files",
              shortcut: "⌘.",
              run: (id) => appBus.emit(id, "toggle-hidden"),
            },
          ],
        },
        windowMenu,
        helpFor(app.name, "Each project is a volume. Open one to read its files."),
      ];

    case "resume":
      return [
        {
          title: "File",
          items: [
            {
              kind: "item",
              label: "Download PDF",
              shortcut: "⌘S",
              run: (id) => appBus.emit(id, "download"),
            },
            { kind: "item", label: "Open in New Tab", run: () => openExternal(profile.resumeUrl) },
          ],
        },
        {
          title: "View",
          items: [
            { kind: "item", label: "Document", run: (id) => appBus.emit(id, "view", "pdf") },
            { kind: "item", label: "Plain Text", run: (id) => appBus.emit(id, "view", "text") },
          ],
        },
        windowMenu,
      ];

    case "music":
      return [
        {
          title: "Playback",
          items: [
            { kind: "item", label: "Play / Pause", shortcut: "Space", run: () => musicStore.toggle() },
            { kind: "item", label: "Next Track", run: () => musicStore.next() },
            { kind: "item", label: "Previous Track", run: () => musicStore.prev() },
          ],
        },
        windowMenu,
        helpFor(
          app.name,
          "Every track is generated live with the Web Audio API — nothing is streamed and nothing is faked.",
        ),
      ];

    case "github":
      return [
        {
          title: "Repositories",
          items: [
            { kind: "item", label: "Refresh", shortcut: "⌘R", run: (id) => appBus.emit(id, "refresh") },
            sep,
            { kind: "item", label: "Open GitHub Profile", run: () => openExternal(profile.github) },
          ],
        },
        windowMenu,
      ];

    case "settings":
      return [
        {
          title: "System",
          items: [
            { kind: "item", label: "Reset to Defaults", run: (id) => appBus.emit(id, "reset") },
          ],
        },
        windowMenu,
      ];

    case "skills":
      return [
        {
          title: "View",
          items: [
            { kind: "item", label: "Clear Selection", run: (id) => appBus.emit(id, "clear") },
          ],
        },
        windowMenu,
        helpFor(app.name, "Hover a module to light its dependencies. Click to inspect it."),
      ];

    case "achievements":
      return [
        {
          title: "View",
          items: [
            { kind: "item", label: "Achievements", run: (id) => appBus.emit(id, "tab", "trophies") },
            { kind: "item", label: "Credentials", run: (id) => appBus.emit(id, "tab", "credentials") },
          ],
        },
        windowMenu,
      ];

    case "calendar":
      return [
        {
          title: "View",
          items: [
            { kind: "item", label: "Today", shortcut: "Home", run: (id) => appBus.emit(id, "today") },
            sep,
            {
              kind: "item",
              label: "Previous Month",
              shortcut: "⇞",
              run: (id) => appBus.emit(id, "prev-month"),
            },
            {
              kind: "item",
              label: "Next Month",
              shortcut: "⇟",
              run: (id) => appBus.emit(id, "next-month"),
            },
          ],
        },
        windowMenu,
        helpFor(
          app.name,
          "Arrow keys walk the grid, Page Up and Page Down change month, Home returns to today. Nothing is scheduled here — no calendar account is connected.",
        ),
      ];

    case "clock":
      return [
        {
          title: "Go",
          items: [{ kind: "item", label: "Calendar", run: () => launch("calendar") }],
        },
        windowMenu,
        helpFor(
          app.name,
          "Local time from this device, resynced whenever the page becomes visible so a throttled tab can never drift.",
        ),
      ];

    case "about":
      return [
        {
          title: "Contact",
          items: [
            { kind: "item", label: "Copy Email", run: (id) => appBus.emit(id, "copy-email") },
            { kind: "item", label: "Open LinkedIn", run: () => openExternal(profile.linkedin) },
            { kind: "item", label: "Open GitHub", run: () => openExternal(profile.github) },
          ],
        },
        windowMenu,
      ];

    default:
      return [windowMenu];
  }
}
