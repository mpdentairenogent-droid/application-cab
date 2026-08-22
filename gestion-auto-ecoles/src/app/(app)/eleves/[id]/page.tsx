import Link from "next/link";
import { Pencil, Mail, Phone, MapPin, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/layout/permission-gate";
import { PrintButton } from "@/components/layout/print-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { requireUser } from "@/server/auth/guards";
import { getStudent } from "@/server/services/student.service";
import { listStudentDocuments, getMissingStudentDocumentCategories } from "@/server/services/document.service";
import { listStudentPayments, getStudentFinancialSummary } from "@/server/services/payment.service";
import { formatDate } from "@/lib/format";
import { LICENSE_CATEGORY_LABELS, TRAINING_TYPE_LABELS, STUDENT_FILE_STATUS_LABELS } from "@/lib/validations/student";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/validations/document";
import { PAYMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/validations/payment";
import { formatCurrency } from "@/lib/format";
import { DocumentsSection } from "./documents-section";
import { PaymentsSection } from "./payments-section";
import { StudentArchiveToggle } from "./archive-toggle";

async function EleveDetailContent({ id }: { id: string }) {
  const ctx = await requireUser();
  const student = await getStudent(id);
  const [documents, missingCategories, payments, summary] = await Promise.all([
    listStudentDocuments(id),
    getMissingStudentDocumentCategories(id),
    listStudentPayments(id),
    getStudentFinancialSummary(id),
  ]);

  const canManage = ctx.permissions.has("students.manage");
  const fullName = `${student.civility === "M" ? "M." : "Mme"} ${student.firstName} ${student.lastName}`;

  return (
    <div>
      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">{fullName}</h1>
            <StudentStatusBadge status={student.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            N° {student.internalNumber} · {student.drivingSchool.name} · Permis {LICENSE_CATEGORY_LABELS[student.licenseCategory]}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <PrintButton label="Fiche imprimable" />
          {canManage && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/eleves/${id}/modifier`}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>
              </Button>
              <StudentArchiveToggle studentId={id} archived={!!student.archivedAt} studentName={fullName} />
            </>
          )}
        </div>
      </div>

      {/* Écran : onglets interactifs */}
      <div className="no-print">
        <Tabs defaultValue="infos">
          <TabsList>
            <TabsTrigger value="infos">Informations</TabsTrigger>
            <TabsTrigger value="documents">
              Documents {missingCategories.length > 0 && `(${missingCategories.length} manquant${missingCategories.length > 1 ? "s" : ""})`}
            </TabsTrigger>
            <TabsTrigger value="paiements">Paiements</TabsTrigger>
          </TabsList>

          <TabsContent value="infos">
            <InfosCard student={student} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsSection studentId={id} documents={documents} missingCategories={missingCategories} canManage={canManage} />
          </TabsContent>

          <TabsContent value="paiements">
            <PaymentsSection studentId={id} payments={payments} summary={summary} canManage={canManage} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Impression : fiche récapitulative complète, indépendante de l'onglet actif à l'écran */}
      <div className="hidden print:block">
        <h1 className="text-lg font-bold">Fiche élève — {fullName}</h1>
        <p className="text-sm">
          N° interne : {student.internalNumber} — {student.drivingSchool.name}
        </p>
        <hr className="my-3" />
        <PrintInfos student={student} />
        <h2 className="mt-4 text-sm font-bold">Documents ({documents.length})</h2>
        <ul className="text-sm">
          {documents.map((d) => (
            <li key={d.id}>
              {DOCUMENT_CATEGORY_LABELS[d.category] ?? d.category} — {d.fileName} (ajouté le {formatDate(d.createdAt)})
            </li>
          ))}
        </ul>
        {missingCategories.length > 0 && (
          <p className="mt-1 text-sm">Manquants : {missingCategories.map((c) => DOCUMENT_CATEGORY_LABELS[c] ?? c).join(", ")}</p>
        )}
        <h2 className="mt-4 text-sm font-bold">
          Paiements — dû {formatCurrency(summary.totalDueCents)}, réglé {formatCurrency(summary.totalPaidCents)}, solde{" "}
          {formatCurrency(summary.balanceCents)}
        </h2>
        <ul className="text-sm">
          {payments.map((p) => (
            <li key={p.id}>
              {formatDate(p.paidAt)} — {PAYMENT_TYPE_LABELS[p.type]} {formatCurrency(p.amountCents)} ({PAYMENT_METHOD_LABELS[p.method]}) —{" "}
              {p.serviceDescription}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InfosCard({ student }: { student: Awaited<ReturnType<typeof getStudent>> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <h3 className="font-semibold">Identité</h3>
          <p>
            Né(e) le {formatDate(student.birthDate)}
            {student.birthPlace && ` à ${student.birthPlace}`}
          </p>
          {student.address && (
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {student.address}, {student.postalCode} {student.city}
            </p>
          )}
          {student.phone && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" /> {student.phone}
            </p>
          )}
          {student.email && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" /> {student.email}
            </p>
          )}
          {student.legalGuardianName && (
            <p className="text-muted-foreground">
              Représentant légal : {student.legalGuardianName}
              {student.legalGuardianPhone && ` · ${student.legalGuardianPhone}`}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Consentement RGPD : {student.gdprConsentAt ? `recueilli le ${formatDate(student.gdprConsentAt)}` : "non recueilli"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <h3 className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-4 w-4" /> Formation
          </h3>
          <p>Inscrit(e) le {formatDate(student.registeredAt)}</p>
          <p>Type de formation : {TRAINING_TYPE_LABELS[student.trainingType]}</p>
          <p>Permis préparé : {LICENSE_CATEGORY_LABELS[student.licenseCategory]}</p>
          <p>NEPH : {student.nephNumber ?? "non renseigné"}</p>
          <p>Statut du dossier : {STUDENT_FILE_STATUS_LABELS[student.fileStatus]}</p>
          <p>
            Moniteur référent : {student.referentInstructor ? `${student.referentInstructor.firstName} ${student.referentInstructor.lastName}` : "aucun"}
          </p>
          <p>Solde d&apos;heures : {student.hoursBalance.toString()} h</p>
          {student.internalNotes && <p className="text-muted-foreground">Remarques : {student.internalNotes}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function PrintInfos({ student }: { student: Awaited<ReturnType<typeof getStudent>> }) {
  return (
    <div className="text-sm">
      <p>
        {student.civility === "M" ? "M." : "Mme"} {student.firstName} {student.lastName} — né(e) le {formatDate(student.birthDate)}
        {student.birthPlace && ` à ${student.birthPlace}`}
      </p>
      {student.address && (
        <p>
          {student.address}, {student.postalCode} {student.city}
        </p>
      )}
      <p>
        {student.phone ?? ""} {student.email ?? ""}
      </p>
      <p>
        Formation {TRAINING_TYPE_LABELS[student.trainingType]} — Permis {LICENSE_CATEGORY_LABELS[student.licenseCategory]} — NEPH{" "}
        {student.nephNumber ?? "—"}
      </p>
      <p>Solde d&apos;heures : {student.hoursBalance.toString()} h</p>
    </div>
  );
}

export default async function EleveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PermissionGate permission="students.view">
      <EleveDetailContent id={id} />
    </PermissionGate>
  );
}
