# Workflow Sistem — Dialog Kinerja (End-to-End)

Satu alur utuh dari **Dialog → Reviu → Dialog Lanjutan → Reviu lagi**, digabung dengan sisi
**sistem** (database, notifikasi, email). Warna status diambil dari enum `StatusDialog` &
`StatusReviu`.

## Diagram Utuh

```mermaid
flowchart TD
    Start([Mulai])

    subgraph PEGAWAI [Pegawai]
        direction TB
        P1[Klik Mulai Dialog /<br/>Ajukan Dialog Lanjutan]
        P4[Klik Isi Dialog lalu Kirim]
        P6[Tandatangani Validasi]
        P7[Klik Isi Evaluasi Kinerja]
        P8[Tandai item Tercapai /<br/>Tidak Tercapai]
        P10[Validasi Reviu]
        P11[Klik Ajukan Dialog Lanjutan]
    end

    subgraph ATASAN [Atasan]
        direction TB
        P2[Klik Mulai Dialog /<br/>Buat Dialog]
        P3[Klik Tinjau Pengajuan]
        P5[Klik Isi Dialog lalu Kirim]
        P9[Tanda tangan Reviu]
    end

    subgraph SISTEM [Sistem - Akses dan Proses DB]
        direction TB
        DB_U[users: cek hierarki<br/>atasan-bawahan]
        DB_D[DB dialog_kinerja + status]
        ST_D1{status = draft}
        ST_D2{status = menunggu_pegawai}
        ST_D3{status = menunggu_atasan}
        ST_D4{status = menunggu_validasi}
        ST_D5{dialog selesai}
        DB_R[DB reviu + status]
        ST_R1{reviu: draft_pegawai}
        ST_R2{reviu: menunggu_atasan}
        ST_R3{reviu: menunggu_validasi}
        ST_R4{reviu selesai}
        DB_L[DB dialog_kinerja lanjutan<br/>id_dialog_induk = dialog induk]
        NOTIF[Create Notification<br/>lib/notifications + tabel notifications]
        EMAIL[Job reminder email H-1 & H<br/>lib/dialog-reminders.ts + tabel dialog_email_log]
        REVIU_REMINDER[Job checkUpcomingReviuReminders<br/>lib/actions/recurring-notifications.ts]
        SALIN[Salin item induk yg is_tercapai=false<br/>ke dialog lanjutan lib/actions/lanjutan.ts:96]
    end

    %% ================= ALUR AWAL =================
    Start --> P1
    Start --> P2
    P1 --> DB_U
    P2 --> DB_U
    DB_U --> DB_D
    DB_D --> ST_D1

    %% Pengajuan -> atasan tinjau
    ST_D1 -- pengajuan jadwal --> P3
    P3 --> TINJAU{Atasan setujui jadwal?}
    TINJAU -- Tolak --> NOTIF
    NOTIF --> REJ[draft + alasan_tolak<br/>kembali ke pegawai] --> ST_D1
    TINJAU -- Setujui --> NOTIF
    NOTIF --> ST_D2

    %% menunggu_pegawai -> pegawai isi
    ST_D2 --> P4
    P4 --> NOTIF
    NOTIF --> ST_D3
    EMAIL --> ST_D2
    EMAIL --> ST_D3
    EMAIL --> ST_D4

    %% menunggu_atasan -> atasan evaluasi
    ST_D3 --> P5
    P5 --> NOTIF
    NOTIF --> ST_D4

    %% menunggu_validasi -> pegawai validasi
    ST_D4 --> P6
    P6 --> CK{is_valid_atasan?}
    CK -- belum --> ST_D4
    CK -- sudah --> ST_D5

    %% ================= REVIU =================
    ST_D5 --> REVIU_REMINDER
    ST_D5 --> P7
    P7 --> P8
    P8 --> NOTIF
    NOTIF --> ST_R1
    ST_R1 -- submit --> ST_R2
    ST_R2 --> P9
    P9 --> NOTIF
    NOTIF --> ST_R3
    ST_R3 --> P10
    P10 --> ST_R4

    %% ================= DIALOG LANJUTAN (LOOP) =================
    ST_R4 --> P11
    P11 --> GATE{Cek syarat dialog lanjutan}
    GATE -- Reviu/dialog induk belum selesai --> BLOKIR[Tidak bisa lanjut] --> End([Selesai])
    GATE -- Sudah ada 1 dialog lanjutan --> BLOKIR2[Sudah pernah dibuat] --> End
    GATE -- Memenuhi --> SALIN
    SALIN --> DB_L
    DB_L --> NOTIF
    NOTIF --> ST_D2

    %% ST_D2 kembali ke alur -> loop dialog lanjutan itu lagi
    ST_D2 --> P4
```

## Alur Status (urutan)

### Dialog (`StatusDialog`)
`draft` → `menunggu_pegawai` → `menunggu_atasan` → `menunggu_validasi` → `selesai`

- **draft** — panggulan jadwal, belum disetujui. Jika ditolak, kembali ke `draft` (alasan_tolak diisi).
- **menunggu_pegawai** — disetujui; pegawai (dan atasan) mengisi isian.
- **menunggu_atasan** — pegawai sudah isi; giliran atasan mengevaluasi & tanda tangan.
- **menunggu_validasi** — menunggu validasi pegawai (cek `is_valid_atasan`).
- **selesai** — dialog terkunci, bisa diunduh PDF/DOCX.

### Reviu (`StatusReviu`)
`draft_pegawai` → `menunggu_atasan` → `menunggu_validasi` → `selesai`

## Sisi Sistem (database & background)

| Proses | Lokasi kode | Efek DB |
|---|---|---|
| Hierarki atasan↔bawahan & peran | `lib/auth/guards.ts`, `capabilitiesForUser` | `users` (id_atasan, is_admin, as_pegawai) |
| Buat dialog (draft) | `lib/actions/atasan.ts:14`, `lib/actions/pegawai.ts:400` | `dialog_kinerja` + `dialog_kinerja_aspek` + `dialog_kinerja_item` |
| Setujui / tolak pengajuan | `lib/actions/atasan.ts:321 / 373` | `dialog_kinerja.status` + `alasan_tolak` |
| Simpan evaluasi pegawai | `saveDialogForm` `lib/actions/pegawai.ts:147` | status → `menunggu_atasan`, isi aspek/item |
| Evaluasi atasan | `submitEvaluasi` `lib/actions/atasan.ts:430` | status → `menunggu_validasi`, `is_valid_atasan` |
| Validasi pegawai | `validateDialog` `lib/actions/pegawai.ts:327` | status → `selesai` bila `is_valid_atasan` |
| Buat reviu | `createReviu/saveReviu` `lib/actions/reviu.ts:117/200` | `reviu` + tulis balik `is_tercapai` ke item dialog induk via `applyItemCapaian` (`reviu.ts:92`) |
| Submit reviu atasan | `submitReviuAtasan` `lib/actions/reviu.ts:304` | `reviu.status` → `menunggu_validasi` |
| Validasi reviu | `validateReviu` `lib/actions/reviu.ts:366` | `reviu.status` → `selesai` |
| **Dialog lanjutan** | `createDialogLanjutan` `lib/actions/lanjutan.ts:24` | salin item induk `is_tercapai=false` → dialog baru (`id_dialog_induk`) |
| Notifikasi in-app | `createNotification` `lib/notifications` | `notifications` |
| Email reminder H-1 & H | `runDialogReminderJob` `lib/dialog-reminders.ts` | `dialog_email_log` (dedup) |
| Reminder reviu | `checkUpcomingReviuReminders` `lib/actions/recurring-notifications.ts` | `notifications` |

## Catatan Ketelitian (decision)

- **"Yang tidak tercapai"** pada dialog lanjutan = `dialogKinerjaItem.is_tercapai === false` pada
  dialog induk, **bukan** field `is_tercapai` pada tabel `reviu`. Flag item itu di-update oleh
  reviu lewat `applyItemCapaian` (`lib/actions/reviu.ts:92`).
- Satu dialog induk hanya boleh punya **satu** `dialog_lanjutan` (guard `lib/actions/lanjutan.ts:69`
  dan `pegawai.ts:470`).
- Agar **loop** berlanjut: semua node harus `selesai` →
  dialog selesai → reviu selesai → dialog lanjutan selesai → reviu lagi ... dst.
