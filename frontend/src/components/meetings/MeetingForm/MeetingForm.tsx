import { useEffect, useState } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import { Card } from '../../ui/Card/Card';
import type { MeetingFormValues, MeetingFormat, MeetingStatus } from '../../../types';
import './MeetingForm.scss';

interface MeetingFormProps {
  initialValues: MeetingFormValues;
  onSubmit: (values: MeetingFormValues) => Promise<void>;
  onCheckAvailability?: (values: MeetingFormValues) => Promise<void>;
  isEditing?: boolean;
}

const formatOptions: Array<{ value: MeetingFormat; label: string }> = [
  { value: 'Offline', label: 'Offline' },
  { value: 'Online', label: 'Online' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Phone', label: 'Phone' }
];

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

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const updateField = <K extends keyof MeetingFormValues>(field: K, value: MeetingFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

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
          <Input label="Location" value={values.location} onChange={(event) => updateField('location', event.target.value)} />
          <Input label="Meeting link" value={values.meetingLink} onChange={(event) => updateField('meetingLink', event.target.value)} />
          <Input label="Contact info" value={values.contactInfo} onChange={(event) => updateField('contactInfo', event.target.value)} />
          <Input
            label="ID участников"
            value={values.participantIds.join(', ')}
            onChange={(event) =>
              updateField(
                'participantIds',
                event.target.value
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean)
              )
            }
            placeholder="guid1, guid2"
          />
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
