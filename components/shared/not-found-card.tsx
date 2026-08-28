import Link from "next/link";
import { ArrowLeft, ShieldWarning } from "@phosphor-icons/react/dist/ssr";

export function NotFoundCard({
  title,
  description,
  backHref,
  backLabel = "Kembali",
  className,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className="flex w-full justify-center">
      <div
        className={`relative w-full max-w-xl overflow-hidden rounded-xl border border-outline bg-surface px-6 py-14 text-center ${className ?? ""}`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 dot-grid opacity-60"
        />

        <div className="relative flex flex-col items-center gap-1">
          <span className="font-heading text-5xl font-bold tracking-tighter text-primary-strong/15">
            404
          </span>

          <div className="-mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-strong">
            <ShieldWarning size={24} weight="bold" />
          </div>

          <h1 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h1>

          <p className="mt-1 max-w-sm text-sm leading-5 text-ink-muted">
            {description}
          </p>

          <div className="mt-6">
            <Link
              href={backHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
            >
              <ArrowLeft size={16} weight="bold" />
              {backLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}