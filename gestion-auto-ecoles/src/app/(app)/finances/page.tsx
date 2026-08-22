import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PermissionGate } from "@/components/layout/permission-gate";

export const metadata = { title: "Finances" };

export default function FinancesPage() {
  return (
    <PermissionGate permission="finance.view">
      <ModulePlaceholder
        title="Finances"
        description="Recettes, dépenses, échéancier, récapitulatifs et exports comptables."
        phase="Phase 6"
      />
    </PermissionGate>
  );
}
