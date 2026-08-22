"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Plus, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmActionButton } from "@/components/layout/confirm-action-button";
import { formatDate } from "@/lib/format";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/validations/document";
import { uploadStudentDocumentAction, archiveStudentDocumentAction, getStudentDocumentDownloadUrlAction } from "./actions";
import type { Document } from "@prisma/client";

export function DocumentsSection({
  studentId,
  documents,
  missingCategories,
  canManage,
}: {
  studentId: string;
  documents: Document[];
  missingCategories: string[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await uploadStudentDocumentAction(studentId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setOpen(false);
    });
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const handleDownload = (documentId: string) => {
    setDownloadingId(documentId);
    startTransition(async () => {
      try {
        const url = await getStudentDocumentDownloadUrlAction(documentId);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      } finally {
        setDownloadingId(null);
      }
    });
  };

  return (
    <div className="space-y-3">
      {missingCategories.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Pièces manquantes : {missingCategories.map((c) => DOCUMENT_CATEGORY_LABELS[c] ?? c).join(", ")}.
          </AlertDescription>
        </Alert>
      )}

      {canManage && (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajouter un document
        </Button>
      )}

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun document" description="Aucune pièce n'a encore été ajoutée à ce dossier." />
      ) : (
        <ul className="divide-y rounded-lg border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{doc.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category} · ajouté le {formatDate(doc.createdAt)}
                  {doc.expiresAt && <> · expire le {formatDate(doc.expiresAt)}</>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {doc.expiresAt && new Date(doc.expiresAt) < new Date() && <Badge variant="destructive">Expiré</Badge>}
                <Button variant="ghost" size="sm" disabled={downloadingId === doc.id} onClick={() => handleDownload(doc.id)}>
                  <Download className="h-4 w-4" />
                </Button>
                {canManage && (
                  <ConfirmActionButton
                    label="Archiver"
                    title="Archiver ce document ?"
                    description="Le document ne sera plus visible dans le dossier actif, mais reste conservé."
                    confirmLabel="Archiver"
                    destructive
                    action={() => archiveStudentDocumentAction(studentId, doc.id)}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Ajouter un document</SheetTitle>
          </SheetHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form ref={formRef} action={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Catégorie *</Label>
              <select id="category" name="category" required className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="file">Fichier * (PDF, JPEG, PNG ou WEBP, 10 Mo max)</Label>
              <Input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Date d&apos;expiration</Label>
              <Input id="expiresAt" name="expiresAt" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              Ajouter
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
