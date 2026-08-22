import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/layout/permission-gate";
import { requireUser } from "@/server/auth/guards";
import { listUsers, listRolesForOrg } from "@/server/services/user.service";
import { listSchoolsForManagement } from "@/server/services/driving-school.service";
import { UsersTable } from "./users-table";

export const metadata = { title: "Utilisateurs" };

async function UtilisateursContent() {
  const ctx = await requireUser();
  const [users, roles, schools] = await Promise.all([listUsers(), listRolesForOrg(ctx), listSchoolsForManagement()]);

  return <UsersTable users={users} roles={roles} schools={schools} currentUserId={ctx.id} />;
}

export default function UtilisateursPage() {
  return (
    <div>
      <PageHeader title="Utilisateurs" description="Comptes, rôles et accès aux établissements." />
      <PermissionGate permission="users.manage">
        <UtilisateursContent />
      </PermissionGate>
    </div>
  );
}
