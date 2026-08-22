import Link from "next/link";
import { Building2, Users, History, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/server/auth/guards";

export const metadata = { title: "Paramètres" };

const SECTIONS = [
  {
    href: "/parametres/etablissements",
    label: "Établissements",
    description: "Créer, modifier et archiver les auto-écoles du groupe.",
    icon: Building2,
    permission: "organization.manage" as const,
  },
  {
    href: "/parametres/utilisateurs",
    label: "Utilisateurs",
    description: "Comptes, rôles et accès aux établissements.",
    icon: Users,
    permission: "users.manage" as const,
  },
  {
    href: "/parametres/journal-audit",
    label: "Journal d'audit",
    description: "Historique non modifiable des actions sensibles.",
    icon: History,
    permission: "audit.view" as const,
  },
];

export default async function ParametresPage() {
  const ctx = await requireUser();
  const visibleSections = SECTIONS.filter((s) => ctx.permissions.has(s.permission));

  return (
    <div>
      <PageHeader title="Paramètres" description="Configuration de l'organisation et des accès." />
      {visibleSections.length === 0 ? (
        <EmptyState title="Aucun paramètre accessible" description="Votre rôle ne donne accès à aucune section de paramétrage." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/40">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <section.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{section.label}</p>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
