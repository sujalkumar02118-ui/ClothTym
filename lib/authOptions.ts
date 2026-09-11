import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const email = String(
          credentials.email
        )
          .trim()
          .toLowerCase();

        const password = String(
          credentials.password
        );

        if (!email || !password) {
          return null;
        }

        const user =
          await prisma.user.findUnique({
            where: {
              email,
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              password: true,
              role: true,
              isBlocked: true,
            },
          });

        if (!user) {
          return null;
        }

        if (user.isBlocked) {
          throw new Error("USER_BLOCKED");
        }

        if (!user.password) {
          return null;
        }

        const bcrypt =
          await import("bcryptjs");

        const isPasswordValid =
          await bcrypt.compare(
            password,
            user.password
          );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone ?? "",
          role: user.role,
          isBlocked: user.isBlocked,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token }) {
      if (!token.id) {
        return token;
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: String(token.id),
          },
          select: {
            id: true,
            role: true,
            phone: true,
            isBlocked: true,
          },
        });

      // User no longer exists → invalidate session
      if (!user) {
        return {};
      }

      // Keep role/block status synchronized
      token.id = user.id;
      token.role = user.role;
      token.phone = user.phone ?? "";
      token.isBlocked = user.isBlocked;

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const customUser =
          session.user as typeof session.user & {
            role: string;
            phone: string;
            isBlocked: boolean;
          };

        customUser.id = String(
          token.id || ""
        );

        customUser.role =
          String(token.role || "");

        customUser.phone =
          String(token.phone || "");

        customUser.isBlocked =
          Boolean(token.isBlocked);
      }

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug:
    process.env.NODE_ENV ===
    "development",
};