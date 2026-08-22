import type { UserContext } from "@/server/auth/guards";
import { listAccessibleSchools } from "@/server/services/driving-school.service";
import { getSelectedSchoolId } from "@/server/school-selection";
import { SchoolSwitcher } from "./school-switcher";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

export async function Header({ ctx }: { ctx: UserContext }) {
  const [schools, selectedSchoolId] = await Promise.all([
    listAccessibleSchools(ctx),
    getSelectedSchoolId(ctx),
  ]);

  const canSeeConsolidated = ctx.isSuperAdmin || schools.length > 1;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <MobileNav permissions={Array.from(ctx.permissions)} />
      <div className="flex flex-1 items-center justify-between gap-3">
        <SchoolSwitcher
          schools={schools.map((s) => ({ id: s.id, name: s.name }))}
          selectedSchoolId={selectedSchoolId}
          canSeeConsolidated={canSeeConsolidated}
        />
        <UserMenu fullName={ctx.fullName} email={ctx.email} roleKey={ctx.roleKey} />
      </div>
    </header>
  );
}
