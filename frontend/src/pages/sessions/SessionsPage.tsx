import { useEffect, useMemo, useState } from 'react';
import { MeetingCard } from '../../components/meetings/MeetingCard/MeetingCard';
import { MeetingForm } from '../../components/meetings/MeetingForm/MeetingForm';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { Select } from '../../components/ui/Select/Select';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { checkAvailabilityThunk, clearAvailability, fetchMeetingsThunk } from '../../store/slices/sessionsSlice';
import { sessionsService } from '../../http/sessionsService';
import { useToast } from '../../hooks/useToast';
import { toDateTimeString } from '../../utils/format';
import { getMeetingStatusLabel } from '../../utils/meetingLabels';
import type { MeetingFormValues, MeetingStatus } from '../../types';

const initialFormValues: MeetingFormValues = {
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  format: 'Offline',
  location: '',
  meetingLink: '',
  contactInfo: '',
  participantIds: []
};

export function SessionsPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { meetings, availability } = useAppSelector((state) => state.sessions);
  const { roles } = useAppSelector((state) => state.auth);
  const [status, setStatus] = useState<MeetingStatus | 'All'>('All');
  const [statusOptions, setStatusOptions] = useState<MeetingStatus[]>([]);

  const canManageMeetings = useMemo(() => roles.includes('Organizer') || roles.includes('Admin'), [roles]);

  useEffect(() => {
    document.title = 'Расписание встреч - Meeting Management System';
  }, []);

  useEffect(() => {
    void sessionsService.getMeetingStatuses().then(setStatusOptions);
  }, []);

  useEffect(() => {
    void dispatch(fetchMeetingsThunk({ page: 1, limit: 12, status: status === 'All' ? undefined : status }));
  }, [dispatch, status]);

  return (
    <PageSection title="Встречи" subtitle="Список ваших встреч и операций с ними">
      {canManageMeetings ? (
        <MeetingForm
          initialValues={initialFormValues}
          onSubmit={async (values) => {
            await sessionsService.createMeeting({
              title: values.title,
              description: values.description || undefined,
              date: new Date(`${values.date}T00:00:00`).toISOString(),
              startTime: toDateTimeString(values.date, values.startTime),
              endTime: toDateTimeString(values.date, values.endTime),
              format: values.format,
              location: values.location || undefined,
              meetingLink: values.meetingLink || undefined,
              contactInfo: values.contactInfo || undefined,
              participantIds: values.participantIds
            });
            toast('Встреча создана', 'success');
            await dispatch(fetchMeetingsThunk({ page: 1, limit: 12, status: status === 'All' ? undefined : status })).unwrap();
          }}
          onCheckAvailability={async (values) => {
            dispatch(clearAvailability());
            await dispatch(
              checkAvailabilityThunk({
                participantIds: values.participantIds,
                date: new Date(`${values.date}T00:00:00`).toISOString(),
                startTime: toDateTimeString(values.date, values.startTime),
                endTime: toDateTimeString(values.date, values.endTime)
              })
            ).unwrap();
          }}
        />
      ) : null}
      {availability ? (
        <div className="availability-box">
          <strong>{availability.allAvailable ? 'Все участники свободны' : 'Найдены конфликты'}</strong>
          {!availability.allAvailable
            ? availability.conflicts.map((conflict) => (
                <p key={`${conflict.userId}-${conflict.conflictingMeetingId}`}>
                  {conflict.userName || conflict.userId}: {conflict.conflictingMeetingTitle}
                </p>
              ))
            : null}
        </div>
      ) : null}
      <div className="sessions-page__meetings-header">
        <h2 className="sessions-page__meetings-title">Все встречи</h2>
        <div className="sessions-page__filter">
          <Select
            label="Фильтр по статусу"
            value={status}
            onChange={(value) => setStatus(value as MeetingStatus | 'All')}
            options={[
              { value: 'All', label: 'Все статусы' },
              ...statusOptions.map((meetingStatus) => ({
                value: meetingStatus,
                label: getMeetingStatusLabel(meetingStatus)
              }))
            ]}
          />
        </div>
      </div>
      {meetings.length > 0 ? (
        <div className="meeting-grid">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <EmptyState title="Встреч пока нет" description="Создайте первую встречу или дождитесь приглашения от организатора." />
      )}
    </PageSection>
  );
}
