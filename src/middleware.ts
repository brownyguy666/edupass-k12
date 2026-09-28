import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const role = token?.role;

    // Proteksi Rute Admin & TU
    if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN" && role !== "STAFF_TU") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Proteksi Rute Guru & Wali Kelas
    if (pathname.startsWith("/guru") && role !== "GURU" && role !== "WALI_KELAS" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Proteksi Rute Siswa
    if (pathname.startsWith("/siswa") && role !== "SISWA" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Proteksi Rute Wali Murid
    if (pathname.startsWith("/wali") && role !== "WALI_MURID" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/api/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/guru/:path*",
    "/siswa/:path*",
    "/wali/:path*",
    "/dashboard/:path*",
  ],
};
