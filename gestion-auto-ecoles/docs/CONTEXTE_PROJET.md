# Contexte du projet — état d'avancement

_Dernière mise à jour : 2026-08-22. À tenir à jour à chaque étape importante — ce fichier existe
pour reprendre le projet sur n'importe quelle machine ou session sans reperdre le contexte
accumulé en cours de route. Pour le détail des décisions produit/architecture initiales, voir le
README (sections Stack technique, Architecture, Rôles et permissions)._

## Où en est le projet

**Phases 1 (fondations) et 2 (élèves) livrées et fonctionnelles.**

- **Phase 1** : architecture, schéma de données complet (toutes les entités prévues pour les
  7 phases), authentification, établissements, utilisateurs/rôles/permissions, mise en page
  principale, journal d'audit.
- **Phase 2** : fiche élève complète (dont représentant légal si mineur), liste avec recherche/
  filtres/pagination/export CSV, documents (upload, catégories, pièces manquantes, URL signée,
  archivage), paiements (partiels, remboursements/avoirs non destructifs), fiche imprimable,
  archivage/réactivation. Services : `student.service.ts`, `document.service.ts`,
  `payment.service.ts`, `storage.ts` (S3/MinIO).

Détail dans le README, section "État d'avancement / phases".

**Repo** : `mpdentairenogent-droid/application-cab`, branche `claude/driving-schools-management-app-eiai22`.
Projet dans le sous-dossier `gestion-auto-ecoles/` — le reste du dépôt (racine) est une application
de gestion de cabinet dentaire sans rapport, livrée séparément, à ne jamais toucher depuis ce projet.

## Décisions prises en cours de route (au-delà du README)

- **Prisma 7** a changé la configuration du datasource : `url` n'est plus accepté dans
  `datasource db {}` du `schema.prisma`. La connexion CLI (migrate/studio) vient de
  `prisma.config.ts` (`defineConfig({ datasource: { url: env("DATABASE_URL") } })`), chargé avec
  `import "dotenv/config"` en tête (le CLI Prisma 7 ne charge plus `.env` automatiquement). La
  connexion applicative passe par un driver adapter (`@prisma/adapter-pg` + `pg`), voir
  `src/server/db.ts` : `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`.
- **Next.js 16** a renommé "Middleware" en "Proxy" (fichier `src/proxy.ts`, export nommé `proxy`
  au lieu de `middleware`). Le Proxy tourne par défaut en runtime Node.js (plus besoin de séparer
  une config edge-safe pour l'auth). Toujours vérifier `node_modules/next/dist/docs/` en cas de
  comportement inattendu avec cette version — le fichier `AGENTS.md` généré par `next dev` le
  rappelle explicitement.
- **`DateTime` Prisma sur PostgreSQL est `timestamp` SANS fuseau horaire par défaut.** Tous les
  champs DateTime représentant un instant réel sont explicitement annotés `@db.Timestamptz(3)`
  dans `schema.prisma` (seule exception : `Timesheet.date`, une date calendaire pure en `@db.Date`).
  Ne jamais ajouter un champ DateTime sans cette annotation.
- **Anti-double-réservation moniteur/véhicule** : contrainte d'exclusion PostgreSQL
  (`EXCLUDE USING gist`, extension `btree_gist`) sur `Lesson`, ajoutée en SQL brut dans la
  migration `20260822160731_add_lesson_no_overlap_constraints` (Prisma ne sait pas exprimer ça
  nativement). C'est la garantie ultime, en plus (pas à la place) du contrôle applicatif à écrire
  avec le module Planning (Phase 3).
- **next-auth v5 (beta)** : le callback `session({ session, token })` a un type `token` interne
  (intersection de types selon la stratégie jwt/database) sur lequel TypeScript résout mal les
  champs custom malgré l'augmentation de `JWT` dans `src/server/auth/types.d.ts`. Contournement
  documenté directement dans `src/server/auth/index.ts` (cast explicite, pas un bug de logique).
- **`StudentDocument`** du cahier des charges n'est pas une table séparée : `Document` (générique,
  avec `studentId` optionnel) sert pour tous les types de pièces jointes, pour ne pas dupliquer la
  plomberie fichier (storageKey, URL signée...).
- **Un `Decimal` Prisma (`Student.hoursBalance`, `TrainingPackage.includedHours`) ne peut pas
  traverser la frontière Server -> Client Component** : erreur runtime "Only plain objects can be
  passed to Client Components". Toujours convertir en `number` (`Number(valeur)`) dans le Server
  Component juste avant de passer la prop, jamais plus profond côté client.
- **Une closure créée dans un Server Component ne peut pas être passée en prop à un Client
  Component** (`action={() => maServerAction(id)}` écrit directement dans une page serveur ⇒
  erreur runtime). Une Server Action référencée directement (import, sans wrapper) peut l'être ;
  dès qu'on a besoin de lui fournir un argument capturé, il faut créer la closure dans un petit
  composant `"use client"` dédié (voir `src/app/(app)/eleves/[id]/archive-toggle.tsx`).
- **Zod `.default(...)` et `z.coerce.number()` cassent le typage TS de `zodResolver`** (le type
  d'entrée du schéma devient différent du type de sortie, incompatible avec `useForm<T>()` où `T`
  est le type de sortie). Ne pas utiliser `.default()`/`.coerce` dans un schéma consommé par
  `zodResolver` : donner les valeurs par défaut via `defaultValues` dans `useForm`, et convertir
  les champs numériques avec `register(champ, { valueAsNumber: true })`.
- **`watch()` de react-hook-form déclenche un warning ESLint react-compiler** (retour non
  mémoïsable). Utiliser `useWatch({ control, name })` à la place partout où une valeur de
  formulaire doit être lue de façon réactive (voir `student-form.tsx`).

## Pièges déjà rencontrés — à ne pas re-découvrir à la dure

- **`pkill -f "next dev"` ne trouve pas le process réel** : le serveur Next.js tourne sous le nom
  `next-server (v...)`, pas `next dev` (qui n'est que le wrapper `npm run` initial). Pour arrêter
  proprement : `ps aux | grep next-server` puis `kill <pid>`.
- **Vite/Vitest et `resolve.tsconfigPaths: true` (résolveur natif)** remontent l'arborescence et
  peuvent tomber sur un `tsconfig.json` d'un autre projet à la racine du dépôt. Le plugin
  `vite-tsconfig-paths` avec `root: __dirname` explicite est plus robuste dans ce monorepo — voir
  `vitest.config.ts`.
- **Playwright dans un environnement sandbox avec une version de Chromium préinstallée
  différente** de celle attendue par `@playwright/test` : ne jamais coder en dur un chemin
  d'exécutable sandbox-spécifique dans `playwright.config.ts` (ça casserait l'exécution pour un
  vrai utilisateur après `npx playwright install`) — utiliser la variable d'environnement
  optionnelle `PLAYWRIGHT_TEST_CHROMIUM_PATH`, non définie par défaut. Dans ce sandbox précis,
  la commande était : `PLAYWRIGHT_TEST_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
  npx playwright test` (le numéro de build peut changer — vérifier avec
  `find /opt/pw-browsers -iname "*chrome*" -type f`).
- **`prisma migrate reset` est bloqué par un garde-fou intégré à Prisma** dès qu'il détecte être
  invoqué par un agent IA : il exige un consentement explicite et immédiat de l'utilisateur (pas
  déduit d'une instruction générale antérieure), sans quoi la commande s'arrête d'elle-même avant
  toute suppression. Pour nettoyer des données de test locales sans déclencher ce garde-fou (et
  sans avoir à interrompre la tâche pour demander confirmation) : supprimer précisément les lignes
  créées pendant le test (filtrer par un nom/identifiant reconnaissable), jamais réinitialiser
  toute la base pour ce genre de nettoyage cosmétique.

## Déploiement de démonstration

Pour permettre un test interactif sans environnement de développement local (ex. utilisateur sur
mobile), un déploiement de démonstration a été mis en place :

- **Hébergement** : Vercel (import direct du dépôt GitHub, racine du projet = `gestion-auto-ecoles`).
- **Base de données** : PostgreSQL managé (voir `DATABASE_URL` dans les variables d'environnement
  Vercel du projet — jamais committée).
- **Build** : `vercel-build` (voir `package.json`) applique les migrations (`prisma migrate
  deploy`) puis exécute le seed de démonstration à chaque déploiement (idempotent), uniquement
  parce que `ALLOW_DEMO_SEED_IN_PRODUCTION=true` est défini pour CE déploiement précis.
- **⚠️ Ce déploiement est un environnement de démonstration/test, pas une mise en production
  réelle** : comptes de démonstration à mot de passe connu, URL non indexée mais pas privée.
  Ne jamais y saisir de vraies données personnelles. Voir "À faire avant une mise en production
  réelle" dans le README avant tout usage réel.
- URL : à compléter ici une fois le déploiement confirmé.

## Prochaines étapes prévues

Phase 3 (salariés, congés, planning/leçons, détection de conflits) — voir le plan de phases dans
le README.
