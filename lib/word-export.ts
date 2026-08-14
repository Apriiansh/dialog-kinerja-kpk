import path from "node:path";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/format";
import {
  dialogEvaluasiLabel,
  formatWaktuPelaksanaan,
  isEmptyItem,
  metodeLabel,
} from "@/lib/dialog-display";
import { resolveTtdFile } from "@/lib/ttd";
import type { JenisAspek } from "@/generated/prisma/enums";

async function getBase64Image(filePath: string): Promise<string | null> {
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase().replace(".", "") || "png";
    return `data:image/${ext === "jpg" ? "jpeg" : ext};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

async function getLogoBase64(): Promise<string | null> {
  const logoPath = path.join(process.cwd(), "public", "logo-kpk.png");
  return getBase64Image(logoPath);
}

async function getTtdBase64(ttdUrl: string | null): Promise<string | null> {
  if (!ttdUrl) return null;
  const filePath = resolveTtdFile(ttdUrl);
  if (!filePath) return null;
  return getBase64Image(filePath);
}

const SECTIONS: {
  letter: string;
  title: string;
  jenis: JenisAspek[];
}[] = [
    { letter: "A", title: "Evaluasi Kinerja (SKP)", jenis: ["SKP"] },
    { letter: "B", title: "Evaluasi Gap Asesmen Pegawai", jenis: ["GAP_ASESMEN"] },
    { letter: "C", title: "Evaluasi Perilaku Pegawai", jenis: ["PERILAKU"] },
    {
      letter: "D",
      title: "Aspirasi Karir Pegawai",
      jenis: ["KARIR_PENDEK", "KARIR_MENENGAH"],
    },
  ];

const KARIR_TITLE: Record<"KARIR_PENDEK" | "KARIR_MENENGAH", string> = {
  KARIR_PENDEK: "1. Jangka Pendek (1-2 Tahun ke depan)",
  KARIR_MENENGAH: "2. Jangka Menengah (3-5 Tahun ke depan)",
};

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function generateDialogKinerjaWord(
  dialogId: number,
  sessionUserId: number,
  sessionRole: string,
): Promise<{ filename: string; html: string }> {
  const dialog = await prisma.dialogKinerja.findUnique({
    where: { id: dialogId },
    include: {
      pegawai: true,
      atasan: true,
      aspek: {
        include: {
          item: {
            include: {
              metode: true,
            },
          },
        },
      },
    },
  });

  if (!dialog) {
    throw new Error("Dialog kinerja tidak ditemukan.");
  }

  const isAuthorized =
    sessionRole === "ADMIN" ||
    dialog.id_pegawai === sessionUserId ||
    dialog.id_atasan === sessionUserId;

  if (!isAuthorized) {
    throw new Error("Anda tidak memiliki akses ke dokumen dialog ini.");
  }

  const logoBase64 = await getLogoBase64();
  const ttdAtasanBase64 = await getTtdBase64(dialog.ttd_atasan_path);
  const ttdPegawaiBase64 = await getTtdBase64(dialog.ttd_pegawai_path);

  const tanggalValidasi =
    dialog.waktu_validasi_atasan ?? dialog.waktu_validasi_pegawai ?? new Date();

  const dataRows = [
    { label: "Nama Pegawai", value: dialog.pegawai.nama_pegawai },
    { label: "NIP", value: dialog.pegawai.nip },
    {
      label: "Tanggal Bergabung",
      value: formatWaktuPelaksanaan(dialog.pegawai.tanggal_bergabung),
    },
    { label: "Nama Jabatan", value: dialog.pegawai.nama_jabatan },
    { label: "Unit Kerja", value: dialog.pegawai.unit_kerja },
    {
      label: "Masa Kerja Unit Terakhir",
      value: dialog.pegawai.masa_kerja_unit_terakhir,
    },
  ];

  let aspekHtml = "";

  for (const section of SECTIONS) {
    aspekHtml += `
      <div style="margin-top: 16pt;">
        <p style="font-weight: bold; margin: 0 0 4pt 0;">${section.letter}. ${escapeHtml(section.title)}</p>
    `;

    for (const jenis of section.jenis) {
      const aspek = dialog.aspek.find((a) => a.jenis_aspek === jenis);
      const items = (aspek?.item ?? []).filter((i) => !isEmptyItem(i));

      if (section.jenis.length > 1) {
        aspekHtml += `
          <p style="font-weight: bold; margin: 6pt 0 4pt 0;">${KARIR_TITLE[jenis as "KARIR_PENDEK" | "KARIR_MENENGAH"]}</p>
        `;
      }

      aspekHtml += `
        <table style="width: 100%; border-collapse: collapse; margin-top: 4pt; font-size: 10pt;" border="1" cellpadding="5" cellspacing="0">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="width: 5%; text-align: center; font-weight: bold;">No</th>
              <th style="width: 30%; text-align: center; font-weight: bold;">${escapeHtml(dialogEvaluasiLabel(jenis))}</th>
              <th style="width: 25%; text-align: center; font-weight: bold;">Kompetensi dikembangkan</th>
              <th style="width: 20%; text-align: center; font-weight: bold;">Metode Pengembangan</th>
              <th style="width: 20%; text-align: center; font-weight: bold;">Waktu Pelaksanaan</th>
            </tr>
          </thead>
          <tbody>
      `;

      if (items.length > 0) {
        items.forEach((item, index) => {
          aspekHtml += `
            <tr>
              <td style="text-align: center; vertical-align: top;">${index + 1}</td>
              <td style="vertical-align: top;">${escapeHtml(item.dialog_evaluasi || "-")}</td>
              <td style="vertical-align: top;">${escapeHtml(item.kompetensi_dikembangkan || "-")}</td>
              <td style="vertical-align: top;">${escapeHtml(metodeLabel(item) || "-")}</td>
              <td style="vertical-align: top;">${escapeHtml(formatWaktuPelaksanaan(item.waktu_pelaksanaan))}</td>
            </tr>
          `;
        });
      } else {
        aspekHtml += `
          <tr>
            <td style="text-align: center;">1</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
          </tr>
        `;
      }

      aspekHtml += `
          </tbody>
        </table>
        <div style="margin-top: 6pt;">
          <p style="font-weight: bold; margin: 2pt 0;">• Tanggung Jawab Pegawai</p>
          <p style="margin: 0 0 4pt 12pt;">${escapeHtml(aspek?.tanggung_jawab_pegawai || "-")}</p>
          <p style="font-weight: bold; margin: 2pt 0;">• Tanggung Jawab Atasan</p>
          <p style="margin: 0 0 4pt 12pt;">${escapeHtml(aspek?.tanggung_jawab_atasan || "-")}</p>
        </div>
      `;
    }

    aspekHtml += `</div>`;
  }

  const safeNpp = dialog.pegawai.npp.replace(/[^a-zA-Z0-9]/g, "");
  const filename = `Formulir_Dialog_Kinerja_${safeNpp}_${dialog.periode_tahun}.doc`;

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
  size: 21.0cm 29.7cm;
  margin: 2.54cm 1.91cm 2.54cm 1.91cm;
  mso-header-margin: 35.4pt;
  mso-footer-margin: 35.4pt;
  mso-paper-source: 0;
}
div.Section1 { page: Section1; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10.5pt;
  line-height: 1.35;
  color: #000000;
}
table {
  border-collapse: collapse;
  mso-table-lspace: 0pt;
  mso-table-rspace: 0pt;
}
th, td {
  border: 1px solid #000000;
  padding: 5pt;
}
p {
  margin: 0 0 4pt 0;
}
</style>
</head>
<body>
<div class="Section1">

  <!-- Kop Surat & Logo -->
  <table style="width: 100%; border: none;" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border: none; vertical-align: middle;">
        <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0;">Komisi Pemberantasan Korupsi</p>
        <p style="font-size: 9pt; color: #444444; margin: 0;">Biro Sumber Daya Manusia</p>
      </td>
      <td style="border: none; text-align: right; vertical-align: middle;">
        ${logoBase64
      ? `<img src="${logoBase64}" width="120" style="width: 120px; height: auto;" alt="Logo KPK" />`
      : ""
    }
      </td>
    </tr>
  </table>

  <div style="border-bottom: 2px solid #000000; margin-top: 6pt; margin-bottom: 14pt;"></div>

  <!-- Judul Dokumen -->
  <div style="text-align: center; margin-bottom: 12pt;">
    <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0;">FORMULIR DIALOG KINERJA</p>
    <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0;">PEGAWAI KOMISI PEMBERANTASAN KORUPSI</p>
    <p style="font-size: 10pt; font-weight: normal; margin: 2pt 0 0 0;">Tahun Periode: ${dialog.periode_tahun}</p>
  </div>

  <!-- Data Pegawai -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt;" border="1" cellpadding="5" cellspacing="0">
    <tbody>
      ${dataRows
      .map(
        (r) => `
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f8fafc;">${escapeHtml(r.label)}</td>
          <td style="width: 70%;">${escapeHtml(r.value || "—")}</td>
        </tr>
      `,
      )
      .join("")}
    </tbody>
  </table>

  <!-- Deskripsi Kinerja -->
  <div style="margin-bottom: 12pt;">
    <p style="text-align: justify; margin-bottom: 2pt;">
      Deskripsi kinerja/situasi/permasalahan yang dihadapi, sebagai bahan proses coaching, mentoring dan counseling.
    </p>
    <p style="text-align: justify; font-size: 9.5pt; color: #555555; margin-bottom: 4pt;">
      (Informasi dan data dapat dilampirkan sebagai bukti pendukung jika dibutuhkan)
    </p>
    <div style="border: 1px solid #000000; padding: 6pt; min-height: 40pt; background-color: #ffffff;">
      <p style="margin: 0; text-align: justify;">${escapeHtml(dialog.deskripsi_kinerja || "-")}</p>
    </div>
  </div>

  <!-- Aspek-Aspek Evaluasi -->
  ${aspekHtml}

  <!-- Tanda Tangan -->
  <div style="margin-top: 24pt; page-break-inside: avoid;">
    <p style="text-align: center; margin-bottom: 16pt;">Jakarta, ${formatWaktuPelaksanaan(tanggalValidasi)}</p>
    
    <table style="width: 100%; border: none;" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
          <p style="font-weight: bold; margin-bottom: 4pt;">Atasan Pegawai,</p>
          <div style="height: 70px; display: flex; align-items: center; justify-content: center; margin: 4pt 0;">
            ${ttdAtasanBase64
      ? `<img src="${ttdAtasanBase64}" height="65" style="height: 65px; object-contain: contain;" alt="TTD Atasan" />`
      : `<div style="height: 65px;"></div>`
    }
          </div>
          <p style="font-weight: bold; text-decoration: underline; margin: 4pt 0 0 0;">${escapeHtml(dialog.atasan.nama_pegawai || "—")}</p>
          <p style="margin: 0;">NPP. ${escapeHtml(dialog.atasan.npp)}</p>
          <p style="margin: 0; font-size: 9.5pt; color: #444444;">${escapeHtml(dialog.atasan.nama_jabatan || "Jabatan")}</p>
        </td>

        <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
          <p style="font-weight: bold; margin-bottom: 4pt;">Pegawai,</p>
          <div style="height: 70px; display: flex; align-items: center; justify-content: center; margin: 4pt 0;">
            ${ttdPegawaiBase64
      ? `<img src="${ttdPegawaiBase64}" height="65" style="height: 65px; object-contain: contain;" alt="TTD Pegawai" />`
      : `<div style="height: 65px;"></div>`
    }
          </div>
          <p style="font-weight: bold; text-decoration: underline; margin: 4pt 0 0 0;">${escapeHtml(dialog.pegawai.nama_pegawai || "—")}</p>
          <p style="margin: 0;">NPP. ${escapeHtml(dialog.pegawai.npp)}</p>
          <p style="margin: 0; font-size: 9.5pt; color: #444444;">${escapeHtml(dialog.pegawai.nama_jabatan || "Jabatan")}</p>
        </td>
      </tr>
    </table>
  </div>

</div>
</body>
</html>
  `.trim();

  return { filename, html };
}

export async function generateReviuWord(
  reviuId: number,
  sessionUserId: number,
  sessionRole: string,
): Promise<{ filename: string; html: string }> {
  const reviu = await prisma.reviu.findUnique({
    where: { id: reviuId },
    include: {
      dialog: {
        include: {
          pegawai: true,
          atasan: true,
        },
      },
    },
  });

  if (!reviu) {
    throw new Error("Data reviu tidak ditemukan.");
  }

  const isAuthorized =
    sessionRole === "ADMIN" ||
    reviu.dialog.id_pegawai === sessionUserId ||
    reviu.dialog.id_atasan === sessionUserId;

  if (!isAuthorized) {
    throw new Error("Anda tidak memiliki akses ke dokumen reviu ini.");
  }

  const logoBase64 = await getLogoBase64();
  const ttdAtasanBase64 = await getTtdBase64(reviu.ttd_atasan_path);
  const ttdPegawaiBase64 = await getTtdBase64(reviu.ttd_pegawai_path);

  const tanggalDialog =
    reviu.dialog.waktu_validasi_atasan ??
    reviu.waktu_validasi_atasan ??
    reviu.waktu_validasi_pegawai ??
    new Date();

  const tercapai = reviu.is_tercapai;

  const dataRows = [
    { label: "Nama Pegawai", value: reviu.dialog.pegawai.nama_pegawai },
    { label: "NIP", value: reviu.dialog.pegawai.nip },
    {
      label: "Tanggal Bergabung",
      value: formatWaktuPelaksanaan(reviu.dialog.pegawai.tanggal_bergabung),
    },
    { label: "Nama Jabatan", value: reviu.dialog.pegawai.nama_jabatan },
    { label: "Unit Kerja", value: reviu.dialog.pegawai.unit_kerja },
    {
      label: "Masa Kerja Unit Terakhir",
      value: reviu.dialog.pegawai.masa_kerja_unit_terakhir,
    },
  ];

  const safeNpp = reviu.dialog.pegawai.npp.replace(/[^a-zA-Z0-9]/g, "");
  const filename = `Formulir_Reviu_Dialog_Kinerja_${safeNpp}_${reviu.dialog.periode_tahun}.doc`;

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 {
  size: 21.0cm 29.7cm;
  margin: 2.54cm 1.91cm 2.54cm 1.91cm;
  mso-header-margin: 35.4pt;
  mso-footer-margin: 35.4pt;
  mso-paper-source: 0;
}
div.Section1 { page: Section1; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10.5pt;
  line-height: 1.35;
  color: #000000;
}
table {
  border-collapse: collapse;
  mso-table-lspace: 0pt;
  mso-table-rspace: 0pt;
}
th, td {
  border: 1px solid #000000;
  padding: 5pt;
}
p {
  margin: 0 0 4pt 0;
}
</style>
</head>
<body>
<div class="Section1">

  <!-- Kop Surat & Logo -->
  <table style="width: 100%; border: none;" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border: none; vertical-align: middle;">
        <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0;">Komisi Pemberantasan Korupsi</p>
        <p style="font-size: 9pt; color: #444444; margin: 0;">Biro Sumber Daya Manusia</p>
      </td>
      <td style="border: none; text-align: right; vertical-align: middle;">
        ${logoBase64
      ? `<img src="${logoBase64}" width="120" style="width: 120px; height: auto;" alt="Logo KPK" />`
      : ""
    }
      </td>
    </tr>
  </table>

  <div style="border-bottom: 2px solid #000000; margin-top: 6pt; margin-bottom: 14pt;"></div>

  <!-- Judul Dokumen -->
  <div style="text-align: center; margin-bottom: 12pt;">
    <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0;">FORMULIR REVIU HASIL DIALOG KINERJA</p>
    <p style="font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 0;">PEGAWAI KOMISI PEMBERANTASAN KORUPSI</p>
    <p style="font-size: 10pt; font-weight: normal; margin: 2pt 0 0 0;">Tahun Periode: ${reviu.dialog.periode_tahun}</p>
  </div>

  <!-- Data Pegawai -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt;" border="1" cellpadding="5" cellspacing="0">
    <tbody>
      ${dataRows
      .map(
        (r) => `
        <tr>
          <td style="width: 30%; font-weight: bold; background-color: #f8fafc;">${escapeHtml(r.label)}</td>
          <td style="width: 70%;">${escapeHtml(r.value || "—")}</td>
        </tr>
      `,
      )
      .join("")}
    </tbody>
  </table>

  <!-- Hasil Tindak Lanjut -->
  <div style="margin-top: 10pt;">
    <p style="text-align: justify; margin-bottom: 6pt;">
      Telah dilaksanakan Dialog Kinerja pada tanggal <strong>${formatWaktuPelaksanaan(tanggalDialog)}</strong>.
    </p>
    <p style="text-align: justify; margin-bottom: 6pt;">
      Hasil tindak lanjut perbaikan atau penyelesaian untuk permasalahan/kinerja/situasi yang dihadapi pegawai pada saat Dialog Kinerja adalah:
    </p>

    <!-- Kotak Status Tercapai -->
    <div style="border: 1px solid #000000; padding: 8pt; margin-bottom: 8pt; background-color: ${tercapai ? "#f8fafc" : "#ffffff"};">
      <p style="font-weight: bold; margin: 0 0 4pt 0;">
        ${tercapai ? "[✓]" : "[  ]"} TERCAPAI
      </p>
      <p style="margin: 0 0 2pt 0; font-weight: bold; font-size: 9.5pt;">Penjelasan singkat hasilnya:</p>
      <p style="margin: 0; text-align: justify;">
        ${tercapai && reviu.penjelasan_tercapai?.trim() ? escapeHtml(reviu.penjelasan_tercapai) : "-"}
      </p>
    </div>

    <!-- Kotak Status Tidak Tercapai -->
    <div style="border: 1px solid #000000; padding: 8pt; background-color: ${!tercapai ? "#f8fafc" : "#ffffff"};">
      <p style="font-weight: bold; margin: 0 0 4pt 0;">
        ${!tercapai ? "[✓]" : "[  ]"} TIDAK TERCAPAI
      </p>
      
      <p style="margin: 4pt 0 2pt 0; font-weight: bold; font-size: 9.5pt;">Deskripsi penyebab tidak tercapai:</p>
      <p style="margin: 0 0 6pt 0; text-align: justify;">
        ${!tercapai && reviu.penjelasan_tidak_tercapai?.trim() ? escapeHtml(reviu.penjelasan_tidak_tercapai) : "-"}
      </p>

      <p style="margin: 4pt 0 2pt 0; font-weight: bold; font-size: 9.5pt;">Rencana dan tindak lanjut ke depan yang akan dilakukan:</p>
      <p style="margin: 0 0 6pt 0; text-align: justify;">
        ${!tercapai && reviu.rencana_tindak_lanjut?.trim() ? escapeHtml(reviu.rencana_tindak_lanjut) : "-"}
      </p>

      <p style="margin: 4pt 0 0 0;">
        <strong>Tanggal reviu berikutnya:</strong> ${!tercapai && reviu.tanggal_next_reviu
      ? formatTanggal(reviu.tanggal_next_reviu)
      : "-"
    }
      </p>
    </div>
  </div>

  <!-- Tanda Tangan -->
  <div style="margin-top: 24pt; page-break-inside: avoid;">
    <p style="text-align: center; margin-bottom: 16pt;">Jakarta, ${formatWaktuPelaksanaan(tanggalDialog)}</p>
    
    <table style="width: 100%; border: none;" border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
          <p style="font-weight: bold; margin-bottom: 4pt;">Atasan Pegawai,</p>
          <div style="height: 70px; display: flex; align-items: center; justify-content: center; margin: 4pt 0;">
            ${ttdAtasanBase64
      ? `<img src="${ttdAtasanBase64}" height="65" style="height: 65px; object-contain: contain;" alt="TTD Atasan" />`
      : `<div style="height: 65px;"></div>`
    }
          </div>
          <p style="font-weight: bold; text-decoration: underline; margin: 4pt 0 0 0;">${escapeHtml(reviu.dialog.atasan.nama_pegawai || "—")}</p>
          <p style="margin: 0;">NPP. ${escapeHtml(reviu.dialog.atasan.npp)}</p>
          <p style="margin: 0; font-size: 9.5pt; color: #444444;">${escapeHtml(reviu.dialog.atasan.nama_jabatan || "Jabatan")}</p>
        </td>

        <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
          <p style="font-weight: bold; margin-bottom: 4pt;">Pegawai,</p>
          <div style="height: 70px; display: flex; align-items: center; justify-content: center; margin: 4pt 0;">
            ${ttdPegawaiBase64
      ? `<img src="${ttdPegawaiBase64}" height="65" style="height: 65px; object-contain: contain;" alt="TTD Pegawai" />`
      : `<div style="height: 65px;"></div>`
    }
          </div>
          <p style="font-weight: bold; text-decoration: underline; margin: 4pt 0 0 0;">${escapeHtml(reviu.dialog.pegawai.nama_pegawai || "—")}</p>
          <p style="margin: 0;">NPP. ${escapeHtml(reviu.dialog.pegawai.npp)}</p>
          <p style="margin: 0; font-size: 9.5pt; color: #444444;">${escapeHtml(reviu.dialog.pegawai.nama_jabatan || "Jabatan")}</p>
        </td>
      </tr>
    </table>
  </div>

</div>
</body>
</html>
  `.trim();

  return { filename, html };
}
