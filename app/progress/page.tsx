import ProgressOverview from "@/components/ProgressOverview";

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">Progress</h1>
      </header>
      <ProgressOverview />
    </div>
  );
}
