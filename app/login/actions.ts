"use server";

import { getIronSession } from "iron-session";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sessionOptions, type SessionData } from "@/lib/session";

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

  const user = await prisma.user.findUnique({ where: { npp } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "NPP atau kata sandi salah." };
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  session.id = user.id;
  session.npp = user.npp;
  session.nama = user.nama_pegawai;
  session.role = user.role;
  await session.save();

  redirect("/dashboard");
}
