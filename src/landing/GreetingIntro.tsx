import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const GREETINGS = ["Hello", "こんにちは", "नमस्ते", "Hola"];
const STEP_MS = 760;
const DURATION_MS = 3370;

export function GreetingIntro({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((value) => Math.min(value + 1, GREETINGS.length - 1));
    }, STEP_MS);
    const done = window.setTimeout(onDone, DURATION_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(done);
    };
  }, [onDone]);

  return (
    <motion.div
      aria-hidden="true"
      className="absolute inset-0 z-[1000] grid place-items-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-[#111214]"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.48, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 origin-top bg-[#111214]"
        exit={{ y: "-100%" }}
        transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-[#111214]"
        exit={{ y: "100%" }}
        transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={GREETINGS[index]}
          className="relative flex min-w-[min(82vw,620px)] items-center justify-center gap-4 font-sans text-[clamp(3rem,8vw,6.5rem)] font-light leading-none tracking-[0.01em] text-[#e6e6e8]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className="text-[0.42em] text-[#a8a8ad]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            ·
          </motion.span>
          <span>{GREETINGS[index]}</span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
