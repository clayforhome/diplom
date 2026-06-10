import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import './Button.scss';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
}

export function Button({ children, variant = 'primary', fullWidth = false, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${fullWidth ? 'button--full-width' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
