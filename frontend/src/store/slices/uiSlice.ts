import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ToastItem } from '../../types';

interface UiState {
  mobileMenuOpen: boolean;
  toasts: ToastItem[];
}

const initialState: UiState = {
  mobileMenuOpen: false,
  toasts: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMobileMenuOpen(state, action: PayloadAction<boolean>) {
      state.mobileMenuOpen = action.payload;
    },
    pushToast(state, action: PayloadAction<Omit<ToastItem, 'id'>>) {
      state.toasts.push({
        id: crypto.randomUUID(),
        ...action.payload
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    }
  }
});

export const { pushToast, removeToast, setMobileMenuOpen } = uiSlice.actions;
export default uiSlice.reducer;
