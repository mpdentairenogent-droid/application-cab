import { Building2, Users, ShieldCheck, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/server/auth/guards";
import { getSelectedSchoolId } from "@/server/school-selection";
import { getDashboardOverview } from "@/server/services/dashboard.service";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { AUDIT_ACTION_LABELS, entityTypeLabel } from "@/lib/audit-labels";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const ctx = await requireUser();
  const selectedSchoolId = await getSelectedSchoolId(ctx);
  const overview = await getDashboardOverview(ctx, selectedSchoolId);

  const isConsolidated = selectedSchoolId === "all";

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={
          isConsolidated
            ? "Vue consolidée de tous vos établissements autorisés."
            : `Vue de l'établissement : ${overview.schools[0]?.name ?? ""}`
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto-écoles</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{overview.schoolCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{overview.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Répartition par rôle</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(Object.keys(overview.userCounts) as (keyof typeof overview.userCounts)[]).map((role) => (
              <Badge key={role} variant="secondary">
                {ROLE_LABELS[role]} · {overview.userCounts[role]}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Les indicateurs métier (élèves actifs, heures planifiées, paiements, examens, véhicules
          indisponibles, alertes...) s&apos;activeront ici au fur et à mesure de la livraison des phases
          suivantes du projet, avec des données réelles issues de la base — jamais de valeurs figées.
        </CardContent>
      </Card>

      {ctx.permissions.has("audit.view") && (
        <Card className="mt-4">
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.recentAuditEntries.length === 0 ? (
              <EmptyState title="Aucune activité récente" />
            ) : (
              <ul className="divide-y">
                {overview.recentAuditEntries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="font-medium">{AUDIT_ACTION_LABELS[entry.action]}</span>{" "}
                      <span className="text-muted-foreground">
                        · {entityTypeLabel(entry.entityType)}
                        {entry.drivingSchool ? ` · ${entry.drivingSchool.name}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
