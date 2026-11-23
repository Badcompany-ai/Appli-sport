# Contexte complet du projet « Appli sport » (au 23/11/2026)

Document à donner à une nouvelle conversation pour qu'elle reprenne le projet sans rien perdre. Il résume tout ; le détail se trouve dans le dépôt (`SUIVI.md`, `docs/cahier-des-charges.md`, `docs/audit-programme.md`, `docs/consigne-initiale.md`, `CLAUDE.md`).

---

## 1. Le projet en deux phrases

Une application d'entraînement **personnelle**, de qualité commerciale, construite pour un seul utilisateur. Elle s'utilise surtout **sur iPhone pendant les séances**, et aussi sur Mac.

- **Application :** https://badcompany-ai.github.io/Appli-sport/, installée sur l'écran d'accueil de l'iPhone.
- **Code :** dépôt GitHub `badcompany-ai/Appli-sport`, branche `main`.
- **Mises à jour :** elles s'installent dans l'appli via **Profil → Installer la mise à jour**.

## 2. L'utilisateur

- **Profil :**
  - 25 ans, homme, 188 cm, environ 82 kg ;
  - aucune blessure ;
  - sommeil souvent sous 7 h, travail assis ;
  - francophone, **pas développeur**.
- **Passé sportif :** basket pendant des années, puis musculation. Arrêt à l'été 2026.
- **Reprise :** le **28 décembre 2026**, pour un programme de 6 mois qui se termine le 27 juin 2027.
- **Objectif n°1 :** devenir un **athlète explosif** (sprint, détente, puissance de frappe). Muscle, force, perte de gras lente et VO2 max viennent en soutien. Il veut commencer la boxe et le basket.
- **Rythme :** 4 séances d'environ 1 h par semaine.
  - Jours préférés : lundi, mardi, jeudi, dimanche. Le mercredi et le samedi sont souvent possibles.
  - Lieu choisi au jour le jour : salle, maison ou extérieur.
- **Matériel :**
  - **Salle complète :**
    - haltères jusqu'à 60 kg, kettlebells jusqu'à 32 kg (valeur supposée, non confirmée) ;
    - ceinture de lest, machines, vélo d'assaut, rameur, ski-erg ;
    - box, médecine-ball, sac de frappe, traîneau.
  - **Maison :** haltères de 10 kg, roue abdominale, poignées de pompes, tapis, corde à sauter, accessoires d'avant-bras.
  - **Extérieur :** terrain plat, parc de street workout, terrain de basket.
- **Goûts :**
  - il aime les tractions, les dips, les pompes, l'isolation et les machines (on peut aller au maximum sans danger) ;
  - il veut apprendre l'épaulé ;
  - il aime la corde à sauter et le fractionné court.
- **Nutrition :**
  - suivi **simplifié** : calories et protéines en grand ;
  - **sèche lente**, 0,25 % du poids par semaine ;
  - nombre de repas variable ;
  - courses chez Migros, Coop, Lidl, Aldi et Denner ;
  - compléments : protéine, créatine, collagène, potassium ;
  - n'aime pas les fromages forts.
- **Style visuel :** sombre, sobre et haut de gamme, inspiré d'Apple Forme et de Nike Training Club. Accent **orange #FF5A1F**, police Inter.

## 3. Règles de travail imposées par l'utilisateur

1. Répondre **en français**, simplement, et expliquer chaque choix technique en une phrase.
2. **Dire quand une demande est une mauvaise idée.**
3. **Ne rien ajouter hors du cahier des charges sans le proposer d'abord.**
4. **Tout doit être annulable** (bandeau « Annuler », corbeille de 30 jours) et **aucune donnée ne doit être perdue** (export/import, migrations versionnées, copies automatiques).
5. Les données restent **uniquement sur l'iPhone**. L'appli est gratuite, sans coût récurrent, et marche **hors ligne**. Unités : cm, kg, kcal.
6. **Interdit : les outils et skills Bright Data.** Les autres skills sont autorisées si utiles.
7. Vidéos d'exercices :
   - ne jamais inventer de lien ;
   - garder les vidéos PureGym et les autres déjà choisies ;
   - **ne plus proposer de silhouettes animées ni de MuscleWiki** : il les a refusées et trouvées moches.
8. Les allègements, ajustements et rappels sont des **propositions**, jamais imposés.
9. Méthode à chaque étape :
   - tester soi-même (tests automatiques et captures au format iPhone) ;
   - publier ;
   - expliquer à l'utilisateur comment vérifier sur son iPhone ;
   - **attendre son retour** ;
   - tenir `SUIVI.md` à jour.
10. L'utilisateur a autorisé la fusion des pull requests et la publication sur GitHub Pages.

## 4. Ce que fait l'application aujourd'hui

**Aujourd'hui**
- Choix du lieu en 3 pastilles. Le matériel du jour se coche ou se décoche, et la séance se recalcule avec des **remplacements expliqués** (même mouvement, charge adaptée).
- **Séance du jour** tirée du programme :
  - durée estimée, curseur **temps disponible** (la séance se raccourcit par priorité, et ce qui est retiré apparaît barré avec la raison) ;
  - « Changer de séance », « Fatigue ou douleur » ;
  - alertes de récupération (48 h entre deux grosses séances de jambes, pas plus de 3 jours d'affilée).
- Saisie du sommeil en une touche ; sous 6 h, l'appli propose d'alléger les sauts et les sprints.
- **Semaine allégée** conseillée après 3 « trop dur », 2 fatigues signalées ou une stagnation.
- Alertes d'**équilibre musculaire**, avec un exercice à ajouter.
- **Séance libre** : exercices au choix, ou activité (basket, padel… avec la dépense estimée). Elle peut remplacer une séance du programme ou s'y ajouter.
- Bouton « Peser » les jours conseillés.
- **Bilan de la semaine passée**, proposé une fois.
- Rappel de sauvegarde si la dernière date de plus de 7 jours.

**Mode séance (plein écran, écran toujours allumé)**
- Un exercice à la fois, saisie en 2 gestes, rappel de la dernière performance.
- Séries d'échauffement automatiques.
- Exercices enchaînés par paires ou par groupes.
- **Fractionné guidé** : « À FOND », récupération, rounds automatiques, bips.
- Lest facultatif sur les sauts ; tractions et dips lestés.
- Minuteur de repos : son « ambiant » qui ne coupe pas la musique, et **raccourci iOS « Repos »** qui envoie une notification hors de l'appli. C'est la solution retenue ; les notifications par serveur ont été refusées.
- Ressenti après chaque exercice (facile, correct, trop dur), qui règle la charge suivante. Deux « trop dur » d'affilée donnent −10 % et une série de moins.
- Boutons remplacer, fiche (vidéo en boucle sans le son, consignes, erreurs), note, passer, fatigue ou douleur.
- Bandeau « Annuler » qui se ferme en le glissant vers le haut.
- En fin de séance : records avec une animation, et dépense estimée.

**Programme**
- Ligne de temps sur 26 semaines :
  - 2 semaines de reprise ;
  - 4 cycles de 6 semaines (Bases, Force, Puissance, Vitesse), la 6e semaine de chaque cycle étant allégée avec des tests.
- Séances A à D et leur contenu ; statut faite, prochaine, manquée.
- Objectifs mesurables issus des tests, bibliothèque d'environ 100 exercices.
- Fondé sur des sources scientifiques (`docs/audit-programme.md`) : contraste, sprints en mètres, nordic curl, intervalles 4 × 4 min, etc.

**Progrès**
- **Corps** : tendance du poids sur 7 jours, rythme par semaine, courbe avec les pesées en points pâles, tour de taille (facultatif).
- Bilans des semaines, régularité, volume par groupe musculaire, et pour chaque exercice : graphique, records, force relative.
- Historique modifiable.
- **Mode analyse sur Mac**, sur grand écran : tableaux comparatifs.

**Nutrition**
- Jauges (calories en plafond en sèche, protéines en minimum) et journal du jour.
- **Objectif du jour = dépense sans sport (Mifflin-St Jeor × 1,4) + sport du jour (Compendium 2024) − écart de la sèche.**
- **Ajustement automatique** toutes les 2 semaines d'après la courbe de poids, ±150 kcal au plus, proposé et pas imposé. Si le tour de taille baisse et que les performances montent, les calories ne baissent pas.
- **Recherche** :
  - base suisse des valeurs nutritives, intégrée et utilisable hors ligne (1 246 aliments) ;
  - Open Food Facts, pour les produits vendus en Suisse.
- **Scan de codes-barres** : ça marche sur son iPhone, 3 produits sur 4 trouvés. Secours par photo ou par saisie du code. Un produit inconnu devient un aliment personnel.
- Estimation rapide, favoris et récents, repas enregistrés, « Copier la veille ».
- Compléments en un geste, avec « pris » et les jours d'affilée de créatine.
- Idées pour finir ses protéines.

**Profil**
- Mise à jour, guide du raccourci « Repos », son.
- Modules Corps et Nutrition activables.
- Rappels Calendrier.
- Export et import de sauvegarde (vers le Mac par AirDrop ou iCloud Drive), copies automatiques, corbeille.
- « À propos et sources ».

## 5. État d'avancement

- Interview, cahier des charges, puis jalons J0 à J6 : **tous validés par l'utilisateur**.
- **J7** (intelligence et finitions) : publié. Retour de l'utilisateur :
  - le **chrono vidéo de sprint ne fonctionne pas** pour lui ;
  - les **rappels Calendrier ne semblent pas fonctionner** sur son iPhone, mais il n'en veut pas forcément.

  Les deux sont encore dans l'appli. Il faudra lui proposer de les retirer ou de les cacher.
- **Prochaine étape : il va envoyer des tâches d'interface et d'expérience utilisateur (UI/UX).**
- **Questions ouvertes :**
  - schéma du corps dans les fiches : oui ou non ? Il est prévu au cahier des charges mais pas fait, à cause de son avis sur les silhouettes ;
  - poids maximal des kettlebells de la salle ;
  - deux simplifications acceptées : « Changer de séance » au lieu du glisser-déposer dans le Programme, et des valeurs de compléments typiques.

## 6. Limites de l'iPhone à connaître

- Une appli web ne peut pas faire vibrer le téléphone.
- Elle est mise en pause dès qu'elle n'est plus à l'écran : elle ne peut plus sonner.
- Le mode silencieux coupe ses sons.
- D'où le raccourci iOS « Repos » : un raccourci qui attend la durée du repos puis affiche une notification. Il est testé et validé par l'utilisateur, et ne coupe pas la musique.

## 7. Technique (pour une conversation qui travaille sur le code)

- **Outils :**
  - React 18, TypeScript, Vite 6 ;
  - vite-plugin-pwa (appli installable et utilisable hors ligne) ;
  - Dexie 4 (base IndexedDB, actuellement en version 2) ;
  - Vitest et fake-indexeddb (tests unitaires), Playwright (tests de bout en bout) ;
  - @zxing (lecture des codes-barres).
- **Dossiers :** `src/domain/` (règles pures et testées), `src/data/` (accès à la base), `src/ui/` (écrans), `src/platform/` (son, écran allumé, partage).
- **Vérifications avant chaque livraison :**
  - `npx tsc -b`
  - `npx vitest run` (150 tests)
  - `npm run build`
  - `npm run e2e` : 4 parcours au format iPhone, sur la version construite.
- **Publication :** branche de travail → pull request → fusion → GitHub Actions déploie sur GitHub Pages → recaler la branche sur `main`.
- **Format de sauvegarde :** version 2. Les fichiers en version 1 restent lisibles. Toute évolution de la base passe par une nouvelle version Dexie, avec conversion des anciennes données.
