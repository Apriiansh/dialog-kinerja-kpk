import { prisma } from "@/lib/prisma";

type NotificationType = "dialog_status" | "reviu_status" | "reviu_reminder";

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
