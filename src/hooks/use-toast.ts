// src/hooks/use-toast.ts
// Адаптер под Sonner: сохраняем прежний API (useToast().toast({...}))
// и экспорт { toast }, но показываем уведомления через пакет "sonner".

import * as React from "react";
import { toast as sonner } from "sonner";

type ToastVariant = "default" | "destructive";

type ToastOptions = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;   // "destructive" → ошибка, иначе успех/инфо
  duration?: number;        // по умолчанию 3000 мс
  // оставляем поле для совместимости, если вдруг где-то прокидывают action
  action?: React.ReactNode;
};

function showWithSonner({ title, description, variant, duration }: ToastOptions) {
  const dur = typeof duration === "number" ? duration : 3000;

  if (variant === "destructive") {
    sonner.error(title ?? "Ошибка", {
      description,
      duration: dur,
    });
  } else {
    sonner.success(title ?? "Готово", {
      description,
      duration: dur,
    });
  }
}

/**
 * Совместимый хук:
 *   const { toast } = useToast();
 *   toast({ title, description, variant })
 */
export function useToast() {
  return {
    // массив тостов в старом API — нам не нужен, но оставим для совместимости
    toasts: [] as any[],
    toast: (opts: ToastOptions) => showWithSonner(opts),
    // поддержим dismiss — Sonner умеет dismiss(id?) / dismiss() для всех
    dismiss: (toastId?: string) => {
      // sonner.dismiss() принимает необязательный id (string | number)
      // у нас id в старом API не генерятся — просто закроем все, если без id
      // @ts-ignore
      sonner.dismiss(toastId as any);
    },
  };
}

/**
 * Именованный экспорт для совместимости:
 *   import { toast } from "@/hooks/use-toast"
 *   toast({ ... })
 */
export const toast = (opts: ToastOptions) => showWithSonner(opts);
