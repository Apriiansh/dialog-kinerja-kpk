"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CaretRightIcon,
  CaretDownIcon,
  FolderIcon,
  FolderOpenIcon,
  BuildingsIcon,
} from "@phosphor-icons/react";
import { AdminUnitStatusToggle } from "@/components/admin/unit-status-toggle";
import { AdminUnitDeleteButton } from "@/components/admin/unit-delete-button";
import { PencilSimpleIcon } from "@phosphor-icons/react";

export type UnitRow = {
  id: number;
  nama_unit: string;
  jenis: string | null;
  kepala_jabatan: string | null;
  level: number;
  is_active: boolean;
  parent_id: number | null;
  childCount: number;
  userCount: number;
};

function JenisLabel({ jenis }: { jenis: string | null }) {
  if (!jenis) return null;
  const map: Record<string, string> = {
    pimpinan: "Pimpinan",
    inspektorat: "Inspektorat",
    sekretariat: "Sekretariat",
    sekretariat_jenderal: "Sekretariat Jenderal",
    sekretariat_deputi: "Sekretariat",
    biro: "Biro",
    direktorat: "Direktorat",
    bagian: "Bagian",
    pusat: "Pusat",
    staf: "Staf Khusus",
    kelompok_jf: "JF",
  };
  return (
    <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      {map[jenis] ?? jenis}
    </span>
  );
}

function UnitRowView({
  unit,
  depth,
  isExpanded,
  hasChildren,
  onToggle,
}: {
  unit: UnitRow;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative group">
      <div
        className={`flex items-center gap-2 rounded-lg py-2 pr-3 transition-colors ${
          unit.is_active
            ? "hover:bg-surface-muted/70"
            : "opacity-50 hover:bg-surface-muted/40"
        }`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={!hasChildren}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={
            hasChildren
              ? `${isExpanded ? "Ciutkan" : "Perluas"} ${unit.nama_unit}`
              : undefined
          }
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
            hasChildren
              ? "text-ink-muted hover:bg-surface-muted hover:text-ink"
              : "cursor-default text-ink-muted/30"
          }`}
        >
          {hasChildren ? (
            isExpanded ? (
              <CaretDownIcon size={14} weight="bold" />
            ) : (
              <CaretRightIcon size={14} weight="bold" />
            )
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-ink-muted/30" />
          )}
        </button>

        {unit.is_active ? (
          isExpanded && hasChildren ? (
            <FolderOpenIcon
              size={17}
              weight="fill"
              className="shrink-0 text-primary/70"
            />
          ) : (
            <FolderIcon
              size={17}
              weight="fill"
              className="shrink-0 text-primary/60"
            />
          )
        ) : (
          <BuildingsIcon size={17} weight="fill" className="shrink-0 text-ink-muted/40" />
        )}

        <span
          className={`truncate text-sm font-medium ${
            unit.is_active ? "text-ink" : "text-ink-muted/60"
          }`}
        >
          {unit.nama_unit}
        </span>

        <JenisLabel jenis={unit.jenis} />

        {/*{unit.kepala_jabatan ? (
          <span className="hidden truncate text-xs text-ink-muted lg:inline">
            · {unit.kepala_jabatan}
          </span>
        ) : null}*/}

        {hasChildren ? (
          <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-bold text-ink-muted">
            {unit.childCount}
          </span>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-2 opacity-60 transition-opacity group-hover:opacity-100">
          <span className="whitespace-nowrap text-xs text-ink-muted">
            {unit.userCount} user
          </span>
          <AdminUnitStatusToggle
            id={unit.id}
            nama={unit.nama_unit}
            isActive={unit.is_active}
          />
          <Link
            href={`/admin/struktur-organisasi/${unit.id}/edit`}
            title="Edit unit"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-outline text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <PencilSimpleIcon size={13} weight="bold" />
          </Link>
          <AdminUnitDeleteButton
            id={unit.id}
            nama={unit.nama_unit}
            userCount={unit.userCount}
            childCount={unit.childCount}
          />
        </div>
      </div>
    </div>
  );
}

export function AdminUnitTree({ units }: { units: UnitRow[] }) {
  const byParent = new Map<number | null, UnitRow[]>();
  for (const u of units) {
    const key = u.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(u);
  }

  const allIds = new Set(units.map((u) => u.id));
  const defaultExpanded = new Set<number>();
  for (const u of units) {
    if (u.level === 1 && (byParent.get(u.id)?.length ?? 0) > 0) {
      defaultExpanded.add(u.id);
    }
  }

  const [expanded, setExpanded] = useState<Set<number>>(defaultExpanded);
  const [expandedAll, setExpandedAll] = useState(false);

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const all = new Set(allIds);
    if (expandedAll) {
      setExpanded(defaultExpanded);
      setExpandedAll(false);
    } else {
      setExpanded(all);
      setExpandedAll(true);
    }
  }

  const totalDirectChildren = units.filter((u) => u.parent_id !== null).length;

  function renderSubtree(parentId: number | null, depth: number): React.ReactNode {
    const rows = byParent.get(parentId) ?? [];
    if (rows.length === 0) return null;
    return rows.map((u, i) => {
      const childRows = byParent.get(u.id) ?? [];
      const hasChildren = childRows.length > 0;
      const isExpanded = expanded.has(u.id);
      const isLast = i === rows.length - 1;
      return (
        <div key={u.id}>
          <UnitRowView
            unit={u}
            depth={depth}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            onToggle={() => toggle(u.id)}
          />
          {hasChildren && isExpanded ? (
            <div
              className={
                depth > 0 && !isLast
                  ? "border-l border-outline/50 ml-5.75"
                  : undefined
              }
            >
              {renderSubtree(u.id, depth + 1)}
            </div>
          ) : null}
        </div>
      );
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-outline bg-surface">
      <div className="flex items-center justify-between border-b border-outline/70 px-4 py-2.5">
        <p className="text-sm font-medium text-ink-muted">
          {units.length} unit · {totalDirectChildren} relasi induk
        </p>
        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
        >
          {expandedAll ? "Ciutkan Semua" : "Perluas Semua"}
        </button>
      </div>
      <div className="p-2">{renderSubtree(null, 0)}</div>
    </div>
  );
}
