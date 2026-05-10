import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { pushToast } from '../store/slices/uiSlice';

export function useToast() {
  const dispatch = useAppDispatch();

  return useCallback(
    (title: string, tone: 'info' | 'success' | 'error' = 'info') => {
      dispatch(pushToast({ title, tone }));
    },
    [dispatch]
  );
}
