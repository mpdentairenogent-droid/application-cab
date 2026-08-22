import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <PermissionGate permission="documents.view">
      <ModulePlaceholder
        title="Documents"
        description="Centre documentaire (élèves, salariés, véhicules, examens) avec accès sécurisé par URL temporaire."
        phase="Phase 2"
      />
    </PermissionGate>
  );
}
