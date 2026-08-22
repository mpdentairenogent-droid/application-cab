"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmActionButton } from "@/components/layout/confirm-action-button";
import { CreateUserForm, EditUserForm } from "./user-form";
import { archiveUserAction, unarchiveUserAction } from "./actions";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@prisma/client";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleId: string;
  status: "ACTIF" | "SUSPENDU" | "ARCHIVE";
  archivedAt: Date | null;
  role: Role;
  drivingSchoolAccess: { drivingSchool: { id: string; name: string } }[];
};

export function UsersTable({
  users,
  roles,
  schools,
  currentUserId,
}: {
  users: UserRow[];
  roles: Role[];
  schools: { id: string; name: string }[];
  currentUserId: string;
}) {
  const [sheetState, setSheetState] = useState<{ open: boolean; user?: UserRow }>({ open: false });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setSheetState({ open: true, user: undefined })}>
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Établissements</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.firstName} {user.lastName}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>{ROLE_LABELS[user.role.key]}</TableCell>
              <TableCell>
                {user.role.key === "SUPER_ADMIN" ? (
                  <span className="text-xs text-muted-foreground">Toutes</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {user.drivingSchoolAccess.map((a) => (
                      <Badge key={a.drivingSchool.id} variant="outline">
                        {a.drivingSchool.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {user.archivedAt ? (
                  <Badge variant="muted">Archivé</Badge>
                ) : user.status === "SUSPENDU" ? (
                  <Badge variant="warning">Suspendu</Badge>
                ) : (
                  <Badge variant="success">Actif</Badge>
                )}
              </TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSheetState({ open: true, user })}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
                {user.id !== currentUserId &&
                  (user.archivedAt ? (
                    <ConfirmActionButton
                      label="Réactiver"
                      title="Réactiver ce compte ?"
                      description={`${user.firstName} ${user.lastName} pourra de nouveau se connecter.`}
                      confirmLabel="Réactiver"
                      action={() => unarchiveUserAction(user.id)}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Archiver"
                      title="Archiver ce compte ?"
                      description={`${user.firstName} ${user.lastName} ne pourra plus se connecter. L'historique de ses actions est conservé. Cette action peut être annulée.`}
                      confirmLabel="Archiver"
                      destructive
                      action={() => archiveUserAction(user.id)}
                    />
                  ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={sheetState.open} onOpenChange={(open) => setSheetState((s) => ({ ...s, open }))}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{sheetState.user ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto pr-1">
            {sheetState.user ? (
              <EditUserForm
                key={sheetState.user.id}
                user={{
                  id: sheetState.user.id,
                  firstName: sheetState.user.firstName,
                  lastName: sheetState.user.lastName,
                  phone: sheetState.user.phone,
                  roleId: sheetState.user.roleId,
                  drivingSchoolIds: sheetState.user.drivingSchoolAccess.map((a) => a.drivingSchool.id),
                }}
                roles={roles}
                schools={schools}
                onSuccess={() => setSheetState({ open: false })}
              />
            ) : (
              <CreateUserForm key="new" roles={roles} schools={schools} onSuccess={() => setSheetState({ open: false })} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
