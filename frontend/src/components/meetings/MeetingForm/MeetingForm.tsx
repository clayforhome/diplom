import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sessionsService } from '../../../http/sessionsService';
import { useToast } from '../../../hooks/useToast';
import { useUiSelectOptions } from '../../../hooks/useUiSelectOptions';
import type { MeetingFormValues, MeetingFormat, MeetingStatus, OrganizerUser, SelectOption } from '../../../types';
import { Card } from '../../ui/Card/Card';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import { ParticipantsDropdown } from '../ParticipantsDropdown/ParticipantsDropdown';
import './MeetingForm.scss';

interface MeetingFormProps {
  initialValues: MeetingFormValues;
  onSubmit: (values: MeetingFormValues) => Promise<void>;
  onCheckAvailability?: (values: MeetingFormValues) => Promise<void>;
  isEditing?: boolean;
  footerActions?: ReactNode;
}

export function MeetingForm({ initialValues, onSubmit, onCheckAvailability, isEditing = false, footerActions }: MeetingFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof MeetingFormValues, string>>>({});
  const [organizerUsers, setOrganizerUsers] = useState<OrganizerUser[]>([]);
  const selectOptions = useUiSelectOptions();
  const toast = useToast();
  const { t } = useTranslation();

  const now = new Date();
  const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const formats = selectOptions?.meetingFormats.map((option) => option.value as MeetingFormat) ?? [];
    if (formats.length === 0) return;

    setValues((current) => {
      if (formats.includes(current.format)) return current;
      return { ...current, format: formats[0] };
    });
  }, [selectOptions]);

  useEffect(() => {
    if (!isEditing) return;

    const statuses = selectOptions?.meetingStatuses.map((option) => option.value as MeetingStatus) ?? [];
    if (statuses.length === 0) return;

    setValues((current) => ({
      ...current,
      status: current.status && statuses.includes(current.status) ? current.status : statuses[0] ?? current.status
    }));
  }, [isEditing, selectOptions]);

  useEffect(() => {
    let isMounted = true;
    void sessionsService.getOrganizerUsers().then((users) => {
      if (isMounted) setOrganizerUsers(users);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = <K extends keyof MeetingFormValues>(field: K, value: MeetingFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const formatOptions = useMemo(
    () => (selectOptions?.meetingFormats.length ? selectOptions.meetingFormats : [{ value: values.format, label: values.format }]),
    [selectOptions, values.format]
  );

  const statusOptions = useMemo(() => (selectOptions?.meetingStatuses ?? []).map((option) => option as SelectOption<MeetingStatus>), [selectOptions]);

  return (
    <Card>
      <form
        className="meeting-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          const newErrors: Partial<Record<keyof MeetingFormValues, string>> = {};

          if (!values.title?.trim()) newErrors.title = t('meeting.form.required');
          if (!values.date) newErrors.date = t('meeting.form.required');
          else if (values.date < todayString) newErrors.date = t('meeting.form.inPast');

          if (!values.startTime) newErrors.startTime = t('meeting.form.required');
          else if (values.date === todayString && values.startTime < currentTimeString) newErrors.startTime = t('meeting.form.inPast');

          if (!values.endTime) newErrors.endTime = t('meeting.form.required');
          else if (values.endTime <= values.startTime) newErrors.endTime = t('meeting.form.afterStart');

          const isOfflineOrHybrid = values.format === 'Offline' || values.format === 'Hybrid';
          const isOnlineOrHybrid = values.format === 'Online' || values.format === 'Hybrid';

          if (isOfflineOrHybrid && !values.location?.trim()) {
            newErrors.location = t('meeting.form.locationRequired');
          }

          if (isOnlineOrHybrid && !values.meetingLink?.trim()) {
            newErrors.meetingLink = t('meeting.form.linkRequired');
          }

          if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast(t('meeting.form.fixErrors'), 'error');
            return;
          }

          void onSubmit(values);
        }}
      >
        <div className="meeting-form__grid">
          <Input label={t('meeting.form.title')} value={values.title} onChange={(event) => updateField('title', event.target.value)} error={errors.title} />
          <Input label={t('meeting.form.date')} type="date" min={todayString} value={values.date} onChange={(event) => updateField('date', event.target.value)} error={errors.date} />
          <Input label={t('meeting.form.start')} type="time" min={values.date === todayString ? currentTimeString : undefined} value={values.startTime} onChange={(event) => updateField('startTime', event.target.value)} error={errors.startTime} />
          <Input label={t('meeting.form.end')} type="time" min={values.startTime} value={values.endTime} onChange={(event) => updateField('endTime', event.target.value)} error={errors.endTime} />
          <Select label={t('meeting.form.format')} value={values.format} onChange={(value) => updateField('format', value as MeetingFormat)} options={formatOptions} />
          {isEditing && values.status ? <Select label={t('meeting.form.status')} value={values.status} onChange={(value) => updateField('status', value as MeetingStatus)} options={statusOptions} /> : null}
          <Input label={t('meeting.form.location')} value={values.location} onChange={(event) => updateField('location', event.target.value)} error={errors.location} />
          <Input label={t('meeting.form.meetingLink')} value={values.meetingLink} onChange={(event) => updateField('meetingLink', event.target.value)} error={errors.meetingLink} />
          <Input label={t('meeting.form.contactInfo')} value={values.contactInfo} onChange={(event) => updateField('contactInfo', event.target.value)} />
          {!isEditing ? (
            <div className="meeting-form__full-width">
              <ParticipantsDropdown label={t('meeting.form.participants')} users={organizerUsers} value={values.participantIds} onChange={(participantIds) => updateField('participantIds', participantIds)} />
            </div>
          ) : null}
        </div>
        <Textarea label={t('meeting.form.description')} value={values.description} onChange={(event) => updateField('description', event.target.value)} />
        <div className="meeting-form__actions">
          {onCheckAvailability ? (
            <Button type="button" variant="secondary" onClick={() => void onCheckAvailability(values)}>
              {t('meeting.form.checkAvailability')}
            </Button>
          ) : null}
          {footerActions}
          <Button type="submit">{isEditing ? t('meeting.form.saveChanges') : t('meeting.form.createMeeting')}</Button>
        </div>
      </form>
    </Card>
  );
}
