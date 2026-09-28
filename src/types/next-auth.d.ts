import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string | null;
      role?: "SUPER_ADMIN" | "STAFF_TU" | "GURU" | "WALI_KELAS" | "SISWA" | "WALI_MURID";
      phoneNumber?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username?: string | null;
    role?: "SUPER_ADMIN" | "STAFF_TU" | "GURU" | "WALI_KELAS" | "SISWA" | "WALI_MURID";
    phoneNumber?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    username?: string;
    role?: "SUPER_ADMIN" | "STAFF_TU" | "GURU" | "WALI_KELAS" | "SISWA" | "WALI_MURID";
    phoneNumber?: string;
    accessToken?: string;
  }
}
