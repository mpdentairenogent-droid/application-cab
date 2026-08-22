"use server";

import { revalidatePath } from "next/cache";
import { toActionResult } from "@/lib/action-result";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";
import { createUser, updateUser, archiveUser, unarchiveUser } from "@/server/services/user.service";

export async function createUserAction(input: CreateUserInput) {
  const result = await toActionResult(async () => {
    const user = await createUser(input);
    return { id: user.id };
  });
  if (!result.error) revalidatePath("/parametres/utilisateurs");
  return result;
}

export async function updateUserAction(id: string, input: UpdateUserInput) {
  const result = await toActionResult(async () => {
    const user = await updateUser(id, input);
    return { id: user.id };
  });
  if (!result.error) revalidatePath("/parametres/utilisateurs");
  return result;
}

export async function archiveUserAction(id: string) {
  const result = await toActionResult(() => archiveUser(id));
  if (result.error) throw new Error(result.error);
  revalidatePath("/parametres/utilisateurs");
}

export async function unarchiveUserAction(id: string) {
  const result = await toActionResult(() => unarchiveUser(id));
  if (result.error) throw new Error(result.error);
  revalidatePath("/parametres/utilisateurs");
}
