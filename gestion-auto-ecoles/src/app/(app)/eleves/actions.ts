"use server";

import { revalidatePath } from "next/cache";
import { toActionResult } from "@/lib/action-result";
import type { StudentInput } from "@/lib/validations/student";
import { createStudent, updateStudent, archiveStudent, unarchiveStudent } from "@/server/services/student.service";

export async function createStudentAction(input: StudentInput) {
  const result = await toActionResult(async () => {
    const student = await createStudent(input);
    return { id: student.id };
  });
  if (!result.error) revalidatePath("/eleves");
  return result;
}

export async function updateStudentAction(id: string, input: StudentInput) {
  const result = await toActionResult(async () => {
    const student = await updateStudent(id, input);
    return { id: student.id };
  });
  if (!result.error) {
    revalidatePath("/eleves");
    revalidatePath(`/eleves/${id}`);
  }
  return result;
}

export async function archiveStudentAction(id: string) {
  const result = await toActionResult(() => archiveStudent(id));
  if (result.error) throw new Error(result.error);
  revalidatePath("/eleves");
  revalidatePath(`/eleves/${id}`);
}

export async function unarchiveStudentAction(id: string) {
  const result = await toActionResult(() => unarchiveStudent(id));
  if (result.error) throw new Error(result.error);
  revalidatePath("/eleves");
  revalidatePath(`/eleves/${id}`);
}
