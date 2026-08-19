"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

export async function markAsRead(notificationId: number): Promise<void> {
  const session = await requireAuth();

  await prisma.notification.updateMany({
    where: { id: notificationId, id_user: session.id },
    data: { is_read: true },
  });

  revalidatePath("/pegawai/notifikasi");
  revalidatePath("/atasan/notifikasi");
  revalidatePath("/admin/notifikasi");
}

export async function markAllAsRead(): Promise<void> {
  const session = await requireAuth();

  await prisma.notification.updateMany({
    where: { id_user: session.id, is_read: false },
    data: { is_read: true },
  });

  revalidatePath("/pegawai/notifikasi");
  revalidatePath("/atasan/notifikasi");
  revalidatePath("/admin/notifikasi");
}

export async function getUnreadCountAction(): Promise<number> {
  const session = await requireAuth();
  return prisma.notification.count({
    where: { id_user: session.id, is_read: false },
  });
}
