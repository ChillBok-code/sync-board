// src/shared/ui/toast.tsx
"use client";

import * as React from "react";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
};

const ToastContext = React.createContext<{
  toasts: ToastItem[];
  pushToast: (t: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const pushToast = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((s) => [...s, { id, ...t }]);
    // auto remove
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, pushToast, removeToast }}>
      {children}
      <div className="fixed right-4 bottom-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="max-w-sm rounded-md bg-gray-800/80 border border-gray-700/60 p-3 text-sm text-white shadow"
          >
            <div className="font-bold">{t.title}</div>
            {t.description && (
              <div className="text-slate-300 text-xs mt-1">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const ctx = React.useContext(ToastContext);
  if (!ctx)
    throw new Error("useToastContext must be used within ToastProvider");
  return ctx;
}
