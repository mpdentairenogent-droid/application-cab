"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ConfirmActionButton } from "@/components/layout/confirm-action-button";
import { formatDate, formatCurrency } from "@/lib/format";
import { paymentSchema, type PaymentInput, PAYMENT_TYPE_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/validations/payment";
import { addStudentPaymentAction, cancelStudentPaymentAction } from "./actions";
import type { Payment } from "@prisma/client";

export function PaymentsSection({
  studentId,
  payments,
  summary,
  canManage,
}: {
  studentId: string;
  payments: Payment[];
  summary: { totalDueCents: number; totalPaidCents: number; balanceCents: number };
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { type: "PAIEMENT", method: "CB", paidAt: new Date().toISOString().slice(0, 10), serviceDescription: "" },
  });

  const onSubmit = (data: PaymentInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await addStudentPaymentAction(studentId, data);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      reset();
      setOpen(false);
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Dû</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.totalDueCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Réglé</p>
            <p className="text-lg font-semibold text-success">{formatCurrency(summary.totalPaidCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Solde</p>
            <p className={`text-lg font-semibold ${summary.balanceCents > 0 ? "text-warning" : "text-success"}`}>
              {formatCurrency(summary.balanceCents)}
            </p>
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajouter un paiement
        </Button>
      )}

      {payments.length === 0 ? (
        <EmptyState icon={Wallet} title="Aucun paiement" description="Aucun règlement n'a encore été enregistré." />
      ) : (
        <ul className="divide-y rounded-lg border">
          {payments.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {payment.serviceDescription} · {formatCurrency(payment.amountCents)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PAYMENT_TYPE_LABELS[payment.type]} · {PAYMENT_METHOD_LABELS[payment.method]} · {formatDate(payment.paidAt)}
                  {payment.reference && <> · réf. {payment.reference}</>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={payment.status === "ANNULE" ? "muted" : payment.status === "VALIDE" ? "success" : "warning"}>
                  {PAYMENT_STATUS_LABELS[payment.status]}
                </Badge>
                {canManage && payment.status === "VALIDE" && (
                  <ConfirmActionButton
                    label="Annuler"
                    title="Annuler ce paiement ?"
                    description="Le paiement reste dans l'historique mais n'est plus compté dans le solde. Cette action trace qui l'a annulé et quand."
                    confirmLabel="Annuler le paiement"
                    destructive
                    action={() => cancelStudentPaymentAction(studentId, payment.id)}
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
            <SheetTitle>Ajouter un paiement</SheetTitle>
          </SheetHeader>
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type *</Label>
              <select id="type" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("type")}>
                {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serviceDescription">Prestation *</Label>
              <Input id="serviceDescription" placeholder="Ex. Acompte formule B" {...register("serviceDescription")} />
              {errors.serviceDescription && <p className="text-xs text-destructive">{errors.serviceDescription.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Montant (€) *</Label>
                <Input id="amount" type="number" step="0.01" min="0.01" {...register("amount", { valueAsNumber: true })} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paidAt">Date *</Label>
                <Input id="paidAt" type="date" {...register("paidAt")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="method">Moyen de paiement *</Label>
              <select id="method" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("method")}>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" {...register("reference")} />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
