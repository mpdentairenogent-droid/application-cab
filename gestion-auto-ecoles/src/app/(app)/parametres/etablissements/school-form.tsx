"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { drivingSchoolSchema, type DrivingSchoolInput } from "@/lib/validations/driving-school";
import { createSchoolAction, updateSchoolAction } from "./actions";
import type { DrivingSchool } from "@prisma/client";

type SchoolFormValues = DrivingSchoolInput;

export function SchoolForm({ school, onSuccess }: { school?: DrivingSchool; onSuccess: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(drivingSchoolSchema),
    defaultValues: {
      name: school?.name ?? "",
      legalName: school?.legalName ?? "",
      siret: school?.siret ?? "",
      address: school?.address ?? "",
      postalCode: school?.postalCode ?? "",
      city: school?.city ?? "",
      phone: school?.phone ?? "",
      email: school?.email ?? "",
    },
  });

  const onSubmit = (data: SchoolFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = school ? await updateSchoolAction(school.id, data) : await createSchoolAction(data);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Nom de l&apos;établissement *</Label>
        <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="legalName">Raison sociale</Label>
        <Input id="legalName" {...register("legalName")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="siret">SIRET</Label>
        <Input id="siret" inputMode="numeric" placeholder="14 chiffres" {...register("siret")} />
        {errors.siret && <p className="text-xs text-destructive">{errors.siret.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Adresse</Label>
        <Input id="address" {...register("address")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="postalCode">Code postal</Label>
          <Input id="postalCode" inputMode="numeric" {...register("postalCode")} />
          {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" {...register("city")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" type="tel" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {school ? "Enregistrer les modifications" : "Créer l'établissement"}
      </Button>
    </form>
  );
}
