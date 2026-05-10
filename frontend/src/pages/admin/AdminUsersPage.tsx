import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { usersService } from '../../http/usersService';
import { authService } from '../../http/authService';
import { ApiError } from '../../http/httpClient';
import { useToast } from '../../hooks/useToast';
import type { AdminUser } from '../../types';
import { formatDate } from '../../utils/format';
import { getDisplayName, getProfileInitials } from '../../utils/profile';

type SortKey = 'name' | 'userName' | 'email' | 'age' | 'registrationDate' | 'emailConfirmed' | 'id';
type SortDirection = 'asc' | 'desc';

function normalizeValue(value: string | number | boolean | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [activeResetUserId, setActiveResetUserId] = useState<string | null>(null);
  const [activeDeleteUserId, setActiveDeleteUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    document.title = 'Управление пользователями - Meeting Management System';
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    usersService
      .listUsers(page, pageSize)
      .then((response) => {
        setUsers(response.items);
        setTotal(response.total);
        setPage(response.page);
        setPageSize(response.pageSize);
      })
      .catch(() => setError('Backend вернул ошибку при попытке получить список пользователей.'))
      .finally(() => setIsLoading(false));
  }, [page, pageSize]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const searchedUsers = query
      ? users.filter((user) =>
          [
            user.name,
            user.userName,
            user.email,
            user.age,
            user.emailConfirmed ? 'confirmed true да yes' : 'not-confirmed false нет no',
            user.registrationDate ? formatDate(user.registrationDate) : null,
            user.id
          ]
            .map((value) => normalizeValue(value))
            .some((value) => value.includes(query))
        )
      : users;

    return [...searchedUsers].sort((left, right) => {
      const direction = sortDirection === 'asc' ? 1 : -1;

      if (sortKey === 'age') {
        return ((left.age ?? -1) - (right.age ?? -1)) * direction;
      }

      if (sortKey === 'registrationDate') {
        const leftDate = left.registrationDate ? new Date(left.registrationDate).getTime() : 0;
        const rightDate = right.registrationDate ? new Date(right.registrationDate).getTime() : 0;
        return (leftDate - rightDate) * direction;
      }

      if (sortKey === 'emailConfirmed') {
        return (Number(left.emailConfirmed) - Number(right.emailConfirmed)) * direction;
      }

      const leftValue = sortKey === 'name' ? getDisplayName(left.name, left.userName, left.email) : normalizeValue(left[sortKey]);
      const rightValue = sortKey === 'name' ? getDisplayName(right.name, right.userName, right.email) : normalizeValue(right[sortKey]);

      return leftValue.localeCompare(rightValue, 'ru') * direction;
    });
  }, [search, sortDirection, sortKey, users]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const reloadUsers = async (nextPage = page, nextPageSize = pageSize) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await usersService.listUsers(nextPage, nextPageSize);
      setUsers(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.pageSize);
    } catch {
      setError('Backend вернул ошибку при попытке получить список пользователей.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = resetPasswords[userId]?.trim();

    if (!newPassword) {
      toast('Введите новый пароль для сброса', 'error');
      return;
    }

    setActiveResetUserId(userId);

    try {
      await authService.resetPassword({ userId, newPassword });
      setResetPasswords((current) => ({ ...current, [userId]: '' }));
      toast('Пароль пользователя сброшен', 'success');
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Не удалось сбросить пароль пользователя', 'error');
    } finally {
      setActiveResetUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActiveDeleteUserId(userId);

    try {
      await usersService.deleteUser(userId);
      toast('Аккаунт пользователя удалён', 'success');

      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      const nextPage = Math.min(page, nextTotalPages);
      await reloadUsers(nextPage, pageSize);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Не удалось удалить аккаунт пользователя', 'error');
    } finally {
      setActiveDeleteUserId(null);
    }
  };

  return (
    <PageSection title="Пользователи" subtitle="Список пользователей для роли Admin">
      <div className="admin-users-hero">
        <div>
          <span className="admin-users-hero__eyebrow">Server-backed workspace</span>
          <h2>Поиск, сортировка и постраничный обзор пользователей</h2>
          <p>Теперь список использует серверные `page/limit/total`, а поиск и сортировки остаются удобной клиентской надстройкой над текущей страницей.</p>
        </div>
        <div className="admin-users-hero__meta">
          <strong>{total}</strong>
          <span>всего пользователей в системе</span>
        </div>
      </div>

      <div className="admin-users-toolbar">
        <div className="admin-users-toolbar__search">
          <Input label="Поиск" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Имя, email, ФИО, возраст, дата, подтверждение, id" />
        </div>
        <div className="admin-users-toolbar__sort">
          <Select
            label="Сортировать по"
            value={sortKey}
            onChange={(value) => setSortKey(value as SortKey)}
            options={[
              { value: 'name', label: 'Имя' },
              { value: 'userName', label: 'ФИО' },
              { value: 'email', label: 'Email' },
              { value: 'age', label: 'Возраст' },
              { value: 'registrationDate', label: 'Дате регистрации' },
              { value: 'emailConfirmed', label: 'Подтверждению email' },
              { value: 'id', label: 'ID' }
            ]}
          />
          <Select
            label="Направление"
            value={sortDirection}
            onChange={(value) => setSortDirection(value as SortDirection)}
            options={[
              { value: 'asc', label: 'По возрастанию' },
              { value: 'desc', label: 'По убыванию' }
            ]}
          />
          <Select
            label="Пользователей на странице"
            value={String(pageSize)}
            onChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
            options={[
              { value: '6', label: '6' },
              { value: '12', label: '12' },
              { value: '24', label: '24' },
              { value: '48', label: '48' }
            ]}
          />
        </div>
      </div>

      {error ? <EmptyState title="Не удалось загрузить пользователей" description={error} /> : null}
      {!error && !isLoading && filteredUsers.length === 0 ? <EmptyState title="Совпадений не найдено" description="Попробуйте изменить строку поиска или порядок сортировки." /> : null}

      <div className="admin-users-page-meta">
        <span>Страница {page} из {totalPages}</span>
        <span>На текущей странице: {filteredUsers.length}</span>
      </div>

      <div className="admin-users-grid">
        {filteredUsers.map((user) => (
          <article key={user.id} className="admin-user-card">
            <div className="admin-user-card__top">
              <div className="admin-user-card__avatar" aria-hidden="true">
                {getProfileInitials(user.name, user.userName, user.email)}
              </div>
              <div>
                <h3>{getDisplayName(user.name, user.userName, user.email)}</h3>
                <p>{user.email ?? 'Email не указан'}</p>
              </div>
            </div>

            <div className="admin-user-card__facts">
              <div>
                <span>ФИО</span>
                <strong>{user.userName ?? 'Не указан'}</strong>
              </div>
              <div>
                <span>Возраст</span>
                <strong>{user.age ?? 'Не указан'}</strong>
              </div>
              <div>
                <span>Регистрация</span>
                <strong>{user.registrationDate ? formatDate(user.registrationDate) : 'Неизвестно'}</strong>
              </div>
              <div>
                <span>Email confirmed</span>
                <strong>{user.emailConfirmed ? 'Да' : 'Нет'}</strong>
              </div>
              <div>
                <span>ID</span>
                <strong>{user.id}</strong>
              </div>
            </div>

            <div className="admin-user-card__actions">
              <Input
                label="Новый пароль"
                type="password"
                value={resetPasswords[user.id] ?? ''}
                onChange={(event) => setResetPasswords((current) => ({ ...current, [user.id]: event.target.value }))}
                placeholder="Введите пароль для сброса"
              />
              <div className="admin-user-card__buttons">
                <Button variant="secondary" onClick={() => void handleResetPassword(user.id)} disabled={activeResetUserId === user.id}>
                  Сбросить пароль
                </Button>
                <Button variant="danger" onClick={() => void handleDeleteUser(user.id)} disabled={activeDeleteUserId === user.id}>
                  Удалить аккаунт
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!error ? (
        <div className="admin-users-pagination">
          <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
            Назад
          </Button>
          <div className="admin-users-pagination__status">
            <strong>{page}</strong>
            <span>из {totalPages}</span>
          </div>
          <Button variant="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading}>
            Вперёд
          </Button>
        </div>
      ) : null}
    </PageSection>
  );
}
