import { requireAuth } from "@/lib/auth/session";
import { backfillSessionRoles } from "@/lib/auth/guards";
import { ensureEmailVerificationNotification } from "@/lib/notifications";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  await backfillSessionRoles(session);
  if (session.role !== "ADMIN") {
    await ensureEmailVerificationNotification({
      userId: session.id,
      role: session.role,
    });
  }
  return children;
}
