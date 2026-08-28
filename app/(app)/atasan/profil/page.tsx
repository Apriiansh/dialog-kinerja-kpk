import { notFound } from "next/navigation";
import { requireRole, capabilitiesForUser } from "@/lib/auth/session";
import { getUserProfileData } from "@/lib/queries/profile";
import { ProfileView } from "@/components/profile/profile-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil Saya - Dialog Kinerja KPK",
};

export default async function AtasanProfilePage() {
  const session = await requireRole("ATASAN");
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
