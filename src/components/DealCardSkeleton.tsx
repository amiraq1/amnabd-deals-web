export default function DealCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full min-w-0 flex-col rounded-card border border-line-card bg-surface-card shadow-card p-5"
    >
      {/* Header: Monogram + Title */}
      <div className="flex items-start gap-3">
        <div className="skeleton h-11 w-11 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-3/4 rounded-md" />
          <div className="skeleton h-4 w-1/3 rounded-md" />
        </div>
      </div>

      {/* Core Benefit & Description */}
      <div className="my-4 space-y-2">
        <div className="skeleton h-3 w-1/4 rounded" />
        <div className="skeleton h-6 w-4/5 rounded-md" />
        <div className="skeleton h-4 w-full rounded" />
      </div>

      {/* Structured Facts Grid */}
      <div className="border-t border-line-subtle pt-3.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="skeleton h-7 rounded-md" />
          <div className="skeleton h-7 rounded-md" />
          <div className="skeleton h-7 rounded-md" />
          <div className="skeleton h-7 rounded-md" />
        </div>
      </div>

      {/* Evidence Badge */}
      <div className="mt-auto pt-3">
        <div className="skeleton h-12 w-full rounded-lg" />
      </div>

      {/* Action Footer */}
      <div className="mt-3 border-t border-line-subtle pt-3">
        <div className="flex gap-2">
          <div className="skeleton h-11 flex-1 rounded-control" />
          <div className="skeleton h-11 w-11 rounded-control" />
        </div>
      </div>
    </div>
  );
}
