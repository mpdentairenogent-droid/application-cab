export { auth as proxy } from "@/server/auth";

// Depuis Next.js 16, "middleware" est renommé "proxy" (fonctionnement identique).
// Le Proxy tourne par défaut en runtime Node.js (v16+), donc plus besoin de séparer
// une config "edge-safe" : on réutilise directement l'instance auth() complète.
// Rappel : le Proxy ne fait qu'une vérification légère de présence de session pour
// rediriger vers /connexion ; l'autorisation fine (permissions, établissement) est
// systématiquement revérifiée dans chaque service serveur (src/server/auth/guards.ts),
// jamais confiée uniquement au Proxy.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
