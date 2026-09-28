"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white shadow-xl rounded-2xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
            Kurikulum Merdeka • Fase D (SMP)
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800">
            Portal Pendidikan Satu Pintu
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Sistem Informasi Akademik, Presensi Terpadu & Layanan Wali Murid
          </p>
        </div>

        {status === "loading" ? (
          <div className="text-center py-8 text-slate-500 animate-pulse">
            Memverifikasi sesi SSO Keycloak...
          </div>
        ) : session ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 font-semibold uppercase">
                    Status Otentikasi SSO
                  </p>
                  <p className="text-lg font-bold text-slate-800">
                    {session.user?.name || session.user?.username || session.user?.email}
                  </p>
                  <p className="text-xs text-slate-500">ID SSO: {session.user?.id}</p>
                </div>
                <span className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm">
                  {session.user?.role}
                </span>
              </div>
            </div>

            {/* Navigasi Berdasarkan Peran Pengguna */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">Akses Sub-Portal Anda:</h2>
              <div className="grid grid-cols-2 gap-3">
                {(session.user?.role === "SUPER_ADMIN" || session.user?.role === "STAFF_TU") && (
                  <Link
                    href="/admin/dashboard"
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center text-sm font-medium transition"
                  >
                    🏢 Portal Tata Usaha & Admin
                  </Link>
                )}
                {(session.user?.role === "GURU" || session.user?.role === "WALI_KELAS" || session.user?.role === "SUPER_ADMIN") && (
                  <Link
                    href="/guru/presensi"
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-center text-sm font-medium transition"
                  >
                    👨‍🏫 Portal Guru & Presensi Kelas
                  </Link>
                )}
                {(session.user?.role === "SISWA" || session.user?.role === "SUPER_ADMIN") && (
                  <Link
                    href="/siswa/jadwal"
                    className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-center text-sm font-medium transition"
                  >
                    🎒 Portal Siswa SMP
                  </Link>
                )}
                {(session.user?.role === "WALI_MURID" || session.user?.role === "SUPER_ADMIN") && (
                  <Link
                    href="/wali/presensi-anak"
                    className="p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-center text-sm font-medium transition"
                  >
                    👨‍👩‍👧 Portal Wali Murid
                  </Link>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition font-medium"
              >
                Keluar (Logout SSO)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <p className="text-sm text-slate-600 mb-4">
                Silakan masuk dengan akun terpusat Anda (NISN Siswa, NIP Guru, atau Nomor WhatsApp Orang Tua).
              </p>
              <button
                onClick={() => signIn("keycloak")}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                🔐 Masuk dengan Keycloak SSO
              </button>
            </div>

            <div className="text-xs text-slate-400 text-center">
              Identity Provider: Keycloak 24+ On-Premise • Protokol: OIDC Authorization Code Flow + PKCE
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
