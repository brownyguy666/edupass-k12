import { PrismaClient, Role, JenisKelamin, HubunganWali, Hari } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data awal SIAKAD SMP (Kurikulum Merdeka)...");

  // 1. Data Sekolah
  const sekolah = await prisma.sekolah.upsert({
    where: { npsn: "20109988" },
    update: {},
    create: {
      npsn: "20109988",
      namaSekolah: "SMP Negeri 1 Merdeka",
      jenjang: "SMP",
      alamat: "Jl. Pendidikan No. 45, Jakarta",
      latitude: -6.200000,
      longitude: 106.816666,
      radiusMeter: 50,
    },
  });

  // 2. Tahun Ajaran & Semester
  const tahunAjaran = await prisma.tahunAjaran.upsert({
    where: {
      sekolahId_nama: {
        sekolahId: sekolah.id,
        nama: "2026/2027",
      },
    },
    update: { isActive: true },
    create: {
      sekolahId: sekolah.id,
      nama: "2026/2027",
      isActive: true,
    },
  });

  const semester = await prisma.semester.upsert({
    where: {
      tahunAjaranId_tipe: {
        tahunAjaranId: tahunAjaran.id,
        tipe: "GANJIL",
      },
    },
    update: { isActive: true },
    create: {
      tahunAjaranId: tahunAjaran.id,
      tipe: "GANJIL",
      tanggalMulai: new Date("2026-07-15"),
      tanggalSelesai: new Date("2026-12-20"),
      isActive: true,
    },
  });

  // 3. Data Akun Guru (Budi Santoso)
  const userGuru = await prisma.user.upsert({
    where: { username: "guru.budi" },
    update: {},
    create: {
      ssoUserId: "keycloak-user-guru-budi-id",
      username: "guru.budi",
      email: "budi.santoso@sekolah.sch.id",
      phoneNumber: "081234567890",
      role: Role.GURU,
      isActive: true,
    },
  });

  const guru = await prisma.guru.upsert({
    where: { userId: userGuru.id },
    update: {},
    create: {
      userId: userGuru.id,
      nip: "198501012010011005",
      nuptk: "9876543210123456",
      namaLengkap: "Budi Santoso",
      gelarBelakang: "S.Pd.",
      jenisKelamin: JenisKelamin.LAKI_LAKI,
    },
  });

  // 4. Rombongan Belajar (Rombel 8A - Fase D SMP)
  const rombel8A = await prisma.rombel.upsert({
    where: {
      semesterId_namaRombel: {
        semesterId: semester.id,
        namaRombel: "8A",
      },
    },
    update: { waliKelasId: guru.id },
    create: {
      semesterId: semester.id,
      waliKelasId: guru.id,
      tingkat: 8,
      namaRombel: "8A",
      kurikulum: "Kurikulum Merdeka - Fase D",
    },
  });

  // 5. Data Siswa Kelas 8A
  const siswaList = [
    { nisn: "0081234567", nama: "Ahmad Fauzan", jk: JenisKelamin.LAKI_LAKI, absen: 1 },
    { nisn: "0081234568", nama: "Siti Rahmawati", jk: JenisKelamin.PEREMPUAN, absen: 2 },
    { nisn: "0081234569", nama: "Dimas Arya Putra", jk: JenisKelamin.LAKI_LAKI, absen: 3 },
    { nisn: "0081234570", nama: "Putri Ayu Lestari", jk: JenisKelamin.PEREMPUAN, absen: 4 },
    { nisn: "0081234571", nama: "Rizky Pratama", jk: JenisKelamin.LAKI_LAKI, absen: 5 },
  ];

  let firstSiswaId = "";

  for (const s of siswaList) {
    const userSiswa = await prisma.user.upsert({
      where: { username: s.nisn },
      update: {},
      create: {
        ssoUserId: `keycloak-user-${s.nisn}`,
        username: s.nisn,
        email: `${s.nisn}@siswa.sekolah.sch.id`,
        role: Role.SISWA,
        isActive: true,
      },
    });

    const siswaRecord = await prisma.siswa.upsert({
      where: { userId: userSiswa.id },
      update: {},
      create: {
        userId: userSiswa.id,
        nisn: s.nisn,
        nisLokal: `2425080${s.absen}`,
        namaLengkap: s.nama,
        jenisKelamin: s.jk,
        tempatLahir: "Jakarta",
        tanggalLahir: new Date("2012-05-10"),
        rfidCardUid: `RFID-${s.nisn}`,
      },
    });

    if (s.absen === 1) firstSiswaId = siswaRecord.id;

    await prisma.anggotaRombel.upsert({
      where: {
        rombelId_siswaId: {
          rombelId: rombel8A.id,
          siswaId: siswaRecord.id,
        },
      },
      update: { nomorAbsen: s.absen },
      create: {
        rombelId: rombel8A.id,
        siswaId: siswaRecord.id,
        nomorAbsen: s.absen,
      },
    });
  }

  // 6. Data Wali Murid (Orang Tua Ahmad Fauzan)
  const userWali = await prisma.user.upsert({
    where: { username: "081987654321" },
    update: {},
    create: {
      ssoUserId: "keycloak-user-wali-ahmad",
      username: "081987654321",
      email: "wali.ahmad@gmail.com",
      phoneNumber: "081987654321",
      role: Role.WALI_MURID,
      isActive: true,
    },
  });

  const waliMurid = await prisma.waliMurid.upsert({
    where: { userId: userWali.id },
    update: {},
    create: {
      userId: userWali.id,
      namaLengkap: "Hendra Fauzan (Wali Ahmad)",
      noWhatsApp: "081987654321",
      pekerjaan: "Wiraswasta",
    },
  });

  if (firstSiswaId) {
    await prisma.siswaWaliRelasi.upsert({
      where: {
        siswaId_waliMuridId: {
          siswaId: firstSiswaId,
          waliMuridId: waliMurid.id,
        },
      },
      update: {},
      create: {
        siswaId: firstSiswaId,
        waliMuridId: waliMurid.id,
        hubungan: HubunganWali.AYAH_KANDUNG,
        isWaliUtama: true,
      },
    });
  }

  // 7. Mata Pelajaran SMP (Kurikulum Merdeka)
  const mapelInformatika = await prisma.mataPelajaran.upsert({
    where: { kodeMapel: "INF-SMP" },
    update: {},
    create: {
      kodeMapel: "INF-SMP",
      namaMapel: "Informatika",
      alokasiJpSem: 72,
    },
  });

  // 8. Pembelajaran & Jadwal
  const pembelajaran = await prisma.pembelajaran.upsert({
    where: {
      rombelId_mataPelajaranId: {
        rombelId: rombel8A.id,
        mataPelajaranId: mapelInformatika.id,
      },
    },
    update: {},
    create: {
      rombelId: rombel8A.id,
      mataPelajaranId: mapelInformatika.id,
      guruId: guru.id,
    },
  });

  await prisma.jadwalPelajaran.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      pembelajaranId: pembelajaran.id,
      hari: Hari.SENIN,
      jamKeMulai: 1,
      jamKeSelesai: 2,
      jamMulai: "07:30",
      jamSelesai: "08:50",
      ruangan: "Lab Komputer 1",
    },
  });

  console.log("✅ Seeding selesai! Data SMP Kelas 8A berhasil disiapkan.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
