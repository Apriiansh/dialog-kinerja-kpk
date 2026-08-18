"use server";

import { prisma } from "@/lib/prisma";
import {
  capabilitiesForUser,
  getSession,
  homePathForRole,
  type Role,
} from "@/lib/auth/session";
import { flashRedirect } from "@/lib/utils/flash";

export async function logoutAction() {
  const session = await getSession();
  await session.destroy();
  flashRedirect("/login", {
    type: "success",
    title: "Berhasil keluar",
  });
}

export async function switchRole(target: Role) {
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { is_admin: true, as_pegawai: true, is_active: true },
  });

  if (!user || !user.is_active) {
    await session.destroy();
    flashRedirect("/login", {
      type: "info",
      title: "Sesi berakhir",
    });
  }

  const roles = capabilitiesForUser(user);
  if (!roles.includes(target)) {
    flashRedirect(homePathForRole(session.role ?? roles[0]), {
      type: "warning",
      title: "Peran tidak tersedia untuk akun Anda",
    });
  }

  session.role = target;
  session.roles = roles;
  await session.save();
  flashRedirect(homePathForRole(target), {
    type: "success",
    title: `Beralih peran ke ${target === "ADMIN" ? "Admin" : target === "ATASAN" ? "Atasan" : "Pegawai"}`,
  });
}