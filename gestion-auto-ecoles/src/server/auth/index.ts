import "server-only";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { GlobalRoleKey } from "@prisma/client";
import bcrypt from "bcryptjs";
import { authConfig } from "./config";
import { prisma } from "../db";
import { recordAudit } from "../audit";
import { loginSchema } from "@/lib/validations/auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// Types dérivés directement de NextAuthConfig plutôt que réécrits à la main :
// garantit une compatibilité exacte avec les signatures attendues par next-auth.
type Callbacks = NonNullable<NextAuthConfig["callbacks"]>;
type JwtCallbackParams = Parameters<NonNullable<Callbacks["jwt"]>>[0];
type SessionCallbackParams = Parameters<NonNullable<Callbacks["session"]>>[0];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { role: true },
        });

        // Même message d'erreur générique côté client que l'utilisateur existe ou non
        // (voir la page de connexion) : on évite d'indiquer si un e-mail est enregistré.
        if (!user || user.archivedAt || user.status !== "ACTIF") {
          if (user) {
            await recordAudit({
              organizationId: user.organizationId,
              userId: user.id,
              action: "LOGIN_FAILED",
              entityType: "User",
              entityId: user.id,
            });
          }
          return null;
        }

        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
          await recordAudit({
            organizationId: user.organizationId,
            userId: user.id,
            action: "LOGIN_FAILED",
            entityType: "User",
            entityId: user.id,
            newValues: { reason: "compte_verrouille" },
          });
          return null;
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);

        if (!passwordValid) {
          const failedLoginAttempts = user.failedLoginAttempts + 1;
          const shouldLock = failedLoginAttempts >= MAX_FAILED_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: shouldLock ? 0 : failedLoginAttempts,
              lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : user.lockedUntil,
            },
          });
          await recordAudit({
            organizationId: user.organizationId,
            userId: user.id,
            action: "LOGIN_FAILED",
            entityType: "User",
            entityId: user.id,
            newValues: shouldLock ? { reason: "verrouillage_apres_echecs_repetes" } : undefined,
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        await recordAudit({
          organizationId: user.organizationId,
          userId: user.id,
          action: "LOGIN",
          entityType: "User",
          entityId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          organizationId: user.organizationId,
          roleKey: user.role.key,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }: JwtCallbackParams) {
      if (user?.id) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.roleKey = user.roleKey;
      }
      return token;
    },
    session({ session, token }: SessionCallbackParams) {
      // `token` typé via l'intersection interne de next-auth (stratégies jwt/database
      // combinées) : TS n'y résout pas nos champs custom malgré l'augmentation de JWT
      // dans types.d.ts. On sait par construction (voir le callback jwt ci-dessus)
      // que ces champs sont bien présents à ce stade ; cast explicite plutôt que
      // se battre contre le typage interne de la librairie.
      const customToken = token as unknown as { id?: string; organizationId?: string; roleKey?: GlobalRoleKey };
      if (customToken.id && customToken.organizationId && customToken.roleKey) {
        session.user.id = customToken.id;
        session.user.organizationId = customToken.organizationId;
        session.user.roleKey = customToken.roleKey;
      }
      return session;
    },
  },
});
