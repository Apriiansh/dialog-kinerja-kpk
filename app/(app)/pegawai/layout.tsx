import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/session";

export default async function PegawaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("PEGAWAI");
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
