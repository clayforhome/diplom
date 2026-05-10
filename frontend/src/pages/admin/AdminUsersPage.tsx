import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card/Card';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { usersService } from '../../http/usersService';
import type { AdminUser } from '../../types';
import { formatDate } from '../../utils/format';

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Управление пользователями - Meeting Management System';
  }, []);

  useEffect(() => {
    usersService
      .listUsers(1, 20)
      .then((response) => setUsers(response.items))
      .catch(() => setError('Backend вернул ошибку при попытке получить список пользователей.'));
  }, []);

  return (
    <PageSection title="Пользователи" subtitle="Список пользователей для роли Admin">
      {error ? <EmptyState title="Не удалось загрузить пользователей" description={error} /> : null}
      {users.map((user) => (
        <Card key={user.id}>
          <h2>{user.name || user.userName || 'Без имени'}</h2>
          <p>{user.email}</p>
          <p>Возраст: {user.age ?? 'Не указан'}</p>
          <p>Регистрация: {user.registrationDate ? formatDate(user.registrationDate) : 'Неизвестно'}</p>
        </Card>
      ))}
    </PageSection>
  );
}
