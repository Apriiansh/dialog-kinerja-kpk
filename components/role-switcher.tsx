"use client";

import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { switchRole } from "@/app/(app)/actions";
import type { Role } from "@/lib/session";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  ATASAN: "Atasan",
  PEGAWAI: "Pegawai",
};

export function RoleSwitcher({
  roles = [],
  activeRole,
  variant = "light",
}: {
  roles?: Role[];
  activeRole: Role;
  variant?: "dark" | "light";
}) {
  if (roles.length < 2) return null;

  if (variant === "dark") {
    return (
      <div className="my-1 flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 p-0.5 shadow-2xs">
        <span className="hidden md:inline-flex items-center gap-1 px-2 text-[11px] font-medium text-white/75">
          <ArrowsLeftRightIcon size={12} weight="bold" className="text-blue-300" />
          Peran:
        </span>
        <div className="flex items-center gap-0.5">
          {roles.map((role) => {
            const active = role === activeRole;
            return (
              <form key={role} action={switchRole.bind(null, role)}>
                <button
                  type="submit"
                  aria-pressed={active}
                  title={`Beralih ke peran ${ROLE_LABEL[role]}`}
                  className={`cursor-pointer rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-white text-primary-strong font-bold shadow-xs"
                      : "text-white/70 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  {ROLE_LABEL[role]}
                </button>
              </form>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="my-1 flex items-center gap-1 rounded-lg border border-outline/30 bg-surface-muted/70 p-0.5 shadow-2xs">
      <span className="hidden md:inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-ink-muted">
        <ArrowsLeftRightIcon size={12} weight="bold" className="text-primary" />
        Peran:
      </span>
      <div className="flex items-center gap-0.5">
        {roles.map((role) => {
          const active = role === activeRole;
          return (
            <form key={role} action={switchRole.bind(null, role)}>
              <button
                type="submit"
                aria-pressed={active}
                title={`Beralih ke peran ${ROLE_LABEL[role]}`}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-primary text-on-primary font-semibold shadow-xs"
                    : "text-ink-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {ROLE_LABEL[role]}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}