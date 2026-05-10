import { Link } from 'react-router-dom';
import { Badge } from '../../ui/Badge/Badge';
import { Card } from '../../ui/Card/Card';
import type { MeetingSummary } from '../../../types';
import { formatDate, formatDateTimeRange } from '../../../utils/format';
import './MeetingCard.scss';

function resolveTone(status: MeetingSummary['status']) {
  if (status === 'Confirmed' || status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'danger';
  if (status === 'Rescheduled' || status === 'AwaitingConfirmation') return 'warning';
  if (status === 'Scheduled') return 'info';
  return 'neutral';
}

export function MeetingCard({ meeting }: { meeting: MeetingSummary }) {
  return (
    <Card>
      <article className="meeting-card">
        <div className="meeting-card__meta">
          <Badge tone={resolveTone(meeting.status)}>{meeting.status}</Badge>
          <Badge>{meeting.format}</Badge>
        </div>
        <h3 className="meeting-card__title">{meeting.title}</h3>
        <p className="meeting-card__description">{meeting.description || 'Описание пока не добавлено.'}</p>
        <div className="meeting-card__footer">
          <div>
            <strong>{formatDate(meeting.date)}</strong>
            <p>{formatDateTimeRange(meeting.startTime, meeting.endTime)}</p>
          </div>
          <Link to={`/sessions/${meeting.id}`} className="meeting-card__link">
            Открыть
          </Link>
        </div>
      </article>
    </Card>
  );
}
