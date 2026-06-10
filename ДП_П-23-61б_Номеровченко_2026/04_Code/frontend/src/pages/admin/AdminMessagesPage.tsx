import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

function cleanupMessageLine(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[•\-]\s*/, '')
    .trim();
}

function isUsefulMessageLine(value: string): boolean {
  const normalized = value.toLowerCase();
  const noiseMarkers = [
    'doctype',
    'font-family',
    'автоматическое письмо',
    'не отвечайте',
    'автоматты хат',
    'жауап бермеңіз',
    'просмотреть встречу',
    'просмотреть обновленную встречу',
    'рәсімді көру',
    'жаңартылған рәсімді көру'
  ];

  return value.length > 0 && !noiseMarkers.some((marker) => normalized.includes(marker));
}

function parseHtmlMessageBody(value: string): string[] {
  const parser = new DOMParser();
  const document = parser.parseFromString(value, 'text/html');
  const root = document.querySelector('.content') ?? document.body;
  const clone = root.cloneNode(true) as HTMLElement;

  clone.querySelectorAll('style, script, .header, .footer, .lang-section, .button, a.button').forEach((element) => element.remove());
  clone.querySelectorAll('br, p, div, h1, h2, h3, h4, h5, h6, li').forEach((element) => element.append(document.createTextNode('\n')));

  return (clone.textContent ?? '')
    .split('\n')
    .map(cleanupMessageLine)
    .filter(isUsefulMessageLine);
}

function parseHtmlKazakhMessageBody(value: string): string[] {
  const parser = new DOMParser();
  const document = parser.parseFromString(value, 'text/html');
  const root = document.querySelector('.lang-section');

  if (!root) {
    return [];
  }

  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('style, script, .footer, .button, a.button').forEach((element) => element.remove());
  clone.querySelectorAll('br, p, div, h1, h2, h3, h4, h5, h6, li').forEach((element) => element.append(document.createTextNode('\n')));

  return (clone.textContent ?? '')
    .split('\n')
    .map(cleanupMessageLine)
    .filter(isUsefulMessageLine);
}

function parsePlainMessageBody(value: string): string[] {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|table|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n')
    .map(cleanupMessageLine)
    .filter(isUsefulMessageLine);
}

function formatMessageBody(value: string): string[] {
  const lines = typeof window === 'undefined' ? parsePlainMessageBody(value) : parseHtmlMessageBody(value);
  return lines.filter((line, index) => lines.findIndex((item) => item.toLowerCase() === line.toLowerCase()) === index).slice(0, 8);
}

function formatKazakhMessageBody(value: string): string[] {
  const lines = typeof window === 'undefined' ? [] : parseHtmlKazakhMessageBody(value);
  return lines.filter((line, index) => lines.findIndex((item) => item.toLowerCase() === line.toLowerCase()) === index).slice(0, 8);
}

export function AdminMessagesPage() {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    document.title = `${t('adminMessages.pageTitle')} - ${t('common.appName')}`;
  }, [t, i18n.resolvedLanguage]);

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
      .catch(() => setError(t('adminMessages.loadError')))
      .finally(() => setIsLoading(false));
  }, [page, pageSize, t]);

  return (
    <PageSection title={t('adminMessages.title')}>
      <div className="admin-messages-hero">
        <div>
          <span className="admin-messages-hero__eyebrow">{t('adminMessages.eyebrow')}</span>
          <h2>{t('adminMessages.heading')}</h2>

        </div>
        <div className="admin-messages-hero__meta">
          <strong>{total}</strong>
          <span>{t('adminMessages.totalLabel')}</span>
        </div>
      </div>

      <div className="admin-messages-toolbar">
        <Link to="/admin/users" className="admin-messages-link-button">
          {t('adminMessages.usersLink')}
        </Link>
        <Select
          label={t('adminMessages.pageSize')}
          value={String(pageSize)}
          onChange={(value) => {
            setPage(1);
            setPageSize(Number(value));
          }}
          options={PAGE_SIZE_OPTIONS}
        />
      </div>

      {error ? <EmptyState title={t('adminMessages.loadTitle')} description={error} /> : null}
      {!error && !isLoading && messages.length === 0 ? <EmptyState title={t('adminMessages.emptyTitle')} description='' /> : null}

      <div className="admin-messages-list">
        {messages.map((message) => {
          const bodyLines = formatMessageBody(message.body);
          const kazakhBodyLines = formatKazakhMessageBody(message.body);

          return (
          <article key={message.id} className="admin-message-card">
            <div className="admin-message-card__header">
              <div>
                <h3>{message.subject}</h3>
                <p>
                  {message.recipientName} · {message.recipientEmail}
                </p>
              </div>
              <Badge tone={message.meetingId ? 'info' : 'neutral'}>{message.meetingId ? t('adminMessages.meetingBadge') : t('adminMessages.generalBadge')}</Badge>
            </div>
            {bodyLines.length > 0 ? (
              <div className="admin-message-card__body">
                <div className="admin-message-card__body-column">
                  <span className="admin-message-card__body-label">{t('adminMessages.russianColumn')}</span>
                  {bodyLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                {kazakhBodyLines.length > 0 ? (
                  <div className="admin-message-card__body-column">
                    <span className="admin-message-card__body-label">{t('adminMessages.kazakhColumn')}</span>
                    {kazakhBodyLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="admin-message-card__meta">
              <span>
                {formatDate(message.sentAt)} · {formatTime(message.sentAt)}
              </span>
              {message.meetingId ? <Link to={`/sessions/${message.meetingId}`}>{t('adminMessages.openMeeting')}</Link> : null}
            </div>
          </article>
          );
        })}
      </div>

      {!error ? (
        <div className="admin-messages-pagination">
          <Button variant="secondary" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
            {t('adminMessages.previous')}
          </Button>
          <div className="admin-messages-pagination__status">
            <strong>{page}</strong>
            <span>{t('adminMessages.of', { total: totalPages })}</span>
          </div>
          <Button variant="secondary" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading}>
            {t('adminMessages.next')}
          </Button>
        </div>
      ) : null}
    </PageSection>
  );
}
