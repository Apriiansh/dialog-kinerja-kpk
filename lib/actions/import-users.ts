"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  normalizeRow,
  validateRow,
  cellToDigits,
  matchUnitKerja,
  type UnitKerjaOption,
  type ImportRowInput,
  type ImportPreviewRow,
  type ImportRowAction,
  type ImportAction,
  type ImportResult,
  type UnmatchedUnitPolicy,
} from "@/lib/import-utils";

/* ------------------------------------------------------------------ */
/*  Preview server action                                             */
/* ------------------------------------------------------------------ */

export async function importUsersPreview(
  rawRows: ImportRowInput[],
): Promise<ImportPreviewRow[]> {
  await requireRole("ADMIN");

  const unitOptions: UnitKerjaOption[] = (
    await prisma.unitKerja.findMany({
      select: { id: true, nama_unit: true },
    })
  ).map((u) => ({ id: u.id, nama_unit: u.nama_unit }));

  const allNpps = new Set<string>();
  const allNips = new Set<string>();

  for (const raw of rawRows) {
    const npp = cellToDigits(raw.npp);
    const nip = cellToDigits(raw.nip);
    if (npp) allNpps.add(npp);
    if (nip) allNips.add(nip);
  }

  const existingUsers = await prisma.user.findMany({
    where: {
      OR: [
        { npp: { in: [...allNpps] } },
        ...(allNips.size > 0 ? [{ nip: { in: [...allNips] } }] : []),
      ],
    },
    select: { id: true, npp: true, nip: true },
  });

  const nppToUser = new Map<string, (typeof existingUsers)[number]>();
  const nipToUser = new Map<string, (typeof existingUsers)[number]>();
  for (const u of existingUsers) {
    nppToUser.set(u.npp, u);
    if (u.nip) nipToUser.set(u.nip, u);
  }

  const allAtasanNpps = new Set<string>();
  for (const raw of rawRows) {
    const atasanNpp = cellToDigits(raw.atasan_npp);
    if (atasanNpp) allAtasanNpps.add(atasanNpp);
  }

  const atasanUsers =
    allAtasanNpps.size > 0
      ? await prisma.user.findMany({
          where: { npp: { in: [...allAtasanNpps] } },
          select: { id: true, npp: true },
        })
      : [];

  const atasanMap = new Map<string, number>();
  for (const u of atasanUsers) {
    atasanMap.set(u.npp, u.id);
  }

  const seenNpps = new Set<string>();
  const seenNips = new Set<string>();

  return rawRows.map((raw, idx) => {
    const row = normalizeRow(raw);
    const error = validateRow(row, atasanMap);
    const unitMatch = matchUnitKerja(row.unit_kerja, unitOptions);

    if (error) {
      return {
        rowIndex: idx,
        ...row,
        status: "error" as const,
        existingUserId: null,
        errorMessage: error,
        suggestedAction: "skip" as const,
        unitKerjaId: unitMatch?.id ?? null,
        unitMatched: unitMatch !== null,
      };
    }

    const existingByNpp = row.npp ? nppToUser.get(row.npp) : undefined;
    const existingByNip =
      !existingByNpp && row.nip ? nipToUser.get(row.nip) : undefined;
    const existing = existingByNpp ?? existingByNip;

    const nppConflict = row.npp && seenNpps.has(row.npp) && !existingByNpp;
    const nipConflict = row.nip && seenNips.has(row.nip) && !existingByNip;

    if (nppConflict || nipConflict) {
      return {
        rowIndex: idx,
        ...row,
        status: "error" as const,
        existingUserId: null,
        errorMessage: "NPP atau NIP duplikat dalam file yang sama.",
        suggestedAction: "skip" as const,
        unitKerjaId: unitMatch?.id ?? null,
        unitMatched: unitMatch !== null,
      };
    }

    if (row.npp) seenNpps.add(row.npp);
    if (row.nip) seenNips.add(row.nip);

    if (existing) {
      return {
        rowIndex: idx,
        ...row,
        status: "existing" as const,
        existingUserId: existing.id,
        errorMessage: null,
        suggestedAction: "update" as const,
        unitKerjaId: unitMatch?.id ?? null,
        unitMatched: unitMatch !== null,
      };
    }

    return {
      rowIndex: idx,
      ...row,
      status: "new" as const,
      existingUserId: null,
      errorMessage: null,
      suggestedAction: "create" as const,
      unitKerjaId: unitMatch?.id ?? null,
      unitMatched: unitMatch !== null,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Execute server action                                             */
/* ------------------------------------------------------------------ */

export async function importUsersExecute(
  rawRows: ImportRowInput[],
  actions: ImportRowAction[],
  policy: UnmatchedUnitPolicy = "keep",
): Promise<ImportResult> {
  await requireRole("ADMIN");

  const unitOptions: UnitKerjaOption[] = (
    await prisma.unitKerja.findMany({
      select: { id: true, nama_unit: true },
    })
  ).map((u) => ({ id: u.id, nama_unit: u.nama_unit }));

  const actionMap = new Map<number, ImportAction>();
  for (const a of actions) {
    actionMap.set(a.rowIndex, a.action);
  }

  const allAtasanNpps = new Set<string>();
  const allNpps = new Set<string>();
  const allNips = new Set<string>();

  for (const raw of rawRows) {
    const row = normalizeRow(raw);
    const action = actionMap.get(rawRows.indexOf(raw));
    if (action === "skip") continue;

    allNpps.add(row.npp);
    if (row.nip) allNips.add(row.nip);
    if (row.atasan_npp) allAtasanNpps.add(row.atasan_npp);
  }

  const existingUsers = await prisma.user.findMany({
    where: {
      OR: [
        { npp: { in: [...allNpps] } },
        ...(allNips.size > 0 ? [{ nip: { in: [...allNips] } }] : []),
      ],
    },
    select: { id: true, npp: true, nip: true },
  });

  const nppToUser = new Map<string, (typeof existingUsers)[number]>();
  const nipToUser = new Map<string, (typeof existingUsers)[number]>();
  for (const u of existingUsers) {
    nppToUser.set(u.npp, u);
    if (u.nip) nipToUser.set(u.nip, u);
  }

  const atasanUsers =
    allAtasanNpps.size > 0
      ? await prisma.user.findMany({
          where: { npp: { in: [...allAtasanNpps] } },
          select: { id: true, npp: true },
        })
      : [];

  const atasanMap = new Map<string, number>();
  for (const u of atasanUsers) {
    atasanMap.set(u.npp, u.id);
  }

  const result: ImportResult = {
    success: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const defaultPassword = await bcrypt.hash("password", 10);

  for (let idx = 0; idx < rawRows.length; idx++) {
    const action = actionMap.get(idx) ?? "skip";
    const raw = rawRows[idx];
    const row = normalizeRow(raw);

    if (action === "skip") {
      result.skipped++;
      continue;
    }

    const error = validateRow(row, atasanMap);
    if (error) {
      result.errors.push({
        rowIndex: idx,
        npp: row.npp,
        nama_pegawai: row.nama_pegawai,
        message: error,
      });
      continue;
    }

    const unitMatch = matchUnitKerja(row.unit_kerja, unitOptions);
    if (row.unit_kerja && !unitMatch && policy === "skip") {
      result.skipped++;
      continue;
    }

    const tanggal = row.tanggal_bergabung
      ? new Date(row.tanggal_bergabung)
      : null;

    const atasanId =
      row.default_role === "ADMIN"
        ? null
        : row.atasan_npp
          ? atasanMap.get(row.atasan_npp) ?? null
          : null;

    if (action === "create") {
      const conflict =
        nppToUser.get(row.npp) ??
        (row.nip ? nipToUser.get(row.nip) : undefined);
      if (conflict) {
        result.errors.push({
          rowIndex: idx,
          npp: row.npp,
          nama_pegawai: row.nama_pegawai,
          message: "NPP atau NIP sudah terdaftar.",
        });
        continue;
      }

      try {
        const newUser = await prisma.user.create({
          data: {
            npp: row.npp,
            nip: row.nip || null,
            nama_pegawai: row.nama_pegawai,
            tanggal_bergabung: tanggal,
            nama_jabatan: row.nama_jabatan || null,
            unit_kerja: row.unit_kerja || null,
            unit_kerja_id: unitMatch?.id ?? null,
            masa_kerja_unit_terakhir: row.masa_kerja_unit_terakhir || null,
            password: defaultPassword,
            default_role: row.default_role,
            is_admin: row.default_role === "ADMIN",
            as_pegawai: row.default_role === "PEGAWAI",
            is_active: true,
            id_atasan: atasanId,
          },
        });
        nppToUser.set(row.npp, {
          id: newUser.id,
          npp: row.npp,
          nip: row.nip,
        });
        if (row.nip) {
          nipToUser.set(row.nip, {
            id: newUser.id,
            npp: row.npp,
            nip: row.nip,
          });
        }
        result.success++;
      } catch (e) {
        if (
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          (e as { code: string }).code === "P2002"
        ) {
          result.errors.push({
            rowIndex: idx,
            npp: row.npp,
            nama_pegawai: row.nama_pegawai,
            message: "NPP atau NIP sudah terdaftar.",
          });
        } else {
          result.errors.push({
            rowIndex: idx,
            npp: row.npp,
            nama_pegawai: row.nama_pegawai,
            message: "Gagal menyimpan. Silakan coba lagi.",
          });
        }
      }
    } else if (action === "update") {
      const existing =
        nppToUser.get(row.npp) ??
        (row.nip ? nipToUser.get(row.nip) : undefined);
      if (!existing) {
        result.errors.push({
          rowIndex: idx,
          npp: row.npp,
          nama_pegawai: row.nama_pegawai,
          message: "Pengguna tidak ditemukan untuk diperbarui.",
        });
        continue;
      }

      try {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            npp: row.npp,
            nip: row.nip || null,
            nama_pegawai: row.nama_pegawai,
            tanggal_bergabung: tanggal,
            nama_jabatan: row.nama_jabatan || null,
            unit_kerja: row.unit_kerja || null,
            unit_kerja_id: unitMatch?.id ?? null,
            masa_kerja_unit_terakhir: row.masa_kerja_unit_terakhir || null,
            default_role: row.default_role,
            is_admin: row.default_role === "ADMIN",
            as_pegawai: row.default_role === "PEGAWAI",
            id_atasan: atasanId,
          },
        });
        result.updated++;
      } catch (e) {
        if (
          typeof e === "object" &&
          e !== null &&
          "code" in e &&
          (e as { code: string }).code === "P2002"
        ) {
          result.errors.push({
            rowIndex: idx,
            npp: row.npp,
            nama_pegawai: row.nama_pegawai,
            message: "NPP atau NIP sudah terdaftar.",
          });
        } else {
          result.errors.push({
            rowIndex: idx,
            npp: row.npp,
            nama_pegawai: row.nama_pegawai,
            message: "Gagal memperbarui. Silakan coba lagi.",
          });
        }
      }
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return result;
}
