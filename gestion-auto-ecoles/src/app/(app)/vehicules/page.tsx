import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Véhicules" };

export default function VehiculesPage() {
  return (
    <PermissionGate permission="vehicles.view">
      <ModulePlaceholder
        title="Véhicules"
        description="Parc automobile, contrats de financement, entretiens, assurances et immobilisations."
        phase="Phase 5"
      />
    </PermissionGate>
  );
}
