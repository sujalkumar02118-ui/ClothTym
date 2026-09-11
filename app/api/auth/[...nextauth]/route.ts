import NextAuth, {
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
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

        const email = String(credentials.email)
          .trim()
          .toLowerCase();

        const password = String(
          credentials.password
        );

        const user = await prisma.user.findUnique({
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

        if (!user || !user.password) {
          return null;
        }

        // BLOCKED USER CHECK
        if (user.isBlocked) {
          throw new Error("USER_BLOCKED");
        }

        const passwordMatch =
          await bcrypt.compare(
            password,
            user.password
          );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isBlocked: user.isBlocked,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
        token.isBlocked = user.isBlocked;
      }

      // Re-check database on every JWT callback.
      if (token.id) {
        const currentUser =
          await prisma.user.findUnique({
            where: {
              id: String(token.id),
            },

            select: {
              role: true,
              phone: true,
              isBlocked: true,
            },
          });

        if (currentUser) {
          token.role = currentUser.role;
          token.phone = currentUser.phone;
          token.isBlocked =
            currentUser.isBlocked;
        }
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (session.user) {
        session.user.id =
          String(token.id || "");

        session.user.role =
          token.role as string;

        const customUser =
          session.user as typeof session.user & {
            phone: string;
            isBlocked: boolean;
          };

        customUser.phone =
          String(token.phone || "");

        customUser.isBlocked =
          Boolean(token.isBlocked);
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug:
    process.env.NODE_ENV ===
    "development",
};

const handler = NextAuth(authOptions);

export {
  handler as GET,
  handler as POST,
};