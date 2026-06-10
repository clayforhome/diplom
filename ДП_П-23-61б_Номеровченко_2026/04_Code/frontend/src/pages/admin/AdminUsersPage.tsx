import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { authService } from '../../http/authService';
import { ApiError } from '../../http/httpClient';
import { usersService } from '../../http/usersService';
import { useToast } from '../../hooks/useToast';
import { useUiSelectOptions } from '../../hooks/useUiSelectOptions';
import { useAppSelector } from '../../store/hooks';
import type { AdminUser, DeletedUser } from '../../types';
import { formatDate } from '../../utils/format';
import { getDisplayName, getProfileInitials } from '../../utils/profile';
import { getUserRoleLabel } from '../../utils/userLabels';
import './AdminUsersPage.scss';

type SortKey = 'name' | 'userName' | 'email' | 'age' | 'registrationDate' | 'id';
type SortDirection = 'asc' | 'desc';
type UserViewMode = 'active' | 'deleted';
type DisplayUser = (AdminUser & { isDeleted: false }) | (DeletedUser & { isDeleted: true });

const ROLE_TONES: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  Admin: 'danger',
  Organizer: 'warning',
  User: 'info'
};

function normalizeValue(value: string | number | boolean | null | undefined): string {
  return String(value ?? '').trim().toLowerCase();
}

interface UserRolesPanelProps {
  userId: string;
  allRoles: string[];
}

function UserRolesPanel({ userId, allRoles }: UserRolesPanelProps) {
  const toast = useToast();
  const { t } = useTranslation();
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
        toast(t('adminUsers.rolesLoadError'), 'error');
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
      toast(t('adminUsers.rolesUpdated'), 'success');
    } catch (error) {
      toast(error instanceof ApiError ? error.message : t('adminUsers.rolesUpdateError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="user-roles-panel">
      <button type="button" className="user-roles-panel__toggle" onClick={() => void handleToggle()} aria-expanded={isOpen}>
        <span className="user-roles-panel__toggle-label">{isOpen ? t('adminUsers.hideRoles') : t('adminUsers.manageRoles')}</span>
        <span className="user-roles-panel__toggle-badges">
          {loadedRef.current &&
            currentRoles.map((role) => (
              <Badge key={role} tone={ROLE_TONES[role] ?? 'neutral'}>
                {getUserRoleLabel(role as never)}
              </Badge>
            ))}
        </span>
        <span className={`user-roles-panel__chevron${isOpen ? ' user-roles-panel__chevron--open' : ''}`} aria-hidden="true">
          {'>'}
        </span>
      </button>

      {isOpen ? (
        <div className="user-roles-panel__body">
          {isLoading ? (
            <p className="user-roles-panel__loading">{t('adminUsers.rolesLoading')}</p>
          ) : (
            <>
              <div className="user-roles-panel__checkboxes">
                {allRoles.length === 0 ? (
                  <p className="user-roles-panel__loading">{t('adminUsers.rolesNotFound')}</p>
                ) : (
                  allRoles.map((role) => (
                    <label key={role} className="user-roles-panel__checkbox-item">
                      <input type="checkbox" checked={selectedRoles.includes(role)} onChange={(event) => handleCheckbox(role, event.target.checked)} />
                      <span className="user-roles-panel__role-name">{getUserRoleLabel(role as never)}</span>
                      <Badge tone={ROLE_TONES[role] ?? 'neutral'}>{getUserRoleLabel(role as never)}</Badge>
                    </label>
                  ))
                )}
              </div>

              {hasChanges ? (
                <div className="user-roles-panel__footer">
                  <Button variant="secondary" onClick={() => setSelectedRoles(currentRoles)} disabled={isSaving}>
                    {t('common.cancel')}
                  </Button>
                  <Button variant="primary" onClick={() => void handleSave()} disabled={isSaving}>
                    {isSaving ? t('adminUsers.saving') : t('adminUsers.saveRoles')}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function AdminUsersPage() {
  const selectOptions = useUiSelectOptions();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [viewMode, setViewMode] = useState<UserViewMode>('active');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [activeResetUserId, setActiveResetUserId] = useState<string | null>(null);
  const [activeDeleteUserId, setActiveDeleteUserId] = useState<string | null>(null);
  const [activeRestoreUserId, setActiveRestoreUserId] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUser | null>(null);
  const [pendingRestoreUser, setPendingRestoreUser] = useState<DeletedUser | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<string[]>([]);

  const fallbackSortOptions = useMemo(
    () => [
      { value: 'name', label: t('adminUsers.nameField') },
      { value: 'userName', label: t('adminUsers.fullNameField') },
      { value: 'email', label: t('adminUsers.emailField') },
      { value: 'age', label: t('adminUsers.ageField') },
      { value: 'registrationDate', label: t('adminUsers.registrationField') },
      { value: 'id', label: 'ID' }
    ],
    [t]
  );

  const fallbackDirectionOptions = useMemo(
    () => [
      { value: 'asc', label: t('adminUsers.asc') },
      { value: 'desc', label: t('adminUsers.desc') }
    ],
    [t]
  );

  const fallbackPageSizeOptions = [
    { value: '6', label: '6' },
    { value: '12', label: '12' },
    { value: '24', label: '24' },
    { value: '48', label: '48' }
  ];

  const sortOptions = useMemo(
    () => (selectOptions?.adminUserSortKeys ?? fallbackSortOptions).filter((option) => option.value !== 'emailConfirmed'),
    [fallbackSortOptions, selectOptions]
  );

  useEffect(() => {
    document.title = `${t('adminUsers.pageTitle')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

  useEffect(() => {
    usersService.getRoles().then((data) => setAllRoles(data.roles)).catch(() => undefined);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const request =
      viewMode === 'deleted'
        ? usersService.listDeletedUsers(page, pageSize).then((response) => ({
            ...response,
            items: response.items.map((user) => ({ ...user, isDeleted: true as const }))
          }))
        : usersService.listUsers(page, pageSize).then((response) => ({
            ...response,
            items: response.items.map((user) => ({ ...user, isDeleted: false as const }))
          }));

    request
      .then((response) => {
        setUsers(response.items);
        setTotal(response.total);
        setPage(response.page);
        setPageSize(response.pageSize);
      })
      .catch(() => setError(viewMode === 'deleted' ? t('adminUsers.loadDeletedUsersError') : t('adminUsers.loadUsersError')))
      .finally(() => setIsLoading(false));
  }, [page, pageSize, t, viewMode]);

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
          'registrationDate' in user && user.registrationDate ? formatDate(user.registrationDate) : null,
          user.isDeleted && user.deletedAt ? formatDate(user.deletedAt) : null,
          user.isDeleted ? user.deletedByName : null,
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
        const leftSource = left.isDeleted ? left.deletedAt : left.registrationDate;
        const rightSource = right.isDeleted ? right.deletedAt : right.registrationDate;
        const leftDate = leftSource ? new Date(leftSource).getTime() : 0;
        const rightDate = rightSource ? new Date(rightSource).getTime() : 0;
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

      return leftValue.localeCompare(rightValue, i18n.resolvedLanguage === 'kk' ? 'kk' : 'ru') * direction;
    });
  }, [currentUser?.id, i18n.resolvedLanguage, search, sortDirection, sortKey, users]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const reloadUsers = async (nextPage = page, nextPageSize = pageSize, nextViewMode = viewMode) => {
    setIsLoading(true);
    setError(null);

    try {
      const response =
        nextViewMode === 'deleted'
          ? await usersService.listDeletedUsers(nextPage, nextPageSize).then((data) => ({
              ...data,
              items: data.items.map((user) => ({ ...user, isDeleted: true as const }))
            }))
          : await usersService.listUsers(nextPage, nextPageSize).then((data) => ({
              ...data,
              items: data.items.map((user) => ({ ...user, isDeleted: false as const }))
            }));

      setUsers(response.items);
      setTotal(response.total);
      setPage(response.page);
      setPageSize(response.pageSize);
    } catch {
      setError(nextViewMode === 'deleted' ? t('adminUsers.loadDeletedUsersError') : t('adminUsers.loadUsersError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewModeChange = (nextViewMode: UserViewMode) => {
    setViewMode(nextViewMode);
    setSearch('');
    setPage(1);
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = resetPasswords[userId]?.trim();

    if (!newPassword) {
      toast(t('adminUsers.enterPassword'), 'error');
      return;
    }

    setActiveResetUserId(userId);

    try {
      await authService.resetPassword({ userId, newPassword });
      setResetPasswords((current) => ({ ...current, [userId]: '' }));
      toast(t('adminUsers.passwordReset'), 'success');
    } catch (error) {
      toast(error instanceof ApiError ? error.message : t('adminUsers.passwordResetError'), 'error');
    } finally {
      setActiveResetUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActiveDeleteUserId(userId);

    try {
      await usersService.deleteUser(userId);
      setPendingDeleteUser(null);
      toast(t('adminUsers.accountDeleted'), 'success');

      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      const nextPage = Math.min(page, nextTotalPages);
      await reloadUsers(nextPage, pageSize);
    } catch (error) {
      toast(error instanceof ApiError ? error.message : t('adminUsers.accountDeleteError'), 'error');
    } finally {
      setActiveDeleteUserId(null);
    }
  };

  const handleRestoreUser = async (user: DeletedUser) => {
    setActiveRestoreUserId(user.id);

    try {
      await usersService.restoreUser(user.id);
      setPendingRestoreUser(null);
      toast(t('adminUsers.accountRestored'), 'success');

      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      await reloadUsers(Math.min(page, nextTotalPages), pageSize, 'deleted');
    } catch (error) {
      toast(error instanceof ApiError ? error.message : t('adminUsers.accountRestoreError'), 'error');
    } finally {
      setActiveRestoreUserId(null);
    }
  };

  return (
    <PageSection title={t('adminUsers.title')} subtitle={t('adminUsers.subtitle')}>
      <div className="admin-users-hero">
        <div>
          <span className="admin-users-hero__eyebrow">{t('adminUsers.eyebrow')}</span>
          <h2>{t('adminUsers.heading')}</h2>
          <p>{t('adminUsers.description')}</p>
        </div>
        <div className="admin-users-hero__meta">
          <strong>{total}</strong>
          <span>{viewMode === 'deleted' ? t('adminUsers.deletedUsersTotal') : t('adminUsers.totalUsers')}</span>
        </div>
      </div>

      <div className="admin-users-tabs" role="tablist" aria-label={t('adminUsers.userStateFilter')}>
        <button type="button" className={viewMode === 'active' ? 'admin-users-tabs__button admin-users-tabs__button--active' : 'admin-users-tabs__button'} onClick={() => handleViewModeChange('active')}>
          {t('adminUsers.activeUsersTab')}
        </button>
        <button type="button" className={viewMode === 'deleted' ? 'admin-users-tabs__button admin-users-tabs__button--active' : 'admin-users-tabs__button'} onClick={() => handleViewModeChange('deleted')}>
          {t('adminUsers.deletedUsersTab')}
        </button>
      </div>

      <div className="admin-users-toolbar">
        <div className="admin-users-toolbar__search">
          <Input label={t('adminUsers.search')} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('adminUsers.searchPlaceholder')} />
        </div>
        <div className="admin-users-toolbar__sort">
          <Select label={t('adminUsers.sortBy')} value={sortKey} onChange={(value) => setSortKey(value as SortKey)} options={sortOptions} />
          <Select label={t('adminUsers.direction')} value={sortDirection} onChange={(value) => setSortDirection(value as SortDirection)} options={selectOptions?.sortDirections ?? fallbackDirectionOptions} />
          <Select
            label={t('adminUsers.pageSize')}
            value={String(pageSize)}
            onChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
            options={selectOptions?.pageSizes ?? fallbackPageSizeOptions}
          />
        </div>
      </div>

      {error ? <EmptyState title={t('adminUsers.loadUsersTitle')} description={error} /> : null}
      {!error && !isLoading && filteredUsers.length === 0 ? (
        <EmptyState
          title={viewMode === 'deleted' ? t('adminUsers.deletedNoMatchesTitle') : t('adminUsers.noMatchesTitle')}
          description={viewMode === 'deleted' ? t('adminUsers.deletedNoMatchesDescription') : t('adminUsers.noMatchesDescription')}
        />
      ) : null}

      <div className="admin-users-page-meta">
        <span>{t('adminUsers.pageOf', { page, total: totalPages })}</span>
        <span>{t('adminUsers.onCurrentPage', { count: filteredUsers.length })}</span>
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
                <p>{user.email ?? t('common.emailNotSpecified')}</p>
              </div>
            </div>

            <div className="admin-user-card__facts">
              {user.isDeleted ? (
                <div>
                  <span>{t('adminUsers.statusField')}</span>
                  <strong>
                    <Badge tone="danger">{t('adminUsers.deletedStatus')}</Badge>
                  </strong>
                </div>
              ) : null}
              <div>
                <span>{t('adminUsers.fullNameField')}</span>
                <strong>{user.userName ?? t('common.notSpecifiedNeutral')}</strong>
              </div>
              <div>
                <span>{t('adminUsers.ageField')}</span>
                <strong>{user.age ?? t('common.notSpecifiedNeutral')}</strong>
              </div>
              <div>
                <span>{user.isDeleted ? t('adminUsers.deletionDateField') : t('adminUsers.registrationField')}</span>
                <strong>
                  {user.isDeleted
                    ? user.deletedAt
                      ? formatDate(user.deletedAt)
                      : t('common.unknown')
                    : user.registrationDate
                      ? formatDate(user.registrationDate)
                      : t('common.unknown')}
                </strong>
              </div>
              {user.isDeleted ? (
                <div>
                  <span>{t('adminUsers.deletedByField')}</span>
                  <strong>{user.deletedByName ?? user.deletedBy ?? t('common.unknown')}</strong>
                </div>
              ) : null}
              <div>
                <span>ID</span>
                <strong>{user.id}</strong>
              </div>
            </div>

            {!user.isDeleted ? <UserRolesPanel userId={user.id} allRoles={allRoles} /> : null}

            <div className="admin-user-card__actions">
              {user.isDeleted ? (
                <Button variant="primary" onClick={() => setPendingRestoreUser(user)} disabled={activeRestoreUserId === user.id}>
                  {t('adminUsers.restoreAccountButton')}
                </Button>
              ) : (
                <>
                  <Input
                    label={t('adminUsers.resetPasswordLabel')}
                    type="password"
                    value={resetPasswords[user.id] ?? ''}
                    onChange={(event) => setResetPasswords((current) => ({ ...current, [user.id]: event.target.value }))}
                    placeholder={t('adminUsers.resetPasswordPlaceholder')}
                  />
                  <div className="admin-user-card__buttons">
                    <Button variant="secondary" onClick={() => void handleResetPassword(user.id)} disabled={activeResetUserId === user.id}>
                      {t('adminUsers.resetPasswordButton')}
                    </Button>
                    <Button variant="danger" onClick={() => setPendingDeleteUser(user)} disabled={activeDeleteUserId === user.id}>
                      {t('adminUsers.deleteAccountButton')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {!error ? (
        <div className="admin-users-pagination">
          <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
            {t('adminUsers.previous')}
          </Button>
          <div className="admin-users-pagination__status">
            <strong>{page}</strong>
            <span>{t('adminUsers.of', { total: totalPages })}</span>
          </div>
          <Button variant="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading}>
            {t('adminUsers.next')}
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={pendingDeleteUser !== null}
        title={t('adminUsers.deleteAccountTitle')}
        description={t('adminUsers.deleteAccountDescription', {
          name: getDisplayName(pendingDeleteUser?.name ?? null, pendingDeleteUser?.userName ?? null, pendingDeleteUser?.email ?? null)
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isConfirming={activeDeleteUserId !== null}
        onConfirm={() => pendingDeleteUser && void handleDeleteUser(pendingDeleteUser.id)}
        onCancel={() => setPendingDeleteUser(null)}
      />

      <ConfirmDialog
        isOpen={pendingRestoreUser !== null}
        title={t('adminUsers.restoreAccountTitle')}
        description={t('adminUsers.restoreAccountDescription', {
          name: getDisplayName(pendingRestoreUser?.name ?? null, pendingRestoreUser?.userName ?? null, pendingRestoreUser?.email ?? null)
        })}
        confirmLabel={t('adminUsers.restore')}
        cancelLabel={t('common.cancel')}
        isConfirming={activeRestoreUserId !== null}
        onConfirm={() => pendingRestoreUser && void handleRestoreUser(pendingRestoreUser)}
        onCancel={() => setPendingRestoreUser(null)}
      />
    </PageSection>
  );
}
