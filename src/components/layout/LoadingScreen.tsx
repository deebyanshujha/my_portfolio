import { motion } from "motion/react";

export function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center bg-canvas"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45, ease: "easeInOut" } }}
    >
      <motion.div
        className="relative flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="gradient-border grid size-16 place-items-center rounded-lg bg-card shadow-glow">
          <span className="font-display text-xl font-semibold text-primary">
            DJ
          </span>
        </div>
        <div className="h-1 w-44 overflow-hidden rounded-full bg-border-subtle">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-electric via-violet to-mint"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.86, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
