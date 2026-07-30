import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  offset?: [string, string];
};

export function FadeIn({
  children,
  className,
  offset = ["start 94%", "center 72%"],
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as any,
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.001,
  });

  const opacity = useTransform(progress, [0, 1], [0.2, 1]);
  const y = useTransform(progress, [0, 1], [24, 0]);
  const filter = useTransform(
    progress,
    (value) => `brightness(${0.94 + value * 0.06})`,
  );

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
