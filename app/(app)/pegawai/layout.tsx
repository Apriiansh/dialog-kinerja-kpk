import { AppShell } from "@/components/shared/app-shell";
import { EvaluasiReminderBanner } from "@/components/shared/evaluasi-reminder-banner";
import { requireRole } from "@/lib/auth/session";
import { getActiveEvaluasiReminders } from "@/lib/queries/reviu";
import { checkUpcomingReviuReminders } from "@/lib/actions/recurring-notifications";

export default async function PegawaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("PEGAWAI");
  checkUpcomingReviuReminders().catch(() => {});
  const reminders = await getActiveEvaluasiReminders(session.id, "PEGAWAI");

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
      <EvaluasiReminderBanner reminders={reminders} role="PEGAWAI" />
      {children}
    </AppShell>
  );
}
