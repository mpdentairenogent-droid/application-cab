import { z } from "zod";

const passwordRules = z
  .string()
  .min(10, "Le mot de passe doit contenir au moins 10 caractères.")
  .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule.")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  firstName: z.string().trim().min(1, "Le prénom est obligatoire.").max(80),
  lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  roleId: z.string().min(1, "Le rôle est obligatoire."),
  drivingSchoolIds: z.array(z.string()),
  password: passwordRules,
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire.").max(80),
  lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  roleId: z.string().min(1, "Le rôle est obligatoire."),
  drivingSchoolIds: z.array(z.string()),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel obligatoire."),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, "Confirmation obligatoire."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "La confirmation ne correspond pas au nouveau mot de passe.",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
