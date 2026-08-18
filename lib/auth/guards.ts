import { prisma } from "@/lib/prisma";
import { capabilitiesForUser, type SessionData } from "@/lib/auth/session";

export async function assertActiveActor(
  userId: number,
): Promise<string | null> {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_active: true },
  });
  return actor?.is_active ? null : "Sesi tidak valid — akun dinonaktifkan.";
}

export async function backfillSessionRoles(session: SessionData) {
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      is_admin: true,
      as_pegawai: true,
      default_role: true,
      is_active: true,
    },
  });
  if (!user) return;

  const roles = capabilitiesForUser(user);
  session.roles = roles;
  if (!session.role || !roles.includes(session.role)) {
    session.role = roles.includes(user.default_role)
      ? user.default_role
      : roles[0];
  }
}