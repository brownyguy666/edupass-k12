"use client";

import { useState } from "react";
import Link from "next/link";

export default function WaliPresensiAnakPage() {
  const [selectedMonth, setSelectedMonth] = useState("September 2026");

  // Data contoh kehadiran anak (Ahmad Fauzan)
  const stats = {
    hadir: 20,
    sakit: 1,
    izin: 1,
    alpa: 0,
    persentaseKehadiran: "91%",
  };

  const logs = [
    {
      tanggal: "28 Sep 2026",
      jam: "07:10 WIB",
      metode: "Kartu Pelajar RFID (Gerbang Utama)",
      status: "HADIR",
      keterangan: "Tepat Waktu",
    },
    {
      tanggal: "25 Sep 2026",
      jam: "07:05 WIB",
      metode: "Kartu Pelajar RFID (Gerbang Utama)",
      status: "HADIR",
      keterangan: "Tepat Waktu",
    },
    {
      tanggal: "24 Sep 2026",
      jam: "-",
      metode: "Surat Keterangan Wali Murid",
      status: "SAKIT",
      keterangan: "Demam (Surat Dokter Terlampir)",
    },
    {
      tanggal: "23 Sep 2026",
      jam: "07:12 WIB",
      metode: "Geofencing GPS Siswa",
      status: "HADIR",
      keterangan: "Tepat Waktu",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigasi */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-1">
              ← Kembali ke Beranda Portal
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">
              Pemantauan Kehadiran Ananda
            </h1>
            <p className="text-sm text-slate-500">
              Layanan Terpadu Orang Tua & Wali Murid SMP
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
            Wali: Hendra Fauzan
          </span>
        </div>

        {/* Kartu Profil Anak */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-md">
              Kelas 8A • No. Absen 01
            </span>
            <h2 className="text-2xl font-extrabold mt-2">Ahmad Fauzan</h2>
            <p className="text-sm text-blue-100">
              NISN: 0081234567 • SMP Negeri 1 Merdeka
            </p>
            <p className="text-xs text-blue-200 mt-1">
              Wali Kelas: Budi Santoso, S.Pd. (Kontak: 0812-3456-7890)
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center min-w-[140px]">
            <span className="block text-xs uppercase text-blue-200 font-semibold tracking-wider">
              Tingkat Kehadiran
            </span>
            <span className="text-3xl font-black text-white">{stats.persentaseKehadiran}</span>
            <span className="block text-[11px] text-emerald-300 font-medium mt-0.5">Sangat Baik</span>
          </div>
        </div>

        {/* Ringkasan Kehadiran Bulanan */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Hadir</span>
            <span className="block text-2xl font-black text-emerald-600 mt-1">{stats.hadir} Hari</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Sakit</span>
            <span className="block text-2xl font-black text-blue-600 mt-1">{stats.sakit} Hari</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Izin</span>
            <span className="block text-2xl font-black text-amber-500 mt-1">{stats.izin} Hari</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Alpa / Tanpa Ket.</span>
            <span className="block text-2xl font-black text-red-600 mt-1">{stats.alpa} Hari</span>
          </div>
        </div>

        {/* Log Kehadiran Terakhir */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">
              Riwayat Presensi Harian ({selectedMonth})
            </h3>
            <span className="text-xs text-slate-400">Pembaruan otomatis real-time</span>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map((log, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{log.tanggal}</span>
                    <span className="text-xs text-slate-400">• Jam {log.jam}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{log.metode}</p>
                  {log.keterangan && (
                    <p className="text-xs text-slate-400 italic mt-0.5">Catatan: {log.keterangan}</p>
                  )}
                </div>

                <span
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    log.status === "HADIR"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : log.status === "SAKIT"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : log.status === "IZIN"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pengajuan Surat Izin / Sakit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Ananda berhalangan hadir ke sekolah?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Kirim surat keterangan izin atau surat sakit dari dokter langsung ke wali kelas tanpa perlu surat fisik.
            </p>
          </div>
          <button
            onClick={() => alert("Fitur unggah surat izin digital akan segera dibuka.")}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition whitespace-nowrap"
          >
            📄 Kirim Surat Izin / Sakit
          </button>
        </div>
      </div>
    </div>
  );
}
