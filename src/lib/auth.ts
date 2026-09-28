import { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID || "k12-web-portal",
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "k12-web-secret-super-secure-key-2026",
      issuer: `${process.env.KEYCLOAK_BASE_URL || "http://localhost:8080/auth"}/realms/${
        process.env.KEYCLOAK_REALM || "k12-portal"
      }`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = profile.sub;
        const keycloakProfile = profile as Record<string, any>;

        // Ekstraksi roles dari Keycloak token claim
        const realmRoles: string[] =
          keycloakProfile.roles ||
          keycloakProfile.realm_access?.roles ||
          [];

        const validRoles = [
          "SUPER_ADMIN",
          "STAFF_TU",
          "GURU",
          "WALI_KELAS",
          "SISWA",
          "WALI_MURID",
        ] as const;

        // Pilih role dengan prioritas tertinggi yang dimiliki user
        const matchedRole = validRoles.find((role) => realmRoles.includes(role)) || "SISWA";

        token.role = matchedRole;
        token.username = keycloakProfile.preferred_username || token.email?.split("@")[0] || token.sub;
        token.phoneNumber = keycloakProfile.phone_number;
        token.accessToken = account.access_token;

        // Sinkronisasi otomatis ke Database PostgreSQL (Tabel users)
        try {
          await prisma.user.upsert({
            where: { ssoUserId: token.sub! },
            update: {
              username: token.username as string,
              email: token.email,
              phoneNumber: token.phoneNumber,
              role: token.role as any,
              isActive: true,
            },
            create: {
              ssoUserId: token.sub!,
              username: token.username as string,
              email: token.email,
              phoneNumber: token.phoneNumber,
              role: token.role as any,
              isActive: true,
            },
          });
        } catch (dbError) {
          console.error("Gagal sinkronisasi data user ke PostgreSQL:", dbError);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.phoneNumber = token.phoneNumber;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  secret: process.env.NEXTAUTH_SECRET || "edupass_super_secret_session_key_2026_xyz",
};
