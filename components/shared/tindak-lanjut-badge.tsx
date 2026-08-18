import {
  CheckCircleIcon,
  XCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

export function TindakLanjutBadge({
  is_tercapai,
  is_tidak_tercapai,
}: {
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
}) {
  if (is_tercapai && is_tidak_tercapai) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-status-amber-soft px-2.5 py-1 text-[11px] font-bold leading-4 text-status-amber">
        <WarningCircleIcon size={12} weight="bold" />
        Tercapai & Tidak Tercapai
      </span>
    );
  }

  if (is_tercapai) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-status-green-soft px-2.5 py-1 text-[11px] font-bold leading-4 text-status-green">
        <CheckCircleIcon size={12} weight="bold" />
        Tercapai
      </span>
    );
  }

  if (is_tidak_tercapai) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-error-container px-2.5 py-1 text-[11px] font-bold leading-4 text-on-error-container">
        <XCircleIcon size={12} weight="bold" />
        Tidak Tercapai
      </span>
    );
  }

  return null;
}
