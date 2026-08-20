# Rencana Integrasi Data Sumber Eksternal ke Dialog Evaluasi

## Latar Belakang

Saat ini, seluruh kolom `dialog_evaluasi` (kolom isian per aspek pada `DialogKinerjaItem`) diisi manual oleh atasan. Berdasarkan kebutuhan bisnis baru, beberapa aspek seharusnya **diisi otomatis dari sumber data eksternal**, sehingga atasan tidak perlu mengisi dari nol — cukup melakukan verifikasi atau menambahkan catatan.

---

## Sumber Data per Aspek

| Aspek | Kode | Sumber Data | Metode | Apa yang Ditampilkan |
|---|---|---|---|---|
| **SKP** | A | HRIS / Data On (API) | REST API | Narasi target KPI dengan pencapaian < 100% |
| **Gap Asesmen** | B | Maestro (assessment mgmt) | Import Excel | Seluruh data dari file |
| **Perilaku 360** | C | HRS / Haris (API) | REST API | Nilai ujung (Memuaskan/Sesuai/Di bawah sesuai) + catatan |
| **Karir Jangka Pendek** | D.1 | Pegawai sendiri | Free text manual | Aspirasi karir 1–2 tahun |
| **Karir Jangka Menengah** | D.2 | Pegawai sendiri | Free text manual | Aspirasi karir 3–5 tahun |

---

## Analisis State Saat Ini

### Schema Relevan

```
DialogKinerja
  └── aspek: DialogKinerjaAspek[]  (jenis_aspek: SKP | GAP_ASESMEN | PERILAKU | KARIR_PENDEK | KARIR_MENENGAH)
        ├── tanggung_jawab_pegawai: Text   → isian pegawai
        ├── tanggung_jawab_atasan: Text    → isian atasan
        └── item: DialogKinerjaItem[]
              ├── dialog_evaluasi: Text    → narasi evaluasi utama
              ├── kompetensi_dikembangkan: Text
              ├── id_metode_pengembangan: Int?
              └── waktu_pelaksanaan: DateTime?
```

**Alur saat ini:**
1. Atasan `startDialog` → membuat `DialogKinerja` + 5 `DialogKinerjaAspek` kosong
2. Atasan mengisi `tanggung_jawab_atasan` per aspek
3. Pegawai mengisi `tanggung_jawab_pegawai` + item-item per aspek
4. Reviu → selesai

### Yang Perlu Berubah

- **SKP & PERILAKU**: Saat `startDialog`, sistem fetch API eksternal dan pre-populate item-item secara otomatis
- **GAP_ASESMEN**: Flow import Excel setelah dialog dibuat — atasan upload file Maestro
- **KARIR_PENDEK & KARIR_MENENGAH**: Tidak berubah, tetap free text pegawai

---

## Rencana Implementasi

### Fase 1 — Fondasi & Simulasi (Mock dulu, API nyata menyusul)

#### 1A. Tambah field sumber data di schema (migrasi DB)

Di `DialogKinerjaAspek`:
```prisma
sumber_data_status  String?   @db.VarChar(50)   // "pending" | "loaded" | "manual" | null
sumber_data_error   String?   @db.Text           // pesan error jika fetch gagal
sumber_data_at      DateTime?                    // kapan terakhir data ditarik
```

Di `DialogKinerjaItem`:
```prisma
is_from_external    Boolean   @default(false)    // apakah item ini dari sumber eksternal
external_ref_id     String?   @db.VarChar(100)   // ID referensi di sistem sumber (KPI ID dll)
```

Setelah edit schema: `npx prisma migrate dev`

---

#### 1B. Buat abstraksi service layer

```
lib/
  integrations/
    hris/
      client.ts      → fetchSkpData(npp, tahun): Promise<SkpKpiItem[]>
      types.ts       → interface SkpKpiItem
    hrs/
      client.ts      → fetchPerilakuData(npp, tahun): Promise<PerilakuItem[]>
      types.ts       → interface PerilakuItem
    maestro/
      parser.ts      → parseGapAsesmen(buffer: Buffer): GapAssesmenItem[]
      types.ts       → interface GapAssesmenItem
    index.ts         → re-export semua
```

**Contoh mock sementara (`lib/integrations/hris/client.ts`):**
```ts
export async function fetchSkpData(npp: string, tahun: number): Promise<SkpKpiItem[]> {
  // TODO: ganti dengan fetch nyata ke Data On
  // const res = await fetch(`${process.env.HRIS_API_URL}/kpi?npp=${npp}&tahun=${tahun}`, {
  //   headers: { Authorization: `Bearer ${process.env.HRIS_API_KEY}` }
  // });
  // return res.json();

  // Mock sementara:
  return [
    { id: "KPI-001", namaKpi: "Penyelesaian Laporan Audit", target: "12 laporan", capaian: 8, persentase: 66.7 },
    { id: "KPI-002", namaKpi: "Pelatihan Internal Diikuti", target: "4 sesi", capaian: 2, persentase: 50 },
  ].filter(kpi => kpi.persentase < 100); // hanya yang belum tercapai
}
```

**Contoh mock Perilaku 360 (`lib/integrations/hrs/client.ts`):**
```ts
export async function fetchPerilakuData(npp: string, tahun: number): Promise<PerilakuItem[]> {
  // Mock sementara — hanya nilai ujung + catatan:
  return [
    { aspek: "Integritas", nilai: "Memuaskan", catatan: null },
    { aspek: "Kerjasama Tim", nilai: "Sesuai", catatan: null },
    { aspek: "Inovasi", nilai: "Di Bawah Sesuai", catatan: "Perlu inisiatif lebih" },
  ];
}
```

---

#### 1C. Update `startDialog` — populate otomatis

Di `lib/actions/atasan.ts`, setelah `prisma.dialogKinerja.create(...)`:

```ts
import { fetchSkpData, fetchPerilakuData } from "@/lib/integrations";

// Fetch data eksternal (fail gracefully)
const [skpItems, perilakuItems] = await Promise.allSettled([
  fetchSkpData(pegawai.npp, tahun),
  fetchPerilakuData(pegawai.npp, tahun),
]);

// Populate aspek SKP
if (skpItems.status === "fulfilled" && skpItems.value.length > 0) {
  await prisma.dialogKinerjaItem.createMany({
    data: skpItems.value.map(kpi => ({
      id_aspek: newDialog.aspek.find(a => a.jenis_aspek === "SKP")!.id,
      dialog_evaluasi: `${kpi.namaKpi} — Target: ${kpi.target}, Capaian: ${kpi.persentase}%`,
      is_from_external: true,
      external_ref_id: kpi.id,
    }))
  });
  await prisma.dialogKinerjaAspek.update({
    where: { id: aspekSkpId },
    data: { sumber_data_status: "loaded", sumber_data_at: new Date() }
  });
} else {
  await prisma.dialogKinerjaAspek.update({
    where: { id: aspekSkpId },
    data: { sumber_data_status: "manual" }  // fallback: diisi manual
  });
}

// Serupa untuk PERILAKU...
```

> **Kebijakan fallback**: Jika API tidak bisa diakses, dialog tetap dibuat dengan aspek kosong (`sumber_data_status: "manual"`). Tidak membatalkan proses pembuatan dialog.

---

### Fase 2 — Import Excel untuk Gap Asesmen

#### 2A. Install dependency

```bash
npm install xlsx
# atau
npm install exceljs
```

#### 2B. Endpoint upload

```
app/api/dialog/[dialogId]/import-gap-asesmen/route.ts
```

```ts
export async function POST(req: Request, { params }) {
  const session = await requireRole("ATASAN");
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const buffer = Buffer.from(await file.arrayBuffer());

  const items = parseGapAsesmen(buffer); // dari lib/integrations/maestro/parser.ts

  // Insert ke DB
  await prisma.dialogKinerjaItem.createMany({
    data: items.map(item => ({
      id_aspek: aspekGapId,
      dialog_evaluasi: `${item.kompetensi} — Gap: ${item.gap}, ${item.catatan}`,
      is_from_external: true,
    }))
  });

  return Response.json({ ok: true, count: items.length });
}
```

#### 2C. Komponen UI upload

```
components/dialog/import-gap-asesmen-button.tsx
```

**Flow UX:**
1. Tombol "📥 Import dari Maestro" di card aspek B
2. Klik → modal file picker (`.xlsx`, `.xls`)
3. Upload → preview tabel di modal
4. Atasan konfirmasi → POST ke endpoint → data masuk

**Format Excel Maestro yang diharapkan:**

| Kompetensi | Gap Level | Level Saat Ini | Level Target | Catatan |
|---|---|---|---|---|
| Kepemimpinan | 2 | 3 | 5 | Perlu penguatan leadership |

---

### Fase 3 — Penyesuaian Tampilan UI

#### 3A. Badge "Dari Sistem" untuk item eksternal

Di `components/pegawai/aspek-input.tsx` dan tampilan detail dialog — item dengan `is_from_external: true` ditampilkan dengan:
- Badge `● Dari HRIS` (biru) / `● Dari HRS` / `● Dari Maestro`
- Item tidak bisa dihapus (protected)
- Atasan bisa **menambah item baru** secara manual di luar yang sudah ada

#### 3B. Status card di aspek GAP_ASESMEN

```
╔══════════════════════════════╗
║  B — Evaluasi Gap Asesmen    ║
║  ✅ Diimport: 20 Agt 2026    ║
║  📊 5 item                   ║
║  [↑ Import Ulang dari Excel] ║
╚══════════════════════════════╝
```

Atau jika belum diimport:
```
╔══════════════════════════════╗
║  B — Evaluasi Gap Asesmen    ║
║  ⚠️  Belum diimport          ║
║  [📥 Import dari Maestro]    ║
╚══════════════════════════════╝
```

#### 3C. Aspek Karir D.1 & D.2 — tidak berubah

Free text pegawai, tidak ada modifikasi alur.

---

### Fase 4 — Integrasi API Nyata (saat credential tersedia)

| Sistem | Env Variable | Metode |
|---|---|---|
| HRIS / Data On | `HRIS_API_URL`, `HRIS_API_KEY` | REST GET |
| HRS / Haris | `HRS_API_URL`, `HRS_API_KEY` | REST GET |

Cukup ganti isi `lib/integrations/hris/client.ts` dan `lib/integrations/hrs/client.ts` — tidak ada perubahan di UI, action, atau schema.

---

## Ringkasan File yang Berubah

### Baru
- `lib/integrations/hris/client.ts` + `types.ts`
- `lib/integrations/hrs/client.ts` + `types.ts`
- `lib/integrations/maestro/parser.ts` + `types.ts`
- `lib/integrations/index.ts`
- `app/api/dialog/[dialogId]/import-gap-asesmen/route.ts`
- `components/dialog/import-gap-asesmen-button.tsx`

### Dimodifikasi
- `prisma/schema.prisma` — tambah 5 field baru
- `lib/actions/atasan.ts` — populate data saat `startDialog`
- `components/dialog/responses-form.tsx` — badge eksternal, status import
- `components/pegawai/aspek-input.tsx` — (cek apakah perlu penyesuaian)

---

## Open Questions

> Perlu dikonfirmasi sebelum eksekusi Fase 4:

1. **Dokumentasi API HRIS/Data On** — format endpoint, auth method (API Key / OAuth / JWT)?
2. **Dokumentasi API HRS/Haris** — sama seperti di atas
3. **Contoh file Excel Maestro** — perlu 1 file sample untuk bikin parser yang akurat
4. **Kapan fetch dilakukan?** Otomatis saat `startDialog`, atau ada tombol manual "Tarik Data dari HRIS"?
5. **Boleh hapus item eksternal?** Apakah atasan bisa menghapus item yang datang dari HRIS jika tidak relevan?
6. **Catatan perilaku** — apakah catatan atasan di Perilaku 360 jadi field terpisah atau gabung di `dialog_evaluasi`?
7. **Fallback SKP/Perilaku** — jika API gagal saat buat dialog, apakah dialog tetap dibuat (kosong) atau dibatalkan?

---

## Prioritas Eksekusi

```
1. Fase 1A — schema migration dulu (paling krusial, DB change)
2. Fase 1B — buat service layer dengan mock data
3. Fase 1C — update startDialog untuk populate
4. Fase 2  — import Excel Gap Asesmen
5. Fase 3  — UI badges & status card
6. Fase 4  — swap mock ke API nyata (saat credential tersedia)
```
