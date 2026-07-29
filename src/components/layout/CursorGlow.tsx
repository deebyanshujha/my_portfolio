import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";

export function CursorGlow() {
  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);
  const smoothX = useSpring(mouseX, { stiffness: 120, damping: 28, mass: 0.4 });
  const smoothY = useSpring(mouseY, { stiffness: 120, damping: 28, mass: 0.4 });

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [mouseX, mouseY]);

  const background = useMotionTemplate`radial-gradient(420px circle at ${smoothX}px ${smoothY}px, rgba(59,130,246,0.12), rgba(139,92,246,0.06) 36%, transparent 68%)`;

  return <motion.div className="pointer-events-none fixed inset-0 z-20 hidden md:block" style={{ background }} />;
}
