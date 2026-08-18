import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  type ITableCellOptions,
  type IRunOptions,
} from "docx";
import { prisma } from "@/lib/prisma";
import { formatTanggal } from "@/lib/utils/format";
import {
  dialogEvaluasiLabel,
  formatWaktuPelaksanaan,
  isEmptyItem,
  metodeLabel,
} from "@/lib/utils/dialog-display";
import { resolveTtdFile } from "@/lib/export/ttd";
import type { JenisAspek } from "@/generated/prisma/enums";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function getImageBuffer(filePath: string): Promise<Buffer | null> {
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

async function getLogoBuffer(): Promise<Buffer | null> {
  const logoPath = path.join(process.cwd(), "public", "logo-kpk.png");
  return getImageBuffer(logoPath);
}

async function getTtdBuffer(ttdUrl: string | null): Promise<Buffer | null> {
  if (!ttdUrl) return null;
  const filePath = resolveTtdFile(ttdUrl);
  if (!filePath) return null;
  return getImageBuffer(filePath);
}

function txt(text: string, options?: Partial<IRunOptions>): TextRun {
  return new TextRun({ text, font: "Arial", size: 21, ...options });
}

function boldTxt(
  text: string,
  options?: Partial<IRunOptions>,
): TextRun {
  return new TextRun({ text, font: "Arial", size: 21, bold: true, ...options });
}

const THIN_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 1 },
  bottom: { style: BorderStyle.SINGLE, size: 1 },
  left: { style: BorderStyle.SINGLE, size: 1 },
  right: { style: BorderStyle.SINGLE, size: 1 },
};

const BORDER_NONE = { style: BorderStyle.NONE, size: 0 };

const NO_TABLE_BORDER = {
  top: BORDER_NONE,
  bottom: BORDER_NONE,
  left: BORDER_NONE,
  right: BORDER_NONE,
  insideHorizontal: BORDER_NONE,
  insideVertical: BORDER_NONE,
};

type BorderStyleValue = (typeof BorderStyle)[keyof typeof BorderStyle];

function sideBorder(
  sides: ("top" | "bottom" | "left" | "right")[],
): Record<"top" | "bottom" | "left" | "right", { style: BorderStyleValue; size: number }> {
  const borders: Record<
    "top" | "bottom" | "left" | "right",
    { style: BorderStyleValue; size: number }
  > = {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
  };
  for (const side of sides) {
    borders[side] = { style: BorderStyle.SINGLE, size: 1 };
  }
  return borders;
}

function buildPegawaiTable(
  rows: { label: string; value: string | null }[],
): Table {
  const lastIdx = rows.length - 1;
  return new Table({
    borders: NO_TABLE_BORDER,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((r, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === lastIdx;

      const labelSides: ("top" | "bottom" | "left" | "right")[] = ["left"];
      const valueSides: ("top" | "bottom" | "left" | "right")[] = ["right"];
      if (isFirst) {
        labelSides.push("top");
        valueSides.push("top");
      }
      if (isLast) {
        labelSides.push("bottom");
        valueSides.push("bottom");
      }

      return new TableRow({
        children: [
          new TableCell({
            borders: sideBorder(labelSides),
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: "f8fafc" },
            children: [new Paragraph({ children: [boldTxt(r.label)] })],
          }),
          new TableCell({
            borders: sideBorder(valueSides),
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [txt(`: ${r.value || "—"}`)] })],
          }),
        ],
      });
    }),
  });
}

function cell(
  opts: ITableCellOptions & { widthPercent?: number },
): TableCell {
  const { widthPercent, ...rest } = opts;
  return new TableCell({
    borders: THIN_BORDER,
    ...rest,
    ...(widthPercent
      ? { width: { size: widthPercent, type: WidthType.PERCENTAGE } }
      : {}),
  });
}

function signatureTable(args: {
  dateText: string;
  atasanName: string;
  atasanNpp: string;
  atasanJabatan: string;
  pegawaiName: string;
  pegawaiNpp: string;
  pegawaiJabatan: string;
  ttdAtasanBuf: Buffer | null;
  ttdPegawaiBuf: Buffer | null;
}): Table {
  const atasanTtd = args.ttdAtasanBuf
    ? new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new ImageRun({
            data: args.ttdAtasanBuf,
            transformation: { width: 130, height: 65 },
            type: "png",
          }),
        ],
      })
    : new Paragraph({ spacing: { before: 80, after: 80 }, children: [txt(" ")] });
  const pegawaiTtd = args.ttdPegawaiBuf
    ? new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new ImageRun({
            data: args.ttdPegawaiBuf,
            transformation: { width: 130, height: 65 },
            type: "png",
          }),
        ],
      })
    : new Paragraph({ spacing: { before: 80, after: 80 }, children: [txt(" ")] });

  const atasanCell = new TableCell({
    borders: NO_TABLE_BORDER,
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    children: [
      new Paragraph({
        spacing: { before: 480, after: 200 },
        children: [txt(args.dateText)],
      }),
      new Paragraph({ spacing: { after: 80 }, children: [boldTxt("Atasan Pegawai,")] }),
      atasanTtd,
      new Paragraph({ children: [boldTxt(args.atasanName, { underline: {} })] }),
      new Paragraph({ children: [txt(`NPP. ${args.atasanNpp}`)] }),
      new Paragraph({
        children: [txt(args.atasanJabatan, { size: 19, color: "444444" })],
      }),
    ],
  });

  const pegawaiCell = new TableCell({
    borders: NO_TABLE_BORDER,
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 0, bottom: 0, left: 960, right: 0 },
    children: [
      new Paragraph({
        spacing: { before: 480, after: 200 },
        children: [txt(" ")],
      }),
      new Paragraph({ spacing: { after: 80 }, children: [boldTxt("Pegawai,")] }),
      pegawaiTtd,
      new Paragraph({ children: [boldTxt(args.pegawaiName, { underline: {} })] }),
      new Paragraph({ children: [txt(`NPP. ${args.pegawaiNpp}`)] }),
      new Paragraph({
        children: [txt(args.pegawaiJabatan, { size: 19, color: "444444" })],
      }),
    ],
  });

  return new Table({
    borders: NO_TABLE_BORDER,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [atasanCell, pegawaiCell] })],
  });
}

/* ------------------------------------------------------------------ */
/*  Dialog Kinerja                                                    */
/* ------------------------------------------------------------------ */

const SECTIONS: {
  letter: string;
  title: string;
  jenis: JenisAspek[];
}[] = [
  { letter: "A", title: "Evaluasi Kinerja (SKP)", jenis: ["SKP"] },
  {
    letter: "B",
    title: "Evaluasi Gap Asesmen Pegawai",
    jenis: ["GAP_ASESMEN"],
  },
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

export async function generateDialogKinerjaDocx(
  dialogId: number,
  sessionUserId: number,
  sessionRole: string,
): Promise<{ filename: string; buffer: Buffer }> {
  const dialog = await prisma.dialogKinerja.findUnique({
    where: { id: dialogId },
    include: {
      pegawai: true,
      atasan: true,
      aspek: { include: { item: { include: { metode: true } } } },
    },
  });

  if (!dialog) throw new Error("Dialog kinerja tidak ditemukan.");

  const isAuthorized =
    sessionRole === "ADMIN" ||
    dialog.id_pegawai === sessionUserId ||
    dialog.id_atasan === sessionUserId;
  if (!isAuthorized)
    throw new Error("Anda tidak memiliki akses ke dokumen dialog ini.");

  const [logoBuf, ttdAtasanBuf, ttdPegawaiBuf] = await Promise.all([
    getLogoBuffer(),
    getTtdBuffer(dialog.ttd_atasan_path),
    getTtdBuffer(dialog.ttd_pegawai_path),
  ]);

  const tanggalValidasi =
    dialog.waktu_validasi_atasan ?? dialog.waktu_validasi_pegawai ?? new Date();

  const aspekChildren: (Paragraph | Table)[] = [];

  for (const section of SECTIONS) {
    aspekChildren.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [boldTxt(`${section.letter}. ${section.title}`)],
      }),
    );

    for (const jenis of section.jenis) {
      const aspek = dialog.aspek.find((a) => a.jenis_aspek === jenis);
      const items = (aspek?.item ?? []).filter((i) => !isEmptyItem(i));

      if (section.jenis.length > 1) {
        aspekChildren.push(
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              boldTxt(
                KARIR_TITLE[jenis as "KARIR_PENDEK" | "KARIR_MENENGAH"],
              ),
            ],
          }),
        );
      }

      const tableHeader = new TableRow({
        tableHeader: true,
        children: [
          cell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [boldTxt("No", { size: 18 })] })], widthPercent: 5 }),
          cell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [boldTxt(dialogEvaluasiLabel(jenis), { size: 18 })] })], widthPercent: 30 }),
          cell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [boldTxt("Kompetensi dikembangkan", { size: 18 })] })], widthPercent: 25 }),
          cell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [boldTxt("Metode Pengembangan", { size: 18 })] })], widthPercent: 20 }),
          cell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [boldTxt("Waktu Pelaksanaan", { size: 18 })] })], widthPercent: 20 }),
        ],
      });

      const dataRow = items.length > 0
        ? items.map(
            (item, idx) =>
              new TableRow({
                children: [
                  cell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [txt(String(idx + 1))] })] }),
                  cell({ children: [new Paragraph({ children: [txt(item.dialog_evaluasi || "-")] })] }),
                  cell({ children: [new Paragraph({ children: [txt(item.kompetensi_dikembangkan || "-")] })] }),
                  cell({ children: [new Paragraph({ children: [txt(metodeLabel(item) || "-")] })] }),
                  cell({ children: [new Paragraph({ children: [txt(formatWaktuPelaksanaan(item.waktu_pelaksanaan))] })] }),
                ],
              }),
          )
        : [
            new TableRow({
              children: [
                cell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [txt("1")] })] }),
                cell({ children: [new Paragraph({ children: [txt("-")] })] }),
                cell({ children: [new Paragraph({ children: [txt("-")] })] }),
                cell({ children: [new Paragraph({ children: [txt("-")] })] }),
                cell({ children: [new Paragraph({ children: [txt("-")] })] }),
              ],
            }),
          ];

      aspekChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [tableHeader, ...dataRow],
        }),
      );

      aspekChildren.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [boldTxt("• Tanggung Jawab Pegawai")],
        }),
        new Paragraph({
          spacing: { after: 40 },
          indent: { left: 240 },
          children: [txt(aspek?.tanggung_jawab_pegawai || "-")],
        }),
        new Paragraph({
          spacing: { before: 40, after: 20 },
          children: [boldTxt("• Tanggung Jawab Atasan")],
        }),
        new Paragraph({
          spacing: { after: 80 },
          indent: { left: 240 },
          children: [txt(aspek?.tanggung_jawab_atasan || "-")],
        }),
      );
    }
  }

  /* ---- Data pegawai table ---- */
  const dataRows: { label: string; value: string | null }[] = [
    { label: "Nama Pegawai", value: dialog.pegawai.nama_pegawai },
    { label: "NIP", value: dialog.pegawai.nip },
    { label: "Tanggal Bergabung", value: formatWaktuPelaksanaan(dialog.pegawai.tanggal_bergabung) },
    { label: "Nama Jabatan", value: dialog.pegawai.nama_jabatan },
    { label: "Unit Kerja", value: dialog.pegawai.unit_kerja },
    { label: "Masa Kerja Unit Terakhir", value: dialog.pegawai.masa_kerja_unit_terakhir },
  ];

  const pegawaiTable = buildPegawaiTable(dataRows);

  /* ---- Signature block ---- */
  const sigTable = signatureTable({
    dateText: `Jakarta, ${formatWaktuPelaksanaan(tanggalValidasi)}`,
    atasanName: dialog.atasan.nama_pegawai || "—",
    atasanNpp: dialog.atasan.npp,
    atasanJabatan: dialog.atasan.nama_jabatan || "Jabatan",
    pegawaiName: dialog.pegawai.nama_pegawai || "—",
    pegawaiNpp: dialog.pegawai.npp,
    pegawaiJabatan: dialog.pegawai.nama_jabatan || "Jabatan",
    ttdAtasanBuf,
    ttdPegawaiBuf,
  });

  /* ---- Assemble document ---- */
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1080, right: 1080 },
          },
        },
        children: [
          ...(logoBuf
            ? [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 0 },
                  children: [
                    new ImageRun({
                      data: logoBuf,
                      transformation: { width: 120, height: 60 },
                      type: "png",
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              boldTxt("FORMULIR DIALOG KINERJA", { size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              boldTxt("PEGAWAI KOMISI PEMBERANTASAN KORUPSI", { size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              txt(`Tahun Periode: ${dialog.periode_tahun}`, { size: 20 }),
            ],
          }),
          pegawaiTable,
          new Paragraph({
            spacing: { before: 240, after: 80 },
            children: [
              txt(
                "Deskripsi kinerja/situasi/permasalahan yang dihadapi, sebagai bahan proses coaching, mentoring dan counseling.",
              ),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              txt(
                "(Informasi dan data dapat dilampirkan sebagai bukti pendukung jika dibutuhkan)",
                { size: 19, color: "555555" },
              ),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              txt(dialog.deskripsi_kinerja || "-"),
            ],
          }),
          ...aspekChildren,
          sigTable,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const safeNpp = dialog.pegawai.npp.replace(/[^a-zA-Z0-9]/g, "");
  const filename = `Formulir_Dialog_Kinerja_${safeNpp}_${dialog.periode_tahun}.docx`;

  return { filename, buffer };
}

/* ------------------------------------------------------------------ */
/*  Reviu                                                             */
/* ------------------------------------------------------------------ */

export async function generateReviuDocx(
  reviuId: number,
  sessionUserId: number,
  sessionRole: string,
): Promise<{ filename: string; buffer: Buffer }> {
  const reviu = await prisma.reviu.findUnique({
    where: { id: reviuId },
    include: {
      dialog: { include: { pegawai: true, atasan: true } },
    },
  });

  if (!reviu) throw new Error("Data reviu tidak ditemukan.");

  const isAuthorized =
    sessionRole === "ADMIN" ||
    reviu.dialog.id_pegawai === sessionUserId ||
    reviu.dialog.id_atasan === sessionUserId;
  if (!isAuthorized)
    throw new Error("Anda tidak memiliki akses ke dokumen reviu ini.");

  const [logoBuf, ttdAtasanBuf, ttdPegawaiBuf] = await Promise.all([
    getLogoBuffer(),
    getTtdBuffer(reviu.ttd_atasan_path),
    getTtdBuffer(reviu.ttd_pegawai_path),
  ]);

  const tanggalDialog =
    reviu.dialog.waktu_validasi_atasan ??
    reviu.waktu_validasi_atasan ??
    reviu.waktu_validasi_pegawai ??
    new Date();

  const tercapai = reviu.is_tercapai;

  /* ---- Data pegawai ---- */
  const dataRows: { label: string; value: string | null }[] = [
    { label: "Nama Pegawai", value: reviu.dialog.pegawai.nama_pegawai },
    { label: "NIP", value: reviu.dialog.pegawai.nip },
    { label: "Tanggal Bergabung", value: formatWaktuPelaksanaan(reviu.dialog.pegawai.tanggal_bergabung) },
    { label: "Nama Jabatan", value: reviu.dialog.pegawai.nama_jabatan },
    { label: "Unit Kerja", value: reviu.dialog.pegawai.unit_kerja },
    { label: "Masa Kerja Unit Terakhir", value: reviu.dialog.pegawai.masa_kerja_unit_terakhir },
  ];

  const pegawaiTable = buildPegawaiTable(dataRows);

  /* ---- Tercapai / Tidak Tercapai boxes ---- */
  const statusBox = (checked: boolean, label: string) =>
    new Table({
      borders: NO_TABLE_BORDER,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: NO_TABLE_BORDER,
              shading: { fill: checked ? "f8fafc" : "ffffff" },
              children: [
                new Paragraph({
                  children: [
                    boldTxt(checked ? "[✓]" : "[  ]"),
                    boldTxt(` ${label}`),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

  const detailBox = (
    checked: boolean,
    rows: { label: string; value: string | null }[],
  ) =>
    new Table({
      borders: NO_TABLE_BORDER,
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(
        (r) =>
          new TableRow({
            children: [
              new TableCell({
                borders: NO_TABLE_BORDER,
                width: { size: 40, type: WidthType.PERCENTAGE },
                shading: { fill: checked ? "f8fafc" : "ffffff" },
                children: [
                  new Paragraph({ children: [boldTxt(r.label, { size: 19 })] }),
                ],
              }),
              new TableCell({
                borders: NO_TABLE_BORDER,
                width: { size: 60, type: WidthType.PERCENTAGE },
                shading: { fill: checked ? "f8fafc" : "ffffff" },
                children: [
                  new Paragraph({ children: [txt(r.value || "-")] }),
                ],
              }),
            ],
          }),
      ),
    });

  /* ---- Signature ---- */
const sigTable = signatureTable({
    dateText: `Jakarta, ${formatWaktuPelaksanaan(tanggalDialog)}`,
    atasanName: reviu.dialog.atasan.nama_pegawai || "—",
    atasanNpp: reviu.dialog.atasan.npp,
    atasanJabatan: reviu.dialog.atasan.nama_jabatan || "Jabatan",
    pegawaiName: reviu.dialog.pegawai.nama_pegawai || "—",
    pegawaiNpp: reviu.dialog.pegawai.npp,
    pegawaiJabatan: reviu.dialog.pegawai.nama_jabatan || "Jabatan",
    ttdAtasanBuf,
    ttdPegawaiBuf,
  });

  /* ---- Assemble ---- */
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1080, right: 1080 },
          },
        },
        children: [
          ...(logoBuf
            ? [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 0 },
                  children: [
                    new ImageRun({
                      data: logoBuf,
                      transformation: { width: 120, height: 60 },
                      type: "png",
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [boldTxt("FORMULIR REVIU HASIL DIALOG KINERJA", { size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [boldTxt("PEGAWAI KOMISI PEMBERANTASAN KORUPSI", { size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [txt(`Tahun Periode: ${reviu.dialog.periode_tahun}`, { size: 20 })],
          }),
          pegawaiTable,
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              txt("Telah dilaksanakan Dialog Kinerja pada tanggal "),
              boldTxt(formatWaktuPelaksanaan(tanggalDialog)),
              txt("."),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              txt("Hasil tindak lanjut perbaikan atau penyelesaian untuk permasalahan/kinerja/situasi yang dihadapi pegawai pada saat Dialog Kinerja adalah:"),
            ],
          }),
          statusBox(tercapai, "TERCAPAI"),
          detailBox(tercapai, [
            {
              label: "Penjelasan singkat hasilnya:",
              value:
                tercapai && reviu.penjelasan_tercapai?.trim()
                  ? reviu.penjelasan_tercapai
                  : null,
            },
          ]),
          new Paragraph({ spacing: { before: 80 }, children: [] }),
          statusBox(!tercapai, "TIDAK TERCAPAI"),
          detailBox(!tercapai, [
            {
              label: "Deskripsi penyebab tidak tercapai:",
              value:
                !tercapai && reviu.penjelasan_tidak_tercapai?.trim()
                  ? reviu.penjelasan_tidak_tercapai
                  : null,
            },
            {
              label: "Rencana dan tindak lanjut ke depan:",
              value:
                !tercapai && reviu.rencana_tindak_lanjut?.trim()
                  ? reviu.rencana_tindak_lanjut
                  : null,
            },
            {
              label: "Tanggal reviu berikutnya:",
              value:
                !tercapai && reviu.tanggal_next_reviu
                  ? formatTanggal(reviu.tanggal_next_reviu)
                  : null,
            },
          ]),
          sigTable,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const safeNpp = reviu.dialog.pegawai.npp.replace(/[^a-zA-Z0-9]/g, "");
  const filename = `Formulir_Reviu_Dialog_Kinerja_${safeNpp}_${reviu.dialog.periode_tahun}.docx`;

  return { filename, buffer };
}
