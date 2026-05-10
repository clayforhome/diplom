import type { TextareaHTMLAttributes } from 'react';
import './Textarea.scss';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <label className="textarea-field">
      <span className="textarea-field__label">{label}</span>
      <textarea className={`textarea-field__control ${className}`.trim()} {...props} />
    </label>
  );
}
