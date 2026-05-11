import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MeetingForm } from '../../components/meetings/MeetingForm/MeetingForm';
import { ParticipantsPanel } from '../../components/meetings/ParticipantsPanel/ParticipantsPanel';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { Spinner } from '../../components/ui/Spinner/Spinner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMeetingThunk, fetchParticipantsThunk } from '../../store/slices/sessionsSlice';
import { sessionsService } from '../../http/sessionsService';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatDateTimeRange, toDateTimeString } from '../../utils/format';
import { getMeetingFormatLabel, getMeetingStatusLabel } from '../../utils/meetingLabels';
import type { MeetingFormValues, MeetingStatus } from '../../types';

function getFormValues(meeting?: {
  title?: string;
  description?: string | null;
  date?: string;
  startTime?: string;
  endTime?: string;
  format?: 'Offline' | 'Online' | 'Hybrid' | 'Phone';
  status?: MeetingStatus;
  location?: string | null;
  meetingLink?: string | null;
  contactInfo?: string | null;
}): MeetingFormValues {
  const date = meeting?.date ? new Date(meeting.date).toISOString().slice(0, 10) : '';
  const startTime = meeting?.startTime ? new Date(meeting.startTime).toISOString().slice(11, 16) : '';
  const endTime = meeting?.endTime ? new Date(meeting.endTime).toISOString().slice(11, 16) : '';

  return {
    title: meeting?.title ?? '',
    description: meeting?.description ?? '',
    date,
    startTime,
    endTime,
    format: meeting?.format ?? 'Offline',
    status: meeting?.status,
    location: meeting?.location ?? '',
    meetingLink: meeting?.meetingLink ?? '',
    contactInfo: meeting?.contactInfo ?? '',
    participantIds: []
  };
}

export function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const meeting = useAppSelector((state) => state.sessions.selectedMeeting);
  const participants = useAppSelector((state) => state.sessions.participants);
  const auth = useAppSelector((state) => state.auth);

  const formValues = useMemo(() => getFormValues(meeting ?? undefined), [meeting]);
  const canManage = Boolean(meeting && auth.user?.id === meeting.organizerId) || auth.roles.includes('Admin');

  useEffect(() => {
    if (!id) {
      return;
    }

    void dispatch(fetchMeetingThunk(id));
    void dispatch(fetchParticipantsThunk(id));
  }, [dispatch, id]);

  useEffect(() => {
    document.title = meeting ? `${meeting.title} - Система управления встречами` : 'Встреча - Система управления встречами';
  }, [meeting]);

  if (!id || !meeting) {
    return <Spinner />;
  }

  return (
    <PageSection title={meeting.title} subtitle={`${formatDate(meeting.date)} · ${formatDateTimeRange(meeting.startTime, meeting.endTime)}`}>
      <div className={`detail-grid ${canManage ? '' : 'detail-grid--viewer'}`.trim()}>
        <Card>
          <div className="detail-grid__summary">
            <div className="detail-grid__summary-head">
              <div className="detail-grid__badges">
                <Badge tone="info">{getMeetingFormatLabel(meeting.format)}</Badge>
                <Badge>{getMeetingStatusLabel(meeting.status)}</Badge>
              </div>
              <div className="detail-grid__stats">
                <div className="detail-grid__stat">
                  <strong>{meeting.participantCount}</strong>
                  <span>участников</span>
                </div>
                <div className="detail-grid__stat">
                  <strong>{meeting.fileCount}</strong>
                  <span>файлов</span>
                </div>
              </div>
            </div>
            <div className="detail-grid__description-card">
              <span className="detail-grid__label">Описание</span>
              <p>{meeting.description || 'Описание встречи пока не заполнено.'}</p>
            </div>
            <div className="detail-grid__facts">
              <div className="detail-grid__fact">
                <span className="detail-grid__label">Локация</span>
                <strong>{meeting.location || 'Не указана'}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">Ссылка на встречу</span>
                <strong>{meeting.meetingLink || 'Не указана'}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">Контактная информация</span>
                <strong>{meeting.contactInfo || 'Не указана'}</strong>
              </div>
              <div className="detail-grid__fact">
                <span className="detail-grid__label">Дата и время</span>
                <strong>{`${formatDate(meeting.date)} · ${formatDateTimeRange(meeting.startTime, meeting.endTime)}`}</strong>
              </div>
            </div>
          </div>
        </Card>
        {canManage ? (
          <MeetingForm
            initialValues={formValues}
            isEditing
            footerActions={
              <Button
                type="button"
                variant="danger"
                onClick={async () => {
                  await sessionsService.deleteMeeting(id);
                  toast('Встреча удалена', 'success');
                  navigate('/sessions');
                }}
              >
                Удалить встречу
              </Button>
            }
            onSubmit={async (values) => {
              await sessionsService.updateMeeting(id, {
                title: values.title,
                description: values.description,
                date: new Date(`${values.date}T00:00:00`).toISOString(),
                startTime: toDateTimeString(values.date, values.startTime),
                endTime: toDateTimeString(values.date, values.endTime),
                format: values.format,
                status: values.status,
                location: values.location,
                meetingLink: values.meetingLink,
                contactInfo: values.contactInfo
              });
              toast('Встреча обновлена', 'success');
              await dispatch(fetchMeetingThunk(id)).unwrap();
            }}
          />
        ) : null}
        <ParticipantsPanel
          participants={participants}
          canRespond
          currentUserId={auth.user?.id}
          onRespond={async (status, comment) => {
            if (!auth.user?.id) {
              return;
            }

            await sessionsService.respondToInvitation(id, auth.user.id, { status, comment });
            toast('Ответ на приглашение сохранён', 'success');
            await dispatch(fetchParticipantsThunk(id)).unwrap();
          }}
          onInvite={
            canManage
              ? async (participantIds) => {
                  await sessionsService.inviteParticipants(id, { participantIds });
                  toast('Участники приглашены', 'success');
                  await dispatch(fetchParticipantsThunk(id)).unwrap();
                  await dispatch(fetchMeetingThunk(id)).unwrap();
                }
              : undefined
          }
          onRemove={
            canManage
              ? async (userId) => {
                  await sessionsService.removeParticipant(id, userId);
                  toast('Участник удалён', 'success');
                  await dispatch(fetchParticipantsThunk(id)).unwrap();
                  await dispatch(fetchMeetingThunk(id)).unwrap();
                }
              : undefined
          }
        />
      </div>
    </PageSection>
  );
}
