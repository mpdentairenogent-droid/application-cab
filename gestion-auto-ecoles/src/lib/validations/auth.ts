import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "L'e-mail est obligatoire.").email("Adresse e-mail invalide."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

export type LoginInput = z.infer<typeof loginSchema>;
