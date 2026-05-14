import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { JSX, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { Toast, type ToastVariant } from "./toast.js";

interface ToastDescriptor {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Auto-dismiss in ms. Default 5000. Pass `null` for sticky. */
  duration?: number | null;
  action?: { label: ReactNode; onClick: () => void };
}

interface ToastContextValue {
  toast: (descriptor: Omit<ToastDescriptor, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToasterProps {
  children: ReactNode;
  /** Toast viewport position. Default bottom-right. */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}

const POSITION_CLASS: Record<NonNullable<ToasterProps["position"]>, string> = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

/**
 * Toaster — mount once at the app root. Wraps children in a Radix Toast
 * Provider + Viewport and exposes the `useToast()` hook for descendants.
 */
function Toaster({ children, position = "bottom-right", className }: ToasterProps): JSX.Element {
  const [toasts, setToasts] = useState<ToastDescriptor[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((cur) => cur.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((descriptor: Omit<ToastDescriptor, "id">) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((cur) => [...cur, { id, ...descriptor }]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      <Toast.Provider swipeDirection="right" duration={5000}>
        {children}
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant ?? "default"}
            duration={t.duration === null ? Number.POSITIVE_INFINITY : (t.duration ?? 5000)}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
          >
            {t.title ? <Toast.Title>{t.title}</Toast.Title> : null}
            {t.description ? <Toast.Description>{t.description}</Toast.Description> : null}
            {t.action ? (
              <Toast.Action altText={String(t.action.label)} onClick={t.action.onClick}>
                {t.action.label}
              </Toast.Action>
            ) : null}
            <Toast.Close />
          </Toast>
        ))}
        <Toast.Viewport
          className={cn(
            "fixed z-50 flex max-h-screen w-full max-w-sm flex-col gap-2 outline-none",
            POSITION_CLASS[position],
            className,
          )}
        />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

/**
 * useToast — fire toasts from anywhere inside <Toaster>.
 *
 * Example:
 *   const { toast } = useToast();
 *   toast({ title: "Deployed", variant: "success" });
 */
function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster>.");
  return ctx;
}

export { Toaster, useToast };
