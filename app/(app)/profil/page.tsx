import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";

export default async function GenericProfileRedirectPage() {
  const session = await requireAuth();
  redirect(`/${session.role.toLowerCase()}/profil`);
}
