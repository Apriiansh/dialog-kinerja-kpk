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
import { cn } from "@/lib/utils";
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

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Ke halaman depan"
      className={cn("block shrink-0", collapsed && "w-full")}
    >
      <Image
        src="/logo-kpk.png"
        alt="Logo KPK"
        width={170}
        height={64}
        priority
        className={cn("h-auto", collapsed ? "mx-auto w-10" : "w-30")}
      />
    </Link>
  );
}

function NavItemsList({
  role,
  collapsed = false,
  onItemClick,
}: {
  role: Role;
  collapsed?: boolean;
  onItemClick?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");

  const groups = NAV_GROUPS[role];

  return (
    <div className="space-y-6 px-3">
      {groups.map((group, idx) => (
        <div key={group.title ?? idx} className="space-y-1">
          {collapsed ? (
            <div
              role="presentation"
              className="mx-auto mb-2 h-px w-8 rounded-full bg-white/15"
            />
          ) : (
            group.title && (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                {group.title}
              </div>
            )
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
                title={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-white font-semibold text-primary-strong shadow-md shadow-black/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon size={19} weight={active ? "fill" : "regular"} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title="Keluar"
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-red-500/25 hover:text-white",
          collapsed && "justify-center px-0"
        )}
      >
        <SignOutIcon size={18} weight="bold" className="shrink-0" />
        {!collapsed && "Keluar"}
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col overflow-hidden bg-gradient-to-b from-primary-strong to-primary shadow-xl shadow-primary/25 ring-1 ring-black/5 transition-[width] duration-300 ease-in-out lg:flex print:hidden",
          collapsed ? "lg:w-[76px]" : "lg:w-64"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center px-5 pb-4 pt-6",
            collapsed && "justify-center px-0"
          )}
        >
          <Brand collapsed={collapsed} />
        </div>

        <nav className="sidebar-scroll flex-1 overflow-x-hidden overflow-y-auto py-3">
          <Suspense fallback={<div className="p-4 text-xs text-white/40">Memuat navigasi...</div>}>
            <NavItemsList role={session.role} collapsed={collapsed} />
          </Suspense>
        </nav>

        <div
          className={cn(
            "mt-auto border-t border-white/10 p-4 transition-[padding] duration-300 ease-in-out",
            collapsed && "px-3"
          )}
        >
          <LogoutButton collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 animate-in fade-in bg-ink/60 backdrop-blur-sm duration-200 lg:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] animate-in slide-in-from-left flex-col bg-gradient-to-b from-primary-strong to-primary shadow-2xl duration-300 ease-out lg:hidden print:hidden">
          <div className="flex items-center justify-between px-5 pb-4 pt-5">
            <Brand />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="cursor-pointer rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Tutup menu"
            >
              <XIcon size={20} weight="bold" />
            </button>
          </div>

          <nav className="sidebar-scroll flex-1 overflow-x-hidden overflow-y-auto py-2">
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
      <TopBar
        session={session}
        onOpenMobile={() => setMobileOpen(true)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex min-h-screen w-full flex-col transition-[padding] duration-300 ease-in-out print:pl-0",
          collapsed ? "lg:pl-[76px]" : "lg:pl-64"
        )}
      >
        <div className="flex flex-1 flex-col px-4 pb-6 pt-16 sm:px-6 lg:px-8 lg:pt-18 print:p-0">
          <div className="mx-auto w-full max-w-6xl flex-1">{children}</div>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
