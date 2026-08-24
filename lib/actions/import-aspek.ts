"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import type { JenisAspek, Triwulan } from "@/generated/prisma/client";
import {
  type JenisAspekImport,
  type AspekImportRowInput,
  type AspekImportPreviewRow,
  type AspekImportResult,
  buildNarasi,
} from "@/lib/import-aspek-utils";

/**
 * Preview parsed Excel rows before committing to staging table.
 */
export async function importAspekPreview(
  rawRows: AspekImportRowInput[],
  jenis: JenisAspekImport,
  tahun: number,
  triwulan: Triwulan,
): Promise<AspekImportPreviewRow[]> {
  await requireRole("ADMIN");

  if (!rawRows || rawRows.length === 0) return [];

  // Extract all unique NPPs from the input
  const npps = Array.from(
    new Set(
      rawRows
        .map((r) => String(r.npp ?? r.nip ?? "").trim())
        .filter((npp) => npp.length > 0),
    ),
  );

  // Look up users by NPP or NIP in one query
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { npp: { in: npps } },
        { nip: { in: npps } },
      ],
      is_active: true,
    },
    select: {
      id: true,
      npp: true,
      nip: true,
      nama_pegawai: true,
    },
  });

  const userMap = new Map<string, { id: number; nama: string; npp: string }>();
  for (const u of users) {
    userMap.set(u.npp.toLowerCase(), { id: u.id, nama: u.nama_pegawai, npp: u.npp });
    if (u.nip) {
      userMap.set(u.nip.toLowerCase(), { id: u.id, nama: u.nama_pegawai, npp: u.npp });
    }
  }

  const previewRows: AspekImportPreviewRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rawNpp = String(row.npp ?? row.nip ?? "").trim();
    const namaExcel = row.nama ? String(row.nama).trim() : undefined;

    if (!rawNpp) {
      previewRows.push({
        rowIndex: i,
        npp: "—",
        namaExcel,
        narasi: "—",
        status: "error",
        errorMessage: "NPP / NIP tidak boleh kosong.",
      });
      continue;
    }

    const matchedUser = userMap.get(rawNpp.toLowerCase());

    const { narasi, shouldInclude } = buildNarasi(jenis, row);

    if (!narasi.trim()) {
      previewRows.push({
        rowIndex: i,
        npp: rawNpp,
        namaExcel,
        namaDb: matchedUser?.nama,
        userId: matchedUser?.id,
        narasi: "—",
        status: "error",
        errorMessage: "Uraian / Narasi aspek tidak boleh kosong.",
      });
      continue;
    }

    if (!shouldInclude) {
      // e.g. for SKP where % >= 100% (already achieved, filtered out)
      previewRows.push({
        rowIndex: i,
        npp: rawNpp,
        namaExcel,
        namaDb: matchedUser?.nama,
        userId: matchedUser?.id,
        narasi,
        status: "error",
        errorMessage: "Dilewati: Capaian sudah 100% atau lebih.",
      });
      continue;
    }

    if (!matchedUser) {
      previewRows.push({
        rowIndex: i,
        npp: rawNpp,
        namaExcel,
        narasi,
        status: "npp_not_found",
        errorMessage: `NPP/NIP "${rawNpp}" tidak terdaftar dalam sistem pegawai aktif.`,
      });
      continue;
    }

    previewRows.push({
      rowIndex: i,
      npp: matchedUser.npp,
      namaExcel,
      namaDb: matchedUser.nama,
      userId: matchedUser.id,
      narasi,
      status: "valid",
    });
  }

  return previewRows;
}

/**
 * Execute import: insert valid rows into import_staging_items table.
 */
export async function importAspekExecute(
  rawRows: AspekImportRowInput[],
  jenis: JenisAspekImport,
  tahun: number,
  triwulan: Triwulan,
): Promise<AspekImportResult> {
  const session = await requireRole("ADMIN");

  const previews = await importAspekPreview(rawRows, jenis, tahun, triwulan);
  const validPreviews = previews.filter((p) => p.status === "valid");

  const errors: { rowIndex: number; npp: string; message: string }[] = previews
    .filter((p) => p.status !== "valid")
    .map((p) => ({
      rowIndex: p.rowIndex,
      npp: p.npp,
      message: p.errorMessage ?? "Data tidak valid",
    }));

  if (validPreviews.length === 0) {
    return {
      success: 0,
      skipped: errors.length,
      errors,
    };
  }

  const batchId = `batch_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date();

  // Prepare records to insert
  const itemsToCreate = validPreviews.map((p) => {
    const rawRow = rawRows[p.rowIndex];
    const { narasi, metadata } = buildNarasi(jenis, rawRow);

    return {
      jenis_aspek: jenis as JenisAspek,
      periode_tahun: tahun,
      triwulan: triwulan,
      npp: p.npp,
      narasi: narasi,
      metadata: (metadata as any) ?? undefined,
      batch_id: batchId,
      imported_by: session.id,
      imported_at: now,
      is_consumed: false,
    };
  });

  // Chunk insert in batches of 100 to prevent payload bottleneck
  const CHUNK_SIZE = 100;
  for (let i = 0; i < itemsToCreate.length; i += CHUNK_SIZE) {
    const chunk = itemsToCreate.slice(i, i + CHUNK_SIZE);
    await prisma.importStagingItem.createMany({
      data: chunk,
    });
  }

  return {
    success: validPreviews.length,
    skipped: errors.length,
    errors,
  };
}
