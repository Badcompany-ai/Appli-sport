# Consigne initiale (copie fidèle de la demande de départ)

# Mission
Tu vas concevoir et développer avec moi une application d'entraînement sportif personnelle. Je vise le niveau d'une vraie application du commerce, pas un prototype. Je ne suis pas développeur : choisis toi-même la meilleure approche technique, et explique-moi chacun de tes choix en une phrase simple, sans jargon ni abréviation non expliquée. Si une de mes demandes te paraît être une mauvaise idée, dis-le et propose mieux.

# Contraintes
- Usage : surtout sur mon iPhone pendant la séance, aussi sur mon Mac.
- L'application doit pouvoir s'installer sur mon iPhone sans coût récurrent. Si une option payante apporte vraiment quelque chose, propose-la sans l'imposer.
- Elle doit fonctionner sans connexion, car le réseau est souvent mauvais en salle.
- Interface en français, taille en centimètres, poids et charges en kilos, énergie en kilocalories.
- Trois lieux d'entraînement : salle de sport, extérieur, maison.
- Mes données restent sur mon appareil, sauf décision contraire de ma part.
- N'utilise aucune skill ni aucun outil Bright Data.

# Inspiration
Je n'ai pas d'application de référence. Pendant l'interview, propose-moi trois ou quatre applications existantes (de sport ou non) dont le style pourrait convenir, en décrivant pour chacune ce qu'on pourrait en reprendre. Je valide ou je refuse, et tu t'appuies sur mes choix pour les deux directions visuelles.

# Étape 1 : interview (avant tout code)
Ne suppose rien sur moi : ni mes objectifs, ni mon niveau, ni mon matériel, ni mes goûts. Interroge-moi autant que nécessaire, sans limite de nombre, par séries courtes regroupées par thème, avec des choix à cocher quand c'est possible. Thèmes à couvrir au minimum : objectifs et échéances, niveau actuel, blessures ou limitations, disponibilité, matériel dans chaque lieu, exercices que j'aime ou que je refuse, ce que je veux suivre, rapport au poids et à la balance (suivi souhaité ou non, objectif éventuel), alimentation (suivi souhaité ou non, habitudes, nombre de repas, aliments exclus ou régime particulier), goûts visuels, besoin ou non de retrouver mes données sur plusieurs appareils. Continue jusqu'à pouvoir décrire l'application sans rien inventer.

# Étape 2 : cahier des charges (avant tout code)
Rédige un cahier des charges dans un fichier : écrans, parcours, règles de calcul, choix techniques et leur justification en mots simples. Appuie les règles d'entraînement et de nutrition sur des principes reconnus et explique chacune en une phrase. Ajoute une section séparée avec tes propres idées de fonctionnalités ; je valide ou refuse chacune. Ne code rien avant mon accord.

# Étape 3 : construction par jalons
- Découpe le travail en jalons que je peux tester sur mon iPhone.
- À chaque jalon : tu testes toi-même, tu me dis comment l'ouvrir sur mon iPhone, tu attends mon retour.
- Guide-moi pas à pas pour l'installer sur mon iPhone.
- Tiens à jour un fichier de suivi (décisions prises, état d'avancement) pour reprendre sans perte dans une nouvelle session, y compris si je passe d'une session dans le cloud à une session sur mon Mac.
- Si tu ne peux pas voir et tester l'application visuellement dans cette session, dis-le-moi avant de commencer la construction.

# Fonctionnalités
1. Objectifs : parcours de départ avec test de niveau, modifiable ensuite ; objectifs mesurables, échéances, étapes intermédiaires et barre de progression.
2. Programme : plan généré à partir de mes réponses (échauffement, exercices, séries, répétitions, repos), organisé en cycles de plusieurs semaines avec un nouveau test à la fin, et qui évolue avec mes résultats.
3. Matériel disponible : liste à cocher avec un préréglage par lieu. Dès que je coche ou décoche, la séance du jour se recalcule : chaque exercice impossible est remplacé par un équivalent qui travaille le même mouvement, et l'application me montre ce qui a changé et pourquoi. Ces remplacements doivent être pertinents ; c'est la fonctionnalité la plus importante.
4. Mode séance : un exercice à la fois, gros boutons, saisie en deux gestes, rappel de ma dernière performance sur cet exercice, minuteur de repos automatique avec son et vibration, chronomètre pour les exercices tenus, écran qui reste allumé, bouton pour remplacer un exercice, note libre par exercice.
5. Suivi : historique modifiable, graphiques par exercice, records personnels, régularité, bilan hebdomadaire.
6. Fiche par exercice : vidéo de démonstration intégrée, consignes courtes, erreurs fréquentes, muscles travaillés, variantes plus faciles et plus difficiles. N'invente jamais un lien de vidéo : vérifie que chaque vidéo existe et correspond à l'exercice ; sinon, affiche un bouton de recherche sur le nom de l'exercice.
7. Suivi du corps (activable ou non dans le profil) :
   - Saisie du poids en quelques secondes, à la fréquence de mon choix.
   - Courbe de tendance lissée sur sept jours, affichée en priorité sur les valeurs brutes.
   - Objectif de poids facultatif : rythme visé, rythme réel, date estimée.
   - Mensurations et photos de progression facultatives, stockées uniquement sur mon appareil.
   - Mon poids est pris en compte dans les exercices au poids du corps (charge totale = poids du corps + lest) et dans un indicateur de force relative (charge soulevée divisée par mon poids).
   - Le bilan hebdomadaire croise l'évolution du poids et celle des performances.
   - Présentation neutre et factuelle, sans jugement.
8. Aides liées aux charges :
   - Estimation de mon maximum sur une répétition à partir de mes séries, avec son évolution dans le temps.
   - Séries d'échauffement proposées automatiquement avant une charge lourde.
9. Adaptation au quotidien :
   - Temps disponible aujourd'hui : la séance se raccourcit en gardant les exercices prioritaires.
   - Ressenti après chaque exercice (trop facile, correct, trop dur), utilisé pour ajuster la séance suivante.
   - Semaine allégée proposée quand mes performances stagnent ou baissent sur plusieurs séances.
   - Séance manquée ou déplacée : la semaine se réorganise sans casser l'équilibre du programme.
   - Fatigue ou douleur signalée : séance allégée ou exercice retiré, sans conseil médical.
   - Séance libre : je peux ajouter un exercice ou enregistrer une séance hors programme.
10. Équilibre : volume hebdomadaire par groupe musculaire, avec une alerte quand un groupe est négligé.
11. Nutrition (activable ou non dans le profil) :
   - Besoins de départ calculés à partir de ma taille, mon poids, mon âge, mon sexe, mon activité et mes séances, pour obtenir mes calories de maintien.
   - Trois modes : prise de masse, maintien, sèche. Je choisis un rythme de variation de poids (lent ou modéré), traduit en surplus ou en déficit de calories. Garde-fous : jamais sous un plancher raisonnable, rythme de perte plafonné, avertissement si mon objectif est irréaliste.
   - Ajustement automatique : toutes les deux à trois semaines, compare la tendance réelle de mon poids (point 7) au rythme visé et recalcule mes calories. Chaque ajustement est expliqué en une phrase.
   - Objectifs journaliers : calories, protéines, lipides, glucides, fibres. Chaque repère est expliqué en une phrase, avec sa source.
   - Journal du jour : une jauge par élément, qui distingue les minimums à atteindre (protéines, fibres) des plafonds (calories en sèche), avec ce qu'il me reste pour la journée.
   - Saisie rapide : recherche d'aliments par nom et scan du code-barres, y compris pour les produits vendus en Suisse ; aliments récents et favoris, repas enregistrés réutilisables, copie d'un repas de la veille, portions en grammes ou en unités, création d'un aliment personnalisé. Les aliments déjà utilisés restent disponibles sans connexion.
   - Le bilan hebdomadaire croise la moyenne des apports, l'évolution du poids et les performances.
   - Ce sont des estimations, pas des prescriptions médicales ; aucun jugement sur ce que je mange.

# Design
Pensé pour le téléphone, à une main, en plein effort : gros chiffres, peu de texte, transitions soignées. Propose-moi deux directions visuelles avant de choisir.

# Qualité exigée
- Aucune donnée perdue : enregistrement à chaque saisie, export et import d'une sauvegarde, et mes données survivent à chaque mise à jour de l'application.
- Toute action peut être annulée ou corrigée (série mal saisie, séance supprimée par erreur, aliment mal enregistré).
- Ouverture quasi instantanée, y compris sans connexion.
- Aucun écran vide ni bouton sans effet ; cas limites gérés (aucun matériel coché, séance interrompue puis reprise, première utilisation, aliment introuvable).
- Les règles de génération, de remplacement, de progression et de nutrition sont testées automatiquement.
- Avant chaque livraison, vérifie : décocher un équipement modifie la séance, une séance enregistrée apparaît dans les graphiques, un repas saisi met à jour les jauges du jour, les données survivent à une fermeture, tout fonctionne sans connexion.
- N'ajoute rien hors du cahier des charges validé ; propose d'abord.
