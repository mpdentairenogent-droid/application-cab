import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PermissionGate } from "@/components/layout/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { listAuditLogs } from "@/server/services/audit-log.service";
import { listSchoolsForManagement } from "@/server/services/driving-school.service";
import { AUDIT_ACTION_LABELS, entityTypeLabel } from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/format";
import type { AuditAction } from "@prisma/client";

export const metadata = { title: "Journal d'audit" };

type SearchParams = { drivingSchoolId?: string; action?: string; from?: string; to?: string; page?: string };

function buildQuery(params: SearchParams, overrides: Partial<SearchParams>) {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) query.set(key, value);
  }
  return `?${query.toString()}`;
}

async function JournalAuditContent({ searchParams }: { searchParams: SearchParams }) {
  const schools = await listSchoolsForManagement();
  const page = Number(searchParams.page ?? "1") || 1;

  const { entries, total, pageCount } = await listAuditLogs({
    drivingSchoolId: searchParams.drivingSchoolId || undefined,
    action: (searchParams.action as AuditAction) || undefined,
    from: searchParams.from ? new Date(`${searchParams.from}T00:00:00`) : undefined,
    to: searchParams.to ? new Date(`${searchParams.to}T23:59:59`) : undefined,
    page,
  });

  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Établissement</label>
          <select
            name="drivingSchoolId"
            defaultValue={searchParams.drivingSchoolId ?? ""}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Tous</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Action</label>
          <select
            name="action"
            defaultValue={searchParams.action ?? ""}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Toutes</option>
            {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Du</label>
          <input
            type="date"
            name="from"
            defaultValue={searchParams.from ?? ""}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Au</label>
          <input
            type="date"
            name="to"
            defaultValue={searchParams.to ?? ""}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          />
        </div>
        <Button type="submit" size="sm">
          Filtrer
        </Button>
        {(searchParams.drivingSchoolId || searchParams.action || searchParams.from || searchParams.to) && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/parametres/journal-audit">Réinitialiser</Link>
          </Button>
        )}
      </form>

      {entries.length === 0 ? (
        <EmptyState title="Aucune entrée" description="Aucune action ne correspond à ces filtres." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Adresse IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</TableCell>
                  <TableCell>{entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={entry.action === "LOGIN_FAILED" ? "destructive" : "secondary"}>
                      {AUDIT_ACTION_LABELS[entry.action]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entityTypeLabel(entry.entityType)}
                    {entry.entityId && <span className="text-xs text-muted-foreground"> · {entry.entityId.slice(0, 8)}</span>}
                  </TableCell>
                  <TableCell>{entry.drivingSchool?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{entry.ipAddress ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{total} entrée(s) au total</span>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" disabled={page <= 1}>
                <Link href={buildQuery(searchParams, { page: String(page - 1) })} aria-disabled={page <= 1}>
                  Précédent
                </Link>
              </Button>
              <span className="flex items-center px-2">
                Page {page} / {pageCount}
              </span>
              <Button asChild variant="outline" size="sm" disabled={page >= pageCount}>
                <Link href={buildQuery(searchParams, { page: String(page + 1) })} aria-disabled={page >= pageCount}>
                  Suivant
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default async function JournalAuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  return (
    <div>
      <PageHeader
        title="Journal d'audit"
        description="Historique non modifiable des actions sensibles. Réservé au super-administrateur."
      />
      <PermissionGate permission="audit.view">
        <JournalAuditContent searchParams={resolvedSearchParams} />
      </PermissionGate>
    </div>
  );
}
