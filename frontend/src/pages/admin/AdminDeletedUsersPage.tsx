import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { Select } from '../../components/ui/Select/Select';
import { ApiError } from '../../http/httpClient';
import { usersService } from '../../http/usersService';
import { useToast } from '../../hooks/useToast';
import type { DeletedUser } from '../../types';
import { formatDate } from '../../utils/format';
import { getDisplayName, getProfileInitials } from '../../utils/profile';
import './AdminUsersPage.scss';

const PAGE_SIZE_OPTIONS = [
  { value: '6', label: '6' },
  { value: '12', label: '12' },
  { value: '24', label: '24' },
  { value: '48', label: '48' }
];

export function AdminDeletedUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRestoreUser, setPendingRestoreUser] = useState<DeletedUser | null>(null);
  const [activeRestoreUserId, setActiveRestoreUserId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadDeletedUsers = async (nextPage = page, nextPageSize = pageSize) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await usersService.listDeletedUsers(nextPage, nextPageSize);
      setUsers(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.pageSize);
    } catch {
      setError('Не удалось загрузить удаленных пользователей.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Удаленные пользователи - Система управления встречами';
  }, []);

  useEffect(() => {
    void loadDeletedUsers(page, pageSize);
  }, [page, pageSize]);

  const handleRestoreUser = async (user: DeletedUser) => {
    setActiveRestoreUserId(user.id);

    try {
      await usersService.restoreUser(user.id);
      setPendingRestoreUser(null);
      toast('Пользователь восстановлен', 'success');

      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      await loadDeletedUsers(Math.min(page, nextTotalPages), pageSize);
    } catch (restoreError) {
      toast(restoreError instanceof ApiError ? restoreError.message : 'Не удалось восстановить пользователя', 'error');
    } finally {
      setActiveRestoreUserId(null);
    }
  };

  return (
    <PageSection title="Удаленные пользователи" subtitle="Архив аккаунтов, которые можно вернуть в систему">
      <div className="admin-users-hero">
        <div>
          <span className="admin-users-hero__eyebrow">Новые данные backend</span>
          <h2>Восстановление удаленных аккаунтов</h2>
          <p>Список берется из `/users/deleted`, восстановление выполняется через `/users/{'{id}'}/restore`.</p>
        </div>
        <div className="admin-users-hero__meta">
          <strong>{total}</strong>
          <span>в архиве</span>
        </div>
      </div>

      <div className="admin-users-toolbar">
        <Link to="/admin/users" className="admin-users-link-button">
          Активные пользователи
        </Link>
        <div className="admin-users-toolbar__sort">
          <Select
            label="На странице"
            value={String(pageSize)}
            onChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
            options={PAGE_SIZE_OPTIONS}
          />
        </div>
      </div>

      {error ? <EmptyState title="Не удалось загрузить архив" description={error} /> : null}
      {!error && !isLoading && users.length === 0 ? <EmptyState title="Архив пуст" description="Удаленных пользователей пока нет." /> : null}

      <div className="admin-users-page-meta">
        <span>
          Страница {page} из {totalPages}
        </span>
        <span>На текущей странице: {users.length}</span>
      </div>

      <div className="admin-users-grid">
        {users.map((user) => (
          <article key={user.id} className="admin-user-card">
            <div className="admin-user-card__top">
              <div className="admin-user-card__avatar" aria-hidden="true">
                {getProfileInitials(user.name, user.userName, user.email)}
              </div>
              <div>
                <h3>{getDisplayName(user.name, user.userName, user.email)}</h3>
                <p>{user.email ?? 'Эл. почта не указана'}</p>
              </div>
            </div>

            <div className="admin-user-card__facts">
              <div>
                <span>Статус</span>
                <strong>
                  <Badge tone="danger">Удален</Badge>
                </strong>
              </div>
              <div>
                <span>Дата удаления</span>
                <strong>{user.deletedAt ? formatDate(user.deletedAt) : 'Неизвестно'}</strong>
              </div>
              <div>
                <span>Кем удален</span>
                <strong>{user.deletedByName ?? user.deletedBy ?? 'Неизвестно'}</strong>
              </div>
              <div>
                <span>Возраст</span>
                <strong>{user.age ?? 'Не указано'}</strong>
              </div>
              <div>
                <span>ID</span>
                <strong>{user.id}</strong>
              </div>
            </div>

            <div className="admin-user-card__actions">
              <Button variant="primary" onClick={() => setPendingRestoreUser(user)} disabled={activeRestoreUserId === user.id}>
                Восстановить аккаунт
              </Button>
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
            Вперед
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={pendingRestoreUser !== null}
        title="Восстановить пользователя?"
        description={`Аккаунт "${getDisplayName(pendingRestoreUser?.name ?? null, pendingRestoreUser?.userName ?? null, pendingRestoreUser?.email ?? null)}" снова станет активным.`}
        confirmLabel="Восстановить"
        cancelLabel="Отмена"
        isConfirming={activeRestoreUserId !== null}
        onConfirm={() => pendingRestoreUser && void handleRestoreUser(pendingRestoreUser)}
        onCancel={() => setPendingRestoreUser(null)}
      />
    </PageSection>
  );
}
