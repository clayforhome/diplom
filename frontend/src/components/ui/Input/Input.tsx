import type { InputHTMLAttributes } from 'react';
import './Input.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <label className="input-field">
      <span className="input-field__label">{label}</span>
      <input className={`input-field__control ${className}`.trim()} {...props} />
      {error ? <span className="input-field__error">{error}</span> : null}
    </label>
  );
}
