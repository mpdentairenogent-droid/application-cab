"use server";

import { revalidatePath } from "next/cache";
import { toActionResult } from "@/lib/action-result";
import type { PaymentInput } from "@/lib/validations/payment";
import { uploadStudentDocument, archiveStudentDocument, getStudentDocumentDownloadUrl } from "@/server/services/document.service";
import { addStudentPayment, cancelStudentPayment } from "@/server/services/payment.service";

export async function uploadStudentDocumentAction(studentId: string, formData: FormData) {
  const result = await toActionResult(() => uploadStudentDocument(studentId, formData));
  if (!result.error) revalidatePath(`/eleves/${studentId}`);
  return result;
}

export async function archiveStudentDocumentAction(studentId: string, documentId: string) {
  const result = await toActionResult(() => archiveStudentDocument(documentId));
  if (result.error) throw new Error(result.error);
  revalidatePath(`/eleves/${studentId}`);
}

export async function getStudentDocumentDownloadUrlAction(documentId: string) {
  const result = await toActionResult(() => getStudentDocumentDownloadUrl(documentId));
  if (result.error) throw new Error(result.error);
  return result.data;
}

export async function addStudentPaymentAction(studentId: string, input: PaymentInput) {
  const result = await toActionResult(() => addStudentPayment(studentId, input));
  if (!result.error) revalidatePath(`/eleves/${studentId}`);
  return result;
}

export async function cancelStudentPaymentAction(studentId: string, paymentId: string) {
  const result = await toActionResult(() => cancelStudentPayment(paymentId));
  if (result.error) throw new Error(result.error);
  revalidatePath(`/eleves/${studentId}`);
}
