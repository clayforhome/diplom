import { useEffect } from 'react';
import { Card } from '../../components/ui/Card/Card';
import { PageSection } from '../../components/layout/PageSection/PageSection';

export function AdminDashboardPage() {
  useEffect(() => {
    document.title = 'Панель администратора - Meeting Management System';
  }, []);

  return (
    <PageSection title="Admin dashboard" subtitle="Точка входа для административных функций, доступных в текущем backend">
      <Card>
        <p>В текущей серверной реализации надёжно доступен список пользователей и базовая роль `Admin`. Изменение ролей и деактивация аккаунтов в UI пока не добавлены, потому что backend ещё не отдал отдельные рабочие маршруты для этого.</p>
      </Card>
    </PageSection>
  );
}
