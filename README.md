# 🏫 Edupass K-12: Portal Pendidikan Satu Pintu (SMP)

Aplikasi Satu Pintu terintegrasi untuk jenjang **SMP (Fase D: Kelas 7, 8, 9)** berbasis **Kurikulum Merdeka**, dilengkapi **Single Sign-On (SSO) Keycloak On-Premise**, **SIAKAD & Presensi Terpadu**, serta **Sinkronisasi Otomatis ke PostgreSQL via NextAuth**.

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Jalankan Infrastruktur (PostgreSQL, Keycloak, & Redis)
Pastikan Docker Desktop aktif di komputer Anda, lalu buka terminal di folder proyek ini:

```bash
docker compose up -d
```

Layanan yang akan berjalan:
- **Keycloak SSO (Port 8080)**: `http://localhost:8080/auth` (Admin: `admin` | Password: `SuperAdminKeycloak2026!`)
- **PostgreSQL 16 (Port 5432)**: `siakad_db` (User: `k12_admin` | Password: `PasswordK12Aman2026!`)
- **Redis 7 (Port 6379)**: Cache & Antrean Notifikasi WhatsApp

*Catatan: Keycloak secara otomatis mengimpor Realm `k12-portal` dari `keycloak/k12-portal-realm.json` pada saat pertama kali container menyala.*

---

### 2. Akun Percobaan Bawaan (Seed Dummy Accounts)
Realm `k12-portal` telah dilengkapi akun uji coba untuk setiap peran:

| Peran (Role) | Username (Identifier) | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `Admin123!` | Administrator Sistem Sekolah |
| **Guru & Wali Kelas** | `guru.budi` | `Guru123!` | Budi Santoso, S.Pd. |
| **Siswa SMP** | `0081234567` (NISN) | `Siswa123!` | Ahmad Fauzan (Siswa Kelas 8) |
| **Wali Murid** | `081987654321` (No WA) | `Wali123!` | Hendra Fauzan (Orang Tua Ahmad) |

---

### 3. Jalankan Aplikasi Next.js

1. Salin berkas lingkungan:
   ```bash
   cp .env.example .env
   ```
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
5. Buka peramban di `http://localhost:3000`. Klik tombol **"Masuk dengan Keycloak SSO"**!

---

## 🔒 Alur Otentikasi & Otorisasi (RBAC)

1. Pengguna login di halaman terpusat Keycloak.
2. Token OIDC dikembalikan ke NextAuth (`src/lib/auth.ts`).
3. NextAuth mengekstrak peran (`roles`) dan nomor telepon dari klaim JWT Keycloak.
4. Data pengguna otomatis di-**upsert** ke tabel `users` PostgreSQL melalui Prisma.
5. **Middleware Next.js** (`src/middleware.ts`) membatasi akses URL secara ketat:
   - `/admin/*` ➡️ Khusus `SUPER_ADMIN` dan `STAFF_TU`
   - `/guru/*` ➡️ Khusus `GURU` dan `WALI_KELAS`
   - `/siswa/*` ➡️ Khusus `SISWA`
   - `/wali/*` ➡️ Khusus `WALI_MURID`
