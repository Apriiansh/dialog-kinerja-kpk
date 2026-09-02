import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const DEFAULT_CLASS =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-outline bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted";

export function UnduhBuktiLink({
  dialogId,
  path,
  label = "Unduh PDF",
  className = DEFAULT_CLASS,
}: {
  dialogId: string;
  path: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link href={`${path}/${dialogId}?cetak=1`} className={className}>
      <DownloadSimpleIcon size={12} weight="bold" />
      {label}
    </Link>
  );
}
