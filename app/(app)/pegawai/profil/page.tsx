import { notFound } from "next/navigation";
import { requireRole, capabilitiesForUser } from "@/lib/session";
import { getUserProfileData } from "@/lib/profile-queries";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata = {
  title: "Profil Saya - Dialog Kinerja KPK",
};

export default async function PegawaiProfilePage() {
  const session = await requireRole("PEGAWAI");
  const user = await getUserProfileData(session.id);

  if (!user) {
    notFound();
  }

  const allowedRoles = capabilitiesForUser(user);

  return (
    <ProfileView
      user={user}
      activeRole={session.role}
      allowedRoles={allowedRoles}
    />
  );
}
