import { requireAuth } from "@/lib/auth/session";
import { backfillSessionRoles } from "@/lib/auth/guards";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  await backfillSessionRoles(session);
  return children;
}