import type { ReactNode } from "react";

export function Field({
  htmlFor,
  label,
  hint,
  required,
  children,
}: {
  htmlFor: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
      >
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      {children}
      {hint ? (
        <span className="text-xs leading-4 text-ink-muted">{hint}</span>
      ) : null}
    </div>
  );
}