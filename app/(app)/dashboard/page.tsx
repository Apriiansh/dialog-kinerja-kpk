import { AtasanDashboard } from "@/components/atasan-dashboard";
import { PegawaiDashboard } from "@/components/pegawai-dashboard";
import { requireAuth } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireAuth();

  if (session.role === "ATASAN") {
    return <AtasanDashboard />;
  }

  return <PegawaiDashboard searchParams={searchParams} />;
}
