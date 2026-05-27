import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { authService } from '../../../http/authService';
import { useAppDispatch } from '../../../store/hooks';
import { logout } from '../../../store/slices/authSlice';
import { getDisplayName, getProfileAvatarStyle, getProfileInitials } from '../../../utils/profile';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher/LanguageSwitcher';
import { Button } from '../../ui/Button/Button';
import './Header.scss';

export function Header() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, roles } = useAuth();
  const { t } = useTranslation();

  const userTitle = getDisplayName(user?.name, user?.userName, user?.email);
  const userSubtitle = user?.email ?? t('common.emailNotSpecified');
  const avatarStyle = getProfileAvatarStyle(user?.name, user?.userName, user?.email);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API errors and clear the local session anyway.
    } finally {
      dispatch(logout());
      navigate('/auth/login');
    }
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <div className="app-header__brand-copy">
          <span className="app-header__eyebrow">{t('common.appName')}</span>
          <strong className="app-header__title">{t('common.controlCenter')}</strong>
        </div>
      </div>
      <nav className="app-header__nav">
        <NavLink to="/">{t('nav.home')}</NavLink>
        <NavLink to="/sessions">{t('nav.meetings')}</NavLink>
        <NavLink to="/profile">{t('nav.profile')}</NavLink>
        {roles.includes('Admin') ? <NavLink to="/admin/users">{t('nav.users')}</NavLink> : null}
      </nav>
      <div className="app-header__actions">
        <LanguageSwitcher />
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
          {t('nav.logout')}
        </Button>
      </div>
    </header>
  );
}
