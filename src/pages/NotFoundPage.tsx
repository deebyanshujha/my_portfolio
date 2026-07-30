import { motion } from "motion/react";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "../components/ui/button";
import { profile } from "../data/profile";
import { cn } from "../lib/utils";

export default function NotFoundPage() {
  return (
    <motion.main
      className="relative grid min-h-screen place-items-center overflow-hidden px-4 pt-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-hero-grid bg-[length:42px_42px] opacity-[0.16] [mask-image:linear-gradient(to_bottom,#09090B,transparent_75%)]" />
      <motion.div
        className="gradient-border relative z-10 max-w-xl rounded-lg bg-glass-bg p-8 text-center shadow-soft backdrop-blur-xl"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="font-code text-sm uppercase tracking-[0.28em] text-electric">
          404
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-primary">
          This route is not part of the system.
        </h1>
        <p className="mt-4 text-base leading-7 text-secondary">
          Return to {profile.name}'s portfolio homepage and continue through the
          projects, resume, and contact sections.
        </p>
        <div className="mt-7 flex justify-center">
          <Link
            to="/"
            className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
          >
            <ArrowLeft className="size-4" />
            Back Home
            <Home className="size-4" />
          </Link>
        </div>
      </motion.div>
    </motion.main>
  );
}
