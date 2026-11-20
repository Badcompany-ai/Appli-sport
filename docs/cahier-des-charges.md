# Cahier des charges — application d'entraînement personnelle

**Version 1.1 — 20 novembre 2026 — validée par l'utilisateur** (hébergement GitHub Pages ; idées I2, I3, I4, I5, I7, I8, I9, I10 acceptées ; I1 et I6 refusées)

Ce document décrit l'application avant toute ligne de code : ce qu'elle fait, ses écrans, ses règles de calcul et les choix techniques. Rien ne sera construit avant votre accord. La partie 11 rassemble mes propres idées, que vous acceptez ou refusez une par une.

Les règles marquées **[Source]** s'appuient sur un principe reconnu en entraînement ou en nutrition. Chacune est expliquée en une phrase.

---

## Sommaire

1. Résumé de votre profil (tiré de l'interview)
2. Choix techniques expliqués simplement
3. Organisation générale et navigation
4. Écrans et parcours
5. Règles d'entraînement
6. Remplacement des exercices selon le matériel (fonction la plus importante)
7. Adaptation au quotidien
8. Suivi du corps
9. Nutrition
10. Qualité, sécurité des données et tests
11. Mes idées de fonctionnalités (à valider une par une)
12. Découpage en jalons
13. Points encore ouverts

---

## 1. Résumé de votre profil

| Thème | Ce que vous avez dit |
|---|---|
| Identité | 25 ans, homme, 188 cm, environ 82 kg (balance à acheter) |
| Passé sportif | Basket pendant des années, puis musculation avec de bons résultats ; quasiment rien depuis l'été 2026 |
| Santé | Aucune blessure ; sommeil souvent inférieur à 7 h ; travail assis |
| Priorité sur 6 mois | **Athlète explosif** : sprint, détente, puissance de frappe, pour préparer boxe et basket |
| Aussi | Silhouette plus dessinée, force, cardio court et intense, meilleure VO2 max |
| Disponibilité | 4 séances d'environ 1 h ; lundi à jeudi et dimanche de préférence, samedi souvent possible ; lieu choisi le jour même |
| Démarrage | Fin décembre 2026 ; 2 semaines de reprise, puis test complet |
| Goûts | Tractions, dips, pompes, isolation, machines ; aucun refus ; veut apprendre l'épaulé |
| Suivi | Charges et records, performances athlétiques, cardio ; tour de taille facultatif et peu fréquent ; pesées 2 à 3 fois par semaine |
| Nutrition | Sèche lente, suivi simplifié ; repas d'origines variées ; pas de fromages forts |
| Style | Sombre, sobre et haut de gamme ; inspirations Apple Forme et Nike Training Club |
| Appareils | iPhone pendant la séance ; Mac pour consulter (transfert manuel) ; aucun coût récurrent |

---

## 2. Choix techniques expliqués simplement

| Choix | Pourquoi, en une phrase |
|---|---|
| **Application web installable** (en anglais « PWA », application web progressive) | C'est un site qu'on ajoute à l'écran d'accueil de l'iPhone : il s'ouvre comme une application, fonctionne sans réseau, ne coûte rien et ne demande aucune réinstallation. |
| **Le même code sur Mac** | Sur votre Mac, la même application s'ouvre dans Safari et peut être ajoutée au Dock, sans rien développer de plus. |
| **Langage TypeScript et bibliothèque React** | Ce sont les outils les plus répandus pour ce type d'application : ils réduisent les erreurs et permettront plus tard, si besoin, de faire une version native avec le même code. |
| **Stockage dans la base de données interne du navigateur** (appelée IndexedDB) | Vos données restent dans l'iPhone, sont enregistrées à chaque saisie et ne partent sur aucun serveur. |
| **Demande de « stockage persistant »** | On demande à l'iPhone de ne jamais effacer ces données de lui-même, même s'il manque de place. |
| **Fichiers mis en mémoire pour l'ouverture hors ligne** (via un « service worker », un petit programme qui garde une copie de l'application) | L'application s'ouvre instantanément, même en mode avion. |
| **Hébergement gratuit** | L'application doit être mise en ligne une fois pour que l'iPhone puisse l'installer. Seul le code est publié, jamais vos données (voir point ouvert n°1). |
| **Tests automatiques** (outils Vitest et Playwright) | Des programmes vérifient à chaque modification que les calculs sont justes et que les parcours principaux fonctionnent, au format iPhone, avec et sans réseau. |

### Contraintes de l'iPhone et solutions retenues

| Contrainte | Solution |
|---|---|
| Une application web est mise en pause dès qu'on la quitte : elle ne peut alors plus sonner. | **Minuteur de l'iPhone via l'app Raccourcis** (votre idée). Au début du repos, l'application lance un raccourci « Repos » avec la durée voulue, et c'est le minuteur de l'horloge qui sonne, même écran verrouillé et sans réseau. La configuration se fait une seule fois, en 2 minutes, avec mon guidage. Deux points seront vérifiés sur votre iPhone dès le premier jalon : le retour vers l'application, et l'effet de la sonnerie sur la musique. |
| Pas de vibration possible dans une application web sur iPhone. | La vibration vient du minuteur de l'iPhone. Dans l'application, on utilise un son et un grand changement de couleur. |
| Les sons de l'application ne doivent pas couper la musique. | Les sons sont joués en mode « ambiant » : ils se mélangent à votre musique au lieu de l'arrêter. |
| Une application web ne peut pas programmer de notification sans serveur. | **Rappels via le Calendrier de l'iPhone** : l'application crée un fichier de calendrier (séances, pesées, tour de taille, sauvegarde) que vous ajoutez en un geste. Le Calendrier se charge ensuite de vous notifier, sans réseau. Il est mis à jour quand le programme change. |
| L'écran doit rester allumé pendant la séance. | L'application demande à l'iPhone de garder l'écran allumé tant que le mode séance est ouvert. |
| Les vidéos YouTube ont besoin de réseau. | Hors ligne, la fiche affiche les consignes écrites, et la vidéo est indiquée comme indisponible. |
| Scanner un code-barres. | L'appareil photo est utilisé directement dans l'application. |

**Version native plus tard ?** Seulement si l'application web, une fois parfaite, ne suffit pas (par exemple si le minuteur via Raccourcis s'avère pénible). Elle réutiliserait le même code.

---

## 3. Organisation générale et navigation

**Barre d'onglets en bas**, à portée de pouce, avec 5 onglets :

1. **Aujourd'hui** — la séance du jour, les jauges du jour, les alertes.
2. **Programme** — le cycle en cours, la semaine, le calendrier des séances.
3. **Progrès** — performances, records, tests, corps, bilans.
4. **Nutrition** — le journal du jour et l'ajout d'aliments (onglet masqué si le module est désactivé).
5. **Profil** — réglages, matériel, modules, données et sauvegardes.

**Principes d'interface**
- Une main, en plein effort : les boutons principaux sont en bas de l'écran et font au moins 56 points de haut.
- Gros chiffres, peu de texte.
- Chaque action destructrice peut être annulée.
- Aucun écran vide : chaque écran sans données explique quoi faire et propose un bouton pour le faire.
- Animations courtes, autour de 200 à 300 millisecondes, et désactivées si le réglage « Réduire les animations » de l'iPhone est actif.
- Textes en français. Unités : centimètres, kilos, kilocalories (abrégé « kcal », toujours écrit en entier au premier affichage).

---

## 4. Écrans et parcours

### 4.1 Première ouverture (parcours de départ)

Environ 5 minutes, et on peut reprendre plus tard si on l'interrompt.

1. **Bienvenue** — ce que fait l'application, et la promesse « vos données restent sur votre téléphone ».
2. **Profil** — âge, sexe, taille, poids (facultatif tant qu'il n'y a pas de balance), sommeil, activité au quotidien.
3. **Objectifs** — priorité (athlète explosif présélectionné selon l'interview, modifiable), qualités secondaires, échéance.
4. **Disponibilité** — nombre de séances, durée habituelle, jours préférés.
5. **Matériel par lieu** — trois listes à cocher (salle, maison, extérieur) préremplies avec vos réponses.
6. **Modules** — suivi du corps (oui ou non), nutrition (oui ou non, complet ou simplifié).
7. **Minuteur iPhone** — guide pas à pas pour créer le raccourci « Repos », avec un bouton d'essai (sonne au bout de 5 secondes). Cette étape peut être passée.
8. **Rappels** — choix des rappels, puis ajout au Calendrier.
9. **Sauvegarde** — explication d'une phrase sur l'export.
10. **Prêt** — affichage de la phase de reprise et de la première séance.

Tout reste modifiable plus tard dans **Profil**.

### 4.2 Aujourd'hui

- **En haut :** la date et un sélecteur de lieu (Salle / Maison / Extérieur) en trois grosses pastilles.
- **Carte « Séance du jour » :**
  - le nom (par exemple « Explosivité bas du corps »), la durée estimée et le nombre d'exercices ;
  - un **curseur « Temps disponible »** (de 20 à 90 minutes) ;
  - les **modifications** depuis la séance prévue, par exemple « 2 exercices remplacés, 1 retiré — Voir pourquoi » ;
  - un gros bouton **Commencer** ;
  - si une séance est interrompue : **Reprendre la séance**, avec l'endroit exact où vous en étiez.
- **Anneaux du jour,** inspirés d'Apple Forme : séances de la semaine (par exemple 2 sur 4), protéines, calories.
- **Saisie express :** un bouton « Peser » (5 secondes) les jours de pesée ; un bouton « Tour de taille » quand il est dû.
- **Alertes discrètes :**
  - un groupe musculaire négligé ;
  - un bilan de la semaine disponible ;
  - une sauvegarde à faire (plus de 7 jours) ;
  - une semaine allégée conseillée.
- **Jour sans séance :** « Repos » et la date de la prochaine séance. Proposition de la courte séance de mobilité. Bouton « Séance libre ».

### 4.3 Matériel du jour

C'est une feuille qui glisse depuis le bas.

- Le préréglage du lieu, avec chaque équipement en case à cocher, groupé par famille (barres, haltères, machines, poids du corps, cardio, athlétisme, boxe).
- **Dès qu'on coche ou décoche, la séance se recalcule.** Un bandeau affiche par exemple : « Squat arrière → Squat bulgare aux haltères — Pas de barre. Même mouvement ; une jambe à la fois pour compenser des haltères légers. »
- Bouton **Enregistrer comme préréglage du lieu**, ou **Pour aujourd'hui seulement** (par défaut).
- Si aucun équipement n'est coché, l'application passe en séance au poids du corps et l'affiche clairement. Ce n'est jamais une erreur.

### 4.4 Aperçu de la séance

- La liste des blocs : échauffement, explosivité, force, complément, cardio ou boxe, retour au calme.
- Pour chaque exercice : séries × répétitions, charge prévue, repos, priorité (1, 2 ou 3).
- Les éléments retirés à cause du temps disponible sont grisés, avec la raison.
- Possibilités :
  - réordonner par glisser-déposer ;
  - remplacer un exercice (liste d'équivalents classés) ;
  - retirer un exercice ;
  - **ajouter un exercice**.

### 4.5 Mode séance (plein écran)

Un exercice à la fois. L'écran reste allumé.

- **En haut :** le nom de l'exercice, et la série en cours (par exemple 2 sur 4).
- **Au centre, très gros :** la charge et les répétitions prévues (par exemple « 60 kg × 6 »).
- **Dessous :** « Dernière fois : 57,5 kg × 6, 6, 5 — il y a 5 jours ».
- **Saisie en deux gestes :**
  - **Valider** en un geste si vous avez fait exactement ce qui était prévu.
  - Sinon, toucher le chiffre à corriger (charge ou répétitions), puis toucher la bonne valeur dans une rangée de choix proches. Les boutons + et − restent disponibles.
  - Les exercices au poids du corps affichent le lest (par exemple « + 0 kg »).
- **Exercices tenus** (gainage, suspension) : un gros bouton démarre un chronomètre, qu'on arrête d'un toucher. Le temps tenu est enregistré.
- **Rounds** (sac de frappe, fractionné) : un minuteur de rounds avec cloche, par exemple 3 minutes d'effort et 1 minute de repos. Annonce « Dernier round ».
- **Sprints et sauts :** saisie du temps ou de la distance si mesurés, sinon simple validation.
- **Après validation d'une série :**
  - le repos démarre automatiquement : décompte géant et fond qui change de couleur à la fin ;
  - un son « ambiant » joue si l'application est à l'écran ;
  - le **minuteur iPhone** est lancé si l'option est activée.
- **Pendant le repos :** boutons « +30 s », « Passer », et aperçu de la série suivante.
- **Après la dernière série d'un exercice :** **Ressenti** en trois gros boutons (Trop facile / Correct / Trop dur), puis passage à l'exercice suivant.
- **Menu de l'exercice :** remplacer, fiche de l'exercice, note libre, signaler une douleur, retirer.
- **Séries d'échauffement** proposées automatiquement avant une charge lourde (règle 5.7). Elles sont marquées « échauffement » et ne comptent pas dans les records.
- **Interruption** (appel, fermeture, batterie) : chaque série est enregistrée dès sa validation, et la séance reprend exactement au même endroit.
- **Annuler** la dernière série saisie : bandeau « Annuler » pendant 10 secondes, puis modification toujours possible depuis l'historique.

### 4.6 Fin de séance

- Durée, volume total (en tonnes soulevées), nombre de séries.
- **Records battus** mis en avant.
- Modifications appliquées à la prochaine séance, expliquées (par exemple « Développé couché : + 2,5 kg la prochaine fois, car toutes les répétitions ont été réussies »).
- Note générale facultative.

### 4.7 Programme

- **Ligne de temps des 6 mois :** reprise, puis cycles 1 à 4, chacun avec sa semaine de test.
- **Semaine en cours :** les 4 séances avec leur statut (faite, à venir, manquée, déplacée). Une séance se déplace par glisser-déposer, et l'application vérifie l'équilibre (règle 7.4).
- **Bouton « Séance libre » :** séance hors programme, en choisissant ses exercices.
- **Bouton « Refaire le test de niveau ».**

### 4.8 Progrès

- **Objectifs :** chaque objectif avec sa barre de progression, ses étapes intermédiaires et son échéance (règle 5.10).
- **Exercices :** liste avec recherche. Pour chaque exercice :
  - graphique du maximum estimé sur une répétition, de la meilleure série ou du temps ;
  - records ;
  - force relative ;
  - historique des séances.
- **Tests athlétiques :** détente, saut en longueur, sprint, lancer de médecine-ball, VO2 max estimée. Comparaison d'un test à l'autre.
- **Cardio :** fractionné (rounds, durée, calories affichées par la machine), corde.
- **Équilibre :** volume de la semaine par groupe musculaire (barres horizontales), avec repère de la zone visée.
- **Régularité :** affichée discrètement (séances faites sur prévues, par semaine).
- **Corps :** voir partie 8.
- **Bilans hebdomadaires :** liste des semaines passées.
- **Historique :** toutes les séances. Chacune est modifiable (série, charge, date) et supprimable, avec une corbeille de 30 jours.

### 4.9 Fiche d'un exercice

- **Vidéo de démonstration intégrée,** uniquement si le lien a été vérifié (règle 10.5). Sinon : bouton « Rechercher une vidéo » qui ouvre YouTube sur le nom de l'exercice.
- 3 à 5 consignes courtes et 2 à 4 erreurs fréquentes.
- Muscles travaillés : schéma du corps avec les zones colorées, et noms des muscles.
- Matériel nécessaire, et mouvement de base (par exemple « charnière de hanche »).
- **Variantes plus faciles et plus difficiles,** touchables pour ouvrir leur fiche.
- Vos statistiques sur cet exercice.

### 4.10 Nutrition

Voir partie 9 pour les écrans détaillés.

### 4.11 Bilan hebdomadaire

Disponible à l'ouverture de l'application une fois la semaine terminée (de lundi à dimanche), sans rappel.

- Séances faites sur prévues, volume, records.
- Évolution des performances clés (maximums estimés, tests).
- **Poids :** variation de la tendance sur 7 jours.
- **Tour de taille,** si mesuré.
- **Nutrition :** moyenne des calories et des protéines des jours saisis, et nombre de jours saisis.
- **Lecture croisée, neutre et factuelle,** par exemple : « Tendance du poids : − 0,2 kg. Tour de taille : − 0,5 cm. Maximums estimés : stables à en hausse. Apports moyens : 2 650 kcal, 158 g de protéines. Cohérent avec le rythme visé. »
- Une recommandation au maximum, par exemple « Semaine allégée conseillée ».

### 4.12 Profil et réglages

- Profil et objectifs, avec relance du parcours de départ.
- Disponibilité et jours préférés.
- Matériel et préréglages des 3 lieux.
- Modules : suivi du corps, nutrition.
- Minuteur iPhone : guide, test, activation.
- Rappels et calendrier.
- **Données :**
  - exporter une sauvegarde (fichier envoyé par AirDrop ou iCloud Drive) ;
  - importer une sauvegarde ;
  - corbeille ;
  - date de la dernière sauvegarde.
- À propos : sources scientifiques, avertissement « estimations, pas de conseil médical ».

---

## 5. Règles d'entraînement

### 5.1 Structure sur 6 mois

| Période | Durée | Contenu principal |
|---|---|---|
| **Reprise** | 2 semaines | Réapprendre les mouvements, charges modérées, sauts faciles, pas de sprint au maximum ; test léger en semaine 1 |
| **Test complet** | fin de la semaine 2 | Voir 5.9 |
| **Cycle 1 — Bases** | 6 semaines | Muscle et force de base, apprentissage de l'épaulé, sauts et sprints en volume modéré |
| **Cycle 2 — Force** | 6 semaines | Charges plus lourdes (3 à 6 répétitions), pliométrie plus intense |
| **Cycle 3 — Puissance** | 6 semaines | Charges légères à moyennes déplacées vite, sauts et lancers, sprints plus longs |
| **Cycle 4 — Vitesse** | 6 semaines | Sprint, détente, changements de direction ; maintien de la force |

- Chaque cycle compte **5 semaines de travail, puis une 6ᵉ semaine allégée** qui se termine par le test de niveau. Total : environ 26 semaines, soit 6 mois.
- **[Source] Périodisation par blocs** (Issurin, 2010) : travailler une qualité dominante par bloc donne de meilleurs résultats chez les sportifs entraînés que tout pousser en même temps.
- **[Source] Reprise progressive :** après plusieurs mois d'arrêt, les tendons se réadaptent plus lentement que les muscles, d'où une montée progressive avant les efforts maximaux (consensus de prévention des blessures, par exemple Gabbett, 2016, sur la hausse brutale de la charge d'entraînement).
- **Évolution avec vos résultats :** à la fin de chaque cycle, les nouveaux résultats de test règlent les charges et les objectifs du cycle suivant. Une qualité restée en retard reçoit un peu plus de volume.

### 5.2 Semaine type (4 séances d'environ 60 minutes)

| Séance | Thème | Exemple de contenu (cycle 1, en salle) |
|---|---|---|
| **A** | Explosivité et force du bas du corps | Sauts sur box, squat arrière, fentes, mollets, gainage |
| **B** | Haut du corps et boxe | Lancers de médecine-ball, développé couché, tractions, dips, élévations latérales, 4 rounds au sac |
| **C** | Vitesse, appuis et chaîne arrière | Sprints de 10 à 30 m, changements de direction, épaulé (apprentissage), soulevé de terre roumain, ischio-jambiers |
| **D** | Physique et cardio | Développé militaire, rowing, isolation des bras et des épaules, fractionné au vélo d'assaut |
| *Facultatif* | Mobilité | 15 minutes à la maison un jour de repos : hanches, chevilles, épaules, colonne |

- **Ordre dans la séance :** échauffement, puis explosivité (sauts, sprints, lancers), puis force, puis compléments et isolation, puis cardio ou boxe, puis retour au calme.
- **[Source]** Les efforts explosifs se font en début de séance, quand le système nerveux est frais (recommandations de l'association américaine de préparation physique, la NSCA, 2016).
- **Jours :** placés de préférence lundi, mardi, jeudi et dimanche, ajustables.
- **[Source]** Les séances qui sollicitent lourdement les mêmes muscles sont espacées d'au moins 48 heures, le délai de récupération habituel d'un muscle après un travail intense.

### 5.3 Échauffement

Il dure environ 8 à 10 minutes et suit la méthode « RAMP » :

1. élever la température (corde à sauter, vélo) ;
2. activer et mobiliser les zones de la séance ;
3. faire monter l'intensité avec des gammes et des sauts légers.

Certains échauffements intègrent le bloc de mobilité que vous avez demandé.

**[Source] Méthode RAMP** (Jeffreys, 2007) : un échauffement progressif et adapté à la séance améliore la performance plus qu'un échauffement générique.

### 5.4 Séries, répétitions, repos

| Qualité | Répétitions | Séries | Repos | Pourquoi |
|---|---|---|---|---|
| Explosivité (sauts, lancers) | 3 à 5 | 3 à 5 | 1 min 30 à 3 min | Chaque répétition doit être maximale ; la fatigue enlève l'effet recherché |
| Sprint | 1 sprint de 10 à 40 m | 4 à 8 | environ 1 min par tranche de 10 m | Une récupération complète garde la vitesse maximale |
| Force | 3 à 6 | 3 à 5 | 2 à 4 min | Les charges lourdes développent la force maximale |
| Muscle | 6 à 15 | 2 à 4 | 1 min 30 à 2 min 30 | Cette zone, proche de l'échec, fait grossir le muscle |
| Isolation | 10 à 20 | 2 à 3 | 1 à 1 min 30 | Charges légères, faible fatigue générale |

- **[Source] Recommandations de l'ACSM** (Collège américain de médecine du sport), 2009 : les charges lourdes et peu de répétitions développent la force ; les charges moyennes et plus de répétitions, le muscle.
- **[Source] Pliométrie** (NSCA) : le volume se compte en « contacts au sol ». Il va d'environ 60 à 80 contacts par séance en reprise, jusqu'à 100 à 120 pour un sportif entraîné.
- **[Source] Volume pour le muscle** (Schoenfeld et collègues, 2017) : environ 10 séries ou plus par groupe musculaire et par semaine donnent plus de résultats que moins de 5. Repère visé : **8 à 14 séries** par grand groupe. C'est un peu moins que le maximum, parce que l'explosivité est prioritaire.
- **Effort :** les séries de force et de muscle s'arrêtent avec environ **1 à 3 répétitions « en réserve »**, sauf demande contraire.
- **[Source] Notion de réserve de répétitions** (Helms et collègues, 2016) : s'arrêter juste avant l'échec donne presque les mêmes gains, avec moins de fatigue et de risque.

### 5.5 Progression des charges

- **Double progression :** pour une fourchette de répétitions (par exemple 6 à 8), on augmente d'abord les répétitions. Quand toutes les séries atteignent le haut de la fourchette, la charge monte et on repart du bas.
  - **[Source] Principe de surcharge progressive** (ACSM, 2009) : on progresse en augmentant peu à peu la difficulté.
- **Paliers de charge :** + 2,5 kg pour le haut du corps, + 5 kg pour le bas du corps à la barre, + 1 à 2 kg aux haltères. Les paliers s'adaptent au matériel disponible (haltères de 10 kg au maximum à la maison).
- **Combinaison avec votre ressenti** (règle 7.2).
- **Poids du corps :** quand le haut de la fourchette est atteint, on ajoute du lest (si une ceinture de lest ou des haltères sont disponibles) ou on passe à une variante plus difficile.
- **Explosivité et sprint :** on ne progresse pas en ajoutant de la charge. On progresse en hauteur, en distance, en complexité de l'exercice (règle 5.4), puis en temps mesuré.
- **Épaulé :** progression technique en étapes (variantes partant de la hauteur des cuisses, puis du sol). La charge n'augmente que si la technique est validée par vous, par la case « Mouvement propre ».

### 5.6 Estimation du maximum sur une répétition

- **Formule d'Epley :** maximum estimé = charge × (1 + répétitions ÷ 30).
- On ne l'applique qu'aux séries de **1 à 10 répétitions**, car au-delà l'estimation devient peu fiable.
- Les séries d'échauffement sont exclues.
- **Valeur de la séance :** la meilleure estimation de la séance. La courbe montre son évolution dans le temps.
- **[Source] Formule d'Epley** (1985) : c'est l'une des formules validées les plus utilisées, précise à quelques pour cent en dessous de 10 répétitions.
- **Charge totale au poids du corps :**
  - tractions, dips, suspensions : poids du corps + lest ;
  - pompes : **64 % du poids du corps** + lest.
  - **[Source]** Mesure d'Ebben et collègues (2011) : lors d'une pompe classique, les mains portent environ 64 % du poids du corps.
- **Poids utilisé :** la tendance la plus récente. Sans pesée, le poids du profil est utilisé et l'application le signale.
- **Force relative :** maximum estimé ÷ poids de tendance, affichée par exemple « 1,4 × votre poids ». C'est une façon courante de comparer la force indépendamment du gabarit.

### 5.7 Séries d'échauffement automatiques

- **Déclenchement :** quand la charge de travail dépasse 60 % du maximum estimé **et** 40 kg, ou toujours pour les exercices de force principaux.
- **Proposition type :**
  - barre à vide (ou 30 %) × 8 ;
  - 50 % × 5 ;
  - 70 % × 3 ;
  - 85 % × 1.
- Les charges sont arrondies aux disques disponibles. On supprime les paliers trop proches.
- **[Source]** Une montée progressive en charge prépare les muscles et le système nerveux sans les fatiguer (pratique standard décrite par la NSCA).

### 5.8 Cardio et VO2 max

- **Fractionné court au vélo d'assaut, au rameur ou à la corde.** Exemples : 10 × (30 secondes d'effort fort, 30 secondes faciles), ou 4 × 4 minutes à effort élevé.
- **[Source] Helgerud et collègues, 2007 :** le fractionné de 4 × 4 minutes améliore nettement mieux la VO2 max qu'un effort continu modéré.
- **Effet d'interférence :** le cardio est limité à 2 blocs de 10 à 20 minutes par semaine. Il est placé après la force, ou un jour différent des sprints.
- **[Source] Wilson et collègues, 2012 :** trop d'endurance freine la force et la puissance. Le vélo freine moins que la course à pied.
- **Boxe :** les rounds au sac comptent comme cardio. La vitesse de bras (boxe dans le vide, lancers) compte comme explosivité.

### 5.9 Tests de niveau

**Test léger** (semaine 1 de reprise, sans effort maximal) : pompes, tractions et dips (répétitions propres, en s'arrêtant 1 à 2 répétitions avant l'échec), gainage (jusqu'à 2 minutes), et une série de 10 répétitions de squat avec une charge confortable. Il sert à régler les premières charges.

**Test complet** (fin de la reprise, puis fin de chaque cycle). L'application choisit les épreuves possibles selon le lieu et le matériel :

| Épreuve | Mesure | Comment |
|---|---|---|
| Détente verticale | cm | Marque au mur bras tendu, puis marque au sommet du saut ; meilleur de 3 essais |
| Saut en longueur sans élan | cm | Meilleur de 3 essais |
| Sprint 20 m départ arrêté | secondes | Chronométré par quelqu'un, ou par vidéo au ralenti (voir idée I3) |
| Lancer de médecine-ball depuis la poitrine | m | Assis ou debout ; indicateur de puissance du haut du corps, utile pour la frappe |
| Force | maximum estimé en kg | Squat, développé couché, soulevé de terre roumain ou tractions lestées : on recherche la charge pour 3 à 5 répétitions, jamais un vrai maximum sur une répétition |
| Tractions, dips, pompes | répétitions | Maximum de répétitions propres |
| VO2 max estimée | ml/kg/min | Test navette de 20 m (l'application joue les bips) ou test de Cooper (12 minutes de course) |

- **[Source] Test navette de Léger** (1988), version adulte : VO2 max ≈ 6,0 × vitesse du dernier palier atteint (km/h) − 24,4.
- **[Source] Test de Cooper** (1968) : VO2 max ≈ (distance parcourue en mètres − 504,9) ÷ 44,73.
- **[Source]** Estimer le maximum à partir de 3 à 5 répétitions est aussi fiable qu'un vrai maximum, avec moins de risque (validé par la formule d'Epley, voir 5.6).

### 5.10 Objectifs mesurables

- Après le premier test complet, l'application **propose** des objectifs à 6 mois, que vous modifiez ou refusez. Exemples pour un sportif qui reprend :

| Qualité | Gain proposé à 6 mois |
|---|---|
| Détente | + 5 à 10 % |
| Sprint 20 m | − 3 à 5 % |
| Maximums de force | + 10 à 20 % |
| Tractions | + 3 à 5 répétitions |
| VO2 max | + 5 à 10 % |
| Tour de taille (si mesuré) | − 2 à 4 cm |

- **Étapes intermédiaires :** une cible par fin de cycle, découpée de façon régulière.
- **Barre de progression :** (valeur actuelle − valeur de départ) ÷ (objectif − départ).
- **[Source]** Les fourchettes s'appuient sur les gains habituels publiés pour des sportifs qui reprennent l'entraînement. Elles sont volontairement prudentes et vous restez libre de les changer.

### 5.11 Bibliothèque d'exercices

- Environ **150 exercices** couvrant les trois lieux.
- Chacun a :
  - son mouvement de base (voir 6.1) ;
  - ses muscles principaux et secondaires ;
  - le matériel requis (avec les alternatives acceptées) ;
  - les qualités travaillées ;
  - sa difficulté (de 1 à 5) ;
  - s'il est chargeable, et de combien ;
  - sa sollicitation des articulations (pour la règle douleur) ;
  - ses consignes, ses erreurs fréquentes, ses variantes plus faciles et plus difficiles, et sa vidéo vérifiée.

---

## 6. Remplacement des exercices selon le matériel

### 6.1 Classement de chaque exercice

Chaque exercice appartient à **un mouvement de base** :

- squat ;
- charnière de hanche (par exemple le soulevé de terre) ;
- fente et travail sur une jambe ;
- poussée horizontale et poussée verticale ;
- tirage horizontal et tirage vertical ;
- saut vertical, saut horizontal, bonds sur une jambe ;
- sprint ;
- changement de direction ;
- lancer ;
- frappe ;
- gainage (anti-extension, anti-rotation) ;
- porter ;
- mollets ;
- isolation par muscle ;
- cardio par intervalles.

**[Source]** Classer les exercices par mouvement de base est la méthode courante en préparation physique (par exemple la NSCA, ou les travaux de Boyle sur l'entraînement fonctionnel). Elle garantit qu'un remplacement entraîne le même geste.

### 6.2 Algorithme de remplacement

Quand un exercice n'est plus possible avec le matériel coché :

1. **Candidats :** tous les exercices du **même mouvement de base** dont le matériel est disponible.
2. **Note de chaque candidat :**
   - même qualité visée (force, puissance, muscle) : poids fort ;
   - muscles principaux en commun : poids fort ;
   - capacité à atteindre la bonne intensité avec le matériel disponible : poids fort. Par exemple, des haltères de 10 kg ne suffisent pas pour un squat de force à 5 répétitions : on préfère alors un exercice sur une jambe ou un exercice explosif ;
   - difficulté technique proche de votre niveau : poids moyen ;
   - votre historique (exercice déjà fait et apprécié) : poids faible ;
   - pas déjà présent dans la séance : obligatoire.
3. **Le meilleur candidat** remplace l'exercice.
   - Les séries et les répétitions sont ajustées si l'équivalent n'est pas assez lourd (par exemple : plus de répétitions, tempo lent, pause).
   - La charge de départ vient de votre historique sur ce nouvel exercice. Sans historique, elle est prudente (environ 3 répétitions en réserve).
4. **Aucun candidat :** on cherche dans un mouvement proche (par exemple un saut horizontal à la place d'un saut vertical). En dernier recours, l'exercice est retiré et ses séries sont ajoutées à un autre exercice de la séance qui travaille les mêmes muscles. Tout est signalé.
5. **Explication affichée,** en une phrase : « [ancien] → [nouveau] : [matériel manquant]. [Pourquoi celui-ci]. »
6. **Recalcul immédiat** à chaque case cochée ou décochée. Les remplacements que vous avez choisis vous-même sont conservés.

### 6.3 Préréglages de matériel par lieu

| Lieu | Matériel |
|---|---|
| **Salle** | Barre et disques, rack, banc réglable, haltères, kettlebells, machines (presse, poulies, machines guidées), barre de traction, barres parallèles, vélo d'assaut, rameur, ski-erg, box, médecine-ball, sac de frappe, traîneau ou gazon |
| **Maison** | Haltères ajustables (jusqu'à 10 kg), accessoires d'avant-bras, roue abdominale, poignées de pompes, tapis, corde à sauter |
| **Extérieur** | Terrain plat ou piste (30 m au moins), parc de street workout (barre fixe, barres parallèles, espaliers), terrain de basket |

### 6.4 Exemples de remplacements attendus (vérifiés par les tests)

| Exercice prévu | Situation | Remplacement attendu |
|---|---|---|
| Squat arrière à la barre | Maison | Squat bulgare aux haltères (plus de répétitions ou tempo lent) |
| Saut sur box | Maison | Saut vertical sans box (squat jump) |
| Développé couché | Maison | Pompes sur poignées, lestées ou pieds surélevés |
| Tractions | Maison (pas de barre) | Rowing aux haltères sur un bras, ou tirage au sol |
| Vélo d'assaut en fractionné | Maison | Corde à sauter en fractionné |
| Vélo d'assaut en fractionné | Extérieur | Sprints en navette |
| Rounds au sac | Maison ou extérieur | Rounds de boxe dans le vide (avec haltères légers si présents) |
| Lancer de médecine-ball | Extérieur | Pompes explosives, ou lancer avec un ballon de basket |
| Traîneau | Extérieur | Sprints en côte, ou départs en position basse |
| Aucun matériel coché | Partout | Séance entièrement au poids du corps, même équilibre de mouvements |

---

## 7. Adaptation au quotidien

### 7.1 Temps disponible aujourd'hui

- **Durée de chaque exercice :** séries × (temps d'effort + repos), plus 1 minute d'installation. L'échauffement compte, et le retour au calme dure 3 minutes.
- **Chaque exercice a une priorité :**
  - **1** : le travail principal du cycle (explosivité et force principale) ;
  - **2** : les exercices de soutien ;
  - **3** : l'isolation et les compléments.
- **Si le temps disponible est inférieur à la durée prévue, on retire dans cet ordre :**
  1. les exercices de priorité 3 ;
  2. une série de chaque exercice de priorité 2 (sans descendre sous 2 séries) ;
  3. les exercices de priorité 2 ;
  4. une série de chaque exercice de priorité 1 (sans descendre sous 2 séries) ;
  5. l'échauffement se raccourcit au minimum (5 minutes) mais n'est jamais supprimé.
- **Le cardio** est de priorité 2 ou 3 selon le cycle.
- **Le reste est grisé,** avec la raison affichée.
- **[Source]** Garder l'essentiel et retirer le complémentaire maintient l'effet d'entraînement : le travail principal porte l'essentiel du résultat (principe de spécificité).

### 7.2 Ressenti après chaque exercice

| Ressenti | Effet sur la séance suivante pour cet exercice |
|---|---|
| **Trop facile** | Progression accélérée : un palier de charge en plus, ou + 2 répétitions si la charge est au maximum disponible |
| **Correct** | Double progression normale (5.5) |
| **Trop dur** | Charge conservée si toutes les répétitions ont été faites. Sinon − 5 % (arrondi au disque disponible) |
| Deux fois **trop dur** d'affilée | − 10 % et une série de moins, avec explication |

**[Source] Autorégulation** (Helms et collègues, 2018 ; Mann et collègues, 2010) : ajuster la charge selon l'effort ressenti donne d'aussi bons résultats, ou de meilleurs, qu'un plan rigide.

### 7.3 Semaine allégée

- **Proposée quand :**
  - le maximum estimé ou les répétitions **stagnent ou baissent sur 3 séances d'affilée** sur au moins 2 exercices principaux ;
  - **ou** au moins 3 ressentis « trop dur » dans la même semaine ;
  - **ou** une fatigue est signalée 2 fois dans la semaine.
- **Contenu :** volume réduit d'environ 40 à 50 % (moins de séries). Les charges restent stables, et il n'y a pas de sprint ni de saut au maximum.
- **C'est une proposition :** vous acceptez ou refusez.
- **[Source] Consensus sur l'allègement** (Bell et collègues, 2023) : réduire le volume pendant une semaine permet de récupérer sans perdre ses acquis.

### 7.4 Séance manquée ou déplacée

- **Les séances suivent un ordre** (A, B, C, D). Une séance manquée n'est pas perdue : elle devient la prochaine séance.
- **En fin de semaine,** s'il reste moins de jours que de séances, on garde les séances de priorité la plus haute pour le cycle. Les séances perdues ne s'empilent pas : la semaine suivante repart normalement.
- **Contrôles lors d'un déplacement :**
  - pas deux séances lourdes du bas du corps à moins de 48 heures d'écart ;
  - pas plus de 3 jours d'entraînement d'affilée ;
  - si un contrôle n'est pas respecté, l'application propose un autre jour ou une version allégée.
- **[Source]** Respecter environ 48 heures de récupération entre deux sollicitations lourdes des mêmes muscles (ACSM, 2009).

### 7.5 Fatigue ou douleur signalée

- **Fatigue** (avant ou pendant la séance) : volume réduit de 30 %, pas d'effort maximal en sprint ni en saut, charges à − 5 %.
- **Douleur :** vous touchez une zone sur un schéma du corps (épaule, coude, poignet, dos, hanche, genou, cheville, autre).
  - Les exercices qui sollicitent cette zone sont retirés pour la séance, ou remplacés par des exercices qui ne la sollicitent pas.
  - La zone reste signalée jusqu'à ce que vous la retiriez.
- **Message fixe :** « L'application ne donne pas de conseil médical. Si une douleur persiste ou est vive, consultez un professionnel de santé. »

### 7.6 Séance libre

- On choisit des exercices dans la bibliothèque ou on enregistre une activité (par exemple « basket entre amis, 1 h »).
- Le tout est compté dans l'historique et dans le volume par muscle.
- Elle ne décale pas le programme, sauf si vous dites qu'elle remplace une séance.

### 7.7 Équilibre musculaire

- **Volume de la semaine** = séries difficiles par groupe musculaire. Un muscle principal compte 1 série, un muscle secondaire compte ½ série. Les séries d'échauffement ne comptent pas.
- **Groupes suivis :** pectoraux, dos, épaules, biceps, triceps, avant-bras, abdominaux et gainage, fessiers, quadriceps, ischio-jambiers, mollets.
- **Alerte** quand un groupe est sous la moitié de son repère sur les 7 derniers jours, ou à zéro sur 10 jours, avec une suggestion. Par exemple : « Ischio-jambiers : 2 séries cette semaine. Suggestion : ajouter un exercice à la séance C. »
- **[Source]** Volume par groupe musculaire (Schoenfeld et collègues, 2017), voir 5.4.

---

## 8. Suivi du corps (module activable)

- **Pesée en 5 secondes :** le dernier poids est prérempli, on ajuste avec + et − ou une roue, puis on valide. Fréquence réglée à 2 à 3 fois par semaine, avec rappels au Calendrier.
- **Tendance lissée sur 7 jours,** affichée en premier et en gros. Les pesées brutes apparaissent en petits points pâles.
  - **Calcul :** moyenne des pesées des 7 derniers jours, en donnant plus de poids aux pesées les plus récentes.
  - **[Source]** Le poids varie de 1 à 2 kg d'un jour à l'autre (eau, sel, repas). Une moyenne sur une semaine montre la vraie direction.
- **Rythme réel :** pente de la tendance sur les 14 à 21 derniers jours, en kg par semaine et en % du poids.
- **Objectif de poids :** facultatif (pas d'objectif choisi pour l'instant). S'il est activé : rythme visé, rythme réel, date estimée.
- **Tour de taille :**
  - **facultatif et peu fréquent** : rappel toutes les 4 semaines au plus, que l'on peut ignorer ou désactiver (l'utilisateur trouve la mesure contraignante) ;
  - saisi mesuré au niveau du nombril, debout et détendu, le matin ;
  - graphique ;
  - c'est **l'indicateur principal de silhouette** dans les bilans.
- **Autres mensurations et photos :** désactivées, activables plus tard. Les photos sont stockées uniquement sur l'appareil.
- **Poids dans les calculs :** charge totale au poids du corps et force relative (5.6).
- **Présentation neutre :** pas de couleur rouge ou verte pour une hausse ou une baisse de poids, pas de mot évaluatif. Seulement des chiffres et des flèches.

---

## 9. Nutrition (module activable — mode simplifié choisi)

### 9.1 Calcul des besoins de départ

1. **Métabolisme de base,** formule de Mifflin-St Jeor : 10 × poids (kg) + 6,25 × taille (cm) − 5 × âge + 5 (homme).
   - **[Source] Mifflin-St Jeor** (1990) : c'est la formule la plus fiable chez l'adulte selon l'Académie américaine de nutrition et de diététique (2005).
   - *Votre cas, avec 82 kg :* 820 + 1 175 − 125 + 5 = **1 875 kcal**.
2. **Calories de maintien** = métabolisme de base × niveau d'activité. Pour un travail assis avec 4 séances par semaine, le niveau est 1,55.
   - **[Source] Niveaux d'activité de la FAO et de l'OMS** (2004) : un travail assis avec de l'exercice régulier correspond à environ 1,55.
   - *Votre cas :* 1 875 × 1,55 ≈ **2 900 kcal**. Ce n'est qu'un point de départ, corrigé ensuite par la réalité (9.3).

### 9.2 Mode et rythme

| Mode | Rythme lent | Rythme modéré |
|---|---|---|
| **Sèche** (choisi : lent) | − 0,25 % du poids par semaine | − 0,5 % par semaine |
| Maintien | 0 | 0 |
| Prise de masse | + 0,25 % par semaine | + 0,5 % par semaine |

- **Conversion :** 1 kg de variation ≈ 7 700 kcal. Écart journalier = variation hebdomadaire × 7 700 ÷ 7.
  - *Votre cas, sèche lente :* 0,25 % × 82 = 0,2 kg par semaine, soit environ **− 225 kcal par jour**, donc environ **2 680 kcal**.
- **[Source] Garthe et collègues** (2011) : chez les sportifs, une perte lente (environ 0,7 % par semaine ou moins) préserve mieux la force et le muscle qu'une perte rapide.
- **[Source] Iraki et collègues** (2019) : une prise de masse lente limite le gain de gras.
- **Garde-fous :**
  - **Plancher :** les calories visées ne descendent jamais sous le métabolisme de base estimé, ni sous 1 500 kcal pour un homme. On prend la plus haute des deux valeurs.
  - **Rythme de perte plafonné** à 1 % du poids par semaine.
  - **Avertissement d'objectif irréaliste** (par exemple, perdre plus de 1 % par semaine pour tenir une date) : le message explique le problème et propose une date réaliste.
  - **[Source]** Helms et collègues (2014) recommandent de rester entre 0,5 et 1 % par semaine au maximum chez le sportif pour limiter la perte de muscle.

### 9.3 Ajustement automatique

- **Tous les 14 jours,** avec au moins 4 pesées sur la période. Sinon l'ajustement est reporté, avec un message.
- **Rythme réel** = pente de la tendance (8).
- **Écart** = rythme réel − rythme visé, en kg par semaine. Correction = écart × 7 700 ÷ 7.
- **Limites de la correction :**
  - **150 kcal au maximum** par ajustement ;
  - aucune correction si l'écart est inférieur à 0,1 kg par semaine (bruit normal) ;
  - les garde-fous de 9.2 s'appliquent toujours.
- **Explication en une phrase,** par exemple : « Ces 2 semaines, votre tendance a baissé de 0,05 kg par semaine au lieu de 0,2 : objectif ajusté de − 150 kcal, soit 2 530 kcal. »
- **Proposition, pas imposition :** vous acceptez ou gardez l'ancien objectif.
- **[Source]** C'est la méthode des calculateurs adaptatifs : la réalité mesurée corrige l'estimation théorique, qui peut se tromper de 10 % ou plus d'une personne à l'autre.

### 9.4 Objectifs journaliers

| Élément | Règle | Votre cas (sèche lente) | Type | Source, en une phrase |
|---|---|---|---|---|
| **Calories** | 9.1 à 9.3 | ≈ 2 680 kcal | **Plafond** en sèche ; cible en maintien ; minimum en prise de masse | Bilan énergétique : on perd du poids quand on dépense plus qu'on ne mange |
| **Protéines** | 2,0 g par kg en sèche ; 1,8 g par kg sinon | ≈ 164 g | **Minimum** | Morton et collègues (2018) : les gains plafonnent vers 1,6 g par kg ; on vise plus haut en déficit pour protéger le muscle (Helms, 2014) |
| **Lipides** | 25 % des calories, jamais sous 0,6 g par kg | ≈ 74 g | Repère | L'agence européenne de sécurité des aliments (EFSA) recommande 20 à 35 % des calories en lipides |
| **Glucides** | Le reste des calories | ≈ 338 g | Repère | Les glucides alimentent les efforts intenses ; 3 à 5 g par kg suffisent pour un entraînement modéré (ISSN, Société internationale de nutrition sportive) |
| **Fibres** | 30 g | 30 g | **Minimum** | L'Agence française de sécurité sanitaire de l'alimentation (ANSES) et la Société suisse de nutrition recommandent au moins 30 g par jour |

Chaque repère s'affiche avec sa phrase d'explication et sa source quand on touche le petit « i ».

### 9.5 Journal du jour

- **Deux grandes jauges :** calories et protéines. **Trois petites :** lipides, glucides, fibres.
- **Minimums** (protéines, fibres) : la jauge se remplit vers la cible, avec le texte « Encore 42 g ».
- **Plafonds** (calories en sèche) : la jauge montre ce qui reste, avec le texte « Il reste 650 kcal ». Un dépassement est affiché simplement en chiffres, sans couleur d'alarme.
- **Pas de repas imposés,** puisque leur nombre varie : les aliments sont rangés par heure d'ajout. On peut leur donner une étiquette (matin, midi, soir, collation) si on le souhaite.
- **Modifier, supprimer ou annuler** n'importe quel aliment (annulation pendant 10 secondes, puis corbeille).
- **Ton neutre :** aucun jugement, aucune note sur les aliments.

### 9.6 Saisie rapide

- **Recherche par nom :**
  - d'abord dans vos aliments déjà utilisés ;
  - puis dans la **base suisse des valeurs nutritives** (en français, intégrée à l'application, donc disponible hors ligne), qui contient aussi des plats courants ;
  - puis, si le réseau est disponible, dans **Open Food Facts**, la base libre de produits emballés.
- **Scan du code-barres :**
  - recherche dans Open Food Facts, qui couvre de nombreux produits vendus en Suisse ;
  - la couverture des marques propres de Migros, Coop, Lidl, Aldi et Denner sera mesurée sur un échantillon réel avant livraison ;
  - **hors ligne,** les codes déjà scannés sont reconnus. Un code nouveau est mis en attente et recherché au retour du réseau, ou saisi à la main.
- **Produit introuvable :** création d'un aliment personnalisé à partir de l'étiquette (calories et protéines pour 100 g obligatoires ; lipides, glucides et fibres facultatifs). Il est lié au code-barres pour les fois suivantes.
- **Estimation rapide** pour un restaurant ou une livraison : on saisit directement les calories et les protéines, ou on choisit un plat type (par exemple « burger et frites ») dans une liste de plats courants.
- **Aliments récents et favoris** en tête de liste.
- **Repas enregistrés** (par exemple « mon petit-déjeuner »), ajoutables en un geste.
- **Copier un repas de la veille.**
- **Portions** en grammes ou en unités (1 œuf, 1 pot, 1 portion), avec les unités propres à chaque aliment.
- **Compléments en un geste** (protéine en poudre, créatine, collagène, potassium) depuis une rangée de raccourcis.
- **Tous les aliments utilisés** sont gardés sur l'appareil, donc disponibles sans connexion.

### 9.7 Bilan croisé

Voir 4.11 : moyenne des apports des jours saisis, tendance du poids, tour de taille et performances.

**Avertissement fixe :** « Estimations, pas des prescriptions médicales. »

---

## 10. Qualité, sécurité des données et tests

### 10.1 Aucune donnée perdue
- Enregistrement immédiat à chaque saisie, sans bouton « enregistrer ».
- Stockage persistant demandé à l'iPhone.
- **Copies automatiques internes :** une copie complète par jour est gardée sur l'appareil, sur les 7 derniers jours, pour revenir en arrière en cas de problème.
- **Export** d'un fichier de sauvegarde, envoyé par AirDrop, iCloud Drive ou e-mail via le menu de partage de l'iPhone. **Import** avec aperçu avant remplacement (« 54 séances, 120 pesées... »). L'import fait d'abord une copie de sécurité des données actuelles.
- **Rappel d'export** si la dernière sauvegarde a plus de 7 jours (bandeau, et Calendrier si activé).
- **Mises à jour :** chaque changement de structure des données est accompagné d'un convertisseur testé automatiquement. Une mise à jour ne s'installe qu'au prochain lancement, jamais en pleine séance.

### 10.2 Tout est annulable
- Bandeau « Annuler » pendant 10 secondes après chaque action importante.
- **Corbeille de 30 jours** pour les séances, les aliments, les pesées et les exercices personnalisés.
- Historique entièrement modifiable.

### 10.3 Rapidité
- Ouverture en moins d'une seconde, y compris hors ligne, grâce aux fichiers gardés sur l'appareil.
- Des tests automatiques vérifient le temps d'ouverture.

### 10.4 Cas limites gérés
- Première utilisation : chaque écran explique quoi faire.
- Aucun matériel coché : séance au poids du corps.
- Séance interrompue : reprise au même endroit.
- Pas de pesée : calculs avec le poids du profil, signalé.
- Aliment introuvable : création d'un aliment personnalisé.
- Pas de réseau : vidéos remplacées par les consignes ; codes-barres mis en attente.
- Changement d'heure, séance à cheval sur minuit, saisie de valeurs aberrantes (par exemple 820 kg au lieu de 82) : l'application demande une confirmation.

### 10.5 Vidéos vérifiées
- Chaque lien de vidéo est vérifié avant livraison : la vidéo existe, elle peut être intégrée, et son titre et son contenu correspondent à l'exercice.
- Les liens retenus sont listés dans un fichier de contrôle, avec la date de vérification.
- **Aucun lien inventé :** sans vidéo vérifiée, la fiche affiche le bouton « Rechercher une vidéo ».

### 10.6 Tests automatiques
- **Règles testées :**
  - génération du programme ;
  - remplacement (dont tous les exemples de 6.4) ;
  - progression et ressenti ;
  - maximum estimé et échauffements ;
  - temps disponible ;
  - séance manquée ;
  - allègement ;
  - équilibre ;
  - tendance du poids ;
  - besoins, garde-fous et ajustement de la nutrition.
- **Vérifications avant chaque livraison,** au format iPhone, faites automatiquement puis par captures d'écran :
  1. décocher un équipement modifie la séance ;
  2. une séance enregistrée apparaît dans les graphiques ;
  3. un repas saisi met à jour les jauges du jour ;
  4. les données survivent à une fermeture ;
  5. tout fonctionne sans connexion.
- **Ce que je ne peux pas tester moi-même :** le raccourci Minuteur, le Calendrier, l'appareil photo et le comportement exact de Safari sur iPhone. Je vous donne une courte liste d'essais à faire sur votre iPhone à chaque jalon.

---

## 11. Mes idées de fonctionnalités (à valider une par une)

Ces fonctionnalités **ne seront construites que si vous les acceptez**. Répondez par oui ou par non pour chacune.

| N° | Idée | Ce que ça apporte |
|---|---|---|
| **I1** ❌ refusée | **Vérification express avant la séance** : 3 touches (sommeil, courbatures, énergie) | Avec un sommeil souvent court, cela permet d'alléger automatiquement les jours « sans », au lieu d'attendre l'échec en cours de séance |
| **I2** ✅ (adaptée) | **Silhouette avant la balance** : si une mesure récente du tour de taille montre une baisse et que les performances montent, l'ajustement des calories ne réduit pas davantage, même si le poids stagne. **Sans mesure récente, la règle ne s'applique pas** : rien n'oblige à mesurer. | C'est le signe d'une recomposition (moins de gras, plus de muscle), exactement votre objectif ; inutile de manger moins |
| **I3** ✅ | **Chronométrage du sprint par vidéo** : vous filmez au ralenti, vous touchez l'image du départ puis celle de l'arrivée, et l'application calcule le temps | Mesurer un sprint seul, précisément, sans chronométreur |
| **I4** ✅ | **Suivi du sommeil simplifié** : heures dormies saisies en une touche le matin, croisées avec les performances dans le bilan | Voir concrètement l'effet du sommeil sur vos résultats |
| **I5** ✅ | **Idées pour finir ses protéines** : « Il vous reste 40 g : par exemple 250 g de skyr, ou un shaker de protéine », pris dans vos favoris | Atteindre l'objectif sans réfléchir |
| **I6** ❌ refusée | **Calculateur de disques** : « 60 kg = barre de 20 kg + de chaque côté : 15 + 5 » | Gain de temps en salle |
| **I7** ✅ | **Case « compléments pris »** : un geste par jour (créatine, etc.) | La créatine agit seulement si elle est prise chaque jour ; utile vu une prise irrégulière |
| **I8** ✅ | **Célébration des records** : animation courte et sobre quand un record tombe | Motivation, dans le style Apple Forme |
| **I9** ✅ | **Mode analyse sur Mac** : graphiques plus grands et tableaux comparatifs sur grand écran | Profiter du Mac pour analyser vos données |
| **I10** ✅ (seulement si version native un jour) | **Lecture de l'app Santé d'Apple** (seulement si on passe un jour à la version native) | Récupérer automatiquement poids, sommeil et VO2 max si vous achetez une Apple Watch ou une balance connectée |

---

## 12. Découpage en jalons

À chaque jalon :
- je teste moi-même (tests automatiques et captures au format iPhone) ;
- je vous envoie le lien et une courte liste d'essais à faire sur l'iPhone ;
- j'attends votre retour avant de continuer.

| Jalon | Contenu | Ce que vous pourrez tester sur l'iPhone |
|---|---|---|
| **J0 — Directions visuelles** | 2 maquettes cliquables (écran Aujourd'hui, mode séance, minuteur de repos, journal nutrition) | Choisir une direction |
| **J1 — Socle et minuteur** | Installation sur l'écran d'accueil, fonctionnement hors ligne, stockage, export et import, mode séance de démonstration, minuteur de repos, **raccourci Minuteur iPhone** | Installer l'application ; vérifier le minuteur hors de l'application et l'effet sur la musique ; mode avion |
| **J2 — Exercices et matériel** | Bibliothèque d'exercices, fiches et vidéos vérifiées, préréglages par lieu, **moteur de remplacement** | Cocher et décocher du matériel et juger les remplacements |
| **J3 — Programme** | Parcours de départ, génération du programme, reprise, cycles, tests de niveau, objectifs | Créer votre profil ; voir votre vrai programme |
| **J4 — Séance complète et suivi** | Saisie en 2 gestes, dernière performance, échauffements, ressenti, historique modifiable, graphiques, records, maximum estimé, force relative | Faire une vraie séance de bout en bout |
| **J5 — Adaptation** | Temps disponible, séance manquée ou déplacée, allègement, fatigue et douleur, séance libre, équilibre | Simuler une semaine chaotique |
| **J6 — Corps et nutrition** | Pesée, tendance, tour de taille, journal, recherche, scan, aliments personnels, repas enregistrés | Scanner vos produits Migros, Coop, etc. |
| **J7 — Intelligence et finitions** | Besoins et ajustement automatique, bilan hebdomadaire croisé, rappels Calendrier, idées acceptées, finitions et animations | Utilisation réelle pendant quelques jours |

**Objectif :** une application complète et testée **avant votre reprise de fin décembre**. Les jalons sont ordonnés pour que vous puissiez commencer avec J1 à J5 si J6 et J7 prennent plus de temps.

---

## 13. Points encore ouverts

1. ~~Hébergement~~ → **décidé : GitHub Pages** (dépôt rendu public au jalon J1, guidage pas à pas).
- *Ancien texte de la question :*
1. **Hébergement de l'application (gratuit).**
   - Pour que l'iPhone l'installe, le code doit être en ligne. Vos données n'y sont jamais.
   - **Option A (recommandée) :** GitHub Pages. C'est le plus simple, mais il faut rendre le dépôt de code **public**, sauf si votre compte GitHub a une offre qui permet les pages privées. N'importe qui pourrait alors lire le code, mais pas vos données.
   - **Option B :** Cloudflare Pages, gratuit avec le dépôt privé. Il demande de créer un compte Cloudflare (5 minutes, je vous guide).
   - **Question :** préférez-vous A ou B ?
2. ~~Validation des idées~~ → faite (voir partie 11).
3. ~~Validation globale~~ → faite le 20/11/2026.
