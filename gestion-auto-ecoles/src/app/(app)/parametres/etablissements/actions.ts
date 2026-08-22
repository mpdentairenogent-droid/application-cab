"use server";

import { revalidatePath } from "next/cache";
import { toActionResult } from "@/lib/action-result";
import type { DrivingSchoolInput } from "@/lib/validations/driving-school";
import { createSchool, updateSchool, archiveSchool, unarchiveSchool } from "@/server/services/driving-school.service";

export async function createSchoolAction(input: DrivingSchoolInput) {
  const result = await toActionResult(() => createSchool(input));
  if (!result.error) revalidatePath("/parametres/etablissements");
  return result;
}

export async function updateSchoolAction(id: string, input: DrivingSchoolInput) {
  const result = await toActionResult(() => updateSchool(id, input));
  if (!result.error) revalidatePath("/parametres/etablissements");
  return result;
}

export async function archiveSchoolAction(id: string) {
  const result = await toActionResult(() => archiveSchool(id));
  if (!result.error) revalidatePath("/parametres/etablissements");
  if (result.error) throw new Error(result.error);
}

export async function unarchiveSchoolAction(id: string) {
  const result = await toActionResult(() => unarchiveSchool(id));
  if (result.error) throw new Error(result.error);
  revalidatePath("/parametres/etablissements");
}
