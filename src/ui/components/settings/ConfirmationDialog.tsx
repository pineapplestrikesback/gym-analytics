/**
 * ConfirmationDialog
 *
 * Reusable confirmation dialog with customizable title, message, and button text.
 * Renders null when closed for zero DOM overhead.
 */

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps): React.ReactElement | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-w-sm rounded-lg bg-primary-800 p-6">
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="mb-6 text-primary-200">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-primary-300 transition-colors hover:text-white"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-cyan-500 px-4 py-2 font-medium text-black transition-colors hover:bg-cyan-400"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
