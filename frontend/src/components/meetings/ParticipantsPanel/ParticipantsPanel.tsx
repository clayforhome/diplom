import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sessionsService } from '../../../http/sessionsService';
import type { InvitationStatus, OrganizerUser, Participant } from '../../../types';
import { formatDate, formatTime } from '../../../utils/format';
import { getInvitationStatusLabel } from '../../../utils/meetingLabels';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { ConfirmDialog } from '../../ui/ConfirmDialog/ConfirmDialog';
import { Textarea } from '../../ui/Textarea/Textarea';
import { ParticipantsDropdown } from '../ParticipantsDropdown/ParticipantsDropdown';
import './ParticipantsPanel.scss';

interface ParticipantsPanelProps {
  participants: Participant[];
  canRespond: boolean;
  currentUserId?: string | null;
  onRespond: (status: InvitationStatus, comment?: string) => Promise<void>;
  onRemove?: (userId: string) => Promise<void>;
  onInvite?: (participantIds: string[]) => Promise<void>;
}

export function ParticipantsPanel({ participants, canRespond, currentUserId, onRespond, onRemove, onInvite }: ParticipantsPanelProps) {
  const [comment, setComment] = useState('');
  const [organizerUsers, setOrganizerUsers] = useState<OrganizerUser[]>([]);
  const [inviteSelection, setInviteSelection] = useState<string[]>([]);
  const [participantToRemove, setParticipantToRemove] = useState<Participant | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!onInvite) return;

    let isMounted = true;
    void sessionsService.getOrganizerUsers().then((users) => {
      if (isMounted) setOrganizerUsers(users);
    });

    return () => {
      isMounted = false;
    };
  }, [onInvite]);

  const availableUsers = useMemo(() => {
    const existingIds = new Set(participants.map((participant) => participant.userId));
    return organizerUsers.filter((user) => !existingIds.has(user.id));
  }, [organizerUsers, participants]);

  const handleInvite = async () => {
    if (inviteSelection.length === 0 || !onInvite) return;
    await onInvite(inviteSelection);
    setInviteSelection([]);
  };

  return (
    <Card>
      <div className="participants-panel">
        <div className="participants-panel__header">
          <h2 className="participants-panel__title">{t('meeting.participantsTitle')}</h2>
          <span className="participants-panel__count">{participants.length}</span>
        </div>
        {participants.map((participant) => (
          <div key={participant.userId} className="participants-panel__item">
            <div>
              <strong>{participant.userName || participant.email || participant.userId}</strong>
              <p>{t('meeting.invitedAt', { date: formatDate(participant.invitedAt), time: formatTime(participant.invitedAt) })}</p>
              {participant.comment ? <p>{participant.comment}</p> : null}
            </div>
            <div className="participants-panel__actions">
              <Badge tone={participant.invitationStatus === 'Accepted' ? 'success' : participant.invitationStatus === 'Declined' ? 'danger' : 'warning'}>
                {getInvitationStatusLabel(participant.invitationStatus)}
              </Badge>
              {onRemove ? (
                <Button variant="secondary" onClick={() => setParticipantToRemove(participant)}>
                  {t('common.delete')}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
        {onInvite ? (
          <div className="participants-panel__invite">
            <ParticipantsDropdown label={t('meeting.addParticipants')} users={availableUsers} value={inviteSelection} onChange={setInviteSelection} />
            <Button onClick={() => void handleInvite()}>{t('meeting.inviteSelected')}</Button>
          </div>
        ) : null}
        {canRespond && participants.some((participant) => participant.userId === currentUserId) ? (
          <div className="participants-panel__response">
            <Textarea label={t('meeting.responseComment')} value={comment} onChange={(event) => setComment(event.target.value)} />
            <div className="participants-panel__response-actions">
              <Button onClick={() => onRespond('Accepted', comment)}>{t('meeting.accept')}</Button>
              <Button variant="secondary" onClick={() => onRespond('Pending', comment)}>
                {t('meeting.later')}
              </Button>
              <Button variant="danger" onClick={() => onRespond('Declined', comment)}>
                {t('meeting.decline')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={Boolean(participantToRemove)}
        title={t('meeting.deleteParticipantTitle')}
        description={t('meeting.deleteParticipantDescription', {
          name: participantToRemove?.userName || participantToRemove?.email || participantToRemove?.userId || ''
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isConfirming={isRemoving}
        onConfirm={async () => {
          if (!participantToRemove || !onRemove) return;
          setIsRemoving(true);
          try {
            await onRemove(participantToRemove.userId);
            setParticipantToRemove(null);
          } finally {
            setIsRemoving(false);
          }
        }}
        onCancel={() => setParticipantToRemove(null)}
      />
    </Card>
  );
}
