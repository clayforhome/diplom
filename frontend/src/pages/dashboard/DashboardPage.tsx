import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge/Badge';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMeetingsThunk } from '../../store/slices/sessionsSlice';
import { formatDate, formatDateTimeRange } from '../../utils/format';
import { getMeetingStatusLabel } from '../../utils/meetingLabels';
import { getUserRoleLabel } from '../../utils/userLabels';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const meetings = useAppSelector((state) => state.sessions.meetings);
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
    ? 'Администрирование и контроль доступа'
    : isOrganizer
      ? 'Координация встреч и участников'
      : 'Личный обзор и участие во встречах';
  const quickActions = [
    { to: '/sessions', title: 'Открыть встречи', description: 'Перейти к расписанию, фильтрам и деталям встреч.' },
    { to: '/profile', title: 'Открыть профиль', description: 'Проверить данные аккаунта, роли и параметры доступа.' },
    ...(isAdmin ? [{ to: '/admin', title: 'Открыть админ-панель', description: 'Перейти к административным разделам и списку пользователей.' }] : [])
  ];

  useEffect(() => {
    document.title = 'Главная - Система управления встречами';
  }, []);

  useEffect(() => {
    if (meetings.length === 0) {
      void dispatch(fetchMeetingsThunk({ page: 1, limit: 12 }));
    }
  }, [dispatch, meetings.length]);

  return (
    <PageSection title="Главная панель" subtitle="Быстрый обзор текущего аккаунта и встреч" actions={<Link to="/sessions">К реестру встреч</Link>}>
      <div className="dashboard-hero">
        <div className="dashboard-hero__content">
          <span className="dashboard-hero__eyebrow">Обзор рабочего пространства</span>
          <h2>{user?.userName ?? user?.name ?? 'Пользователь'}</h2>
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
          <span className="dashboard-hero__spotlight-label">Ближайший фокус</span>
          {nextMeeting ? (
            <>
              <strong>{nextMeeting.title}</strong>
              <span>{formatDate(nextMeeting.date)}</span>
              <span>{formatDateTimeRange(nextMeeting.startTime, nextMeeting.endTime)}</span>
            </>
          ) : (
            <>
              <strong>Свободное окно</strong>
              <span>Пока нет ближайших встреч в расписании.</span>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-metrics">
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Всего встреч</span>
          <strong>{meetings.length}</strong>
          <p>Актуальный объём встреч в вашем рабочем контуре.</p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Подтверждено</span>
          <strong>{confirmedMeetings}</strong>
          <p>Встречи, по которым уже есть финальное подтверждение.</p>
        </article>
        <article className="dashboard-metric">
          <span className="dashboard-metric__label">Под вашим контролем</span>
          <strong>{managedMeetings}</strong>
          <p>Сессии, где текущий аккаунт выступает организатором.</p>
        </article>
      </div>

      <div className="dashboard-layout">
        <section className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h3>Быстрые действия</h3>
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
            <h3>Что происходит сейчас</h3>
            <span>Короткая навигация по дню</span>
          </div>
          {upcomingMeetings.length > 0 ? (
            <div className="dashboard-timeline">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <article key={meeting.id} className="dashboard-timeline__item">
                  <div>
                    <strong>{meeting.title}</strong>
                    <p>{meeting.description || 'Описание встречи пока не заполнено.'}</p>
                  </div>
                  <div className="dashboard-timeline__meta">
                    <span>{getMeetingStatusLabel(meeting.status)}</span>
                    <span>{formatDate(meeting.date)}</span>
                    <span>{formatDateTimeRange(meeting.startTime, meeting.endTime)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-strip">
              <strong>Расписание пока свободно</strong>
              <p>Когда появятся встречи, здесь будет компактная лента ближайших событий.</p>
            </div>
          )}
        </section>

        {isOrganizer || isAdmin ? (
          <section className="dashboard-panel dashboard-panel--accent">
            <div className="dashboard-panel__header">
              <h3>Панель организатора</h3>
              <span>Для координации встреч</span>
            </div>
            <div className="dashboard-organizer">
              <div>
                <strong>{managedMeetings}</strong>
                <span>встреч под управлением</span>
              </div>
              <div>
                <strong>{upcomingMeetings.length}</strong>
                <span>предстоящих событий</span>
              </div>
              <div>
                <strong>{isAdmin ? 'Админ + Организатор' : 'Организатор'}</strong>
                <span>активный рабочий режим</span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </PageSection>
  );
}
