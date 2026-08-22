"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { studentSchema, type StudentInput, LICENSE_CATEGORY_LABELS, TRAINING_TYPE_LABELS, STUDENT_FILE_STATUS_LABELS, STUDENT_STATUS_LABELS } from "@/lib/validations/student";
import { createStudentAction, updateStudentAction } from "./actions";
import { Civility } from "@prisma/client";
import type { DrivingSchool, Employee, TrainingPackage, Student } from "@prisma/client";

type InstructorOption = Employee & { additionalSchools: { drivingSchoolId: string }[] };
// Decimal (Prisma) ne peut pas traverser la frontière Server -> Client Component : les
// pages appelantes convertissent hoursBalance/includedHours en number avant de les passer ici.
type SerializedStudent = Omit<Student, "hoursBalance"> & { hoursBalance: number };
type SerializedTrainingPackage = Omit<TrainingPackage, "includedHours"> & { includedHours: number };

function isMinor(birthDate: string | undefined): boolean {
  if (!birthDate) return false;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return false;
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  return dob > eighteenYearsAgo;
}

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function StudentForm({
  student,
  schools,
  instructors,
  packages,
}: {
  student?: SerializedStudent;
  schools: DrivingSchool[];
  instructors: InstructorOption[];
  packages: SerializedTrainingPackage[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StudentInput>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      drivingSchoolId: student?.drivingSchoolId ?? schools[0]?.id ?? "",
      civility: student?.civility ?? Civility.M,
      firstName: student?.firstName ?? "",
      lastName: student?.lastName ?? "",
      birthDate: toDateInputValue(student?.birthDate),
      birthPlace: student?.birthPlace ?? "",
      address: student?.address ?? "",
      postalCode: student?.postalCode ?? "",
      city: student?.city ?? "",
      phone: student?.phone ?? "",
      email: student?.email ?? "",
      legalGuardianName: student?.legalGuardianName ?? "",
      legalGuardianPhone: student?.legalGuardianPhone ?? "",
      legalGuardianEmail: student?.legalGuardianEmail ?? "",
      registeredAt: toDateInputValue(student?.registeredAt) || toDateInputValue(new Date()),
      trainingType: student?.trainingType ?? "TRADITIONNELLE",
      licenseCategory: student?.licenseCategory ?? "B",
      trainingPackageId: "",
      nephNumber: student?.nephNumber ?? "",
      fileStatus: student?.fileStatus ?? "INCOMPLET",
      referentInstructorId: student?.referentInstructorId ?? "",
      hoursBalance: student ? Number(student.hoursBalance) : 0,
      internalNotes: student?.internalNotes ?? "",
      gdprConsent: !!student?.gdprConsentAt,
      status: student?.status ?? "ACTIF",
    },
  });

  const selectedSchoolId = useWatch({ control, name: "drivingSchoolId" });
  const birthDate = useWatch({ control, name: "birthDate" });
  const showLegalGuardian = isMinor(birthDate);

  const filteredInstructors = useMemo(
    () =>
      instructors.filter(
        (i) => i.primaryDrivingSchoolId === selectedSchoolId || i.additionalSchools.some((a) => a.drivingSchoolId === selectedSchoolId),
      ),
    [instructors, selectedSchoolId],
  );
  const filteredPackages = useMemo(() => packages.filter((p) => p.drivingSchoolId === selectedSchoolId), [packages, selectedSchoolId]);

  const onSubmit = (data: StudentInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = student ? await updateStudentAction(student.id, data) : await createStudentAction(data);
      if (result.error) {
        setServerError(result.error);
        return;
      }
      router.push(`/eleves/${result.data!.id}`);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-3xl space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Identité</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="civility">Civilité *</Label>
            <select id="civility" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("civility")}>
              <option value="M">M.</option>
              <option value="MME">Mme</option>
            </select>
          </div>
          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label htmlFor="lastName">Nom *</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
          <div className="col-span-2 space-y-1.5 sm:col-span-1">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="birthDate">Date de naissance</Label>
            <Input id="birthDate" type="date" {...register("birthDate")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="birthPlace">Lieu de naissance</Label>
            <Input id="birthPlace" {...register("birthPlace")} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Coordonnées</h2>
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
      </section>

      {showLegalGuardian && (
        <>
          <Separator />
          <section className="space-y-4 rounded-lg border border-warning/30 bg-warning/5 p-4">
            <h2 className="text-sm font-semibold text-warning">Représentant légal (élève mineur)</h2>
            <div className="space-y-1.5">
              <Label htmlFor="legalGuardianName">Nom *</Label>
              <Input id="legalGuardianName" {...register("legalGuardianName")} />
              {errors.legalGuardianName && <p className="text-xs text-destructive">{errors.legalGuardianName.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="legalGuardianPhone">Téléphone</Label>
                <Input id="legalGuardianPhone" type="tel" {...register("legalGuardianPhone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legalGuardianEmail">E-mail</Label>
                <Input id="legalGuardianEmail" type="email" {...register("legalGuardianEmail")} />
                {errors.legalGuardianEmail && <p className="text-xs text-destructive">{errors.legalGuardianEmail.message}</p>}
              </div>
            </div>
          </section>
        </>
      )}

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Formation</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="drivingSchoolId">Établissement *</Label>
            <select id="drivingSchoolId" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("drivingSchoolId")}>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registeredAt">Date d&apos;inscription *</Label>
            <Input id="registeredAt" type="date" {...register("registeredAt")} />
            {errors.registeredAt && <p className="text-xs text-destructive">{errors.registeredAt.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="trainingType">Type de formation *</Label>
            <select id="trainingType" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("trainingType")}>
              {Object.entries(TRAINING_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="licenseCategory">Permis préparé *</Label>
            <select id="licenseCategory" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("licenseCategory")}>
              {Object.entries(LICENSE_CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        {!student && (
          <div className="space-y-1.5">
            <Label htmlFor="trainingPackageId">Formule choisie</Label>
            <select id="trainingPackageId" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("trainingPackageId")}>
              <option value="">Aucune (à définir plus tard)</option>
              {filteredPackages.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {(p.priceCents / 100).toFixed(2)} €</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="nephNumber">Numéro NEPH</Label>
            <Input id="nephNumber" inputMode="numeric" placeholder="12 chiffres" {...register("nephNumber")} />
            {errors.nephNumber && <p className="text-xs text-destructive">{errors.nephNumber.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="referentInstructorId">Moniteur référent</Label>
            <select id="referentInstructorId" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("referentInstructorId")}>
              <option value="">Aucun</option>
              {filteredInstructors.map((i) => (
                <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fileStatus">Statut du dossier *</Label>
            <select id="fileStatus" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("fileStatus")}>
              {Object.entries(STUDENT_FILE_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">État *</Label>
            <select id="status" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" {...register("status")}>
              {Object.entries(STUDENT_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hoursBalance">Solde d&apos;heures</Label>
            <Input id="hoursBalance" type="number" step="0.5" min="0" {...register("hoursBalance", { valueAsNumber: true })} />
            {errors.hoursBalance && <p className="text-xs text-destructive">{errors.hoursBalance.message}</p>}
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Remarques et RGPD</h2>
        <div className="space-y-1.5">
          <Label htmlFor="internalNotes">Remarques internes</Label>
          <textarea
            id="internalNotes"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            {...register("internalNotes")}
          />
        </div>
        <Controller
          control={control}
          name="gdprConsent"
          render={({ field }) => (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(!!v)} className="mt-0.5" />
              <span>
                L&apos;élève (ou son représentant légal) a été informé de l&apos;utilisation de ses données et y consent,
                conformément au RGPD.
              </span>
            </label>
          )}
        />
      </section>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {student ? "Enregistrer les modifications" : "Créer l'élève"}
      </Button>
    </form>
  );
}
