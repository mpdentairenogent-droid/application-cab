import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Examens" };

export default function ExamensPage() {
  return (
    <PermissionGate permission="exams.view">
      <ModulePlaceholder
        title="Examens"
        description="Places attribuées par la préfecture, affectations, liste d'attente, résultats et taux de réussite."
        phase="Phase 4"
      />
    </PermissionGate>
  );
}
