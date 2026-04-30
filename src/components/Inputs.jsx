import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export function Field({ label, children, error, testId }) {
  return (
    <label className="field-shell" data-testid={testId}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="mt-1 text-xs font-semibold text-rose-600">{error}</span> : null}
    </label>
  );
}

export function TextInput(props) {
  return <input {...props} className={`input-control ${props.className || ''}`} />;
}

export function MultiSelect({ label, options, selected, onChange, placeholder, testId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(query.toLowerCase())),
    [options, query]
  );

  function toggle(option) {
    const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    onChange(next);
  }

  return (
    <div className="field-shell" data-testid={testId}>
      <span className="field-label">{label}</span>
      <button
        type="button"
        className="input-control flex items-center justify-between gap-3 text-left"
        onClick={() => setOpen((value) => !value)}
        data-testid={`${testId}-button`}
      >
        <span className={selected.length ? 'text-slate-900' : 'text-slate-400'}>
          {selected.length ? selected.join(', ') : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {selected.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span key={item} className="tag tag-teal" data-testid={`${testId}-chip-${item}`}>
              {item}
              <button type="button" onClick={() => toggle(item)} title={`Remove ${item}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="floating-menu animate-fade-up" data-testid={`${testId}-menu`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input-control h-10 pl-9"
              placeholder="Search"
              data-testid={`${testId}-search`}
            />
          </div>
          <div className="mt-2 max-h-52 overflow-auto pr-1">
            {filtered.map((option) => {
              const checked = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(option)}
                  className={`menu-option ${checked ? 'menu-option-active' : ''}`}
                  data-testid={`${testId}-option-${option}`}
                >
                  <span>{option}</span>
                  {checked ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SearchSelect({ label, options, value, onChange, placeholder, testId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = options.filter((option) => option.toLowerCase().includes(query.toLowerCase()));

  function pick(option) {
    onChange(option);
    setQuery('');
    setOpen(false);
  }

  return (
    <div className="field-shell" data-testid={testId}>
      <span className="field-label">{label}</span>
      <button
        type="button"
        className="input-control flex items-center justify-between gap-3"
        onClick={() => setOpen((next) => !next)}
        data-testid={`${testId}-button`}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <div className="floating-menu animate-fade-up" data-testid={`${testId}-menu`}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="input-control h-10"
            placeholder="Search"
            data-testid={`${testId}-search`}
          />
          <div className="mt-2 grid max-h-48 gap-1 overflow-auto">
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                className="menu-option"
                onClick={() => pick(option)}
                data-testid={`${testId}-option-${option}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
