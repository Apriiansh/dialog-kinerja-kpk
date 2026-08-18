"use client";

import { ListIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { SessionData } from "@/lib/auth/session";
import { RoleTag } from "./role-tag";
import { RoleSwitcher } from "./role-switcher";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function TopBar({
  session,
  onOpenMobile,
}: {
  session: SessionData;
  onOpenMobile: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-13 items-center justify-between border-b border-white/10 bg-primary-strong px-4 shadow-sm transition-all sm:px-6 lg:left-60 lg:px-8 print:hidden">
      {/* Sisi Kiri: Mobile Hamburger + Brand / Desktop Title Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-white/20 text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <ListIcon size={18} weight="bold" />
        </button>

        {/* Brand khusus Mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <Image
            src="/logo-kpk.png"
            alt="Logo KPK"
            width={64}
            height={26}
            priority
            className="h-6 w-auto"
          />
          <span className="text-xs font-semibold text-white">Dialog Kinerja</span>
        </div>

        {/* Portal Breadcrumb / Info khusus Desktop */}
        <div className="hidden items-center gap-2 text-white lg:flex">
          <span className="text-xs font-semibold tracking-tight text-white">
            Portal Dialog Kinerja
          </span>
          <span className="text-white/40 text-[10px]">&bull;</span>
          <span className="text-[11px] font-medium text-white/70">
            Komisi Pemberantasan Korupsi
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Role Switcher & Profil Ringkas */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher jika memiliki multi-role */}
        <RoleSwitcher roles={session.roles} activeRole={session.role} variant="dark" />

        {/* Pemisah Vertikal */}
        <div className="hidden h-4 w-px bg-white/20 sm:block" />

        {/* Profil Akun Ringkas */}
        <Link
          href={`/${session.role.toLowerCase()}/profil`}
          title="Buka Profil Pengguna"
          className="group flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-white/10"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-2xs ring-1 ring-white/30 transition-all group-hover:ring-white/60">
            {initials(session.nama)}
          </div>
          <div className="hidden flex-col text-left leading-tight sm:flex">
            <span className="max-w-[130px] truncate text-xs font-medium text-white transition-colors group-hover:text-blue-200 md:max-w-[170px]">
              {session.nama}
            </span>
            <div className="scale-90 origin-left -mt-0.5">
              <RoleTag role={session.role} tone="dark" />
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
