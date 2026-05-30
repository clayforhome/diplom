import i18n from '../i18n';

const kazakhMonths = [
  'қаңтар',
  'ақпан',
  'наурыз',
  'сәуір',
  'мамыр',
  'маусым',
  'шілде',
  'тамыз',
  'қыркүйек',
  'қазан',
  'қараша',
  'желтоқсан'
] as const;

function getLocale() {
  return i18n.resolvedLanguage === 'kk' ? 'kk-KZ' : 'ru-RU';
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDate(value: string): string {
  const date = new Date(value);

  if (i18n.resolvedLanguage === 'kk') {
    return `${pad(date.getDate())} ${kazakhMonths[date.getMonth()]} ${date.getFullYear()}`;
  }

  return new Intl.DateTimeFormat(getLocale(), {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatTime(value: string): string {
  return new Intl.DateTimeFormat(getLocale(), {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function formatDateTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function toDateTimeString(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}
