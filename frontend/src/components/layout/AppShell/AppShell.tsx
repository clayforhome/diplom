import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../Header/Header';
import { ToastViewport } from '../../ui/ToastViewport/ToastViewport';
import { useAppDispatch } from '../../../store/hooks';
import { fetchCurrentUserThunk } from '../../../store/slices/authSlice';
import './AppShell.scss';

export function AppShell() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUserThunk());
  }, [dispatch]);

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
