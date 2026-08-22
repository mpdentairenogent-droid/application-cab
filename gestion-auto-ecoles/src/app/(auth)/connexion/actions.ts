"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/server/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export async function loginAction(input: LoginInput): Promise<{ error: string } | void> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Identifiants invalides." };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "E-mail ou mot de passe incorrect, ou compte temporairement verrouillé." };
    }
    throw error;
  }

  redirect("/tableau-de-bord");
}
