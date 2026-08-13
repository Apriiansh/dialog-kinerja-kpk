import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Role } from "../generated/prisma/client";

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

interface SeedUser {
  npp: string;
  nip: string;
  nama_pegawai: string;
  nama_jabatan: string;
  unit_kerja: string;
  tanggal_bergabung: Date;
  masa_kerja_unit_terakhir: string;
  default_role: Role;
  as_pegawai: boolean;
  is_admin: boolean;
  is_active: boolean;
  atasan_npp: string | null;
  password: string;
}

const USERS: SeedUser[] = [
  {
    npp: "9000001",
    nip: "198001012000011005",
    nama_pegawai: "Admin Sistem",
    nama_jabatan: "Administrator",
    unit_kerja: "Biro SDM",
    tanggal_bergabung: new Date("2020-01-15"),
    masa_kerja_unit_terakhir: "12 Tahun 4 Bulan 10 Hari",
    default_role: "ADMIN",
    as_pegawai: false,
    is_admin: true,
    is_active: true,
    atasan_npp: null,
    password: "admin123",
  },
  {
    npp: "1000001",
    nip: "197503142000121001",
    nama_pegawai: "Bambang Sutrisno",
    nama_jabatan: "Kepala Bidang",
    unit_kerja: "Biro SDM",
    tanggal_bergabung: new Date("2007-03-01"),
    masa_kerja_unit_terakhir: "18 Tahun 6 Bulan 5 Hari",
    default_role: "ATASAN",
    as_pegawai: false,
    is_admin: false,
    is_active: true,
    atasan_npp: null,
    password: "atasan123",
  },
  {
    npp: "1000002",
    nip: "197906202005021002",
    nama_pegawai: "Agus Prasetyo",
    nama_jabatan: "Kepala Seksi",
    unit_kerja: "Biro Umum",
    tanggal_bergabung: new Date("2010-06-15"),
    masa_kerja_unit_terakhir: "15 Tahun 2 Bulan 20 Hari",
    default_role: "ATASAN",
    as_pegawai: false,
    is_admin: false,
    is_active: true,
    atasan_npp: null,
    password: "atasan123",
  },
  {
    npp: "2000001",
    nip: "198801122010122002",
    nama_pegawai: "Siti Rahayu",
    nama_jabatan: "Pranata Kearsipan",
    unit_kerja: "Biro SDM",
    tanggal_bergabung: new Date("2016-09-01"),
    masa_kerja_unit_terakhir: "9 Tahun 3 Bulan 14 Hari",
    default_role: "PEGAWAI",
    as_pegawai: true,
    is_admin: false,
    is_active: true,
    atasan_npp: "1000001",
    password: "pegawai123",
  },
  {
    npp: "2000002",
    nip: "199202052011021003",
    nama_pegawai: "Ahmad Fauzi",
    nama_jabatan: "Pranata Komputer",
    unit_kerja: "Biro SDM",
    tanggal_bergabung: new Date("2017-01-02"),
    masa_kerja_unit_terakhir: "8 Tahun 11 Bulan 7 Hari",
    default_role: "PEGAWAI",
    as_pegawai: true,
    is_admin: false,
    is_active: true,
    atasan_npp: "1000001",
    password: "pegawai123",
  },
  {
    npp: "2000003",
    nip: "199505152016032004",
    nama_pegawai: "Dewi Lestari",
    nama_jabatan: "Arsiparis",
    unit_kerja: "Biro SDM",
    tanggal_bergabung: new Date("2020-04-01"),
    masa_kerja_unit_terakhir: "5 Tahun 7 Bulan 3 Hari",
    default_role: "PEGAWAI",
    as_pegawai: true,
    is_admin: false,
    is_active: true,
    atasan_npp: "2000001",
    password: "pegawai123",
  },
  {
    npp: "2000004",
    nip: "199107202013041005",
    nama_pegawai: "Rudi Hartono",
    nama_jabatan: "Pengelola Kepegawaian",
    unit_kerja: "Biro SDM",
    tanggal_bergabung: new Date("2019-08-01"),
    masa_kerja_unit_terakhir: "6 Tahun 1 Bulan 25 Hari",
    default_role: "PEGAWAI",
    as_pegawai: true,
    is_admin: false,
    is_active: true,
    atasan_npp: "2000001",
    password: "pegawai123",
  },
  {
    npp: "2000005",
    nip: "199310252017051006",
    nama_pegawai: "Maya Sari",
    nama_jabatan: "Analis Kepegawaian",
    unit_kerja: "Biro SDM",
    tanggal_bergabung: new Date("2021-02-01"),
    masa_kerja_unit_terakhir: "4 Tahun 9 Bulan 12 Hari",
    default_role: "PEGAWAI",
    as_pegawai: true,
    is_admin: false,
    is_active: true,
    atasan_npp: "2000002",
    password: "pegawai123",
  },
  {
    npp: "2000006",
    nip: "198712012008041007",
    nama_pegawai: "Putri Handayani",
    nama_jabatan: "Pranata Keuangan",
    unit_kerja: "Biro SDM",
    tanggal_bergabung: new Date("2015-11-02"),
    masa_kerja_unit_terakhir: "10 Tahun 5 Bulan 18 Hari",
    default_role: "PEGAWAI",
    as_pegawai: true,
    is_admin: false,
    is_active: false,
    atasan_npp: "1000001",
    password: "pegawai123",
  },
  {
    npp: "2000007",
    nip: "199408152018061008",
    nama_pegawai: "Bayu Pratama",
    nama_jabatan: "Pengelola Administrasi Umum",
    unit_kerja: "Biro Umum",
    tanggal_bergabung: new Date("2022-05-02"),
    masa_kerja_unit_terakhir: "3 Tahun 6 Bulan 9 Hari",
    default_role: "PEGAWAI",
    as_pegawai: true,
    is_admin: false,
    is_active: true,
    atasan_npp: "1000002",
    password: "pegawai123",
  },
  {
    npp: "2000008",
    nip: "199601302019071009",
    nama_pegawai: "Intan Permata",
    nama_jabatan: "Pengelola Barang Milik Negara",
    unit_kerja: "Biro Umum",
    tanggal_bergabung: new Date("2023-07-03"),
    masa_kerja_unit_terakhir: "2 Tahun 4 Bulan 16 Hari",
    default_role: "PEGAWAI",
    as_pegawai: true,
    is_admin: false,
    is_active: true,
    atasan_npp: "1000002",
    password: "pegawai123",
  },
];

const LEGACY_DUMMY_NPPS = [
  "198001012000011001",
  "199505152022031002",
  "199203042019052003",
  "000000000000000",
  "111111111111111",
  "222222222222222",
];

function upsertData(user: SeedUser, hashedPassword: string) {
  const common = {
    nip: user.nip,
    nama_pegawai: user.nama_pegawai,
    nama_jabatan: user.nama_jabatan,
    unit_kerja: user.unit_kerja,
    tanggal_bergabung: user.tanggal_bergabung,
    masa_kerja_unit_terakhir: user.masa_kerja_unit_terakhir,
    default_role: user.default_role,
    as_pegawai: user.as_pegawai,
    is_admin: user.is_admin,
    is_active: user.is_active,
    password: hashedPassword,
  };
  return {
    create: { ...common, npp: user.npp },
    update: common,
  };
}

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

  const idByNpp = new Map<string, number>();

  for (const user of USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const { create, update } = upsertData(user, hashedPassword);
    const record = await prisma.user.upsert({
      where: { npp: user.npp },
      create,
      update,
    });
    idByNpp.set(user.npp, record.id);
  }

  for (const user of USERS) {
    if (!user.atasan_npp) continue;
    const idAtasan = idByNpp.get(user.atasan_npp);
    if (!idAtasan) continue;
    await prisma.user.update({
      where: { npp: user.npp },
      data: { id_atasan: idAtasan },
    });
  }

  const activeCount = USERS.filter((u) => u.is_active).length;
  const inactiveCount = USERS.length - activeCount;
  const withBawahan = new Set(USERS.map((u) => u.atasan_npp).filter(Boolean));
  console.log(
    `Seeded ${USERS.length} user (${activeCount} aktif, ${inactiveCount} nonaktif), ` +
      `${withBawahan.size} di antaranya punya bawahan.`,
  );
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