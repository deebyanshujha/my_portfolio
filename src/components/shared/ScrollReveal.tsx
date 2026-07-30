import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  offset?: [string, string];
  delay?: number;
  enableBrightness?: boolean;
};

export function ScrollReveal({
  children,
  className,
  offset = ["start 96%", "center 70%"],
  enableBrightness = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const y = useTransform(smoothProgress, [0, 1], [32, 0]);
  const opacity = useTransform(smoothProgress, [0, 1], [0.18, 1]);

  // Optional brightness for cards when they reach center
  const brightness = useTransform(smoothProgress, [0, 1], [0.9, 1]);
  const filter = enableBrightness
    ? useTransform(brightness, (value) => `brightness(${value})`)
    : undefined;

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y, filter }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}
