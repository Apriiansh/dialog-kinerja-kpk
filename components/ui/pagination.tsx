import Link from "next/link";
import {
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";

export const PAGE_SIZE = 8;

export function Pagination({
  page,
  totalPages,
  totalItems,
  basePath,
  existingParams,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  basePath: string;
  existingParams?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    const sp = new URLSearchParams(existingParams);
    if (p > 1) {
      sp.set("page", String(p));
    } else {
      sp.delete("page");
    }
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-ink-muted">
        Halaman {page} dari {totalPages} ({totalItems} data)
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={href(page - 1)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : 0}
          className={`inline-flex h-8 items-center gap-1 rounded-md border border-outline px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          <CaretLeftIcon size={12} weight="bold" />
        </Link>
        <Link
          href={href(page + 1)}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : 0}
          className={`inline-flex h-8 items-center gap-1 rounded-md border border-outline px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
        >
          <CaretRightIcon size={12} weight="bold" />
        </Link>
      </div>
    </div>
  );
}
