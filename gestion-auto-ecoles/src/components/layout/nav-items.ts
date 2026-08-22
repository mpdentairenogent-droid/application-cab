import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  ClipboardCheck,
  Users,
  CalendarClock,
  Car,
  Wallet,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";
import type { PermissionKey } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** null = visible pour tout utilisateur authentifié */
  permission: PermissionKey | null;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard, permission: null },
  { href: "/eleves", label: "Élèves", icon: GraduationCap, permission: "students.view" },
  { href: "/planning", label: "Planning", icon: CalendarDays, permission: "planning.view" },
  { href: "/examens", label: "Examens", icon: ClipboardCheck, permission: "exams.view" },
  { href: "/salaries", label: "Salariés", icon: Users, permission: "employees.view" },
  { href: "/conges", label: "Congés", icon: CalendarClock, permission: "leaves.view" },
  { href: "/vehicules", label: "Véhicules", icon: Car, permission: "vehicles.view" },
  { href: "/finances", label: "Finances", icon: Wallet, permission: "finance.view" },
  { href: "/documents", label: "Documents", icon: FileText, permission: "documents.view" },
  { href: "/rapports", label: "Rapports", icon: BarChart3, permission: "reports.view" },
  { href: "/parametres", label: "Paramètres", icon: Settings, permission: null },
];
