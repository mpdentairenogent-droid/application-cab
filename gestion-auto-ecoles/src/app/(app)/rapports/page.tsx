import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Rapports" };

export default function RapportsPage() {
  return (
    <PermissionGate permission="reports.view">
      <ModulePlaceholder
        title="Rapports"
        description="Rapports filtrables, exports CSV et statistiques comparatives entre établissements."
        phase="Phase 6"
      />
    </PermissionGate>
  );
}
