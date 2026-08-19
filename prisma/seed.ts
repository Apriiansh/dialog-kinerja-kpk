import "dotenv/config";
import bcrypt from "bcryptjs";
import path from "node:path";
import zlib from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import {
  PrismaClient,
  Role,
  StatusDialog,
  StatusReviu,
  JenisAspek,
} from "../generated/prisma/client";

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
  "Lainnya...",
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

const TTD_DIR = path.join(process.cwd(), "uploads", "ttd");

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function makeSignaturePng(): Buffer {
  const width = 220;
  const height = 90;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((1 + width * 3) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const wave =
        Math.sin((x / width) * Math.PI * 6) * 14 +
        Math.sin((x / width) * Math.PI * 13) * 5;
      const center = height / 2 + wave;
      const isInk = Math.abs(y - center) < 3.5;
      const value = isInk ? 25 : 252;
      const idx = rowStart + 1 + x * 3;
      raw[idx] = value;
      raw[idx + 1] = value;
      raw[idx + 2] = value;
    }
  }

  const idat = zlib.deflateSync(raw);
  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function writeTtdPlaceholder(
  dialogId: number,
  role: "pegawai" | "atasan",
): Promise<string> {
  await mkdir(TTD_DIR, { recursive: true });
  const fileName = `ttd-${dialogId}-${role}-${Date.now()}.png`;
  await writeFile(path.join(TTD_DIR, fileName), makeSignaturePng());
  return `/api/ttd/${fileName}`;
}

interface AspekItemSeed {
  dialog_evaluasi: string;
  kompetensi_dikembangkan: string;
  metodeNama?: string;
  waktu_pelaksanaan?: Date;
}

interface AspekSeed {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string;
  tanggung_jawab_atasan: string;
  items: AspekItemSeed[];
}

interface ReviuSeed {
  status: StatusReviu;
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai?: string;
  penjelasan_tidak_tercapai?: string;
  rencana_tindak_lanjut?: string;
  tanggal_next_reviu?: Date;
}

interface DialogSeed {
  pegawaiNpp: string;
  atasanNpp: string;
  periodeTahun: number;
  status: StatusDialog;
  deskripsiKinerja?: string;
  aspek: AspekSeed[];
  ttdAtasan?: boolean;
  ttdPegawai?: boolean;
  reviu?: ReviuSeed;
}

const STANDARD_ASPEK: AspekSeed[] = [
  {
    jenis_aspek: "SKP",
    tanggung_jawab_pegawai:
      "Menyusun dan melaksanakan rencana kerja tahunan sesuai target",
    tanggung_jawab_atasan:
      "Memantau capaian kinerja dan memberikan arahan perbaikan",
    items: [
      {
        dialog_evaluasi:
          "Capaian sasaran kinerja sesuai target yang ditetapkan pada awal tahun.",
        kompetensi_dikembangkan: "Manajemen waktu dan prioritas",
        metodeNama: "Penugasan",
      },
    ],
  },
  {
    jenis_aspek: "GAP_ASESMEN",
    tanggung_jawab_pegawai:
      "Mengikuti asesmen kompetensi dan menindaklanjuti hasilnya",
    tanggung_jawab_atasan:
      "Membahas hasil asesmen dan menyusun rencana pengembangan",
    items: [
      {
        dialog_evaluasi:
          "Kesenjangan kompetensi teknis teridentifikasi dari hasil asesmen.",
        kompetensi_dikembangkan: "Kompetensi teknis bidang",
        metodeNama: "Pendidikan dan Pelatihan",
      },
    ],
  },
  {
    jenis_aspek: "PERILAKU",
    tanggung_jawab_pegawai:
      "Menjaga integritas, disiplin, dan etika dalam pelaksanaan tugas",
    tanggung_jawab_atasan: "Memberikan umpan balik perilaku kerja",
    items: [
      {
        dialog_evaluasi:
          "Perilaku kerja menunjukkan integritas dan profesionalisme.",
        kompetensi_dikembangkan: "Integritas dan etika kerja",
        metodeNama: "Penugasan",
      },
    ],
  },
  {
    jenis_aspek: "KARIR_PENDEK",
    tanggung_jawab_pegawai:
      "Menyusun rencana pengembangan karier jangka pendek",
    tanggung_jawab_atasan:
      "Memberikan arahan jenjang karier jangka pendek",
    items: [
      {
        dialog_evaluasi:
          "Rencana pengembangan karier 1 tahun ke depan tersusun.",
        kompetensi_dikembangkan: "Perencanaan karier",
        metodeNama: "Mutasi",
      },
    ],
  },
  {
    jenis_aspek: "KARIR_MENENGAH",
    tanggung_jawab_pegawai:
      "Menyiapkan diri untuk jenjang karier jangka menengah",
    tanggung_jawab_atasan:
      "Memberikan arahan jenjang karier jangka menengah",
    items: [
      {
        dialog_evaluasi:
          "Arah pengembangan karier 3-5 tahun ke depan terpetakan.",
        kompetensi_dikembangkan: "Kepemimpinan",
        metodeNama: "Pendidikan dan Pelatihan",
      },
    ],
  },
];

const DIALOG_SEEDS: DialogSeed[] = [
  {
    pegawaiNpp: "2000001",
    atasanNpp: "1000001",
    periodeTahun: 2024,
    status: "draft_atasan",
    aspek: [],
  },
  {
    pegawaiNpp: "2000001",
    atasanNpp: "1000001",
    periodeTahun: 2025,
    status: "menunggu_pegawai",
    deskripsiKinerja:
      "Peningkatan kualitas layanan kearsipan dan ketertiban administrasi kepegawaian.",
    aspek: [],
  },
  {
    pegawaiNpp: "2000002",
    atasanNpp: "1000001",
    periodeTahun: 2025,
    status: "menunggu_atasan",
    deskripsiKinerja:
      "Penguatan pengelolaan data kepegawaian dan dukungan sistem informasi.",
    aspek: STANDARD_ASPEK,
  },
  {
    pegawaiNpp: "2000001",
    atasanNpp: "1000001",
    periodeTahun: 2023,
    status: "menunggu_validasi",
    deskripsiKinerja:
      "Tertib administrasi arsip aktif dan pasif di lingkungan Biro SDM.",
    aspek: STANDARD_ASPEK,
    ttdAtasan: true,
  },
  {
    pegawaiNpp: "2000007",
    atasanNpp: "1000002",
    periodeTahun: 2025,
    status: "selesai",
    deskripsiKinerja:
      "Optimalisasi layanan administrasi umum dan tata usaha perkantoran.",
    aspek: STANDARD_ASPEK,
    ttdAtasan: true,
    ttdPegawai: true,
    reviu: {
      status: "menunggu_validasi",
      is_tercapai: true,
      is_tidak_tercapai: false,
      penjelasan_tercapai:
        "Seluruh target layanan administrasi umum tercapai sesuai jadwal.",
    },
  },
  {
    pegawaiNpp: "2000008",
    atasanNpp: "1000002",
    periodeTahun: 2024,
    status: "selesai",
    deskripsiKinerja:
      "Pengelolaan barang milik negara yang akurat dan tepat waktu.",
    aspek: STANDARD_ASPEK,
    ttdAtasan: true,
    ttdPegawai: true,
    reviu: {
      status: "selesai",
      is_tercapai: true,
      is_tidak_tercapai: false,
      penjelasan_tercapai:
        "Pengelolaan BMN berjalan baik dan seluruh aset terdata dengan benar.",
    },
  },
  {
    pegawaiNpp: "2000007",
    atasanNpp: "1000002",
    periodeTahun: 2023,
    status: "selesai",
    deskripsiKinerja:
      "Digitalisasi arsip dan surat-menyurat unit kerja.",
    aspek: STANDARD_ASPEK,
    ttdAtasan: true,
    ttdPegawai: true,
    reviu: {
      status: "selesai",
      is_tercapai: false,
      is_tidak_tercapai: true,
      penjelasan_tidak_tercapai:
        "Digitalisasi belum tuntas karena kendala infrastruktur jaringan.",
      rencana_tindak_lanjut:
        "Menjadwalkan ulang digitalisasi dengan dukungan tim TIK.",
      tanggal_next_reviu: new Date("2025-06-30"),
    },
  },
  {
    pegawaiNpp: "2000002",
    atasanNpp: "1000001",
    periodeTahun: 2024,
    status: "selesai",
    deskripsiKinerja:
      "Pemeliharaan dan pembaruan data kepegawaian.",
    aspek: STANDARD_ASPEK,
    ttdAtasan: true,
    ttdPegawai: true,
  },
  {
    pegawaiNpp: "2000001",
    atasanNpp: "1000001",
    periodeTahun: 2022,
    status: "selesai",
    deskripsiKinerja:
      "Penyusunan arsip statis dan inventarisasi arsip.",
    aspek: STANDARD_ASPEK,
    ttdAtasan: true,
    ttdPegawai: true,
    reviu: {
      status: "draft_pegawai",
      is_tercapai: true,
      is_tidak_tercapai: false,
      penjelasan_tercapai:
        "Draft reviu sedang disusun oleh pegawai.",
    },
  },
  {
    pegawaiNpp: "2000002",
    atasanNpp: "1000001",
    periodeTahun: 2023,
    status: "selesai",
    deskripsiKinerja:
      "Pengembangan modul pengelolaan kinerja pada sistem informasi.",
    aspek: STANDARD_ASPEK,
    ttdAtasan: true,
    ttdPegawai: true,
    reviu: {
      status: "menunggu_atasan",
      is_tercapai: true,
      is_tidak_tercapai: false,
      penjelasan_tercapai:
        "Modul selesai dikembangkan dan menunggu reviu atasan.",
    },
  },
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

  const metodeById = new Map(
    (await prisma.masterMetodePengembangan.findMany()).map((m) => [
      m.nama_metode,
      m.id,
    ]),
  );

  let seededDialogs = 0;
  for (const seed of DIALOG_SEEDS) {
    const idPegawai = idByNpp.get(seed.pegawaiNpp);
    const idAtasan = idByNpp.get(seed.atasanNpp);
    if (!idPegawai || !idAtasan) continue;

    const existing = await prisma.dialogKinerja.findFirst({
      where: {
        id_pegawai: idPegawai,
        id_atasan: idAtasan,
        periode_tahun: seed.periodeTahun,
      },
      select: { id: true, aspek: { select: { item: { select: { id: true } } } } },
    });
    if (existing) {
      if (seed.aspek.length > 0 && existing.aspek.every((aspek) => aspek.item.length === 0)) {
        for (const aspek of seed.aspek) {
          const existingAspek = await prisma.dialogKinerjaAspek.upsert({
            where: {
              id_dialog_jenis_aspek: {
                id_dialog: existing.id,
                jenis_aspek: aspek.jenis_aspek,
              },
            },
            update: {},
            create: {
              id_dialog: existing.id,
              jenis_aspek: aspek.jenis_aspek,
              tanggung_jawab_pegawai: aspek.tanggung_jawab_pegawai,
              tanggung_jawab_atasan: aspek.tanggung_jawab_atasan,
            },
            select: { id: true },
          });

          for (const item of aspek.items) {
            await prisma.dialogKinerjaItem.create({
              data: {
                id_aspek: existingAspek.id,
                dialog_evaluasi: item.dialog_evaluasi,
                kompetensi_dikembangkan: item.kompetensi_dikembangkan,
                id_metode_pengembangan: item.metodeNama
                  ? metodeById.get(item.metodeNama) ?? null
                  : null,
                waktu_pelaksanaan:
                  item.waktu_pelaksanaan ??
                  new Date(Date.UTC(seed.periodeTahun, 5, 15)),
              },
            });
          }
        }
      }
      continue;
    }

    const dialog = await prisma.dialogKinerja.create({
      data: {
        id_pegawai: idPegawai,
        id_atasan: idAtasan,
        periode_tahun: seed.periodeTahun,
        status: seed.status,
        deskripsi_kinerja: seed.deskripsiKinerja ?? null,
      },
      select: { id: true },
    });
    const dialogId = dialog.id;

    for (const aspek of seed.aspek) {
      const createdAspek = await prisma.dialogKinerjaAspek.create({
        data: {
          id_dialog: dialogId,
          jenis_aspek: aspek.jenis_aspek,
          tanggung_jawab_pegawai: aspek.tanggung_jawab_pegawai,
          tanggung_jawab_atasan: aspek.tanggung_jawab_atasan,
        },
        select: { id: true },
      });
      for (const item of aspek.items) {
        await prisma.dialogKinerjaItem.create({
          data: {
            id_aspek: createdAspek.id,
            dialog_evaluasi: item.dialog_evaluasi,
            kompetensi_dikembangkan: item.kompetensi_dikembangkan,
            id_metode_pengembangan: item.metodeNama
              ? metodeById.get(item.metodeNama) ?? null
              : null,
            waktu_pelaksanaan:
              item.waktu_pelaksanaan ??
              new Date(Date.UTC(seed.periodeTahun, 5, 15)),
          },
        });
      }
    }

    if (seed.ttdAtasan) {
      await prisma.dialogKinerja.update({
        where: { id: dialogId },
        data: {
          is_valid_atasan: true,
          ttd_atasan_path: await writeTtdPlaceholder(dialogId, "atasan"),
          waktu_validasi_atasan: new Date(),
        },
      });
    }
    if (seed.ttdPegawai) {
      await prisma.dialogKinerja.update({
        where: { id: dialogId },
        data: {
          is_valid_pegawai: true,
          ttd_pegawai_path: await writeTtdPlaceholder(dialogId, "pegawai"),
          waktu_validasi_pegawai: new Date(),
        },
      });
    }

    if (seed.reviu) {
      const r = seed.reviu;
      const reviu = await prisma.reviu.create({
        data: {
          id_dialog: dialogId,
          status: r.status,
          is_tercapai: r.is_tercapai,
          is_tidak_tercapai: r.is_tidak_tercapai,
          penjelasan_tercapai: r.penjelasan_tercapai ?? null,
          penjelasan_tidak_tercapai: r.penjelasan_tidak_tercapai ?? null,
          rencana_tindak_lanjut: r.rencana_tindak_lanjut ?? null,
          tanggal_next_reviu: r.tanggal_next_reviu ?? null,
        },
        select: { id: true },
      });
      const reviuId = reviu.id;
      if (r.status === "menunggu_validasi" || r.status === "selesai") {
        await prisma.reviu.update({
          where: { id: reviuId },
          data: {
            is_valid_atasan: true,
            ttd_atasan_path: await writeTtdPlaceholder(dialogId, "atasan"),
            waktu_validasi_atasan: new Date(),
          },
        });
      }
      if (r.status === "selesai") {
        await prisma.reviu.update({
          where: { id: reviuId },
          data: {
            is_valid_pegawai: true,
            ttd_pegawai_path: await writeTtdPlaceholder(dialogId, "pegawai"),
            waktu_validasi_pegawai: new Date(),
          },
        });
      }
    }

    seededDialogs++;
  }

  const reviuCount = await prisma.reviu.count();
  console.log(
    `Seeded ${seededDialogs} dialog kinerja (total ${await prisma.dialogKinerja.count()} dialog, ${reviuCount} reviu).`,
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