import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Ce fichier ne doit jamais être importé depuis src/app/** directement : tout
// accès aux données passe par src/server/services/**, qui applique les
// contrôles d'autorisation avant toute requête (voir src/server/auth/guards.ts).

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Évite de recréer un pool de connexions à chaque rechargement à chaud en développement.
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
