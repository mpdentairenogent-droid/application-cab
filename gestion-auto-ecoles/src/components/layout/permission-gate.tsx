import type { PermissionKey } from "@/lib/permissions";
import { getCurrentUserContext } from "@/server/auth/guards";
import { AccessDenied } from "./access-denied";

/**
 * Garde d'affichage au niveau page : n'est PAS la frontière de sécurité (celle-ci reste
 * requirePermission côté service, seule invoquée par les mutations et les requêtes de
 * données). Sert uniquement à afficher un message clair plutôt qu'un écran d'erreur
 * générique si un utilisateur accède directement à une URL non autorisée.
 */
export async function PermissionGate({
  permission,
  children,
}: {
  permission: PermissionKey;
  children: React.ReactNode;
}) {
  const ctx = await getCurrentUserContext();
  if (!ctx || !ctx.permissions.has(permission)) return <AccessDenied />;
  return <>{children}</>;
}
