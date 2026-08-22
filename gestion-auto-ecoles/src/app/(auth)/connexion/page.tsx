import type { Metadata } from "next";
import { Car } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

const DEMO_ACCOUNTS = [
  { email: "superadmin@demo.local", label: "Super-administrateur" },
  { email: "gerant1@demo.local", label: "Gérant / associé" },
  { email: "secretaire1@demo.local", label: "Secrétaire" },
  { email: "moniteur1@demo.local", label: "Moniteur" },
];

export default function LoginPage() {
  const showDemoHint = process.env.NODE_ENV !== "production";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-4">
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Car className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <CardTitle>Gestion Auto-Écoles</CardTitle>
            <CardDescription>Connectez-vous pour accéder à votre espace.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        {showDemoHint && (
          <Card className="border-dashed bg-background/60">
            <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Comptes de démonstration (environnement local uniquement)</p>
              <ul className="space-y-0.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.email} className="flex justify-between gap-2">
                    <span className="font-mono">{account.email}</span>
                    <span>{account.label}</span>
                  </li>
                ))}
              </ul>
              <p>Mot de passe commun : voir SEED_DEMO_PASSWORD dans .env (par défaut Demo1234!).</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
