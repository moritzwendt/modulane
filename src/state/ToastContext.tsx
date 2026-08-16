import { CheckCircle, Info, X } from "@phosphor-icons/react"
import { createContext, useContext, useState, type ReactNode } from "react"

type ToastTone = "success" | "info"

interface ToastMessage {
  id: string
  text: string
  tone: ToastTone
}

interface ToastContextValue {
  showToast(text: string, tone?: ToastTone): void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismiss = (id: string) => setToasts((current) => current.filter((toast) => toast.id !== id))

  const showToast = (text: string, tone: ToastTone = "success") => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, text, tone }])
    window.setTimeout(() => dismiss(id), 3600)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-region" aria-live="polite" aria-label="Rückmeldungen">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            {toast.tone === "success" ? <CheckCircle size={18} weight="fill" /> : <Info size={18} weight="fill" />}
            <span>{toast.text}</span>
            <button type="button" onClick={() => dismiss(toast.id)} aria-label="Rückmeldung schließen"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast muss innerhalb des ToastProvider verwendet werden")
  return context
}
