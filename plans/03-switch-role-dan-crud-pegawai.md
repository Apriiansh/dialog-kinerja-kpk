# Plan: Role Hierarki (Admin/Atasan/Pegawai) + Switch Role + CRUD

**Tanggal:** 2026-08-13
**Prioritas:** Tinggi
**Estimasi waktu:** 2–3 hari kerja (nambah 0.5–1 hari dari revisi awal karena ada modul Admin)

---

## Latar Belakang

`User.role` sekarang enum tunggal (`ATASAN` | `PEGAWAI`) — satu orang = satu peran tetap.
Masalah:
- Middle manager (pegawai yang juga punya bawahan) gak bisa berperan ganda.
- Gak ada cara switch antara mode Atasan dan Pegawai.
- Daftar pegawai atasan didapat dari filter `role + unit_kerja` (`lib/atasan-queries.ts`), bukan dari relasi hierarki asli.
- Gak ada role yang bisa monitoring seluruh aktivitas dialog kinerja & kelola semua user (butuh **Admin**).

## Keputusan Desain (revisi)

1. **Semua user otomatis punya kapabilitas Atasan** — gak perlu flag `as_atasan` terpisah, karena semua user boleh nambah bawahan. Field ini dihapus dari rencana awal karena nilainya konstan `true` di semua jalur kode (mubazir, berpotensi bikin state palsu).
2. **`as_pegawai`** (default `false`) satu-satunya flag yang menentukan apakah switcher Atasan↔Pegawai muncul — jadi `true` saat user ditambahkan sebagai bawahan oleh atasan lain.
3. **Hierarki eksplisit** lewat `User.id_atasan` (self-relation) — sumber kebenaran untuk "siapa bawahan siapa", independen dari `DialogKinerja`.
4. **Role admin baru**: `is_admin` (boolean, terpisah dari sistem atasan/pegawai) — admin bisa:
   - CRUD semua user (bukan cuma bawahan langsung), termasuk reset password & reassign `id_atasan`.
   - Monitoring seluruh `DialogKinerja` lintas unit (read-only, gak ikut campur isi dialog).
5. **Kapabilitas divalidasi ulang dari DB tiap kali switch role**, bukan cuma dipercaya dari session — mencegah session basi kalau status user berubah di tengah sesi (mis. dinonaktifkan, direassign).
6. **`is_active` dicek di setiap server action yang mutasi data**, bukan cuma saat login — user yang dinonaktifkan di tengah sesi langsung kehilangan akses tulis.
7. **Nonaktifkan atasan yang masih punya bawahan aktif → ditolak di level Atasan**, harus lewat Admin yang bisa reassign bawahannya dulu (mencegah bawahan "yatim").
8. Soft delete via `is_active` — dialog historis tetap utuh.
9. Validasi form CRUD pakai **zod**.
10. Peran aktif disimpan di **session cookie** (`iron-session`) — switch via server action, divalidasi ulang ke DB tiap kali.
11. `role` di-rename jadi **`default_role`** supaya jelas maknanya cuma "peran default saat login", bukan pembatas akses permanen.

---

## Perubahan Schema

### `prisma/schema.prisma`

```prisma
enum Role {
  ADMIN
  ATASAN
  PEGAWAI
}

model User {
  id                       Int       @id @default(autoincrement())
  npp                      String    @unique @db.VarChar(50)
  nip                      String?   @unique @db.VarChar(50)
  nama_pegawai             String    @db.VarChar(255)
  tanggal_bergabung        DateTime? @db.Date
  nama_jabatan             String?   @db.VarChar(150)
  unit_kerja               String?   @db.VarChar(150)
  masa_kerja_unit_terakhir String?   @db.VarChar(100)
  password                 String    @db.VarChar(255)

  default_role             Role      @default(PEGAWAI) // peran default saat login (bukan pembatas akses)
  as_pegawai               Boolean   @default(false)    // true kalau user ini bawahan seseorang
  is_admin                 Boolean   @default(false)    // kapabilitas admin, independen dari atasan/pegawai
  is_active                Boolean   @default(true)      // soft delete

  created_at               DateTime  @default(now())
  updated_at                DateTime @updatedAt

  id_atasan Int?
  atasan    User?  @relation("Hierarki", fields: [id_atasan], references: [id])
  bawahan   User[] @relation("Hierarki")

  dialogAsAtasan  DialogKinerja[] @relation("DialogAtasan")
  dialogAsPegawai DialogKinerja[] @relation("DialogPegawai")

  @@map("users")
}
```

> Catatan: `as_atasan` dari rencana sebelumnya **dihapus** — semua user otomatis bisa berperan Atasan tanpa perlu flag, jadi field itu gak pernah bernilai `false` di jalur kode manapun.

### Migrasi

```bash
npx prisma migrate dev --name role_hierarchy_admin_and_crud
npx prisma generate
```

### Backfill seed (`prisma/seed.ts`)

- Siti & Ahmad → `as_pegawai=true`, `id_atasan=Bambang.id`, `default_role=PEGAWAI`.
- Bambang → `as_pegawai=false` (gak ada atasan → switcher gak muncul, tapi tetap bisa mode Atasan).
- Tambah 1 user admin baru → `is_admin=true`, `as_pegawai=false`, `default_role=ADMIN`.

---

## Rincian Implementasi

### 1. Dependency

```bash
npm i zod
```

### 2. Session & kapabilitas peran

**File: `lib/session.ts`**

```ts
export function capabilitiesForUser(user: {
  is_admin: boolean;
  as_pegawai: boolean;
}): Role[] {
  const roles: Role[] = [];
  if (user.is_admin) roles.push("ADMIN");
  roles.push("ATASAN");
  if (user.as_pegawai) roles.push("PEGAWAI");
  return roles;
}
```

`SessionData` nambah `roles: Role[]`. `session.role` = peran aktif saat ini.

### 3. Login

**File: `app/login/actions.ts`**

- Tolak login jika `!user.is_active` → `"Akun Anda dinonaktifkan."`.
- `session.roles = capabilitiesForUser(user)`.
- Peran aktif awal: `user.default_role` kalau ada di `session.roles`, selain itu `session.roles[0]`.

### 4. Server action switch role — validasi ulang ke DB (bukan percaya session)

**File: `app/(app)/actions.ts`**

```ts
export async function switchRole(target: Role) {
  const session = await getSession();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { is_admin: true, as_pegawai: true, is_active: true },
  });

  if (!user || !user.is_active) {
    session.destroy();
    redirect("/login");
  }

  const roles = capabilitiesForUser(user);
  if (!roles.includes(target)) {
    redirect(homePathForRole(session.role ?? roles[0]));
  }

  session.role = target;
  session.roles = roles; // refresh, antisipasi kapabilitas berubah di tengah sesi
  await session.save();
  redirect(homePathForRole(target));
}
```

Kenapa query ulang ke DB: kalau cuma pakai `session.roles` yang di-set saat login, perubahan status (dinonaktifkan, direassign admin, dst.) di tengah sesi gak akan kedeteksi sampai user logout — celah otorisasi kecil tapi nyata.

### 5. Guard `is_active` per-request untuk mutasi

Semua server action yang mengubah data (`createPegawai`, `updatePegawai`, `nonaktifkanPegawai`, `startDialog`, aksi dialog kinerja, aksi admin) cek ulang `is_active` milik **pelaku aksi**, bukan cuma target:

```ts
async function assertActiveActor(userId: number) {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_active: true },
  });
  if (!actor?.is_active) {
    throw new Error("Sesi tidak valid — akun dinonaktifkan.");
  }
}
```

Dipanggil di awal tiap server action yang mutate data. Query ringan (by PK), overhead-nya kecil dibanding risikonya.

### 6. UI switch role

**File baru: `components/role-switcher.tsx`** (client)

- Render tombol/segmented control untuk tiap role di `session.roles` (bisa 2 atau 3: Admin/Atasan/Pegawai).
- **Kalau `roles.length < 2` → render `null`.**
- Tiap tombol `<form action={switchRole.bind(null, role)}>`, tombol aktif di-highlight.

**File: `components/app-shell.tsx`**

- Render `<RoleSwitcher roles={session.roles} activeRole={session.role} />` di footer sidebar, di atas `LogoutButton`.
- Nav group baru **Admin**: "Kelola Pengguna" (`/admin/users`), "Monitoring Dialog Kinerja" (`/admin/monitoring`).
- Nav group Atasan nambah item **"Pegawai"** (`/atasan/pegawai`).

### 7. Query daftar pegawai → subordinat langsung

| File | Perubahan |
|---|---|
| `lib/atasan-queries.ts` (`getAtasanPegawaiOptions`) | `where: { id_atasan: atasanId, is_active: true }` |
| `app/(app)/atasan/dashboard/page.tsx` | `count({ where: { id_atasan: session.id, is_active: true } })` |
| `lib/actions/atasan.ts` (`startDialog`) | target valid jika `id_atasan = session.id` & `is_active` |

Dialog flow existing (buat/isi/validasi/kirim/tanda tangan) **tidak berubah**.

### 8. CRUD Pegawai (level Atasan — cuma bawahan langsung)

#### Halaman

| File | Fungsi |
|---|---|
| `app/(app)/atasan/pegawai/page.tsx` | Daftar subordinat langsung + cari NPP/nama + tombol tambah + aksi edit/nonaktifkan/aktifkan |
| `app/(app)/atasan/pegawai/new/page.tsx` | Form buat pegawai |
| `app/(app)/atasan/pegawai/[id]/edit/page.tsx` | Form ubah pegawai |

#### Komponen form

**File baru: `components/pegawai-form.tsx`** (client, `useActionState`)

Field: NPP (wajib, `^\d{7}$`), NIP (opsional, unik), nama, tanggal bergabung, jabatan, unit kerja, masa kerja unit terakhir, password (wajib saat create, kosong = tidak diubah saat edit), badge `is_active` (read-only, mode edit saja).

Peran otomatis, tidak dipilih di form:
- **Create** → `as_pegawai=true`, `id_atasan=session.id`, `default_role=PEGAWAI`, `is_active=true`, `is_admin=false`.
- **Edit** → tidak mengubah `id_atasan` / `as_pegawai` / `is_admin`.

#### Server actions

**File baru: `lib/actions/pegawai-admin.ts`** (semua `requireRole("ATASAN")` + `assertActiveActor`)

- `createPegawai(state, formData)` — validasi zod, hash password, tangani `P2002` (NPP/NIP unik) dengan pesan ramah, kembalikan `values` biar input gak hilang saat error.
- `updatePegawai(state, formData)` — password kosong = tetap; isi = hash ulang. Tidak mengubah `id_atasan`/`as_pegawai`.
- `nonaktifkanPegawai(id)`:
  ```ts
  export async function nonaktifkanPegawai(id: number) {
    const session = await getSession();
    await assertActiveActor(session.id);
    if (id === session.id) return { error: "Tidak bisa menonaktifkan diri sendiri." };

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id_atasan: true },
    });
    if (target?.id_atasan !== session.id) {
      return { error: "Bukan bawahan langsung Anda." };
    }

    const bawahanAktif = await prisma.user.count({
      where: { id_atasan: id, is_active: true },
    });
    if (bawahanAktif > 0) {
      return {
        error:
          "Pegawai ini masih punya bawahan aktif. Hubungi Admin untuk memindahkan bawahannya dulu.",
      };
    }

    await prisma.user.update({ where: { id }, data: { is_active: false } });
  }
  ```
- `aktifkanPegawai(id)` — set `is_active=true`, validasi target = bawahan langsung.

**File baru: `components/delete-pegawai-button.tsx`** (client) — tombol nonaktifkan/aktifkan + `window.confirm` + tampil error via `useActionState`.

---

## Modul Admin (baru)

### Prinsip

- Admin **tidak ikut campur isi dialog kinerja** (evaluasi, tanggung jawab, tanda tangan) — perannya monitoring & tata kelola akun.
- Admin bisa CRUD **semua** user, termasuk lintas unit kerja dan reassign hierarki — beda dari Atasan yang cuma bisa kelola bawahan langsungnya sendiri.
- Guard: `requireRole("ADMIN")` di layout `app/(app)/admin/*`, plus `assertActiveActor` di tiap server action.

### Halaman

| File | Fungsi |
|---|---|
| `app/(app)/admin/layout.tsx` | Guard `requireRole("ADMIN")`, kirim `roles` ke `AppShell` |
| `app/(app)/admin/users/page.tsx` | Tabel semua user — filter unit kerja/status/role, cari NPP/nama, kolom atasan langsung |
| `app/(app)/admin/users/new/page.tsx` | Form buat user (bisa set `id_atasan`, `is_admin`, `default_role` manual) |
| `app/(app)/admin/users/[id]/edit/page.tsx` | Form ubah user + **reassign atasan** (dropdown pilih atasan baru) |
| `app/(app)/admin/monitoring/page.tsx` | Daftar semua `DialogKinerja` lintas unit — filter periode/status/unit kerja, link ke detail read-only |
| `app/(app)/admin/monitoring/[id]/page.tsx` | Detail dialog kinerja read-only (reuse komponen tampilan dialog yang sudah ada, tanpa tombol edit/validasi) |

### Komponen form

**File baru: `components/admin-user-form.tsx`** (client)

Field tambahan dibanding `pegawai-form.tsx`:
- **Atasan** (select, cari by nama/NPP, boleh kosong untuk top-level).
- **Jadikan Admin** (checkbox → `is_admin`).
- **Peran default login** (select `ADMIN`/`ATASAN`/`PEGAWAI`, cuma relevan buat UX awal login).

### Server actions

**File baru: `lib/actions/admin-users.ts`** (semua `requireRole("ADMIN")` + `assertActiveActor`)

- `createUser(state, formData)` — validasi zod, bisa set `id_atasan` bebas (termasuk `null`), `is_admin`, `default_role`.
- `updateUser(state, formData)` — termasuk **reassign `id_atasan`**, dengan validasi anti-cycle:
  ```ts
  async function wouldCreateCycle(userId: number, newAtasanId: number): Promise<boolean> {
    let current: number | null = newAtasanId;
    while (current) {
      if (current === userId) return true;
      const row = await prisma.user.findUnique({
        where: { id: current },
        select: { id_atasan: true },
      });
      current = row?.id_atasan ?? null;
    }
    return false;
  }
  ```
  Dipanggil sebelum update — kalau `true`, tolak dengan pesan "Tidak bisa menjadikan bawahan sendiri sebagai atasan."
- `deactivateUser(id)` — sama seperti `nonaktifkanPegawai` tapi tanpa batasan "bawahan langsung", plus cek bawahan aktif (kalau ada, admin harus reassign dulu lewat `updateUser`, atau nonaktifkan sekalian rantai ke bawah — pilih salah satu, disarankan **wajib reassign dulu** biar eksplisit).
- `reactivateUser(id)`.
- `resetPassword(id, newPassword)` — admin reset password user manapun tanpa perlu tahu password lama.

### Monitoring

- `getAllDialogKinerja(filter)` — query `DialogKinerja` tanpa filter kepemilikan (beda dari query atasan yang selalu `where: { id_atasan: session.id }`), dengan filter opsional: `periode_tahun`, `status`, `unit_kerja` (lewat `atasan.unit_kerja` atau `pegawai.unit_kerja`).
- Halaman detail **read-only murni** — jangan reuse komponen form isi dialog yang ada tombol submit/validasi; buat versi tampilan saja atau pass prop `readOnly` yang men-disable semua kontrol.

---

## File yang Akan Disentuh

| File | Aksi |
|---|---|
| `prisma/schema.prisma` | Edit — `Role.ADMIN`, rename `role→default_role`, `as_pegawai`, `is_admin`, `is_active`, `id_atasan` + relasi `Hierarki` |
| `prisma/seed.ts` | Edit — backfill hierarki + user admin |
| `package.json` | Edit — tambah `zod` |
| `lib/session.ts` | Edit — `roles` di `SessionData`, `capabilitiesForUser` |
| `lib/auth-helpers.ts` (baru/edit) | `assertActiveActor` |
| `app/login/actions.ts` | Edit — cek `is_active`, set `roles` & peran aktif |
| `app/(app)/actions.ts` | Edit — `switchRole` dengan validasi ulang DB |
| `components/role-switcher.tsx` | Baru |
| `components/app-shell.tsx` | Edit — nav Admin & Pegawai, render `RoleSwitcher` |
| `app/(app)/pegawai/layout.tsx`, `app/(app)/atasan/layout.tsx` | Edit — kirim `roles` |
| `app/(app)/admin/layout.tsx` | Baru — guard `ADMIN` |
| `lib/atasan-queries.ts` | Edit — filter `id_atasan` + `is_active` |
| `app/(app)/atasan/dashboard/page.tsx` | Edit — count subordinat |
| `lib/actions/atasan.ts` | Edit — `startDialog` validasi `id_atasan` + `is_active` |
| `lib/actions/pegawai-admin.ts` | Baru — CRUD bawahan langsung (level Atasan) |
| `lib/actions/admin-users.ts` | Baru — CRUD semua user + reassign + reset password (level Admin) |
| `lib/queries/admin-monitoring.ts` | Baru — `getAllDialogKinerja(filter)` |
| `components/pegawai-form.tsx`, `components/delete-pegawai-button.tsx` | Baru |
| `components/admin-user-form.tsx` | Baru |
| `app/(app)/atasan/pegawai/**` | Baru — CRUD bawahan langsung |
| `app/(app)/admin/users/**` | Baru — CRUD semua user |
| `app/(app)/admin/monitoring/**` | Baru — monitoring read-only |

---

## Catatan Penting

- `as_atasan` dari rencana sebelumnya dihapus — semua user otomatis bisa mode Atasan, gak ada flag yang nilainya konstan.
- Switcher role muncul kalau `session.roles.length > 1` — otomatis mencakup kombinasi Admin+Atasan, Atasan+Pegawai, atau Admin+Atasan+Pegawai.
- `switchRole` **selalu query ulang ke DB**, gak percaya `session.roles` yang lama — mencegah akses basi kalau status berubah di tengah sesi.
- Semua server action mutasi data **wajib** `assertActiveActor` di awal — bukan cuma dicek saat login.
- Nonaktifkan user yang masih punya bawahan aktif: **ditolak di level Atasan**, harus admin yang reassign bawahannya dulu lewat `updateUser` (anti-cycle check ada).
- Admin **read-only** terhadap isi dialog kinerja — cuma monitoring, gak ada tombol edit/validasi di halaman admin.
- `role` di-rename `default_role` supaya gak disalahartikan sebagai pembatas akses.
- Soft delete tetap dipertahankan — dialog historis utuh walau user dinonaktifkan.

---

## Verifikasi

```bash
npm i zod
npx prisma migrate dev --name role_hierarchy_admin_and_crud
npx prisma generate
npm run lint
npm run build
```

> **Status 2026-08-13:** Implementasi selesai di branch `feature/role-hierarchy-admin-crud`.
> `npx tsc --noEmit`, `npm run lint`, dan `npm run build` semuanya sukses.

> **Status 2026-08-13 (follow-up):**
> - **Masa Kerja Unit Terakhir** diubah jadi input `type="date"`; pada submit dihitung otomatis jadi string durasi **"X Tahun X Bulan X Hari"** (helper baru `formatDurasiKeHariIni` di `lib/format.ts`) dan disimpan di kolom string yang sudah ada (**tanpa migrasi**). Preview durasi live tampil di bawah input. Data lama teks (mis. "3 tahun") tetap terbaca saat edit lewat `parseDurasi`.
> - **NIP maksimal 18 digit**: `maxLength={18}` + `inputMode="numeric"` di kedua form, dan zod `.regex(/^\d{0,18}$/)` di `pegawai-admin.ts` & `admin-users.ts`.
> - **Tombol Edit** ditambahkan di tiap baris daftar Kelola Pengguna (`/admin/users`) dan daftar Pegawai atasan (`/atasan/pegawai`) — menuju halaman edit yang sudah ada. Kolom aksi diperlebar (header "Status" → "Aksi").
> - NPP tetap tepat 7 digit (`maxLength={7}` + zod `^\d{7}$`); laporan "masih bisa lebih dari 7" di form Tambah Pengguna disepakati sebagai dev server yang belum di-reload.

### Penyimpangan dari rencana (dictatat saat implementasi)

- `assertActiveActor` mengembalikan **error string** (`string | null`) alih-alih `throw` — konsisten dengan pola `{ error }` yang dipakai server action lain.
- `components/delete-pegawai-button.tsx` diwujudkan sebagai **`components/pegawai-status-button.tsx`** (tombol Nonaktifkan/Aktifkan + `window.confirm` + error inline). Versi admin: **`components/admin-user-status-button.tsx`**.
- `lib/queries/admin-monitoring.ts` tidak dibuat — query monitoring ditulis inline di halaman admin (mudah dibaca, satu-satunya konsumennya).
- Form pegawai & admin user memakai **state manual** (bukan `useActionState`) mengikuti pola `dialog-form.tsx` yang sudah ada di codebase.
- Helper `pegawaiFormDefaults` / `adminUserFormDefaults` dipindah ke **`lib/user-form-defaults.ts`** — file `"use server"` hanya boleh mengekspor fungsi async.
- `toValues` di `admin-users.ts` selalu memasukkan semua key (default `""`) — checkbox yang tidak dicentang tidak muncul di `FormData`, dan `z.string()` gagal pada `undefined`.
- Validasi **anti-cycle** diterapkan ke semua reassign `id_atasan` (bukan hanya saat konversi admin), plus admin **tidak boleh menghapus peran admin pada akun sendiri**.
- Ditambah halaman **`app/(app)/admin/dashboard/page.tsx`** sebagai home admin (`homePathForRole("ADMIN")`).

## Definisi Done

- [x] Migrasi sukses (`Role.ADMIN`, `default_role`, `as_pegawai`, `is_admin`, `is_active`, `id_atasan` + relasi `Hierarki`)
- [x] Seed backfill hierarki + 1 user admin
- [x] Login menolak `is_active: false`
- [x] `session.roles` terisi benar untuk kombinasi Admin/Atasan/Pegawai
- [x] `switchRole` query ulang ke DB tiap kali dipanggil, redirect sesuai `homePathForRole`
- [x] Switcher cuma tampil kalau `roles.length > 1`
- [x] Tiap server action mutasi data manggil `assertActiveActor`
- [x] CRUD pegawai level Atasan: create/edit/nonaktifkan/aktifkan bawahan langsung, validasi zod, password hashed
- [x] Nonaktifkan bawahan yang masih punya bawahan aktif → ditolak dengan pesan jelas
- [x] Modul Admin: CRUD semua user (termasuk reassign `id_atasan` dengan anti-cycle check), reset password
- [x] Modul Admin: monitoring seluruh `DialogKinerja` lintas unit, halaman detail read-only murni
- [x] Dialog flow existing (buat/isi/validasi/kirim/tanda tangan) tidak berubah
- [x] `npm run lint` & `npm run build` sukses