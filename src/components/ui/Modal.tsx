import { X } from "@phosphor-icons/react"
import { useEffect, useRef, type ReactNode } from "react"

export function Modal({ open, title, description, onClose, children }: {
  open: boolean
  title: string
  description?: string
  onClose(): void
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={dialogRef} className="modal" onCancel={onClose} onClose={onClose}>
      <div className="modal-header">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Dialog schließen">
          <X size={18} weight="bold" />
        </button>
      </div>
      {children}
    </dialog>
  )
}
