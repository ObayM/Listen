type Option<T extends string> = { value: T; label: string };

export default function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  variant = "tabs",
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  variant?: "tabs" | "chips";
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-2">
        {label}
      </legend>
      <div className={variant === "tabs" ? "flex gap-5 border-b border-[var(--line)]" : "flex flex-wrap gap-2"}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`${variant === "tabs"
              ? `-mb-px min-h-9 border-b-2 px-1 py-1.5 text-sm ${value === option.value
                ? "border-[var(--accent-dark)] text-[var(--ink)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"}`
              : `min-h-8 rounded-full border px-3 py-1 text-xs ${value === option.value
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"}`
            } font-semibold whitespace-nowrap transition-colors`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
