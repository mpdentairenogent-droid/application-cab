import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Le dépôt contient un autre projet (non lié) à la racine avec son propre
  // package-lock.json ; on fixe explicitement la racine pour éviter toute
  // confusion de résolution de modules entre les deux projets.
  turbopack: {
    root: __dirname,
  },
  // Documents ne sont jamais servis en statique : uniquement via l'API signée (voir src/server/storage.ts).
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
