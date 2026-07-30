import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { Button } from "./button";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            className="gradient-border rounded-lg bg-glass-bg p-4 shadow-soft backdrop-blur-xl"
            role="status"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 size-2 rounded-full bg-mint shadow-[0_0_18px_rgba(52,211,153,0.7)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-1 text-sm leading-6 text-secondary">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
