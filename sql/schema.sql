-- ============================================================================
-- SKEMA BASIS DATA SIAKAD & PRESENSI SMP (KURIKULUM MERDEKA) - POSTGRESQL
-- ============================================================================

-- 0. SCHEMA KHUSUS KEYCLOAK (Memisahkan tabel internal SSO dari tabel akademik)
CREATE SCHEMA IF NOT EXISTS keycloak;

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMERASI (TIPE DATA KHUSUS)
CREATE TYPE role_type AS ENUM (
    'SUPER_ADMIN', 
    'STAFF_TU', 
    'GURU', 
    'WALI_KELAS', 
    'SISWA', 
    'WALI_MURID'
);

CREATE TYPE jenis_kelamin_type AS ENUM ('LAKI_LAKI', 'PEREMPUAN');
CREATE TYPE status_kehadiran_type AS ENUM ('HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'ALPA');
CREATE TYPE metode_presensi_type AS ENUM ('RFID_CARD', 'QR_SCAN', 'GEOFENCE_GPS', 'MANUAL_GURU');
CREATE TYPE semester_type AS ENUM ('GANJIL', 'GENAP');
CREATE TYPE status_siswa_rombel_type AS ENUM ('AKTIF', 'MUTASI_KELUAR', 'LULUS');
CREATE TYPE hubungan_wali_type AS ENUM ('AYAH_KANDUNG', 'IBU_KANDUNG', 'WALI');
CREATE TYPE hari_type AS ENUM ('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU');
CREATE TYPE status_wa_type AS ENUM ('PENDING', 'SENT', 'FAILED');

-- 2. TABEL PENGGUNA TERINTEGRASI KEYCLOAK SSO
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sso_user_id VARCHAR(64) UNIQUE NOT NULL, -- UUID Sub dari Token Keycloak
    username VARCHAR(100) UNIQUE NOT NULL,    -- NISN / NIP / No WA
    email VARCHAR(150) UNIQUE,
    phone_number VARCHAR(20),
    role role_type NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_sso_sub ON users(sso_user_id);

-- 3. TABEL MASTER SEKOLAH & AKADEMIK SMP
CREATE TABLE sekolah (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npsn VARCHAR(10) UNIQUE NOT NULL,
    nama_sekolah VARCHAR(150) NOT NULL,
    jenjang VARCHAR(10) DEFAULT 'SMP',
    alamat TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meter INT DEFAULT 50
);

CREATE TABLE tahun_ajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sekolah_id UUID NOT NULL REFERENCES sekolah(id) ON DELETE CASCADE,
    nama VARCHAR(20) NOT NULL, -- Misal: '2026/2027'
    is_active BOOLEAN DEFAULT FALSE,
    UNIQUE(sekolah_id, nama)
);

CREATE TABLE semester (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tahun_ajaran_id UUID NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
    tipe semester_type NOT NULL,
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    UNIQUE(tahun_ajaran_id, tipe)
);

CREATE TABLE guru (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(30) UNIQUE,
    nuptk VARCHAR(30) UNIQUE,
    nama_lengkap VARCHAR(150) NOT NULL,
    gelar_depan VARCHAR(20),
    gelar_belakang VARCHAR(20),
    jenis_kelamin jenis_kelamin_type NOT NULL
);

-- Rombel Khusus SMP (Tingkat 7, 8, atau 9)
CREATE TABLE rombel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID NOT NULL REFERENCES semester(id) ON DELETE CASCADE,
    wali_kelas_id UUID REFERENCES guru(id) ON DELETE SET NULL,
    tingkat INT NOT NULL CHECK (tingkat IN (7, 8, 9)),
    nama_rombel VARCHAR(30) NOT NULL, -- '7A', '8-Unggulan', '9C'
    kurikulum VARCHAR(100) DEFAULT 'Kurikulum Merdeka - Fase D',
    UNIQUE(semester_id, nama_rombel)
);

CREATE TABLE siswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nisn VARCHAR(10) UNIQUE NOT NULL,
    nis_lokal VARCHAR(20),
    nama_lengkap VARCHAR(150) NOT NULL,
    jenis_kelamin jenis_kelamin_type NOT NULL,
    tempat_lahir VARCHAR(50) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    rfid_card_uid VARCHAR(50) UNIQUE
);
CREATE INDEX idx_siswa_nisn ON siswa(nisn);
CREATE INDEX idx_siswa_rfid ON siswa(rfid_card_uid);

CREATE TABLE anggota_rombel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rombel_id UUID NOT NULL REFERENCES rombel(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    nomor_absen INT NOT NULL,
    status status_siswa_rombel_type DEFAULT 'AKTIF',
    UNIQUE(rombel_id, siswa_id),
    UNIQUE(rombel_id, nomor_absen)
);

-- Data Orang Tua / Wali Murid
CREATE TABLE wali_murid (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nama_lengkap VARCHAR(150) NOT NULL,
    no_whatsapp VARCHAR(20) NOT NULL,
    alamat TEXT,
    pekerjaan VARCHAR(100)
);

CREATE TABLE siswa_wali_relasi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    wali_murid_id UUID NOT NULL REFERENCES wali_murid(id) ON DELETE CASCADE,
    hubungan hubungan_wali_type NOT NULL,
    is_wali_utama BOOLEAN DEFAULT TRUE,
    UNIQUE(siswa_id, wali_murid_id)
);

-- 4. PEMBELAJARAN & PENJADWALAN MATA PELAJARAN SMP
CREATE TABLE mata_pelajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_mapel VARCHAR(20) UNIQUE NOT NULL, -- Contoh: IPA-SMP, MAT-SMP, INF-SMP
    nama_mapel VARCHAR(100) NOT NULL,
    alokasi_jp_sem INT NOT NULL
);

CREATE TABLE pembelajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rombel_id UUID NOT NULL REFERENCES rombel(id) ON DELETE CASCADE,
    mata_pelajaran_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
    guru_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    UNIQUE(rombel_id, mata_pelajaran_id)
);

CREATE TABLE jadwal_pelajaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pembelajaran_id UUID NOT NULL REFERENCES pembelajaran(id) ON DELETE CASCADE,
    hari hari_type NOT NULL,
    jam_ke_mulai INT NOT NULL,
    jam_ke_selesai INT NOT NULL,
    jam_mulai VARCHAR(5) NOT NULL,
    jam_selesai VARCHAR(5) NOT NULL,
    ruangan VARCHAR(30)
);

-- 5. PRESENSI HARIAN GERBANG & PRESENSI KELAS
CREATE TABLE presensi_harian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    waktu_masuk TIMESTAMP WITH TIME ZONE,
    waktu_pulang TIMESTAMP WITH TIME ZONE,
    status status_kehadiran_type DEFAULT 'ALPA',
    metode_masuk metode_presensi_type,
    latitude_masuk DECIMAL(10, 8),
    longitude_masuk DECIMAL(11, 8),
    foto_bukti_url TEXT,
    catatan_keterangan TEXT,
    UNIQUE(siswa_id, tanggal)
);
CREATE INDEX idx_presensi_harian_tgl ON presensi_harian(tanggal, status);

CREATE TABLE presensi_sesi_kelas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jadwal_pelajaran_id UUID NOT NULL REFERENCES jadwal_pelajaran(id) ON DELETE CASCADE,
    guru_pengajar_id UUID NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL,
    materi_ajar VARCHAR(255),
    jurnal_guru TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(jadwal_pelajaran_id, tanggal)
);

CREATE TABLE presensi_kelas_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sesi_id UUID NOT NULL REFERENCES presensi_sesi_kelas(id) ON DELETE CASCADE,
    siswa_id UUID NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
    status status_kehadiran_type DEFAULT 'HADIR',
    catatan VARCHAR(150),
    UNIQUE(sesi_id, siswa_id)
);

-- 6. AUDIT LOG NOTIFIKASI WHATSAPP KE WALI MURID
CREATE TABLE notifikasi_whatsapp_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wali_murid_id UUID NOT NULL REFERENCES wali_murid(id) ON DELETE CASCADE,
    no_tujuan VARCHAR(20) NOT NULL,
    tipe_pesan VARCHAR(50) NOT NULL,
    isi_pesan TEXT NOT NULL,
    status status_wa_type DEFAULT 'PENDING',
    response_vendor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wa_log_status ON notifikasi_whatsapp_log(status, created_at);
