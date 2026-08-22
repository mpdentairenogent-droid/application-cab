import { Badge } from "@/components/ui/badge";
import { STUDENT_STATUS_LABELS } from "@/lib/validations/student";
import type { StudentStatus } from "@prisma/client";

const VARIANT_BY_STATUS: Record<StudentStatus, "success" | "warning" | "info" | "muted"> = {
  ACTIF: "success",
  SUSPENDU: "warning",
  TERMINE: "info",
  ARCHIVE: "muted",
};

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return <Badge variant={VARIANT_BY_STATUS[status]}>{STUDENT_STATUS_LABELS[status]}</Badge>;
}
