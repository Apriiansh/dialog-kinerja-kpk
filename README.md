# Dialog Kinerja

Aplikasi web untuk alur kerja **Dialog Kinerja** — proses evaluasi kinerja antara atasan dan pegawai. Dibangun untuk lingkungan Biro SDM KPK.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.3 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| ORM | Prisma 7 + PostgreSQL (`@prisma/adapter-pg`) |
| Auth | iron-session (cookie-based) |
| Export | `docx` (Word), `@react-pdf/renderer` (PDF) |
| Icons | Phosphor Icons |
| Charts | Recharts |
| Signature | signature_pad (canvas) |
| Import | xlsx (Excel) |
| Validation | Zod |

## Role

| Role | Keterangan |
|---|---|
| **ADMIN** | Pengelola sistem — user management, metode pengembangan, monitoring dialog (read-only) |
| **ATASAN** | Penilai — membuat dialog, mengisi tanggung jawab, menandatangani, menyetujui reviu |
| **PEGAWAI** | Penilai diri sendiri — mengisi aspek kinerja, memvalidasi, membuat reviu tindak lanjut |

## Fitur

### Alur Dialog Kinerja

```
draft_atasan → menunggu_pegawai → menunggu_atasan → menunggu_validasi → selesai
```

1. **Atasan membuat dialog** — memilih pegawai, menyusun indikator tanggung jawab, target kerja, dan arahan pembinaan. Dapat mengisi bersamaan saat pegawai bekerja (kolaborasi real-time).
2. **Pegawai mengisi & submit** — melengkapi 5 aspek (SKP, Gap Asesmen, Perilaku, Karir Pendek, Karir Menengah) dengan item-item evaluasi, lalu mengirim ke atasan.
3. **Atasan menilai** — mengisi tanggung jawab atasan untuk setiap aspek, menandatangani, dan menyetujui.
4. **Pegawai memvalidasi** — memeriksa, menyetujui, dan menandatangani. Dialog terkunci.
5. **Selesai** — dokumen terkunci, bisa di-export ke Word/PDF.

### Alur Reviu (Tindak Lanjut)

```
draft_pegawai → menunggu_atasan → menunggu_validasi → selesai
```

Dibuat oleh pegawai setelah dialog selesai. Mencatat capaian, rencana tindak lanjut, dan tanggal reviu berikutnya.

**Aturan validasi saat submit reviu:**

- Semua item harus ditandai tercapai atau tidak tercapai (tidak ada yang terlewat).
- Jika **semua item tercapai**: `penjelasan_tercapai` wajib diisi.
- Jika **ada item tidak tercapai**: `penjelasan_tidak_tercapai`, `rencana_tindak_lanjut`, dan `tanggal_next_evaluasi` wajib diisi.
- Reviu menulis ulang status `is_tercapai` ke setiap `DialogKinerjaItem`.

### Siklus Berkelanjutan (Dialog → Reviu → Lanjutan)

Dialog Kinerja berjalan dalam siklus 6-bulan:

```
Dialog TW1 → Reviu → Dialog Lanjutan TW3 → Reviu → Dialog Lanjutan TW1 → ...
```

- **TW1 (Triwulan I)** — Perencanaan & Evaluasi tahun berjalan.
- **TW3 (Triwulan III)** — Monitoring Progres IDP.
- **Carry-over**: hanya item dengan `is_tercapai === false` yang diteruskan ke dialog lanjutan. Item tercapai dan belum direviu tidak disalin.
- **Buat Evaluasi**: tombol "Buat Evaluasi" muncul di halaman detail reviu yang sudah selesai, untuk membuat dialog lanjutan periode berikutnya.
- **Batasan**: setiap dialog maksimal memiliki 1 dialog lanjutan. Satu pegawai hanya boleh memiliki satu dialog per triwulan per tahun.

### Analisis Pencapaian Evaluasi

Dashboard pegawai, atasan, dan detail pegawai menampilkan analisis capaian berbasis item evaluasi yang sudah direviu.

**Rumus persentase pencapaian per periode:**

```
% pencapaian = tercapai / (tercapai + tidak tercapai) × 100
```

Aturan penghitungan:

- Satuan hitung adalah **item evaluasi** (`DialogKinerjaItem`) yang memenuhi syarat:
  - sudah direviu atasan (`is_tercapai` tidak `null`), dan
  - memiliki isi evaluasi (`dialog_evaluasi` tidak kosong)
- Item **belum direviu** tidak ikut dihitung (bukan dianggap gagal)
- Periode tanpa item tereviu **dilewati** (tidak dianggap 0%)
- Hasil dibulatkan (`Math.round`)

**Deduplikasi item lintas dialog:**

- Item yang carry-over dari dialog sebelumnya dihitung sekali saja.
- Deduplikasi berbasis teks `dialog_evaluasi` (case-insensitive, trimmed).
- Status dari dialog terbaru yang menang (dialog diurutkan `updated_at desc`).
- Grafik tren menggunakan deduplikasi global lintas periode — item yang sudah dihitung di periode sebelumnya dikecualikan dari periode berikutnya.

**Agregasi tim (dashboard atasan):** semua item tereviu milik seluruh bawahan digabungkan (*pooled*) per triwulan (tahun berjalan), lalu rumus yang sama diterapkan pada total gabungannya.

**Carry-over:** item dengan `is_tercapai = false` dari dialog terakhir yang memiliki reviu ditampilkan sebagai "Perlu Perhatian" di detail pegawai, dan otomatis disalin ke dialog lanjutan periode berikutnya.

### Admin

- **Dashboard** — ringkasan statis dialog, grafik status dialog, distribusi pengguna
- **User Management** — CRUD pengguna, pencarian/filter, paginasi, aktivasi/penonaktifan
- **Import Pengguna** — unggah Excel, pratinjau data, create/update per baris
- **Import Aspek Evaluasi** — unggah Excel 
evaluasi, data masuk ke staging dan otomatis di-insert ke dialog saat dibuat
- **Metode Pengembangan** — CRUD metode pengembangan (coaching, training, OJT, dll.)
- **Monitoring** — lihat detail dialog pegawai mana saja (read-only), termasuk semua periode

### Atasan

- **Dashboard** — kartu sapaan (carousel foto gedung), stat cards (jumlah pegawai, dialog aktif, menunggu atasan, selesai), grafik **Tren Pencapaian Evaluasi Tim** (rata-rata % capaian per triwulan tahun berjalan), kalender jadwal evaluasi (dari `tanggal_next_evaluasi` reviu), dan analitik capaian kinerja per pegawai & per aspek
- **Dialog** — buat dialog baru, isi tanggung jawab (bisa kolaborasi real-time), tanda tangani, ekspor. Input juga bisa dari import staging.
- **Pegawai** — CRUD bawahan, profil, riwayat dialog; halaman detail pegawai menampilkan **Tren Pencapaian Evaluasi** individu dan daftar **Carry-over** (item belum tercapai dari periode terakhir)
- **Reviu** — lihat, tanda tangani, dan menyetujui reviu dari pegawai
- **Histori** — daftar dialog yang sudah selesai

### Pegawai

- **Dashboard** — kartu sapaan (carousel foto gedung) dengan info NPP/jabatan/unit kerja, 4 stat cards (Dialog Kinerja, Total Evaluasi, Evaluasi Tercapai, Evaluasi Tidak Tercapai), grafik **Analisis Evaluasi Dialog Kinerja** (tren % pencapaian pribadi per periode dengan deduplikasi lintas dialog), donut hasil reviu, dan item mendesak
- **Dialog** — isi aspek kinerja, validasi + tanda tangan, ekspor
- **Reviu** — buat reviu tindak lanjut (capaian, rencana tindak lanjut, jadwal evaluasi berikutnya), edit draft, validasi

### Ekspor Dokumen

- **Word (.docx)** — native DOCX via `docx` npm package (logo, tabel biodata, tabel aspek, tanda tangan)
- **PDF** — client-side via `@react-pdf/renderer`, bisa auto-print
- Tersedia untuk dialog dan reviu

### Manajemen Profil

- Edit data diri (nama, NIP, jabatan, unit kerja, tanggal bergabung)
- Ubah password
- Atur role default saat login

## Setup

### Prasyarat

- Node.js 20+
- PostgreSQL 14+
- npm

### Instalasi

```bash
npm install
```

### Konfigurasi Environment

Buat file `.env` di root project:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dialog_kinerja_db?schema=public"
SESSION_SECRET="<acak-64-karakter-hex>"
```

### Database

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### Jalankan

```bash
npm run dev
```

Buka `http://localhost:3000`.

### Akun Seed

| NPP | Password | Role |
|---|---|---|
| `admin123` | `admin123` | ADMIN |
| `atasan123` | `atasan123` | ATASAN |
| `pegawai123` | `pegawai123` | PEGAWAI |

## Perintah

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate dev` | Jalankan migrasi |
| `npx prisma db seed` | Seed database |

## Struktur Project

```
app/
  (app)/
    admin/          → halaman admin (dashboard, users, monitoring, metode, import-data)
    atasan/         → halaman atasan (dashboard, dialog, pegawai, reviu, history)
    pegawai/        → halaman pegawai (dashboard, dialog, reviu)
    layout.tsx      → shared layout (auth guard)
  ttd/
    [file]/         → serve tanda tangan (route handler)
  unduh/
    [id]/           → ekspor Word (docx + legacy .doc)
  login/            → halaman login
  page.tsx          → landing page
lib/
  actions/          → server actions (auth, admin, atasan, pegawai, reviu, lanjutan, profile, import)
  auth/             → session, guards, rate limiting
  constants/        → aspek, status, triwulan, section definitions
  export/           → docx, word-legacy, pdf, ttd helpers
  utils/            → format, flash, chart colors, styles
components/
  shared/           → app-shell, status-badge, signature-pad, empty-state, unduh buttons
  dialog/           → create, edit, summary, responses form
  pegawai/          → form, aspek-input, detail-modal
  reviu/            → create, edit, summary, sign-form, lanjutan-button
  admin/            → user-form, import-dialog, metode-form
  profile/          → profile-view, edit, password, preferences
  dashboard/        → charts (bar, donut, trend line), chart-card, stat-card, greeting-card, pegawai-trend-card, evaluation-calendar
  ui/               → shadcn primitives (button, input, table, progress, toast, carousel)
  landing-carousel.tsx → hero carousel (landing page)
  landing-sections.tsx → aspek evaluasi & alur kerja (landing page)
  typewriter-text.tsx  → typewriter animation (landing page)
prisma/
  schema.prisma     → model dan enum
  seed.ts           → seed data
uploads/
  ttd/              → file tanda tangan (PNG, gitignored)
```
