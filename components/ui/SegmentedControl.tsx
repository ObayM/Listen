type Option<T extends string> = { value: T; label: string };

export default function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-2">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface-muted)] p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-9 flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors ${
              value === option.value
                ? "bg-[var(--surface)] text-[var(--accent-dark)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
