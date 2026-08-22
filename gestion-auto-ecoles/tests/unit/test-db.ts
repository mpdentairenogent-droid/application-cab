import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Client Prisma dédié aux tests (pas d'import "server-only" ici, contrairement à
// src/server/db.ts) : les tests tournent sous Node/Vitest, hors du runtime Next.js.
// Pointe sur la même base que le développement (DATABASE_URL) — les tests
// d'intégration nettoient systématiquement ce qu'ils créent (afterAll/afterEach).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const testDb = new PrismaClient({ adapter });
