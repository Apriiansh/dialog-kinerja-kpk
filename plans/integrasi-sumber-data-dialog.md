# Rencana Integrasi Data Sumber Eksternal ke Dialog Evaluasi
## (Revisi: Import Batch oleh Admin)

---

## Konsep Pendekatan (Revised)

**Perubahan dari rencana awal:** Alih-alih integrasi API real-time atau upload per-pegawai, semua data masuk lewat **Admin sebagai satu-satunya pintu import**, secara batch untuk seluruh pegawai sekaligus.

```
Admin upload Excel (SKP/Gap/Perilaku)
         ↓
Sistem deteksi kolom & cocokkan NPP/NIP
         ↓
Data masuk ke "Staging Table" per (npp, jenis_aspek, tahun, triwulan)
         ↓
Saat atasan buat dialog untuk pegawai X
         ↓
startDialog() tarik data staging → pre-fill items otomatis
         ↓
Pegawai buka halaman dialog → data sudah ada
```

---

## Kenapa Admin (Bukan Pegawai)?

| Aspek | Import per Pegawai | Import Batch oleh Admin |
|---|---|---|
| **Konsistensi data** | Berbeda-beda format per orang | Satu format baku per sistem sumber |
| **Volume** | N kali upload (satu per pegawai) | 1 kali upload untuk semua |
| **Validasi** | Susah dikontrol | Admin bisa review sebelum commit |
| **Sumber data** | Pegawai harus download sendiri | Admin download dari HRIS/HRS/Maestro langsung |
| **Timing** | Tidak terkontrol | Admin bisa set kapan data "aktif" |

---

## Arsitektur: Staging Table

### Schema Prisma (Baru)

```prisma
// Menyimpan data import sementara, per pegawai per periode per aspek
model ImportStagingItem {
  id            Int        @id @default(autoincrement())
  jenis_aspek   JenisAspek // SKP | GAP_ASESMEN | PERILAKU
  periode_tahun Int
  triwulan      Triwulan   // TW1 | TW3
  npp           String     @db.VarChar(50)

  // Konten utama (narasi yang akan masuk ke dialog_evaluasi)
  narasi        String     @db.Text
  // Data tambahan flexible (target, capaian %, nilai, dll.)
  metadata      Json?

  is_consumed   Boolean    @default(false)   // sudah dipakai oleh dialog?
  id_dialog     Int?                          // dialog yang mengkonsumsi
  imported_by   Int                           // admin user id
  imported_at   DateTime   @default(now())
  batch_id      String     @db.VarChar(100)  // untuk group per sesi import

  importer      User       @relation("ImportedBy", fields: [imported_by], references: [id])

  @@index([npp, jenis_aspek, periode_tahun, triwulan])
  @@index([batch_id])
  @@map("import_staging_items")
}
```

> **Catatan `batch_id`**: Setiap sesi import (satu file Excel) mendapat UUID unik. Berguna untuk rollback/hapus satu batch sekaligus jika ada kesalahan.

---

## Format Excel per Jenis Aspek

### A — SKP (dari HRIS / Data On)

| NPP | NIP | Nama Pegawai | Sasaran Kinerja | Target | Realisasi | % Capaian |
|---|---|---|---|---|---|---|
| 2000001 | 198801... | Siti Rahayu | Laporan Audit | 12 | 8 | 66.7% |

- Sistem **otomatis filter** baris dengan `% Capaian < 100%`
- Narasi yang dibuat: `"[Sasaran Kinerja] — Target: [Target], Capaian: [Realisasi] ([% Capaian]%)"`

### B — Gap Asesmen (dari Maestro)

| NPP | NIP | Nama Pegawai | Kompetensi | Level Saat Ini | Level Target | Gap | Catatan |
|---|---|---|---|---|---|---|---|
| 2000001 | 198801... | Siti Rahayu | Kepemimpinan | 3 | 5 | 2 | Perlu penguatan |

- Seluruh baris diimport (tidak difilter)
- Narasi: `"[Kompetensi]: Level [Saat Ini] → Target [Target] (Gap: [Gap]). [Catatan]"`

### C — Perilaku 360 (dari HRS / Haris)

| NPP | NIP | Nama Pegawai | Dimensi Perilaku | Nilai Akhir | Catatan Atasan |
|---|---|---|---|---|---|
| 2000001 | 198801... | Siti Rahayu | Integritas | Memuaskan | — |
| 2000001 | ... | Siti Rahayu | Inovasi | Di Bawah Sesuai | Perlu inisiatif lebih |

- Hanya tampilkan nilai ujung (Memuaskan / Sesuai / Di Bawah Sesuai)
- Narasi: `"[Dimensi]: [Nilai Akhir]"` (+ catatan jika ada)

---

## Auto-detect Kolom

Sistem tidak mewajibkan nama kolom yang persis sama. Pakai **fuzzy header matching**:

```ts
const COLUMN_ALIASES = {
  npp: ["npp", "no. pegawai", "kode pegawai", "id pegawai"],
  nip: ["nip", "nomor induk pegawai"],
  nama: ["nama", "nama pegawai", "nama lengkap"],
  sasaran: ["sasaran kinerja", "uraian kinerja", "kpi", "target kinerja"],
  capaian_persen: ["% capaian", "persen capaian", "capaian (%)", "persentase"],
  // dst...
};

function detectColumn(headers: string[], aliases: string[]): number {
  return headers.findIndex(h =>
    aliases.some(a => h.toLowerCase().includes(a.toLowerCase()))
  );
}
```

---

## Alur Admin (UI)

```
/admin/import-data
  ├── Tab: SKP (HRIS)
  ├── Tab: Gap Asesmen (Maestro)
  └── Tab: Perilaku 360 (HRS)

Flow per tab:
1. Pilih Tahun + Triwulan (TW1 / TW3)
2. Upload file .xlsx / .xls
3. Preview: sistem tampilkan tabel hasil deteksi kolom
   → Konfirmasi mapping kolom jika ada yg ambigu
4. Lihat preview baris: berapa pegawai terdeteksi, berapa baris valid
5. [Commit Import] → data masuk ke staging
6. Status: "Import berhasil — 127 item untuk 23 pegawai"
```

---

## Alur startDialog (Update)

Di `lib/actions/atasan.ts`:

```ts
// Setelah dialog + aspek dibuat...

const stagingItems = await prisma.importStagingItem.findMany({
  where: {
    npp: pegawai.npp,
    periode_tahun: tahun,
    triwulan: triwulanValue,
    is_consumed: false,
    jenis_aspek: { in: ["SKP", "GAP_ASESMEN", "PERILAKU"] },
  },
});

// Group by jenis_aspek, insert ke DialogKinerjaItem
for (const item of stagingItems) {
  const aspekId = newDialog.aspek.find(a => a.jenis_aspek === item.jenis_aspek)?.id;
  if (!aspekId) continue;

  await prisma.dialogKinerjaItem.create({
    data: {
      id_aspek: aspekId,
      dialog_evaluasi: item.narasi,
      // metadata bisa diurai jika perlu
    },
  });

  // Mark as consumed
  await prisma.importStagingItem.update({
    where: { id: item.id },
    data: { is_consumed: true, id_dialog: newDialog.id },
  });
}
```

---

## Apa yang Berubah di UI Pegawai

Saat pegawai buka halaman dialog, aspek SKP/Gap/Perilaku sudah terisi otomatis:

```
┌────────────────────────────────────────────┐
│  A — Evaluasi Kinerja (SKP)               │
│                                            │
│  ● [Dari HRIS] Laporan Audit — Target: 12  │
│    laporan, Capaian: 8 (66.7%)             │
│                                            │
│  ● [Dari HRIS] Sosialisasi SOP — Target:   │
│    3 sesi, Capaian: 1 (33%)                │
│                                            │
│  + Tambah item manual                      │
└────────────────────────────────────────────┘
```

---

## File yang Perlu Dibuat / Diubah

### Baru
- `prisma/schema.prisma` — tambah model `ImportStagingItem`
- `app/(app)/admin/import-data/page.tsx` — halaman import admin
- `app/(app)/admin/import-data/[jenis]/page.tsx` — per jenis aspek
- `app/api/admin/import/[jenis]/route.ts` — endpoint upload + parse
- `lib/import/parser.ts` — Excel parser + fuzzy column detection
- `lib/import/types.ts` — interface per jenis import
- `lib/import/validators.ts` — validasi baris (NPP ada di DB, dll.)

### Dimodifikasi
- `lib/actions/atasan.ts` (`startDialog`) — tarik staging items
- `components/pegawai/aspek-input.tsx` — tampilkan badge "Dari HRIS/HRS/Maestro"
- `app/(app)/admin/layout.tsx` atau nav — tambah menu "Import Data"

---

## Open Questions (Update)

1. **Timing import**: Admin bisa import kapan saja (sebelum/sesudah dialog dibuat)?
   - **Rekomendasi**: Ya, boleh kapan saja. Jika dialog sudah dibuat saat import terjadi, buat mekanisme "apply ke dialog existing".

2. **Overwrite**: Jika admin import dua kali untuk periode yang sama, apakah data lama di-replace?
   - **Rekomendasi**: Overwrite per-NPP per-batch. Tapi konfirmasi dulu ke user lewat warning "Ada X baris existing yang akan ditimpa".

3. **Data tidak ada di sistem**: Bagaimana jika NPP di Excel tidak terdaftar di sistem?
   - **Rekomendasi**: Skip + tampilkan warning dengan daftar NPP yang tidak dikenali.

4. **Rollback**: Apakah admin bisa batalkan satu sesi import?
   - **Rekomendasi**: Ya, via `batch_id` — tampilkan riwayat batch dan tombol "Batalkan".

5. **Seed baris 631**: `is_tercapai: Math.random() > 0.3` — ini perlu diganti ke nilai yang lebih deterministik di seed (bukan random) agar data konsisten tiap seed ulang.

---

## Prioritas Eksekusi (Revised)

```
1. Schema migration — tambah ImportStagingItem
2. lib/import/parser.ts — Excel parser + fuzzy detect
3. API endpoint upload + parse per jenis
4. Halaman admin import (UI preview + commit)
5. Update startDialog — tarik dari staging
6. UI badge "Dari HRIS/HRS/Maestro" di aspek items
```
