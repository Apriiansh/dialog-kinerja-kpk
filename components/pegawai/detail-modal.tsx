"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CaretRightIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { RoleTag } from "@/components/shared/role-tag";
import { error as showError, success as showSuccess } from "@/components/ui/toast";

export interface PegawaiDetail {
  id: number;
  npp: string;
  nip: string | null;
  nama_pegawai: string;
  tanggal_bergabung: string | null;
  nama_jabatan: string | null;
  unit_kerja: string | null;
  masa_kerja_unit_terakhir: string | null;
  is_admin: boolean;
  as_pegawai: boolean;
  is_active: boolean;
  atasan: string | null;
  bawahan: number;
  editHref: string;
  bawahanList: PegawaiDetail[];
}

export function PegawaiDetailModal({
  user,
  isSelf = false,
  onToggleStatus,
  onDelete,
  children,
}: {
  user: PegawaiDetail;
  isSelf?: boolean;
  onToggleStatus?: {
    activate: () => Promise<{ error?: string } | undefined>;
    deactivate: () => Promise<{ error?: string } | undefined>;
    deactivateConfirm: string;
    successMessage: string;
    errorMessage: string;
  };
  onDelete?: {
    action: () => Promise<{ error?: string } | undefined>;
    confirmMessage: string;
    successMessage: string;
    errorMessage: string;
  };
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<PegawaiDetail[]>([]);
  const [pending, setPending] = useState(false);

  const rootUser = stack[0];

  function openRoot() {
    setStack([user]);
    setOpen(true);
  }

  function openSubordinate(sub: PegawaiDetail) {
    setStack((s) => [...s, sub]);
  }

  function closeTop() {
    setStack((s) => {
      if (s.length <= 1) {
        setOpen(false);
        return [];
      }
      return s.slice(0, -1);
    });
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTop();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function updateRootIsActive(next: boolean) {
    setStack((s) => [{ ...s[0], is_active: next }, ...s.slice(1)]);
  }

  async function handleToggle() {
    if (!onToggleStatus || pending || !rootUser) return;
    const next = !rootUser.is_active;
    if (rootUser.is_active && !confirm(onToggleStatus.deactivateConfirm)) {
      return;
    }
    setPending(true);
    try {
      const result = next
        ? await onToggleStatus.activate()
        : await onToggleStatus.deactivate();
      if (result?.error) {
        showError(result.error);
        return;
      }
      showSuccess(onToggleStatus.successMessage);
      updateRootIsActive(next);
      router.refresh();
    } catch (err) {
      console.error(err);
      showError(onToggleStatus.errorMessage);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (pending || !onDelete || !rootUser) return;
    if (!confirm(onDelete.confirmMessage)) return;
    setPending(true);
    try {
      const result = await onDelete.action();
      if (result?.error) {
        showError(result.error);
        return;
      }
      showSuccess(onDelete.successMessage);
      setOpen(false);
      setStack([]);
      router.refresh();
    } catch (err) {
      console.error(err);
      showError(onDelete.errorMessage);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openRoot}
        aria-haspopup="dialog"
        className={`truncate text-left text-sm font-semibold transition-colors hover:text-primary ${
          user.is_active ? "text-ink" : "text-ink-muted/60"
        }`}
      >
        {children}
      </button>

      {open
        ? stack.map((u, i) => {
            const isRoot = i === 0;
            const showControls = isRoot && !isSelf;
            const hasSubordinates = u.bawahanList.length > 0;
            return (
              <div
                key={`${i}-${u.id}`}
                role="dialog"
                aria-modal="true"
                aria-label={`Detail ${u.nama_pegawai}`}
                className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
                onClick={closeTop}
              >
                <div
                  className={`flex max-h-[85vh] w-full ${hasSubordinates ? "max-w-2xl" : "max-w-lg"} flex-col rounded-lg bg-surface shadow-ambient`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-outline px-6 py-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
                        {u.is_admin ? (
                          <ShieldCheckIcon size={24} weight="fill" />
                        ) : (
                          <UserCircleIcon size={24} weight="fill" />
                        )}
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <h2 className="truncate text-base font-semibold text-ink">
                          {u.nama_pegawai}
                        </h2>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-ink-muted">
                            NPP {u.npp}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold leading-4 ${
                              u.is_active
                                ? "bg-status-green-soft text-status-green"
                                : "bg-error-container text-error"
                            }`}
                          >
                            {u.is_active ? "AKTIF" : "NONAKTIF"}
                          </span>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeTop}
                      aria-label="Tutup"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                    >
                      <XIcon size={16} weight="bold" />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                      <DetailItem label="NIP" value={u.nip || "—"} />
                      <DetailItem
                        label="Jabatan"
                        value={u.nama_jabatan || "—"}
                      />
                      <DetailItem
                        label="Unit Kerja"
                        value={u.unit_kerja || "—"}
                      />
                      <DetailItem
                        label="Tanggal Bergabung"
                        value={u.tanggal_bergabung || "—"}
                      />
                      <DetailItem
                        label="Masa Kerja Unit Terakhir"
                        value={u.masa_kerja_unit_terakhir || "—"}
                      />
                      <DetailItem label="Atasan" value={u.atasan || "—"} />
                      <DetailItem label="Bawahan" value={String(u.bawahan)} />
                      {showControls && onToggleStatus ? (
                        <div className="flex flex-col gap-1">
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                            Status
                          </dt>
                          <dd className="flex items-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={u.is_active}
                              onClick={handleToggle}
                              disabled={pending}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-none transition-colors duration-200 focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 ${
                                u.is_active
                                  ? "bg-status-green"
                                  : "bg-ink-muted/30"
                              }`}
                            >
                              <span
                                className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                  u.is_active
                                    ? "translate-x-[22px]"
                                    : "translate-x-[2px]"
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-bold ${
                                u.is_active ? "text-status-green" : "text-error"
                              }`}
                            >
                              {u.is_active ? "AKTIF" : "NONAKTIF"}
                            </span>
                          </dd>
                        </div>
                      ) : (
                        <DetailItem
                          label="Status"
                          value={u.is_active ? "Aktif" : "Nonaktif"}
                        />
                      )}
                    </dl>

                    <div className="mt-5 flex flex-col gap-1.5 border-t border-outline pt-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                        Peran
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {u.is_admin ? <RoleTag role="ADMIN" /> : null}
                        {u.as_pegawai ? <RoleTag role="PEGAWAI" /> : null}
                        {u.bawahan > 0 ? <RoleTag role="ATASAN" /> : null}
                        {!u.is_admin && !u.as_pegawai && u.bawahan === 0 ? (
                          <span className="text-sm text-ink-muted">—</span>
                        ) : null}
                      </div>
                    </div>

                    {hasSubordinates ? (
                      <div className="mt-5 flex flex-col gap-2 border-t border-outline pt-4">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                          Bawahan ({u.bawahanList.length})
                        </span>
                        <table className="w-full text-left">
                          <thead className="border-b border-outline">
                            <tr className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
                              <th className="py-2 pr-3">Nama</th>
                              <th className="py-2 pr-3">NPP</th>
                              <th className="py-2 pr-3">Jabatan / Unit</th>
                              <th className="py-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline">
                            {u.bawahanList.map((b) => (
                              <tr
                                key={b.id}
                                className="transition-colors hover:bg-surface-muted"
                              >
                                <td className="max-w-0 py-2.5 pr-3">
                                  <button
                                    type="button"
                                    onClick={() => openSubordinate(b)}
                                    className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-ink transition-colors hover:text-primary"
                                  >
                                    <span className="truncate">
                                      {b.nama_pegawai}
                                    </span>
                                    <CaretRightIcon
                                      size={14}
                                      weight="bold"
                                      className="shrink-0 text-ink-muted"
                                    />
                                  </button>
                                </td>
                                <td className="py-2.5 pr-3 text-sm text-ink-muted">
                                  {b.npp}
                                </td>
                                <td className="truncate py-2.5 pr-3 text-sm text-ink-muted">
                                  {[b.nama_jabatan, b.unit_kerja]
                                    .filter(Boolean)
                                    .join(" · ") || "—"}
                                </td>
                                <td className="py-2.5 text-right">
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold leading-4 ${
                                      b.is_active
                                        ? "bg-status-green-soft text-status-green"
                                        : "bg-error-container text-error"
                                    }`}
                                  >
                                    {b.is_active ? "AKTIF" : "NONAKTIF"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-outline px-6 py-4">
                    {showControls && onDelete ? (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={pending}
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-error/30 px-5 text-sm font-semibold text-error transition-colors hover:bg-error-container disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pending ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current" />
                        ) : (
                          <TrashIcon size={16} weight="bold" />
                        )}
                        Hapus
                      </button>
                    ) : null}
                    <Link
                      href={u.editHref}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-strong"
                    >
                      <PencilSimpleIcon size={16} weight="bold" />
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        : null}
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-muted">
        {label}
      </dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}