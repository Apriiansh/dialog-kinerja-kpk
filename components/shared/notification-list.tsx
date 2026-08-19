"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircleIcon, BellIcon } from "@phosphor-icons/react";
import { markAsRead, markAllAsRead } from "@/lib/actions/notification";
import { formatDistanceToNow } from "@/lib/utils/format";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  description: string;
  link: string;
  is_read: boolean;
  created_at: Date | string;
}

export function NotificationList({
  initialNotifications,
  role,
}: {
  initialNotifications: NotificationItem[];
  role: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function handleClick(notification: NotificationItem) {
    if (!notification.is_read) {
      await markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n,
        ),
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold leading-9 tracking-[-0.01em] text-ink">
            Notifikasi
          </h1>
          <p className="text-sm leading-5 text-ink-muted">
            {unreadCount > 0
              ? `Anda memiliki ${unreadCount} notifikasi yang belum dibaca`
              : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-outline px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-muted cursor-pointer"
          >
            <CheckCircleIcon size={14} weight="bold" />
            Tandai Semua Dibaca
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-outline bg-surface px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-muted text-primary">
            <BellIcon size={22} weight="bold" />
          </span>
          <h3 className="text-base font-semibold text-ink">
            Tidak ada notifikasi
          </h3>
          <p className="max-w-sm text-sm leading-5 text-ink-muted">
            Notifikasi akan muncul di sini ketika ada aktivitas terkait dialog
            kinerja atau reviu Anda.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link
                href={notification.link}
                onClick={() => handleClick(notification)}
                className={`flex gap-4 rounded-lg border bg-surface px-5 py-4 transition-colors hover:border-outline-strong hover:shadow-ambient ${
                  notification.is_read
                    ? "border-outline"
                    : "border-l-primary border-l-2 border-outline"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm ${
                      notification.is_read
                        ? "font-medium text-ink"
                        : "font-semibold text-ink"
                    }`}
                  >
                    {notification.title}
                  </p>
                  <p className="mt-1 text-xs leading-4 text-ink-muted line-clamp-2">
                    {notification.description}
                  </p>
                  <p className="mt-1.5 text-[10px] text-ink-muted">
                    {formatDistanceToNow(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
