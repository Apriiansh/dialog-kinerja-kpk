# Dialog Kinerja

Aplikasi web untuk alur kerja **Dialog Kinerja** — proses evaluasi kinerja antara atasan dan pegawai. Dibangun untuk lingkungan Biro SDM KPK.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.3 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| ORM | Prisma 7 + MariaDB (`@prisma/adapter-mariadb`) |
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

1. **Atasan membuat dialog** — memilih pegawai, mengisi deskripsi kinerja, lalu mengirim ke pegawai
2. **Pegawai mengisi** — melengkapi 5 aspek (SKP, Gap Asesmen, Perilaku, Karir Pendek, Karir Menengah) dengan item-item evaluasi
3. **Atasan menilai** — mengisi tanggung jawab atasan untuk setiap aspek, lalu menandatangani
4. **Pegawai memvalidasi** — memeriksa, menyetujui, dan menandatangani
5. **Selesai** — dokumen terkunci, bisa di-export ke Word/PDF

### Alur Reviu (Tindak Lanjut)

```
draft_pegawai → menunggu_atasan → menunggu_validasi → selesai
```

Dibuat oleh pegawai setelah dialog selesai. Mencatat capaian, rencana tindak lanjut, dan tanggal reviu berikutnya (dengan pengingat jika terlambat).

### Admin

- **Dashboard** — ringkasan statis dialog, grafik status dialog, distribusi pengguna
- **User Management** — CRUD pengguna, pencarian/filter, paginasi, aktivasi/penonaktifan
- **Import Pengguna** — unggah Excel, pratinjau data, create/update per baris
- **Metode Pengembangan** — CRUD metode pengembangan (coaching, training, OJT, dll.)
- **Monitoring** — lihat detail dialog pegawai mana saja (read-only)

### Atasan

- **Dashboard** — jumlah pegawai, dialog aktif, yang perlu ditindaklanjuti
- **Dialog** — buat dialog baru, isi tanggung jawab, tanda tangani, ekspor
- **Pegawai** — CRUD bawahan, profil, riwayat dialog
- **Reviu** — lihat dan tanda tangani reviu dari pegawai
- **Histori** — daftar dialog yang sudah selesai

### Pegawai

- **Dashboard** — profil singkat, ringkasan dialog, item mendesak dengan progress bar
- **Dialog** — isi aspek kinerja, validasi + tanda tangan, ekspor
- **Reviu** — buat reviu tindak lanjut, edit draft, validasi

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
- MariaDB / MySQL
- npm

### Instalasi

```bash
npm install
```

### Konfigurasi Environment

Buat file `.env` di root project:

```env
DATABASE_URL="mysql://user:password@localhost:3306/dialog_kinerja"
DATABASE_HOST="localhost"
DATABASE_USER="user"
DATABASE_PASSWORD="password"
DATABASE_NAME="dialog_kinerja"
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
    admin/          → halaman admin (dashboard, users, monitoring, metode)
    atasan/         → halaman atasan (dashboard, dialog, pegawai, reviu, history)
    pegawai/        → halaman pegawai (dashboard, dialog, reviu)
    layout.tsx      → shared layout (auth guard)
  api/
    ttd/            → serve tanda tangan
    unduh/          → ekspor Word (docx + legacy .doc)
  login/            → halaman login
lib/
  actions/          → server actions (auth, admin, atasan, pegawai, reviu, profile, import)
  auth/             → session, guards, rate limiting
  constants/        → aspek, status, section definitions
  export/           → docx, word-legacy, pdf, ttd helpers
  utils/            → format, flash, chart colors, styles
components/
  shared/           → app-shell, status-badge, signature-pad, unduh buttons
  dialog/           → create, edit, summary, responses form
  pegawai/          → form, aspek-input, detail-modal
  reviu/            → create, edit, summary, sign-form
  admin/            → user-form, import-dialog, metode-form
  profile/          → profile-view, edit, password, preferences
  dashboard/        → charts (bar, donut), chart-card
  ui/               → shadcn primitives (button, input, table, progress, toast)
prisma/
  schema.prisma     → model dan enum
  seed.ts           → seed data
uploads/
  ttd/              → file tanda tangan (PNG, gitignored)
```
