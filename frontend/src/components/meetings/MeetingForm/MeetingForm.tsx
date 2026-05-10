import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import { Card } from '../../ui/Card/Card';
import { sessionsService } from '../../../http/sessionsService';
import type { MeetingFormValues, MeetingFormat, MeetingStatus, OrganizerUser } from '../../../types';
import { ParticipantsDropdown } from '../ParticipantsDropdown/ParticipantsDropdown';
import './MeetingForm.scss';

interface MeetingFormProps {
  initialValues: MeetingFormValues;
  onSubmit: (values: MeetingFormValues) => Promise<void>;
  onCheckAvailability?: (values: MeetingFormValues) => Promise<void>;
  isEditing?: boolean;
}

const statusOptions: Array<{ value: MeetingStatus; label: string }> = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'AwaitingConfirmation', label: 'AwaitingConfirmation' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Rescheduled', label: 'Rescheduled' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Completed', label: 'Completed' }
];

export function MeetingForm({ initialValues, onSubmit, onCheckAvailability, isEditing = false }: MeetingFormProps) {
  const [values, setValues] = useState(initialValues);
  const [meetingFormats, setMeetingFormats] = useState<MeetingFormat[]>([]);
  const [organizerUsers, setOrganizerUsers] = useState<OrganizerUser[]>([]);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    let isMounted = true;

    void sessionsService.getMeetingFormats().then((formats) => {
      if (!isMounted) {
        return;
      }

      setMeetingFormats(formats);
      setValues((current) => {
        if (formats.length === 0 || formats.includes(current.format)) {
          return current;
        }

        return { ...current, format: formats[0] };
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    let isMounted = true;

    void sessionsService.getOrganizerUsers().then((users) => {
      if (isMounted) {
        setOrganizerUsers(users);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isEditing]);

  const updateField = <K extends keyof MeetingFormValues>(field: K, value: MeetingFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const formatOptions = useMemo(
    () =>
      (meetingFormats.length > 0 ? meetingFormats : [values.format]).map((format) => ({
        value: format,
        label: format
      })),
    [meetingFormats, values.format]
  );

  return (
    <Card>
      <form
        className="meeting-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(values);
        }}
      >
        <div className="meeting-form__grid">
          <Input label="Название встречи" value={values.title} onChange={(event) => updateField('title', event.target.value)} required />
          <Select label="Формат" value={values.format} onChange={(value) => updateField('format', value as MeetingFormat)} options={formatOptions} />
          <Input label="Дата" type="date" value={values.date} onChange={(event) => updateField('date', event.target.value)} required />
          <Input label="Начало" type="time" value={values.startTime} onChange={(event) => updateField('startTime', event.target.value)} required />
          <Input label="Окончание" type="time" value={values.endTime} onChange={(event) => updateField('endTime', event.target.value)} required />
          {isEditing ? (
            <Select label="Статус" value={(values as MeetingFormValues & { status?: MeetingStatus }).status ?? 'Draft'} onChange={() => undefined} options={statusOptions} />
          ) : null}
          <Input label="Локация" value={values.location} onChange={(event) => updateField('location', event.target.value)} />
          <Input label="Ссылка" value={values.meetingLink} onChange={(event) => updateField('meetingLink', event.target.value)} />
          <Input label="Контактная информация" value={values.contactInfo} onChange={(event) => updateField('contactInfo', event.target.value)} />
          {!isEditing ? (
            <div className="meeting-form__full-width">
              <ParticipantsDropdown
                label="Участники"
                users={organizerUsers}
                value={values.participantIds}
                onChange={(participantIds) => updateField('participantIds', participantIds)}
              />
            </div>
          ) : null}
        </div>
        <Textarea label="Описание" value={values.description} onChange={(event) => updateField('description', event.target.value)} />
        <div className="meeting-form__actions">
          {onCheckAvailability ? (
            <Button type="button" variant="secondary" onClick={() => void onCheckAvailability(values)}>
              Проверить занятость
            </Button>
          ) : null}
          <Button type="submit">{isEditing ? 'Сохранить изменения' : 'Создать встречу'}</Button>
        </div>
      </form>
    </Card>
  );
}
