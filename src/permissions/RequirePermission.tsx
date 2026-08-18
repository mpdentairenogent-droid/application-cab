import type { ReactNode } from 'react';

import type { PermissionCode } from '@/constants/permissions';

import { usePermissions } from './usePermissions';

interface RequirePermissionProps {
  permission: PermissionCode;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Confort d'affichage uniquement : masque du contenu selon la permission
 * résolue côté serveur (my_permissions()). La vraie barrière de sécurité vit
 * dans les policies RLS (§17) — ce composant ne fait que suivre ce que
 * l'API a déjà décidé de révéler, jamais l'inverse.
 */
export function RequirePermission({ permission, fallback = null, children }: RequirePermissionProps) {
  const { can } = usePermissions();
  return <>{can(permission) ? children : fallback}</>;
}
