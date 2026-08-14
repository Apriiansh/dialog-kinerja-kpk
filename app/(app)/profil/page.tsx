import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/session";

export default async function GenericProfileRedirectPage() {
  const session = await requireAuth();
  redirect(`/${session.role.toLowerCase()}/profil`);
}
