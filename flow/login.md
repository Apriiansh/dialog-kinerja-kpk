# Workflow Login

```mermaid
flowchart TD
    Start([Mulai]) --> L1[Klik Kembali / buka halaman]
    L1 --> L2[Halaman Login]
    L2 --> L3[Masukkan NPP & Password]
    L3 -->     L4[Klik Masuk]
    L4 --> L5{Data benar?}
    L5 -- Salah / tidak lengkap --> L3
    L5 -- Akun dinonaktifkan --> L3
    L5 -- Benar --> L6{Peran aktif}
    L6 -- Admin --> D1[Dashboard Admin]
    L6 -- Atasan --> D2[Dashboard Atasan]
    L6 -- Pegawai --> D3[Dashboard Pegawai]
    D1 --> End([Selesai])
    D2 --> End
    D3 --> End
```

### Penjelasan
1. Buka halaman login, masukkan **NPP** (7 digit) dan **password**.
2. Klik **Masuk** — sistem memvalidasi data & memeriksa akun aktif.
3. Setelah berhasil, pengguna diarahkan ke dashboard sesuai perannya:
   - **Admin** → Dashboard Admin
   - **Atasan** → Dashboard Atasan
   - **Pegawai** → Dashboard Pegawai
