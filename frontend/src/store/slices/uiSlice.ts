import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ToastItem } from '../../types';

interface UiState {
  mobileMenuOpen: boolean;
  toasts: ToastItem[];
  activeRequests: number;
}

const initialState: UiState = {
  mobileMenuOpen: false,
  toasts: [],
  activeRequests: 0
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
    beginRequest(state) {
      state.activeRequests += 1;
    },
    endRequest(state) {
      state.activeRequests = Math.max(0, state.activeRequests - 1);
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    }
  }
});

export const { pushToast, removeToast, setMobileMenuOpen, beginRequest, endRequest } = uiSlice.actions;
export default uiSlice.reducer;
