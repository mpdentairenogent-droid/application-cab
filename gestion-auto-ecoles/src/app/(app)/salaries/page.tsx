import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Salariés" };

export default function SalariesPage() {
  return (
    <PermissionGate permission="employees.view">
      <ModulePlaceholder
        title="Salariés"
        description="Fiches salariés, contrats, qualifications, temps de travail et variables de paie."
        phase="Phase 3"
      />
    </PermissionGate>
  );
}
