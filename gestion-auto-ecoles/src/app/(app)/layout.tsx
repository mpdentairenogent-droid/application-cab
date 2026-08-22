import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/server/auth/guards";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Le middleware protège déjà ces routes, mais on revérifie ici (défense en
  // profondeur) : jamais confiance dans un seul point de contrôle.
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/connexion");

  return (
    <div className="flex min-h-dvh">
      <Sidebar permissions={Array.from(ctx.permissions)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header ctx={ctx} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
