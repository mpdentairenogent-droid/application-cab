# Contexte du projet — état d'avancement

_Dernière mise à jour : 2026-08-22. À tenir à jour à chaque étape importante — ce fichier existe
pour reprendre le projet sur n'importe quelle machine ou session sans reperdre le contexte
accumulé en cours de route. Pour le détail des décisions produit/architecture initiales, voir le
README (sections Stack technique, Architecture, Rôles et permissions)._

## Où en est le projet

**Phase 1 (fondations) livrée et fonctionnelle** : architecture, schéma de données complet
(toutes les entités prévues pour les 7 phases), authentification, établissements, utilisateurs/
rôles/permissions, mise en page principale, journal d'audit. Détail dans le README, section
"État d'avancement / phases".

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
  optionnelle `PLAYWRIGHT_TEST_CHROMIUM_PATH`, non définie par défaut.

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

Phase 2 (élèves, documents, paiements, recherche/filtres) — voir le plan de phases dans le README.
