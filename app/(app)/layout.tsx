import { requireAuth } from "@/lib/session";
import { backfillSessionRoles } from "@/lib/auth-helpers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  await backfillSessionRoles(session);
  return children;
}