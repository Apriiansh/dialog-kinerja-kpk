import { prisma } from "@/lib/prisma";

const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  title: true,
  description: true,
  link: true,
  is_read: true,
  created_at: true,
} as const;

export async function getNotificationsByUser(
  userId: number,
  page: number = 1,
  limit: number = 20,
) {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { id_user: userId },
      select: NOTIFICATION_SELECT,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({
      where: { id_user: userId },
    }),
  ]);

  return {
    notifications,
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
}

export async function getUnreadCount(userId: number): Promise<number> {
  return prisma.notification.count({
    where: { id_user: userId, is_read: false },
  });
}

export async function getRecentNotifications(
  userId: number,
  limit: number = 5,
) {
  return prisma.notification.findMany({
    where: { id_user: userId },
    select: NOTIFICATION_SELECT,
    orderBy: { created_at: "desc" },
    take: limit,
  });
}
