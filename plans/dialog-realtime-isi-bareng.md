# Rencana: Dialog Kinerja Realtime via WebSocket (Isi Bareng Pegawai + Atasan)

> Status: **belum diimplementasikan** — catatan desain untuk eksekusi nanti.
> **Revisi v2**: transport diganti dari polling ringan ke **WebSocket** (`ws` npm) dengan custom server.
> Revisi ini sudah memasukkan hasil riset dokumentasi/forum (OWASP WebSocket Cheat Sheet,
> websocket.org guides, vercel/next.js issues #42280 & discussions #38057, Stack Overflow
> #69840692, docs Next.js 16 ter-bundle di `node_modules/next/dist/docs/`).

---

## Konsep

Saat status dialog = `menunggu_pegawai`, kedua pihak membuka halaman secara bersamaan dan saling melihat isian terbaru satu sama lain (kolaborasi ala Google Docs versi sederhana):

```
Pegawai mengisi item evaluasi + tanggung jawabnya
         ↓ (autosave debounce 800ms → tulis DATABASE)
Server action publish notifikasi via EventBus
         ↓
WS hub broadcast ke socket atasan
         ↓
Atasan melihat isian pegawai muncul live (<1 detik), dan mengisi
tanggung_jawab_atasan secara BERSAMAAN (autosave yang sudah ada)
         ↓
Pegawai melihat isian tanggung jawab atasan live di form-nya
         ↓
Finalisasi tetap berurutan:
  pegawai "Kirim" → menunggu_atasan → atasan baru bisa "Kirim Evaluasi"
```

### Klarifikasi penting (miskonsepsi yang pernah muncul)

- **WebSocket BUKAN jalur penyimpanan.** Penyimpanan tetap langsung ke PostgreSQL lewat server action.
  WS hanya kurir pemberitahuan: "data berubah, silakan ambil snapshot terbaru".
- **Autosave draft TIDAK mengirim dialog.** Autosave hanya menulis draft (`mode: "draft"`),
  status tidak berubah. Tombol "Kirim ke Atasan" tetap eksplisit dan terpisah.

### Keputusan: draft otomatis disimpan ke cookie atau database?

**Langsung database.** Alasan:

| | Cookie | Database (dipilih) |
|---|---|---|
| Terlihat oleh atasan secara live | ❌ mustahil | ✅ inti fitur |
| Kapasitas | ~4KB (textarea bisa lebih) | Text column, tak terbatas praktis |
| Bandwidth | Ikut terkirim di SETIAP request HTTP | Hanya saat debounce terpicu |
| Ganti browser/device | Hilang | Tetap ada |

Pengaman agar tidak membebani server:

1. **Debounce 800ms** — simpan hanya setelah pegawai berhenti mengetik
2. **Dirty-check** — skip jika payload identik dengan tersimpanan terakhir
3. **In-flight guard** — skip tick jika request sebelumnya belum selesai
4. Item kosong (`isEmptyItem`) tidak dikirim/disimpan

---

## Keputusan Desain (dikonfirmasi ke user)

| Pertanyaan | Keputusan |
|---|---|
| Metode realtime | **WebSocket** pakai npm `ws` + custom server Next.js (bukan polling/SSE) |
| Sisi klien | Native `new WebSocket(...)` sesuai WHATWG spec — tanpa library klien |
| Atasan isi tanggung jawab saat `menunggu_pegawai`? | **Ya, isi bareng** — relax guard `autosaveResponses`; tombol "Kirim Evaluasi" atasan tetap terkunci sampai pegawai kirim |
| Trigger simpan item pegawai | **Autosave debounce** (~800ms), bukan per-enter |
| Pegawai lihat isian atasan live? | **Ya** — panel read-only di bawah tiap "Tanggung Jawab Pegawai", simetris dengan form atasan |
| Penyimpanan draft | **Database langsung** (lihat tabel di atas), bukan cookie |

---

## Kenapa Harus Custom Server?

Dokumentasi Next.js 16 (ter-bundle): Route Handlers **tidak mendukung WebSocket**
(`docs/01-app/02-guides/backend-for-frontend.md`: "WebSockets won't work because the
connection closes on timeout"). Jalur resminya custom server:
`docs/01-app/02-guides/custom-server.md`.

Konsekuensi:

- Keluar dari `next dev` / `next start` standar → script `package.json` berubah
- Tidak bisa deploy ke Vercel/serverless — untuk app internal self-hosted: tidak masalah
- Reverse proxy produksi wajib meneruskan header `Upgrade`/`Connection` untuk path `/ws/*`
  (config nginx standar; Apache: mod_proxy_wstunnel)

---

## Arsitektur

```
server.ts (custom server, jalankan via tsx — sudah ada di devDependencies)
 ├── http.createServer → Next handle semua route HTTP (tidak berubah)
 └── WebSocketServer({ noServer: true, maxPayload: 16KB })
      └── server.on("upgrade")
           ├── pathname === "/ws/dialog"
           │    ├── validasi Origin header (cegah CSWSH)
           │    ├── unseal cookie iron-session (SESSION_SECRET) — bukan token query-param
           │    ├── cek DB: user aktif DAN pemilik dialog (atasan/pegawai)
           │    ├── gagal → close code 1008 (policy violation)
           │    └── sukses → masuk room Map<dialogId, Set<{ws, userId, role}>>
           └── pathname lain → app.getUpgradeHandler()  ← HMR dev (/_next/hmr) tetap jalan

lib/realtime/bus.ts   EventEmitter singleton di globalThis (aman dari HMR reset)
                       API: publishDialogUpdate(dialogId, {kind, byUserId}) /
                       subscribeDialog(dialogId, fn). TIDAK import "ws".

Aliran data (notify → refetch):
autosaveResponses / saveDialogForm (server action)
   → tulis DB (sudah ada)
   → bus.publishDialogUpdate(...)
   → hub WS broadcast event ke socket LAIN dalam room (exclude pengirim)
   → client penerima panggil getDialogLiveState() (debounce 300ms)
   → merge field milik pihak lain (aturan anti-timpa)
```

Keputusan **notify → refetch** (bukan mengirim payload di WS): satu sumber kebenaran
(query action yang sama dengan snapshot awal), bebas race condition urutan payload,
biaya refetch dapat diabaikan untuk 2 pengguna per sesi.

---

## Perubahan File (urutan eksekusi)

### 0. Dependencies & scripts

```bash
npm install ws
npm install -D @types/ws
```

```jsonc
// package.json — hindari sintaks "NODE_ENV=production ..." (pecah di Windows cmd)
{
  "dev": "tsx watch server.ts --dev",   // bonus: auto-restart saat server.ts berubah
  "build": "next build",
  "start": "tsx server.ts"
}
```

Deteksi mode di server.ts: `const dev = process.argv.includes("--dev")`.

### File baru

| File | Isi |
|---|---|
| `server.ts` (~60–80 baris) | Custom server pola resmi Next 16: `next({ dev })` + `createServer(handle)` + routing upgrade (whitelist `/ws/dialog`, sisanya `app.getUpgradeHandler()`) + heartbeat + graceful shutdown (SIGTERM/SIGINT → clearInterval, wss.close, server.close) |
| `lib/realtime/bus.ts` | EventEmitter singleton di globalThis; jembatan action ↔ hub; tanpa import `ws` |
| `lib/actions/dialog-live.ts` | `getDialogLiveState(dialogId)`: payload ringkas — `status`, aspek rows (`id`, `jenis_aspek`, `tanggung_jawab_pegawai`, `tanggung_jawab_atasan`), items (semua field milik pegawai), `updated_at`. Guard: session = atasan ATAU pegawai pemilik dialog (cek kepemilikan via Prisma, bukan requireRole tunggal) |
| `components/dialog/use-dialog-live.ts` | Hook klien: buka native WebSocket ke `/ws/dialog?id={id}`, reconnect exponential backoff (+jitter), fallback otomatis ke polling jika gagal berulang, merge pesan remote, deteksi `status` berubah → `router.refresh()` |

### File dimodifikasi

| File | Perubahan |
|---|---|
| `lib/actions/atasan.ts` | Relax guard `autosaveResponses`: tambah `"menunggu_pegawai"` ke filter status (baris ±208); panggil `publishDialogUpdate` setelah tulis DB |
| `lib/actions/pegawai.ts` | Panggil `publishDialogUpdate` setelah `saveDialogForm` (mode draft maupun submit) |
| `components/dialog/edit-form.tsx` | (1) Autosave debounce 800ms + dirty-check + in-flight guard via `saveDialogForm(dialogId, "draft", payload)` + indikator "Tersimpan otomatis · {jam}" seperti form atasan; (2) panel read-only di bawah tiap textarea "Tanggung Jawab Pegawai" menampilkan `tanggung_jawab_atasan` live; (3) tombol Simpan Draft/Kirim tetap ada (submit tetap jalankan validasi kelengkapan) |
| `components/dialog/responses-form.tsx` | Terima update data pegawai dari hook — hanya bagian milik pegawai (items + panel "Isian Pegawai"); nilai textarea atasan (state lokal) **tidak pernah** ditimpa |
| `app/(app)/atasan/dialog/[id]/page.tsx` | Saat status `menunggu_pegawai`: render `DialogResponsesForm` (`canEdit: true`) + banner "Pegawai sedang mengisi dialog…" — bukan hanya view read-only seperti sekarang |

---

## Sketsa Kode Kunci

### Routing upgrade + delegasi HMR (pola anti-mati-diam-diam)

Masalah klasik (vercel/next.js #42280, SO #69840692): `WebSocketServer({ server })` naif
mencuri SEMUA event upgrade termasuk milik HMR → hot reload dev mati tanpa error.
Solusi konsensus: whitelist path sendiri, delegasi sisanya:

```ts
const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (pathname === "/ws/dialog") {
    // auth → wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req))
  } else {
    app.getUpgradeHandler()(req, socket, head); // serahkan ke Next (incl. /_next/hmr)
  }
});
```

Whitelist lebih tahan banting daripada blacklist path HMR (nama path HMR berubah antar versi:
`/_next/webpack-hmr` → `/_next/hmr` di Next 16).

### Auth handshake (OWASP-compliant)

```ts
// 1. Origin check — cegah Cross-Site WebSocket Hijacking
// 2. Parse req.headers.cookie → ambil cookie session iron-session
//    → unsealData(value, { password: SESSION_SECRET })  // JANGAN token di query-param (bocor di log)
// 3. Prisma: dialog ada? user aktif? id_atasan/id_pegawai === session.id?
// 4. Gagal → socket.write HTTP 401 + destroy / close 1008
// 5. Sukses → simpan meta {userId, role, dialogId} di Map room
```

### Heartbeat (anti ghost connection: WiFi mati, laptop sleep)

Standar de-facto (repo panduan & dok `ws`): ping tiap **25–30 dtk** (di bawah idle-timeout
proxy umum 60 dtk); tak balas pong → terminate.

```ts
const interval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30_000);
// ws.on("pong", () => { ws.isAlive = true })  saat connection
```

### Protokol pesan (envelope)

```ts
// server → client
{ kind: "dialog_update", byUserId: number }   // pemicu refetch snapshot (debounce 300ms)
{ kind: "status_changed", status: string }    // pemicu router.refresh()
{ kind: "presence", online: { pegawai: bool, atasan: bool } }  // opsional, fase 2

// client → server: hampir tidak ada (validasi & abaikan yang tak dikenal)
```

Broadcast ke room **kecuali pengirim** (pengirim punya state lokalnya sendiri).

### Merge rule anti-timpa (kunci kolaborasi)

```ts
// Polling/push HANYA memperbarui data milik PIHAK LAIN:
//   di form atasan  → items + tanggung_jawab_pegawai (panel read-only)
//   di form pegawai → tanggung_jawab_atasan (panel read-only)
// State lokal milik sendiri TIDAK PERNAH ditimpa.
// kind "status_changed" → router.refresh() agar server components render ulang.
```

---

## Checklist Keamanan (dari riset OWASP/websocket.org)

- [ ] WSS di produksi (TLS terminate di reverse proxy — cukup untuk internal)
- [ ] Validasi header `Origin` saat handshake
- [ ] Auth via cookie iron-session di handshake — bukan token query-param
- [ ] Otorisasi per-aksi tetap di server action (WS tidak pernah jadi jalur mutasi)
- [ ] Close code benar: `1008` auth gagal, `1003` pesan tak valid
- [ ] `maxPayload` dibatasi (16KB — kita cuma kirim kontrol kecil)
- [ ] Pesan client tak dikenal → diabaikan/ditutup, tidak pernah dieksekusi
- [ ] Cleanup room saat close; cleanup interval saat shutdown

---

## Yang TIDAK Berubah

- Transisi status & notifikasi tetap hanya di submit/validasi — autosave tidak membuat notifikasi (hindari spam)
- Validasi kelengkapan saat kirim (`validateSubmitInput` / `validateSubmit`) tetap sama
- Guard finalisasi: `submitEvaluasi` tetap hanya saat `menunggu_atasan`, `validateDialog` tetap hanya saat `menunggu_validasi`
- Tidak ada skema DB baru, tidak ada migrasi
- `proxy.ts` matcher tidak perlu diubah (tidak ada route halaman baru)

---

## Edge Cases

1. **Sesi berakhir mid-koneksi** → unseal gagal / user nonaktif → tolak upgrade; klien fallback polling akan juga gagal → diam, tanpa spam error toast
2. **Atasan buka halaman saat `draft_atasan`** → guard `autosaveResponses` tetap menolak; UI detail tetap mode draft
3. **Dua tab user yang sama** → autosave full-diff bisa saling menimpa antar tab; risiko rendah untuk app internal 2 pengguna, didokumentasikan sebagai limitasi
4. **WS gagal berkali-kali** (proxy tidak meneruskan Upgrade) → backoff mencapai batas → fallback polling otomatis; fitur tetap jalan dengan latensi ~3 dtk
5. **Server restart** → koneksi putih → klien reconnect backoff; snapshot awal selalu diambil ulang saat reconnect
6. **Request autosave masih in-flight** saat tick berikutnya → skip (in-flight guard)

---

## Verifikasi (saat implementasi)

```
npx tsc --noEmit
npm run lint
npm run build
npm run dev          # harus via tsx watch server.ts sekarang
```

Uji manual dua browser berdampingan (seed: `atasan123` / `pegawai123`):
1. Atasan mulai dialog → kirim ke pegawai (`menunggu_pegawai`)
2. Pegawai buka form edit; atasan buka detail dialog
3. Pegawai ketik item → berhenti ~1 dtk → muncul di layar atasan <1 dtk (via WS)
4. Atasan isi tanggung jawab → muncul di panel form pegawai <1 dtk
5. Pastikan ketikan lokal masing-masing tidak pernah ter-reset
6. Matikan server → klien fallback polling tanpa crash; nyalakan → reconnect
7. Dev: edit file komponen → HMR tetap jalan (bukti delegasi upgrade benar)
8. Pegawai kirim → halaman atasan otomatis berganti ke mode review normal
9. Alur lama lengkap sampai `selesai` + export Word/PDF tanpa regresi
