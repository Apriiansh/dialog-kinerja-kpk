# Plan: Pisah Fitur Atasan & Pegawai

**Tanggal:** 2026-08-13  
**Prioritas:** Tinggi  
**Estimasi waktu:** 1 hari kerja

---

## Latar Belakang

Saat ini semua halaman dan komponen untuk role **Atasan** dan **Pegawai** dicampur jadi satu,
menyebabkan sering terjadi merge conflict karena dua orang mengerjakan fitur berbeda di file yang sama.

Contoh masalah yang sudah terjadi:
- `app/(app)/dashboard/page.tsx` — campuran logika atasan dan pegawai dalam satu file
- `components/app-shell.tsx` — nav-group dan logika role dicampur, sulit dikerjakan paralel
- `app/(app)/dialog/` — dipakai pegawai, tapi ada juga route atasan di `app/(app)/dashboard/dialog/`

---

## Tujuan

Memisahkan file berdasarkan role menggunakan **Next.js Route Groups** sehingga:
- Tim bisa mengerjakan fitur atasan dan pegawai secara paralel tanpa conflict
- Tiap role punya `layout.tsx` sendiri → sidebar/shell yang berbeda bila perlu
- Navigasi dan auth guard per-role jadi lebih eksplisit

---

## Struktur Target

```
app/
└── (app)/
    ├── actions.ts                   # shared (logout, dll.)
    ├── (atasan)/                    # route group: hanya ATASAN
    │   ├── layout.tsx               # requireRole("ATASAN") + AppShell
    │   ├── dashboard/
    │   │   └── page.tsx             # Dashboard atasan (stats, daftar dialog)
    │   ├── dialog/
    │   │   ├── page.tsx             # Daftar semua dialog pegawai
    │   │   └── [id]/
    │   │       ├── page.tsx         # Detail dialog (view atasan)
    │   │       └── edit/
    │   │           └── page.tsx     # Edit/isi tanggung jawab atasan
    │   └── history/
    │       └── page.tsx             # Riwayat dialog yang sudah dikirim
    └── (pegawai)/                   # route group: hanya PEGAWAI
        ├── layout.tsx               # requireRole("PEGAWAI") + AppShell
        ├── dashboard/
        │   └── page.tsx             # Dashboard pegawai
        └── dialog/
            ├── page.tsx             # Dialog Kinerja Saya
            └── [id]/
                ├── page.tsx         # Detail dialog (view pegawai)
                ├── edit/
                │   └── page.tsx     # Isi aspek dialog
                └── actions.ts       # Server actions khusus pegawai
```

> **Catatan:** Route group `(atasan)` dan `(pegawai)` tidak mempengaruhi URL.
> URL tetap `/dashboard`, `/dialog`, dll.

---

## Rencana Migrasi (Step-by-Step)

### Step 1 — Buat layout per role

**File baru: `app/(app)/(atasan)/layout.tsx`**
```tsx
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/session";

export default async function AtasanLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ATASAN");
  return <AppShell session={session}>{children}</AppShell>;
}
```

**File baru: `app/(app)/(pegawai)/layout.tsx`**
```tsx
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/session";

export default async function PegawaiLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("PEGAWAI");
  return <AppShell session={session}>{children}</AppShell>;
}
```

Setelah ini, hapus atau kosongkan auth guard dari `app/(app)/layout.tsx`.

---

### Step 2 — Pindah halaman Atasan

| File Lama | File Baru |
|---|---|
| `app/(app)/dashboard/page.tsx` *(bagian atasan)* | `app/(app)/(atasan)/dashboard/page.tsx` |
| `app/(app)/dashboard/dialog/page.tsx` | `app/(app)/(atasan)/dialog/page.tsx` |
| `app/(app)/dashboard/dialog/[id]/page.tsx` | `app/(app)/(atasan)/dialog/[id]/page.tsx` |
| `app/(app)/dashboard/dialog/[id]/edit/page.tsx` | `app/(app)/(atasan)/dialog/[id]/edit/page.tsx` |
| `app/(app)/dashboard/history/page.tsx` | `app/(app)/(atasan)/history/page.tsx` |

---

### Step 3 — Pindah halaman Pegawai

| File Lama | File Baru |
|---|---|
| `app/(app)/dashboard/page.tsx` *(bagian pegawai)* | `app/(app)/(pegawai)/dashboard/page.tsx` |
| `app/(app)/dialog/page.tsx` | `app/(app)/(pegawai)/dialog/page.tsx` |
| `app/(app)/dialog/[id]/page.tsx` | `app/(app)/(pegawai)/dialog/[id]/page.tsx` |
| `app/(app)/dialog/[id]/edit/page.tsx` | `app/(app)/(pegawai)/dialog/[id]/edit/page.tsx` |
| `app/(app)/dialog/[id]/actions.ts` | `app/(app)/(pegawai)/dialog/[id]/actions.ts` |

---

### Step 4 — Pisah AppShell nav config (opsional)

Saat ini nav item sudah terpisah via `PEGAWAI_NAV_GROUPS` dan `ATASAN_NAV_GROUPS`
di `components/app-shell.tsx`. Cukup pastikan tidak ada sisa konflik di file ini.

Alternatif lebih clean: layout masing-masing kirim `navGroups` sebagai prop ke AppShell —
tapi ini opsional, bisa dikerjakan sprint berikutnya.

---

### Step 5 — Hapus folder lama & bersihkan

- Hapus `app/(app)/dashboard/` (sudah dipindah semua)
- Hapus `app/(app)/dialog/` (sudah dipindah ke `(pegawai)/dialog/`)
- Periksa tidak ada import yang masih menunjuk ke path lama
- Jalankan `npx tsc --noEmit` untuk verifikasi

---

## File yang Akan Disentuh

| File | Aksi |
|---|---|
| `app/(app)/layout.tsx` | Edit (kurangi auth, jadi wrapper tipis) |
| `app/(app)/(atasan)/layout.tsx` | Buat baru |
| `app/(app)/(pegawai)/layout.tsx` | Buat baru |
| `app/(app)/dashboard/page.tsx` | Pecah jadi 2 file, hapus aslinya |
| `app/(app)/dashboard/dialog/*` | Pindah ke `(atasan)/dialog/` |
| `app/(app)/dashboard/history/page.tsx` | Pindah ke `(atasan)/history/` |
| `app/(app)/dialog/*` | Pindah ke `(pegawai)/dialog/` |
| `components/app-shell.tsx` | Minor — pastikan nav group tidak konflik |
| `components/atasan-dashboard.tsx` | Kemungkinan merge ke `(atasan)/dashboard/page.tsx` |
| `components/pegawai-dashboard.tsx` | Kemungkinan merge ke `(pegawai)/dashboard/page.tsx` |

---

## Catatan Penting

- `requireRole("ATASAN")` di layout atasan otomatis redirect jika bukan atasan → tidak perlu guard di tiap page.
- File `actions.ts` shared (logout) tetap di `app/(app)/actions.ts`.
- Folder `(atasan)` dan `(pegawai)` yang sudah kosong di repo bisa langsung dipakai.

---

## Definisi Done

- [ ] Layout per role dibuat dan auth guard berjalan
- [ ] Semua halaman atasan pindah ke `(atasan)/`
- [ ] Semua halaman pegawai pindah ke `(pegawai)/`
- [ ] `npx tsc --noEmit` sukses tanpa error
- [ ] Login sebagai atasan → dashboard atasan muncul, nav atasan benar
- [ ] Login sebagai pegawai → dashboard pegawai muncul, nav pegawai benar
- [ ] Login sebagai atasan → akses `/dialog` (milik pegawai) di-redirect ke `/dashboard`
- [ ] Folder lama sudah dibersihkan
