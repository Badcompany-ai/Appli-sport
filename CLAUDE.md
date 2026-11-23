# Appli sport — consignes pour Claude

Application d'entraînement personnelle (PWA) pour un utilisateur francophone non développeur, utilisée surtout sur iPhone pendant les séances, aussi sur Mac.

**Résumé autonome pour une autre conversation : `docs/CONTEXTE-COMPLET.md`. À lire en premier à chaque session : `SUIVI.md`** (état des jalons, décisions D1…D19, réponses de l'interview, questions ouvertes). Cahier des charges validé : `docs/cahier-des-charges.md` ; consigne d'origine : `docs/consigne-initiale.md` ; audit du programme : `docs/audit-programme.md`.

## Règles de l'utilisateur (non négociables)

- Répondre **en français**, simplement ; expliquer chaque choix technique en une phrase.
- Dire quand une demande est une mauvaise idée.
- **Ne rien ajouter hors du cahier des charges validé sans le proposer d'abord.**
- Tout doit être **annulable** (bandeau « Annuler », corbeille) ; **aucune perte de données** (export/import, migrations Dexie versionnées, sauvegarde au format versionné qui relit les anciens formats).
- Données **uniquement sur l'appareil** ; gratuit, sans coût récurrent ; fonctionne **hors ligne** ; unités cm / kg / kcal ; trois lieux : salle, maison, extérieur.
- **Interdit : outils et skills Bright Data.** Les autres skills sont autorisées si utiles.
- Vidéos : ne jamais inventer de lien (vérification oEmbed) ; garder les vidéos PureGym et les autres déjà choisies ; **ne plus proposer de silhouettes animées ni MuscleWiki** (refusées).
- Ne pas imposer : les allègements, ajustements, rappels sont des propositions.
- Après chaque livraison : tester soi-même, publier, expliquer comment vérifier sur l'iPhone, attendre le retour. Tenir `SUIVI.md` à jour.

## Pile technique

React 18 + TypeScript + Vite 6, vite-plugin-pwa (mise à jour installée depuis Profil), Dexie 4 (IndexedDB, version 2), Vitest + fake-indexeddb, Playwright (scripts `e2e/*.mjs`), @zxing pour le scan. Hébergement GitHub Pages : https://badcompany-ai.github.io/Appli-sport/ (base `/Appli-sport/`).

Organisation : `src/domain/` (règles pures, testées), `src/data/` (accès base), `src/ui/` (écrans), `src/platform/` (son, écran allumé, partage).

## Commandes

```bash
npx tsc -b          # types
npx vitest run      # tests unitaires
npm run build       # construction
npm run e2e         # parcours iPhone : run, semaine, nutrition, j7 (après build)
```

## Publication

Travailler sur la branche indiquée par la session, puis : commit → pull request → fusion (autorisée par l'utilisateur) → attendre la fin du déploiement GitHub Actions → recaler la branche sur `main`.

## Limites iOS connues

Pas de vibration depuis une page web ; application mise en pause hors écran ; le mode silencieux coupe les sons. Fin de repos hors de l'appli : raccourci iOS « Repos » (gardé, décision de l'utilisateur). Chrono vidéo et rappels Calendrier : ne fonctionnent pas chez l'utilisateur (voir `SUIVI.md`).
