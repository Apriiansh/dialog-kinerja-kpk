import type { Role } from "@/lib/auth/session";

export function RoleTag({
  role,
  tone = "light",
}: {
  role: Role;
  tone?: "light" | "dark";
}) {
  if (tone === "dark") {
    return (
      <span className="inline-flex items-center rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-bold leading-4 text-white">
        {role}
      </span>
    );
  }

  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center rounded-md bg-status-indigo-soft px-2 py-0.5 text-[11px] font-bold leading-4 text-status-indigo">
        ADMIN
      </span>
    );
  }

  if (role === "ATASAN") {
    return (
      <span className="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold leading-4 text-on-primary">
        ATASAN
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md border border-outline-strong px-2 py-0.5 text-[11px] font-bold leading-4 text-ink-muted">
      PEGAWAI
    </span>
  );
}
