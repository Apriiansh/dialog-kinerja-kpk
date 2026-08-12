import { CheckCircleIcon, ClockIcon } from "@phosphor-icons/react/dist/ssr";
import type { StatusDialog } from "@/generated/prisma/enums";
import { STATUS_CONFIG, type StatusTone } from "@/lib/status-dialog";

const TONE_CLASSES: Record<StatusTone, string> = {
  draft: "bg-status-draft-soft text-status-draft",
  "waiting-pegawai": "bg-status-amber-soft text-status-amber",
  "waiting-atasan": "bg-status-blue-soft text-status-blue",
  validation: "bg-status-indigo-soft text-status-indigo",
  done: "bg-status-green-soft text-status-green",
};

export function StatusBadge({ status }: { status: StatusDialog }) {
  const { label, tone } = STATUS_CONFIG[status];
  const isDone = tone === "done";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold leading-4 ${TONE_CLASSES[tone]}`}
    >
      {isDone ? (
        <CheckCircleIcon size={12} weight="bold" aria-hidden />
      ) : (
        <ClockIcon size={12} weight="bold" aria-hidden />
      )}
      {label}
    </span>
  );
}