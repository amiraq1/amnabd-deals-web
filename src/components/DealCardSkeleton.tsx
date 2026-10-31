export default function DealCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex min-h-offer min-w-0 flex-col rounded-card border border-line bg-surface-raised p-5"
    >
      <div className="flex min-h-[6.5rem] gap-3">
        <div className="skeleton h-12 w-12 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-6" />
          <div className="skeleton h-5 w-2/3" />
        </div>
      </div>
      <div className="mt-4 space-y-3 border-t border-line-subtle pt-4">
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-[4.5rem]" />
        <div className="skeleton h-[4.5rem]" />
        <div className="skeleton h-6 w-2/3" />
      </div>
      <div className="mt-4 space-y-3 border-t border-line-subtle pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-7" />
        ))}
      </div>
      <div className="mt-auto pt-5">
        <div className="skeleton h-20" />
      </div>
      <div className="mt-4 flex gap-2 border-t border-line-subtle pt-4">
        <div className="skeleton h-11 flex-1" />
        <div className="skeleton h-11 w-11" />
      </div>
      <div className="mt-2 flex justify-between gap-2">
        <div className="skeleton h-11 w-1/2" />
        <div className="skeleton h-11 w-1/3" />
      </div>
    </div>
  );
}
