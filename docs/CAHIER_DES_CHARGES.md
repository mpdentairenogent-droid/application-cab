# Cahier des charges — Application mobile interne de gestion pour cabinet dentaire

> Document fourni par le client le 2026-08-08. Conservé tel quel comme référence canonique pour toutes les décisions produit et techniques du projet. Ne pas paraphraser ailleurs : se référer à ce fichier.

## 1. Objectif général

Créer le véritable centre de pilotage interne du cabinet dentaire. L'application doit permettre à l'équipe de centraliser : tâches, Post-it, communication interne, demandes de matériel, commandes, stock, produits à péremption, stérilisation, traçabilité des cycles, contrôles de stérilisation, maintenance, pannes, équipements, chiffre d'affaires, objectifs, dépenses, comptabilité simplifiée, fournisseurs, laboratoires, documents, protocoles, check-lists, calendrier interne, absences, notifications, historique des actions, utilisateurs, rôles, permissions.

L'objectif n'est **pas** de remplacer le logiciel métier dentaire ou le logiciel patient. Cette application concerne l'organisation, la gestion, la logistique, la stérilisation, le fonctionnement interne et la gestion financière interne.

**Éviter dans la première version de stocker des données médicales nominatives de patients.**

## 2. Application mobile dès le départ

Architecture pensée dès le départ pour iOS, Android, iPadOS, éventuellement Web/Desktop. Cible à terme :
- iOS → Xcode → TestFlight → Apple App Store
- Android → Android Studio / build Android → Google Play Console → Google Play Store

Pas d'architecture qui obligerait à reconstruire entièrement l'application plus tard.

## 3. Choix technologique

Option privilégiée : React Native + Expo + Expo Router + TypeScript + Supabase + PostgreSQL, avec possibilité de version Web.
Alternative : React/Next.js + TypeScript + Capacitor + Supabase + PostgreSQL — mais l'application finale ne doit pas être une simple WebView sans intégration mobile réelle.

Critères de choix : publication App Store, publication Google Play, maintenance, performances, sécurité, notifications push, appareil photo, QR code, biométrie, fichiers, fonctionnement hors connexion, évolutivité, partage de code.

## 4. Fonctionnalités natives futures

Notifications push, appareil photo, import de photos, scan de QR codes, Face ID, Touch ID, biométrie Android, stockage sécurisé, partage natif, téléchargement de documents, ouverture de PDF, badges de notifications, accès sécurisé à certains fichiers, fonctionnement partiel hors connexion. Préparer proprement l'architecture pour ces évolutions.

## 5. Mobile first

Exigence fondamentale. Concevoir les écrans téléphone en premier, pas un site desktop réduit. Prendre en compte : safe areas, Dynamic Island, encoches, barre système Android, différentes tailles d'écran, clavier mobile, orientation écran, utilisation tactile, gestes, scroll, zones cliquables, utilisation à une main. Boutons importants accessibles au pouce.

## 6. Design

Style : premium, doux, élégant, rassurant, chaleureux, moderne, minimaliste, fluide, très lisible, pas trop médical, pas froid. Pas d'interface entièrement blanche où les sections se confondent.

Palette suggérée : blanc cassé, beige très clair, bleu doux, bleu grisé, gris chaud, vert sauge.

Utiliser : cartes, coins arrondis, ombres discrètes, séparations claires, fonds légèrement colorés, icônes modernes, typographie très lisible, animations discrètes, micro-interactions.

Couleurs fonctionnelles : VERT = validé/conforme/terminé · ORANGE = attention/échéance · ROUGE = urgence/panne/non conforme · BLEU = information · GRIS = archivé/inactif.

## 7. Design system

Créer dès le départ : couleurs, typographies, espacements, boutons, formulaires, cartes, badges, modales, alertes, menus, onglets, loaders, états vides, confirmations, notifications, composants de graphiques. Ne pas styler chaque écran différemment.

## 8. Identité du cabinet

Paramètres : nom du cabinet, logo, adresse, téléphone, email, couleurs, informations générales. Prévoir éventuellement multi-cabinets/multi-sites dans le futur.

## 9. Utilisateurs

Chaque membre a son compte : nom, prénom, avatar, rôle, email, statut actif/inactif, praticien associé si nécessaire, permissions, date de création, dernière connexion.

## 10. Rôles

1. Assistante dentaire
2. Dentiste collaborateur
3. Dentiste titulaire
4. Secrétariat / administratif
5. Comptable
6. Super administrateur si nécessaire

**Chaque rôle voit une application différente** : menus, dashboard, données et fonctionnalités changent automatiquement selon la personne connectée.

## 11. Assistante dentaire

Accès : dashboard opérationnel, tâches, Post-it, communication interne, demandes matériel, commandes, stock, péremptions, stérilisation, traçabilité, contrôles, équipements, maintenance, pannes, check-lists, documents internes, protocoles, calendrier, notifications.

**Aucun accès** : chiffre d'affaires, CA d'un praticien, CA global, objectifs financiers, comptabilité, dépenses financières confidentielles, données financières sensibles. Ces rubriques ne doivent même pas apparaître dans son interface.

## 12. Dentiste collaborateur

Espace personnel "Mon activité" : CA aujourd'hui/semaine/mois/année, objectif, progression, évolution, jours travaillés, CA moyen/jour travaillé, statistiques personnelles, éventuellement nombre de patients. Accès aux fonctions opérationnelles autorisées.

**Ne doit jamais voir** : CA d'un autre collaborateur, CA d'un titulaire, CA individuel des autres praticiens, comptabilité globale, dépenses confidentielles, données financières privées du cabinet.

## 13. Dentiste titulaire

Accès complet : CA global, CA individuel, CA par praticien, objectifs, statistiques, dépenses, comptabilité, commandes, stock, matériel, maintenance, stérilisation, équipe, utilisateurs, permissions, documents, paramètres, historiques. Administration des comptes : créer utilisateur, désactiver compte, changer rôle, ajouter/enlever permissions, réinitialiser accès, consulter logs, configurer l'application.

## 14. Secrétariat / administratif

Rôle configurable. Accès possible : tâches, messages, documents, fournisseurs, commandes, calendrier, maintenance, certaines statistiques. Pas d'accès automatique à la stérilisation, au CA, à la comptabilité — les titulaires déterminent les permissions.

## 15. Comptable

Accès externe optionnel, uniquement aux informations financières explicitement autorisées. Pas besoin d'accès aux Post-it, tâches cliniques, stérilisation, pannes, stock (sauf nécessité).

## 16. Permissions granulaires

Pas seulement des rôles rigides — permissions granulaires en plus. Exemples : `view_own_revenue`, `view_all_revenue`, `manage_revenue`, `view_accounting`, `manage_accounting`, `view_expenses`, `manage_expenses`, `view_stock`, `manage_stock`, `view_orders`, `manage_orders`, `view_sterilization`, `manage_sterilization`, `view_equipment`, `manage_equipment`, `view_documents`, `manage_documents`, `view_team`, `manage_users`, `manage_permissions`, `view_audit_logs`. Chaque rôle a des permissions par défaut ; les titulaires peuvent en modifier certaines.

## 17. Sécurité des permissions

**Ne jamais sécuriser uniquement en cachant des boutons côté interface.** Protection requise côté application, serveur, API, et base de données. Avec Supabase/PostgreSQL : politiques Row Level Security sérieuses (ex. un collaborateur accède à `revenue_entries` uniquement si `practitioner_id` correspond à son compte ; une assistante n'a aucun droit SELECT sur les tables financières). Modifier une URL/requête API ne doit jamais permettre de contourner les permissions.

## 18. Authentification

Connexion, déconnexion, mot de passe oublié, changement de mot de passe, sessions sécurisées, expiration, révocation de session, déconnexion de tous les appareils. Préparer à terme Face ID / Touch ID / biométrie Android — pour déverrouiller une session déjà sécurisée côté serveur, pas pour remplacer cette sécurité.

## 19–24. Dashboard & navigation

Le dashboard répond immédiatement à : que dois-je faire aujourd'hui ? y a-t-il un problème ? quelles infos importantes dois-je connaître ? Différent selon le rôle (détail dashboards Assistante/Collaborateur/Titulaire aux §20-22 — voir texte source pour le détail champ par champ).

Navigation mobile : barre fixe en bas, onglets qui changent selon le rôle (ex. Assistante : Accueil/Tâches/Stérilisation/Stock/Plus ; Collaborateur : Accueil/Mon activité/Tâches/Messages/Plus ; Titulaire : Accueil/Finances/Activité/Équipe/Plus). Jamais de rubrique interdite affichée.

Bouton d'action rapide "+" contextuel selon le rôle (créer tâche, Post-it, demande matériel, cycle, panne, dépense, événement) — uniquement les actions autorisées.

## 25–55. Modules fonctionnels

Tâches, Post-it, communication interne, demandes de matériel, commandes fournisseurs, fournisseurs, stock, mouvements de stock, péremptions, stérilisation (cycles, non-conformités, traçabilité, contrôles Bowie-Dick/Helix/etc.), équipements, pannes, QR codes (associés aux équipements/stock/zones), check-lists configurables, chiffre d'affaires, objectifs, comptabilité interne, dépenses, statistiques financières, laboratoires partenaires, documents et protocoles, calendrier interne, absences, notifications, notifications push, recherche globale, audit log (non supprimable par utilisateurs standards), pièces jointes (photo/PDF, images optimisées automatiquement).

Champs et statuts détaillés pour chaque module : voir le texte source complet conservé dans l'historique de conversation / à redemander au client si le détail exact d'un module est nécessaire.

## 56–57. Expérience utilisateur & mode hors connexion

Rapidité prioritaire : Post-it en quelques secondes, demande matériel < 15s, signaler panne < 20s, cycle stérilisation en un minimum de clics, CA personnel consultable immédiatement. Utiliser valeurs par défaut, dernière sélection, favoris, duplication, auto-complétion.

Mode hors connexion : ne jamais afficher "Enregistré" si la donnée n'est pas réellement synchronisée. États explicites : Synchronisé / En attente de synchronisation / Erreur de synchronisation.

## 58–63. Sécurité, RGPD, données de santé, sauvegardes, erreurs, accessibilité

Chiffrement des communications, politiques d'accès, sécurité des sessions, validation serveur, stockage sécurisé, sauvegardes, journalisation, gestion des erreurs, limitation des permissions. Aucune clé sensible exposée côté client.

RGPD (cabinet en Europe) : minimisation des données, gestion des utilisateurs, suppression/désactivation des comptes, politique de conservation, contrôle des accès, registre des actions sensibles, export si nécessaire. Hébergement UE privilégié quand possible.

Données de santé : v1 ne stocke pas de dossiers médicaux patients nominatifs. Toute évolution future sur ce point doit revoir architecture/hébergement/conformité/sécurité spécifiquement.

Sauvegardes : vraie stratégie de sauvegarde + restauration (base, documents, fichiers).

États d'erreur propres et comprĂ©hensibles pour non-technicien : connexion perdue, serveur indisponible, permission refusée, document absent, formulaire incorrect, synchronisation échouée, utilisateur non autorisé.

Accessibilité : contrastes, taille texte, zones tactiles, labels, VoiceOver autant que possible, navigation clavier en version web, tailles adaptables. Mode clair principal, mode sombre éventuel.

## 65–68. Paramètres, base de données, architecture code, évolutivité

Page paramètres selon permissions (cabinet, profil, notifications, utilisateurs, rôles, permissions, catégories, fournisseurs, appareils, autoclaves, objectifs, check-lists, sécurité, sessions, apparence).

Entités minimales : `users`, `profiles`, `roles`, `permissions`, `role_permissions`, `user_permissions`, `practitioners`, `tasks`, `task_assignments`, `post_its`, `internal_messages`, `material_requests`, `orders`, `order_items`, `suppliers`, `stock_items`, `stock_movements`, `sterilization_cycles`, `sterilization_controls`, `equipment`, `maintenance_records`, `breakdowns`, `revenue_entries`, `financial_targets`, `expenses`, `documents`, `document_categories`, `checklist_templates`, `checklists`, `checklist_entries`, `notifications`, `internal_events`, `absences`, `audit_logs`, `app_settings`, `device_tokens`. La structure exacte peut différer si plus propre, mais relations normalisées et robustes.

Architecture code séparée proprement : authentification, navigation, permissions, UI, logique métier, services, API, base, types, formulaires, validations, hooks, stockage, notifications, configuration, sécurité. Pas de fichiers géants monolithiques.

Évolutivité prévue pour : multi-cabinets/sites/sociétés, RH avancée, planning, intégrations externes, automatisations, statistiques avancées, scan code-barres, inventaire, commande semi-automatique, API comptable, QR codes, signatures, documents avancés.

## 69–73. Publication stores

**Apple App Store** : icône, nom, numéro version/build, bundle identifier, écran de lancement, permissions iOS justifiées, confidentialité, suppression de compte, pas de compte démo exposé publiquement, politique de confidentialité, écran paramètres, gestion d'erreurs propre, expérience réellement mobile.

**Google Play** : package Android, versionCode/versionName, icône adaptative, permissions Android, notifications, confidentialité, politique de données, signature de l'application, builds test/production.

**TestFlight** avant publication App Store — distribution bêta équipe sur plusieurs iPhone. **Test Android** équivalent avant publication publique.

**Environnements** : développement / test-staging / production, sans mélange de données.

## 74–78. Données de démo, tests, performance, monitoring

Données fictives réalistes : au moins 1 titulaire, 1 collaborateur, 1 assistante, + tâches, commandes, produits, cycles, pannes, données financières fictives.

**Tests absolus des permissions** (§75) — scénarios obligatoires :
- Assistante : ne voit aucun menu financier ; ne peut obtenir aucune donnée financière même en appelant directement une API.
- Collaborateur : voit uniquement ses données financières ; changer l'identifiant praticien dans une requête ne doit jamais donner accès aux données d'un autre.
- Titulaire : accès global conforme.

Tests techniques sur parties critiques : authentification, permissions, données financières, stérilisation, formulaires importants. **Priorité absolue aux permissions et à la séparation des données.**

Performance : démarrage rapide, requêtes/images/listes/cache/chargement/pagination optimisés, pas de chargement de toutes les données dès l'ouverture.

Monitoring éventuel (erreurs, crash reports, logs techniques) sans info sensible envoyée inutilement.

## 79–82. Expérience app store, version web, nommage, simplicité

L'app ne doit jamais donner l'impression d'être un site encapsulé : navigation mobile, gestes naturels, appareil photo, notifications, QR scanner, biométrie, actions rapides, composants adaptés, chargements fluides.

Version web utile notamment pour comptabilité, tableaux financiers, exports, administration utilisateurs, analyse, documents — l'expérience smartphone reste prioritaire.

Nom de projet configurable provisoirement, pas codé en dur (nom commercial définitif décidé plus tard par le client).

Ne jamais surcharger l'interface : chaque utilisateur ne voit que les modules utiles à son rôle.

## 83. Priorités de développement (phases)

1. **Fondations** — architecture, projet mobile, base de données, authentification, sécurité, rôles, permissions, design system, navigation, comptes test.
2. **Gestion interne** — dashboard, tâches, Post-it, demandes matériel, commandes, stock.
3. **Stérilisation et matériel** — stérilisation, contrôles, traçabilité, équipements, maintenance, pannes.
4. **Finances** — CA, objectifs, dépenses, statistiques, permissions financières.
5. **Organisation** — documents, protocoles, check-lists, calendrier, absences, notifications.
6. **Mobile avancé** — notifications push, QR codes, biométrie, hors connexion, optimisations iOS/Android.
7. **Publication** — tests, TestFlight, test Android, App Store, Google Play.

## 84. Consigne de démarrage

Analyser le cahier des charges ; choisir l'architecture technique ; expliquer brièvement le choix ; créer la structure du projet ; créer le schéma de base de données ; définir rôles et permissions ; implémenter sécurité et RLS ; mettre en place l'authentification ; créer le design system ; créer la navigation mobile ; créer les comptes de démonstration ; créer les dashboards Assistante/Collaborateur/Titulaire ; tester la séparation des permissions ; continuer ensuite module par module.

## 85. Méthode de travail

Autonomie attendue : ne pas demander validation pour chaque petite décision technique standard/réversible/logique/sans impact métier majeur — prendre la meilleure décision et continuer. Documenter clairement les décisions structurantes. En cas d'incohérence dans la demande, choisir la solution la plus professionnelle et l'expliquer brièvement.

## 86. Qualité du code

Vrai code fonctionnel — pas de maquettes, écrans statiques, faux boutons, fausses données front-end, fonctionnalités simulées. Chaque fonctionnalité connectée proprement à la base quand nécessaire.

## 87. Critères de refus

Le projet est inacceptable si : une assistante peut voir des informations financières ; un collaborateur peut voir le CA d'un autre praticien ; la sécurité repose uniquement sur le front-end ; l'application ressemble à un site desktop ; elle fonctionne mal sur iPhone ou Android ; elle ne peut pas évoluer vers App Store/Google Play ; les actions quotidiennes nécessitent trop de clics ; le code est monolithique ; les données sensibles sont mal protégées ; l'application devient trop compliquée.

## 88. Objectif final

Application mobile professionnelle de gestion interne pour cabinet dentaire : agréable, rapide, extrêmement simple, sécurisée, évolutive, professionnelle, adaptée au cabinet, parfaitement utilisable sur iPhone et Android. Court terme : usage quotidien par l'équipe. Moyen terme : testable via TestFlight + test Android. Long terme : publication officielle Apple App Store + Google Play sans reconstruction complète.

Priorités constantes : **sécurité, simplicité, mobile first, rôles et permissions, expérience utilisateur, évolutivité, publication future App Store/Google Play.**
