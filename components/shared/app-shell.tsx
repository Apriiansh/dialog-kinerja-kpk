"use client";

import { Suspense, useState } from "react";
import {
  SquaresFourIcon,
  ChatCircleDotsIcon,
  ClipboardTextIcon,
  SignOutIcon,
  XIcon,
  UsersIcon,
  UserListIcon,
  MonitorPlayIcon,
  ArrowsClockwiseIcon,
  ListChecksIcon,
  BellIcon,
  FileArrowUpIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import type { Role, SessionData } from "@/lib/auth/session";
import { TopBar } from "./top-bar";
import { AppFooter } from "./footer";

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
        icon: SquaresFourIcon,
        exact: true,
      },
      {
        href: "/pegawai/dialog",
        label: "Dialog Kinerja Saya",
        icon: ClipboardTextIcon,
      },
      {
        href: "/pegawai/reviu",
        label: "Reviu Dialog Kinerja",
        icon: ArrowsClockwiseIcon,
      },
      {
        href: "/pegawai/notifikasi",
        label: "Notifikasi",
        icon: BellIcon,
        exact: true,
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
        icon: SquaresFourIcon,
        exact: true,
      },
      {
        href: "/atasan/dialog",
        label: "Dialog Kinerja",
        icon: ChatCircleDotsIcon,
      },
      {
        href: "/atasan/reviu",
        label: "Reviu Dialog Kinerja",
        icon: ArrowsClockwiseIcon,
      },
      {
        href: "/atasan/pegawai",
        label: "Pegawai",
        icon: UsersIcon,
      },
      {
        href: "/atasan/notifikasi",
        label: "Notifikasi",
        icon: BellIcon,
        exact: true,
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
        icon: SquaresFourIcon,
        exact: true,
      },
      {
        href: "/admin/monitoring",
        label: "Monitoring Dialog Kinerja",
        icon: MonitorPlayIcon,
      },
      {
        href: "/admin/users",
        label: "Kelola Pengguna",
        icon: UserListIcon,
      },
      {
        href: "/admin/import-data",
        label: "Impor Data Evaluasi",
        icon: FileArrowUpIcon,
      },
      {
        href: "/admin/metode",
        label: "Metode Pengembangan",
        icon: ListChecksIcon,
      },
      {
        href: "/admin/notifikasi",
        label: "Notifikasi",
        icon: BellIcon,
        exact: true,
      },
    ],
  },
];

const NAV_GROUPS: Record<Role, NavGroup[]> = {
  ADMIN: ADMIN_NAV_GROUPS,
  ATASAN: ATASAN_NAV_GROUPS,
  PEGAWAI: PEGAWAI_NAV_GROUPS,
};

function Brand() {
  return (
    <div className="flex flex-row gap-3">
      <Image
        src="/logo-kpk.png"
        alt="Logo KPK"
        width={170}
        height={64}
        priority
        className="h-auto w-30"
      />
    </div>
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

function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={
          className ??
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-red-600/50 hover:text-white cursor-pointer"
        }
      >
        <SignOutIcon size={18} weight="bold" />
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-primary-strong lg:flex print:hidden shadow-lg border-r border-white/5">
        <div className="px-5 pb-6 pt-6">
          <Brand />
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <Suspense fallback={<div className="p-4 text-xs text-white/40">Memuat navigasi...</div>}>
            <NavItemsList role={session.role} />
          </Suspense>
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary-strong shadow-2xl lg:hidden print:hidden">
          <div className="flex items-center justify-between px-5 pb-4 pt-5">
            <Brand />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Tutup menu"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            <Suspense fallback={<div className="p-4 text-xs text-white/40">Memuat navigasi...</div>}>
              <NavItemsList role={session.role} onItemClick={() => setMobileOpen(false)} />
            </Suspense>
          </nav>

          <div className="mt-auto border-t border-white/10 p-4">
            <LogoutButton />
          </div>
        </aside>
      )}

      {/* Top Bar (Unified Desktop & Mobile) */}
      <TopBar session={session} onOpenMobile={() => setMobileOpen(true)} />

      {/* Main Content Area */}
      <div className="flex min-h-screen w-full flex-col lg:pl-60 print:pl-0">
        <div className="flex flex-1 flex-col px-4 pb-6 pt-16 sm:px-6 lg:px-8 lg:pt-18 print:p-0">
          <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
