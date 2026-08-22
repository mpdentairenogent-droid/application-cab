import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gestion Auto-Écoles",
    template: "%s · Gestion Auto-Écoles",
  },
  description: "Plateforme de gestion administrative, pédagogique, financière et automobile pour un groupe d'auto-écoles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
