"use server";

import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clearLoginAttempts, consumeLoginAttempt } from "@/lib/rate-limit";
import {
  capabilitiesForUser,
  homePathForRole,
  sessionOptions,
  type SessionData,
} from "@/lib/session";
import { flashRedirect } from "@/lib/flash";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const npp = String(formData.get("npp") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!npp || !password) {
    return { error: "NPP dan kata sandi wajib diisi." };
  }

  if (!/^\d{7}$/.test(npp)) {
    return { error: "NPP harus terdiri dari 7 digit angka." };
  }

  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";

  const limit = consumeLoginAttempt(ip, npp);
  if (!limit.allowed) {
    return {
      error: `Terlalu banyak percobaan login. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { npp } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "NPP atau kata sandi salah." };
  }
  if (!user.is_active) {
    return { error: "Akun Anda dinonaktifkan." };
  }

  clearLoginAttempts(ip, npp);

  const roles = capabilitiesForUser(user);
  const activeRole = roles.includes(user.default_role)
    ? user.default_role
    : roles[0]!;

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  session.id = user.id;
  session.npp = user.npp;
  session.nama = user.nama_pegawai;
  session.role = activeRole;
  session.roles = roles;
  await session.save();

  flashRedirect(homePathForRole(activeRole), {
    type: "success",
    title: `Selamat datang, ${user.nama_pegawai}`,
    description: `Anda masuk sebagai ${activeRole === "ADMIN" ? "Admin" : activeRole === "ATASAN" ? "Atasan" : "Pegawai"}.`,
  });
}
