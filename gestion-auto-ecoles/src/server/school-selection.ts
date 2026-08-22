import "server-only";
import { cookies } from "next/headers";
import type { UserContext } from "./auth/guards";

const COOKIE_NAME = "selectedSchoolId";
export const CONSOLIDATED_VIEW = "all" as const;

/** Établissement actuellement sélectionné dans le sélecteur, ou "all" pour la vue consolidée. */
export async function getSelectedSchoolId(ctx: UserContext): Promise<string | typeof CONSOLIDATED_VIEW> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw || raw === CONSOLIDATED_VIEW) return CONSOLIDATED_VIEW;
  if (ctx.isSuperAdmin || ctx.schoolIds.has(raw)) return raw;
  return CONSOLIDATED_VIEW;
}

export async function setSelectedSchoolIdCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
