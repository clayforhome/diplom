import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { removeToast } from '../../../store/slices/uiSlice';
import './ToastViewport.scss';

export function ToastViewport() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);
  const [closingIds, setClosingIds] = useState<string[]>([]);
  const timeoutRefs = useRef<Record<string, number[]>>({});

  useEffect(() => {
    toasts.forEach((toast) => {
      if (timeoutRefs.current[toast.id]) {
        return;
      }

      const closeTimer = window.setTimeout(() => {
        setClosingIds((current) => (current.includes(toast.id) ? current : [...current, toast.id]));
      }, 2800);

      const removeTimer = window.setTimeout(() => {
        dispatch(removeToast(toast.id));
        setClosingIds((current) => current.filter((id) => id !== toast.id));
        delete timeoutRefs.current[toast.id];
      }, 3400);

      timeoutRefs.current[toast.id] = [closeTimer, removeTimer];
    });

    Object.keys(timeoutRefs.current).forEach((toastId) => {
      if (toasts.some((toast) => toast.id === toastId)) {
        return;
      }

      timeoutRefs.current[toastId].forEach((timer) => window.clearTimeout(timer));
      delete timeoutRefs.current[toastId];
      setClosingIds((current) => current.filter((id) => id !== toastId));
    });
  }, [dispatch, toasts]);

  useEffect(
    () => () => {
      Object.values(timeoutRefs.current).flat().forEach((timer) => window.clearTimeout(timer));
    },
    []
  );

  return (
    <div className="toast-viewport">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-viewport__item toast-viewport__item--${toast.tone}${closingIds.includes(toast.id) ? ' toast-viewport__item--closing' : ''}`}
        >
          <span className="toast-viewport__pulse" aria-hidden="true" />
          <div className="toast-viewport__content">
            <strong>{toast.title}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
