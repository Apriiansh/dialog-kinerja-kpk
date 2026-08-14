"use client";

import { Suspense, useState } from "react";
import {
  SquaresFour,
  ChatCircleDots,
  ClockCounterClockwise,
  ClipboardText,
  SignOut,
  List,
  X,
  Users,
  UserList,
  MonitorPlay,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { logoutAction } from "@/app/(app)/actions";
import type { Role, SessionData } from "@/lib/session";
import { RoleTag } from "./role-tag";
import { RoleSwitcher } from "./role-switcher";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  statusQuery?: string;
  exact?: boolean;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

const PEGAWAI_NAV_GROUPS: NavGroup[] = [
  {
    title: "Navigasi",
    items: [
      {
        href: "/pegawai/dashboard",
        label: "Dashboard",
        icon: SquaresFour,
        exact: true,
      },
      {
        href: "/pegawai/dialog",
        label: "Dialog Kinerja Saya",
        icon: ClipboardText,
      },
      {
        href: "/pegawai/reviu",
        label: "Reviu Dialog Kinerja",
        icon: ArrowsClockwise,
      },
    ],
  },
];

const ATASAN_NAV_GROUPS: NavGroup[] = [
  {
    title: "Navigasi",
    items: [
      {
        href: "/atasan/dashboard",
        label: "Dashboard",
        icon: SquaresFour,
        exact: true,
      },
      {
        href: "/atasan/dialog",
        label: "Dialog Kinerja",
        icon: ChatCircleDots,
      },
      {
        href: "/atasan/reviu",
        label: "Tindak Lanjut Dialog Kinerja",
        icon: ArrowsClockwise,
      },
      {
        href: "/atasan/pegawai",
        label: "Pegawai",
        icon: Users,
      },
      {
        href: "/atasan/history",
        label: "Riwayat",
        icon: ClockCounterClockwise,
      },
    ],
  },
];

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    title: "Navigasi",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: SquaresFour,
        exact: true,
      },
      {
        href: "/admin/users",
        label: "Kelola Pengguna",
        icon: UserList,
      },
      {
        href: "/admin/monitoring",
        label: "Monitoring Dialog Kinerja",
        icon: MonitorPlay,
      },
    ],
  },
];

const NAV_GROUPS: Record<Role, NavGroup[]> = {
  ADMIN: ADMIN_NAV_GROUPS,
  ATASAN: ATASAN_NAV_GROUPS,
  PEGAWAI: PEGAWAI_NAV_GROUPS,
};

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
    <div className="flex flex-row gap-3">
      <Image
        src="/logo-kpk.png"
        alt="Logo KPK"
        width={160}
        height={64}
        priority
        className="h-auto w-20"
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

function NavItemsList({
  role,
  onItemClick,
}: {
  role: Role;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");

  const groups = NAV_GROUPS[role];

  return (
    <div className="space-y-5 px-3">
      {groups.map((group, idx) => (
        <div key={group.title ?? idx} className="space-y-1">
          {group.title && (
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
              {group.title}
            </div>
          )}
          {group.items.map(({ href, label, icon: Icon, statusQuery, exact }) => {
            let active = false;
            if (statusQuery !== undefined) {
              active =
                pathname === "/pegawai/dashboard" &&
                (currentStatus === statusQuery ||
                  (statusQuery === "semua" && !currentStatus));
            } else if (exact) {
              active = pathname === href && !currentStatus;
            } else {
              active = pathname === href || pathname.startsWith(`${href}/`);
            }

            return (
              <Link
                key={href + (statusQuery ?? "")}
                href={href}
                onClick={onItemClick}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 font-semibold text-white shadow-xs"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function AppShell({
  session,
  children,
}: {
  session: SessionData;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-primary-strong lg:flex print:hidden">
        <div className="px-5 pb-6 pt-6">
          <Brand />
        </div>

        <nav className="flex-1 overflow-y-auto">
          <Suspense fallback={<div className="p-4 text-xs text-white/40">Loading navigation...</div>}>
            <NavItemsList role={session.role} />
          </Suspense>
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
          <RoleSwitcher roles={session.roles} activeRole={session.role} />
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-primary-strong shadow-2xl lg:hidden print:hidden">
          <div className="flex items-center justify-between px-5 pb-4 pt-5">
            <Brand />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            <Suspense fallback={<div className="p-4 text-xs text-white/40">Loading navigation...</div>}>
              <NavItemsList role={session.role} onItemClick={() => setMobileOpen(false)} />
            </Suspense>
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
            <RoleSwitcher roles={session.roles} activeRole={session.role} />
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between bg-primary-strong px-4 lg:hidden print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Buka menu navigasi"
          >
            <List size={22} weight="bold" />
          </button>
          <Image
            src="/logo-kpk.png"
            alt="Logo KPK"
            width={96}
            height={38}
            priority
            className="h-8 w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
            {initials(session.nama)}
          </span>
          <LogoutButton className="flex items-center justify-center rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex min-h-screen w-full flex-col lg:pl-60 print:pl-0">
        <div className="flex flex-1 flex-col px-4 pb-10 pt-20 lg:px-10 lg:pt-10 print:p-0">
          <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
