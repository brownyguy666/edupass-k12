import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Ambil daftar siswa di rombel untuk presensi
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rombelNama = searchParams.get("rombel") || "8A";

    const rombel = await prisma.rombel.findFirst({
      where: { namaRombel: rombelNama },
      include: {
        anggotaRombel: {
          include: {
            siswa: true,
          },
          orderBy: {
            nomorAbsen: "asc",
          },
        },
        pembelajaran: {
          include: {
            mataPelajaran: true,
            guru: true,
            jadwalList: true,
          },
        },
      },
    });

    if (!rombel) {
      return NextResponse.json({ error: "Rombel tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      rombelId: rombel.id,
      namaRombel: rombel.namaRombel,
      tingkat: rombel.tingkat,
      pembelajaran: rombel.pembelajaran,
      siswaList: rombel.anggotaRombel.map((a) => ({
        id: a.siswa.id,
        nomorAbsen: a.nomorAbsen,
        nisn: a.siswa.nisn,
        namaLengkap: a.siswa.namaLengkap,
        jenisKelamin: a.siswa.jenisKelamin,
      })),
    });
  } catch (error) {
    console.error("Gagal mengambil data siswa presensi:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Simpan sesi presensi kelas & buat antrean notifikasi WhatsApp untuk wali murid
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      jadwalPelajaranId,
      tanggal,
      materiAjar,
      jurnalGuru,
      kehadiran, // Array: [{ siswaId, status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA', catatan }]
    } = body;

    if (!jadwalPelajaranId || !tanggal || !kehadiran) {
      return NextResponse.json({ error: "Data presensi tidak lengkap" }, { status: 400 });
    }

    // Cari guru pengajar dari jadwal
    const jadwal = await prisma.jadwalPelajaran.findUnique({
      where: { id: jadwalPelajaranId },
      include: {
        pembelajaran: {
          include: {
            mataPelajaran: true,
            guru: true,
          },
        },
      },
    });

    if (!jadwal) {
      return NextResponse.json({ error: "Jadwal pelajaran tidak ditemukan" }, { status: 404 });
    }

    const tanggalObj = new Date(tanggal);

    // 1. Simpan atau Update Sesi Presensi Kelas
    const sesi = await prisma.presensiSesiKelas.upsert({
      where: {
        jadwalPelajaranId_tanggal: {
          jadwalPelajaranId,
          tanggal: tanggalObj,
        },
      },
      update: {
        materiAjar,
        jurnalGuru,
      },
      create: {
        jadwalPelajaranId,
        guruPengajarId: jadwal.pembelajaran.guruId,
        tanggal: tanggalObj,
        materiAjar,
        jurnalGuru,
      },
    });

    let notifikasiCount = 0;

    // 2. Simpan Detail Kehadiran Siswa
    for (const item of kehadiran) {
      await prisma.presensiKelasDetail.upsert({
        where: {
          sesiId_siswaId: {
            sesiId: sesi.id,
            siswaId: item.siswaId,
          },
        },
        update: {
          status: item.status,
          catatan: item.catatan,
        },
        create: {
          sesiId: sesi.id,
          siswaId: item.siswaId,
          status: item.status,
          catatan: item.catatan,
        },
      });

      // 3. Jika status SAKIT, IZIN, atau ALPA -> Otomatis siapkan Notifikasi WhatsApp ke Wali Murid
      if (item.status === "ALPA" || item.status === "SAKIT" || item.status === "IZIN") {
        const siswa = await prisma.siswa.findUnique({
          where: { id: item.siswaId },
          include: {
            waliRelasi: {
              where: { isWaliUtama: true },
              include: { waliMurid: true },
            },
          },
        });

        const wali = siswa?.waliRelasi[0]?.waliMurid;
        if (wali && wali.noWhatsApp) {
          const pesan =
            `Yth. Bapak/Ibu Wali dari ${siswa.namaLengkap},\n\n` +
            `Diberitahukan bahwa ananda tercatat *${item.status}* pada mata pelajaran *${jadwal.pembelajaran.mataPelajaran.namaMapel}* ` +
            `tanggal ${tanggal}. ` +
            (item.catatan ? `\nCatatan: ${item.catatan}` : "") +
            `\n\n- Sistem Akademik SMP Negeri 1 Merdeka -`;

          await prisma.notifikasiWhatsAppLog.create({
            data: {
              waliMuridId: wali.id,
              noTujuan: wali.noWhatsApp,
              tipePesan: `PRESENSI_${item.status}`,
              isiPesan: pesan,
              status: "PENDING",
            },
          });
          notifikasiCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Presensi berhasil disimpan. ${notifikasiCount} notifikasi WhatsApp masuk dalam antrean pengiriman.`,
      sesiId: sesi.id,
    });
  } catch (error) {
    console.error("Gagal menyimpan presensi:", error);
    return NextResponse.json({ error: "Gagal menyimpan presensi" }, { status: 500 });
  }
}
