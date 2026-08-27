"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilSimpleIcon,
  TrashIcon,
  UserCircleIcon,
  EnvelopeSimpleIcon,
  ShieldCheckIcon,
  UsersIcon,
  CalendarIcon,
  IdentificationCardIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ClockIcon,
  UserSwitchIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/shared/empty-state";
import type { StatusDialog, Triwulan } from "@/generated/prisma/enums";
import { RoleTag } from "@/components/shared/role-tag";
import { StatusBadge } from "@/components/shared/status-badge";
import { error as showError, success as showSuccess } from "@/components/ui/toast";
import { formatPeriode } from "@/lib/constants/triwulan";

export interface UserDetailData {
  id: number;
  npp: string;
  email: string | null;
  email_verified: boolean;
  nip: string | null;
  nama_pegawai: string;
  nama_jabatan: string | null;
  unit_kerja: string | null;
  tanggal_bergabung: string | null;
  masa_kerja_unit_terakhir: string | null;
  is_admin: boolean;
  as_pegawai: boolean;
  is_active: boolean;
  default_role: string;
  atasan?: {
    id: number;
    nama_pegawai: string;
    npp: string;
    nama_jabatan: string | null;
  } | null;
  bawahan?: {
    id: number;
    npp: string;
    nama_pegawai: string;
    nama_jabatan: string | null;
    unit_kerja: string | null;
    is_active: boolean;
  }[];
  dialogs?: {
    id: number;
    periode_tahun: number;
    triwulan: Triwulan;
    status: StatusDialog;
    deskripsi_kinerja: string | null;
    updated_at: string | null;
  }[];
}

interface UserDetailViewProps {
  user: UserDetailData;
  context: "ADMIN" | "ATASAN";
  backHref: string;
  editHref: string;
  isSelf?: boolean;
  onToggleStatus: (isActive: boolean) => Promise<{ error?: string } | undefined>;
  onDelete: () => Promise<{ error?: string } | undefined>;
}

type InfoItemProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-surface-muted/40 p-3">
      <div className="shrink-0 text-primary mt-0.5">{icon}</div>
      <div>
        <span className="block text-xs text-ink-muted">{label}</span>
        {typeof value === "string" ? (
          <span className="text-sm font-semibold text-ink">{value}</span>
        ) : (value)}
      </div>
    </div>
  );
}

type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  title: string;
  desc: React.ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  variant?: "danger" | "success" | "default";
}

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  isPending,
  title,
  desc,
  confirmLabel,
  pendingLabel,
  variant = "default"
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700"
      : variant === "success"
        ? "bg-emerald-600 hover:bg-emerald-700"
        : "bg-primary hover:bg-primary-strong"

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onClick={() => !isPending && onClose()}
    >
      <div
        className="flex w-full max-w-md flex-col rounded-xl bg-surface p-6 shadow-ambient"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className={`text-base font-bold ${variant === "danger" ? "text-rose-600" : "text-ink"}`}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded p-1 text-ink-muted hover:text-ink"
          >
            <XIcon size={18} />
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-muted">{desc}</p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex h-9 items-center justify-center rounded-md border border-outline bg-surface px-4 text-xs font-semibold text-ink hover:bg-surface-muted"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-xs font-semibold text-white ${confirmClass}`}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


export function UserDetailView({
  user,
  context,
  backHref,
  editHref,
  isSelf = false,
  onToggleStatus,
  onDelete,
}: UserDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isActiveState, setIsActiveState] = useState(user.is_active);

  const roleLabel = context === "ADMIN" ? "Pengguna" : "Pegawai";

  function handleToggleStatus() {
    startTransition(async () => {
      const nextActive = !isActiveState;
      const res = await onToggleStatus(nextActive);
      if (res?.error) {
        showError(res.error);
        return;
      }
      setIsActiveState(nextActive);
      setStatusModalOpen(false);
      showSuccess(
        nextActive
          ? `${roleLabel} berhasil diaktifkan.`
          : `${roleLabel} berhasil dinonaktifkan.`
      );
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await onDelete();
      if (res?.error) {
        showError(res.error);
        return;
      }
      setDeleteModalOpen(false);
      showSuccess(`${roleLabel} berhasil dihapus.`);
      router.push(backHref);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-outline bg-surface text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            title="Kembali"
          >
            <ArrowLeftIcon size={18} weight="bold" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Detail {roleLabel}
              </span>
              <span className="text-xs text-ink-muted">/</span>
              <span className="text-xs text-ink-muted">NPP {user.npp}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
              {user.nama_pegawai}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {!isSelf && (
            <>
              {/* Toggle Status Button */}
              <button
                type="button"
                onClick={() => setStatusModalOpen(true)}
                disabled={isPending}
                className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${isActiveState
                  ? "border border-outline bg-surface text-ink hover:bg-surface-muted"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
              >
                {isActiveState ? (
                  <>
                    <XCircleIcon size={16} weight="bold" className="text-rose-500" />
                    Nonaktifkan
                  </>
                ) : (
                  <>
                    <CheckCircleIcon size={16} weight="bold" />
                    Aktifkan
                  </>
                )}
              </button>

              {/* Hard Delete Button (only if already inactive) */}
              {!isActiveState && (
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={isPending}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
                >
                  <TrashIcon size={15} weight="bold" />
                  Hapus
                </button>
              )}
            </>
          )}

          {/* Edit Button */}
          <Link
            href={editHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-outline bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
          >
            <PencilSimpleIcon size={15} weight="bold" />
            Edit
          </Link>

          {/* Create Dialog Button (for Atasan) */}
          {context === "ATASAN" && isActiveState && (
            <Link
              href={`/atasan/dialog?pegawaiId=${user.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-strong"
            >
              <PlusIcon size={15} weight="bold" />
              Buat Dialog Kinerja
            </Link>
          )}
        </div>
      </div>

      {/* Profile Banner / Main Overview */}
      <div className="flex flex-col gap-5 rounded-xl border border-outline bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-primary">
            {user.is_admin ? (
              <ShieldCheckIcon size={36} weight="fill" />
            ) : (
              <UserCircleIcon size={36} weight="fill" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-ink">{user.nama_pegawai}</h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isActiveState
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
              >
                {isActiveState ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <p className="text-sm font-medium text-ink-muted">
              {user.nama_jabatan || "Belum ada jabatan"} · {user.unit_kerja || "Belum ada unit kerja"}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {user.is_admin && <RoleTag role="ADMIN" />}
              {user.as_pegawai && <RoleTag role="PEGAWAI" />}
              {(user.bawahan?.length ?? 0) > 0 && <RoleTag role="ATASAN" />}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Information Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col (2 cols): Informasi Kepegawaian */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Card 1: Data Identitas & Kepegawaian */}
          <div className="flex flex-col rounded-xl border border-outline bg-surface p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink-muted">
              Informasi Kepegawaian
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem
                icon={<IdentificationCardIcon size={22} />}
                label="NPP & NIP"
                value={<>
                  <span className="text-sm font-semibold text-ink">NPP {user.npp}</span>
                  <span className="block text-xs text-ink-muted">NIP {user.nip || "—"}</span>
                </>}
              />

              <InfoItem
                icon={<EnvelopeSimpleIcon size={22} />}
                label="Email"
                value={
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-ink">
                      {user.email || "—"}
                    </span>
                    {user.email ? (
                      <span
                        className={`inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          user.email_verified
                            ? "bg-status-green-soft text-status-green"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {user.email_verified ? "Terverifikasi" : "Belum diverifikasi"}
                      </span>
                    ) : null}
                  </div>
                }
              />

              <InfoItem
                icon={<BriefcaseIcon size={22} />}
                label="Jabatan"
                value={user.nama_jabatan || "-"}
              />

              <InfoItem
                icon={<BuildingOfficeIcon size={22} />}
                label="Unit Kerja"
                value={user.unit_kerja || "-"}
              />

              <InfoItem
                icon={<CalendarIcon size={22} />}
                label="Tgl Bergabung"
                value={user.tanggal_bergabung || "-"}
              />

              <InfoItem
                icon={<ClockIcon size={22} />}
                label="Masa Kerja Unit Terakhir"
                value={user.masa_kerja_unit_terakhir || "-"}
              />

              <InfoItem
                icon={<UserSwitchIcon size={22} />}
                label="Atasan Langsung"
                value={
                  user.atasan ? (
                    <>
                      <span className="text-sm font-semibold text-ink">{user.atasan.nama_pegawai}</span>
                      <span className="block text-xs text-ink-muted">NPP {user.atasan.npp}</span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-ink-muted">—</span>
                  )
                }
              />

            </div>
          </div>

          {/* Card 2: Riwayat Dialog Kinerja */}
          {user.dialogs && (
            <div className="flex flex-col rounded-xl border border-outline bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                  Riwayat Dialog Kinerja ({user.dialogs.length})
                </h3>
              </div>

              {user.dialogs.length === 0 ? (
                <EmptyState
                  variant="dialog"
                  title="Belum ada riwayat dialog kinerja"
                  className="border-dashed py-8"
                />
              ) : (
                <div className="divide-y divide-outline rounded-lg border border-outline overflow-hidden">
                  {user.dialogs.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-col gap-2 p-4 transition-colors hover:bg-surface-muted/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{formatPeriode(d.triwulan, d.periode_tahun)}</span>
                          <StatusBadge status={d.status} />
                        </div>
                        <p className="text-xs text-ink-muted line-clamp-1">
                          {d.deskripsi_kinerja || "Belum ada deskripsi kinerja"}
                        </p>
                      </div>
                      <Link
                        href={context === "ADMIN" ? `/admin/monitoring/${d.id}` : `/atasan/dialog/${d.id}`}
                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-outline bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted"
                      >
                        Lihat Dokumen
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col (1 col): Struktur Bawahan */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col rounded-xl border border-outline bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                Bawahan Langsung ({user.bawahan?.length ?? 0})
              </h3>
              <UsersIcon size={18} className="text-ink-muted" />
            </div>

            {!user.bawahan || user.bawahan.length === 0 ? (
              <p className="text-sm text-ink-muted">Tidak memiliki bawahan langsung.</p>
            ) : (
              <div className="flex flex-col divide-y divide-outline">
                {user.bawahan.map((b) => (
                  <Link
                    key={b.id}
                    href={context === "ADMIN" ? `/admin/users/${b.id}` : `/atasan/pegawai/${b.id}`}
                    className="group -mx-2 flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-surface-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-primary text-xs font-bold">
                        {b.nama_pegawai.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                          {b.nama_pegawai}
                        </span>
                        <span className="block text-[11px] text-ink-muted">
                          NPP {b.npp} · {b.nama_jabatan || "—"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${b.is_active ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      title={b.is_active ? "Aktif" : "Nonaktif"}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Toggle Status */}
      <ConfirmModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleToggleStatus}
        isPending={isPending}
        variant={isActiveState ? "danger" : "success"}
        title={isActiveState ? `Nonaktifkan ${roleLabel}` : `Aktifkan ${roleLabel}`}
        desc={
          isActiveState
            ? `Apakah Anda yakin ingin menonaktifkan akun ${user.nama_pegawai}? Pengguna tidak akan dapat login atau mengisi formulir.`
            : `Apakah Anda yakin ingin mengaktifkan kembali akun ${user.nama_pegawai}?`
        }
        confirmLabel={isActiveState ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        pendingLabel={"Memproses..."}
      />

      {/* Modal Konfirmasi Hard Delete */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isPending={isPending}
        variant="danger"
        title={`Hapus Permanen ${roleLabel}`}
        desc={
          <>
            Tindakan ini tidak dapat dibatalkan. Akun <strong>{user.nama_pegawai}</strong> (NPP: {user.npp}) akan dihapus secara permanen dari database.
          </>
        }
        confirmLabel="Hapus Permanen"
        pendingLabel="Menghapus..."
      />
    </div>
  );
}
