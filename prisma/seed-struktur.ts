import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "" });
const prisma = new PrismaClient({ adapter });

interface UnitNode {
  nama_unit: string;
  jenis?: string | null;
  kepala_jabatan?: string | null;
  children?: UnitNode[];
}

const jsonPath = path.resolve(
  process.cwd(),
  "public",
  "struktur_kpk.json",
);

async function importTree(
  node: UnitNode,
  parentId: number | null,
  parentLevel: number,
  created: string[],
): Promise<void> {
  const level = parentLevel + 1;
  const unit = await prisma.unitKerja.create({
    data: {
      nama_unit: node.nama_unit,
      jenis: node.jenis ?? null,
      kepala_jabatan: node.kepala_jabatan ?? null,
      parent_id: parentId,
      level,
      is_active: true,
    },
    select: { id: true, nama_unit: true },
  });
  created.push(`${"  ".repeat(parentLevel)}${unit.nama_unit} (level ${level})`);

  for (const child of node.children ?? []) {
    await importTree(child, unit.id, level, created);
  }
}

const SKIP_NAMES = new Set(["DEWAN PENGAWAS"]);

async function main() {
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const root = raw.struktur_organisasi as UnitNode;
  if (!root) {
    throw new Error("struktur_organisasi tidak ditemukan di JSON.");
  }

  const created: string[] = [];
  for (const child of root.children ?? []) {
    if (SKIP_NAMES.has(child.nama_unit)) continue;
    await importTree(child, null, 0, created);
  }

  const total = await prisma.unitKerja.count();
  console.log(`Berhasil mengimpor ${created.length} unit (total ${total} di DB).`);
  console.log(created.join("\n"));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
