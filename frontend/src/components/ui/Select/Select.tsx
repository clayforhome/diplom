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
  return (
    <label className="select-field">
      <span className="select-field__label">{label}</span>
      <span className="select-field__control-wrap">
        <select className="select-field__control" value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="select-field__icon" aria-hidden="true">
          <svg viewBox="0 0 16 16" focusable="false">
            <path d="M4.25 6.25 8 10l3.75-3.75" />
          </svg>
        </span>
      </span>
    </label>
  );
}
