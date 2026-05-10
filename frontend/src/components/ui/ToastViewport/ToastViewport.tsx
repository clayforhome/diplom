import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { removeToast } from '../../../store/slices/uiSlice';
import './ToastViewport.scss';

export function ToastViewport() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch(removeToast(toasts[0].id));
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [dispatch, toasts]);

  return (
    <div className="toast-viewport">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-viewport__item toast-viewport__item--${toast.tone}`}>
          {toast.title}
        </div>
      ))}
    </div>
  );
}
