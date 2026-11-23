# Appli sport — guide pour une nouvelle session

Ce fichier suffit pour comprendre l'application sans avoir lu les conversations précédentes. Pour le détail historique (chaque décision, chaque retour de l'utilisateur), voir `SUIVI.md`. Le cahier des charges validé est `docs/cahier-des-charges.md`.

---

## 1. Le but de l'app et pour qui

Une application d'entraînement **personnelle**, faite pour **un seul utilisateur** :
- 25 ans, 188 cm, environ 82 kg ;
- francophone, **pas développeur** : il faut lui parler simplement ;
- reprend le sport le **28 décembre 2026** pour un programme de 6 mois.

Son objectif principal est de devenir un **athlète explosif** : sprinter plus vite, sauter plus haut, frapper plus fort. Il veut se mettre à la boxe et au basket. Le muscle, la force, une **sèche lente** et le cardio (VO2 max) viennent en soutien.

Il utilise l'app **sur iPhone, pendant ses séances**, souvent avec de la musique, et parfois sur son Mac pour analyser ses progrès.

- **Adresse :** https://badcompany-ai.github.io/Appli-sport/. Elle est installée sur l'écran d'accueil de l'iPhone.
- **Mises à jour :** elles s'installent depuis **Profil → Installer la mise à jour**.

## 2. Règles à respecter avec l'utilisateur

- Lui répondre **en français**, simplement, et expliquer chaque choix technique en une phrase.
- **Lui dire quand une demande est une mauvaise idée.**
- **Ne rien ajouter hors du cahier des charges sans le lui proposer d'abord.**
- **Tout doit être annulable**, par le bandeau « Annuler » ou la corbeille de 30 jours.
- **Aucune donnée ne doit être perdue** : export et import, nouvelle version de base à chaque changement de structure, anciennes sauvegardes toujours lisibles.
- Les données restent **uniquement sur l'iPhone**.
- L'app est **gratuite**, sans abonnement, et **marche hors ligne**. Unités : cm, kg, kcal.
- **Interdit : les outils et skills Bright Data.**
- **Ne plus proposer** de silhouettes animées ni de vidéos MuscleWiki : il les a trouvées moches. Garder les vidéos PureGym et les autres déjà choisies. Ne jamais inventer de lien vidéo.
- Les allègements, ajustements et rappels sont des **propositions**, jamais imposés.
- Méthode à chaque changement :
  - tester soi-même (tests automatiques et captures au format iPhone) ;
  - publier ;
  - expliquer comment vérifier sur l'iPhone ;
  - **attendre son retour** ;
  - mettre à jour `SUIVI.md`.

## 3. Fonctionnalités principales et comment elles marchent

L'app a **5 onglets** : Aujourd'hui, Programme, Progrès, Nutrition, Profil.

### Aujourd'hui
- **Lieu du jour** (Salle, Maison ou Extérieur) et **matériel coché**. Si un équipement manque, l'exercice est **remplacé automatiquement** par un exercice qui travaille le même mouvement, avec une charge adaptée, et l'app explique pourquoi.
- **Séance du jour**, tirée du programme :
  - **Temps disponible** : un curseur raccourcit la séance. Elle retire d'abord les exercices les moins importants, et ce qui est retiré apparaît barré, avec la raison.
  - **Changer de séance** : avancer une autre séance de la semaine. Une séance manquée n'est pas perdue, elle devient la suivante.
  - **Fatigue ou douleur** : la fatigue allège la séance. Une douleur signalée retire ou remplace les exercices qui sollicitent la zone. Un message rappelle que l'app ne donne pas de conseil médical.
  - **Alertes de récupération** : moins de 48 h entre deux grosses séances de jambes, ou plus de 3 jours d'affilée.
- **Sommeil** saisi en une touche. Sous 6 h, l'app propose d'alléger les sauts et les sprints.
- **Semaine allégée** proposée après 3 « trop dur », 2 fatigues signalées ou une stagnation.
- **Équilibre des muscles** : alerte quand un groupe musculaire est négligé, avec un exercice à ajouter.
- **Séance libre** : exercices au choix, ou activité (basket, padel…) avec sa dépense d'énergie. Elle peut remplacer une séance du programme ou s'ajouter à elle.
- Bouton **Peser** les jours conseillés, **bilan de la semaine** passée, rappel de sauvegarde.

### Mode séance (plein écran, l'écran reste allumé)
- **Un exercice à la fois.** Valider prend 2 gestes au plus, et la dernière performance est rappelée.
- **Séries d'échauffement** automatiques avant une charge lourde.
- **Exercices enchaînés** : par paires (contraste, tirer-pousser) ou par groupes (bras).
- **Fractionné guidé** (vélo d'assaut, rameur, rounds au sac) : décompte, phase « À FOND », récupération, puis round suivant tout seul.
- **Repos** :
  - grand décompte, et son « ambiant » qui ne coupe pas la musique ;
  - **raccourci iOS « Repos »** pour être prévenu hors de l'app : il attend la durée du repos, puis affiche une notification. C'est l'idée de l'utilisateur, testée et validée.
- **Ressenti** après chaque exercice (facile, correct, trop dur). Il règle la charge de la fois suivante, et deux « trop dur » d'affilée donnent −10 % et une série de moins.
- **Lest** possible (ceinture pour tractions et dips, haltères pour les sauts).
- Boutons : remplacer, fiche (vidéo en boucle sans le son, consignes, erreurs fréquentes), note, passer, abandonner.
- **Fin de séance** : records battus avec une petite animation, et dépense estimée.

### Programme
- **26 semaines :**
  - 2 semaines de reprise ;
  - 4 cycles de 6 semaines : Bases, Force, Puissance, Vitesse ;
  - la 6e semaine de chaque cycle est allégée, avec des tests de niveau.
- **4 séances par semaine :**
  - A : explosivité et force du bas du corps ;
  - B : haut du corps et boxe ;
  - C : vitesse, appuis et chaîne arrière ;
  - D : physique et cardio.
- Chaque choix s'appuie sur des sources scientifiques, détaillées dans `docs/audit-programme.md`.
- Objectifs mesurables tirés des tests, et bibliothèque d'environ 100 exercices.

### Progrès
- **Corps** : tendance du poids sur 7 jours en gros, avec les pesées du jour en points pâles car elles varient de 1 à 2 kg. Rythme par semaine. Tour de taille facultatif.
- **Bilans** des semaines passées, régularité, volume par groupe musculaire.
- Pour chaque exercice : graphique, records, force relative.
- **Historique modifiable**, avec annulation.
- **Sur Mac** (grand écran) : tableaux comparatifs des exercices et des semaines.

### Nutrition
- **Jauges** : calories et protéines en grand, lipides, glucides et fibres en petit. En sèche, les calories sont un plafond (« Il reste X kcal ») et les protéines un minimum.
- **Objectif du jour** = dépense sans sport (formule de Mifflin-St Jeor × 1,4) **+ sport du jour** (tables du Compendium des activités physiques 2024) − l'écart de la sèche lente (environ −225 kcal).
- **Ajustement automatique** toutes les 2 semaines, d'après la courbe de poids : ±150 kcal au plus, proposé et pas imposé. Si le tour de taille baisse et que les performances montent, les calories ne baissent pas.
- **Ajouter un aliment :**
  - **base suisse des valeurs nutritives**, intégrée et utilisable hors ligne (1 246 aliments et plats) ;
  - **Open Food Facts**, en ligne, pour les produits emballés vendus en Suisse ;
  - **scan du code-barres** : il marche sur l'iPhone de l'utilisateur, avec en secours une photo ou la saisie du code. Un produit inconnu devient un aliment personnel.
- Estimation rapide pour le restaurant, favoris et récents, repas enregistrés, « Copier la veille ».
- **Compléments en un geste** (protéine, créatine, collagène, potassium), avec la case « pris » et les jours d'affilée de créatine.
- Idées pour finir ses protéines.

### Profil
- Mise à jour, guide du raccourci « Repos », son.
- Modules Corps et Nutrition activables.
- **Sauvegarde** : export vers le Mac par AirDrop ou iCloud Drive, import, copies automatiques quotidiennes, corbeille.
- « À propos et sources ».

## 4. Choix importants et pourquoi

| Choix | Pourquoi |
|---|---|
| **Application web installable** (PWA) plutôt qu'une appli de l'App Store | Gratuite, sans abonnement développeur Apple, utilisable hors ligne, et le même code marche sur Mac. |
| **Données dans le téléphone** (base IndexedDB via Dexie) | Vie privée : rien ne part sur un serveur. Le passage vers le Mac se fait par fichier de sauvegarde. |
| **Thème sombre uniquement**, direction visuelle « Anneaux » inspirée d'Apple Forme et Nike Training Club | Choisie parmi deux maquettes : sobre, lisible en salle. **Le style n'est pas figé** : l'utilisateur tient aux fonctionnalités, pas aux couleurs, et laisse Claude améliorer le design (D20 dans `SUIVI.md`). |
| **Couleurs :** noir pur `#000` en fond, cartes `#141416` et `#1c1c1e`, texte `#f5f5f7`, texte secondaire `#98989f`, **accent orange `#FF5A1F`** avec du texte noir. **Orange = actions, progression, records seulement** (un seul bouton orange par écran). **« Choisi » = fond blanc.** Une couleur par séance (`--seance-a` à `--seance-e`, `src/ui/couleurs.tsx`) | Hiérarchie claire : l'œil trouve tout de suite l'action principale. |
| **Police Inter** pour les textes, **Barlow Condensed** pour les gros chiffres, échelle de tailles `--t-1` à `--t-7` et `--d-1` à `--d-3`, cartes très arrondies (22 px) | Lisible d'un coup d'œil pendant l'effort. |
| **Tous les tokens dans `src/styles.css`** (`:root`) | Un seul endroit pour changer le style. |
| **Saisie en 2 gestes au plus**, gros boutons | On l'utilise en salle, les mains occupées. |
| **Ton neutre** pour le poids : pas de rouge ni de vert, pas de jugement | Demande de l'utilisateur : le chiffre lui importe peu, il vise la silhouette. |
| **Remplacements par mouvement de base** (squat, charnière, poussée…) | Garde l'effet d'entraînement quel que soit le matériel. |
| **Raccourci iOS pour la fin de repos** au lieu de notifications par serveur | Une page web ne peut ni vibrer ni sonner en arrière-plan. Le raccourci marche écran verrouillé sans couper la musique. L'utilisateur a refusé l'option serveur. |
| **Vidéos YouTube muettes, en boucle** (PureGym surtout) | Courtes, homogènes, elles ne coupent pas la musique. Liens vérifiés. |

**Structure du code :**
- `src/domain/` : règles pures et testées (programme, remplacement, progression, adaptation, nutrition, corps, bilan…).
- `src/data/` : accès à la base.
- `src/ui/` : écrans, dans `src/ui/screens/`, et composants.
- `src/platform/` : son, écran allumé, partage de fichiers.

**Outils :**
- React 18, TypeScript, Vite 6 ;
- vite-plugin-pwa (appli installable et hors ligne) ;
- Dexie 4 (base en version 2) ;
- Vitest (150 tests unitaires) et Playwright (4 parcours au format iPhone dans `e2e/`, 165 vérifications) ;
- @zxing (lecture des codes-barres).

```bash
npx tsc -b          # vérifie les types
npx vitest run      # tests unitaires
npm run build       # construit l'app
npm run e2e         # parcours complets au format iPhone (après build)
```

**Publication :** travailler sur la branche de la session, puis :
1. commit ;
2. pull request ;
3. fusion dans `main` (l'utilisateur l'autorise) ;
4. attendre la fin du déploiement GitHub Actions vers GitHub Pages ;
5. recaler la branche sur `main`.

## 5. Ce qui reste à faire et problèmes connus

**Dernière étape :** amélioration du design (UI/UX), 25 points appliqués le 23/11/2026 (détail : D20 dans `SUIVI.md`). **En attente du retour de l'utilisateur.** Étape suivante prévue : proposer les animations (skills emil-design-eng et improve-animations), **faire approuver la liste avant de les faire**.
- Skills de design dans `.claude/skills/` (origine : `PROVENANCE.md`). impeccable est installée **sans ses hooks ni son moteur** : `critique` et `audit` marchent en mode réduit ; `live` et `generate` ne marchent pas.
- Point de retour avant le design : commit `5fc5735`.

**Problèmes connus :**
- **Chrono vidéo de sprint** et **rappels Calendrier** : ne marchaient pas sur son iPhone → **cachés** (code conservé, réactivables dans `src/ui/fonctionsCachees.ts`).
- **Limites des applis web sur iPhone** : pas de vibration ; l'app est mise en pause quand elle n'est pas à l'écran ; le mode silencieux coupe ses sons.

**Questions ouvertes :**
- **Schéma du corps** dans les fiches d'exercice : prévu au cahier des charges, pas fait. L'utilisateur avait trouvé les silhouettes moches ; lui demander s'il le veut quand même.
- **Kettlebells de la salle** : 32 kg au maximum, valeur supposée. Les haltères vont jusqu'à 60 kg.

**Simplifications acceptées :**
- « Changer de séance » remplace le glisser-déposer dans le Programme.
- Les valeurs des compléments sont typiques. Si un produit diffère, le créer comme aliment personnel.
- La lecture de l'app Santé d'Apple serait possible seulement avec une vraie appli native : non prévu.
