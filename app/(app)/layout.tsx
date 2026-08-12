import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  return (
    <AppShell
      session={{
        id: session.id,
        npp: session.npp,
        nama: session.nama,
        role: session.role,
      }}
    >
      {children}
    </AppShell>
  );
}
