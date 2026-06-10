import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrganizerUser } from '../../../types';
import './ParticipantsDropdown.scss';

interface ParticipantsDropdownProps {
  label: string;
  users: OrganizerUser[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

function getUserLabel(user: OrganizerUser): string {
  const name = user.name.trim();
  const email = user.email.trim();

  if (name && email) {
    return `${name} (${email})`;
  }

  return name || email || user.id;
}

export function ParticipantsDropdown({ label, users, value, onChange, disabled = false }: ParticipantsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const selectedUsers = useMemo(() => users.filter((user) => value.includes(user.id)), [users, value]);

  const toggleUser = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
      return;
    }

    onChange([...value, userId]);
  };

  const summary = selectedUsers.length > 0 ? t('common.selectedCount', { count: selectedUsers.length }) : t('meeting.chooseParticipants');

  return (
    <div ref={rootRef} className={`participants-dropdown${isOpen ? ' participants-dropdown--open' : ''}`}>
      <span className="participants-dropdown__label">{label}</span>
      <button
        type="button"
        className="participants-dropdown__trigger"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span>{summary}</span>
        <span className={`participants-dropdown__chevron${isOpen ? ' participants-dropdown__chevron--open' : ''}`} aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path d="M4.25 6.25 8 10l3.75-3.75" />
          </svg>
        </span>
      </button>
      {selectedUsers.length > 0 ? (
        <div className="participants-dropdown__chips">
          {selectedUsers.map((user) => (
            <button key={user.id} type="button" className="participants-dropdown__chip" onClick={() => toggleUser(user.id)} disabled={disabled}>
              <span>{getUserLabel(user)}</span>
              <span aria-hidden="true">x</span>
            </button>
          ))}
        </div>
      ) : null}
      {isOpen ? (
        <div className="participants-dropdown__panel">
          {users.length > 0 ? (
            users.map((user) => {
              const checked = value.includes(user.id);

              return (
                <label key={user.id} className="participants-dropdown__option">
                  <input type="checkbox" checked={checked} onChange={() => toggleUser(user.id)} disabled={disabled} />
                  <span>{getUserLabel(user)}</span>
                </label>
              );
            })
          ) : (
            <p className="participants-dropdown__empty">{t('meeting.emptyUsers')}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
