import i18n from '../i18n';
import type { InvitationStatus, MeetingFormat, MeetingStatus } from '../types';

export function getMeetingFormatLabel(format: MeetingFormat): string {
  return i18n.t(`meeting.format.${format}`);
}

export function getMeetingStatusLabel(status: MeetingStatus): string {
  return i18n.t(`meeting.status.${status}`);
}

export function getInvitationStatusLabel(status: InvitationStatus): string {
  return i18n.t(`meeting.invitation.${status}`);
}

export function getMeetingStatusTone(status: MeetingStatus): 'success' | 'danger' | 'warning' | 'info' | 'neutral' {
  if (status === 'Confirmed' || status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'danger';
  if (status === 'Rescheduled' || status === 'AwaitingConfirmation') return 'warning';
  if (status === 'Scheduled') return 'info';
  return 'neutral';
}
