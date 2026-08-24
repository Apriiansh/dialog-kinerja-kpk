"use client";

import { ListIcon } from "@phosphor-icons/react";
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
}: {
  session: SessionData;
  onOpenMobile: () => void;
}) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-outline bg-white/90 px-4 shadow-sm shadow-black/5 backdrop-blur-md sm:px-6 print:hidden",
      )}
    >
      {/* Sisi Kiri: Hamburger + Brand Logo KPK + Konteks Portal */}
      <div className="flex items-center gap-2">
        {/* Hamburger (Mobile) */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-outline text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <ListIcon size={18} weight="bold" />
        </button>

        {/* Brand: Logo KPK */}
        <Link
          href="/"
          aria-label="Ke halaman depan"
          className="flex items-center rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-muted"
        >
          <Image
            src="/logo-kpk.png"
            alt="Logo KPK"
            width={280}
            height={83}
            priority
            className="h-7 w-auto"
          />
        </Link>

        {/* Pemisah + Konteks Portal (Desktop) */}
        <div className="hidden items-center gap-2 lg:flex">
          <span className="h-4 w-px bg-outline" />
          <span className="text-xs font-semibold tracking-tight text-ink">
            Portal Dialog Kinerja
          </span>
          <span className="text-[10px] text-ink-muted/60">&bull;</span>
          <span className="text-[11px] font-medium text-ink-muted">
            Komisi Pemberantasan Korupsi
          </span>
        </div>
      </div>

      {/* Sisi Kanan: Notifikasi, Role Switcher & Profil Ringkas */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifikasi */}
        <NotificationBell role={session.role.toLowerCase()} />

        {/* Role Switcher jika memiliki multi-role */}
        <RoleSwitcher roles={session.roles} activeRole={session.role} />

        {/* Pemisah Vertikal */}
        <div className="hidden h-4 w-px bg-outline sm:block" />

        {/* Profil Akun Ringkas */}
        <Link
          href={`/${session.role.toLowerCase()}/profil`}
          title="Buka Profil Pengguna"
          className="group flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-surface-muted"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-strong text-[10px] font-bold text-white shadow-2xs ring-1 ring-primary-strong/20 transition-all group-hover:ring-primary-strong/50">
            {initials(session.nama)}
          </div>
          <div className="hidden flex-col text-left leading-tight sm:flex">
            <span className="max-w-[130px] truncate text-xs font-medium text-ink transition-colors group-hover:text-primary-strong md:max-w-[170px]">
              {session.nama}
            </span>
            <div className="scale-90 origin-left -mt-0.5">
              <RoleTag role={session.role} />
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
