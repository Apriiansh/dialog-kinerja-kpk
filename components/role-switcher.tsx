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
}: {
  roles?: Role[];
  activeRole: Role;
}) {
  if (roles.length < 2) return null;

  return (
    <div className="mt-3 rounded-md bg-white/10 p-2">
      <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
        <ArrowsLeftRightIcon size={12} weight="bold" />
        Ganti Peran
      </div>
      <div className="flex gap-1">
        {roles.map((role) => {
          const active = role === activeRole;
          return (
            <form key={role} action={switchRole.bind(null, role)} className="flex-1">
              <button
                type="submit"
                aria-pressed={active}
                className={`w-full rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${active
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
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