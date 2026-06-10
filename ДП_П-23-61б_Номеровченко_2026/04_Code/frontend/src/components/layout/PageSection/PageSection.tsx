import type { PropsWithChildren, ReactNode } from 'react';
import './PageSection.scss';

interface PageSectionProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageSection({ title, subtitle, actions, children }: PageSectionProps) {
  return (
    <section className="page-section">
      <div className="page-section__header">
        <div>
          <h1 className="page-section__title">{title}</h1>
          {subtitle ? <p className="page-section__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-section__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
