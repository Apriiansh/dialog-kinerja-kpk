import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 1,
});
const prisma = new PrismaClient({ adapter });

const MASTER_METODE = [
  "Penugasan",
  "Pendidikan dan Pelatihan",
  "Mutasi",
  "Lainnya (Freetext)",
];

const USERS = [
  {
    npp: "1000001",
    nama_pegawai: "Bambang Sutrisno",
    nama_jabatan: "Kepala Bidang",
    unit_kerja: "Biro SDM",
    role: "ATASAN",
    password: "atasan123",
  },
  {
    npp: "2000001",
    nama_pegawai: "Siti Rahayu",
    nama_jabatan: "Pranata Kearsipan",
    unit_kerja: "Biro SDM",
    role: "PEGAWAI",
    password: "pegawai123",
  },
  {
    npp: "2000002",
    nama_pegawai: "Ahmad Fauzi",
    nama_jabatan: "Pranata Komputer",
    unit_kerja: "Biro SDM",
    role: "PEGAWAI",
    password: "pegawai123",
  },
] as const;

const LEGACY_DUMMY_NPPS = [
  "198001012000011001",
  "199505152022031002",
  "199203042019052003",
  "000000000000000",
  "111111111111111",
  "222222222222222",
];

async function main() {
  if ((await prisma.masterMetodePengembangan.count()) === 0) {
    await prisma.masterMetodePengembangan.createMany({
      data: MASTER_METODE.map((nama_metode) => ({ nama_metode })),
    });
    console.log(`Seeded ${MASTER_METODE.length} metode pengembangan.`);
  }

  await prisma.user.deleteMany({
    where: { npp: { in: LEGACY_DUMMY_NPPS } },
  });

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { npp: user.npp },
      update: {},
      create: {
        npp: user.npp,
        nama_pegawai: user.nama_pegawai,
        nama_jabatan: user.nama_jabatan,
        unit_kerja: user.unit_kerja,
        role: user.role,
        password: await bcrypt.hash(user.password, 10),
      },
    });
  }
  console.log(`Seeded ${USERS.length} user contoh.`);
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
