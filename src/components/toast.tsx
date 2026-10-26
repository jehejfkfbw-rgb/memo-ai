"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconAlert, IconCheckCircle, IconClose, IconInfo } from "@/components/icons";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; tone: ToastTone; message: string };

const ToastContext = createContext<{ push: (message: string, tone?: ToastTone) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((message: string, tone: ToastTone = "success") => {
    seq += 1;
    const id = seq;
    setToasts((t) => [...t.slice(-3), { id, tone, message }]);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-7">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4200);
    return () => clearTimeout(timer);
  }, [onClose, toast.id]);

  const tone = {
    success: { cls: "border-success/30 bg-white text-success", Icon: IconCheckCircle },
    error: { cls: "border-danger/30 bg-white text-danger", Icon: IconAlert },
    info: { cls: "border-navy-200 bg-white text-navy-700", Icon: IconInfo },
  }[toast.tone];

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-lift animate-fade-up",
        tone.cls,
      )}
      role="status"
    >
      <tone.Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-semibold leading-6 text-navy-800">{toast.message}</p>
      <button onClick={onClose} className="rounded-md p-1 text-mist-400 transition hover:bg-mist-100 hover:text-navy-700" aria-label="إغلاق التنبيه">
        <IconClose className="h-4 w-4" />
      </button>
    </div>
  );
}
