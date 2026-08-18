# Contexte du projet — état d'avancement

_Dernière mise à jour : 2026-08-18. À tenir à jour à chaque étape importante — ce fichier existe pour qu'on puisse reprendre le projet sur n'importe quelle machine sans reperdre tout le contexte accumulé en session._

Pour le détail complet de la demande initiale : `docs/CAHIER_DES_CHARGES.md`. Pour le choix de stack (React Native/Expo vs Capacitor) et sa justification : `docs/ARCHITECTURE.md`. Ce fichier-ci couvre ce que les deux autres ne couvrent pas : l'avancement réel, les décisions prises en cours de route, les pièges déjà payés une fois, et ce qui reste en suspens.

## Où en est le projet

**Phases 1 à 6 du cahier des charges (§83) sont livrées** : fondations (architecture, DB, auth, RLS, permissions), gestion interne (tâches, Post-it, communication interne, demandes de matériel, commandes, stock), stérilisation et équipements, finances, organisation (documents, check-lists, calendrier, absences, notifications), et mobile avancé (push, QR, biométrie, mode hors connexion partiel).

**Construit depuis, au-delà du cahier des charges initial** :
- Catégories de stock avec couleur modifiable par l'utilisateur (Stock → onglet Catégories), utilisées pour filtrer/organiser le catalogue et accélérer l'ajout d'articles dans les commandes.
- Import de masse du catalogue stock depuis un fichier Excel, avec détection de doublons (contre l'existant et au sein du fichier) avant validation — jamais d'import silencieux.
- **Deux fonctionnalités IA (Claude API, via des fonctions serveur Supabase)** : scanner une photo de facture pour pré-remplir une dépense, et scanner une étiquette de cycle d'autoclave pour pré-remplir un cycle de stérilisation. Dans les deux cas : extraction suggérée uniquement, jamais d'enregistrement automatique, l'utilisateur valide toujours. Une troisième piste (bons de livraison / articles pour Stock-Commandes) est prévue mais pas encore construite — voir "Prochaines étapes".
- Correctif critique : aucun compte dentiste (titulaire/collaborateur) n'obtenait de fiche "praticien" liée à la création, ce qui rendait la saisie de chiffre d'affaires impossible. Corrigé à la racine (trigger de création de compte) + comptes existants réparés.

**Compte réel en production** : Dr. Moslah Kamel (`dr.moslahkamel@gmail.com`, owner_dentist). Un second compte owner_dentist "Camille Pilot" existe aussi (créé par l'utilisateur lui-même à un moment non documenté ici, apparemment volontaire).

**Infrastructure** :
- Supabase : projet `wkallvenuvgtjfubhutz` (région eu-west-1). Migrations SQL appliquées jusqu'à `0028`.
- Dépôt Git initialisé et poussé sur GitHub le 2026-08-18 : `https://github.com/mpdentairenogent-droid/application-cab.git`, branche `main`. Identité git configurée localement dans le dépôt (pas globalement) : `mpdentairenogent` / `mpdentaire.nogent@gmail.com`.
- Projet EAS lié : `@mpkamcams-team/cabinet-dentaire-app`. **Le premier build Android de production a échoué deux fois** — la première fois à cause d'un `package-lock.json` désynchronisé (corrigé), la deuxième fois pour une cause encore non diagnostiquée au moment de la rédaction de ce fichier (le jeton d'accès Expo utilisé en session a expiré avant d'avoir pu creuser). À reprendre : voir "Prochaines étapes".

## Décisions prises en cours de route (pas dans le cahier des charges ni l'architecture)

- **Distribution mobile** : préférence pour les canaux internes/fermés (test interne Play Store, distribution ad hoc iOS) plutôt qu'une fiche publique complète sur les stores — l'app gère des données sensibles du cabinet et n'a aucune raison d'être cherchable publiquement. Compte Google Play Console en cours de création par l'utilisateur (statut à vérifier). Côté Apple, la question est explicitement mise en pause ("on verra") tant qu'Android n'est pas réglé.
- **IA** : utilisée uniquement pour de l'extraction/OCR assistée à partir d'une photo, jamais pour de la génération autonome de données métier. Toujours côté serveur (Supabase Edge Functions), la clé Anthropic n'est jamais exposée côté client. Modèle utilisé : Haiku 4.5, choisi pour le rapport coût/tâche (extraction bornée), pas Sonnet/Opus. Un plafond de dépense mensuel a été recommandé côté compte Anthropic (Réglages > Facturation), avec rechargement automatique désactivé pour un vrai plafond dur.
- **Détection de doublons** (import stock, saisie d'articles) : comparaison de texte floue (accents/casse/espaces, distance de Levenshtein), délibérément sans IA — plus simple, gratuit, et les données ne quittent pas l'appareil pour cette vérification.
- **RGPD / IA** : cohérent avec la contrainte déjà actée de ne jamais stocker de dossier médical patient nominatif — l'IA ne traite que des documents administratifs (factures, étiquettes de cycle), jamais de données patient.

## Pièges déjà rencontrés — à ne pas re-découvrir à la dure

- **`src/components/ui/Sheet.tsx`** (la modale utilisée par tous les formulaires) a eu une saga de bugs iOS-only (fond transparent, corps de la fiche vide/collapsé) invisibles sur le web et en `tsc`/lint. Le fix final tient sur 4 points précis, tous nécessaires : `maxHeight` en pixels concrets (pas `'92%'`), `collapsable={false}` sur `backdrop` et `sheet`, et surtout le `ScrollView` interne en `{flexGrow:1, flexShrink:1, flexBasis:'auto'}` — **jamais le raccourci `flex:1`**, qui vaut `flexBasis:0%` et fait s'effondrer une fiche courte. Si un futur écran basé sur `Sheet` se comporte bizarrement sur iPhone, relire cette histoire avant de retoucher le fichier.
- **`xlsx` (SheetJS)** : la version publiée sur le registre npm a deux failles connues jamais corrigées là-bas (l'éditeur a arrêté d'y publier). Installer depuis `https://cdn.sheetjs.com/xlsx-<version>/xlsx-<version>.tgz`, jamais `npm install xlsx` directement.
- **PowerShell** : `Get-Content`/`Set-Content` sans encodage explicite corrompt les caractères accentués et le `€` dans les fichiers UTF-8 sans BOM de ce projet. Toujours passer par `[System.IO.File]::ReadAllText/WriteAllText` avec un encodage UTF8 explicite pour un script touchant les fichiers source.
- **`eas build` (serveur distant) utilise `npm ci`**, strict sur la cohérence du lock file — alors que le développement local avec `npm install` tolère un peu de dérive. Avant de pousser un build, vérifier que `npm ci` réussit en local (attention sous Windows : un process qui verrouille un fichier dans `node_modules`, comme un tunnel Expo resté ouvert, peut faire échouer `npm ci` pour une tout autre raison — bien lire l'erreur).
- **Migrations qui suppriment/renomment une colonne** : toujours vérifier qu'aucune vue (`create view`) ni aucun trigger d'une migration précédente n'y fait référence avant de la supprimer — une vue dépendante bloque le `drop column`, et ce n'est pas toujours détecté par un simple grep textuel si on ne pense pas à chercher spécifiquement dans les fichiers de vues.
- **TanStack Query + persistance locale** : ne jamais laisser un `Set`/`Map`/instance de classe dans les données d'une requête persistée (`JSON.stringify` les détruit silencieusement). Toujours des formes JSON planes.
- Le type `Database` (`src/types/database.ts`) est écrit à la main : chaque entrée doit être un `type`, jamais une `interface`, sous peine d'échec silencieux des requêtes typées.

## En attente / pas finalisé

- **Build Android de production** : bloqué sur un deuxième échec non diagnostiqué (voir plus haut).
- **Publication Play Store** : compte Google Play Console en cours de création côté utilisateur, statut à confirmer. Politique de confidentialité pas encore rédigée (nécessaire même en test interne, l'app touchant des données personnelles).
- **Distribution iOS** : entièrement en pause, décision explicitement reportée par l'utilisateur.
- **3ᵉ cas d'usage IA (bons de livraison / articles de commande)** : prévu, pas commencé. Réutiliser le module partagé `supabase/functions/_shared/claudeVision.ts` plutôt que repartir de zéro.
- **Réglages du cabinet** (`app_settings` : nom, adresse, téléphone, email) : aucun écran dans l'app pour les modifier — toujours la valeur par défaut du seed initial.
- **Export de données** (CSV pour la comptable, par exemple) : n'existe pas.
- **"Dupliquer une saisie"** (cycle, ligne de CA, dépense) : demandé au §56-57 du cahier des charges, jamais construit.
- **Environnement de test séparé** de la base Supabase actuelle (marquée "production" alors qu'elle sert aussi de seul environnement de dev) : toujours pas fait, mentionné comme souhaitable une fois l'usage quotidien réel commencé.
- Dans le scan de facture par IA, le nom du fournisseur extrait atterrit dans le champ commentaire plutôt que d'être relié automatiquement à une fiche fournisseur existante — amélioration possible, pas faite.

## Prochaines étapes prévues

1. Obtenir un nouveau jeton d'accès Expo (le précédent a expiré) pour reprendre l'investigation du build Android qui échoue.
2. Vérifier l'état du compte Google Play Console (vérification d'identité en cours au dernier point de contact).
3. Rédiger la politique de confidentialité une fois prêt à soumettre sur Play Store.
4. Une fois le scan de facture validé par un usage réel sur plusieurs jours, attaquer le 3ᵉ cas d'usage IA (bons de livraison).
