"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
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
  FileArrowUpIcon,
  CaretDoubleLeftIcon,
  CaretDoubleRightIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import type { Role, SessionData } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { TopBar } from "./top-bar";
import { AppFooter } from "./footer";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
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
  onToggleCollapse,
}: {
  role: Role;
  collapsed?: boolean;
  onItemClick?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();

  const groups = NAV_GROUPS[role];

  return (
    <div className="space-y-6 px-3">
      {groups.map((group, idx) => (
        <div key={group.title ?? idx} className="space-y-1">
          <div
            className={cn(
              "flex items-center gap-2 pb-1.5 pr-1",
              collapsed ? "justify-center px-0" : "px-3"
            )}
          >
            {collapsed ? (
              idx === 0 && onToggleCollapse ? null : (
                <div
                  role="presentation"
                  className="h-px w-8 rounded-full bg-white/15"
                />
              )
            ) : (
              group.title && (
                <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {group.title}
                </span>
              )
            )}
            {idx === 0 && onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="-mr-1.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
                aria-expanded={!collapsed}
              >
                {collapsed ? (
                  <CaretDoubleRightIcon size={15} weight="bold" />
                ) : (
                  <CaretDoubleLeftIcon size={15} weight="bold" />
                )}
              </button>
            )}
          </div>
          {group.items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                onClick={onItemClick}
                title={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-white font-semibold text-primary-strong shadow-lg shadow-black/15 ring-1 ring-black/5"
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
          "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white",
          collapsed && "justify-center px-0"
        )}
      >
        <SignOutIcon size={18} weight="bold" className="shrink-0" />
        {!collapsed && "Keluar"}
      </button>
    </form>
  );
}

function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden"
    >
      <div className="dot-grid absolute inset-0 mask-[radial-gradient(ellipse_75%_60%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-36 -right-28 h-104 w-104 animate-[ambient-drift_24s_ease-in-out_infinite_alternate] rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-44 -left-32 h-112 w-md animate-[ambient-drift-reverse_30s_ease-in-out_infinite_alternate] rounded-full bg-primary/8 blur-3xl" />
    </div>
  );
}

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const collapsedListeners = new Set<() => void>();

function persistCollapsed(value: boolean): boolean {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? "1" : "0");
    return true;
  } catch {
    return false;
  }
}

const collapsedStore = {
  subscribe(listener: () => void) {
    collapsedListeners.add(listener);
    return () => {
      collapsedListeners.delete(listener);
    };
  },
  read(): boolean {
    try {
      return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  },
  write(value: boolean) {
    persistCollapsed(value);
    for (const listener of collapsedListeners) {
      listener();
    }
  },
};

function useSidebarCollapsed() {
  return useSyncExternalStore(
    collapsedStore.subscribe,
    collapsedStore.read,
    () => false,
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
  const collapsed = useSidebarCollapsed();

  const toggleCollapsed = useCallback(() => {
    collapsedStore.write(!collapsedStore.read());
  }, []);

  return (
    <div className="flex min-h-screen">
      <AmbientBackground />

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 bottom-0 z-20 hidden flex-col overflow-hidden bg-linear-to-b from-primary via-primary-strong to-[#8e0b1f] shadow-xl shadow-black/20 transition-[width] duration-300 ease-in-out lg:flex print:hidden",
          collapsed ? "lg:w-19" : "lg:w-64"
        )}
      >
        <nav className="sidebar-scroll flex-1 overflow-x-hidden overflow-y-auto pb-3 pt-4">
          <NavItemsList
            role={session.role}
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
          />
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
        <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] animate-in slide-in-from-left flex-col bg-linear-to-b from-primary via-primary-strong to-[#8e0b1f] shadow-2xl duration-300 ease-out lg:hidden print:hidden">
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
            <NavItemsList role={session.role} onItemClick={() => setMobileOpen(false)} />
          </nav>

          <div className="mt-auto border-t border-white/10 p-4">
            <LogoutButton />
          </div>
        </aside>
      )}

      {/* Top Bar (Unified Desktop & Mobile) */}
      <TopBar session={session} onOpenMobile={() => setMobileOpen(true)} />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex min-h-screen w-full flex-col transition-[padding] duration-300 ease-in-out print:pl-0",
          collapsed ? "lg:pl-19" : "lg:pl-64"
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
