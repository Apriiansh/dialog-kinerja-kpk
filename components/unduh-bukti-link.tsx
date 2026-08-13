import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const DEFAULT_CLASS =
  "inline-flex h-8 items-center gap-1 rounded-md border border-outline bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted";

export function UnduhBuktiLink({
  dialogId,
  path,
  className = DEFAULT_CLASS,
}: {
  dialogId: number;
  path: string;
  className?: string;
}) {
  return (
    <Link href={`${path}/${dialogId}?cetak=1`} className={className}>
      <DownloadSimple size={12} weight="bold" />
      Unduh Bukti
    </Link>
  );
}
