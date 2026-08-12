"use client";

import {
  ChatCircleDots,
  ClockCounterClockwise,
  SquaresFour,
  SignOut,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(app)/actions";
import type { SessionData } from "@/lib/session";
import { RoleTag } from "./role-tag";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour, exact: true },
  { href: "/dashboard/dialog", label: "Dialog Kinerja", icon: ChatCircleDots },
  { href: "/dashboard/history", label: "Riwayat", icon: ClockCounterClockwise },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function Brand() {
  return (
    <div className="flex flex-col gap-3">
      <Image
        src="/logo-kpk.png"
        alt="Logo KPK"
        width={160}
        height={64}
        priority
        className="h-auto w-40"
      />
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold text-white">Dialog Kinerja</span>
        <span className="mt-1 text-[11px] font-medium text-white/50">
          Biro SDM
        </span>
      </div>
    </div>
  );
}

function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ??
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        }
      >
        <SignOut size={18} weight="bold" />
        Keluar
      </button>
    </form>
  );
}

export function AppShell({
  session,
  children,
}: {
  session: SessionData;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-primary-strong lg:flex">
        <div className="px-5 pb-8 pt-6">
          <Brand />
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
              {initials(session.nama)}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium text-white">
                {session.nama}
              </span>
              <RoleTag role={session.role} tone="dark" />
            </div>
          </div>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between bg-primary-strong px-4 lg:hidden">
        <Image
          src="/logo-kpk.png"
          alt="Logo KPK"
          width={96}
          height={38}
          priority
          className="h-8 w-auto"
        />
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
            {initials(session.nama)}
          </span>
          <LogoutButton className="flex items-center justify-center rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white" />
        </div>
      </header>

      <div className="flex min-h-screen w-full flex-col lg:pl-60">
        <div className="flex flex-1 flex-col px-4 pb-10 pt-20 lg:px-10 lg:pt-10">
          <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
