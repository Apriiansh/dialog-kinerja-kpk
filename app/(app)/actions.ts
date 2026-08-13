"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  capabilitiesForUser,
  getSession,
  homePathForRole,
  type Role,
} from "@/lib/session";

export async function logoutAction() {
  const session = await getSession();
  await session.destroy();
  redirect("/login");
}

export async function switchRole(target: Role) {
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { is_admin: true, as_pegawai: true, is_active: true },
  });

  if (!user || !user.is_active) {
    await session.destroy();
    redirect("/login");
  }

  const roles = capabilitiesForUser(user);
  if (!roles.includes(target)) {
    redirect(homePathForRole(session.role ?? roles[0]));
  }

  session.role = target;
  session.roles = roles;
  await session.save();
  redirect(homePathForRole(target));
}