import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MeetingCard } from '../../components/meetings/MeetingCard/MeetingCard';
import { MeetingForm } from '../../components/meetings/MeetingForm/MeetingForm';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { Input } from '../../components/ui/Input/Input';
import { Select } from '../../components/ui/Select/Select';
import { sessionsService } from '../../http/sessionsService';
import { useToast } from '../../hooks/useToast';
import { useUiSelectOptions } from '../../hooks/useUiSelectOptions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { checkAvailabilityThunk, clearAvailability, fetchMeetingsThunk } from '../../store/slices/sessionsSlice';
import type { MeetingFormValues, MeetingFormat, MeetingStatus } from '../../types';
import { toDateTimeString } from '../../utils/format';

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
  const { t, i18n } = useTranslation();
  const { meetings, availability } = useAppSelector((state) => state.sessions);
  const { roles } = useAppSelector((state) => state.auth);
  const selectOptions = useUiSelectOptions();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MeetingStatus | 'All'>('All');
  const [format, setFormat] = useState<MeetingFormat | 'All'>('All');

  const canManageMeetings = useMemo(() => roles.includes('Organizer') || roles.includes('Admin'), [roles]);

  useEffect(() => {
    document.title = `${t('sessions.pageTitle')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

  useEffect(() => {
    void dispatch(fetchMeetingsThunk({ page: 1, limit: 12, status: status === 'All' ? undefined : status }));
  }, [dispatch, status]);

  const filteredMeetings = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return meetings.filter((meeting) => {
      const matchesFormat = format === 'All' || meeting.format === format;

      if (!matchesFormat) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [meeting.title, meeting.description, meeting.status, meeting.format]
        .map((value) => String(value ?? '').trim().toLowerCase())
        .some((value) => value.includes(normalizedQuery));
    });
  }, [format, meetings, search]);

  return (
    <PageSection title={t('sessions.title')} subtitle={t('sessions.subtitle')}>
      {canManageMeetings ? (
        <MeetingForm
          initialValues={initialFormValues}
          onSubmit={async (values) => {
            await sessionsService.createMeeting({
              title: values.title,
              description: values.description || undefined,
              date: `${values.date}T00:00:00.000Z`,
              startTime: toDateTimeString(values.date, values.startTime),
              endTime: toDateTimeString(values.date, values.endTime),
              format: values.format,
              location: values.location || undefined,
              meetingLink: values.meetingLink || undefined,
              contactInfo: values.contactInfo || undefined,
              participantIds: values.participantIds
            });
            toast(t('sessions.created'), 'success');
            await dispatch(fetchMeetingsThunk({ page: 1, limit: 12, status: status === 'All' ? undefined : status })).unwrap();
          }}
          onCheckAvailability={async (values) => {
            dispatch(clearAvailability());
            await dispatch(
              checkAvailabilityThunk({
                participantIds: values.participantIds,
                date: `${values.date}T00:00:00.000Z`,
                startTime: toDateTimeString(values.date, values.startTime),
                endTime: toDateTimeString(values.date, values.endTime)
              })
            ).unwrap();
          }}
        />
      ) : null}

      {availability ? (
        <div className="availability-box">
          <strong>{availability.allAvailable ? t('sessions.allAvailable') : t('sessions.conflictsFound')}</strong>
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
        <h2 className="sessions-page__meetings-title">{t('sessions.allMeetings')}</h2>
        <div className="sessions-page__controls">
          <div className="sessions-page__search">
            <Input label={t('sessions.searchLabel')} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('sessions.searchPlaceholder')} />
          </div>
          <div className="sessions-page__filters">
            <div className="sessions-page__filter">
              <Select
                label={t('sessions.statusFilter')}
                value={status}
                onChange={(value) => setStatus(value as MeetingStatus | 'All')}
                options={[{ value: 'All', label: t('common.allStatuses') }, ...(selectOptions?.meetingStatuses ?? [])]}
              />
            </div>
            <div className="sessions-page__filter">
              <Select
                label={t('sessions.formatFilter')}
                value={format}
                onChange={(value) => setFormat(value as MeetingFormat | 'All')}
                options={[{ value: 'All', label: t('common.allFormats') }, ...(selectOptions?.meetingFormats ?? [])]}
              />
            </div>
          </div>
        </div>
      </div>

      {filteredMeetings.length > 0 ? (
        <div className="meeting-grid">
          {filteredMeetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      ) : (
        <EmptyState title={t('sessions.notFoundTitle')} description={t('sessions.notFoundDescription')} />
      )}
    </PageSection>
  );
}
