"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Car as CarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar({ permissions }: { permissions: string[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const permissionSet = new Set(permissions);

  const items = NAV_ITEMS.filter((item) => item.permission === null || permissionSet.has(item.permission));

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-card transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex h-14 items-center gap-2 border-b px-4", collapsed && "justify-center px-0")}>
        <CarIcon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        {!collapsed && <span className="truncate text-sm font-semibold">Gestion Auto-Écoles</span>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Navigation principale">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex h-10 items-center justify-center gap-2 border-t text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label={collapsed ? "Déplier la barre latérale" : "Réduire la barre latérale"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        {!collapsed && "Réduire"}
      </button>
    </aside>
  );
}
