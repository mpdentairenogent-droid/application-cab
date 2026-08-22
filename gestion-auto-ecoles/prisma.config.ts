import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Config CLI Prisma (migrate, studio, db seed...). La connexion utilisée par
// l'application au runtime est configurée séparément avec un driver adapter,
// voir src/server/db.ts — les deux lisent la même variable DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
