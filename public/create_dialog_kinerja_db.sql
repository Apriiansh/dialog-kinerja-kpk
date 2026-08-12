-- =========================================================================
-- 1. TABEL PENGGUNA (PEGAWAI & ATASAN)
-- =========================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    npp VARCHAR(50) UNIQUE NOT NULL,
    nip VARCHAR(50) UNIQUE NULL,
    nama_pegawai VARCHAR(255) NOT NULL,
    tanggal_bergabung DATE,
    nama_jabatan VARCHAR(150),
    unit_kerja VARCHAR(150),
    masa_kerja_unit_terakhir VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role ENUM('ATASAN', 'PEGAWAI') DEFAULT 'PEGAWAI',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================================
-- 2. TABEL MASTER METODE PENGEMBANGAN (REFERENSI TERINTEGRASI IDP)
-- =========================================================================
CREATE TABLE master_metode_pengembangan (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_metode VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert Data Master Awal (Berdasarkan Form KPK dan Pedoman LAN)
INSERT INTO master_metode_pengembangan (nama_metode) VALUES 
('Penugasan'),
('Pendidikan dan Pelatihan'),
('Mutasi'),
('Lainnya (Freetext)');

-- =========================================================================
-- 3. TABEL TRANSAKSI UTAMA (HEADER DIALOG KINERJA)
-- =========================================================================
CREATE TABLE dialog_kinerja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_atasan INT NOT NULL,
    id_pegawai INT NOT NULL,
    periode_tahun YEAR NOT NULL,
    deskripsi_kinerja TEXT, -- Diisi atasan di awal
    status ENUM('draft_atasan', 'menunggu_pegawai', 'menunggu_atasan', 'menunggu_validasi', 'selesai') DEFAULT 'draft_atasan',
    -- dua opsi, bisa tanda tangan atau bisa validasi (checkbox) untuk menandai bahwa dialog kinerja sudah dibaca dan disetujui
    is_valid_pegawai BOOLEAN DEFAULT FALSE,
    is_valid_atasan BOOLEAN DEFAULT FALSE,
    ttd_pegawai_path VARCHAR(255), -- Path file atau Base64 dari canvas freedraw
    ttd_atasan_path VARCHAR(255),  -- Path file atau Base64 dari canvas freedraw
    waktu_validasi_pegawai DATETIME NULL,
    waktu_validasi_atasan DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_atasan) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_pegawai) REFERENCES users(id) ON DELETE RESTRICT
);

-- =========================================================================
-- 4. TABEL TRANSAKSI ASPEK (Menyimpan Tanggung Jawab per Aspek)
-- =========================================================================
CREATE TABLE dialog_kinerja_aspek (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_dialog INT NOT NULL,
    jenis_aspek ENUM('SKP', 'GAP_ASESMEN', 'PERILAKU', 'KARIR_PENDEK', 'KARIR_MENENGAH') NOT NULL,
    
    -- Tanggung Jawab hanya diisi satu kali per aspek
    tanggung_jawab_pegawai TEXT,
    tanggung_jawab_atasan TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_dialog) REFERENCES dialog_kinerja(id) ON DELETE CASCADE,
    UNIQUE(id_dialog, jenis_aspek) -- Memastikan 1 dialog hanya punya 1 record per jenis aspek
);

-- =========================================================================
-- 5. TABEL TRANSAKSI ITEM (Menyimpan baris dinamis 1, 2, 3... per aspek)
-- =========================================================================
CREATE TABLE dialog_kinerja_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_aspek INT NOT NULL,
    
    -- Inputan Dinamis
    dialog_evaluasi TEXT, 
    kompetensi_dikembangkan TEXT,
    id_metode_pengembangan INT, 
    metode_pengembangan_lainnya VARCHAR(255),
    waktu_pelaksanaan VARCHAR(150),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_aspek) REFERENCES dialog_kinerja_aspek(id) ON DELETE CASCADE,
    FOREIGN KEY (id_metode_pengembangan) REFERENCES master_metode_pengembangan(id) ON DELETE SET NULL
);