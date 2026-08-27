'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  label,
  error,
  hint,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  id,
  ...props
}: PasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <label className="form-field" htmlFor={inputId}>
      <span>{label}</span>
      <div className="password-field">
        <input {...props} id={inputId} type={visible ? 'text' : 'password'} />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
      {hint}
      {error ? <span className="form-error">{error}</span> : null}
    </label>
  );
}
