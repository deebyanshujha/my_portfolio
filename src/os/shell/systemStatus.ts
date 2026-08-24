import { useEffect, useState } from "react";

/**
 * Real system status only.
 *
 * The network indicator reflects `navigator.onLine`; the battery indicator is
 * rendered only where the Battery Status API actually exists. Nothing here is
 * a decorative icon pretending to know something the browser cannot tell us.
 */

/**
 * The current time, re-read on a boundary rather than on a drifting interval.
 *
 * Each tick is scheduled to land on the next multiple of `intervalMs`, so a
 * seconds display changes exactly when the second does instead of sliding by a
 * few milliseconds an hour. Background tabs throttle timers hard, so the clock
 * also resyncs the instant the page becomes visible again — which is what makes
 * a restored Clock window show the real time immediately rather than whatever
 * it managed to count to while throttled.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer = 0;

    const schedule = () => {
      timer = window.setTimeout(
        () => {
          setNow(new Date());
          schedule();
        },
        intervalMs - (Date.now() % intervalMs),
      );
    };
    schedule();

    const resync = () => {
      if (document.hidden) return;
      window.clearTimeout(timer);
      setNow(new Date());
      schedule();
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
    };
  }, [intervalMs]);

  return now;
}

/** The menu-bar clock: minute resolution is all it shows. */
export function useClock(): Date {
  return useNow(60_000);
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

type BatteryInfo = { level: number; charging: boolean };

type BatteryManager = EventTarget & { level: number; charging: boolean };

export function useBattery(): BatteryInfo | null {
  const [info, setInfo] = useState<BatteryInfo | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManager>;
    };
    if (!nav.getBattery) return; // unsupported — the indicator simply isn't shown

    let battery: BatteryManager | null = null;
    const update = () => {
      if (battery) setInfo({ level: battery.level, charging: battery.charging });
    };

    nav
      .getBattery()
      .then((b) => {
        battery = b;
        update();
        b.addEventListener("levelchange", update);
        b.addEventListener("chargingchange", update);
      })
      .catch(() => setInfo(null));

    return () => {
      battery?.removeEventListener("levelchange", update);
      battery?.removeEventListener("chargingchange", update);
    };
  }, []);

  return info;
}
