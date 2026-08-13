export default function DialogLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-busy="true">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-40 rounded bg-surface-soft" />
        <div className="h-8 w-72 rounded bg-surface-soft" />
        <div className="h-4 w-56 rounded bg-surface-soft" />
      </div>
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-lg bg-surface-soft" />
        ))}
      </div>
    </div>
  );
}