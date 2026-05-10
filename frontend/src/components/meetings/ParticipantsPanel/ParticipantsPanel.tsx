import { useState } from 'react';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { Textarea } from '../../ui/Textarea/Textarea';
import { Input } from '../../ui/Input/Input';
import type { InvitationStatus, Participant } from '../../../types';
import { formatDate, formatTime } from '../../../utils/format';
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
  const [inviteInput, setInviteInput] = useState('');

  const handleInvite = async () => {
    const participantIds = inviteInput
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (participantIds.length === 0 || !onInvite) {
      return;
    }

    await onInvite(participantIds);
    setInviteInput('');
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
                {participant.invitationStatus}
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
            <Input
              label="Пригласить участников"
              value={inviteInput}
              onChange={(event) => setInviteInput(event.target.value)}
              placeholder="guid1, guid2, guid3"
            />
            <Button onClick={() => void handleInvite()}>Добавить участников</Button>
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
