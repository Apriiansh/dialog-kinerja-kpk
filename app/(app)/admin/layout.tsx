import { AppShell } from "@/components/shared/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("ADMIN");
  return (
    <AppShell
      session={{
        id: session.id,
        npp: session.npp,
        nama: session.nama,
        role: session.role,
        roles: session.roles,
      }}
    >
      {children}
    </AppShell>
  );
}