type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-[#2C2215]">{title}</h3>
        <p className="mt-2 text-sm text-[#6B5B48]">{message}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${tone === 'danger' ? 'btn-danger' : 'btn-primary'} flex-1`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

