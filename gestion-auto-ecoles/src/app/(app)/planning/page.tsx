import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Planning" };

export default function PlanningPage() {
  return (
    <PermissionGate permission="planning.view">
      <ModulePlaceholder
        title="Planning"
        description="Calendrier des leçons (jour, semaine, mois), avec détection des conflits moniteur/véhicule."
        phase="Phase 3"
      />
    </PermissionGate>
  );
}
