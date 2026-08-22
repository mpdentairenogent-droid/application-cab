# Gestion Auto-Écoles

Application web de gestion administrative, pédagogique, financière, sociale et automobile
pour un groupe de plusieurs auto-écoles françaises. Tableau de bord unique multi-établissements,
avec séparation des données et des permissions par rôle et par établissement.

> **État du projet : Phase 1 (fondations) livrée et fonctionnelle.** Voir [État d'avancement](#état-davancement--phases)
> pour le détail de ce qui est déjà utilisable et de ce qui reste à construire.

## Sommaire

- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Déploiement de démonstration](#déploiement-de-démonstration)
- [Scripts disponibles](#scripts-disponibles)
- [Architecture du projet](#architecture-du-projet)
- [Rôles et permissions](#rôles-et-permissions)
- [Sécurité et RGPD](#sécurité-et-rgpd)
- [Sauvegardes](#sauvegardes)
- [Tests](#tests)
- [État d'avancement / phases](#état-davancement--phases)
- [À faire avant une mise en production réelle](#à-faire-avant-une-mise-en-production-réelle)

## Stack technique

- **Next.js 16** (App Router) + **TypeScript** strict
- **PostgreSQL** + **Prisma 7** (schéma relationnel complet, migrations versionnées)
- **Auth.js v5** (identifiants + mot de passe haché bcrypt, sessions JWT, verrouillage après échecs)
- **Tailwind CSS** + composants maison au pattern **shadcn/ui** (Radix UI)
- **React Hook Form** + **Zod** (validation partagée client/serveur)
- **MinIO** (stockage S3-compatible en local) + `@aws-sdk/client-s3` (URLs signées, jamais de document public)
- **Vitest** (tests unitaires/intégration) + **Playwright** (tests bout-en-bout)
- **Docker Compose** (PostgreSQL + MinIO en local)

Voir la synthèse d'architecture complète (schéma de données, règles métier, choix techniques)
dans l'historique de conversation du projet ; les décisions structurantes sont aussi commentées
directement dans le code (`prisma/schema.prisma`, `src/server/**`).

## Démarrage rapide

### Prérequis

- Node.js ≥ 20
- Docker et Docker Compose

### Installation

```bash
cd gestion-auto-ecoles

# 1. Dépendances
npm install

# 2. Base de données et stockage documents (Postgres + MinIO)
docker compose up -d

# 3. Variables d'environnement
cp .env.example .env
# Ouvrir .env et renseigner AUTH_SECRET (voir commande suggérée dans le fichier).
# Les autres valeurs par défaut correspondent à docker-compose.yml, rien d'autre à changer en local.

# 4. Migrations de base de données
npm run db:migrate

# 5. Données de démonstration (organisation, 3 auto-écoles, comptes de démonstration)
npm run db:seed

# 6. Lancement
npm run dev
```

L'application est disponible sur **http://localhost:3000** (redirige automatiquement vers la
page de connexion). La console MinIO est disponible sur http://localhost:9001 (identifiants dans
`docker-compose.yml`).

### Vérifications

```bash
npm run typecheck   # TypeScript strict, sans erreur
npm run lint        # ESLint (config Next.js)
npm test            # Tests unitaires/intégration (Vitest)
npm run test:e2e    # Tests bout-en-bout (Playwright, nécessite npx playwright install une première fois)
```

## Comptes de démonstration

Créés par `npm run db:seed`, **uniquement en local** (le script refuse de s'exécuter si
`NODE_ENV=production`). Mot de passe commun : celui défini par `SEED_DEMO_PASSWORD` dans `.env`
(`Demo1234!` par défaut).

| E-mail                   | Rôle                  | Établissement(s)                    |
| ------------------------ | --------------------- | ------------------------------------ |
| `superadmin@demo.local`  | Super-administrateur  | Les trois                            |
| `gerant1@demo.local`     | Gérant / associé      | Les trois                            |
| `gerant2@demo.local`     | Gérant / associé      | Les trois                            |
| `gerant3@demo.local`     | Gérant / associé      | Les trois                            |
| `secretaire1@demo.local` | Secrétaire            | Auto-École Gambetta                  |
| `secretaire2@demo.local` | Secrétaire            | Nogent Centre + République           |
| `moniteur1@demo.local`   | Moniteur              | Auto-École Gambetta                  |
| `moniteur2@demo.local`   | Monitrice             | Gambetta + Nogent Centre             |
| `moniteur3@demo.local`   | Moniteur              | Nogent Centre                        |
| `moniteur4@demo.local`   | Monitrice             | République                           |

Les noms d'établissements et de personnes sont des données fictives de démonstration.

## Déploiement de démonstration

Pour tester l'application sans environnement de développement local (ex. depuis un mobile), elle
peut être déployée sur Vercel avec une base PostgreSQL managée :

1. Importer le dépôt GitHub dans Vercel, en réglant le **répertoire racine du projet** sur
   `gestion-auto-ecoles`.
2. Créer une base PostgreSQL managée (ex. via l'onglet Storage de Vercel) et définir la variable
   d'environnement `DATABASE_URL` du projet avec la chaîne de connexion obtenue.
3. Définir `AUTH_SECRET` (valeur aléatoire forte) et `ALLOW_DEMO_SEED_IN_PRODUCTION=true`.
4. Déployer : le script `vercel-build` (voir `package.json`) applique automatiquement les
   migrations et charge les données de démonstration à chaque déploiement.

**⚠️ Un déploiement ainsi configuré est un environnement de démonstration/test, pas une mise en
production réelle** : il contient des comptes à mot de passe connu (voir
[Comptes de démonstration](#comptes-de-démonstration)) et son URL, bien que non répertoriée
publiquement, n'est pas privée. Ne jamais y saisir de vraies données personnelles, et retirer
`ALLOW_DEMO_SEED_IN_PRODUCTION` avant tout usage réel — voir
[À faire avant une mise en production réelle](#à-faire-avant-une-mise-en-production-réelle).
Détails opérationnels du déploiement en cours : `docs/CONTEXTE_PROJET.md`.

## Scripts disponibles

| Commande              | Effet                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Serveur de développement (Turbopack)                              |
| `npm run build`         | Build de production                                                |
| `npm run start`         | Démarre le build de production                                     |
| `npm run typecheck`     | Vérification TypeScript stricte, sans émission                     |
| `npm run lint`          | ESLint                                                              |
| `npm run db:migrate`    | Applique/crée les migrations Prisma (développement)                |
| `npm run db:generate`   | Régénère le client Prisma                                          |
| `npm run db:seed`       | Charge les données de démonstration                                |
| `npm run db:studio`     | Interface d'administration Prisma Studio                           |
| `npm test`              | Tests unitaires/intégration (Vitest)                                |
| `npm run test:e2e`      | Tests bout-en-bout (Playwright)                                     |

En production, utiliser `npx prisma migrate deploy` (applique les migrations existantes sans
en générer de nouvelles) plutôt que `db:migrate`.

## Architecture du projet

```
gestion-auto-ecoles/
  docker-compose.yml        Postgres + MinIO (développement local)
  prisma/
    schema.prisma            Schéma de données complet (toutes les entités du projet)
    migrations/               Migrations versionnées (dont les contraintes anti-double-réservation)
    seed.ts                   Script de données de démonstration
  src/
    app/
      (auth)/connexion/        Page de connexion
      (app)/                    Zone applicative protégée (auth requise)
        tableau-de-bord/
        eleves/ planning/ examens/ salaries/ conges/
        vehicules/ finances/ documents/ rapports/    (accès + permissions actifs, contenu à venir)
        parametres/
          etablissements/       CRUD établissements (Phase 1)
          utilisateurs/          CRUD utilisateurs, rôles, accès établissements (Phase 1)
          journal-audit/          Consultation du journal d'audit (Phase 1)
      api/auth/[...nextauth]/   Route handler Auth.js
    components/
      ui/                       Composants de base façon shadcn/ui
      layout/                   Sidebar, header, sélecteur d'établissement, garde de permission
    server/
      auth/                     Config Auth.js, garde d'autorisation centralisée (guards.ts)
      services/                 Logique métier (1 fichier par domaine, autorisation systématique)
      db.ts                     Client Prisma (driver adapter pg), jamais importé hors server/**
      audit.ts                  Écriture du journal d'audit
      school-selection.ts       Sélecteur d'établissement (cookie + vérification d'accès)
    lib/
      permissions.ts            Catalogue des permissions + matrice par défaut par rôle
      validations/                Schémas Zod partagés client/serveur
      format.ts                  Dates (Europe/Paris) et montants (EUR) formatés en français
  src/proxy.ts                 Proxy Next.js (ex-"middleware") : redirection si non authentifié
  tests/
    unit/                      Tests Vitest (permissions, règles métier, contraintes base)
    e2e/                       Tests Playwright
```

**Principe d'architecture central** : `src/server/db.ts` (le client Prisma) n'est jamais importé
depuis `src/app/**` directement. Toute lecture ou écriture passe par `src/server/services/**`, et
chaque fonction de service y rappelle `requirePermission()` (voir `src/server/auth/guards.ts`) —
même si l'interface a déjà masqué l'action pour l'utilisateur. C'est la garantie que les
permissions sont contrôlées côté serveur, jamais seulement côté interface.

## Rôles et permissions

Quatre rôles fixes (`Role` en base, extensible côté schéma pour une évolution SaaS) :

1. **Super-administrateur** — toutes les auto-écoles, gestion des établissements/utilisateurs/rôles,
   accès au journal d'audit.
2. **Gérant / associé** — établissements qui lui sont explicitement attribués ; élèves, examens,
   salariés (y compris salaires), véhicules, finances, rapports.
3. **Secrétaire** — élèves, documents, paiements, planning, examens dans ses établissements ;
   consultation des salariés/véhicules/congés sans les données sociales sensibles.
4. **Moniteur** — son planning, ses élèves, ses examens, déclaration de congé/absence,
   signalement véhicule ; aucun accès aux salaires, aux finances ni aux autres salariés.

Le catalogue complet des permissions (`students.view`, `finance.manage`, `employees.viewSalary`...)
et la matrice par défaut par rôle sont dans `src/lib/permissions.ts` — source unique utilisée à la
fois par le seed et par les contrôles serveur. Un administrateur peut accorder ou retirer une
permission individuellement (table `UserPermission`) sans changer le rôle d'un utilisateur.

**Contrôle d'accès par établissement** : indépendamment de la permission, chaque opération liée à
un établissement vérifie que l'utilisateur y a accès (`UserDrivingSchool`), sauf le
super-administrateur qui a accès à tous les établissements par construction.

## Sécurité et RGPD

- Mots de passe hachés (bcrypt, jamais stockés ni journalisés en clair).
- Sessions signées (JWT, `AUTH_SECRET`), expiration à 12h.
- Verrouillage de compte après 5 échecs de connexion consécutifs (15 minutes), avec entrée au
  journal d'audit à chaque tentative (réussie ou non).
- Validation stricte des entrées côté serveur (Zod) pour toute mutation, en plus de la validation
  côté client — jamais l'inverse.
- Autorisation vérifiée côté serveur pour chaque lecture/écriture (`requirePermission`), jamais
  uniquement par masquage d'un bouton côté interface.
- Documents jamais servis depuis un chemin public : stockage S3/MinIO privé, accès uniquement via
  URL signée temporaire (prévu architecturalement, activé avec le module Documents en Phase 2).
- Journal d'audit non modifiable depuis l'interface standard (aucune fonction de mise à jour/suppression
  n'est exposée) ; trace utilisateur, action, horodatage, établissement, anciennes/nouvelles valeurs
  utiles, adresse IP.
- Aucun secret dans le dépôt : `.env` est ignoré par git, seul `.env.example` (sans valeurs réelles)
  est versionné.
- Comptes de démonstration explicitement bloqués en production (`NODE_ENV=production` fait échouer
  le script de seed).
- Export et suppression des données d'une personne : prévus par la structure de données
  (archivage systématique, jamais de suppression physique depuis l'interface standard) ; l'écran
  dédié à l'export/l'anonymisation encadrée reste à construire (voir [À faire](#à-faire-avant-une-mise-en-production-réelle)).

## Sauvegardes

Aucune sauvegarde automatisée n'est configurée dans ce dépôt (hors périmètre d'un projet local).
Recommandations pour un déploiement réel :

- **Base de données** : sauvegardes régulières via `pg_dump`/l'outil de sauvegarde managé de
  l'hébergeur PostgreSQL choisi, avec rétention documentée et test de restauration périodique.
- **Documents (MinIO/S3)** : réplication ou sauvegarde du bucket selon les capacités de
  l'hébergeur (versioning S3, réplication inter-région...).
- Documenter formellement une politique de conservation/purge conforme RGPD avant mise en
  production (durée de conservation des dossiers élèves archivés, des bulletins de paie, etc.).

## Tests

- `npm test` (Vitest) : permissions par rôle, isolation entre établissements, contraintes de base
  de données (anti-double-réservation moniteur/véhicule, unicité d'affectation d'une place
  d'examen), archivage, journal d'audit, hachage des mots de passe. Ces tests d'intégration
  utilisent une vraie base PostgreSQL (celle de `DATABASE_URL`) et nettoient leurs propres données.
- `npm run test:e2e` (Playwright) : connexion pour chaque rôle, visibilité des menus et accès
  serveur selon la permission (pas seulement l'affichage), vue consolidée pour un gérant,
  déconnexion. Le scénario complet demandé au cahier des charges (connexion secrétaire → élève →
  paiement → leçon → examen) est présent dans `tests/e2e/parcours-secretaire.spec.ts` avec les
  étapes non encore livrées explicitement marquées `fixme` (et la phase qui les livrera), plutôt
  que supprimées ou simulées.

## État d'avancement / phases

- ✅ **Phase 1 — Fondations** : architecture, base de données (schéma complet), authentification,
  établissements, utilisateurs/rôles/permissions, mise en page principale, journal d'audit.
- ⏳ **Phase 2** — Élèves, documents, paiements, recherche/filtres.
- ⏳ **Phase 3** — Salariés, congés, planning/leçons, détection de conflits.
- ⏳ **Phase 4** — Places d'examen, affectations, listes d'attente, résultats.
- ⏳ **Phase 5** — Véhicules, contrats, entretiens, assurances, immobilisations.
- ⏳ **Phase 6** — Finances, tableau de bord complet, rapports, exports.
- ⏳ **Phase 7** — Tests complets, durcissement UX/sécurité, documentation finale.

Le schéma de données (`prisma/schema.prisma`) couvre déjà l'intégralité des entités prévues pour
toutes les phases (élèves, salariés, véhicules, examens, finances, documents, notifications...) :
les phases suivantes construisent les services et interfaces sur des tables déjà en place, elles
ne redéfinissent pas le modèle de données.

Les rubriques de navigation des modules non encore livrés (Élèves, Planning, Examens, Salariés,
Congés, Véhicules, Finances, Documents, Rapports) sont déjà accessibles et protégées par
permission : elles affichent un état "module prévu en Phase X" plutôt qu'une page cassée ou une
fausse donnée.

## À faire avant une mise en production réelle

- Si un déploiement de démonstration (voir plus haut) a été utilisé : retirer
  `ALLOW_DEMO_SEED_IN_PRODUCTION`, changer tous les mots de passe des comptes créés pendant la
  démonstration (ou les archiver), et repartir d'une base propre avant tout usage réel.
- Réinitialisation de mot de passe en libre-service (« mot de passe oublié ») et changement de
  mot de passe depuis son propre compte — l'admin peut aujourd'hui définir un mot de passe initial,
  mais aucun flux self-service n'est encore construit.
- Intégration réelle d'envoi d'e-mail/SMS pour les rappels de leçon (architecture prévue,
  fournisseur non branché — voir cahier des charges §6).
- Bascule du stockage documentaire de MinIO vers un vrai fournisseur S3/R2 en production
  (changement de configuration uniquement, le code applicatif est identique).
- Politique de sauvegarde et de restauration formalisée et testée (voir [Sauvegardes](#sauvegardes)).
- Écran dédié à l'export et à la procédure encadrée d'anonymisation/suppression des données d'une
  personne (RGPD, droit à la portabilité et à l'effacement).
- Revue de sécurité complète et tests de charge avant ouverture à une utilisation réelle multi-utilisateurs.
- Environnement de test/staging séparé de la production.
