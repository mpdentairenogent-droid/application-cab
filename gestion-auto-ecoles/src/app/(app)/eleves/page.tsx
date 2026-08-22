import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Élèves" };

export default function ElevesPage() {
  return (
    <PermissionGate permission="students.view">
      <ModulePlaceholder
        title="Élèves"
        description="Fiches élèves, documents, inscriptions, historique des heures et des paiements."
        phase="Phase 2"
      />
    </PermissionGate>
  );
}
