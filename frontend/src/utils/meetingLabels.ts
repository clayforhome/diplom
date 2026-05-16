import type { InvitationStatus, MeetingFormat, MeetingStatus } from '../types';

const formatLabels: Record<MeetingFormat, string> = {
  Offline: 'Офлайн',
  Online: 'Онлайн',
  Hybrid: 'Гибрид',
  Phone: 'Телефон'
};

const statusLabels: Record<MeetingStatus, string> = {
  Draft: 'Черновик',
  Scheduled: 'Запланирована',
  AwaitingConfirmation: 'Ожидает подтверждения',
  Confirmed: 'Подтверждена',
  Rescheduled: 'Перенесена',
  Cancelled: 'Отменена',
  Completed: 'Завершена'
};

const invitationStatusLabels: Record<InvitationStatus, string> = {
  Pending: 'Ожидает ответа',
  Accepted: 'Принято',
  Declined: 'Отклонено'
};

export function getMeetingFormatLabel(format: MeetingFormat): string {
  return formatLabels[format];
}

export function getMeetingStatusLabel(status: MeetingStatus): string {
  return statusLabels[status];
}

export function getInvitationStatusLabel(status: InvitationStatus): string {
  return invitationStatusLabels[status];
}

export function getMeetingStatusTone(status: MeetingStatus): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  if (status === 'Confirmed' || status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'danger';
  if (status === 'Rescheduled' || status === 'AwaitingConfirmation') return 'warning';
  if (status === 'Scheduled') return 'info';
  return 'neutral';
}
