import './Badge.scss';

interface BadgeProps {
  children: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
