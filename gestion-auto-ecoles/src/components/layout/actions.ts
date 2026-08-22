"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/server/auth";
import { setSelectedSchoolIdCookie } from "@/server/school-selection";
import { requireUser } from "@/server/auth/guards";

export async function switchSchoolAction(formData: FormData) {
  const value = String(formData.get("schoolId") ?? "all");
  const ctx = await requireUser();
  if (value !== "all" && !ctx.isSuperAdmin && !ctx.schoolIds.has(value)) {
    throw new Error("Établissement non autorisé.");
  }
  await setSelectedSchoolIdCookie(value);
  redirect("/tableau-de-bord");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/connexion" });
}
