import { motion, useScroll, useSpring } from "motion/react";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 160, damping: 28, mass: 0.35 });

  return (
    <motion.div
      className="fixed left-0 top-0 z-[70] h-[3px] w-full origin-left bg-gradient-to-r from-electric via-violet to-mint"
      style={{ scaleX }}
    />
  );
}
