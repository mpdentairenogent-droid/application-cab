import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Congés" };

export default function CongesPage() {
  return (
    <PermissionGate permission="leaves.view">
      <ModulePlaceholder
        title="Congés"
        description="Demandes de congés et absences, validation, calendrier des absences."
        phase="Phase 3"
      />
    </PermissionGate>
  );
}
