import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateVariant =
  | "dialog"
  | "bell"
  | "calendar"
  | "search"
  | "document";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
};

const STROKE = {
  stroke: "#0891b2",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function DialogArt() {
  return (
    <>
      <path
        d="M14 20c0-3.3 2.7-6 6-6h24c3.3 0 6 2.7 6 6v14c0 3.3-2.7 6-6 6H28l-8 7v-7h0c-3.3 0-6-2.7-6-6V20Z"
        fill="#cffafe"
        {...STROKE}
      />
      <line x1="22" y1="25" x2="42" y2="25" {...STROKE} />
      <line x1="22" y1="32" x2="36" y2="32" {...STROKE} />
      <circle cx="47" cy="18" r="5" fill="#DB1514" stroke="none" />
    </>
  );
}

function BellArt() {
  return (
    <>
      <path
        d="M32 12a13 13 0 0 1 13 13v7l4 7H15l4-7v-7a13 13 0 0 1 13-13Z"
        fill="#cffafe"
        {...STROKE}
      />
      <path d="M27 43a5 5 0 0 0 10 0" fill="none" {...STROKE} />
      <circle cx="45" cy="16" r="5" fill="#DB1514" stroke="none" />
    </>
  );
}

function CalendarArt() {
  return (
    <>
      <rect
        x="12"
        y="17"
        width="40"
        height="34"
        rx="5"
        fill="#cffafe"
        {...STROKE}
      />
      <line x1="12" y1="27" x2="52" y2="27" {...STROKE} />
      <line x1="23" y1="13" x2="23" y2="21" {...STROKE} />
      <line x1="41" y1="13" x2="41" y2="21" {...STROKE} />
      <circle cx="24" cy="35" r="2.5" fill="#0891b2" stroke="none" />
      <circle cx="33" cy="35" r="2.5" fill="#DB1514" stroke="none" />
      <circle cx="42" cy="35" r="2.5" fill="#0891b2" stroke="none" />
      <circle cx="24" cy="43" r="2.5" fill="#0891b2" stroke="none" />
    </>
  );
}

function SearchArt() {
  return (
    <>
      <circle cx="29" cy="29" r="14" fill="#cffafe" {...STROKE} />
      <line x1="39" y1="39" x2="50" y2="50" {...STROKE} />
      <line x1="23" y1="29" x2="35" y2="29" {...STROKE} opacity={0.55} />
      <circle cx="46" cy="18" r="4" fill="#DB1514" stroke="none" />
    </>
  );
}

function DocumentArt() {
  return (
    <>
      <path
        d="M18 10h20l10 10v30a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4Z"
        fill="#cffafe"
        {...STROKE}
      />
      <path d="M38 10v10h10" fill="none" {...STROKE} />
      <line x1="22" y1="30" x2="42" y2="30" {...STROKE} />
      <line x1="22" y1="37" x2="38" y2="37" {...STROKE} />
      <circle cx="44" cy="44" r="5" fill="#DB1514" stroke="none" />
    </>
  );
}

const ART: Record<EmptyStateVariant, () => ReactNode> = {
  dialog: DialogArt,
  bell: BellArt,
  calendar: CalendarArt,
  search: SearchArt,
  document: DocumentArt,
};

export function EmptyState({
  title,
  description,
  action,
  variant = "dialog",
  className,
}: EmptyStateProps) {
  const Art = ART[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-lg border border-outline bg-surface px-6 py-12 text-center",
        className
      )}
    >
      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -m-4 rounded-full bg-primary-faint/60 blur-lg"
        />
        <svg
          viewBox="0 0 64 64"
          width={72}
          height={72}
          aria-hidden
          className="relative"
        >
          <Art />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
