import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { authService } from '../../http/authService';
import { useToast } from '../../hooks/useToast';
import { useAppSelector } from '../../store/hooks';
import { formatDate } from '../../utils/format';
import { getDisplayName, getProfileAvatarStyle, getProfileInitials } from '../../utils/profile';
import { getUserRoleLabel } from '../../utils/userLabels';

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const toast = useToast();
  const { t, i18n } = useTranslation();
  const displayName = getDisplayName(user?.name, user?.userName, user?.email);
  const initials = getProfileInitials(user?.name, user?.userName, user?.email);
  const avatarStyle = getProfileAvatarStyle(user?.name, user?.userName, user?.email);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    document.title = `${t('profile.pageTitle')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast(t('profile.fillPasswordFields'), 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast(t('profile.passwordsMismatch'), 'error');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authService.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast(t('profile.passwordChanged'), 'success');
    } catch {
      toast(t('profile.passwordChangeError'), 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <PageSection title={t('profile.title')}>
      <div className="profile-hero">
        <div className="profile-hero__identity">
          <div className="profile-hero__avatar" style={avatarStyle} aria-hidden="true">
            {initials}
          </div>
          <div>
            <span className="profile-hero__eyebrow">{t('profile.accountSnapshot')}</span>
            <h2>{displayName}</h2>
            <p>{user?.email ?? t('common.emailNotSpecified')}</p>
          </div>
        </div>
        <div className="profile-hero__meta">
          <div>
            <strong>{user?.age ?? '-'}</strong>
            <span>{t('profile.ageInProfile')}</span>
          </div>
          <div>
            <strong>{user?.registrationDate ? formatDate(user.registrationDate) : '-'}</strong>
            <span>{t('profile.registrationDate')}</span>
          </div>
          <div className="profile-hero__roles-card">
            <strong>{t('profile.rolesAndAccess')}</strong>
            <div className="profile-role-cloud profile-role-cloud--compact">
              {(user?.roles ?? []).map((role) => (
                <Badge key={role} tone="info">
                  {getUserRoleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-column profile-column--main">
          <section className="profile-panel">
            <div className="profile-panel__header">
              <h3>{t('profile.mainInfo')}</h3>
              <span>{t('profile.accountData')}</span>
            </div>
            <div className="profile-facts profile-facts--stacked">
              <div className="profile-facts__item">
                <span>{t('profile.fullName')}</span>
                <strong>{user?.name ?? user?.userName ?? t('common.notSpecifiedNeutral')}</strong>
              </div>
              <div className="profile-facts__item">
                <span>{t('profile.email')}</span>
                <strong>{user?.email ?? t('common.notSpecified')}</strong>
              </div>
              <div className="profile-facts__item">
                <span>{t('profile.age')}</span>
                <strong>{user?.age ?? t('common.notSpecifiedNeutral')}</strong>
              </div>
              <div className="profile-facts__item">
                <span>{t('profile.registration')}</span>
                <strong>{user?.registrationDate ? formatDate(user.registrationDate) : t('common.unknown')}</strong>
              </div>
            </div>
          </section>
        </div>

        <div className="profile-column profile-column--side">
          <section className="profile-panel profile-panel--password-card">
            <div className="profile-panel__header">
              <h3>{t('profile.changePassword')}</h3>
            </div>
            <div className="profile-password">
              <Input label={t('profile.currentPassword')} type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} />
              <Input label={t('profile.newPassword')} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <Input label={t('profile.confirmNewPassword')} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              <Button onClick={() => void handleChangePassword()} disabled={isChangingPassword}>
                {t('profile.changePasswordButton')}
              </Button>
            </div>
          </section>
        </div>
      </div>

      <section className="profile-panel profile-panel--accent">
        <div className="profile-panel__header">
          <h3>{t('profile.nextStep')}</h3>
          <span>{t('profile.quickLinks')}</span>
        </div>
        <div className="profile-action-links">
          <Link to="/sessions">{t('profile.toMeetings')}</Link>
          <Link to="/">{t('profile.toDashboard')}</Link>
        </div>
      </section>
    </PageSection>
  );
}
