import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { useAppSelector } from '../../store/hooks';

export function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const meetings = useAppSelector((state) => state.sessions.meetings);

  useEffect(() => {
    document.title = 'Главная - Meeting Management System';
  }, []);

  return (
    <PageSection
      title="Главная панель"
      subtitle="Быстрый обзор текущего аккаунта и встреч"
      actions={<Link to="/sessions">К реестру встреч</Link>}
    >
      <div className="dashboard-grid">
        <Card>
          <h2>Профиль</h2>
          <p>{user?.name ?? 'Пользователь'}</p>
          <p>{user?.email}</p>
          <div className="dashboard-grid__badges">
            {(user?.roles ?? []).map((role) => (
              <Badge key={role} tone="info">
                {role}
              </Badge>
            ))}
          </div>
        </Card>
        <Card>
          <h2>Что доступно сейчас</h2>
          <p>Создание и управление встречами, проверка занятости, работа с участниками и просмотр собственного профиля.</p>
        </Card>
        <Card>
          <h2>Сводка</h2>
          <p>На данный момент сейчас {meetings.length} встреч. Полный список можно открыть на отдельной странице с фильтрами.</p>
        </Card>
      </div>
    </PageSection>
  );
}
