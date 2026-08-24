import Link from "next/link";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  icon: ElementType;
  tone?: "cyan" | "red";
  href?: string;
  chipClassName?: string;
  ariaLabel?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "cyan",
  href,
  chipClassName,
  ariaLabel,
}: StatCardProps) {
  const isCyan = tone === "cyan";

  const inner = (
    <>
      <div
        className={cn(
          "relative flex h-full flex-col gap-3 overflow-hidden rounded-[calc(1rem-1px)] bg-surface p-5",
          href && "transition-colors group-hover:bg-surface-muted/40"
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition-opacity duration-300",
            isCyan ? "bg-primary/10" : "bg-[#DB1514]/10"
          )}
        />
        <div className="relative flex items-start justify-between gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-105",
              chipClassName ??
                (isCyan
                  ? "bg-gradient-to-br from-primary to-primary-strong"
                  : "bg-gradient-to-br from-[#DB1514] to-[#9E0F10]")
            )}
          >
            <Icon size={19} weight="bold" />
          </span>
          <span className="text-3xl font-semibold leading-9 tracking-tight text-ink tabular-nums">
            {value}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-ink">{label}</span>
          {hint && <span className="text-xs leading-4 text-ink-muted">{hint}</span>}
        </div>
      </div>
    </>
  );

  const outer = cn(
    "group block rounded-2xl bg-gradient-to-br p-px shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-ambient focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    isCyan
      ? "from-primary/45 via-outline/30 to-primary/10"
      : "from-[#DB1514]/35 via-outline/30 to-[#DB1514]/10"
  );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel ?? label} className={outer}>
        {inner}
      </Link>
    );
  }

  return <div className={outer}>{inner}</div>;
}
