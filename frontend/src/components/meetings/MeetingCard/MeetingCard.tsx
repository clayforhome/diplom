import { Link } from 'react-router-dom';
import { Badge } from '../../ui/Badge/Badge';
import { Card } from '../../ui/Card/Card';
import type { MeetingSummary } from '../../../types';
import { formatDate, formatDateTimeRange } from '../../../utils/format';
import { getMeetingFormatLabel, getMeetingStatusLabel, getMeetingStatusTone } from '../../../utils/meetingLabels';
import './MeetingCard.scss';



export function MeetingCard({ meeting }: { meeting: MeetingSummary }) {
  return (
    <Card>
      <article className="meeting-card">
        <div className="meeting-card__meta">
          <Badge tone={getMeetingStatusTone(meeting.status)}>{getMeetingStatusLabel(meeting.status)}</Badge>
          <Badge>{getMeetingFormatLabel(meeting.format)}</Badge>
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
