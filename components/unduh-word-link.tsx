import { FileDocIcon } from "@phosphor-icons/react/dist/ssr";

const DEFAULT_CLASS =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-outline bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:border-outline-strong hover:bg-surface-muted print:hidden";

export function UnduhWordLink({
  href,
  label = "Unduh Word",
  className = DEFAULT_CLASS,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  return (
    <a href={href} download className={className}>
      <FileDocIcon size={14} weight="bold" />
      {label}
    </a>
  );
}
