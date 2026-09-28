"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SiswaItem {
  id: string;
  nomorAbsen: number;
  nisn: string;
  namaLengkap: string;
  jenisKelamin: string;
}

type StatusType = "HADIR" | "SAKIT" | "IZIN" | "ALPA";

interface KehadiranState {
  [siswaId: string]: {
    status: StatusType;
    catatan: string;
  };
}

export default function GuruPresensiPage() {
  const [selectedRombel, setSelectedRombel] = useState("8A");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [materiAjar, setMateriAjar] = useState("Pengenalan Algoritma & Pemrograman Blok");
  const [jurnalGuru, setJurnalGuru] = useState("Siswa aktif melakukan praktikum dasar Scratch di lab komputer.");
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [kehadiran, setKehadiran] = useState<KehadiranState>({});
  const [jadwalId, setJadwalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Ambil data siswa berdasarkan rombel
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/guru/presensi?rombel=${selectedRombel}`);
        const data = await res.json();
        if (data.siswaList) {
          setSiswaList(data.siswaList);
          // Set jadwal pertama jika ada
          if (data.pembelajaran?.[0]?.jadwalList?.[0]) {
            setJadwalId(data.pembelajaran[0].jadwalList[0].id);
          } else {
            setJadwalId("11111111-1111-1111-1111-111111111111");
          }

          // Default semua siswa "HADIR"
          const initialKehadiran: KehadiranState = {};
          data.siswaList.forEach((s: SiswaItem) => {
            initialKehadiran[s.id] = { status: "HADIR", catatan: "" };
          });
          setKehadiran(initialKehadiran);
        }
      } catch (err) {
        console.error("Gagal memuat siswa:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedRombel]);

  const handleStatusChange = (siswaId: string, status: StatusType) => {
    setKehadiran((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        status,
      },
    }));
  };

  const handleCatatanChange = (siswaId: string, catatan: string) => {
    setKehadiran((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        catatan,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAlertMsg(null);

    const payload = {
      jadwalPelajaranId: jadwalId || "11111111-1111-1111-1111-111111111111",
      tanggal,
      materiAjar,
      jurnalGuru,
      kehadiran: Object.entries(kehadiran).map(([siswaId, val]) => ({
        siswaId,
        status: val.status,
        catatan: val.catatan,
      })),
    };

    try {
      const res = await fetch("/api/guru/presensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setAlertMsg({ type: "success", text: result.message || "Presensi berhasil disimpan!" });
      } else {
        setAlertMsg({ type: "error", text: result.error || "Gagal menyimpan presensi" });
      }
    } catch (err) {
      setAlertMsg({ type: "error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setSubmitting(false);
    }
  };

  // Ringkasan Kehadiran
  const countStatus = (st: StatusType) =>
    Object.values(kehadiran).filter((k) => k.status === st).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigasi */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-1">
              ← Kembali ke Beranda Portal
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">
              Presensi Kelas SMP (Kurikulum Merdeka)
            </h1>
            <p className="text-sm text-slate-500">
              Mata Pelajaran: Informatika • Fase D (Kelas 8)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
              Guru: Budi Santoso, S.Pd.
            </span>
          </div>
        </div>

        {alertMsg && (
          <div
            className={`p-4 rounded-xl border text-sm font-medium ${
              alertMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {alertMsg.text}
          </div>
        )}

        {/* Filter Rombel & Tanggal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Pilih Rombongan Belajar (Kelas)
            </label>
            <select
              value={selectedRombel}
              onChange={(e) => setSelectedRombel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-blue-500"
            >
              <option value="8A">Kelas 8A (Wali Kelas: Budi Santoso)</option>
              <option value="7A">Kelas 7A</option>
              <option value="9A">Kelas 9A</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tanggal Pembelajaran
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-blue-500"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-center">
              <span className="block text-xs text-slate-500">Hadir</span>
              <span className="text-lg font-bold text-emerald-600">{countStatus("HADIR")}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500">Sakit</span>
              <span className="text-lg font-bold text-blue-600">{countStatus("SAKIT")}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500">Izin</span>
              <span className="text-lg font-bold text-amber-600">{countStatus("IZIN")}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-slate-500">Alpa</span>
              <span className="text-lg font-bold text-red-600">{countStatus("ALPA")}</span>
            </div>
          </div>
        </div>

        {/* Tabel Daftar Siswa */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-sm">
                Daftar Kehadiran Siswa ({siswaList.length} Siswa Terdaftar)
              </h2>
              <span className="text-xs text-slate-500">
                Pilih status: 🟢 H = Hadir • 🔵 S = Sakit • 🟡 I = Izin • 🔴 A = Alpa
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 animate-pulse">
                Memuat data siswa kelas {selectedRombel}...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Siswa & NISN</th>
                      <th className="py-3 px-4 text-center">Status Kehadiran</th>
                      <th className="py-3 px-4">Catatan Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {siswaList.map((siswa) => {
                      const currentStatus = kehadiran[siswa.id]?.status || "HADIR";
                      return (
                        <tr key={siswa.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 text-center font-bold text-slate-600">
                            {siswa.nomorAbsen}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-800">{siswa.namaLengkap}</p>
                            <p className="text-xs text-slate-400">NISN: {siswa.nisn}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {(["HADIR", "SAKIT", "IZIN", "ALPA"] as StatusType[]).map((st) => {
                                const isSelected = currentStatus === st;
                                const colorClass =
                                  st === "HADIR"
                                    ? isSelected
                                      ? "bg-emerald-600 text-white shadow-sm"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : st === "SAKIT"
                                    ? isSelected
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    : st === "IZIN"
                                    ? isSelected
                                      ? "bg-amber-500 text-white shadow-sm"
                                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                    : isSelected
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "bg-red-50 text-red-700 hover:bg-red-100";

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusChange(siswa.id, st)}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${colorClass}`}
                                  >
                                    {st[0]}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              placeholder={
                                currentStatus !== "HADIR"
                                  ? "Isi alasan (misal: Demam/Acara keluarga)"
                                  : "Catatan khusus (opsional)"
                              }
                              value={kehadiran[siswa.id]?.catatan || ""}
                              onChange={(e) => handleCatatanChange(siswa.id, e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Jurnal Mengajar & Catatan Materi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Jurnal Mengajar Guru (Kurikulum Merdeka)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Materi Pokok / Tujuan Pembelajaran (TP)
                </label>
                <input
                  type="text"
                  value={materiAjar}
                  onChange={(e) => setMateriAjar(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Catatan Jurnal / Evaluasi Kelas
                </label>
                <input
                  type="text"
                  value={jurnalGuru}
                  onChange={(e) => setJurnalGuru(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tombol Simpan & Notifikasi */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-500">
              ⚠️ Menyimpan presensi akan otomatis memicu pesan WhatsApp ke orang tua bagi siswa yang Sakit, Izin, atau Alpa.
            </p>
            <button
              type="submit"
              disabled={submitting || loading}
              className="py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? "Menyimpan & Mengirim Notif..." : "💾 Simpan Presensi & Kirim WhatsApp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
