import { useEffect, useRef } from 'react';
import { Button } from '../Button/Button';
import './ConfirmDialog.scss';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  isConfirming = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      onClick={handleBackdropClick}
      onCancel={onCancel}
    >
      <div className="confirm-dialog__panel">
        <div className="confirm-dialog__icon" aria-hidden="true">⚠</div>
        <h2 className="confirm-dialog__title">{title}</h2>
        {description && <p className="confirm-dialog__description">{description}</p>}
        <div className="confirm-dialog__actions">
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Удаление…' : confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
