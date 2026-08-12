import type { ReactNode } from "react";

const TONES = {
  error: "bg-error-container text-on-error-container",
  success: "bg-status-green-soft text-status-green",
  info: "bg-status-blue-soft text-status-blue",
} as const;

export function Banner({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof TONES;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-md px-4 py-3 text-sm leading-5 ${TONES[tone]}`}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </div>
  );
}