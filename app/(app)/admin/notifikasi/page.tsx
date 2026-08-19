import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { NotificationList } from "@/components/shared/notification-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifikasi — Dialog Kinerja",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminNotifikasiPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await searchParams;
  const session = await requireRole("ADMIN");

  const notifications = await prisma.notification.findMany({
    where: { id_user: session.id },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      link: true,
      is_read: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  return (
    <NotificationList
      initialNotifications={notifications.map((n) => ({
        ...n,
        created_at: n.created_at.toISOString(),
      }))}
    />
  );
}
