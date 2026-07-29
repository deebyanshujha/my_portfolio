import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";

export type Toast = {
  id: string;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (nextToast: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { ...nextToast, id }]);
      window.setTimeout(() => dismiss(id), 3400);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [dismiss, toast, toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
