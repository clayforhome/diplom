import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { usersService } from '../../http/usersService';
import { authService } from '../../http/authService';
import { useUiSelectOptions } from '../../hooks/useUiSelectOptions';
import { ApiError } from '../../http/httpClient';
import { useToast } from '../../hooks/useToast';
import { useAppSelector } from '../../store/hooks';
import type { AdminUser } from '../../types';
import { formatDate } from '../../utils/format';
import { getDisplayName, getProfileInitials } from '../../utils/profile';
import './AdminUsersPage.scss';

type SortKey = 'name' | 'userName' | 'email' | 'age' | 'registrationDate' | 'id';
type SortDirection = 'asc' | 'desc';

const fallbackSortOptions = [
  { value: 'name', label: 'Имя' },
  { value: 'userName', label: 'ФИО' },
  { value: 'email', label: 'Эл. почта' },
  { value: 'age', label: 'Возраст' },
  { value: 'registrationDate', label: 'Дата регистрации' },
  { value: 'id', label: 'ID' }
];

const fallbackDirectionOptions = [
  { value: 'asc', label: 'По возрастанию' },
  { value: 'desc', label: 'По убыванию' }
];

const fallbackPageSizeOptions = [
  { value: '6', label: '6' },
  { value: '12', label: '12' },
  { value: '24', label: '24' },
  { value: '48', label: '48' }
];

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Администратор',
  Organizer: 'Организатор',
  User: 'Пользователь'
};

const ROLE_TONES: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  Admin: 'danger',
  Organizer: 'warning',
  User: 'info'
};

function normalizeValue(value: string | number | boolean | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

// ── Roles panel for a single user ─────────────────────────────────────────────
interface UserRolesPanelProps {
  userId: string;
  allRoles: string[];
}

function UserRolesPanel({ userId, allRoles }: UserRolesPanelProps) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [currentRoles, setCurrentRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const loadedRef = useRef(false);

  const handleToggle = async () => {
    if (!isOpen && !loadedRef.current) {
      setIsLoading(true);
      try {
        const data = await usersService.getUserRoles(userId);
        setCurrentRoles(data.roles);
        setSelectedRoles(data.roles);
        loadedRef.current = true;
      } catch {
        toast('Не удалось загрузить роли пользователя', 'error');
        return;
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen((prev) => !prev);
  };

  const handleCheckbox = (role: string, checked: boolean) => {
    setSelectedRoles((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)));
  };

  const hasChanges = useMemo(() => {
    const a = [...selectedRoles].sort();
    const b = [...currentRoles].sort();
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [selectedRoles, currentRoles]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await usersService.updateUserRoles(userId, { roles: selectedRoles });
      setCurrentRoles(selectedRoles);
      toast('Роли пользователя обновлены', 'success');
    } catch (error) {
      toast(error instanceof ApiError ? error.message : 'Не удалось обновить роли', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedRoles(currentRoles);
  };

  return (
    <div className="user-roles-panel">
      <button
        type="button"
        className="user-roles-panel__toggle"
        onClick={() => void handleToggle()}
        aria-expanded={isOpen}
      >
        <span className="user-roles-panel__toggle-label">
          {isOpen ? 'Скрыть роли' : 'Управление ролями'}
        </span>
        <span className="user-roles-panel__toggle-badges">
          {loadedRef.current && currentRoles.map((role) => (
            <Badge key={role} tone={ROLE_TONES[role] ?? 'neutral'}>
              {ROLE_LABELS[role] ?? role}
            </Badge>
          ))}
        </span>
        <span
          className={`user-roles-panel__chevron${isOpen ? ' user-roles-panel__chevron--open' : ''}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="user-roles-panel__body">
          {isLoading ? (
            <p className="user-roles-panel__loading">Загрузка ролей…</p>
          ) : (
            <>
              <div className="user-roles-panel__checkboxes">
                {allRoles.length === 0 ? (
                  <p className="user-roles-panel__loading">Роли не найдены</p>
                ) : (
                  allRoles.map((role) => (
                    <label key={role} className="user-roles-panel__checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={(e) => handleCheckbox(role, e.target.checked)}
                      />
                      <span className="user-roles-panel__role-name">{ROLE_LABELS[role] ?? role}</span>
                      <Badge tone={ROLE_TONES[role] ?? 'neutral'}>{ROLE_LABELS[role] ?? role}</Badge>
                    </label>
                  ))
                )}
              </div>

              {hasChanges && (
                <div className="user-roles-panel__footer">
                  <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
                    Отмена
                  </Button>
                  <Button variant="primary" onClick={() => void handleSave()} disabled={isSaving}>
                    {isSaving ? 'Сохранение…' : 'Сохранить роли'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────────────────
export function AdminUsersPage() {
  const selectOptions = useUiSelectOptions();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [activeResetUserId, setActiveResetUserId] = useState<string | null>(null);
  const [activeDeleteUserId, setActiveDeleteUserId] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const toast = useToast();

  const sortOptions = useMemo(
    () => (selectOptions?.adminUserSortKeys ?? fallbackSortOptions).filter((option) => option.value !== 'emailConfirmed'),
    [selectOptions]
  );

  useEffect(() => {
    document.title = 'Управление пользователями - Система управления встречами';
  }, []);

  // Load all available roles once on mount
  useEffect(() => {
    usersService
      .getRoles()
      .then((data) => setAllRoles(data.roles))
      .catch(() => {
        // Non-critical — roles panel will show empty state
      });
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
      .catch(() => setError('Не удалось получить список пользователей с сервера.'))
      .finally(() => setIsLoading(false));
  }, [page, pageSize]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const usersExceptCurrent = users.filter((user) => user.id !== currentUser?.id);

    const searchedUsers = query
      ? usersExceptCurrent.filter((user) =>
          [
            getDisplayName(user.name, user.userName, user.email),
            user.name,
            user.userName,
            user.email,
            user.age,
            user.registrationDate ? formatDate(user.registrationDate) : null,
            user.id
          ]
            .map((value) => normalizeValue(value))
            .some((value) => value.includes(query))
        )
      : usersExceptCurrent;

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

      const leftValue =
        sortKey === 'name'
          ? getDisplayName(left.name, left.userName, left.email)
          : normalizeValue(left[sortKey]);
      const rightValue =
        sortKey === 'name'
          ? getDisplayName(right.name, right.userName, right.email)
          : normalizeValue(right[sortKey]);

      return leftValue.localeCompare(rightValue, 'ru') * direction;
    });
  }, [search, sortDirection, sortKey, users, currentUser?.id]);

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
      setError('Не удалось получить список пользователей с сервера.');
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

  const requestDeleteUser = (user: AdminUser) => {
    setPendingDeleteUser(user);
  };

  const handleDeleteUser = async (userId: string) => {
    setActiveDeleteUserId(userId);

    try {
      await usersService.deleteUser(userId);
      setPendingDeleteUser(null);
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
    <PageSection title="Пользователи" subtitle="Список пользователей для роли администратор">
      <div className="admin-users-hero">
        <div>
          <span className="admin-users-hero__eyebrow">Рабочее пространство с серверными данными</span>
          <h2>Поиск, сортировка и постраничный обзор пользователей</h2>
          <p>
            Список использует серверные `page/limit/total`, а поиск и сортировка остаются удобной клиентской надстройкой
            над текущей страницей.
          </p>
        </div>
        <div className="admin-users-hero__meta">
          <strong>{total}</strong>
          <span>всего пользователей в системе</span>
        </div>
      </div>

      <div className="admin-users-toolbar">
        <div className="admin-users-toolbar__search">
          <Input
            label="Поиск"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Имя, email, ФИО, возраст, дата, id"
          />
        </div>
        <div className="admin-users-toolbar__sort">
          <Select label="Сортировать по" value={sortKey} onChange={(value) => setSortKey(value as SortKey)} options={sortOptions} />
          <Select
            label="Направление"
            value={sortDirection}
            onChange={(value) => setSortDirection(value as SortDirection)}
            options={selectOptions?.sortDirections ?? fallbackDirectionOptions}
          />
          <Select
            label="Пользователей на странице"
            value={String(pageSize)}
            onChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
            options={selectOptions?.pageSizes ?? fallbackPageSizeOptions}
          />
        </div>
      </div>

      {error ? <EmptyState title="Не удалось загрузить пользователей" description={error} /> : null}
      {!error && !isLoading && filteredUsers.length === 0 ? (
        <EmptyState title="Совпадений не найдено" description="Попробуйте изменить строку поиска или порядок сортировки." />
      ) : null}

      <div className="admin-users-page-meta">
        <span>
          Страница {page} из {totalPages}
        </span>
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
                <p>{user.email ?? 'Эл. почта не указана'}</p>
              </div>
            </div>

            <div className="admin-user-card__facts">
              <div>
                <span>ФИО</span>
                <strong>{user.userName ?? 'Не указано'}</strong>
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
                <span>ID</span>
                <strong>{user.id}</strong>
              </div>
            </div>

            {/* Roles management */}
            <UserRolesPanel userId={user.id} allRoles={allRoles} />

            <div className="admin-user-card__actions">
              <Input
                label="Новый пароль"
                type="password"
                value={resetPasswords[user.id] ?? ''}
                onChange={(event) =>
                  setResetPasswords((current) => ({ ...current, [user.id]: event.target.value }))
                }
                placeholder="Введите пароль для сброса"
              />
              <div className="admin-user-card__buttons">
                <Button
                  variant="secondary"
                  onClick={() => void handleResetPassword(user.id)}
                  disabled={activeResetUserId === user.id}
                >
                  Сбросить пароль
                </Button>
                <Button
                  variant="danger"
                  onClick={() => requestDeleteUser(user)}
                  disabled={activeDeleteUserId === user.id}
                >
                  Удалить аккаунт
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!error ? (
        <div className="admin-users-pagination">
          <Button
            variant="secondary"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isLoading}
          >
            Назад
          </Button>
          <div className="admin-users-pagination__status">
            <strong>{page}</strong>
            <span>из {totalPages}</span>
          </div>
          <Button
            variant="secondary"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Вперёд
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={pendingDeleteUser !== null}
        title="Удалить аккаунт?"
        description={`Аккаунт пользователя «${getDisplayName(pendingDeleteUser?.name ?? null, pendingDeleteUser?.userName ?? null, pendingDeleteUser?.email ?? null)}» будет безвозвратно удалён. Это действие нельзя отменить.`}
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        isConfirming={activeDeleteUserId !== null}
        onConfirm={() => pendingDeleteUser && void handleDeleteUser(pendingDeleteUser.id)}
        onCancel={() => setPendingDeleteUser(null)}
      />
    </PageSection>
  );
}
