import { getIronSession, unsealData } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { cache } from "react";

export type Role = "ATASAN" | "PEGAWAI";

export interface SessionData {
  id: number;
  npp: string;
  nama: string;
  role: Role;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "dialog_kinerja_session",
  ttl: 60 * 60 * 12,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
} as const;

export const getSession = cache(async () => {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
});

export async function getRequestSession(request: NextRequest) {
  const cookie = request.cookies.get(sessionOptions.cookieName)?.value;
  if (!cookie) return null;
  try {
    return await unsealData<SessionData>(cookie, {
      password: sessionOptions.password,
      ttl: sessionOptions.ttl,
    });
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.id) redirect("/login");
  return session;
}

export function homePathForRole(role: Role) {
  return role === "ATASAN" ? "/atasan/dashboard" : "/pegawai/dashboard";
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.role)) redirect(homePathForRole(session.role));
  return session;
}
