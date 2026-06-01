import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageSection } from '../../components/layout/PageSection/PageSection';

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = `${t('adminDashboard.pageTitle')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

  return (
    <PageSection title={t('adminDashboard.title')}>
      <div className="admin-hero">
        <div>
          <span className="admin-hero__eyebrow">{t('adminDashboard.eyebrow')}</span>
          <h2>{t('adminDashboard.heading')}</h2>
          <p>{t('adminDashboard.description')}</p>
        </div>
        <Link to="/admin/users" className="admin-hero__link">
          {t('adminDashboard.openUsers')}
        </Link>
        <Link to="/admin/messages" className="admin-hero__link admin-hero__link--secondary">
          {t('adminDashboard.openMessages')}
        </Link>
      </div>

      <div className="admin-grid">
        <section className="admin-panel">
          <h3>{t('adminDashboard.availableNow')}</h3>
          <p>{t('adminDashboard.availableNowDescription')}</p>
        </section>
        <section className="admin-panel">
          <h3>{t('adminDashboard.deletedUsers')}</h3>
          <p>{t('adminDashboard.deletedUsersDescription')}</p>
          <Link to="/admin/users/deleted" className="admin-panel__link">
            {t('adminDashboard.openArchive')}
          </Link>
        </section>
        <section className="admin-panel">
          <h3>{t('adminDashboard.limited')}</h3>
          <p>{t('adminDashboard.limitedDescription')}</p>
        </section>
        <section className="admin-panel admin-panel--accent">
          <h3>{t('adminDashboard.route')}</h3>
          <p>{t('adminDashboard.routeDescription')}</p>
        </section>
      </div>
    </PageSection>
  );
}
