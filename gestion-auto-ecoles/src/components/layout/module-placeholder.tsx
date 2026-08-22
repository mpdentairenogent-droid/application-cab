import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "./page-header";

export function ModulePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title={`Module prévu en ${phase}`}
        description="L'accès et les permissions sont déjà actifs ; les fonctionnalités de ce module arrivent dans une phase suivante du développement (voir docs/CONTEXTE_PROJET.md)."
      />
    </>
  );
}
