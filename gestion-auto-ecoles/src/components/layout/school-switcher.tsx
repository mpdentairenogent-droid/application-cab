"use client";

import { useRef } from "react";
import { Building2 } from "lucide-react";
import { switchSchoolAction } from "./actions";

type School = { id: string; name: string };

export function SchoolSwitcher({
  schools,
  selectedSchoolId,
  canSeeConsolidated,
}: {
  schools: School[];
  selectedSchoolId: string;
  canSeeConsolidated: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  if (schools.length === 0) return null;

  // Un seul établissement autorisé et pas de vue consolidée pertinente : rien à sélectionner.
  const onlySchool = schools[0];
  if (schools.length === 1 && !canSeeConsolidated && onlySchool) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" aria-hidden />
        {onlySchool.name}
      </div>
    );
  }

  return (
    <form ref={formRef} action={switchSchoolAction} className="flex items-center gap-2">
      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <label htmlFor="schoolId" className="sr-only">
        Sélectionner un établissement
      </label>
      <select
        id="schoolId"
        name="schoolId"
        defaultValue={selectedSchoolId}
        onChange={() => formRef.current?.requestSubmit()}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {canSeeConsolidated && <option value="all">Toutes les auto-écoles</option>}
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name}
          </option>
        ))}
      </select>
    </form>
  );
}
