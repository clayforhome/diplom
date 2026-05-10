import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastViewport } from '../../ui/ToastViewport/ToastViewport';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCurrentUserThunk, hydrateSessionFromStorage } from '../../../store/slices/authSlice';
import { Header } from '../Header/Header';
import './AppShell.scss';

export function AppShell() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    dispatch(hydrateSessionFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    dispatch(fetchCurrentUserThunk());
  }, [dispatch, isAuthenticated]);

  return (
    <div className="app-shell">
      <ToastViewport />
      <div className="app-shell__gradient" />
      <div className="app-shell__container">
        <Header />
        <Outlet />
      </div>
    </div>
  );
}
