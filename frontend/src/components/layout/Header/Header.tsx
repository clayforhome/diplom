import type { CSSProperties } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { useAppDispatch } from '../../../store/hooks';
import { logout } from '../../../store/slices/authSlice';
import { useAuth } from '../../../hooks/useAuth';
import './Header.scss';

const avatarPalette = [
  ['#f97316', '#fb923c'],
  ['#2563eb', '#60a5fa'],
  ['#16a34a', '#4ade80'],
  ['#db2777', '#f472b6'],
  ['#7c3aed', '#a78bfa'],
  ['#0891b2', '#22d3ee'],
  ['#ca8a04', '#facc15'],
  ['#dc2626', '#f87171']
] as const;

function getLoginSeed(login: string) {
  return Array.from(login).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function getAvatarInitials(login: string) {
  return login.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '').slice(0, 2).toUpperCase() || 'U';
}

export function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, roles } = useAuth();

  const login = user?.userName ?? user?.email?.split('@')[0] ?? user?.name ?? 'user';
  const [avatarStart, avatarEnd] = avatarPalette[getLoginSeed(login) % avatarPalette.length];
  const userTitle = user?.name ?? user?.userName ?? user?.email ?? 'Пользователь';
  const userSubtitle = user?.email ?? user?.userName ?? (roles.join(', ') || 'User');
  const avatarStyle = {
    '--avatar-start': avatarStart,
    '--avatar-end': avatarEnd
  } as CSSProperties;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth/login');
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__brand-copy">
          <span className="app-header__eyebrow">Meeting Management System</span>
          <strong className="app-header__title">Control Center</strong>
        </div>
        <span className="app-header__title-badge">Workspace</span>
      </div>
      <nav className="app-header__nav">
        <NavLink to="/">Главная</NavLink>
        <NavLink to="/sessions">Встречи</NavLink>
        <NavLink to="/profile">Профиль</NavLink>
        {roles.includes('Admin') ? <NavLink to="/admin/users">Пользователи</NavLink> : null}
      </nav>
      <div className="app-header__actions">
        <div className="app-header__user">
          <div className="app-header__avatar" style={avatarStyle} aria-hidden="true">
            {getAvatarInitials(login)}
          </div>
          <div className="app-header__user-meta">
            <span className="app-header__user-name">{userTitle}</span>
            <span className="app-header__user-role">{userSubtitle}</span>
          </div>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
