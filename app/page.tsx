import { redirect } from "next/navigation";
import { homePathForRole, requireAuth } from "@/lib/auth/session";

export default async function Home() {
  const session = await requireAuth();
  redirect(homePathForRole(session.role));
}
