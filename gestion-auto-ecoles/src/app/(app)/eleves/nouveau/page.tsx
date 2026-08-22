import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/layout/permission-gate";
import { requireUser } from "@/server/auth/guards";
import { getStudentFormOptions } from "@/server/services/student.service";
import { StudentForm } from "../student-form";

export const metadata = { title: "Nouvel élève" };

async function NouvelEleveContent() {
  const ctx = await requireUser();
  const options = await getStudentFormOptions(ctx);
  // Decimal (Prisma) ne peut pas traverser la frontière Server -> Client Component.
  const packages = options.packages.map((p) => ({ ...p, includedHours: Number(p.includedHours) }));
  return <StudentForm schools={options.schools} instructors={options.instructors} packages={packages} />;
}

export default function NouvelElevePage() {
  return (
    <div>
      <PageHeader title="Nouvel élève" description="Créer une fiche élève complète." />
      <PermissionGate permission="students.manage">
        <NouvelEleveContent />
      </PermissionGate>
    </div>
  );
}
