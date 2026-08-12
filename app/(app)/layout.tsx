import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  return <AppShell session={session}>{children}</AppShell>;
}
