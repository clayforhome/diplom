import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { Textarea } from '../../ui/Textarea/Textarea';
import { sessionsService } from '../../../http/sessionsService';
import type { InvitationStatus, OrganizerUser, Participant } from '../../../types';
import { formatDate, formatTime } from '../../../utils/format';
import { getInvitationStatusLabel } from '../../../utils/meetingLabels';
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

  useEffect(() => {
    if (!onInvite) {
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
  }, [onInvite]);

  const availableUsers = useMemo(() => {
    const existingIds = new Set(participants.map((participant) => participant.userId));
    return organizerUsers.filter((user) => !existingIds.has(user.id));
  }, [organizerUsers, participants]);

  const handleInvite = async () => {
    if (inviteSelection.length === 0 || !onInvite) {
      return;
    }

    await onInvite(inviteSelection);
    setInviteSelection([]);
  };

  return (
    <Card>
      <div className="participants-panel">
        <div className="participants-panel__header">
          <h2 className="participants-panel__title">Участники</h2>
          <span className="participants-panel__count">{participants.length}</span>
        </div>
        {participants.map((participant) => (
          <div key={participant.userId} className="participants-panel__item">
            <div>
              <strong>{participant.userName || participant.email || participant.userId}</strong>
              <p>
                Приглашён {formatDate(participant.invitedAt)} в {formatTime(participant.invitedAt)}
              </p>
              {participant.comment ? <p>{participant.comment}</p> : null}
            </div>
            <div className="participants-panel__actions">
              <Badge tone={participant.invitationStatus === 'Accepted' ? 'success' : participant.invitationStatus === 'Declined' ? 'danger' : 'warning'}>
                {getInvitationStatusLabel(participant.invitationStatus)}
              </Badge>
              {onRemove ? (
                <Button variant="secondary" onClick={() => onRemove(participant.userId)}>
                  Удалить
                </Button>
              ) : null}
            </div>
          </div>
        ))}
        {onInvite ? (
          <div className="participants-panel__invite">
            <ParticipantsDropdown label="Добавить участников" users={availableUsers} value={inviteSelection} onChange={setInviteSelection} />
            <Button onClick={() => void handleInvite()}>Пригласить выбранных</Button>
          </div>
        ) : null}
        {canRespond && participants.some((participant) => participant.userId === currentUserId) ? (
          <div className="participants-panel__response">
            <Textarea label="Комментарий к ответу" value={comment} onChange={(event) => setComment(event.target.value)} />
            <div className="participants-panel__response-actions">
              <Button onClick={() => onRespond('Accepted', comment)}>Принять</Button>
              <Button variant="secondary" onClick={() => onRespond('Pending', comment)}>
                Позже
              </Button>
              <Button variant="danger" onClick={() => onRespond('Declined', comment)}>
                Отклонить
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
