import Link from "next/link";
import { Plus, Download, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/layout/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { requireUser } from "@/server/auth/guards";
import { listAccessibleSchools } from "@/server/services/driving-school.service";
import { listStudents, listInstructorsForFilters } from "@/server/services/student.service";
import { LICENSE_CATEGORY_LABELS, TRAINING_TYPE_LABELS, STUDENT_STATUS_LABELS } from "@/lib/validations/student";
import type { StudentStatus, TrainingType, LicenseCategory } from "@prisma/client";

export const metadata = { title: "Élèves" };

type SearchParams = {
  q?: string;
  drivingSchoolId?: string;
  status?: string;
  trainingType?: string;
  licenseCategory?: string;
  referentInstructorId?: string;
  page?: string;
};

function buildQuery(params: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) query.set(key, value);
  }
  return `?${query.toString()}`;
}

async function ElevesContent({ searchParams }: { searchParams: SearchParams }) {
  const ctx = await requireUser();
  const page = Number(searchParams.page ?? "1") || 1;

  const [schools, instructors, result] = await Promise.all([
    listAccessibleSchools(ctx),
    listInstructorsForFilters(ctx),
    listStudents({
      drivingSchoolId: searchParams.drivingSchoolId,
      status: (searchParams.status as StudentStatus) || undefined,
      trainingType: (searchParams.trainingType as TrainingType) || undefined,
      licenseCategory: (searchParams.licenseCategory as LicenseCategory) || undefined,
      referentInstructorId: searchParams.referentInstructorId || undefined,
      search: searchParams.q,
      page,
    }),
  ]);

  const canManage = ctx.permissions.has("students.manage");
  const exportQuery = buildQuery(searchParams, {});

  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="min-w-[220px] flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Recherche</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={searchParams.q ?? ""} placeholder="Nom, téléphone, e-mail, NEPH..." className="pl-8" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Établissement</label>
          <select name="drivingSchoolId" defaultValue={searchParams.drivingSchoolId ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">Tous</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Statut</label>
          <select name="status" defaultValue={searchParams.status ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">Tous</option>
            {Object.entries(STUDENT_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Formation</label>
          <select name="trainingType" defaultValue={searchParams.trainingType ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">Toutes</option>
            {Object.entries(TRAINING_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Permis</label>
          <select name="licenseCategory" defaultValue={searchParams.licenseCategory ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">Tous</option>
            {Object.entries(LICENSE_CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Moniteur</label>
          <select name="referentInstructorId" defaultValue={searchParams.referentInstructorId ?? ""} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            <option value="">Tous</option>
            {instructors.map((i) => (
              <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm">Filtrer</Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/eleves/export${exportQuery}`}>
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </Button>
        {canManage && (
          <Button asChild size="sm" className="ml-auto">
            <Link href="/eleves/nouveau">
              <Plus className="h-4 w-4" />
              Nouvel élève
            </Link>
          </Button>
        )}
      </form>

      {result.students.length === 0 ? (
        <EmptyState title="Aucun élève trouvé" description="Ajustez vos filtres ou créez un nouvel élève." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° interne</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Permis</TableHead>
                <TableHead>Moniteur référent</TableHead>
                <TableHead>Solde h.</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.students.map((student) => (
                <TableRow key={student.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/eleves/${student.id}`} className="font-mono text-xs text-primary hover:underline">
                      {student.internalNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/eleves/${student.id}`} className="hover:underline">
                      {student.lastName} {student.firstName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{student.drivingSchool.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{student.phone || student.email || "—"}</TableCell>
                  <TableCell>{LICENSE_CATEGORY_LABELS[student.licenseCategory]}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.referentInstructor ? `${student.referentInstructor.firstName} ${student.referentInstructor.lastName}` : "—"}
                  </TableCell>
                  <TableCell>{student.hoursBalance.toString()}</TableCell>
                  <TableCell>
                    <StudentStatusBadge status={student.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{result.total} élève(s) au total</span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                <Link href={buildQuery(searchParams, { page: String(page - 1) })}>Précédent</Link>
              </Button>
              <span className="flex items-center px-2">Page {page} / {result.pageCount}</span>
              <Button asChild variant="outline" size="sm" disabled={page >= result.pageCount}>
                <Link href={buildQuery(searchParams, { page: String(page + 1) })}>Suivant</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default async function ElevesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  return (
    <div>
      <PageHeader title="Élèves" description="Fiches élèves, dossiers, documents et paiements." />
      <PermissionGate permission="students.view">
        <ElevesContent searchParams={resolvedSearchParams} />
      </PermissionGate>
    </div>
  );
}
