"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

type ToastContextValue = {
  toasts: Toast[];
  toast: (message: string, type?: Toast["type"]) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all animate-in slide-in-from-bottom-2 ${
              t.type === "success"
                ? "bg-green-600 text-white"
                : t.type === "error"
                  ? "bg-red-600 text-white"
                  : "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
            }`}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
