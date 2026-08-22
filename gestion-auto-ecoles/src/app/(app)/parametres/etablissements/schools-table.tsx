"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmActionButton } from "@/components/layout/confirm-action-button";
import { SchoolForm } from "./school-form";
import { archiveSchoolAction, unarchiveSchoolAction } from "./actions";
import type { DrivingSchool } from "@prisma/client";

export function SchoolsTable({ schools }: { schools: DrivingSchool[] }) {
  const [sheetState, setSheetState] = useState<{ open: boolean; school?: DrivingSchool }>({ open: false });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setSheetState({ open: true, school: undefined })}>
          <Plus className="h-4 w-4" />
          Nouvel établissement
        </Button>
      </div>

      {schools.length === 0 ? (
        <EmptyState title="Aucun établissement" description="Créez le premier établissement du groupe." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>{school.city ?? "—"}</TableCell>
                <TableCell>{school.phone ?? "—"}</TableCell>
                <TableCell>
                  {school.archivedAt ? (
                    <Badge variant="muted">Archivé</Badge>
                  ) : (
                    <Badge variant="success">Actif</Badge>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSheetState({ open: true, school })}>
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                  {school.archivedAt ? (
                    <ConfirmActionButton
                      label="Réactiver"
                      title="Réactiver cet établissement ?"
                      description={`« ${school.name} » redeviendra visible et sélectionnable dans l'application.`}
                      confirmLabel="Réactiver"
                      action={() => unarchiveSchoolAction(school.id)}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Archiver"
                      title="Archiver cet établissement ?"
                      description={`« ${school.name} » ne sera plus sélectionnable pour de nouvelles opérations, mais son historique est conservé. Cette action peut être annulée en réactivant l'établissement.`}
                      confirmLabel="Archiver"
                      destructive
                      action={() => archiveSchoolAction(school.id)}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Sheet open={sheetState.open} onOpenChange={(open) => setSheetState((s) => ({ ...s, open }))}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{sheetState.school ? "Modifier l'établissement" : "Nouvel établissement"}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto pr-1">
            <SchoolForm
              key={sheetState.school?.id ?? "new"}
              school={sheetState.school ?? undefined}
              onSuccess={() => setSheetState({ open: false })}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
