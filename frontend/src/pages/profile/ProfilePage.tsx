import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { useAppSelector } from '../../store/hooks';
import { authService } from '../../http/authService';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/format';
import { getDisplayName, getProfileAvatarStyle, getProfileInitials } from '../../utils/profile';
import { getUserRoleLabel } from '../../utils/userLabels';

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const toast = useToast();
  const displayName = getDisplayName(user?.name, user?.userName, user?.email);
  const initials = getProfileInitials(user?.name, user?.userName, user?.email);
  const avatarStyle = getProfileAvatarStyle(user?.name, user?.userName, user?.email);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    document.title = 'Мой профиль - Meeting Management System';
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast('Заполните все поля для смены пароля', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast('Новый пароль и подтверждение не совпадают', 'error');
      return;
    }

    setIsChangingPassword(true);

    try {
      await authService.changePassword({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast('Пароль успешно изменён', 'success');
    } catch {
      toast('Не удалось изменить пароль', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <PageSection title="Мой профиль">
      <div className="profile-hero">
        <div className="profile-hero__identity">
          <div className="profile-hero__avatar" style={avatarStyle} aria-hidden="true">
            {initials}
          </div>
          <div>
            <span className="profile-hero__eyebrow">Снимок аккаунта</span>
            <h2>{displayName}</h2>
            <p>{user?.email ?? 'Email не указан'}</p>
          </div>
        </div>
        <div className="profile-hero__meta">
          <div>
            <strong>{user?.age ?? '-'}</strong>
            <span>возраст в профиле</span>
          </div>
          <div>
            <strong>{user?.registrationDate ? formatDate(user.registrationDate) : '-'}</strong>
            <span>дата регистрации</span>
          </div>
        </div>
      </div>

      <div className="profile-layout">
        <section className="profile-panel">
          <div className="profile-panel__header">
            <h3>Основная информация</h3>
            <span>Данные аккаунта</span>
          </div>
          <div className="profile-facts">
            <div className="profile-facts__item">
              <span>ФИО</span>
              <strong>{user?.userName ?? 'Не указано'}</strong>
            </div>
            <div className="profile-facts__item">
              <span>Email</span>
              <strong>{user?.email ?? 'Не указан'}</strong>
            </div>
            <div className="profile-facts__item">
              <span>Возраст</span>
              <strong>{user?.age ?? 'Не указан'}</strong>
            </div>
            <div className="profile-facts__item">
              <span>Регистрация</span>
              <strong>{user?.registrationDate ? formatDate(user.registrationDate) : 'Неизвестно'}</strong>
            </div>
          </div>
        </section>

        <section className="profile-panel">
          <div className="profile-panel__header">
            <h3>Роли и доступ</h3>
            <span>Текущий уровень доступа</span>
          </div>
          <div className="profile-role-cloud">
            {(user?.roles ?? []).map((role) => (
              <Badge key={role} tone="info">
                {getUserRoleLabel(role)}
              </Badge>
            ))}
          </div>
          <p className="profile-panel__description">
            Здесь видно, какие сценарии доступны текущему аккаунту: личные встречи, организация расписания и административные функции.
          </p>
        </section>

        <section className="profile-panel">
          <div className="profile-panel__header">
            <h3>Смена пароля</h3>
          </div>
          <div className="profile-password">
            <Input label="Текущий пароль" type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} />
            <Input label="Новый пароль" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <Input label="Подтверждение нового пароля" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            <Button onClick={() => void handleChangePassword()} disabled={isChangingPassword}>
              Сменить пароль
            </Button>
          </div>
        </section>

        <section className="profile-panel profile-panel--accent">
          <div className="profile-panel__header">
            <h3>Следующий шаг</h3>
            <span>Быстрый переход</span>
          </div>
          <div className="profile-action-links">
            <Link to="/sessions">Перейти к встречам</Link>
            <Link to="/">Вернуться на главную панель</Link>
          </div>
        </section>
      </div>
    </PageSection>
  );
}
