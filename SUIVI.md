# Fichier de suivi du projet

Ce fichier permet de reprendre le travail sans perte dans une nouvelle session (cloud ou Mac).
Il est mis à jour à chaque étape importante.

## Où en est-on ?

- Étape 1 — Interview : **terminée** (récapitulatif validé par l'utilisateur le 20/11/2026)
- Étape 2 — Cahier des charges : **validé** le 20/11/2026 (`docs/cahier-des-charges.md`, version 1.1)
- Jalon J0 terminé (direction A, accent orange).
- **Jalon J1 : validé par l'utilisateur le 20/11/2026** (« ça marche bien maintenant »).
- **Jalon J2 : construit, testé et publié le 20/11/2026, en attente du retour de l'utilisateur.**
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
- Interdit : skills et outils Bright Data.
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
- **D3 — Données :** uniquement sur l'appareil ; passage vers le Mac par fichier de sauvegarde (AirDrop ou iCloud Drive).

## Questions ouvertes


- J0 : choix entre les deux directions visuelles.
