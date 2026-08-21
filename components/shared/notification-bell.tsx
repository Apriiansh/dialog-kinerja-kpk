"use client";

import { useEffect, useState, useRef } from "react";
import { BellIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUnreadCountAction, markAsRead, getRecentNotificationsAction } from "@/lib/actions/notification";
import { formatDistanceToNow } from "@/lib/utils/format";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  description: string;
  link: string;
  is_read: boolean;
  created_at: Date;
}

export function NotificationBell({ role }: { role: string }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const count = await getUnreadCountAction();
        if (!cancelled) setUnreadCount(count);
        if (count > 0) {
          const notifications = await getRecentNotificationsAction(5);
          if (!cancelled) {
            setRecent(
              notifications.map((n) => ({
                ...n,
                created_at: new Date(n.created_at),
              }))
            );
          }
        }
      } catch {
        // silent fail
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function handleFocus() {
      try {
        const count = await getUnreadCountAction();
        setUnreadCount(count);
        if (count > 0) {
          const notifications = await getRecentNotificationsAction(5);
          setRecent(
            notifications.map((n) => ({
              ...n,
              created_at: new Date(n.created_at),
            }))
          );
        }
      } catch {
        // silent fail
      }
    }
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  async function handleNotificationClick(notification: NotificationItem) {
    if (!notification.is_read) {
      await markAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setRecent((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
    }
    setOpen(false);
    router.push(notification.link);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        aria-label="Notifikasi"
      >
        <BellIcon size={18} weight="bold" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-outline bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-outline px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">Notifikasi</h3>
            {unreadCount > 0 && (
              <Link
                href={`/${role}/notifikasi`}
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Lihat Semua
              </Link>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-ink-muted">Tidak ada notifikasi baru</p>
              </div>
            ) : (
              recent.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-surface-muted ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">
                        {notification.description}
                      </p>
                      <p className="mt-1 text-[10px] text-ink-muted">
                        {formatDistanceToNow(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {recent.length > 0 && (
            <div className="border-t border-outline px-4 py-2">
              <Link
                href={`/${role}/notifikasi`}
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-medium text-primary hover:underline"
              >
                Lihat Semua Notifikasi
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
