"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "@/lib/validations/user";
import { createUserAction, updateUserAction } from "./actions";
import type { GlobalRoleKey, Role } from "@prisma/client";

type School = { id: string; name: string };

function SchoolCheckboxList({
  schools,
  roleKey,
  value,
  onChange,
}: {
  schools: School[];
  roleKey: GlobalRoleKey | undefined;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  if (roleKey === "SUPER_ADMIN") {
    return <p className="text-xs text-muted-foreground">Un super-administrateur a automatiquement accès à tous les établissements.</p>;
  }
  return (
    <div className="space-y-2">
      {schools.map((school) => {
        const checked = value.includes(school.id);
        return (
          <label key={school.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={checked}
              onCheckedChange={(v) => onChange(v ? [...value, school.id] : value.filter((id) => id !== school.id))}
            />
            {school.name}
          </label>
        );
      })}
    </div>
  );
}

export function CreateUserForm({
  roles,
  schools,
  onSuccess,
}: {
  roles: Role[];
  schools: School[];
  onSuccess: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { drivingSchoolIds: [], roleId: roles[0]?.id ?? "" },
  });
  const currentRoleId = useWatch({ control, name: "roleId" });
  const selectedRole = roles.find((r) => r.id === currentRoleId);

  const onSubmit = (data: CreateUserInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await createUserAction(data);
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input id="firstName" {...register("firstName")} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Nom *</Label>
          <Input id="lastName" {...register("lastName")} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail *</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" type="tel" {...register("phone")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="roleId">Rôle *</Label>
        <select id="roleId" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm" {...register("roleId")}>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Établissements autorisés</Label>
        <Controller
          control={control}
          name="drivingSchoolIds"
          render={({ field }) => (
            <SchoolCheckboxList schools={schools} roleKey={selectedRole?.key} value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.drivingSchoolIds && <p className="text-xs text-destructive">{errors.drivingSchoolIds.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Mot de passe initial *</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        <p className="text-xs text-muted-foreground">
          Communiquez-le à l&apos;utilisateur par un canal sûr. Il devra le changer à sa prochaine connexion.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Créer l&apos;utilisateur
      </Button>
    </form>
  );
}

export function EditUserForm({
  user,
  roles,
  schools,
  onSuccess,
}: {
  user: { id: string; firstName: string; lastName: string; phone: string | null; roleId: string; drivingSchoolIds: string[] };
  roles: Role[];
  schools: School[];
  onSuccess: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      roleId: user.roleId,
      drivingSchoolIds: user.drivingSchoolIds,
    },
  });
  const currentRoleId = useWatch({ control, name: "roleId" });
  const selectedRole = roles.find((r) => r.id === currentRoleId);

  const onSubmit = (data: UpdateUserInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await updateUserAction(user.id, data);
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input id="firstName" {...register("firstName")} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Nom *</Label>
          <Input id="lastName" {...register("lastName")} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" type="tel" {...register("phone")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="roleId">Rôle *</Label>
        <select id="roleId" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm" {...register("roleId")}>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label>Établissements autorisés</Label>
        <Controller
          control={control}
          name="drivingSchoolIds"
          render={({ field }) => (
            <SchoolCheckboxList schools={schools} roleKey={selectedRole?.key} value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.drivingSchoolIds && <p className="text-xs text-destructive">{errors.drivingSchoolIds.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Enregistrer les modifications
      </Button>
    </form>
  );
}
