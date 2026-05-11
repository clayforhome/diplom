import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './Select.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

export function Select({ label, value, onChange, options }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));
  const rootRef = useRef<HTMLLabelElement | null>(null);
  const listboxId = useId();
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0] ?? null,
    [options, value]
  );

  useEffect(() => {
    setHighlightedIndex(Math.max(0, options.findIndex((option) => option.value === value)));
  }, [options, value]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const moveHighlight = (nextIndex: number) => {
    if (options.length === 0) {
      return;
    }

    const normalizedIndex = (nextIndex + options.length) % options.length;
    setHighlightedIndex(normalizedIndex);
  };

  const commitSelection = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <label className="select-field" ref={rootRef}>
      <span className="select-field__label">{label}</span>
      <span className={`select-field__control-wrap${isOpen ? ' select-field__control-wrap--open' : ''}`}>
        <button
          type="button"
          className="select-field__control"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          onClick={() => {
            if (options.length === 0) {
              return;
            }

            setIsOpen((current) => !current);
          }}
          onKeyDown={(event) => {
            if (options.length === 0) {
              return;
            }

            switch (event.key) {
              case 'ArrowDown':
                event.preventDefault();
                if (!isOpen) {
                  setIsOpen(true);
                }
                moveHighlight(highlightedIndex + 1);
                break;
              case 'ArrowUp':
                event.preventDefault();
                if (!isOpen) {
                  setIsOpen(true);
                }
                moveHighlight(highlightedIndex - 1);
                break;
              case 'Enter':
              case ' ':
                event.preventDefault();
                if (isOpen) {
                  const option = options[highlightedIndex];
                  if (option) {
                    commitSelection(option.value);
                  }
                } else {
                  setIsOpen(true);
                }
                break;
              case 'Escape':
                if (isOpen) {
                  event.preventDefault();
                  setIsOpen(false);
                }
                break;
              default:
                break;
            }
          }}
        >
          <span className="select-field__value">{selectedOption?.label ?? 'Не выбрано'}</span>
          <span className="select-field__icon" aria-hidden="true">
            <svg viewBox="0 0 16 16" focusable="false">
              <path d="M4.25 6.25 8 10l3.75-3.75" />
            </svg>
          </span>
        </button>

        {isOpen ? (
          <span className="select-field__menu" role="listbox" id={listboxId} aria-label={label}>
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`select-field__option${isSelected ? ' select-field__option--selected' : ''}${isHighlighted ? ' select-field__option--highlighted' : ''}`}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => commitSelection(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected ? (
                    <span className="select-field__check" aria-hidden="true">
                      <svg viewBox="0 0 16 16" focusable="false">
                        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
                      </svg>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </span>
        ) : null}
      </span>
    </label>
  );
}
