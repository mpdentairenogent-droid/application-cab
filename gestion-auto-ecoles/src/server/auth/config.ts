import type { NextAuthConfig } from "next-auth";

// Config de base partagée (pages, session, callback authorized utilisé par le Proxy
// pour la redirection). Le provider Credentials (avec accès Prisma) est ajouté
// séparément dans src/server/auth/index.ts, qui étend cette config.
export const authConfig = {
  pages: {
    signIn: "/connexion",
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 heures
  },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublicRoute = pathname.startsWith("/connexion") || pathname.startsWith("/api/auth");

      if (isPublicRoute) {
        if (isLoggedIn && pathname.startsWith("/connexion")) {
          return Response.redirect(new URL("/tableau-de-bord", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
