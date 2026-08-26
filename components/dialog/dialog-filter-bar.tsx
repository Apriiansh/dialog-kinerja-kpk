"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import Link from "next/link";

interface DialogFilterBarProps {
  q: string;
  tahun: string;
  triwulan: string;
  availableYears: number[];
  resetHref: string;
}

export function DialogFilterBar({
  q,
  tahun,
  triwulan,
  availableYears,
  resetHref,
}: DialogFilterBarProps) {
  const hasActiveFilter = Boolean(q || tahun || triwulan);

  return (
    <form
      method="GET"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="relative min-w-0 flex-1">
        <MagnifyingGlassIcon
          size={16}
          weight="bold"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cari pegawai/NPP..."
          className="h-10 w-full rounded-lg border border-outline bg-surface pl-9 pr-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
      <select
        name="tahun"
        defaultValue={tahun}
        className="h-10 w-27.5 shrink-0 rounded-lg border border-outline bg-surface px-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
      >
        <option value="">Semua Tahun</option>
        {availableYears.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        name="triwulan"
        defaultValue={triwulan}
        className="h-10 w-32.5 shrink-0 rounded-lg border border-outline bg-surface px-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-focus"
      >
        <option value="">Semua Periode</option>
        <option value="TW1">TW I</option>
        <option value="TW3">TW III</option>
      </select>

      <button
        type="submit"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
      >
        Terapkan
      </button>

      {hasActiveFilter ? (
        <Link
          href={resetHref}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-outline px-3 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          Reset
        </Link>
      ) : null}
      </div>
    </form>
  );
}
