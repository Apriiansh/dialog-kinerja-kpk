import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react/dist/ssr";
import type { StatusTindakLanjut } from "@/generated/prisma/enums";

const STATUS: Record<
  StatusTindakLanjut,
  { label: string; className: string; icon: typeof CheckCircleIcon | typeof XCircleIcon }
> = {
  TERCAPAI: {
    label: "Tercapai",
    className: "bg-status-green-soft text-status-green",
    icon: CheckCircleIcon,
  },
  TIDAK_TERCAPAI: {
    label: "Tidak Tercapai",
    className: "bg-error-container text-on-error-container",
    icon: XCircleIcon,
  },
};

export function TindakLanjutBadge({
  status,
}: {
  status: StatusTindakLanjut;
}) {
  const { label, className, icon: Icon } = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold leading-4 ${className}`}
    >
      <Icon size={12} weight="bold" />
      {label}
    </span>
  );
}
