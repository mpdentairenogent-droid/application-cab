import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/layout/permission-gate";
import { requireUser } from "@/server/auth/guards";
import { getStudent, getStudentFormOptions } from "@/server/services/student.service";
import { StudentForm } from "../../student-form";

export const metadata = { title: "Modifier un élève" };

async function ModifierEleveContent({ id }: { id: string }) {
  const ctx = await requireUser();
  const [studentWithRelations, options] = await Promise.all([getStudent(id), getStudentFormOptions(ctx)]);
  // Decimal (Prisma) ne peut pas traverser la frontière Server -> Client Component, et
  // getStudent() renvoie des relations imbriquées (enrollments.trainingPackage) inutiles au
  // formulaire : on reconstruit un objet plat avec uniquement les champs du formulaire.
  const { enrollments, drivingSchool, referentInstructor, ...student } = studentWithRelations;
  const packages = options.packages.map((p) => ({ ...p, includedHours: Number(p.includedHours) }));
  return (
    <StudentForm
      student={{ ...student, hoursBalance: Number(student.hoursBalance) }}
      schools={options.schools}
      instructors={options.instructors}
      packages={packages}
    />
  );
}

export default async function ModifierElevePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Modifier l'élève" />
      <PermissionGate permission="students.manage">
        <ModifierEleveContent id={id} />
      </PermissionGate>
    </div>
  );
}
