import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/layout/permission-gate";
import { listSchoolsForManagement } from "@/server/services/driving-school.service";
import { SchoolsTable } from "./schools-table";

export const metadata = { title: "Établissements" };

async function EtablissementsContent() {
  const schools = await listSchoolsForManagement();
  return <SchoolsTable schools={schools} />;
}

export default function EtablissementsPage() {
  return (
    <div>
      <PageHeader title="Établissements" description="Gestion des auto-écoles du groupe." />
      <PermissionGate permission="organization.manage">
        <EtablissementsContent />
      </PermissionGate>
    </div>
  );
}
