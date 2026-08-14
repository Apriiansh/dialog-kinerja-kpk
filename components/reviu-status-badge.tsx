import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import type { StatusReviu } from "@/generated/prisma/enums";

const STATUS: Record<
  StatusReviu,
  { label: string; className: string; icon?: typeof CheckCircleIcon }
> = {
  draft_pegawai: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700",
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
    icon: CheckCircleIcon,
  },
};

export function ReviuStatusBadge({ status }: { status: StatusReviu }) {
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
