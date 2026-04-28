// src/shared/hooks/useToast.tsx
"use client";

import { useToastContext } from "@/shared/ui/toast";

export function useToast() {
  const { pushToast, removeToast, toasts } = useToastContext();
  return { pushToast, removeToast, toasts };
}
