import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  JenisAspek,
} from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "" });
const prisma = new PrismaClient({ adapter });

const TARGET_NPP = "2000002";

interface AspekSeed {
  jenis_aspek: JenisAspek;
  tanggung_jawab_pegawai: string;
  tanggung_jawab_atasan: string;
  evaluasi: string;
  kompetensi: string;
  metode: string;
}

const ASPEK_SEEDS: AspekSeed[] = [
  {
    jenis_aspek: JenisAspek.SKP,
    tanggung_jawab_pegawai:
      "Melaksanakan tugas pokok dan fungsi sebagai Pranata Komputer sesuai sasaran kinerja yang telah ditetapkan pada SKP.",
    tanggung_jawab_atasan:
      "Memberikan arahan, pembinaan, dan penilaian atas capaian kinerja sesuai sasaran SKP yang disepakati.",
    evaluasi:
      "Capaian kinerja pada periode berjalan berada di atas target yang disepakati bersama atasan.",
    kompetensi: "Pengelolaan data dan sistem informasi kepegawaian",
    metode: "Penugasan",
  },
  {
    jenis_aspek: JenisAspek.GAP_ASESMEN,
    tanggung_jawab_pegawai:
      "Menindaklanjuti hasil asesmen dengan mengikuti program pengembangan kompetensi yang direkomendasikan.",
    tanggung_jawab_atasan:
      "Memfasilitasi pegawai untuk mengikuti program pengembangan kompetensi hasil asesmen.",
    evaluasi:
      "Gap kompetensi telah teridentifikasi dan disusun rencana pengembangannya.",
    kompetensi: "Kompetensi analisis data",
    metode: "Pendidikan dan Pelatihan",
  },
  {
    jenis_aspek: JenisAspek.PERILAKU,
    tanggung_jawab_pegawai:
      "Menjaga perilaku kerja yang profesional, berintegritas, dan sesuai dengan kode etik KPK.",
    tanggung_jawab_atasan:
      "Memberikan keteladanan serta umpan balik terhadap perilaku kerja pegawai.",
    evaluasi:
      "Perilaku kerja pegawai menunjukkan integritas, dedikasi, dan pelayanan yang baik.",
    kompetensi: "Integritas dan pelayanan publik",
    metode: "Penugasan",
  },
  {
    jenis_aspek: JenisAspek.KARIR_PENDEK,
    tanggung_jawab_pegawai:
      "Meningkatkan kompetensi teknis bidang komputer untuk mendukung pengembangan karir jangka pendek.",
    tanggung_jawab_atasan:
      "Mendorong dan memfasilitasi pengembangan kompetensi untuk kesiapan jenjang karir berikutnya.",
    evaluasi:
      "Aspirasi karir jangka pendek pegawai didukung melalui program pengembangan kompetensi.",
    kompetensi: "Sertifikasi kompetensi bidang TIK",
    metode: "Pendidikan dan Pelatihan",
  },
  {
    jenis_aspek: JenisAspek.KARIR_MENENGAH,
    tanggung_jawab_pegawai:
      "Mempersiapkan diri untuk jenjang karir jangka menengah melalui peningkatan kualifikasi dan kompetensi.",
    tanggung_jawab_atasan:
      "Memberikan dukungan dan menyusun rencana pengembangan karir jangka menengah bersama pegawai.",
    evaluasi:
      "Rencana pengembangan karir jangka menengah telah disusun dan disepakati bersama.",
    kompetensi: "Pendidikan lanjutan / peningkatan jenjang",
    metode: "Pendidikan dan Pelatihan",
  },
];

interface ReviuSeed {
  is_tercapai: boolean;
  is_tidak_tercapai: boolean;
  penjelasan_tercapai: string | null;
  penjelasan_tidak_tercapai: string | null;
  rencana_tindak_lanjut: string | null;
  tanggal_next_evaluasi: Date | null;
}

const REVIU_SEEDS: ReviuSeed[] = [
  {
    is_tercapai: true,
    is_tidak_tercapai: false,
    penjelasan_tercapai:
      "Seluruh sasaran kinerja pada Dialog Kinerja telah tercapai sesuai target yang disepakati bersama atasan. Hasil pekerjaan diselesaikan tepat waktu, sesuai prosedur, dan kualitasnya memenuhi standar yang diharapkan.",
    penjelasan_tidak_tercapai: null,
    rencana_tindak_lanjut: null,
    tanggal_next_evaluasi: null,
  },
];

async function createSelesaiDialog(pegawai: {
  id: string;
  id_atasan: string | null;
}) {
  const periodeTahun = new Date().getFullYear();
  const now = new Date();

  const metodeList = await prisma.masterMetodePengembangan.findMany();
  const metodeId = (nama: string) =>
    metodeList.find((m) => m.nama_metode === nama)?.id ?? null;

  const dialog = await prisma.dialogKinerja.create({
    data: {
      id_atasan: pegawai.id_atasan!,
      id_pegawai: pegawai.id,
      periode_tahun: periodeTahun,
      triwulan: "TW1",
      deskripsi_kinerja:
        "Pegawai melaksanakan tugas pengelolaan data dan sistem informasi kepegawaian dengan sasaran kerja sesuai SKP. Selama periode dialog, pegawai telah menunjukkan kinerja, perilaku, dan komitmen yang baik dalam mendukung tugas unit kerja.",
      status: "selesai",
      is_valid_pegawai: true,
      is_valid_atasan: true,
      waktu_validasi_atasan: now,
      waktu_validasi_pegawai: now,
      aspek: {
        create: ASPEK_SEEDS.map((a) => ({
          jenis_aspek: a.jenis_aspek,
          tanggung_jawab_pegawai: a.tanggung_jawab_pegawai,
          tanggung_jawab_atasan: a.tanggung_jawab_atasan,
          item: {
            create: [
              {
                dialog_evaluasi: a.evaluasi,
                kompetensi_dikembangkan: a.kompetensi,
                id_metode_pengembangan: metodeId(a.metode),
                waktu_pelaksanaan: now,
              },
            ],
          },
        })),
      },
    },
    select: { id: true, periode_tahun: true },
  });

  console.log(
    `Dialog kinerja tahun ${periodeTahun} dibuat dengan status "selesai".`,
  );
  return dialog;
}

async function main() {
  const pegawai = await prisma.user.findUnique({
    where: { npp: TARGET_NPP },
    select: { id: true, nama_pegawai: true, id_atasan: true },
  });
  if (!pegawai) {
    throw new Error(
      `User dengan NPP ${TARGET_NPP} tidak ditemukan. Jalankan "npx prisma db seed" terlebih dahulu.`,
    );
  }
  if (!pegawai.id_atasan) {
    throw new Error(`User NPP ${TARGET_NPP} belum memiliki atasan.`);
  }

  let dialog: { id: string; periode_tahun: number } | null =
    await prisma.dialogKinerja.findFirst({
      where: { id_pegawai: pegawai.id, status: "selesai" },
      orderBy: { updated_at: "desc" },
    });

  if (dialog) {
    console.log(
      `Menggunakan dialog kinerja #${dialog.id} (tahun ${dialog.periode_tahun}) yang sudah selesai.`,
    );
  } else {
    dialog = await createSelesaiDialog(pegawai);
  }

  const existingReviu = await prisma.reviu.findFirst({
    where: { id_dialog: dialog.id },
    select: { id: true, status: true },
  });
  if (existingReviu) {
    console.log(
      `Dialog #${dialog.id} sudah memiliki reviu (id ${existingReviu.id}, status "${existingReviu.status}"). Tidak membuat reviu baru.`,
    );
    return;
  }

  const reviuSeed = REVIU_SEEDS[0];
  const reviu = await prisma.reviu.create({
    data: {
      id_dialog: dialog.id,
      is_tercapai: reviuSeed.is_tercapai,
      is_tidak_tercapai: reviuSeed.is_tidak_tercapai,
      penjelasan_tercapai: reviuSeed.penjelasan_tercapai,
      penjelasan_tidak_tercapai: reviuSeed.penjelasan_tidak_tercapai,
      rencana_tindak_lanjut: reviuSeed.rencana_tindak_lanjut,
      tanggal_next_evaluasi: reviuSeed.tanggal_next_evaluasi,
      status: "draft_pegawai",
    },
    select: { id: true },
  });

  console.log(
    `Seeded reviu draft #${reviu.id} untuk pegawai NPP ${TARGET_NPP} (${pegawai.nama_pegawai}) pada dialog kinerja tahun ${dialog.periode_tahun}.`,
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
