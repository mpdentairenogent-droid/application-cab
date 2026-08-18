import { useAuth } from '@/auth/AuthProvider';
import type { PermissionCode } from '@/constants/permissions';

export function usePermissions() {
  const { permissions, profile } = useAuth();

  return {
    role: profile?.role ?? null,
    can: (permission: PermissionCode) => permissions.has(permission),
    canAny: (perms: PermissionCode[]) => perms.some((permission) => permissions.has(permission)),
  };
}
