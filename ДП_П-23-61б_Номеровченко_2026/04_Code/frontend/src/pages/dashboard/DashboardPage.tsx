import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { Badge } from '../../components/ui/Badge/Badge';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMeetingsThunk } from '../../store/slices/sessionsSlice';
import { formatDate, formatDateTimeRange } from '../../utils/format';
import { getMeetingStatusLabel, getMeetingStatusTone } from '../../utils/meetingLabels';
import { getUserRoleLabel } from '../../utils/userLabels';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const meetings = useAppSelector((state) => state.sessions.meetings);
  const isLoading = useAppSelector((state) => state.sessions.isLoading);
  const totalMeetings = useAppSelector((state) => state.sessions.pagination.total);
  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('Admin');
  const isOrganizer = roles.includes('Organizer');

  const upcomingMeetings = useMemo(
    () =>
      [...meetings]
        .filter((meeting) => new Date(meeting.endTime).getTime() >= Date.now())
        .sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()),
    [meetings]
  );

  const nextMeeting = upcomingMeetings[0] ?? null;
  const managedMeetings = useMemo(() => meetings.filter((meeting) => meeting.organizerId === user?.id).length, [meetings, user?.id]);
  const confirmedMeetings = useMemo(() => meetings.filter((meeting) => meeting.status === 'Confirmed').length, [meetings]);
  const workspaceLabel = isAdmin
    ? t('dashboard.adminWorkspace')
    : isOrganizer
      ? t('dashboard.organizerWorkspace')
      : t('dashboard.userWorkspace');
  const quickActions = [
    {
      to: '/sessions',
      title: t('dashboard.quickActionMeetingsTitle'),
      description: t('dashboard.quickActionMeetingsDescription')
    },
    {
      to: '/profile',
      title: t('dashboard.quickActionProfileTitle'),
      description: t('dashboard.quickActionProfileDescription')
    },
    ...(isAdmin
      ? [
          {
            to: '/admin',
            title: t('dashboard.quickActionAdminTitle'),
            description: t('dashboard.quickActionAdminDescription')
          }
        ]
      : [])
  ];

  useEffect(() => {
    document.title = `${t('dashboard.pageTitle')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

  useEffect(() => {
    void dispatch(fetchMeetingsThunk({ page: 1, limit: 100 }));
  }, [dispatch]);

  return (
    <PageSection title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} actions={<Link to="/sessions">{t('dashboard.registryLink')}</Link>}>
      <div className="dashboard-hero">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">{t('dashboard.workspaceEyebrow')}</span>
          <h2>{user?.userName ?? user?.name ?? t('common.user')}</h2>
          <p>{workspaceLabel}</p>
          <div className="dashboard-hero__badges">
            {roles.map((role) => (
              <Badge key={role} tone="info">
                {getUserRoleLabel(role)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="dashboard-hero__spotlight">
          <span className="dashboard-hero__spotlight-label">{t('dashboard.focusLabel')}</span>
          {nextMeeting ? (
            <>
              <strong>{nextMeeting.title}</strong>
              <span>{formatDate(nextMeeting.date)}</span>
              <span>{formatDateTimeRange(nextMeeting.startTime, nextMeeting.endTime)}</span>
            </>
          ) : (
            <>
              <strong>{t('dashboard.freeWindowTitle')}</strong>
              <span>{t('dashboard.freeWindowDescription')}</span>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-metrics">
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">{t('dashboard.totalMeetings')}</span>
          <strong>{isLoading ? '—' : totalMeetings}</strong>
          <p>{t('dashboard.totalMeetingsDescription')}</p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">{t('dashboard.confirmedMeetings')}</span>
          <strong>{isLoading ? '—' : confirmedMeetings}</strong>
          <p>{t('dashboard.confirmedMeetingsDescription')}</p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">{t('dashboard.managedMeetings')}</span>
          <strong>{isLoading ? '—' : managedMeetings}</strong>
          <p>{t('dashboard.managedMeetingsDescription')}</p>
        </article>
      </div>

      <div className="dashboard-layout">
        <section className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h3>{t('dashboard.quickActionsTitle')}</h3>
          </div>
          <div className="dashboard-actions">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to} className="dashboard-action">
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h3>{t('dashboard.currentTitle')}</h3>
            <span>{t('dashboard.currentSubtitle')}</span>
          </div>
          {upcomingMeetings.length > 0 ? (
            <div className="dashboard-timeline">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <article key={meeting.id} className="dashboard-timeline__item">
                  <div>
                    <strong>{meeting.title}</strong>
                    <p>{meeting.description || t('dashboard.meetingDescriptionFallback')}</p>
                  </div>
                  <div className="dashboard-timeline__meta">
                    <Badge tone={getMeetingStatusTone(meeting.status)}>{getMeetingStatusLabel(meeting.status)}</Badge>
                    <span>{formatDate(meeting.date)}</span>
                    <span>{formatDateTimeRange(meeting.startTime, meeting.endTime)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-strip">
              <strong>{t('dashboard.emptyScheduleTitle')}</strong>
              <p>{t('dashboard.emptyScheduleDescription')}</p>
            </div>
          )}
        </section>

        {isOrganizer || isAdmin ? (
          <section className="dashboard-panel dashboard-panel--accent">
            <div className="dashboard-panel__header">
              <h3>{t('dashboard.organizerPanelTitle')}</h3>
              <span>{t('dashboard.organizerPanelSubtitle')}</span>
            </div>
            <div className="dashboard-organizer">
              <div>
                <strong>{managedMeetings}</strong>
                <span>{t('dashboard.managedCount')}</span>
              </div>
              <div>
                <strong>{upcomingMeetings.length}</strong>
                <span>{t('dashboard.upcomingCount')}</span>
              </div>
              <div>
                <strong>{isAdmin ? t('dashboard.adminOrganizerMode') : t('dashboard.organizerMode')}</strong>
                <span>{t('dashboard.activeMode')}</span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </PageSection>
  );
}
