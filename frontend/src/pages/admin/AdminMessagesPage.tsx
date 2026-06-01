import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageSection } from '../../components/layout/PageSection/PageSection';
import { Badge } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { EmptyState } from '../../components/ui/EmptyState/EmptyState';
import { Select } from '../../components/ui/Select/Select';
import { messagesService } from '../../http/messagesService';
import type { MessageItem } from '../../types';
import { formatDate, formatTime } from '../../utils/format';
import './AdminMessagesPage.scss';

const PAGE_SIZE_OPTIONS = [
  { value: '6', label: '6' },
  { value: '12', label: '12' },
  { value: '24', label: '24' },
  { value: '48', label: '48' }
];

export function AdminMessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    document.title = 'Сообщения - Система управления встречами';
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    messagesService
      .listMessages(page, pageSize)
      .then((response) => {
        setMessages(response.items);
        setTotal(response.total);
        setPage(response.page);
        setPageSize(response.pageSize);
      })
      .catch(() => setError('Не удалось загрузить отправленные сообщения.'))
      .finally(() => setIsLoading(false));
  }, [page, pageSize]);

  return (
    <PageSection title="Сообщения">
      <div className="admin-messages-hero">
        <div>
          <span className="admin-messages-hero__eyebrow">Email-уведомления</span>
          <h2>История отправки сообщений</h2>

        </div>
        <div className="admin-messages-hero__meta">
          <strong>{total}</strong>
          <span>сообщений</span>
        </div>
      </div>

      <div className="admin-messages-toolbar">
        <Link to="/admin/users" className="admin-messages-link-button">
          Пользователи
        </Link>
        <Select
          label="На странице"
          value={String(pageSize)}
          onChange={(value) => {
            setPage(1);
            setPageSize(Number(value));
          }}
          options={PAGE_SIZE_OPTIONS}
        />
      </div>

      {error ? <EmptyState title="Не удалось загрузить сообщения" description={error} /> : null}
      {!error && !isLoading && messages.length === 0 ? <EmptyState title="Сообщений пока нет" /> : null}

      <div className="admin-messages-list">
        {messages.map((message) => (
          <article key={message.id} className="admin-message-card">
            <div className="admin-message-card__header">
              <div>
                <h3>{message.subject}</h3>
                <p>
                  {message.recipientName} · {message.recipientEmail}
                </p>
              </div>
              <Badge tone={message.meetingId ? 'info' : 'neutral'}>{message.meetingId ? 'Встреча' : 'Общее'}</Badge>
            </div>
            <p className="admin-message-card__body">{message.body}</p>
            <div className="admin-message-card__meta">
              <span>
                {formatDate(message.sentAt)} · {formatTime(message.sentAt)}
              </span>
              {message.meetingId ? <Link to={`/sessions/${message.meetingId}`}>Открыть встречу</Link> : null}
            </div>
          </article>
        ))}
      </div>

      {!error ? (
        <div className="admin-messages-pagination">
          <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
            Назад
          </Button>
          <div className="admin-messages-pagination__status">
            <strong>{page}</strong>
            <span>из {totalPages}</span>
          </div>
          <Button variant="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading}>
            Вперед
          </Button>
        </div>
      ) : null}
    </PageSection>
  );
}
