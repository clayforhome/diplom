import { useEffect } from 'react';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { useAppSelector } from '../../store/hooks';
import { formatDate } from '../../utils/format';

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    document.title = 'Мой профиль - Meeting Management System';
  }, []);

  return (
    <PageSection title="Мой профиль" >
      <Card>
        <div className="profile-stack">
          <h2>{user?.name ?? 'Без имени'}</h2>
          <p>Email: {user?.email}</p>
          <p>Username: {user?.userName}</p>
          <p>Возраст: {user?.age ?? 'Не указан'}</p>
          <p>Дата регистрации: {user?.registrationDate ? formatDate(user.registrationDate) : 'Неизвестно'}</p>
          <div className="dashboard-grid__badges">
            {(user?.roles ?? []).map((role) => (
              <Badge key={role} tone="info">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </PageSection>
  );
}
