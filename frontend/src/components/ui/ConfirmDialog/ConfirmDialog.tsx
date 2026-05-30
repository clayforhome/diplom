import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  confirmLabel,
  cancelLabel,
  isConfirming = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (isOpen) {
      dialog.showModal();
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.paddingRight = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} className="confirm-dialog" onClick={handleBackdropClick} onCancel={onCancel}>
      <div className="confirm-dialog__panel">
        <div className="confirm-dialog__icon" aria-hidden="true">!</div>
        <h2 className="confirm-dialog__title">{title}</h2>
        {description && <p className="confirm-dialog__description">{description}</p>}
        <div className="confirm-dialog__actions">
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? t('common.loading') : confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
