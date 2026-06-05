import { useEffect, useRef } from 'react'

type ScrapConfirmModalProps = {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function ScrapConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
}: ScrapConfirmModalProps): React.JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    cancelButtonRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
          [],
      ).filter((element) => !element.hasAttribute('disabled'))

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scrap-modal-title"
        aria-describedby="scrap-modal-body"
      >
        <h2 id="scrap-modal-title">Scrap this draft?</h2>
        <p id="scrap-modal-body">
          This will clear everything on the page. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="modal-button modal-button--secondary"
            onClick={onCancel}
          >
            Keep writing
          </button>
          <button
            type="button"
            className="modal-button modal-button--danger"
            onClick={onConfirm}
          >
            Scrap draft
          </button>
        </div>
      </div>
    </div>
  )
}
