"use client";

import { ConfirmActionButton } from "@/components/layout/confirm-action-button";
import { archiveStudentAction, unarchiveStudentAction } from "../actions";

// Composant client dédié : une Server Action référencée directement (import) peut être
// passée à un Client Component, mais une closure créée côté serveur (ex. () =>
// archiveStudentAction(id) écrite dans un Server Component) ne le peut pas. En créant la
// closure ici, côté client, la frontière Server -> Client n'est plus franchie par une
// fonction arbitraire.
export function StudentArchiveToggle({ studentId, archived, studentName }: { studentId: string; archived: boolean; studentName: string }) {
  if (archived) {
    return (
      <ConfirmActionButton
        label="Réactiver"
        title="Réactiver ce dossier élève ?"
        description={`${studentName} redeviendra actif.`}
        confirmLabel="Réactiver"
        action={() => unarchiveStudentAction(studentId)}
      />
    );
  }

  return (
    <ConfirmActionButton
      label="Archiver"
      title="Archiver ce dossier élève ?"
      description="Le dossier ne sera plus visible dans les listes actives, mais tout son historique (documents, paiements) est conservé. Cette action peut être annulée."
      confirmLabel="Archiver"
      destructive
      action={() => archiveStudentAction(studentId)}
    />
  );
}
