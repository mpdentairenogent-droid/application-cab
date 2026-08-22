import { ZodError } from "zod";
import { ValidationError } from "@/server/errors";
import { ForbiddenError, UnauthorizedError } from "@/server/auth/guards";

export type ActionResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

/**
 * Convertit les erreurs "attendues" (validation, permissions) en résultat sérialisable
 * affichable côté client. Les erreurs inattendues sont relancées : Next.js les remplace
 * par un message générique côté client (comportement voulu, on ne fuite pas les détails
 * internes d'une erreur non anticipée).
 */
export async function toActionResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { data: await fn() };
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      return { error: error.message };
    }
    if (error instanceof ZodError) {
      return { error: error.issues[0]?.message ?? "Données invalides." };
    }
    throw error;
  }
}
