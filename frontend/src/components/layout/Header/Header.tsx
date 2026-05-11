import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { useAppDispatch } from '../../../store/hooks';
import { logout } from '../../../store/slices/authSlice';
import { useAuth } from '../../../hooks/useAuth';
import { authService } from '../../../http/authService';
import { getDisplayName, getProfileAvatarStyle, getProfileInitials } from '../../../utils/profile';
import './Header.scss';

export function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, roles } = useAuth();

  const userTitle = getDisplayName(user?.name, user?.userName, user?.email);
  const userSubtitle = user?.email ?? 'Эл. почта не указана';
  const avatarStyle = getProfileAvatarStyle(user?.name, user?.userName, user?.email);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {

    } finally {
      dispatch(logout());
      navigate('/auth/login');
    }
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__brand-copy">
          <span className="app-header__eyebrow">Система управления встречами</span>
          <strong className="app-header__title">Центр управления</strong>
        </div>
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
            {getProfileInitials(user?.name, user?.userName, user?.email)}
          </div>
          <div className="app-header__user-meta">
            <span className="app-header__user-name">{userTitle}</span>
            <span className="app-header__user-role">{userSubtitle}</span>
          </div>
        </div>
        <Button variant="secondary" onClick={() => void handleLogout()}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
