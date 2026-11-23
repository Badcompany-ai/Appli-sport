# Fichier de suivi du projet

Ce fichier permet de reprendre le travail sans perte dans une nouvelle session (cloud ou Mac).
Il est mis à jour à chaque étape importante.

## Où en est-on ?

- Étape 1 — Interview : **terminée** (récapitulatif validé par l'utilisateur le 20/11/2026)
- Étape 2 — Cahier des charges : **validé** le 20/11/2026 (`docs/cahier-des-charges.md`, version 1.1)
- Jalon J0 terminé (direction A, accent orange).
- **Jalon J1 : validé par l'utilisateur le 20/11/2026** (« ça marche bien maintenant »).
- **Jalon J2 : validé par l'utilisateur le 20/11/2026** (vidéos, fiches, notes : « tout fonctionne bien »). Son en mode silencieux : impossible (essai « son prioritaire » échoué puis retiré) ; l'utilisateur remet les vibrations, la notification du raccourci suffit.
- **Jalon J3 : validé** (retours intégrés : reprise renforcée, consultation des séances, audit P1-P9, vidéos PureGym).
- **Jalon J4 : validé le 21/11/2026** (« le reste fonctionne »), avec trois ajouts demandés et publiés le 21/11 (voir D16).
- **Jalon J5 : validé le 22/11/2026** (« c'est pas mal »).
- **Jalon J6 : construit, testé et publié le 22/11/2026, en attente du retour de l'utilisateur.** Voir D18 et D19.
  - Corps (`src/domain/corps.ts`, `src/ui/corps.tsx`) : pesée en 5 secondes (dernier poids prérempli, ±0,1 / ±1 kg), bouton « Peser » sur Aujourd'hui si pas de pesée depuis 2 jours ; tendance = moyenne pondérée des 7 derniers jours (poids 7 → 1) ; rythme = pente de la tendance sur 21 jours (≥ 4 pesées, ≥ 14 jours) ; courbe tendance + pesées en points pâles ; tour de taille (rappel toutes les 4 semaines, « plus tard » = 7 jours) ; présentation neutre. La tendance remplace le poids du profil dans tous les calculs (force relative, poids du corps, nutrition).
  - Nutrition (`src/domain/nutrition.ts`, `src/domain/aliments.ts`, `src/data/nutrition.ts`, `src/ui/screens/Nutrition.tsx`) : jauges calories (plafond en sèche) et protéines en grand, lipides/glucides/fibres en petit ; journal par heure, étiquette facultative, modifier/supprimer avec annulation ; navigation entre les jours ; recherche (vos aliments → base suisse hors ligne → Open Food Facts limité à la Suisse, sur demande) ; scan (ZXing, chargé à la demande ; saisie du code à la main possible) ; produit inconnu ou incomplet → aliment personnel lié au code ; hors ligne → code mis en attente et recherché au retour du réseau ; estimation rapide ; favoris et récents ; repas enregistrés ; copier la veille ; compléments en un geste (protéine 30 g, créatine 5 g, collagène 10 g, potassium) ; réglage du mode (sèche/maintien/prise, lent/modéré) ; explication des objectifs avec sources.
  - Base suisse des valeurs nutritives V 7.1 (OSAV, naehrwertdaten.ch, juillet 2026) : 1 246 aliments dont 149 plats, embarquée (`src/data/aliments-suisses.json`, 137 Ko), source citée dans l'écran (condition de la licence).
  - Open Food Facts (mesuré le 22/11) : environ 8 840 produits Migros, 1 920 Coop, 994 Denner référencés en Suisse ; sur les 40 produits Migros les plus scannés, 40 ont calories et protéines. Correction automatique des kJ saisis comme kcal ; un produit sans protéines ou > 900 kcal/100 g est refusé (saisie de l'étiquette).
  - Règle 7.2 complétée : deux « trop dur » d'affilée → − 10 % et une série de moins.
  - Modules Corps et Nutrition activables dans Profil (rien n'est effacé).
  - Base de données version 2 (tables mesures, journal, aliments, repas) et sauvegarde au format 2 ; les sauvegardes au format 1 restent lisibles.
  - Tests : 135 tests unitaires ; 62 + 37 + 35 vérifications de bout en bout (`e2e/nutrition.mjs`, Open Food Facts simulé).
  - Retour du 23/11 : scan = écran noir sur iPhone ; séance libre introuvable avant le début du programme. Corrigé : la caméra n'est ouverte qu'une fois (elle se relançait à chaque rafraîchissement de l'écran), flux géré directement, message après 5 s, solution de secours « Photographier le code » (appareil photo de l'iPhone, lecture de la photo), saisie manuelle ; « Séance libre » toujours visible. Test ajouté avec un vrai code EAN-13 en image (`e2e/code-test.png`).
  - À faire en J7 : ajustement automatique toutes les 2 semaines (9.3), bilan hebdomadaire, rappels Calendrier.
  - Logique pure dans `src/domain/adaptation.ts` (23 tests) ; données dans `src/data/programme.ts` (`seancesDepuis`, `seriesDepuis`, `donneesAllegement`) ; écrans dans `src/ui/Adaptation.tsx`.
  - Temps disponible (curseur 20-90 min, par jour) : priorité 3 retirée → 1 série de moins en priorité 2 (min 2) → priorité 2 retirée → 1 série de moins en priorité 1 → échauffement raccourci à 5 min ; éléments retirés grisés avec la raison.
  - Séances manquées : la première non faite reste la prochaine ; « Changer de séance » pour en avancer une ; s'il reste moins de jours que de séances, on garde dans l'ordre T1, T2, L, A, C, B, D, E (les autres sont « laissées », pas reportées). Programme : statut « Manquée · à faire » / « Non faite ».
  - Contrôles de récupération (règle 7.4) : séance lourde du bas du corps à moins de 48 h d'une autre (A et C), ou 4e jour d'affilée → alerte, avec « Autre séance » ou « Version allégée » (moitié des séries).
  - Fatigue (avant ou pendant la séance) : − 30 % de séries, charges − 5 %, pas d'effort maximal en sprint ni en saut ; si la séance est déjà allégée, seules les charges baissent.
  - Douleur (épaule, coude, poignet, dos, hanche, genou, cheville, autre) : exercices qui sollicitent la zone remplacés par un équivalent qui l'épargne, sinon retirés ; zone gardée jusqu'à ce qu'on la retire ; message médical fixe. En séance : s'applique aux exercices suivants, avec « Arrêter l'exercice ».
  - Semaine allégée proposée (depuis le lundi) : 3 « trop dur », 2 fatigues, ou 2 exercices principaux qui stagnent sur 3 séances → moitié des séries, mêmes charges ; acceptée ou refusée, annulable.
  - Sommeil (I4, P8) : saisie en une touche ; moins de 6 h → proposition d'enlever un tiers des sauts et sprints (charges inchangées).
  - Séance libre : exercices choisis dans la bibliothèque, ou activité (nom + durée) ; peut remplacer une séance de la semaine.
  - Équilibre : séries difficiles par groupe sur 7 jours (1 principal, ½ secondaire ; cardio et mobilité exclus), repères 10/8/6/4 ; alerte sous la moitié du repère ou à zéro sur 10 jours (après une semaine d'historique), avec « Ajouter [exercice] à la séance du jour » ; volume affiché dans Progrès.
  - « Revenir à la séance complète » annule tous les ajustements du jour.
  - Tests : 106 tests unitaires + 62 vérifications de bout en bout + simulation « semaine chaotique » (`e2e/semaine.mjs`, 37 vérifications, horloge contrôlée du lundi au mardi suivant).
  - Non fait (simplification assumée) : déplacement par glisser-déposer dans Programme (remplacé par « Changer de séance » dans Aujourd'hui) ; règle « 2 fois trop dur d'affilée → − 10 % et une série de moins » (7.2) à faire.
  - Haltères de la salle : 60 kg (l'utilisateur le pense) ; kettlebells : 32 kg gardés en attendant.
  - Séries d'échauffement automatiques (`src/domain/echauffement.ts`) : charge ≥ 40 kg (ou ≥ 60 % du max estimé) → barre à vide ou 30 % × 8, 50 % × 5, 70 % × 3, 85 % × 1, paliers trop proches retirés ; pastilles à cocher, non comptées dans les records.
  - Ressenti après chaque exercice (pendant le repos suivant, ou en fin de séance) ; utilisé pour la charge suivante (trop facile → + 1 ou 2 paliers ; trop dur et répétitions manquées → − 5 % ; trop dur sinon → même charge).
  - Records (`src/domain/records.ts`) : maximum estimé sur la charge totale (poids du corps + lest pour tractions, dips…), meilleure durée, meilleures répétitions ; records battus affichés en fin de séance avec animation (idée I8).
  - Onglet Progrès : régularité (6 semaines), exercices (dernière valeur, tendance, record, force relative), graphique par exercice (`src/ui/Courbe.tsx`, une courbe, point touché = valeur et date), historique modifiable (date, charges, répétitions, durées, résultats, suppression de série ou de séance, avec annulation).
  - Tests : 82 tests unitaires + 61 vérifications de bout en bout.
- Historique J3 :
  - Parcours de départ prérempli avec l'interview (`src/ui/screens/Depart.tsx`, profil dans `src/domain/profil.ts`), modifiable depuis Profil.
  - Programme (`src/domain/programme.ts`) : semaines 1-2 reprise (test léger en semaine 1 à la place de la 4e séance, tests complets T1 athlétiques + T2 force à la place des 2 dernières séances de la semaine 2), puis 4 cycles de 6 semaines (Bases, Force, Puissance, Vitesse), semaine 6 allégée (séries ÷ 2) avec tests. Séances A (explosivité + bas du corps), B (haut du corps + boxe), C (vitesse, appuis, chaîne arrière, épaulé), D (physique + cardio) ; E si 5 séances ; version 3 séances. Échauffement RAMP guidé avant chaque séance. Séance de mobilité de 15 min en option (5 exercices de mobilité ajoutés, vidéos vérifiées).
  - Charges (`src/data/programme.ts`, `src/domain/progression.ts`) : double progression ; si la fourchette de répétitions a changé, recalcul depuis le maximum estimé (Epley) avec 2 répétitions en réserve (3 en reprise) ; sinon « charge à choisir ».
  - Tests de niveau (`src/domain/niveau.ts`) : détente, longueur, sprint 20 m, lancer médecine-ball, navette 20 m avec bips (VO2 max = 6 × vitesse − 24,4), maxima estimés (squat, développé couché, soulevé de terre roumain), répétitions max (tractions, dips, pompes). Résultats tirés de l'historique. Objectifs proposés (gains prudents), acceptés, modifiables, retirables, avec étapes par cycle et barre d'avancement ; ajout des objectifs des nouveaux tests.
  - Prochaine séance = première séance non faite de la semaine (une séance manquée n'est pas perdue). Avant le début (28/12/2026) : séance d'essai ou « Commencer cette semaine ».
  - Tests : 67 tests unitaires + 54 vérifications de bout en bout + parcours scripté d'une séance de tests (résultats → objectifs).
  - Retour utilisateur (20/11) : jours suggérés OK. Demande : consulter le contenu des séances et revenir sur « Commencer cette semaine » → ajouté dans Programme : navigation entre les 26 semaines, détail de chaque séance (échauffement, exercices, séries, charges, repos, consignes), bouton « Remettre le début au lundi 28 décembre ».
  - Retour utilisateur (20/11) : reprise « vraiment trop douce » (a une base sportive) ; cycles jugés « assez chill » mais à évaluer après les avoir faits. → Reprise renforcée : 4 séries pour la force principale, 3 pour le reste, sauts 3×5 + saut en longueur, 6 accélérations, boxe 4 rounds, cardio 8×20 s ; séances de 45 à 55 min (19 à 24 séries) au lieu de 32 à 42 min. Sécurité conservée : 3 répétitions en réserve, pas de sprint au maximum. Test léger complété par du travail du haut du corps et du cardio (47 min). Bloc de bonds ajouté au cycle 1 pour rester plus chargé que la reprise. À réévaluer avec le ressenti réel (jalon J5 : « trop facile » accélère la progression).
  - Son en mode silencieux : confirmé par l'utilisateur, le mode silencieux coupe le bip (type « ambient »). Essai ajouté : option « Son prioritaire (essai) » dans Profil (type d'audio « transient »), à tester par l'utilisateur avec de la musique, en mode silencieux. Rappel : en mode silencieux, la notification du raccourci ne sonne pas non plus ; seule la vibration (si « Vibrer en mode silencieux » est activé dans Réglages, Sons et vibrations) passe.
  - Bibliothèque de 93 exercices (`src/domain/exercices.ts`) classés par mouvement de base, avec qualités, muscles, matériel, difficulté, facteur de charge, consignes, erreurs, variantes plus faciles et plus difficiles.
  - Moteur de remplacement (`src/domain/remplacement.ts`) : même mouvement ou mouvement proche, note = mouvement identique + qualités + muscles + charge réalisable + difficulté + goûts ; charge trop légère → plus de répétitions (formule d'Epley, plafond 15) et descente lente ; aucun équivalent → retiré et séries reportées ; explication en une phrase. Les 10 exemples du cahier des charges (6.4) sont des tests automatiques.
  - Matériel : catalogue et préréglages des 3 lieux (`src/domain/materiel.ts`) ; haltères de la salle supposés jusqu'à 40 kg, kettlebells 32 kg (à confirmer par l'utilisateur, modifiable dans l'application). Lieu choisi sur Aujourd'hui ; matériel modifiable « pour aujourd'hui » ou enregistré comme préréglage.
  - Écrans : choix du lieu, feuille Matériel (recalcul immédiat), « Ce qui a changé », fiches d'exercice, bouton Remplacer en séance (remplacement annulable), bibliothèque avec recherche dans l'onglet Programme.
  - Vidéos : 93 vidéos vérifiées le 20/11/2026 (trouvées par recherche YouTube, titres et chaînes relus, existence et intégration confirmées par le service oEmbed de YouTube) dans `src/domain/videos.ts`. Hôte www.youtube.com ajouté à l'environnement cloud pour cela.
  - Poids du corps fixé à 82 kg (interview) en attendant les pesées (J6).
  - Reste à faire plus tard : schéma du corps coloré dans les fiches (prévu en finitions J7) ; bibliothèque à compléter vers ~150 exercices selon les besoins du programme (J3).
  - Tests : 45 tests unitaires + 40 vérifications de bout en bout, toutes réussies.
- **Jalon J1 : publié le 20/11/2026 sur https://badcompany-ai.github.io/Appli-sport/ (pull request Badcompany-ai/Appli-sport#1 fusionnée, publication réussie). En attente du retour de l'utilisateur sur iPhone.**
  - Contenu : application web installable (React + TypeScript + Vite, fichiers gardés hors ligne par un « service worker »), base IndexedDB (Dexie), séance de démonstration (squat, pompes, gainage), saisie en 1 geste, rappel de la dernière performance, repos automatique (heure de fin stockée → survit à une fermeture), lancement du raccourci « Repos » avec la durée, son « ambiant », écran allumé, note par exercice, annulation 10 s, corbeille 30 jours, export/import avec aperçu et copie de sécurité, copie automatique quotidienne (7 gardées), onglets Programme/Progrès/Nutrition annoncés pour J3/J4/J6.
  - Tests : 19 tests unitaires (`npm test`) + 23 vérifications de bout en bout au format iPhone (`npm run build && npm run e2e`), toutes réussies.
  - Publication : `.github/workflows/pages.yml` publie à chaque mise à jour de `main`. Dépôt public, Pages en mode « GitHub Actions ». Méthode : travailler sur la branche `claude/nifty-brahmagupta-s07s64`, puis pull request vers `main` (l'utilisateur a autorisé la fusion) → publication automatique.
  - **Retour de l'utilisateur (20/11) :** installation OK, raccourci OK (notification à la fin du repos sans couper la musique, sortie de l'application facile), écran allumé OK, reprise après fermeture OK, mode avion OK, export vers le Mac OK, « c'est pile ce qu'il me faut », tailles et lisibilité OK. Deux problèmes : (1) toucher 6, 7, 8 sous le bouton Valider validait directement la série et lançait le repos → corrigé : ces boutons choisissent le nombre, puis « Valider » (2 gestes), boutons − et + ajoutés pour les répétitions ; (2) aucun bip dans l'application → son relancé au retour dans l'application et à chaque toucher, bouton « Tester le son » ajouté ; cause probable : mode silencieux de l'iPhone (iOS coupe les sons « ambiants » en mode silencieux). À reconfirmer par l'utilisateur.
  - Vérifié initialement sur iPhone : installation, mode avion, lancement du raccourci depuis l'application et retour, son mélangé à la musique, écran qui reste allumé.
- Historique J0 (deux directions visuelles)** : maquettes publiées (page privée claude.ai : https://claude.ai/artifact/LoCVjcaC6UEWoSnKY2CRgz ; sources copiées dans `docs/maquettes-J0/`). **Choix fait : direction A, avec l'orange de B (#FF5A1F).** Maquettes A mises à jour.
  - Direction A « Anneaux » : noir pur, police Inter, cartes arrondies, anneaux de progression, accent vert citron #D4FF3A.
  - Direction B « Éditorial » : noir et blanc cassé, titres géants condensés en majuscules (Barlow Condensed), angles droits, filets fins, accent orange #FF5A1F.
- Étape 3 — Construction par jalons : à faire, après accord écrit sur le cahier des charges

## Consignes de départ (résumé)

- Application d'entraînement personnelle, niveau « application du commerce ».
- iPhone pendant la séance (prioritaire), Mac en second.
- Installation sur iPhone sans coût récurrent ; fonctionne sans connexion.
- Français, centimètres, kilos, kilocalories.
- Trois lieux : salle, extérieur, maison.
- Données uniquement sur l'appareil, sauf décision contraire.
- Interdit : outils Bright Data. (Skills : interdiction levée par l'utilisateur le 20/11/2026, à utiliser si utile.)
- Ne rien ajouter hors du cahier des charges validé sans le proposer d'abord.
- La consigne complète d'origine est reproduite dans `docs/consigne-initiale.md`.

## Réponses de l'interview

### Série 1 — Objectifs et niveau
- Objectifs : tous à la fois — prendre du muscle, gagner en force, perdre du gras, endurance. **En plus, et surtout :** devenir un meilleur athlète (sprinter plus vite, sauter plus haut, frapper plus vite et plus fort). Projet : commencer la **boxe** et faire du **basket**.
- Échéance : environ 6 mois.
- Niveau : sportif avec des interruptions — basket pendant des années, puis musculation avec de bons résultats (surtout visuels, et de la force), quasiment arrêté depuis l'été 2026.
- Rythme actuel : aucune séance.

### Série 2 — Priorités et profil athlétique
- Priorité n°1 pour 6 mois : **athlète explosif** (vitesse, détente, puissance de frappe) ; muscle et force en soutien.
- Boxe et basket : pas encore commencés → l'application prépare physiquement.
- Cardio : aime la **corde à sauter**, veut du **fractionné court** (type vélo d'assaut, « assault bike »), **sprints courts** ; souhaite améliorer sa **VO2 max** (capacité maximale à utiliser l'oxygène). Pas de mention de course longue.
- Tests souhaités : détente verticale, sprint chronométré, charges et répétitions, endurance.

### Série 3 — Profil et santé
- 25 ans, homme, 188 cm, environ 82 kg (estimation : **pas de balance** pour l'instant).
- Aucune blessure ni limitation.
- Pas de montre ni de capteur ; envisage une montre bon marché (Noël ou achat personnel).
- Sommeil court (moins de 7 h), travail assis.

### Série 4 — Disponibilité
- **4 séances par semaine**, environ **1 heure** (échauffement et pauses compris), adaptable.
- Jours les plus simples : lundi, mardi, mercredi, jeudi, dimanche ; samedi souvent possible ; peut changer.
- Lieu choisi **au jour le jour**.

### Série 5 — Matériel par lieu
- **Salle** (complète) : barre, rack, banc, disques ; haltères et kettlebells ; machines et poulies ; barre de traction et barres parallèles ; vélo d'assaut / rameur / ski-erg ; box et médecine-ball ; sac de frappe ; traîneau ou zone de gazon.
- **Maison** : haltères ajustables jusqu'à 10 kg (chacun), accessoires d'avant-bras, roue abdominale, poignées de pompes, tapis, corde à sauter.
- **Extérieur** : terrain plat ou piste, parc de street workout, terrain de basket.

### Série 6 — Exercices
- « Fais-moi faire ce qui est le plus approprié. » Aime : **tractions, dips, pompes** (veut aussi progresser dessus), **isolation**, et les exercices **simples à mettre en place**, où l'on peut aller au maximum **sans danger** (d'où son goût pour les **machines**).
- Refuse : aucun exercice.
- Épaulé et haltérophilie : **veut apprendre** (apprentissage progressif).
- Mobilité et gainage : séance courte **un jour de repos**, plus des éléments de mobilité dans **certains échauffements**.

### Série 7 — Suivi et poids
- À suivre : charges, répétitions et records ; performances athlétiques ; cardio. (Régularité **non cochée** : à garder discrète.)
- **Va acheter une balance** ; pesées **2 à 3 fois par semaine**.
- Rapport au poids : le chiffre lui est indifférent, son poids lui convient. Veut une **meilleure silhouette, plus dessinée**, être « le plus optimal possible » **tout en gardant une vie normale**. Pas d'objectif de poids chiffré ; mensurations et photos non choisies à ce stade.

### Série 8 — Silhouette et nutrition
- **Tour de taille** activé (une mesure toutes les 2 semaines). Pas de photos.
- Suivi alimentaire : **oui, simplifié** (calories et protéines surtout, saisie la plus rapide possible).
- Direction : **sèche lente** (perte d'environ 0,25 à 0,5 % du poids par semaine).
- Exclusions : aucune, sauf les **fromages forts** (aime mozzarella, carré frais, Boursin, fromages frais).

### Série 9 — Habitudes alimentaires
- Repères : **calories et protéines en grand**, lipides, glucides et fibres en petit (calculés automatiquement).
- Nombre de repas : **très variable** → ne pas imposer de structure fixe de repas.
- Origine des repas : tout — cuisine maison, cantine ou restaurant, produits emballés, livraison ou restauration rapide → il faut une base d'aliments génériques (plats sans étiquette) **et** le scan de codes-barres.
- Magasins : Migros, Coop, Lidl ou Aldi, Denner ou autre.

### Série 10 — Compléments, appareils, rappels
- Compléments (pris de façon irrégulière) : protéine en poudre, créatine, collagène, potassium.
- Mac : **transfert manuel gratuit** (sauvegarde envoyée de l'iPhone vers le Mac par AirDrop ou iCloud Drive) ; pas de synchronisation en ligne.
- Notifications souhaitées : rappel de séance, rappel de pesée ou de tour de taille, rappel de sauvegarde.
- Fin de repos : veut une **notification ou une vibration**, car il ne sera **pas toujours dans l'application** pendant le repos. À défaut, un **son qui ne coupe pas la musique**.

### Série 11 — Type d'application
- **Web d'abord, enveloppe native ensuite, toujours gratuit.** Préfère la fin de repos par **son et écran** plutôt que payer l'abonnement Apple. L'enveloppe native gratuite (réinstallation tous les 7 jours depuis le Mac) reste une option à rediscuter au jalon du minuteur.
- Mac : MacBook Air 2025, puce M4, macOS 27.2.1 → compatible avec Xcode.
- Montre : « je verrai plus tard » → l'application fonctionne sans montre ; VO2 max estimée par un test.

### Série 12 — Goûts visuels
- Inspirations retenues : **Apple Forme (Fitness)** et **Nike Training Club**. Non retenues : Whoop, Things 3.
- Thème **sombre** ; ambiance **sobre et haut de gamme** ; couleur principale : **à proposer par Claude** dans les deux directions visuelles.

### Série 13 — Démarrage et contenu
- **Date de début : probablement fin décembre 2026**, au moment où il reprend son abonnement de salle. Le développement peut avancer d'ici là.
- **2 semaines de reprise progressive** (avec un test léger : pompes, tractions, gainage), **puis test de niveau complet**.
- Blocs spécifiques : **rounds au sac de frappe**, **vitesse de bras sans sac**, **appuis et changements de direction**, plus du **travail athlétique général** (pas seulement lié à la boxe ou au basket).
- Vidéos : langue indifférente (meilleure démonstration disponible).
- Bilan hebdomadaire : **disponible à l'ouverture de l'application**, sans rappel.

## Décisions prises

- **D1 — Technologie :** une application web installable sur l'écran d'accueil de l'iPhone, qui fonctionne sans connexion, avec le même code réutilisable dans une enveloppe native plus tard. Gratuit, testable visuellement dans la session cloud (navigateur Chromium au format iPhone).
- **D2 — Aucun coût récurrent :** pas d'abonnement développeur Apple.
- **D4 — Fin de repos hors de l'application :** l'utilisateur veut être prévenu même s'il a quitté l'application. Solution retenue (son idée) : au début du repos, l'application web lance le **minuteur intégré de l'iPhone** via un **raccourci de l'app Raccourcis d'Apple** (configuration unique d'environ 2 minutes, guidée). Le minuteur de l'iPhone sonne même écran verrouillé et sans réseau. Dans l'application, son « ambiant » qui se mélange à la musique + écran qui change. Points à vérifier sur son iPhone, car impossibles à tester dans le cloud : retour à l'application après le lancement du raccourci, et effet de la sonnerie du minuteur sur la musique. **Testé dès le premier jalon.** Application native : seulement plus tard, si l'application web parfaite ne suffit pas.
- **D5 — Hébergement :** GitHub Pages ; le dépôt sera rendu public (le code seulement, jamais les données) au jalon J1.
- **D6 — Idées :** acceptées I2 (adaptée : tour de taille facultatif, rappel toutes les 4 semaines au plus), I3, I4, I5, I7, I8, I9, I10 (si version native) ; refusées I1 (vérification avant séance) et I6 (calculateur de disques).
- **D7 — Tour de taille :** mesure jugée contraignante → facultative, peu fréquente.
- **D4 bis — Fin de repos, révision (20/11) :** le minuteur de l'horloge risque de couper la musique, ce que l'utilisateur refuse. Nouvelle piste à tester sur son iPhone **avant** de construire : un raccourci qui **attend la durée du repos, puis fait vibrer le téléphone et affiche une notification** (le son de notification ne coupe pas la musique). Inconnue : iOS laisse-t-il le raccourci tourner en arrière-plan pendant l'attente ? Test manuel de 2 minutes demandé à l'utilisateur. Solution de repli : minuteur de l'horloge (et vérifier s'il coupe vraiment la musique).
- **D4 ter — Fin de repos, DÉCISION FINALE (20/11) :** test réussi sur l'iPhone de l'utilisateur (iOS 27) : un raccourci « Attendre N secondes → Faire vibrer → Afficher la notification » fonctionne hors de l'application et écran verrouillé, **sans couper la musique**. Les vibrations sont désactivées sur son téléphone, la notification lui suffit. → L'application lancera un raccourci « Repos » en lui passant la durée. iOS 27 : l'app Raccourcis ouvre par défaut l'écran « Décrire un raccourci » (Apple Intelligence) ; l'éditeur classique reste accessible.
- **D8 — Style visuel :** direction A « Anneaux » (noir pur, Inter, cartes arrondies, anneaux, gros chiffres) avec la couleur d'accent **orange #FF5A1F** (texte noir sur les boutons orange). Anneaux secondaires : blanc (protéines) et bleu clair #7CC4FF (séances).
- **D9 — Skills autorisées (20/11) :** l'interdiction initiale des skills est levée (« n'hésite pas à les utiliser si nécessaire »). Bright Data reste interdit.
- **D10 — Vidéos (20/11) :** l'utilisateur veut des vidéos **courtes, récentes, qui montrent le mouvement** sans longues explications (animations ou vidéos courtes YouTube acceptées). Exemple jugé mauvais : squat sauté (vidéo trop ancienne). → Reprise complète de la sélection avant J4.
- **D11 — Audit du programme avant J4 (20/11) :** l'utilisateur veut un programme « à la pointe ». Audit fondé sur la littérature, chaque modification proposée avec sa source, à valider point par point.
- **D12 — Vidéos v2 (20/11) :** 98 démonstrations courtes (5 à 60 s), sources MuscleWiki / PureGym / NASM / OPEX / Runna en priorité, vérifiées par oEmbed ; lecture en boucle et sans le son (ne coupe pas la musique) ; vidéos verticales au format du téléphone. Scripts de recherche dans le dossier de travail (non conservés) ; la liste fait foi dans `src/domain/videos.ts`.
- **D13 — Audit du programme accepté (20/11) :** l'utilisateur délègue (« accepte tout ce qui te semble bien et utile ») → P1 à P9 acceptées (`docs/audit-programme.md`). Mis en œuvre : P1 développé incliné en D + bras en B et D (chaque muscle 2×/semaine) ; P2 isolation à 0-1 répétition de l'échec sur la dernière série (hors reprise) ; P3 lancers en rotation dans B à chaque cycle ; P4 contraste dès le cycle 2 (squat → squat jump, développé couché → lancer poitrine, 1 min entre les deux, repos de la série lourde après la paire) ; P5 sprints en mètres (20 à 30 m, 120 à 240 m par séance) + sprint lancé dès le cycle 2 + nordic à chaque cycle (version douce en reprise) ; P6 intervalles longs 4×4 min (cycles 1-2), 5×3 min (cycle 3), 30/30 (cycle 4), en fin de séance ; P7 contacts au sol affichés (reprise 40, C1 57, C2 67, C3 72, C4 79 en séance A) ; P9 enchaînements par deux (`src/domain/enchainement.ts`, testé). **P8 (sommeil < 6 h → proposer d'alléger) reportée au jalon J5** (nécessite la saisie du sommeil). Durées estimées : 47 à 69 min échauffement compris (séance B la plus longue, environ 65 à 69 min ; le jalon J5 « temps disponible » permettra de la raccourcir). Cycle 2 : force principale 4 séries, secondaire 3.
- **D14 — Vidéos v3 (20/11) :** PureGym pour 71 exercices sur 100 (même format) ; les 29 autres (sprints, bonds, boxe, mobilité, lancers, épaulé…) : meilleure démonstration courte vérifiée. Base « free-exercise-db » écartée (photos d'origine commerciale).
- **D16 — Retours J4 (21/11) :** (1) ceinture de lest dans la salle (catalogue + préréglage) → tractions et dips lestés possibles, capacité de lest jusqu'à 60 kg ; (2) fractionné guidé (`Intervalles` dans `ModeSeance.tsx`) pour vélo d'assaut, rameur, ski-erg et rounds de sac : décompte 3-2-1, phase « À FOND » puis récupération, round suivant lancé tout seul, chaque round enregistré automatiquement (l'écran doit rester ouvert, son activé) ; (3) sauts (squat sauté, bonds) : colonne facultative « Lest (haltères) » enregistrée avec la série.
- **D17 — Bandeau « Annuler » (22/11) :** se ferme en le glissant vers le haut (durée de 10 s inchangée sinon). Notifications par serveur (Web Push) proposées pour éviter l'ouverture de Raccourcis : **refusées** par l'utilisateur, on garde le raccourci « Repos » actuel.
- **D18 — Dépense du sport (22/11, idée de l'utilisateur, acceptée) :** les séances et activités enregistrées (basket, padel…) comptent dans la dépense. Valeurs MET du Compendium des activités physiques 2024 (pacompendium.com) : séance de musculation et d'explosivité 5,0 (code 02052), temps de fractionné 8,8 (01305), rounds au sac 9,3 (15125), mobilité 2,3 ; activités : basket match 8,0, basket loisir 6,0, padel 6,0 (pas d'entrée padel : tennis en double 15680), tennis simple 8,0, football 7,0/9,5, course 8,5/10,5, etc. Dépense nette = (MET − 1) × poids × durée. Conséquence sur la règle 9.1 : le niveau d'activité passe de 1,55 (sport compris) à **1,4 hors sport** (FAO/OMS, vie sédentaire), et l'objectif du jour = dépense sans sport + sport du jour + écart visé. Ordre de grandeur inchangé (≈ 2 400 kcal un jour de repos, ≈ 2 730 avec une séance d'une heure, ≈ 3 200 avec 2 h de padel en sèche lente). Une séance oubliée ouverte est plafonnée à 2 h 30.
- **D19 — Séance libre et séance prévue le même jour (22/11) :** une activité qui ne remplace aucune séance n'empêche pas de faire la séance prévue le même jour (vérifié par le test « padel puis séance »).
- **D3 — Données :** uniquement sur l'appareil ; passage vers le Mac par fichier de sauvegarde (AirDrop ou iCloud Drive).

## Questions ouvertes


- J0 : choix entre les deux directions visuelles.
