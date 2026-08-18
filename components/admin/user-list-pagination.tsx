"use client";

import {
  CaretLeftIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";

interface UserListPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function UserListPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: UserListPaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-ink-muted">
        Halaman {page} dari {totalPages} ({totalItems} data)
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-outline px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CaretLeftIcon size={12} weight="bold" />
          
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-outline px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          
          <CaretRightIcon size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}
