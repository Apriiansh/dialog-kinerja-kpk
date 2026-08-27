import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/auth/session";

type NotificationType =
  | "dialog_status"
  | "reviu_status"
  | "reviu_reminder"
  | "evaluasi_reminder"
  | "chat_message"
  | "email_verification";

interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  description: string;
  link: string;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  await prisma.notification.create({
    data: {
      id_user: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      link: input.link,
    },
  });
}

export async function createNotifications(
  inputs: CreateNotificationInput[],
): Promise<void> {
  if (inputs.length === 0) return;
  await prisma.notification.createMany({
    data: inputs.map((input) => ({
      id_user: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      link: input.link,
    })),
  });
}

export async function ensureEmailVerificationNotification({
  userId,
  role,
}: {
  userId: number;
  role: Role;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, email_verified_at: true, is_admin: true },
  });
  if (!user || user.is_admin || !user.email || user.email_verified_at) return;

  const link = `/${role.toLowerCase()}/profil`;
  await prisma.$transaction([
    prisma.notification.deleteMany({
      where: { id_user: userId, type: "email_verification" },
    }),
    prisma.notification.create({
      data: {
        id_user: userId,
        type: "email_verification",
        title: "Email Belum Diverifikasi",
        description:
          "Email akun Anda belum diverifikasi. Buka profil untuk menandai alamat email sebagai terverifikasi.",
        link,
      },
    }),
  ]);
}

export async function clearEmailVerificationNotifications(userId: number) {
  await prisma.notification.deleteMany({
    where: { id_user: userId, type: "email_verification" },
  });
}
