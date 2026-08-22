import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function AccessDenied() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="Accès refusé"
      description="Vous n'avez pas la permission d'accéder à cette page. Contactez un administrateur si vous pensez qu'il s'agit d'une erreur."
    />
  );
}
