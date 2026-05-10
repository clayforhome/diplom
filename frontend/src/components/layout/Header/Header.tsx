import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { useAppDispatch } from '../../../store/hooks';
import { logout } from '../../../store/slices/authSlice';
import { useAuth } from '../../../hooks/useAuth';
import './Header.scss';

export function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, roles } = useAuth();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__eyebrow">Meeting Management System</span>
        <strong className="app-header__title">Control Center</strong>
      </div>
      <nav className="app-header__nav">
        <NavLink to="/">Главная</NavLink>
        <NavLink to="/sessions">Встречи</NavLink>
        <NavLink to="/profile">Профиль</NavLink>
        {roles.includes('Admin') ? <NavLink to="/admin/users">Пользователи</NavLink> : null}
      </nav>
      <div className="app-header__actions">
        <div className="app-header__user">
          <span className="app-header__user-name">{user?.name ?? user?.email ?? 'Пользователь'}</span>
          <span className="app-header__user-role">{roles.join(', ') || 'User'}</span>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
