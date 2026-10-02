import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const THIRTY_DAYS = 30 * 24 * 60 * 60; // seconds
const ACCESS_RECHECK_MS = 2 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS,
    // Set updateAge equal to maxAge so the JWT is only rotated once per session
    // (just before it expires). Frequent rotation rewrites the cookie via an API
    // response header, which Android Chrome in standalone mode sometimes fails to
    // flush to persistent storage before the process is killed — causing the user
    // to be logged out on the next app open.
    updateAge: THIRTY_DAYS,
  },
  // Explicitly configure the session cookie so iOS PWA persists it across app closes
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: true,
        maxAge: THIRTY_DAYS,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Please contact the admin.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Role, team membership and active status are copied into the token, so
      // they are re-read from the database every few minutes. Without this a
      // deactivated, deleted or demoted account kept its old access until the
      // 30-day session expired.
      const userId = (user?.id ?? token.id) as string | undefined;
      const stale = !token.checkedAt || Date.now() - token.checkedAt > ACCESS_RECHECK_MS;
      if (userId && (user || stale)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            role: true,
            isActive: true,
            serviceTeams: { select: { team: { select: { name: true } } } },
          },
        });
        token.id = userId;
        token.disabled = !dbUser || !dbUser.isActive;
        token.role = dbUser?.role ?? "MEMBER";
        token.serviceTeams = dbUser?.serviceTeams.map((m) => m.team.name) ?? [];
        token.checkedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      // An empty session is treated as signed out by getServerSession and useSession.
      if (!token || token.disabled) return {} as typeof session;
      session.user.role = token.role as string;
      session.user.id = token.id as string;
      session.user.serviceTeams = (token.serviceTeams as string[]) ?? [];
      return session;
    },
  },
};
