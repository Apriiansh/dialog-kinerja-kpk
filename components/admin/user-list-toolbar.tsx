"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { Select } from "@/components/ui/select";

interface UserListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function UserListToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}: UserListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon
            size={14}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama, NPP, jabatan..."
            className="h-9 w-full rounded-md border border-outline bg-surface pl-8 pr-8 text-xs text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-muted/70 focus:border-primary focus:shadow-focus sm:w-64"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              <XIcon size={12} weight="bold" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <Select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="h-9 w-auto min-w-[120px] text-xs"
        >
          <option value="all">Semua Peran</option>
          <option value="admin">Admin</option>
          <option value="atasan">Atasan</option>
          <option value="pegawai">Pegawai</option>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-9 w-auto min-w-[120px] text-xs"
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </Select>
      </div>
  );
}
