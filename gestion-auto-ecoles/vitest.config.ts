import path from "node:path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Le résolveur natif de Vite (resolve.tsconfigPaths) remonte l'arborescence et tombe sur
// le tsconfig.json d'un autre projet à la racine du dépôt (qui étend expo/tsconfig.base,
// absent d'ici) : on garde volontairement le plugin, plus robuste dans ce monorepo.
export default defineConfig({
  plugins: [tsconfigPaths({ root: __dirname })],
  resolve: {
    alias: {
      // Le vrai paquet lève toujours une erreur à l'import (c'est le bundler Next.js qui
      // l'aliase vers un module vide côté serveur) : voir tests/unit/stubs/server-only.ts.
      "server-only": path.resolve(__dirname, "tests/unit/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.ts"],
    testTimeout: 20000,
  },
});
