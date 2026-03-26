import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { normalizeUserEmail } from "./user-email";
import { compare } from "bcryptjs";
import type { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const emailNorm = normalizeUserEmail(credentials.email);
        const emailRaw = credentials.email.trim();
        try {
          // Primary: normalized address (all new signups + lead conversions use this).
          let user = await prisma.user.findUnique({ where: { email: emailNorm } });

          // Legacy rows created before normalization (mixed case / odd spacing).
          if (!user) {
            user =
              (await prisma.user.findUnique({ where: { email: emailRaw } })) ??
              (await prisma.user.findFirst({
                where: { email: { equals: emailRaw, mode: "insensitive" } },
              }));
          }

          if (!user) {
            const rows = await prisma.$queryRaw<{ id: string }[]>`
              SELECT id FROM "User"
              WHERE LOWER(TRIM(email)) = LOWER(TRIM(${emailNorm}))
              LIMIT 1
            `;
            if (rows[0]) {
              user = await prisma.user.findUnique({ where: { id: rows[0].id } });
            }
          }

          if (!user || !user.passwordHash) {
            if (process.env.LOGIN_DEBUG === "true") {
              console.warn("[auth] no user or missing passwordHash", {
                email: emailNorm,
                userFound: !!user,
              });
            }
            return null;
          }
          const valid = await compare(credentials.password, user.passwordHash);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (e) {
          console.error("[auth] credentials authorize failed:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: Role }).role = token.role as Role;
      }
      return session;
    },
  },
};
