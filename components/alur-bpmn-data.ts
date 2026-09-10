import type { Icon } from "@phosphor-icons/react";
import {
  ArrowCounterClockwiseIcon,
  CalendarPlusIcon,
  CheckCircleIcon,
  ClipboardTextIcon,
  CopySimpleIcon,
  FileArrowDownIcon,
  GearIcon,
  ListChecksIcon,
  LockKeyIcon,
  NotePencilIcon,
  PenNibIcon,
  PencilLineIcon,
  PlayIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";

export type LaneId = "pegawai" | "atasan" | "sistem";

export type BpmnNodeType =
  | "start"
  | "end"
  | "intermediate"
  | "user"
  | "service"
  | "gateway"
  | "data"
  | "link-catch"
  | "link-throw";

export interface BpmnNode {
  id: string;
  lane: LaneId;
  /** 1-based column in the diagram grid */
  col: number;
  /** when true, rendered on the lower sub-row of the lane */
  sub?: boolean;
  type: BpmnNodeType;
  title: string;
  desc: string;
  icon?: Icon;
  /** source-code reference, e.g. "submitEvaluasi · lib/actions/atasan.ts:450" */
  codeRef?: string;
  /** status badge shown on intermediate events */
  statusChip?: string;
  /** "revisi" nodes/edges hide with the revision toggle; "notif" marks bell chips */
  flag?: "revisi" | "notif" | "simplified";
  notif?: boolean;
}

export type EdgeKind = "flow" | "return" | "assoc";

export interface BpmnEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  label?: string;
  /** hide together with the revision toggle */
  hideWith?: "revisi";
  labelDx?: number;
  labelDy?: number;
}

export const LANES: { id: LaneId; label: string; desc: string }[] = [
  { id: "pegawai", label: "Pegawai", desc: "Pegawai yang dinilai" },
  { id: "atasan", label: "Atasan", desc: "Atasan langsung" },
  { id: "sistem", label: "Sistem", desc: "Aplikasi + database" },
];

export const PHASES: { label: string; from: number; to: number }[] = [
  { label: "Fase 1 · Dialog Kinerja", from: 1, to: 14 },
  { label: "Fase 2 · Reviu Tindak Lanjut", from: 15, to: 22 },
  { label: "Fase 1 · Dialog Kinerja", from: 23, to: 24 },
];

export const TOTAL_COLS = 24;

export const NODES: BpmnNode[] = [
  // ── Lane Pegawai ──────────────────────────────────────────────
  {
    id: "start",
    lane: "pegawai",
    col: 1,
    type: "start",
    title: "Mulai",
    desc: "Proses dimulai oleh pegawai dengan mengajukan jadwal dialog kinerja ke atasan langsung.",
    icon: PlayIcon,
  },
  {
    id: "t_ajukan",
    lane: "pegawai",
    col: 2,
    type: "user",
    title: "Ajukan dialog",
    desc: "Pegawai mengajukan jadwal dialog (paling cepat H+2), deskripsi, dan periode triwulan/tahun. Satu periode hanya boleh satu dialog.",
    icon: CalendarPlusIcon,
    codeRef: "initiateDialog · lib/actions/pegawai.ts:314",
  },
  {
    id: "t_isi",
    lane: "pegawai",
    col: 8,
    type: "user",
    title: "Isi 5 aspek & submit",
    desc: "Pegawai melengkapi SKP, Gap Asesmen, Perilaku, Karir Pendek, dan Karir Menengah, lalu mengirim ke atasan (batas H+7 dari jadwal).",
    icon: PencilLineIcon,
    codeRef: "saveDialogForm · lib/actions/pegawai.ts:77",
  },
  {
    id: "t_reviu",
    lane: "pegawai",
    col: 15,
    type: "user",
    title: "Buat reviu capaian",
    desc: "Setelah dialog selesai, pegawai menandai setiap item evaluasi: tercapai atau tidak tercapai. Semua item wajib ditandai.",
    icon: ListChecksIcon,
    codeRef: "createReviu · lib/actions/reviu.ts:116",
  },
  {
    id: "g_item",
    lane: "pegawai",
    col: 16,
    type: "gateway",
    title: "Ada item tidak tercapai?",
    desc: "Percabangan isian reviu: jika ada item tidak tercapai, pegawai wajib mengisi penyebab, rencana tindak lanjut, dan tanggal evaluasi berikutnya.",
  },
  {
    id: "t_lengkapi",
    lane: "pegawai",
    col: 17,
    type: "user",
    title: "Lengkapi & submit reviu",
    desc: "Ada yang tidak tercapai: isi penyebab + rencana + tanggal evaluasi. Semua tercapai: cukup penjelasan capaian. Lalu kirim ke atasan.",
    icon: NotePencilIcon,
    codeRef: "validateSubmitInput · lib/actions/reviu.ts:48",
  },

  // ── Lane Atasan ───────────────────────────────────────────────
  {
    id: "t_tinjau",
    lane: "atasan",
    col: 5,
    type: "user",
    title: "Tinjau pengajuan",
    desc: "Atasan memeriksa jadwal dan deskripsi yang diajukan pegawai, lalu menyetujui atau mengembalikan.",
    icon: ClipboardTextIcon,
    codeRef: "approveDialog · lib/actions/atasan.ts:320",
  },
  {
    id: "g_setuju",
    lane: "atasan",
    col: 6,
    type: "gateway",
    title: "Jadwal disetujui?",
    desc: "Keputusan atasan atas pengajuan pegawai. Ditolak: kembali ke draft disertai alasan. Disetujui: lanjut ke pengisian pegawai.",
  },
  {
    id: "t_tolak",
    lane: "atasan",
    col: 7,
    type: "user",
    title: "Kembalikan + alasan",
    desc: "Pengajuan dikembalikan ke draft beserta alasan_tolak untuk diperbaiki pegawai.",
    icon: ArrowCounterClockwiseIcon,
    codeRef: "rejectDialog · lib/actions/atasan.ts:372",
    flag: "revisi",
  },
  {
    id: "t_isi_atasan",
    lane: "atasan",
    col: 8,
    type: "user",
    title: "Isi tanggung jawab atasan",
    desc: "Atasan dapat mengisi arahan dan komitmen tanggung jawab pembinaan pada setiap aspek secara bersamaan saat status menunggu_pegawai.",
    icon: NotePencilIcon,
    codeRef: "autosaveResponses · lib/actions/atasan.ts:194",
  },
  {
    id: "t_evaluasi",
    lane: "atasan",
    col: 10,
    type: "user",
    title: "Evaluasi & tanda tangan",
    desc: "Atasan mengisi tanggung jawab pembinaan tiap aspek, lalu menandatangani persetujuan evaluasi.",
    icon: PenNibIcon,
    codeRef: "submitEvaluasi · lib/actions/atasan.ts:450",
  },
  {
    id: "g_eval",
    lane: "atasan",
    col: 11,
    type: "gateway",
    title: "Perlu revisi?",
    desc: "Atasan dapat menyetujui evaluasi atau mengembalikannya sebagai revisi_evaluasi.",
  },
  {
    id: "t_revisi",
    lane: "atasan",
    col: 12,
    type: "user",
    title: "Kembalikan evaluasi",
    desc: "Evaluasi dikembalikan (status revisi_evaluasi) beserta alasan untuk diperbaiki pegawai.",
    icon: ArrowCounterClockwiseIcon,
    codeRef: "rejectDialog · lib/actions/atasan.ts:372",
    flag: "revisi",
  },
  {
    id: "t_setuju_reviu",
    lane: "atasan",
    col: 19,
    type: "user",
    title: "Setujui reviu",
    desc: "Atasan memeriksa reviu capaian pegawai dan menandatangani persetujuan.",
    icon: SealCheckIcon,
    codeRef: "submitReviuAtasan · lib/actions/reviu.ts:304",
  },
  {
    id: "g_reviu",
    lane: "atasan",
    col: 20,
    type: "gateway",
    title: "Reviu disetujui?",
    desc: "Atasan dapat menyetujui reviu atau mengembalikannya sebagai revisi_capaian.",
  },
  {
    id: "t_revisi_reviu",
    lane: "atasan",
    col: 21,
    type: "user",
    title: "Kembalikan reviu",
    desc: "Reviu dikembalikan (status revisi_capaian) beserta alasan untuk diperbaiki pegawai.",
    icon: ArrowCounterClockwiseIcon,
    codeRef: "rejectReviu · lib/actions/reviu.ts:356",
    flag: "revisi",
  },

  // ── Lane Sistem ───────────────────────────────────────────────
  {
    id: "s_buat",
    lane: "sistem",
    col: 3,
    type: "service",
    title: "Buat draft + validasi",
    desc: "Sistem membuat dialog_kinerja beserta 5 aspek, mengecek hierarki atasan–pegawai, dan menolak duplikat periode triwulan/tahun.",
    icon: GearIcon,
    codeRef: "initiateDialog · lib/actions/pegawai.ts:314",
    notif: true,
  },
  {
    id: "link_catch",
    lane: "sistem",
    col: 4,
    sub: true,
    type: "link-catch",
    title: "Link: dari lanjutan",
    desc: "Dialog lanjutan yang dibuat dari reviu masuk kembali ke alur sebagai draft melalui link event ini.",
  },
  {
    id: "s_draft",
    lane: "sistem",
    col: 4,
    type: "intermediate",
    title: "Status dialog",
    desc: "Pengajuan jadwal tersimpan sebagai draft dan menunggu persetujuan atasan. Jika ditolak, kembali ke sini.",
    statusChip: "draft",
  },
  {
    id: "s_mp",
    lane: "sistem",
    col: 7,
    type: "intermediate",
    title: "Status dialog",
    desc: "Pengajuan disetujui. Pegawai (dan atasan, secara bersamaan) mengisi isian dialog.",
    statusChip: "menunggu_pegawai",
    notif: true,
  },
  {
    id: "s_ma",
    lane: "sistem",
    col: 9,
    type: "intermediate",
    title: "Status dialog",
    desc: "Pegawai sudah mengirim. Giliran atasan mengevaluasi dan menandatangani.",
    statusChip: "menunggu_atasan",
    notif: true,
  },
  {
    id: "s_mv",
    lane: "sistem",
    col: 12,
    type: "intermediate",
    title: "Status dialog",
    desc: "Evaluasi atasan selesai (is_valid_atasan = true). Menunggu penguncian sistem.",
    statusChip: "menunggu_validasi",
    notif: true,
  },
  {
    id: "t_kunci",
    lane: "sistem",
    col: 13,
    type: "service",
    title: "Kunci dialog → selesai",
    desc: "Sistem mengunci dialog dan menandainya selesai. Tampilan ini disederhanakan: langkah validasi final oleh pegawai tidak digambar.",
    icon: LockKeyIcon,
    codeRef: "validateDialog · lib/actions/pegawai.ts:251 (disederhanakan)",
    flag: "simplified",
    notif: true,
  },
  {
    id: "s_selesai",
    lane: "sistem",
    col: 14,
    type: "intermediate",
    title: "Status dialog",
    desc: "Dialog terkunci dan tidak dapat diubah lagi. Hasil dapat di-export dan reviu dapat dibuat.",
    statusChip: "selesai",
  },
  {
    id: "d_hasil",
    lane: "sistem",
    col: 14,
    sub: true,
    type: "data",
    title: "Dokumen hasil",
    desc: "Hasil dialog yang sudah selesai dapat di-export ke PDF atau Word (DOCX).",
    icon: FileArrowDownIcon,
  },
  {
    id: "s_r_ma",
    lane: "sistem",
    col: 18,
    type: "intermediate",
    title: "Status reviu",
    desc: "Reviu sudah dikirim pegawai dan menunggu persetujuan atasan.",
    statusChip: "menunggu_atasan",
    notif: true,
  },
  {
    id: "s_r_mv",
    lane: "sistem",
    col: 21,
    type: "intermediate",
    title: "Status reviu",
    desc: "Reviu disetujui atasan (is_valid_atasan = true). Menunggu penyelesaian sistem.",
    statusChip: "menunggu_validasi",
    notif: true,
  },
  {
    id: "t_rdone",
    lane: "sistem",
    col: 22,
    type: "service",
    title: "Tandai reviu selesai",
    desc: "Sistem menandai reviu selesai. Tampilan ini disederhanakan: langkah validasi final oleh pegawai tidak digambar.",
    icon: CheckCircleIcon,
    codeRef: "validateReviu · lib/actions/reviu.ts:421 (disederhanakan)",
    flag: "simplified",
    notif: true,
  },
  {
    id: "g_lanjut",
    lane: "sistem",
    col: 23,
    type: "gateway",
    title: "Ada item is_tercapai = false?",
    desc: "Pengecekan otomatis: hanya item yang tidak tercapai yang diteruskan ke dialog lanjutan.",
  },
  {
    id: "t_salin",
    lane: "sistem",
    col: 23,
    sub: true,
    type: "service",
    title: "Salin item ✗ → lanjutan",
    desc: "Item yang belum tercapai disalin ke dialog baru (id_dialog_induk). Satu dialog induk hanya boleh punya satu dialog lanjutan.",
    icon: CopySimpleIcon,
    codeRef: "createDialogLanjutan · lib/actions/lanjutan.ts:24",
    notif: true,
  },
  {
    id: "link_throw",
    lane: "sistem",
    col: 24,
    sub: true,
    type: "link-throw",
    title: "Link: kembali ke draft",
    desc: "Dialog lanjutan kembali ke awal alur (status draft) melalui link event ini.",
  },
  {
    id: "end",
    lane: "sistem",
    col: 24,
    type: "end",
    title: "Selesai",
    desc: "Semua item tercapai. Siklus dialog–reviu untuk periode ini berakhir di sini.",
  },
];

export const EDGES: BpmnEdge[] = [
  { id: "e01", from: "start", to: "t_ajukan", kind: "flow" },
  { id: "e02", from: "t_ajukan", to: "s_buat", kind: "flow" },
  { id: "e04", from: "s_buat", to: "s_draft", kind: "flow" },
  { id: "e05", from: "link_catch", to: "s_draft", kind: "flow" },
  { id: "e06", from: "s_draft", to: "t_tinjau", kind: "flow" },
  { id: "e07", from: "t_tinjau", to: "g_setuju", kind: "flow" },
  { id: "e08", from: "g_setuju", to: "t_tolak", kind: "flow", label: "Tolak", hideWith: "revisi" },
  { id: "e09", from: "g_setuju", to: "s_mp", kind: "flow", label: "Setuju", labelDy: -4 },
  { id: "e10", from: "t_tolak", to: "s_draft", kind: "return", label: "Kembali ke draft", hideWith: "revisi" },
  { id: "e11", from: "s_mp", to: "t_isi", kind: "flow" },
  { id: "e11_b", from: "s_mp", to: "t_isi_atasan", kind: "flow", label: "Dapat mengisi bersamaan", labelDy: -5 },
  { id: "e12", from: "t_isi", to: "s_ma", kind: "flow" },
  { id: "e12_b", from: "t_isi_atasan", to: "t_evaluasi", kind: "flow" },
  { id: "e13", from: "s_ma", to: "t_evaluasi", kind: "flow" },
  { id: "e14", from: "t_evaluasi", to: "g_eval", kind: "flow" },
  { id: "e15", from: "g_eval", to: "t_revisi", kind: "flow", label: "Perlu revisi", hideWith: "revisi" },
  { id: "e16", from: "g_eval", to: "s_mv", kind: "flow", label: "Setuju & TTD", labelDy: -4 },
  { id: "e17", from: "t_revisi", to: "t_isi", kind: "return", label: "Perbaiki & kirim ulang", hideWith: "revisi" },
  { id: "e18", from: "s_mv", to: "t_kunci", kind: "flow" },
  { id: "e19", from: "t_kunci", to: "s_selesai", kind: "flow" },
  { id: "e20", from: "s_selesai", to: "d_hasil", kind: "assoc" },
  { id: "e21", from: "s_selesai", to: "t_reviu", kind: "flow" },
  { id: "e22", from: "t_reviu", to: "g_item", kind: "flow" },
  { id: "e23", from: "g_item", to: "t_lengkapi", kind: "flow", label: "Lengkapi sesuai kondisi" },
  { id: "e24", from: "t_lengkapi", to: "s_r_ma", kind: "flow" },
  { id: "e25", from: "s_r_ma", to: "t_setuju_reviu", kind: "flow" },
  { id: "e26", from: "t_setuju_reviu", to: "g_reviu", kind: "flow" },
  { id: "e27", from: "g_reviu", to: "t_revisi_reviu", kind: "flow", label: "Kembalikan", hideWith: "revisi" },
  { id: "e28", from: "g_reviu", to: "s_r_mv", kind: "flow", label: "Setuju", labelDy: -4 },
  { id: "e29", from: "t_revisi_reviu", to: "t_reviu", kind: "return", label: "Revisi capaian", hideWith: "revisi" },
  { id: "e30", from: "s_r_mv", to: "t_rdone", kind: "flow" },
  { id: "e31", from: "t_rdone", to: "g_lanjut", kind: "flow" },
  { id: "e32", from: "g_lanjut", to: "end", kind: "flow", label: "Semua tercapai" },
  { id: "e33", from: "g_lanjut", to: "t_salin", kind: "flow", label: "Ada yang ✗", labelDx: 10 },
  { id: "e34", from: "t_salin", to: "link_throw", kind: "assoc" },
];

export const BPMN_TYPE_DETAILS: Record<
  BpmnNodeType,
  {
    name: string;
    standard: string;
    description: string;
    color: string;
  }
> = {
  start: {
    name: "Start Event",
    standard: "None Start Event (BPMN 2.0)",
    description: "Titik pemicu awal dimulainya alur dialog kinerja.",
    color: "#16A34A",
  },
  end: {
    name: "End Event",
    standard: "None End Event (BPMN 2.0)",
    description: "Titik akhir penyelesaian siklus dialog dan reviu kinerja.",
    color: "#DC2626",
  },
  intermediate: {
    name: "Intermediate Event",
    standard: "State / Milestone Intermediate Event",
    description: "Titik status atau penanda transisi tahapan penting dalam database.",
    color: "#2563EB",
  },
  user: {
    name: "User Task",
    standard: "Human / User Task (BPMN 2.0)",
    description: "Aktivitas manual yang harus diselesaikan oleh Pegawai atau Atasan melalui antarmuka web.",
    color: "#D97706",
  },
  service: {
    name: "Service Task",
    standard: "Automated Service Task (BPMN 2.0)",
    description: "Aksi otomatis yang dijalankan oleh backend/sistem (validasi, penguncian, duplikasi data).",
    color: "#7C3AED",
  },
  gateway: {
    name: "Exclusive Gateway (XOR)",
    standard: "Data-Based Exclusive Gateway (XOR)",
    description: "Percabangan kondisi logika; alur memilih tepat satu jalur berdasarkan hasil evaluasi/validasi.",
    color: "#0284C7",
  },
  data: {
    name: "Data Object",
    standard: "Data Object / Artifact (BPMN 2.0)",
    description: "Artefak informasi atau berkas digital (mis. berkas PDF atau Word DOCX hasil ekspor).",
    color: "#475569",
  },
  "link-catch": {
    name: "Link Catch Event",
    standard: "Intermediate Link Event (Catch)",
    description: "Titik penerima sambungan alur yang melompat dari tahapan lain (dialog lanjutan).",
    color: "#0D9488",
  },
  "link-throw": {
    name: "Link Throw Event",
    standard: "Intermediate Link Event (Throw)",
    description: "Titik pengirim sambungan alur untuk kembali ke fase awal tanpa garis potong silang.",
    color: "#0D9488",
  },
};

export const NODE_MAP: Record<string, BpmnNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n])
);

export function getNodeById(id: string): BpmnNode | undefined {
  return NODE_MAP[id];
}

export function getPhaseForCol(col: number) {
  return PHASES.find((p) => col >= p.from && col <= p.to) ?? PHASES[0];
}

