import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Textarea } from '../../ui/Textarea/Textarea';
import { Card } from '../../ui/Card/Card';
import { sessionsService } from '../../../http/sessionsService';
import { useUiSelectOptions } from '../../../hooks/useUiSelectOptions';
import type { MeetingFormValues, MeetingFormat, MeetingStatus, OrganizerUser, SelectOption } from '../../../types';
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
  const [organizerUsers, setOrganizerUsers] = useState<OrganizerUser[]>([]);
  const selectOptions = useUiSelectOptions();

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    const formats = selectOptions?.meetingFormats.map((option) => option.value as MeetingFormat) ?? [];

    if (formats.length === 0) {
      return;
    }

    setValues((current) => {
      if (formats.includes(current.format)) {
        return current;
      }

      return { ...current, format: formats[0] };
    });
  }, [selectOptions]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const statuses = selectOptions?.meetingStatuses.map((option) => option.value as MeetingStatus) ?? [];

    if (statuses.length === 0) {
      return;
    }

    setValues((current) => ({
      ...current,
      status: current.status && statuses.includes(current.status) ? current.status : statuses[0] ?? current.status
    }));
  }, [isEditing, selectOptions]);

  useEffect(() => {
    let isMounted = true;

    void sessionsService.getOrganizerUsers().then((users) => {
      if (isMounted) {
        setOrganizerUsers(users);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = <K extends keyof MeetingFormValues>(field: K, value: MeetingFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const formatOptions = useMemo(
    () => (selectOptions?.meetingFormats.length ? selectOptions.meetingFormats : [{ value: values.format, label: values.format }]),
    [selectOptions, values.format]
  );

  const statusOptions = useMemo(
    () => (selectOptions?.meetingStatuses ?? []).map((option) => option as SelectOption<MeetingStatus>),
    [selectOptions]
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

          <Input label="Дата" type="date" value={values.date} onChange={(event) => updateField('date', event.target.value)} required />
          <Input label="Начало" type="time" value={values.startTime} onChange={(event) => updateField('startTime', event.target.value)} required />
          <Input label="Окончание" type="time" value={values.endTime} onChange={(event) => updateField('endTime', event.target.value)} required />
          <Select label="Формат" value={values.format} onChange={(value) => updateField('format', value as MeetingFormat)} options={formatOptions} />
          {isEditing && values.status ? (
            <Select label="Статус" value={values.status} onChange={(value) => updateField('status', value as MeetingStatus)} options={statusOptions} />
          ) : null}
          <Input label="Локация" value={values.location} onChange={(event) => updateField('location', event.target.value)} />
          <Input label="Ссылка на встречу" value={values.meetingLink} onChange={(event) => updateField('meetingLink', event.target.value)} />
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
          {footerActions}
          <Button type="submit">{isEditing ? 'Сохранить изменения' : 'Создать встречу'}</Button>
        </div>
      </form>
    </Card>
  );
}
