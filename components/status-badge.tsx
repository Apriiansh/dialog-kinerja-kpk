import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import type { StatusDialog } from "@/generated/prisma/client";

const STATUS: Record<
  StatusDialog,
  { label: string; className: string; icon?: typeof CheckCircle }
> = {
  draft_atasan: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700",
  },
  menunggu_pegawai: {
    label: "Menunggu Pegawai",
    className: "bg-amber-100 text-amber-800",
  },
  menunggu_atasan: {
    label: "Menunggu Atasan",
    className: "bg-blue-100 text-blue-800",
  },
  menunggu_validasi: {
    label: "Menunggu Validasi",
    className: "bg-indigo-100 text-indigo-800",
  },
  selesai: {
    label: "Selesai",
    className: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
  },
};

export function StatusBadge({ status }: { status: StatusDialog }) {
  const { label, className, icon: Icon } = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold leading-4 ${className}`}
    >
      {Icon ? <Icon size={12} weight="bold" /> : null}
      {label}
    </span>
  );
}
