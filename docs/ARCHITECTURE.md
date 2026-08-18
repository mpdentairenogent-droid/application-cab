# Décisions d'architecture

## Stack retenue

**React Native + Expo (SDK 52+, New Architecture) + Expo Router + TypeScript + Supabase (PostgreSQL + Auth + Storage + Realtime)**

- Web : export statique Expo Router (`expo export -p web`) pour la version navigateur (§80), depuis le **même** code — pas de projet Next.js séparé.
- Build & publication : EAS Build + EAS Submit (`eas build`, `eas submit`) → TestFlight / Play Console.
- Style : NativeWind (Tailwind → StyleSheet React Native, donc toujours du rendu natif, pas de CSS/WebView) + petite librairie de composants maison au-dessus, pour le design system du §7.
- État serveur : TanStack Query (cache, revalidation, état hors-connexion) au-dessus du client `@supabase/supabase-js`.

## Pourquoi pas Next.js + Capacitor

Capacitor encapsule une web app dans une WebView native : les plugins natifs (caméra, biométrie, notifications) fonctionnent, mais le **rendu** (scroll, clavier, gestes, animations, safe areas) reste celui d'un navigateur embarqué. Le cahier des charges est explicite sur ce point : §5 exige une expérience tactile réellement native (gestes, scroll, utilisation à une main), et §87 rejette explicitement un résultat "qui ressemble à un site desktop" ou une "simple WebView sans intégration mobile réelle" (§3). React Native rend de vraies vues natives (UIKit / Android View via Fabric) — c'est la seule des deux options qui satisfait cette exigence par construction, pas par effort supplémentaire.

## Pourquoi Expo (et pas React Native "bare")

- EAS Build : compilation iOS et Android dans le cloud, sans avoir besoin d'un Mac pour builder iOS — accélère directement la trajectoire TestFlight/App Store/Play Store du §69-73.
- Modules gérés déjà prêts pour tout le §4 (`expo-camera`, `expo-notifications`, `expo-local-authentication` pour Face ID/Touch ID/biométrie Android, `expo-secure-store` pour le stockage sécurisé via Keychain/Keystore, `expo-file-system`, `expo-sqlite` pour le cache hors-ligne).
- Expo Router = routing par fichiers partagé iOS/Android/Web, donc la version web du §80 vient quasi gratuitement du même code plutôt que d'un second projet à maintenir.
- "Config plugins" Expo permettent d'ajouter du code natif custom plus tard sans sortir de l'écosystème managé — donc pas de mur qui obligerait à réécrire l'app (contrainte du §2 et §69).

## Pourquoi Supabase

- PostgreSQL réel + Row Level Security natif → répond directement à l'exigence du §17 (sécurité appliquée côté base, pas seulement côté UI).
- Auth intégrée (JWT, sessions, refresh, "déconnexion de tous les appareils") → §18.
- Peut être hébergé en région UE (Frankfurt) → §59 (RGPD, hébergement UE privilégié).
- Storage intégré pour les pièces jointes (§55) avec policies RLS identiques au reste.

## Conséquences concrètes

- Toute donnée sensible (finances, permissions) est filtrée par policy RLS **en plus** d'être filtrée côté UI — l'UI ne fait que refléter ce que l'API autorise déjà.
- Un seul monorepo produit : app mobile, app web et (à terme) fonctions serveur (Supabase Edge Functions) partagent les mêmes types TypeScript générés depuis le schéma Postgres.
- Développement/test de la base sans Docker (non disponible sur ce poste) via `@electric-sql/pglite` (Postgres compilé en WASM) pour les tests automatisés de policies RLS (§75-76) ; connexion à un vrai projet Supabase hébergé dès que le client en crée un pour le dev/staging/prod (§73).
