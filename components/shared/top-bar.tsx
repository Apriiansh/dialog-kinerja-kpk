"use client";

import { ListIcon, CaretDoubleLeftIcon, CaretDoubleRightIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import type { SessionData } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { RoleTag } from "./role-tag";
import { RoleSwitcher } from "./role-switcher";
import { NotificationBell } from "./notification-bell";

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
  collapsed = false,
  onToggleCollapse,
}: {
  session: SessionData;
  onOpenMobile: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-primary-strong/90 px-4 shadow-sm backdrop-blur-md sm:px-6 print:hidden",
      )}
    >
      {/* Sisi Kiri: Toggle Sidebar + Hamburger + Brand Logo KPK + Konteks Portal */}
      <div className="flex items-center gap-2">
        {/* Toggle collapse (Desktop) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white lg:flex"
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <CaretDoubleRightIcon size={16} weight="bold" />
          ) : (
            <CaretDoubleLeftIcon size={16} weight="bold" />
          )}
        </button>

        {/* Hamburger (Mobile) */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/20 text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <ListIcon size={18} weight="bold" />
        </button>

        {/* Brand: Logo KPK + Nama Aplikasi */}
        <Link
          href="/"
          aria-label="Ke halaman depan"
          className="flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-white/10"
        >
          <Image
            src="/logo-kpk.png"
            alt="Logo KPK"
            width={280}
            height={83}
            priority
            className="h-7 w-auto"
          />
          <span className="text-sm font-bold tracking-tight text-white">
            Dialog Kinerja
          </span>
        </Link>

        {/* Pemisah + Konteks Portal (Desktop) */}
        <div className="hidden items-center gap-2 text-white lg:flex">
          <span className="h-4 w-px bg-white/20" />
          <span className="text-xs font-semibold tracking-tight text-white">
            Portal Dialog Kinerja
          </span>
          <span className="text-white/40 text-[10px]">&bull;</span>
          <span className="text-[11px] font-medium text-white/70">
            Komisi Pemberantasan Korupsi
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Notifikasi, Role Switcher & Profil Ringkas */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifikasi */}
        <NotificationBell role={session.role.toLowerCase()} />

        {/* Role Switcher jika memiliki multi-role */}
        <RoleSwitcher roles={session.roles} activeRole={session.role} variant="dark" />

        {/* Pemisah Vertikal */}
        <div className="hidden h-4 w-px bg-white/20 sm:block" />

        {/* Profil Akun Ringkas */}
        <Link
          href={`/${session.role.toLowerCase()}/profil`}
          title="Buka Profil Pengguna"
          className="group flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-white/10"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white shadow-2xs ring-1 ring-white/30 transition-all group-hover:ring-white/60">
            {initials(session.nama)}
          </div>
          <div className="hidden flex-col text-left leading-tight sm:flex">
            <span className="max-w-[130px] truncate text-xs font-medium text-white transition-colors group-hover:text-cyan-200 md:max-w-[170px]">
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
