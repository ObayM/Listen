export default function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="card p-5 sm:p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-4 font-mono text-4xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
    </article>
  );
}
