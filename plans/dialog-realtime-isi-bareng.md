# Rencana: Dialog Kinerja Realtime (Isi Bareng Pegawai + Atasan)

> Status: **belum diimplementasikan** — catatan desain untuk eksekusi nanti.
> Dibuat setelah eksplorasi kodebase & konfirmasi keputusan desain dengan user.

---

## Konsep

Saat status dialog = `menunggu_pegawai`, kedua pihak membuka halaman secara bersamaan dan saling melihat isian terbaru satu sama lain (kolaborasi ala Google Docs versi sederhana):

```
Pegawai mengisi item evaluasi + tanggung jawabnya
         ↓ (autosave debounce 800ms)
Atasan melihat isian pegawai muncul live di halaman detail dialog
         ↓
Atasan mengisi tanggung_jawab_atasan secara BERSAMAAN (autosave yang sudah ada)
         ↓
Pegawai melihat isian tanggung jawab atasan live di form-nya
         ↓
Finalisasi tetap berurutan:
  pegawai "Kirim" → menunggu_atasan → atasan baru bisa "Kirim Evaluasi"
```

---

## Keputusan Desain (dikonfirmasi ke user)

| Pertanyaan | Keputusan |
|---|---|
| Metode realtime | **Polling ringan** (~3 detik) via server action — tanpa dependensi baru |
| Atasan isi tanggung jawab saat `menunggu_pegawai`? | **Ya, isi bareng** — relax guard `autosaveResponses`; tombol "Kirim Evaluasi" atasan tetap terkunci sampai pegawai kirim |
| Trigger simpan item pegawai | **Autosave debounce saja** (~800ms), bukan per-enter |
| Pegawai lihat isian atasan live? | **Ya** — panel read-only di bawah tiap "Tanggung Jawab Pegawai", simetris dengan form atasan |

---

## Kondisi Saat Ini (hasil eksplorasi)

- Form atasan (`components/dialog/responses-form.tsx`) **sudah punya** autosave debounce 800ms (`autosaveResponses`) dan sudah menampilkan "Isian Pegawai" (`AspekPegawaiInput`) di bawah tiap textarea.
- Field kedua pihak **sudah terpisah rapi** di DB: `tanggung_jawab_pegawai` vs `tanggung_jawab_atasan` (di `DialogKinerjaAspek`), item hanya ditulis pegawai → tidak ada risiko saling timpa antar pihak.
- Guard `autosaveResponses` saat ini hanya mengizinkan status `draft_atasan` & `menunggu_atasan` (`lib/actions/atasan.ts:208`).
- Pegawai menyimpan via `saveDialogForm(dialogId, mode: "draft" | "submit")` — mode `"draft"` sudah bisa dipakai ulang sebagai autosave tanpa action baru.
- **Tidak ada infra realtime sama sekali** (tidak ada SSE/WebSocket/poller); cross-user visibility saat ini hanya lewat notifikasi + refresh manual.

---

## Perubahan File

### Baru

| File | Isi |
|---|---|
| `lib/actions/dialog-live.ts` | Action query `getDialogLiveState(dialogId)`: kembalikan payload ringkas — `status`, aspek rows (`id`, `jenis_aspek`, `tanggung_jawab_pegawai`, `tanggung_jawab_atasan`), items (semua field milik pegawai), `updated_at`. Guard: session harus atasan ATAU pegawai pemilik dialog (bukan `requireRole` tunggal). Tidak boleh bocor data dialog milik orang lain. |
| `components/dialog/use-dialog-live.ts` | Hook client polling: `setInterval` 3 detik → panggil `getDialogLiveState`; bandingkan snapshot (JSON / `updated_at`) sebelum setState agar tidak re-render sia-sia; jika `status` berubah dari yang diharapkan → `router.refresh()` (+ toast opsional, mis. "Pegawai telah mengirim dialog"). Hentikan polling saat tab hidden (`document.visibilityState`) untuk hemat resource. |

### Dimodifikasi

| File | Perubahan |
|---|---|
| `lib/actions/atasan.ts` | Relax guard `autosaveResponses`: tambah `"menunggu_pegawai"` ke filter `status: { in: [...] }` (baris ±208) |
| `components/dialog/edit-form.tsx` | (1) Autosave debounce via `saveDialogForm(dialogId, "draft", payload)` + indikator "Tersimpan otomatis · {jam}" seperti form atasan; (2) panel read-only di bawah tiap textarea "Tanggung Jawab Pegawai" menampilkan `tanggung_jawab_atasan` yang ter-update live dari hook polling; (3) tombol Simpan Draft/Kirim tetap ada (submit tetap jalankan validasi kelengkapan) |
| `components/dialog/responses-form.tsx` | Terima update data pegawai dari polling — hanya bagian milik pegawai (items + `tanggung_jawab_pegawai` pada panel "Isian Pegawai"); nilai textarea atasan (state lokal `values`) **tidak pernah** ditimpa polling |
| `app/(app)/atasan/dialog/[id]/page.tsx` | Saat status `menunggu_pegawai`: render `DialogResponsesForm` (dengan `canEdit: true`) + banner "Pegawai sedang mengisi dialog…" — bukan hanya view read-only seperti sekarang |

### Sketsa merge rule anti-timpa (kunci kolaborasi)

```ts
// use-dialog-live.ts — prinsip merge:
// - Polling HANYA memperbarui data milik PIHAK LAIN:
//     di form atasan  → items + tanggung_jawab_pegawai (panel read-only)
//     di form pegawai → tanggung_jawab_atasan (panel read-only)
// - State lokal milik sendiri (draft yang belum tersimpan) TIDAK pernah
//   ditimpa oleh hasil polling.
// - Perubahan `status` → router.refresh() agar server components
//   render ulang panel yang sesuai (mis. pegawai sudah kirim).
```

---

## Yang TIDAK Berubah

- Transisi status & notifikasi tetap hanya di submit/validasi — autosave **tidak** membuat notifikasi (hindari spam).
- Validasi kelengkapan saat kirim (`validateSubmitInput` / `validateSubmit`) tetap sama.
- Guard finalisasi: `submitEvaluasi` tetap hanya saat `menunggu_atasan`, `validateDialog` tetap hanya saat `menunggu_validasi`.
- Tidak ada skema DB baru, tidak ada migrasi, tidak ada dependensi baru.
- `proxy.ts` matcher tidak perlu diubah (tidak ada route baru).

---

## Edge Cases

1. **Sesi berakhir mid-poll** → `getDialogLiveState` gagal / redirect flash → hentikan polling secara diam-diam, jangan spam error toast.
2. **Atasan buka halaman saat `draft_atasan`** → guard tetap menolak `autosaveResponses`; halaman detail tetap pakai UI draft seperti sekarang.
3. **Dua tab dibuka user yang sama** → autosave full-diff `saveDialogForm("draft")` akan sinkron ke state tab terakhir yang menyimpan; risiko rendah untuk app internal 2 pengguna, didokumentasikan sebagai limitasi.
4. **Polling vs ketikan bersamaan** → merge rule di atas menjamin field sendiri tidak tertimpa; field pihak lain selalu render data terbaru DB.
5. **Koneksi lambat** → polling skip tick berikutnya jika request sebelumnya masih in-flight (guard `useRef` boolean).

---

## Verifikasi (saat implementasi)

```
npx tsc --noEmit
npm run lint
npm run build
```

Uji manual dua browser berdampingan (seed: `atasan123` / `pegawai123`):
1. Atasan mulai dialog → kirim ke pegawai (`menunggu_pegawai`)
2. Pegawai buka form edit; atasan buka detail dialog
3. Pegawai ketik item → ≤3 dtk muncul di layar atasan
4. Atasan isi tanggung jawab → ≤3 dtk muncul di panel form pegawai
5. Pastikan ketikan lokal masing-masing tidak pernah ter-reset oleh polling
6. Pegawai kirim → halaman atasan otomatis berganti ke mode review normal
7. Alur lama lengkap sampai `selesai` masih jalan tanpa regresi
