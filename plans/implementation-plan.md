# Implementation Plan: Pisah Route Group Atasan & Pegawai

## Goal

Memisahkan halaman dan server actions berdasarkan **role** menggunakan Next.js Route Groups. Saat ini semua halaman bercampur di `app/(app)/dashboard/` dan `app/(app)/dialog/`, menyebabkan potensi merge conflict dan logika `if (isAtasan)` yang menyatu dalam satu file. Setelah migrasi, setiap role punya `layout.tsx` sendiri dengan role guard yang eksplisit.

**URL tidak berubah** — Route groups `(atasan)` dan `(pegawai)` tidak mempengaruhi URL publik.

---

## User Review Required

> [!IMPORTANT]
> **Redirect di server actions** — `submitDialog` saat ini redirect ke `/dashboard/history`, dan `deleteDialog` redirect ke `/dashboard/dialog`. Karena URL tidak berubah oleh route groups, redirect ini tidak perlu diubah. ✅ Sudah dikonfirmasi.

> [!IMPORTANT]
> **`app/(app)/actions.ts` akan dipisah** — `logoutAction` tetap di `app/(app)/actions.ts`. Semua atasan actions (`startDialog`, `autosaveResponses`, `submitDialog`, `deleteDialog`) pindah ke `app/(app)/(atasan)/actions.ts`. Import di komponen yang menggunakannya akan diupdate.

> [!WARNING]
> **`app/(app)/layout.tsx` akan diubah** — Layout ini saat ini memanggil `requireAuth()` + render `<AppShell>`. Setelah migrasi, layout ini hanya memanggil `requireAuth()` tanpa render AppShell (AppShell dipindah ke masing-masing layout per role). Ini berarti jika ada route di `app/(app)/` yang bukan dalam `(atasan)` atau `(pegawai)`, mereka tidak akan punya AppShell.

---

## Open Questions

> [!NOTE]
> Semua pertanyaan desain sudah dijawab sebelum plan ini dibuat. Tidak ada open question.

---

## Proposed Changes

### Struktur Target

```
app/(app)/
├── layout.tsx              ← [MODIFY] Slim: hanya requireAuth(), tanpa AppShell
├── actions.ts              ← [MODIFY] Hanya logoutAction tersisa
├── (atasan)/
│   ├── layout.tsx          ← [NEW] requireRole("ATASAN") + AppShell
│   ├── actions.ts          ← [NEW] startDialog, autosaveResponses, submitDialog, deleteDialog
│   ├── dashboard/
│   │   └── page.tsx        ← [NEW] Dashboard khusus ATASAN (dipecah dari dashboard/page.tsx)
│   ├── dialog/
│   │   ├── page.tsx        ← [MOVE] dari dashboard/dialog/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx    ← [MOVE] dari dashboard/dialog/[id]/page.tsx
│   │       └── edit/
│   │           └── page.tsx ← [MOVE] dari dashboard/dialog/[id]/edit/page.tsx
│   └── history/
│       └── page.tsx        ← [MOVE] dari dashboard/history/page.tsx
└── (pegawai)/
    ├── layout.tsx          ← [NEW] requireRole("PEGAWAI") + AppShell
    ├── dashboard/
    │   └── page.tsx        ← [NEW] Dashboard khusus PEGAWAI (dipecah dari dashboard/page.tsx)
    └── dialog/
        ├── page.tsx        ← [MOVE] dari dialog/page.tsx
        └── [id]/
            ├── page.tsx    ← [MOVE] dari dialog/[id]/page.tsx
            ├── loading.tsx ← [MOVE] dari dialog/[id]/loading.tsx
            ├── edit/
            │   └── page.tsx ← [MOVE] dari dialog/[id]/edit/page.tsx
            └── actions.ts  ← [MOVE] dari dialog/[id]/actions.ts

# Folder lama yang akan dihapus:
app/(app)/dashboard/     ← [DELETE setelah semua dipindah]
app/(app)/dialog/        ← [DELETE setelah semua dipindah]
```

---

### Komponen A — Layout & Auth Guard

#### [MODIFY] `app/(app)/layout.tsx`

Sekarang: `requireAuth()` + render `<AppShell>`.  
Setelah: `requireAuth()` saja, **tanpa** render AppShell (dikembalikan ke tiap role).

```diff
- import { AppShell } from "@/components/app-shell";
  import { requireAuth } from "@/lib/session";

  export default async function AppLayout({ children }) {
    const session = await requireAuth();
-   return (
-     <AppShell session={{ id: session.id, npp: session.npp, nama: session.nama, role: session.role }}>
-       {children}
-     </AppShell>
-   );
+   return <>{children}</>;
  }
```

#### [NEW] `app/(app)/(atasan)/layout.tsx`

```tsx
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/session";

export default async function AtasanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("ATASAN");
  return (
    <AppShell
      session={{ id: session.id, npp: session.npp, nama: session.nama, role: session.role }}
    >
      {children}
    </AppShell>
  );
}
```

#### [NEW] `app/(app)/(pegawai)/layout.tsx`

```tsx
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/session";

export default async function PegawaiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("PEGAWAI");
  return (
    <AppShell
      session={{ id: session.id, npp: session.npp, nama: session.nama, role: session.role }}
    >
      {children}
    </AppShell>
  );
}
```

---

### Komponen B — Server Actions

#### [MODIFY] `app/(app)/actions.ts`

Hapus `startDialog`, `autosaveResponses`, `submitDialog`, `deleteDialog`. Hanya tersisa `logoutAction`.

```diff
  "use server";

  import { redirect } from "next/navigation";
- import { prisma } from "@/lib/prisma";
- import { getSession, requireRole } from "@/lib/session";
- import { JenisAspek } from "@/generated/prisma/client";
+ import { getSession } from "@/lib/session";

  export async function logoutAction() {
    const session = await getSession();
    await session.destroy();
    redirect("/login");
  }

- export async function startDialog(...) { ... }
- export async function autosaveResponses(...) { ... }
- export async function submitDialog(...) { ... }
- export async function deleteDialog(...) { ... }
```

#### [NEW] `app/(app)/(atasan)/actions.ts`

Konten penuh — isi identik dengan fungsi yang dipindah dari `app/(app)/actions.ts`, dengan perbaikan redirect:

```tsx
"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { JenisAspek } from "@/generated/prisma/client";

export async function startDialog(pegawaiId: number) {
  const session = await requireRole("ATASAN");
  const user = await prisma.user.findFirst({
    where: { id: pegawaiId, role: "PEGAWAI" },
    select: { id: true },
  });
  if (!user) redirect("/dashboard");

  const dialog = await prisma.dialogKinerja.create({
    data: {
      id_atasan: session.id,
      id_pegawai: pegawaiId,
      periode_tahun: new Date().getFullYear(),
      status: "draft_atasan",
      aspek: {
        create: Object.values(JenisAspek).map((jenis_aspek) => ({
          jenis_aspek,
        })),
      },
    },
    select: { id: true },
  });
  redirect(`/dialog/${dialog.id}/edit`);  // ← URL tidak berubah
}

export async function autosaveResponses(
  dialogId: number,
  values: Record<string, string>,
) {
  const session = await requireRole("ATASAN");
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true },
  });
  if (!dialog) return;

  await prisma.$transaction(
    Object.entries(values).map(([id, value]) =>
      prisma.dialogKinerjaAspek.updateMany({
        where: { id: Number(id), id_dialog: dialogId },
        data: { tanggung_jawab_atasan: value.trim() || null },
      }),
    ),
  );
}

export async function submitDialog(dialogId: number) {
  const session = await requireRole("ATASAN");
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true },
  });
  if (!dialog) redirect("/dashboard");

  await prisma.dialogKinerja.update({
    where: { id: dialogId },
    data: {
      status: "menunggu_pegawai",
      is_valid_atasan: true,
      waktu_validasi_atasan: new Date(),
    },
  });
  redirect("/history");  // ← Diupdate (URL baru setelah migrasi: /history bukan /dashboard/history)
}

export async function deleteDialog(dialogId: number) {
  const session = await requireRole("ATASAN");
  const dialog = await prisma.dialogKinerja.findFirst({
    where: { id: dialogId, id_atasan: session.id, status: "draft_atasan" },
    select: { id: true },
  });
  if (!dialog) redirect("/dialog");  // ← Diupdate (bukan /dashboard/dialog)

  await prisma.dialogKinerja.delete({ where: { id: dialogId } });
  redirect("/dialog");  // ← Diupdate (bukan /dashboard/dialog)
}
```

> [!NOTE]
> Redirect `startDialog` lama menuju `/dashboard/dialog/${id}/edit` — setelah migrasi URL-nya adalah `/dialog/${id}/edit` (route group tidak mempengaruhi URL, dan `dialog/` atasan kini berada di `(atasan)/dialog/`).

---

### Komponen C — Dashboard Pages (Dipecah)

#### [NEW] `app/(app)/(atasan)/dashboard/page.tsx`

Dipecah dari `dashboard/page.tsx` — hanya bagian `isAtasan === true`. Tidak ada lagi `if (isAtasan)` check. `requireRole("ATASAN")` sudah ada di layout, tapi kita tidak perlu panggil di page (cukup pakai session dari layout jika bisa, atau panggil ulang karena `requireRole` sudah di-cache per request).

```diff
- const isAtasan = session.role === "ATASAN";
- const [subordinates, dialogs] = await Promise.all([
-   isAtasan ? prisma.user.findMany(...) : Promise.resolve([]),
-   isAtasan ? prisma.dialogKinerja.findMany(...) : Promise.resolve([]),
- ]);
+ // Langsung fetch tanpa kondisi isAtasan
+ const [subordinates, dialogs] = await Promise.all([
+   prisma.user.findMany({ where: { role: "PEGAWAI", ... } }),
+   prisma.dialogKinerja.findMany({ where: { id_atasan: session.id } }),
+ ]);
```

#### [NEW] `app/(app)/(pegawai)/dashboard/page.tsx`

Dipecah dari `dashboard/page.tsx` — hanya bagian `isAtasan === false`. Menampilkan daftar dialog milik pegawai tersebut. Saat ini di `dashboard/page.tsx` bagian pegawai hanya placeholder kosong. Kita akan pakai [`pegawai-dashboard.tsx`](file:///C:/Users/magang.setjen19/Projects/dialog-kinerja-app/dialog-kinerja/components/pegawai-dashboard.tsx) (komponen yang sudah ada 11KB) untuk konten aktual.

> [!NOTE]
> File `components/pegawai-dashboard.tsx` yang berukuran 11KB ini ternyata sudah ada tapi **belum dipakai** di `dashboard/page.tsx`! Kita akan integrasikan di sini.

---

### Komponen D — Halaman Atasan (Move)

Semua file di bawah ini **dipindah tanpa perubahan konten** (hanya path berubah):

| File Lama | File Baru |
|---|---|
| `app/(app)/dashboard/dialog/page.tsx` | `app/(app)/(atasan)/dialog/page.tsx` |
| `app/(app)/dashboard/dialog/[id]/page.tsx` | `app/(app)/(atasan)/dialog/[id]/page.tsx` |
| `app/(app)/dashboard/dialog/[id]/edit/page.tsx` | `app/(app)/(atasan)/dialog/[id]/edit/page.tsx` |
| `app/(app)/dashboard/history/page.tsx` | `app/(app)/(atasan)/history/page.tsx` |

**Perubahan internal yang diperlukan:**

`(atasan)/dialog/[id]/page.tsx` — Update import `submitDialog`:
```diff
- import { submitDialog } from "@/app/(app)/actions";
+ import { submitDialog } from "@/app/(app)/(atasan)/actions";
```

`(atasan)/dialog/[id]/edit/page.tsx` — Update redirect internal:
```diff
- if (!dialog) redirect("/dashboard/dialog");
+ if (!dialog) redirect("/dialog");
- if (dialog.status !== "draft_atasan") redirect(`/dashboard/dialog/${dialog.id}`);
+ if (dialog.status !== "draft_atasan") redirect(`/dialog/${dialog.id}`);
```

Dan update back-link:
```diff
- href={`/dashboard/dialog/${dialog.id}`}
+ href={`/dialog/${dialog.id}`}
```

`(atasan)/dialog/[id]/edit/page.tsx` — Update import `DialogResponsesForm`:
```diff
- detailHref={`/dashboard/dialog/${dialog.id}`}
+ detailHref={`/dialog/${dialog.id}`}
```

---

### Komponen E — Halaman Pegawai (Move)

| File Lama | File Baru |
|---|---|
| `app/(app)/dialog/page.tsx` | `app/(app)/(pegawai)/dialog/page.tsx` |
| `app/(app)/dialog/[id]/page.tsx` | `app/(app)/(pegawai)/dialog/[id]/page.tsx` |
| `app/(app)/dialog/[id]/edit/page.tsx` | `app/(app)/(pegawai)/dialog/[id]/edit/page.tsx` |
| `app/(app)/dialog/[id]/loading.tsx` | `app/(app)/(pegawai)/dialog/[id]/loading.tsx` |
| `app/(app)/dialog/[id]/actions.ts` | `app/(app)/(pegawai)/dialog/[id]/actions.ts` |

**Perubahan internal:**

`(pegawai)/dialog/[id]/actions.ts` — Update `revalidatePath`:
```diff
  revalidatePath("/dashboard");
- revalidatePath(`/dialog/${dialog.id}`);
+ revalidatePath(`/dialog/${dialog.id}`);  // URL tidak berubah, tidak ada yang perlu diubah
```

Tidak ada perubahan konten yang diperlukan untuk file pegawai — URL-nya sudah benar.

---

### Komponen F — Komponen yang Mengimpor Actions Lama

#### [MODIFY] `components/new-dialog-button.tsx`

```diff
- import { startDialog } from "@/app/(app)/actions";
+ import { startDialog } from "@/app/(app)/(atasan)/actions";
```

#### [MODIFY] `components/delete-dialog-button.tsx`

```diff
- import { deleteDialog } from "@/app/(app)/actions";
+ import { deleteDialog } from "@/app/(app)/(atasan)/actions";
```

#### [MODIFY] `components/dialog-responses-form.tsx`

```diff
- import { autosaveResponses } from "@/app/(app)/actions";
+ import { autosaveResponses } from "@/app/(app)/(atasan)/actions";
```

> [!NOTE]
> `components/app-shell.tsx` mengimpor dari `@/app/(app)/actions` untuk `logoutAction`. Import ini **tidak perlu diubah** karena `logoutAction` tetap di `app/(app)/actions.ts`.

---

### Komponen G — Folder Lama (Delete)

Setelah semua dipindah dan diverifikasi:

- Hapus `app/(app)/dashboard/` (seluruh folder)
- Hapus `app/(app)/dialog/` (seluruh folder)

---

## Verification Plan

### Automated Tests

```powershell
# Di dalam folder dialog-kinerja/
# 1. TypeScript check — tidak ada error tipe
npx tsc --noEmit

# 2. Build check — pastikan tidak ada broken import/route
npm run build
```

### Manual Verification

Setelah server berjalan (`npm run dev`):

| Skenario | URL | Expected |
|---|---|---|
| Login sebagai **ATASAN** | `/dashboard` | Dashboard atasan (stats cards + daftar dialog) |
| Atasan akses dialog list | `/dialog` | Halaman "Dialog Kinerja" milik atasan |
| Atasan akses history | `/history` | Halaman riwayat atasan |
| Atasan akses URL pegawai | Tidak ada URL eksklusif pegawai | Atasan bisa lihat semua |
| Login sebagai **PEGAWAI** | `/dashboard` | Dashboard pegawai |
| Pegawai akses dialog saya | `/dialog` | Halaman "Dialog Kinerja Saya" pegawai |
| **Pegawai coba akses** `/history` | `/history` | Redirect ke `/dashboard` (bukan atasan) |
| Tidak login, akses `/dashboard` | Redirect ke `/login` | ✅ |
| Buat dialog baru (atasan) | Klik tombol "Mulai Dialog" | Redirect ke `/dialog/{id}/edit` |
| Kirim dialog (atasan) | Klik "Kirim" | Redirect ke `/history` |
| Hapus dialog (atasan) | Klik "Hapus" | Redirect ke `/dialog` |
| Isi dialog (pegawai) | `/dialog/{id}/edit` | Form terisi, submit OK |
| TypeScript | `npx tsc --noEmit` | 0 errors |
