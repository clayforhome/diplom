import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import sessionsReducer from './slices/sessionsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sessions: sessionsReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
