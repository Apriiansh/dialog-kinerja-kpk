# Workflow Dialog Kinerja

Diagram alur kerja sistem Dialog Kinerja KPK menggunakan Mermaid.js.

## Alur Lengkap (Siklus Berkelanjutan)

```mermaid
flowchart TD
    subgraph LOGIN["🔐 Login"]
        A1["Atasan login"]
        A2["Pegawai login"]
    end

    subgraph MULAI["📝 Tahap 1 — Atasan Membuat Dialog"]
        B1["Klik 'Mulai Dialog' di halaman Dialog Kinerja"]
        B2["Pilih pegawai yang akan dinilai"]
        B3["Isi deskripsi kinerja & indikator awal"]
        B4["Kirim dialog ke pegawai"]
    end

    subgraph ISI["✍️ Tahap 2 — Pegawai Mengisi Dialog"]
        C1["Buka dialog dari daftar"]
        C2["Isi 5 aspek evaluasi:\n• SKP\n• Gap Asesmen\n• Perilaku\n• Karir Pendek\n• Karir Menengah"]
        C3["Isi tanggung jawab pegawai\nuntuk setiap aspek"]
        C4["Submit dialog ke atasan"]
    end

    subgraph ATASAN_REVIU["📋 Tahap 3 — Atasan Menilai"]
        D1["Buka dialog dari daftar"]
        D2["Isi tanggung jawab atasan\nuntuk setiap aspek"]
        D3["Review & tanda tangani"]
        D4["Setuju & kirim ke validasi"]
    end

    subgraph VALIDASI["✅ Tahap 4 — Pegawai Memvalidasi"]
        E1["Periksa dialog yang sudah diisi atasan"]
        E2["Setujui & tanda tangani"]
    end

    subgraph SELESAI_DIALOG["🔒 Dialog Selesai"]
        F1["Dialog terkunci"]
        F2["Bisa di-export ke Word/PDF"]
    end

    subgraph REVIU["📊 Tahap 5 — Reviu Tindak Lanjut"]
        G1["Pegawai buat reviu"]
        G2["Tandai setiap item:\n• Tercapai ✓\n• Tidak Tercapai ✗"]
        G3{"Ada item\ntidak tercapai?"}
        G4["Isi penjelasan pencapaian"]
        G5["Isi penjelasan kendala"]
        G6["Isi rencana tindak lanjut"]
        G7["Isi tanggal evaluasi berikutnya"]
        G8["Submit reviu ke atasan"]
        G9["Atasan review & tanda tangan"]
        G10["Pegawai validasi & tanda tangan"]
    end

    subgraph LANJUTAN["🔄 Tahap 6 — Dialog Lanjutan"]
        H1["Klik 'Buat Evaluasi'"]
        H2["Pilih periode:\n• TW1 (Perencanaan & Evaluasi)\n• TW3 (Monitoring Progres)"]
        H3["Item tidak tercapai\notomatis diteruskan"]
        H4["Dialog baru dimulai\n(dari langkah 1 lagi)"]
    end

    A1 --> B1
    B1 --> B2 --> B3 --> B4
    B4 --> C1
    A2 --> C1
    C1 --> C2 --> C3 --> C4
    C4 --> D1
    A1 --> D1
    D1 --> D2 --> D3 --> D4
    D4 --> E1
    A2 --> E1
    E1 --> E2
    E2 --> F1 --> F2
    F2 --> G1
    A2 --> G1
    G1 --> G2 --> G3
    G3 -- "Tidak" --> G4 --> G8
    G3 -- "Ya" --> G5 --> G6 --> G7 --> G8
    G8 --> G9
    A1 --> G9
    G9 --> G10
    A2 --> G10
    G10 --> H1
    A1 --> H1
    A2 --> H1
    H1 --> H2 --> H3 --> H4
    H4 --> B1
```

## Status Transitions

### Dialog Kinerja

```mermaid
stateDiagram-v2
    [*] --> draft_atasan: Atasan buat dialog
    draft_atasan --> menunggu_pegawai: Atasan kirim ke pegawai
    menunggu_pegawai --> menunggu_atasan: Pegawai submit
    menunggu_atasan --> menunggu_validasi: Atasan TTD & setuju
    menunggu_validasi --> selesai: Pegawai validasi & TTD

    note right of draft_atasan
        Atasan bisa isi tanggung jawab
        secara bersamaan (real-time)
    end note

    note right of selesai
        Dialog terkunci.
        Bisa di-export ke Word/PDF.
        Reviu bisa dibuat.
    end note
```

### Reviu Tindak Lanjut

```mermaid
stateDiagram-v2
    [*] --> draft_pegawai: Pegawai buat reviu
    draft_pegawai --> menunggu_atasan: Pegawai submit
    menunggu_atasan --> menunggu_validasi: Atasan TTD & setuju
    menunggu_validasi --> selesai: Pegawai validasi & TTD

    note right of draft_pegawai
        Semua item harus ditandai
        tercapai atau tidak tercapai.
    end note

    note right of selesai
        Jika ada item tidak tercapai,
        tombol "Buat Evaluasi" muncul
        untuk dialog lanjutan.
    end note
```

## Siklus Berkelanjutan

```mermaid
flowchart LR
    D1["Dialog TW1\n(Perencanaan & Evaluasi)"] --> R1["Reviu"]
    R1 --> |"Ada item tidak tercapai"| L1["Dialog Lanjutan TW3\n(Monitoring Progres)"]
    L1 --> R2["Reviu"]
    R2 --> |"Ada item tidak tercapai"| L2["Dialog Lanjutan TW1\n(Perencanaan & Evaluasi)"]
    L2 --> R3["Reviu"]
    R3 --> |"..."| CONT["..."]

    R1 --> |"Semua tercapai"| END1["Selesai ✓"]
    R2 --> |"Semua tercapai"| END2["Selesai ✓"]
    R3 --> |"Semua tercapai"| END3["Selesai ✓"]

    style D1 fill:#C8102E,color:#fff
    style L1 fill:#db1514,color:#fff
    style L2 fill:#db1514,color:#fff
    style END1 fill:#006c49,color:#fff
    style END2 fill:#006c49,color:#fff
    style END3 fill:#006c49,color:#fff
```

## Carry-Over Item

```mermaid
flowchart TD
    subgraph DIALOG_SEBELUMNYA["Dialog Periode Sebelumnya"]
        A["Item evaluasi"]
        A1["Item A — Tercapai ✓"]
        A2["Item B — Tidak Tercapai ✗"]
        A3["Item C — Tercapai ✓"]
        A4["Item D — Tidak Tercapai ✗"]
    end

    subgraph PROSES["Proses Carry-Over"]
        B["Hanya item dengan\nis_tercapai = false\nyang diteruskan"]
    end

    subgraph DIALOG_BARU["Dialog Lanjutan Periode Berikutnya"]
        C1["Item B — Tidak Tercapai ✗\n(dari periode sebelumnya)"]
        C2["Item D — Tidak Tercapai ✗\n(dari periode sebelumnya)"]
        C3["Item baru dari atasan\nperiode baru"]
    end

    A1 --> |"Tidak disalin"| X1["✗ Dihapus"]
    A2 --> |"Diteruskan"| B
    A3 --> |"Tidak disalin"| X2["✗ Dihapus"]
    A4 --> |"Diteruskan"| B
    B --> C1
    B --> C2
    C3

    style X1 fill:#8c8478,color:#fff
    style X2 fill:#8c8478,color:#fff
    style C1 fill:#C8102E,color:#fff
    style C2 fill:#C8102E,color:#fff
    style C3 fill:#006c49,color:#fff
```

## Aturan Penting

| Aturan | Keterangan |
|--------|-----------|
| Satu dialog per triwulan | Satu pegawai hanya boleh memiliki satu dialog per triwulan per tahun |
| Maksimal satu lanjutan | Setiap dialog hanya boleh memiliki satu dialog lanjutan |
| Hanya TW1 & TW3 | Dialog lanjutan hanya bisa dibuat untuk Triwulan I atau III |
| Carry-over selektif | Hanya item `is_tercapai = false` yang diteruskan |
| Dialog terkunci | Setelah status `selesai`, dialog tidak bisa diubah |
| Reviu wajib semua item | Semua item harus ditandai tercapai/tidak tercapai |
| Field wajib | Jika ada item tidak tercapai: penjelasan, rencana tindak lanjut, dan tanggal evaluasi berikutnya wajib diisi |
