// src/components/ui/toaster.tsx
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3000}>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}

      {/* КРИТИЧНО: фиксированное позиционирование вне потока */}
      <ToastViewport
        className="
          fixed bottom-0 right-0 z-[100]
          flex max-h-screen w-full max-w-full flex-col gap-2 p-4 outline-none
          pointer-events-none
          sm:bottom-0 sm:right-0 sm:w-auto sm:max-w-[420px]
        "
      />
    </ToastProvider>
  )
}
