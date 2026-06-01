import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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
      setError(t('adminUsers.loadDeletedUsersError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = `${t('adminUsers.deletedUsersTab')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

  useEffect(() => {
    void loadDeletedUsers(page, pageSize);
  }, [page, pageSize]);

  const handleRestoreUser = async (user: DeletedUser) => {
    setActiveRestoreUserId(user.id);

    try {
      await usersService.restoreUser(user.id);
      setPendingRestoreUser(null);
      toast(t('adminUsers.accountRestored'), 'success');

      const nextTotal = Math.max(0, total - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      await loadDeletedUsers(Math.min(page, nextTotalPages), pageSize);
    } catch (restoreError) {
      toast(restoreError instanceof ApiError ? restoreError.message : t('adminUsers.accountRestoreError'), 'error');
    } finally {
      setActiveRestoreUserId(null);
    }
  };

  return (
    <PageSection title={t('adminUsers.deletedUsersTab')} subtitle={t('adminUsers.deletedNoMatchesDescription')}>
      <div className="admin-users-hero">
        <div>
          <span className="admin-users-hero__eyebrow">{t('adminUsers.eyebrow')}</span>
          <h2>{t('adminUsers.restoreAccountTitle')}</h2>
          <p>{t('adminDashboard.deletedUsersDescription')}</p>
        </div>
        <div className="admin-users-hero__meta">
          <strong>{total}</strong>
          <span>{t('adminUsers.deletedUsersTotal')}</span>
        </div>
      </div>

      <div className="admin-users-toolbar">
        <Link to="/admin/users" className="admin-users-link-button">
          {t('adminUsers.activeUsersTab')}
        </Link>
        <div className="admin-users-toolbar__sort">
          <Select
            label={t('adminUsers.pageSize')}
            value={String(pageSize)}
            onChange={(value) => {
              setPage(1);
              setPageSize(Number(value));
            }}
            options={PAGE_SIZE_OPTIONS}
          />
        </div>
      </div>

      {error ? <EmptyState title={t('adminUsers.loadUsersTitle')} description={error} /> : null}
      {!error && !isLoading && users.length === 0 ? <EmptyState title={t('adminUsers.deletedNoMatchesTitle')} description={t('adminUsers.deletedNoMatchesDescription')} /> : null}

      <div className="admin-users-page-meta">
        <span>
          {t('adminUsers.pageOf', { page, total: totalPages })}
        </span>
        <span>{t('adminUsers.onCurrentPage', { count: users.length })}</span>
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
                <p>{user.email ?? t('common.emailNotSpecified')}</p>
              </div>
            </div>

            <div className="admin-user-card__facts">
              <div>
                <span>{t('adminUsers.statusField')}</span>
                <strong>
                  <Badge tone="danger">{t('adminUsers.deletedStatus')}</Badge>
                </strong>
              </div>
              <div>
                <span>{t('adminUsers.deletionDateField')}</span>
                <strong>{user.deletedAt ? formatDate(user.deletedAt) : t('common.unknown')}</strong>
              </div>
              <div>
                <span>{t('adminUsers.deletedByField')}</span>
                <strong>{user.deletedByName ?? user.deletedBy ?? t('common.unknown')}</strong>
              </div>
              <div>
                <span>{t('adminUsers.ageField')}</span>
                <strong>{user.age ?? t('common.notSpecifiedNeutral')}</strong>
              </div>
              <div>
                <span>ID</span>
                <strong>{user.id}</strong>
              </div>
            </div>

            <div className="admin-user-card__actions">
              <Button variant="primary" onClick={() => setPendingRestoreUser(user)} disabled={activeRestoreUserId === user.id}>
                {t('adminUsers.restoreAccountButton')}
              </Button>
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
