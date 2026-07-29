import { useMotionValue, useSpring } from "motion/react";
import type { PointerEvent } from "react";

export function useMagnetic(strength = 0.28) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 18, mass: 0.45 });
  const springY = useSpring(y, { stiffness: 180, damping: 18, mass: 0.45 });

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = (event.clientX - rect.left - rect.width / 2) * strength;
    const nextY = (event.clientY - rect.top - rect.height / 2) * strength;
    x.set(nextX);
    y.set(nextY);
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  return { style: { x: springX, y: springY }, onPointerMove, onPointerLeave };
}
