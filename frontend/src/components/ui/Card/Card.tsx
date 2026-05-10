import type { PropsWithChildren } from 'react';
import './Card.scss';

export function Card({ children }: PropsWithChildren) {
  return <section className="card">{children}</section>;
}
