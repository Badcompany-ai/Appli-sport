// Bibliothèque d'exercices (cahier des charges, parties 5.11 et 6.1).
// Chaque exercice appartient à un mouvement de base : c'est ce qui garantit
// qu'un remplacement entraîne le même geste.

import type { Mesure } from './types';

export type Mouvement =
  | 'squat' | 'charniere' | 'unilateral' | 'poussee_h' | 'poussee_v' | 'tirage_h' | 'tirage_v'
  | 'saut_v' | 'saut_h' | 'bonds' | 'sprint' | 'changement_direction' | 'lancer' | 'frappe'
  | 'gainage_ext' | 'gainage_rot' | 'porter' | 'mollets'
  | 'iso_biceps' | 'iso_triceps' | 'iso_epaules' | 'iso_pectoraux' | 'iso_quadriceps' | 'iso_ischios' | 'iso_avant_bras' | 'iso_dos'
  | 'cardio' | 'mobilite';

export type Qualite = 'force' | 'puissance' | 'vitesse' | 'hypertrophie' | 'endurance' | 'technique' | 'mobilite';

export type Muscle =
  | 'pectoraux' | 'dos' | 'epaules' | 'biceps' | 'triceps' | 'avant_bras' | 'abdos'
  | 'fessiers' | 'quadriceps' | 'ischios' | 'mollets';

export const NOMS_MUSCLES: Record<Muscle, string> = {
  pectoraux: 'Pectoraux', dos: 'Dos', epaules: 'Épaules', biceps: 'Biceps', triceps: 'Triceps',
  avant_bras: 'Avant-bras', abdos: 'Abdominaux et gainage', fessiers: 'Fessiers', quadriceps: 'Quadriceps',
  ischios: 'Ischio-jambiers', mollets: 'Mollets'
};

export const NOMS_MOUVEMENTS: Record<Mouvement, string> = {
  squat: 'Squat', charniere: 'Charnière de hanche', unilateral: 'Fente et travail sur une jambe',
  poussee_h: 'Poussée horizontale', poussee_v: 'Poussée verticale', tirage_h: 'Tirage horizontal', tirage_v: 'Tirage vertical',
  saut_v: 'Saut vertical', saut_h: 'Saut horizontal', bonds: 'Bonds sur une jambe', sprint: 'Sprint',
  changement_direction: 'Changement de direction', lancer: 'Lancer', frappe: 'Frappe',
  gainage_ext: 'Gainage (anti-extension)', gainage_rot: 'Gainage (anti-rotation)', porter: 'Porter', mollets: 'Mollets',
  iso_biceps: 'Isolation des biceps', iso_triceps: 'Isolation des triceps', iso_epaules: 'Isolation des épaules',
  iso_pectoraux: 'Isolation des pectoraux', iso_quadriceps: 'Isolation des quadriceps', iso_ischios: 'Isolation des ischio-jambiers',
  iso_avant_bras: 'Avant-bras', iso_dos: 'Isolation du dos', cardio: 'Cardio par intervalles', mobilite: 'Mobilité'
};

/** Mouvements assez proches pour servir de solution de repli (règle 6.2, étape 4). */
export const MOUVEMENTS_PROCHES: Partial<Record<Mouvement, Mouvement[]>> = {
  squat: ['unilateral'],
  unilateral: ['squat'],
  charniere: ['iso_ischios', 'unilateral'],
  iso_ischios: ['charniere'],
  poussee_h: ['poussee_v'],
  poussee_v: ['poussee_h'],
  tirage_v: ['tirage_h'],
  tirage_h: ['tirage_v'],
  saut_v: ['saut_h', 'bonds'],
  saut_h: ['saut_v', 'bonds'],
  bonds: ['saut_h', 'saut_v'],
  sprint: ['changement_direction', 'saut_h'],
  changement_direction: ['sprint'],
  lancer: ['poussee_h', 'frappe'],
  frappe: ['lancer'],
  gainage_ext: ['gainage_rot'],
  gainage_rot: ['gainage_ext', 'porter'],
  porter: ['gainage_rot', 'iso_avant_bras'],
  iso_avant_bras: ['porter'],
  iso_quadriceps: ['squat', 'unilateral'],
  iso_pectoraux: ['poussee_h'],
  iso_dos: ['tirage_h', 'tirage_v'],
  iso_epaules: ['poussee_v'],
  iso_triceps: ['poussee_h'],
  iso_biceps: ['tirage_h']
};

/**
 * Façon dont l'exercice se charge :
 * - barre, machine, poulie : charge pratiquement illimitée en salle ;
 * - halteres, kettlebell : limitée par le poids maximal disponible (charge par haltère) ;
 * - corps : poids du corps (fraction portée) + lest éventuel ;
 * - aucune : la charge n'a pas de sens (sauts, sprints, cardio, gainage).
 */
export type TypeCharge = 'barre' | 'machine' | 'poulie' | 'halteres' | 'kettlebell' | 'corps' | 'aucune';

export interface Exercice {
  id: string;
  nom: string;
  mouvement: Mouvement;
  qualites: Qualite[];
  primaires: Muscle[];
  secondaires: Muscle[];
  /** Matériel requis : chaque groupe doit avoir au moins un élément disponible. */
  materiel: string[][];
  difficulte: 1 | 2 | 3 | 4 | 5;
  charge: TypeCharge;
  /** Rapport de charge avec l'exercice de référence du mouvement (règle 6.2). */
  facteur?: number;
  /** Pour la charge « corps » : part du poids du corps réellement soulevée. */
  partPoidsDuCorps?: number;
  /** On peut ajouter du lest facilement (haltère entre les pieds, ceinture). */
  lestable?: boolean;
  mesure: Mesure;
  consignes: string[];
  erreurs: string[];
  plusFacile?: string;
  plusDifficile?: string;
}

// Raccourcis d'écriture.
const M = (...g: string[][]) => g;
const un = (...ids: string[]) => [ids];

export const EXERCICES: Exercice[] = [
  // ---------------- Squat ----------------
  {
    id: 'squat-arriere', nom: 'Squat arrière', mouvement: 'squat', qualites: ['force', 'hypertrophie'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['ischios', 'abdos'], materiel: M(['barre'], ['rack']),
    difficulte: 3, charge: 'barre', facteur: 1, mesure: 'charge_reps',
    consignes: ['Barre posée sur le haut du dos, mains serrées.', 'Pieds largeur d’épaules, pointes légèrement ouvertes.', 'Descendre en poussant les genoux dans l’axe des pieds, au moins jusqu’à la cuisse parallèle au sol.', 'Remonter en gardant le buste et le regard fixes.'],
    erreurs: ['Genoux qui rentrent vers l’intérieur.', 'Talons qui décollent.', 'Dos qui s’arrondit en bas du mouvement.'],
    plusFacile: 'squat-goblet', plusDifficile: 'squat-avant'
  },
  {
    id: 'squat-avant', nom: 'Squat avant', mouvement: 'squat', qualites: ['force', 'hypertrophie'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['abdos', 'epaules'], materiel: M(['barre'], ['rack']),
    difficulte: 4, charge: 'barre', facteur: 0.8, mesure: 'charge_reps',
    consignes: ['Barre posée sur l’avant des épaules, coudes hauts.', 'Buste le plus droit possible.', 'Descendre profond, genoux vers l’avant.', 'Remonter en gardant les coudes hauts.'],
    erreurs: ['Coudes qui tombent : la barre glisse.', 'Buste qui bascule vers l’avant.'],
    plusFacile: 'squat-arriere'
  },
  {
    id: 'squat-goblet', nom: 'Squat goblet', mouvement: 'squat', qualites: ['hypertrophie', 'technique'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['abdos'], materiel: un('halteres', 'kettlebell'),
    difficulte: 2, charge: 'halteres', facteur: 0.4, mesure: 'charge_reps',
    consignes: ['Tenir un haltère ou une kettlebell contre la poitrine.', 'Descendre entre les talons, coudes à l’intérieur des genoux.', 'Garder le buste droit et remonter en poussant le sol.'],
    erreurs: ['Charge qui s’éloigne de la poitrine.', 'Descente trop courte.'],
    plusFacile: 'squat-poids-corps', plusDifficile: 'squat-arriere'
  },
  {
    id: 'presse-cuisses', nom: 'Presse à cuisses', mouvement: 'squat', qualites: ['hypertrophie', 'force'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['ischios'], materiel: un('presse'),
    difficulte: 1, charge: 'machine', facteur: 1.8, mesure: 'charge_reps',
    consignes: ['Pieds à largeur de hanches au milieu de la plateforme.', 'Descendre jusqu’à environ 90° aux genoux sans décoller le bas du dos.', 'Pousser sans verrouiller complètement les genoux.'],
    erreurs: ['Bas du dos qui se décolle du dossier.', 'Genoux verrouillés en haut.'],
    plusDifficile: 'squat-arriere'
  },
  {
    id: 'squat-poids-corps', nom: 'Squat au poids du corps', mouvement: 'squat', qualites: ['endurance', 'technique'],
    primaires: ['quadriceps', 'fessiers'], secondaires: [], materiel: [],
    difficulte: 1, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.3, mesure: 'poids_du_corps_reps',
    consignes: ['Pieds largeur d’épaules.', 'Descendre lentement, bras devant pour l’équilibre.', 'Remonter en poussant le sol.'],
    erreurs: ['Talons qui décollent.', 'Genoux qui rentrent.'],
    plusDifficile: 'squat-goblet'
  },
  {
    id: 'squat-pistol', nom: 'Squat sur une jambe (pistol) assisté', mouvement: 'unilateral', qualites: ['force', 'technique'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['abdos'], materiel: [],
    difficulte: 4, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.8, mesure: 'poids_du_corps_reps',
    consignes: ['Debout sur une jambe, l’autre tendue devant, en se tenant légèrement à un support.', 'Descendre lentement le plus bas possible.', 'Remonter en poussant fort sur le talon.'],
    erreurs: ['Talon qui décolle.', 'Descente en chute libre.'],
    plusFacile: 'squat-bulgare-pdc'
  },

  // ---------------- Travail sur une jambe ----------------
  {
    id: 'squat-bulgare-halteres', nom: 'Squat bulgare aux haltères', mouvement: 'unilateral', qualites: ['force', 'hypertrophie'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['ischios', 'abdos'], materiel: un('halteres'),
    difficulte: 3, charge: 'halteres', facteur: 0.25, mesure: 'charge_reps',
    consignes: ['Pied arrière posé sur un banc ou une chaise.', 'Un haltère dans chaque main, bras le long du corps.', 'Descendre verticalement jusqu’à frôler le sol avec le genou arrière.', 'Répétitions indiquées pour chaque jambe.'],
    erreurs: ['Pied avant trop proche : le genou part loin devant.', 'Buste qui s’effondre.'],
    plusFacile: 'squat-bulgare-pdc', plusDifficile: 'squat-pistol'
  },
  {
    id: 'squat-bulgare-pdc', nom: 'Squat bulgare au poids du corps', mouvement: 'unilateral', qualites: ['hypertrophie', 'endurance'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['abdos'], materiel: [],
    difficulte: 2, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.45, mesure: 'poids_du_corps_reps',
    consignes: ['Pied arrière sur une chaise ou un banc.', 'Descendre lentement, genou arrière vers le sol.', 'Répétitions indiquées pour chaque jambe.'],
    erreurs: ['Perte d’équilibre par un pied avant mal placé.'],
    plusFacile: 'fentes-pdc', plusDifficile: 'squat-bulgare-halteres'
  },
  {
    id: 'fentes-halteres', nom: 'Fentes marchées aux haltères', mouvement: 'unilateral', qualites: ['hypertrophie', 'force'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['ischios'], materiel: un('halteres'),
    difficulte: 2, charge: 'halteres', facteur: 0.3, mesure: 'charge_reps',
    consignes: ['Un haltère dans chaque main.', 'Grand pas en avant, descendre jusqu’à frôler le sol avec le genou arrière.', 'Enchaîner avec l’autre jambe en avançant.'],
    erreurs: ['Pas trop court.', 'Genou avant qui rentre.'],
    plusFacile: 'fentes-pdc', plusDifficile: 'squat-bulgare-halteres'
  },
  {
    id: 'fentes-pdc', nom: 'Fentes au poids du corps', mouvement: 'unilateral', qualites: ['endurance', 'technique'],
    primaires: ['quadriceps', 'fessiers'], secondaires: [], materiel: [],
    difficulte: 1, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.35, mesure: 'poids_du_corps_reps',
    consignes: ['Grand pas en avant.', 'Descendre verticalement.', 'Revenir et changer de jambe.'],
    erreurs: ['Buste penché vers l’avant.'],
    plusDifficile: 'squat-bulgare-pdc'
  },
  {
    id: 'step-up-halteres', nom: 'Montée sur box aux haltères', mouvement: 'unilateral', qualites: ['force', 'hypertrophie'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['mollets'], materiel: M(['box', 'banc'], ['halteres']),
    difficulte: 2, charge: 'halteres', facteur: 0.25, mesure: 'charge_reps',
    consignes: ['Pied entier posé sur la box.', 'Monter en poussant sur la jambe du dessus, sans s’aider de celle du bas.', 'Redescendre lentement.'],
    erreurs: ['Pousser avec la jambe du bas.'],
    plusDifficile: 'squat-bulgare-halteres'
  },

  // ---------------- Charnière de hanche ----------------
  {
    id: 'souleve-terre-roumain', nom: 'Soulevé de terre roumain', mouvement: 'charniere', qualites: ['force', 'hypertrophie'],
    primaires: ['ischios', 'fessiers'], secondaires: ['dos', 'avant_bras'], materiel: un('barre'),
    difficulte: 3, charge: 'barre', facteur: 1, mesure: 'charge_reps',
    consignes: ['Barre en main, jambes presque tendues.', 'Pousser les fesses vers l’arrière, barre collée aux cuisses.', 'Descendre jusqu’à sentir l’étirement derrière les cuisses, dos plat.', 'Remonter en serrant les fessiers.'],
    erreurs: ['Dos qui s’arrondit.', 'Barre qui s’éloigne des jambes.', 'Genoux trop pliés : cela devient un squat.'],
    plusFacile: 'souleve-roumain-halteres', plusDifficile: 'souleve-terre'
  },
  {
    id: 'souleve-terre', nom: 'Soulevé de terre', mouvement: 'charniere', qualites: ['force'],
    primaires: ['ischios', 'fessiers', 'dos'], secondaires: ['quadriceps', 'avant_bras'], materiel: un('barre'),
    difficulte: 4, charge: 'barre', facteur: 1.3, mesure: 'charge_reps',
    consignes: ['Barre au-dessus du milieu des pieds.', 'Saisir la barre, dos plat, poitrine ouverte.', 'Pousser le sol et ramener les hanches vers la barre.', 'Redescendre en contrôlant.'],
    erreurs: ['Dos rond au départ.', 'Hanches qui montent avant les épaules.'],
    plusFacile: 'souleve-terre-roumain'
  },
  {
    id: 'souleve-roumain-halteres', nom: 'Soulevé de terre roumain aux haltères', mouvement: 'charniere', qualites: ['hypertrophie', 'force'],
    primaires: ['ischios', 'fessiers'], secondaires: ['dos'], materiel: un('halteres'),
    difficulte: 2, charge: 'halteres', facteur: 0.4, mesure: 'charge_reps',
    consignes: ['Un haltère dans chaque main devant les cuisses.', 'Pousser les fesses en arrière, dos plat.', 'Remonter en serrant les fessiers.'],
    erreurs: ['Dos rond.', 'Descendre trop bas en perdant le dos plat.'],
    plusFacile: 'good-morning-pdc', plusDifficile: 'souleve-roumain-une-jambe'
  },
  {
    id: 'souleve-roumain-une-jambe', nom: 'Soulevé de terre roumain sur une jambe', mouvement: 'charniere', qualites: ['hypertrophie', 'technique'],
    primaires: ['ischios', 'fessiers'], secondaires: ['abdos'], materiel: un('halteres', 'kettlebell'),
    difficulte: 3, charge: 'halteres', facteur: 0.3, mesure: 'charge_reps',
    consignes: ['Debout sur une jambe, haltère dans la main opposée.', 'Basculer le buste en avant, jambe libre tendue derrière.', 'Garder les hanches à l’horizontale.', 'Répétitions indiquées pour chaque jambe.'],
    erreurs: ['Hanche qui s’ouvre sur le côté.', 'Dos rond.'],
    plusFacile: 'souleve-roumain-halteres'
  },
  {
    id: 'swing-kettlebell', nom: 'Swing à la kettlebell', mouvement: 'charniere', qualites: ['puissance', 'endurance'],
    primaires: ['fessiers', 'ischios'], secondaires: ['dos', 'abdos'], materiel: un('kettlebell', 'halteres'),
    difficulte: 2, charge: 'kettlebell', facteur: 0.25, mesure: 'charge_reps',
    consignes: ['Kettlebell tenue à deux mains, pieds un peu plus larges que les épaules.', 'Basculer la charge entre les jambes, dos plat.', 'Projeter les hanches vers l’avant pour envoyer la charge à hauteur de poitrine.'],
    erreurs: ['Lever la charge avec les bras.', 'Squatter au lieu de basculer les hanches.'],
    plusDifficile: 'epaule-suspension'
  },
  {
    id: 'good-morning-pdc', nom: 'Bascule du buste au poids du corps', mouvement: 'charniere', qualites: ['technique', 'endurance'],
    primaires: ['ischios', 'fessiers'], secondaires: ['dos'], materiel: [],
    difficulte: 1, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.15, mesure: 'poids_du_corps_reps',
    consignes: ['Mains sur la nuque, genoux légèrement fléchis.', 'Basculer le buste en avant, dos plat.', 'Remonter en serrant les fessiers.'],
    erreurs: ['Dos rond.'],
    plusDifficile: 'souleve-roumain-halteres'
  },
  {
    id: 'pont-fessier-une-jambe', nom: 'Pont fessier sur une jambe', mouvement: 'charniere', qualites: ['hypertrophie', 'endurance'],
    primaires: ['fessiers', 'ischios'], secondaires: [], materiel: [],
    difficulte: 1, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.25, mesure: 'poids_du_corps_reps',
    consignes: ['Allongé sur le dos, un pied au sol, l’autre jambe levée.', 'Monter le bassin en poussant sur le talon.', 'Tenir 1 seconde en haut.', 'Répétitions indiquées pour chaque jambe.'],
    erreurs: ['Cambrer le bas du dos au lieu de serrer les fessiers.'],
    plusDifficile: 'souleve-roumain-une-jambe'
  },

  // ---------------- Haltérophilie (épaulé) ----------------
  {
    id: 'epaule-suspension', nom: 'Épaulé en suspension (apprentissage)', mouvement: 'charniere', qualites: ['puissance', 'technique'],
    primaires: ['fessiers', 'ischios', 'quadriceps'], secondaires: ['dos', 'epaules'], materiel: un('barre'),
    difficulte: 4, charge: 'barre', facteur: 0.6, mesure: 'charge_reps',
    consignes: ['Départ debout, barre à mi-cuisses, dos plat.', 'Extension explosive des hanches et des genoux, haussement d’épaules.', 'Passer rapidement sous la barre et la recevoir sur l’avant des épaules, coudes hauts.', 'Charge légère : la technique d’abord.'],
    erreurs: ['Tirer avec les bras trop tôt.', 'Recevoir la barre jambes tendues.', 'Coudes bas à la réception.'],
    plusFacile: 'swing-kettlebell'
  },

  // ---------------- Poussée horizontale ----------------
  {
    id: 'developpe-couche', nom: 'Développé couché', mouvement: 'poussee_h', qualites: ['force', 'hypertrophie'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules'], materiel: M(['barre'], ['banc']),
    difficulte: 3, charge: 'barre', facteur: 1, mesure: 'charge_reps',
    consignes: ['Allongé, yeux sous la barre, pieds bien ancrés.', 'Omoplates serrées et basses.', 'Descendre la barre au bas des pectoraux, coudes à environ 45°.', 'Pousser en ligne droite.'],
    erreurs: ['Fesses qui décollent du banc.', 'Coudes à 90° du corps (épaules exposées).', 'Barre qui rebondit sur la poitrine.'],
    plusFacile: 'developpe-halteres', plusDifficile: 'dips'
  },
  {
    id: 'developpe-halteres', nom: 'Développé couché aux haltères', mouvement: 'poussee_h', qualites: ['hypertrophie', 'force'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules'], materiel: M(['halteres'], ['banc']),
    difficulte: 2, charge: 'halteres', facteur: 0.4, mesure: 'charge_reps',
    consignes: ['Allongé sur le banc, un haltère dans chaque main.', 'Descendre les haltères sur les côtés de la poitrine.', 'Pousser en rapprochant légèrement les haltères en haut.'],
    erreurs: ['Descente trop courte.', 'Poignets cassés vers l’arrière.'],
    plusFacile: 'pompes', plusDifficile: 'developpe-couche'
  },
  {
    id: 'developpe-sol-halteres', nom: 'Développé au sol aux haltères', mouvement: 'poussee_h', qualites: ['hypertrophie', 'force'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules'], materiel: un('halteres'),
    difficulte: 2, charge: 'halteres', facteur: 0.38, mesure: 'charge_reps',
    consignes: ['Allongé au sol, genoux pliés.', 'Descendre jusqu’à poser les coudes au sol, sans rebond.', 'Pousser à la verticale.'],
    erreurs: ['Laisser tomber les coudes au sol.'],
    plusDifficile: 'developpe-halteres'
  },
  {
    id: 'pompes', nom: 'Pompes', mouvement: 'poussee_h', qualites: ['hypertrophie', 'endurance'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules', 'abdos'], materiel: [],
    difficulte: 2, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.64, mesure: 'poids_du_corps_reps',
    consignes: ['Mains un peu plus larges que les épaules.', 'Corps gainé en planche, de la tête aux talons.', 'Descendre la poitrine près du sol, coudes à environ 45°.', 'Pousser en gardant le corps droit.'],
    erreurs: ['Bassin qui s’affaisse.', 'Amplitude trop courte.', 'Coudes écartés à 90°.'],
    plusFacile: 'pompes-inclinees', plusDifficile: 'pompes-pieds-sureleves'
  },
  {
    id: 'pompes-poignees', nom: 'Pompes sur poignées', mouvement: 'poussee_h', qualites: ['hypertrophie', 'force'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules', 'abdos'], materiel: un('poignees_pompes'),
    difficulte: 2, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.66, mesure: 'poids_du_corps_reps',
    consignes: ['Poignées sous les épaules, un peu plus larges.', 'Descendre plus bas qu’en pompes classiques grâce aux poignées.', 'Corps gainé, pousser fort.'],
    erreurs: ['Bassin qui s’affaisse.', 'Remonter sans finir l’amplitude.'],
    plusFacile: 'pompes', plusDifficile: 'pompes-pieds-sureleves'
  },
  {
    id: 'pompes-pieds-sureleves', nom: 'Pompes pieds surélevés', mouvement: 'poussee_h', qualites: ['hypertrophie', 'force'],
    primaires: ['pectoraux', 'triceps', 'epaules'], secondaires: ['abdos'], materiel: [],
    difficulte: 3, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.7, mesure: 'poids_du_corps_reps',
    consignes: ['Pieds sur une chaise ou un banc, mains au sol.', 'Corps gainé.', 'Descendre la poitrine vers le sol, pousser fort.', 'Avec des poignées, l’amplitude est encore plus grande.'],
    erreurs: ['Bassin qui monte ou s’affaisse.'],
    plusFacile: 'pompes', plusDifficile: 'pompes-explosives'
  },
  {
    id: 'pompes-inclinees', nom: 'Pompes mains surélevées', mouvement: 'poussee_h', qualites: ['endurance', 'technique'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules'], materiel: [],
    difficulte: 1, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.45, mesure: 'poids_du_corps_reps',
    consignes: ['Mains sur un banc, une table ou un mur.', 'Corps droit, descendre la poitrine vers l’appui.'],
    erreurs: ['Bassin cassé.'],
    plusDifficile: 'pompes'
  },
  {
    id: 'dips', nom: 'Dips', mouvement: 'poussee_h', qualites: ['force', 'hypertrophie'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules'], materiel: un('barres_paralleles'),
    difficulte: 3, charge: 'corps', facteur: 1.2, partPoidsDuCorps: 1, lestable: true, mesure: 'poids_du_corps_reps',
    consignes: ['En appui sur les barres, bras tendus.', 'Descendre jusqu’à ce que les épaules passent légèrement sous les coudes.', 'Remonter sans hausser les épaules.', 'Ajouter du lest quand les répétitions sont faciles.'],
    erreurs: ['Descendre trop bas en forçant sur les épaules.', 'Balancer les jambes.'],
    plusFacile: 'pompes', plusDifficile: 'developpe-couche'
  },
  {
    id: 'pompes-explosives', nom: 'Pompes explosives', mouvement: 'poussee_h', qualites: ['puissance', 'vitesse'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules', 'abdos'], materiel: [],
    difficulte: 3, charge: 'aucune', mesure: 'reps',
    consignes: ['Position de pompe, corps gainé.', 'Descendre contrôlé puis pousser le plus vite possible pour décoller les mains.', 'Réception souple, bras légèrement fléchis.', 'Arrêter la série dès que la vitesse baisse.'],
    erreurs: ['Enchaîner lentement : l’effet explosif disparaît.', 'Réception bras tendus.'],
    plusFacile: 'pompes', plusDifficile: 'lancer-mb-poitrine'
  },
  {
    id: 'chest-press-machine', nom: 'Développé à la machine', mouvement: 'poussee_h', qualites: ['hypertrophie'],
    primaires: ['pectoraux', 'triceps'], secondaires: ['epaules'], materiel: un('machines'),
    difficulte: 1, charge: 'machine', facteur: 0.9, mesure: 'charge_reps',
    consignes: ['Régler le siège pour avoir les poignées à hauteur du milieu de la poitrine.', 'Pousser sans décoller le dos.', 'Revenir lentement.'],
    erreurs: ['Épaules qui avancent en fin de poussée.'],
    plusDifficile: 'developpe-couche'
  },

  // ---------------- Poussée verticale ----------------
  {
    id: 'developpe-militaire', nom: 'Développé militaire', mouvement: 'poussee_v', qualites: ['force', 'hypertrophie'],
    primaires: ['epaules', 'triceps'], secondaires: ['abdos'], materiel: M(['barre'], ['rack']),
    difficulte: 3, charge: 'barre', facteur: 1, mesure: 'charge_reps',
    consignes: ['Debout, barre sur le haut de la poitrine.', 'Fessiers et abdominaux serrés.', 'Pousser la barre au-dessus de la tête en passant la tête légèrement en arrière.', 'Finir bras tendus, barre au-dessus du milieu des pieds.'],
    erreurs: ['Cambrer fortement le bas du dos.', 'Pousser la barre vers l’avant.'],
    plusFacile: 'developpe-epaules-halteres'
  },
  {
    id: 'developpe-epaules-halteres', nom: 'Développé épaules aux haltères', mouvement: 'poussee_v', qualites: ['hypertrophie', 'force'],
    primaires: ['epaules', 'triceps'], secondaires: [], materiel: un('halteres'),
    difficulte: 2, charge: 'halteres', facteur: 0.4, mesure: 'charge_reps',
    consignes: ['Assis ou debout, haltères à hauteur des épaules.', 'Pousser au-dessus de la tête.', 'Redescendre lentement.'],
    erreurs: ['Cambrer le dos.', 'Descente trop courte.'],
    plusFacile: 'pompes-pike', plusDifficile: 'developpe-militaire'
  },
  {
    id: 'pompes-pike', nom: 'Pompes en V (pike)', mouvement: 'poussee_v', qualites: ['hypertrophie', 'force'],
    primaires: ['epaules', 'triceps'], secondaires: ['pectoraux'], materiel: [],
    difficulte: 3, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.45, mesure: 'poids_du_corps_reps',
    consignes: ['Position de pompe, puis monter les fesses pour former un V inversé.', 'Descendre la tête entre les mains.', 'Pousser pour revenir.', 'Pieds surélevés pour corser.'],
    erreurs: ['Descendre la poitrine au lieu de la tête.'],
    plusFacile: 'pompes', plusDifficile: 'developpe-epaules-halteres'
  },

  // ---------------- Tirage vertical ----------------
  {
    id: 'tractions', nom: 'Tractions', mouvement: 'tirage_v', qualites: ['force', 'hypertrophie'],
    primaires: ['dos', 'biceps'], secondaires: ['avant_bras', 'abdos'], materiel: un('barre_traction'),
    difficulte: 3, charge: 'corps', facteur: 1, partPoidsDuCorps: 1, lestable: true, mesure: 'poids_du_corps_reps',
    consignes: ['Mains en pronation, un peu plus larges que les épaules.', 'Partir bras tendus, épaules engagées.', 'Tirer jusqu’à passer le menton au-dessus de la barre.', 'Redescendre en contrôlant jusqu’en bas.'],
    erreurs: ['Demi-répétitions.', 'Balancer les jambes pour s’aider.'],
    plusFacile: 'tractions-negatives', plusDifficile: 'tractions-lestees'
  },
  {
    id: 'tractions-lestees', nom: 'Tractions lestées', mouvement: 'tirage_v', qualites: ['force'],
    primaires: ['dos', 'biceps'], secondaires: ['avant_bras'], materiel: M(['barre_traction'], ['halteres', 'kettlebell']),
    difficulte: 4, charge: 'corps', facteur: 1, partPoidsDuCorps: 1, lestable: true, mesure: 'poids_du_corps_reps',
    consignes: ['Haltère tenu entre les pieds ou ceinture de lest.', 'Même technique que les tractions.'],
    erreurs: ['Perdre l’amplitude complète à cause du lest.'],
    plusFacile: 'tractions'
  },
  {
    id: 'tractions-negatives', nom: 'Tractions négatives', mouvement: 'tirage_v', qualites: ['force', 'technique'],
    primaires: ['dos', 'biceps'], secondaires: ['avant_bras'], materiel: un('barre_traction'),
    difficulte: 2, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.8, mesure: 'poids_du_corps_reps',
    consignes: ['Monter menton au-dessus de la barre en sautant.', 'Redescendre le plus lentement possible (3 à 5 secondes).'],
    erreurs: ['Se laisser tomber.'],
    plusDifficile: 'tractions'
  },
  {
    id: 'tirage-vertical-poulie', nom: 'Tirage vertical à la poulie', mouvement: 'tirage_v', qualites: ['hypertrophie', 'force'],
    primaires: ['dos', 'biceps'], secondaires: [], materiel: un('poulie'),
    difficulte: 1, charge: 'poulie', facteur: 0.8, mesure: 'charge_reps',
    consignes: ['Cuisses bloquées sous les boudins.', 'Tirer la barre vers le haut de la poitrine.', 'Remonter lentement bras tendus.'],
    erreurs: ['Se pencher très en arrière.', 'Tirer derrière la nuque.'],
    plusDifficile: 'tractions'
  },

  // ---------------- Tirage horizontal ----------------
  {
    id: 'rowing-barre', nom: 'Rowing à la barre', mouvement: 'tirage_h', qualites: ['force', 'hypertrophie'],
    primaires: ['dos'], secondaires: ['biceps', 'ischios'], materiel: un('barre'),
    difficulte: 3, charge: 'barre', facteur: 0.75, mesure: 'charge_reps',
    consignes: ['Buste penché à environ 45°, dos plat.', 'Tirer la barre vers le nombril.', 'Serrer les omoplates en haut.'],
    erreurs: ['Redresser le buste pour tricher.', 'Dos rond.'],
    plusFacile: 'rowing-haltere'
  },
  {
    id: 'rowing-haltere', nom: 'Rowing haltère sur un bras', mouvement: 'tirage_h', qualites: ['hypertrophie', 'force'],
    primaires: ['dos'], secondaires: ['biceps'], materiel: un('halteres'),
    difficulte: 2, charge: 'halteres', facteur: 0.35, mesure: 'charge_reps',
    consignes: ['Une main et un genou en appui (banc, chaise), dos plat.', 'Tirer l’haltère vers la hanche.', 'Redescendre bras tendu.', 'Répétitions indiquées pour chaque bras.'],
    erreurs: ['Tourner le buste pour tirer.', 'Tirer vers l’épaule au lieu de la hanche.'],
    plusFacile: 'rowing-inverse', plusDifficile: 'rowing-barre'
  },
  {
    id: 'rowing-inverse', nom: 'Rowing inversé', mouvement: 'tirage_h', qualites: ['hypertrophie', 'endurance'],
    primaires: ['dos'], secondaires: ['biceps', 'abdos'], materiel: un('barre_traction', 'barres_paralleles', 'rack'),
    difficulte: 2, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.6, mesure: 'poids_du_corps_reps',
    consignes: ['Sous une barre basse, corps tendu, talons au sol.', 'Tirer la poitrine vers la barre.', 'Redescendre lentement.', 'Plus le corps est horizontal, plus c’est difficile.'],
    erreurs: ['Bassin qui s’affaisse.'],
    plusFacile: 'rowing-haltere', plusDifficile: 'tractions'
  },
  {
    id: 'rowing-table', nom: 'Rowing inversé sous une table', mouvement: 'tirage_h', qualites: ['hypertrophie', 'endurance'],
    primaires: ['dos'], secondaires: ['biceps'], materiel: [],
    difficulte: 2, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.55, mesure: 'poids_du_corps_reps',
    consignes: ['Allongé sous une table solide et stable, mains au bord du plateau.', 'Corps tendu, talons au sol.', 'Tirer la poitrine vers la table, redescendre lentement.', 'Vérifier d’abord que la table ne bascule pas.'],
    erreurs: ['Table instable.', 'Bassin qui s’affaisse.'],
    plusDifficile: 'rowing-inverse'
  },
  {
    id: 'tirage-horizontal-poulie', nom: 'Tirage horizontal à la poulie', mouvement: 'tirage_h', qualites: ['hypertrophie'],
    primaires: ['dos'], secondaires: ['biceps'], materiel: un('poulie'),
    difficulte: 1, charge: 'poulie', facteur: 0.7, mesure: 'charge_reps',
    consignes: ['Assis, buste droit.', 'Tirer la poignée vers le nombril en serrant les omoplates.', 'Revenir lentement bras tendus.'],
    erreurs: ['Se balancer d’avant en arrière.'],
    plusDifficile: 'rowing-barre'
  },

  // ---------------- Sauts ----------------
  {
    id: 'saut-box', nom: 'Saut sur box', mouvement: 'saut_v', qualites: ['puissance'],
    primaires: ['quadriceps', 'fessiers', 'mollets'], secondaires: [], materiel: un('box'),
    difficulte: 2, charge: 'aucune', mesure: 'reps',
    consignes: ['Debout face à la box.', 'Élan des bras, sauter le plus haut possible.', 'Réception souple et silencieuse, genoux dans l’axe.', 'Redescendre en marchant, jamais en sautant.'],
    erreurs: ['Box trop haute : réception en position de squat profond.', 'Enchaîner sans récupérer.'],
    plusFacile: 'squat-jump', plusDifficile: 'saut-profondeur'
  },
  {
    id: 'squat-jump', nom: 'Squat jump', mouvement: 'saut_v', qualites: ['puissance'],
    primaires: ['quadriceps', 'fessiers', 'mollets'], secondaires: [], materiel: [],
    difficulte: 2, charge: 'aucune', mesure: 'reps',
    consignes: ['Descendre en quart de squat.', 'Sauter le plus haut possible avec l’élan des bras.', 'Réception souple, se remettre en place entre chaque saut.'],
    erreurs: ['Réception jambes tendues.', 'Enchaîner trop vite : la hauteur baisse.'],
    plusDifficile: 'saut-box'
  },
  {
    id: 'saut-halteres', nom: 'Saut vertical avec haltères', mouvement: 'saut_v', qualites: ['puissance', 'force'],
    primaires: ['quadriceps', 'fessiers', 'mollets'], secondaires: [], materiel: un('halteres'),
    difficulte: 3, charge: 'aucune', mesure: 'reps',
    consignes: ['Haltères légers en main, bras le long du corps.', 'Quart de squat puis saut explosif.', 'Réception souple.'],
    erreurs: ['Charge trop lourde : on ne décolle presque plus.'],
    plusFacile: 'squat-jump'
  },
  {
    id: 'saut-profondeur', nom: 'Saut en contrebas puis rebond', mouvement: 'saut_v', qualites: ['puissance', 'vitesse'],
    primaires: ['quadriceps', 'fessiers', 'mollets'], secondaires: [], materiel: un('box', 'banc'),
    difficulte: 4, charge: 'aucune', mesure: 'reps',
    consignes: ['Debout sur une box basse (30 à 40 cm).', 'Se laisser tomber au sol et rebondir immédiatement le plus haut possible.', 'Contact au sol le plus court possible.'],
    erreurs: ['Box trop haute.', 'Rester longtemps au sol avant de rebondir.'],
    plusFacile: 'saut-box'
  },
  {
    id: 'saut-panier', nom: 'Sauts vers le panier', mouvement: 'saut_v', qualites: ['puissance', 'vitesse'],
    primaires: ['quadriceps', 'fessiers', 'mollets'], secondaires: [], materiel: un('panier_basket'),
    difficulte: 2, charge: 'aucune', mesure: 'reps',
    consignes: ['Sous le panier ou le panneau.', 'Prendre 1 à 2 pas d’élan et sauter pour toucher le plus haut possible.', 'Revenir en marchant entre chaque saut.'],
    erreurs: ['Enchaîner sans récupérer.'],
    plusFacile: 'squat-jump'
  },
  {
    id: 'saut-longueur', nom: 'Saut en longueur sans élan', mouvement: 'saut_h', qualites: ['puissance'],
    primaires: ['fessiers', 'quadriceps', 'ischios'], secondaires: ['mollets'], materiel: [],
    difficulte: 2, charge: 'aucune', mesure: 'reps',
    consignes: ['Pieds largeur de hanches.', 'Élan des bras, sauter le plus loin possible.', 'Réception stable sur les deux pieds.'],
    erreurs: ['Réception en déséquilibre arrière.'],
    plusDifficile: 'bonds-enchaines'
  },
  {
    id: 'bonds-enchaines', nom: 'Bonds enchaînés', mouvement: 'bonds', qualites: ['puissance', 'vitesse'],
    primaires: ['fessiers', 'quadriceps', 'mollets'], secondaires: ['ischios'], materiel: [],
    difficulte: 3, charge: 'aucune', mesure: 'reps',
    consignes: ['Enchaîner des bonds alternés d’une jambe sur l’autre, le plus loin possible.', 'Contact au sol court et dynamique.', 'Bras actifs.'],
    erreurs: ['Bonds trop hauts et trop courts.'],
    plusFacile: 'saut-longueur', plusDifficile: 'bonds-une-jambe'
  },
  {
    id: 'bonds-une-jambe', nom: 'Bonds sur une jambe', mouvement: 'bonds', qualites: ['puissance'],
    primaires: ['fessiers', 'quadriceps', 'mollets'], secondaires: [], materiel: [],
    difficulte: 4, charge: 'aucune', mesure: 'reps',
    consignes: ['Sauter vers l’avant sur une seule jambe, réception sur la même.', 'Stabiliser une seconde avant le saut suivant.', 'Répétitions indiquées pour chaque jambe.'],
    erreurs: ['Genou qui rentre à la réception.'],
    plusFacile: 'bonds-enchaines'
  },

  // ---------------- Sprint et changements de direction ----------------
  {
    id: 'sprint-court', nom: 'Sprint 10 à 30 m', mouvement: 'sprint', qualites: ['vitesse', 'puissance'],
    primaires: ['ischios', 'fessiers', 'quadriceps'], secondaires: ['mollets'], materiel: un('espace_course'),
    difficulte: 2, charge: 'aucune', mesure: 'reps',
    consignes: ['Départ debout, un pied devant.', 'Accélérer au maximum en poussant fort dans le sol, buste penché au départ.', 'Récupération complète entre les sprints (environ 1 minute par tranche de 10 m).'],
    erreurs: ['Sprinter fatigué : on travaille l’endurance, plus la vitesse.', 'Se redresser trop tôt.'],
    plusFacile: 'departs-position-basse', plusDifficile: 'traineau-poussee'
  },
  {
    id: 'departs-position-basse', nom: 'Départs en position basse', mouvement: 'sprint', qualites: ['puissance', 'vitesse'],
    primaires: ['fessiers', 'quadriceps'], secondaires: ['ischios', 'mollets'], materiel: un('espace_course'),
    difficulte: 2, charge: 'aucune', mesure: 'reps',
    consignes: ['Départ à genoux, accroupi ou allongé.', 'Se relever et accélérer sur 10 m le plus vite possible.', 'Revenir en marchant.'],
    erreurs: ['Se relever complètement avant d’accélérer.'],
    plusDifficile: 'sprint-court'
  },
  {
    id: 'traineau-poussee', nom: 'Poussée de traîneau', mouvement: 'sprint', qualites: ['force', 'puissance'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['mollets', 'ischios'], materiel: un('traineau'),
    difficulte: 2, charge: 'machine', facteur: 1, mesure: 'reps',
    consignes: ['Mains sur les montants, bras tendus, buste très penché.', 'Pousser par petites foulées puissantes sur 10 à 20 m.', 'Récupération complète entre les poussées.'],
    erreurs: ['Charge trop lourde : on ralentit énormément.', 'Dos rond.'],
    plusFacile: 'departs-position-basse'
  },
  {
    id: 'navettes-cod', nom: 'Changements de direction (5-10-5)', mouvement: 'changement_direction', qualites: ['vitesse', 'technique'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['ischios', 'mollets'], materiel: un('espace_course', 'panier_basket'),
    difficulte: 2, charge: 'aucune', mesure: 'reps',
    consignes: ['Trois repères alignés à 5 m d’écart.', 'Partir du milieu : 5 m d’un côté, 10 m de l’autre, puis retour au milieu.', 'Freiner bas, appui extérieur, repartir fort.'],
    erreurs: ['Freiner debout, jambes tendues.'],
    plusFacile: 'pas-chasses'
  },
  {
    id: 'pas-chasses', nom: 'Pas chassés et freinages', mouvement: 'changement_direction', qualites: ['technique', 'vitesse'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['mollets'], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Position basse, pieds écartés.', 'Pas chassés rapides sur 3 à 4 m, freiner, repartir dans l’autre sens.', 'Rester bas tout le long.'],
    erreurs: ['Croiser les pieds.', 'Se redresser.'],
    plusDifficile: 'navettes-cod'
  },

  // ---------------- Lancers et frappe ----------------
  {
    id: 'lancer-mb-poitrine', nom: 'Lancer de médecine-ball depuis la poitrine', mouvement: 'lancer', qualites: ['puissance', 'vitesse'],
    primaires: ['pectoraux', 'triceps', 'epaules'], secondaires: ['abdos'], materiel: un('medecine_ball'),
    difficulte: 2, charge: 'aucune', mesure: 'reps',
    consignes: ['Ballon contre la poitrine, face à un mur ou dans un espace dégagé.', 'Lancer le plus fort possible en poussant des jambes et des bras.', 'Récupérer et repartir, chaque lancer à fond.'],
    erreurs: ['Ballon trop lourd : le lancer devient lent.'],
    plusFacile: 'pompes-explosives', plusDifficile: 'lancer-mb-rotation'
  },
  {
    id: 'lancer-mb-rotation', nom: 'Lancer de médecine-ball en rotation', mouvement: 'lancer', qualites: ['puissance', 'vitesse'],
    primaires: ['abdos', 'epaules'], secondaires: ['fessiers', 'pectoraux'], materiel: un('medecine_ball'),
    difficulte: 3, charge: 'aucune', mesure: 'reps',
    consignes: ['De profil face à un mur.', 'Tourner les hanches puis le buste pour lancer le ballon contre le mur.', 'Comme un crochet en boxe : la force part du pied arrière.', 'Répétitions indiquées pour chaque côté.'],
    erreurs: ['Lancer avec les bras seuls.'],
    plusFacile: 'lancer-mb-poitrine'
  },
  {
    id: 'lancer-ballon-basket', nom: 'Lancer de ballon de basket depuis la poitrine', mouvement: 'lancer', qualites: ['puissance', 'vitesse'],
    primaires: ['pectoraux', 'triceps', 'epaules'], secondaires: [], materiel: un('ballon_basket'),
    difficulte: 1, charge: 'aucune', mesure: 'reps',
    consignes: ['Ballon contre la poitrine.', 'Le lancer le plus loin ou le plus fort possible contre un mur.', 'Chaque lancer à fond.'],
    erreurs: ['Lancer sans engager les jambes.'],
    plusDifficile: 'lancer-mb-poitrine'
  },
  {
    id: 'rounds-sac', nom: 'Rounds au sac de frappe', mouvement: 'frappe', qualites: ['endurance', 'puissance', 'vitesse'],
    primaires: ['epaules', 'abdos'], secondaires: ['pectoraux', 'triceps', 'mollets'], materiel: un('sac_frappe'),
    difficulte: 2, charge: 'aucune', mesure: 'tenue',
    consignes: ['Garde haute, menton rentré.', 'Enchaînements courts et rapides (direct, crochet), en bougeant autour du sac.', 'Expirer à chaque frappe.', 'Garder une frappe sèche plutôt que pousser le sac.'],
    erreurs: ['Baisser la garde après la frappe.', 'Frapper avec les bras seuls, sans rotation.'],
    plusFacile: 'shadow-boxing'
  },
  {
    id: 'shadow-halteres', nom: 'Boxe dans le vide avec haltères légers', mouvement: 'frappe', qualites: ['endurance', 'puissance', 'vitesse'],
    primaires: ['epaules'], secondaires: ['abdos', 'triceps'], materiel: un('halteres'),
    difficulte: 2, charge: 'aucune', mesure: 'tenue',
    consignes: ['Haltères de 1 à 2 kg maximum.', 'Directs et crochets rapides, sans verrouiller les coudes.', 'Garde haute entre les frappes.'],
    erreurs: ['Haltères trop lourds : la vitesse disparaît.', 'Tendre complètement les bras.'],
    plusFacile: 'shadow-boxing', plusDifficile: 'rounds-sac'
  },
  {
    id: 'shadow-boxing', nom: 'Boxe dans le vide', mouvement: 'frappe', qualites: ['endurance', 'vitesse', 'technique'],
    primaires: ['epaules', 'abdos'], secondaires: ['mollets'], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Garde haute, appuis légers.', 'Enchaînements de directs, crochets et esquives.', 'Bouger en permanence.'],
    erreurs: ['Rester planté sur les talons.'],
    plusDifficile: 'shadow-halteres'
  },

  // ---------------- Gainage ----------------
  {
    id: 'planche', nom: 'Gainage planche', mouvement: 'gainage_ext', qualites: ['endurance'],
    primaires: ['abdos'], secondaires: ['epaules'], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Appui sur les avant-bras et les pointes de pieds.', 'Corps droit, fessiers et abdominaux serrés.', 'Respirer normalement.'],
    erreurs: ['Bassin trop haut ou qui s’affaisse.'],
    plusDifficile: 'roue-abdo'
  },
  {
    id: 'roue-abdo', nom: 'Roue abdominale', mouvement: 'gainage_ext', qualites: ['force', 'hypertrophie'],
    primaires: ['abdos'], secondaires: ['dos', 'epaules'], materiel: un('roue_abdo'),
    difficulte: 3, charge: 'aucune', mesure: 'reps',
    consignes: ['À genoux, mains sur la roue.', 'Rouler vers l’avant en gardant le dos plat et le bassin rentré.', 'Revenir en contractant les abdominaux.'],
    erreurs: ['Cambrer le bas du dos.', 'Aller trop loin au début.'],
    plusFacile: 'planche'
  },
  {
    id: 'releve-jambes', nom: 'Relevé de jambes suspendu', mouvement: 'gainage_ext', qualites: ['force', 'hypertrophie'],
    primaires: ['abdos'], secondaires: ['avant_bras'], materiel: un('barre_traction', 'barres_paralleles'),
    difficulte: 3, charge: 'aucune', mesure: 'reps',
    consignes: ['Suspendu à la barre (ou en appui aux barres parallèles).', 'Monter les genoux ou les jambes en enroulant le bassin.', 'Redescendre sans balancer.'],
    erreurs: ['Se balancer.', 'Lever les jambes sans enrouler le bassin.'],
    plusFacile: 'planche'
  },
  {
    id: 'pallof', nom: 'Pallof press à la poulie', mouvement: 'gainage_rot', qualites: ['endurance', 'force'],
    primaires: ['abdos'], secondaires: ['epaules'], materiel: un('poulie'),
    difficulte: 2, charge: 'poulie', facteur: 1, mesure: 'charge_reps',
    consignes: ['De profil par rapport à la poulie, poignée contre la poitrine.', 'Tendre les bras devant soi sans laisser le buste tourner.', 'Revenir lentement.', 'Répétitions indiquées pour chaque côté.'],
    erreurs: ['Laisser la poulie faire tourner le buste.'],
    plusFacile: 'planche-laterale'
  },
  {
    id: 'planche-laterale', nom: 'Gainage latéral', mouvement: 'gainage_rot', qualites: ['endurance'],
    primaires: ['abdos'], secondaires: ['fessiers'], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Sur un avant-bras, pieds empilés.', 'Corps droit, hanches hautes.', 'Durée indiquée pour chaque côté.'],
    erreurs: ['Hanches qui tombent.'],
    plusDifficile: 'pallof'
  },
  {
    id: 'marche-fermier', nom: 'Marche du fermier', mouvement: 'porter', qualites: ['force', 'endurance'],
    primaires: ['avant_bras', 'abdos'], secondaires: ['epaules', 'dos'], materiel: un('halteres', 'kettlebell'),
    difficulte: 1, charge: 'halteres', facteur: 1, mesure: 'tenue',
    consignes: ['Une charge lourde dans chaque main.', 'Marcher droit, épaules basses, petits pas.', 'Durée ou distance indiquée.'],
    erreurs: ['Épaules qui remontent.', 'Pencher sur le côté.'],
    plusFacile: 'planche-laterale'
  },

  // ---------------- Mollets ----------------
  {
    id: 'mollets-debout', nom: 'Extension des mollets debout', mouvement: 'mollets', qualites: ['hypertrophie', 'endurance'],
    primaires: ['mollets'], secondaires: [], materiel: [],
    difficulte: 1, charge: 'corps', facteur: 1, partPoidsDuCorps: 1, lestable: true, mesure: 'poids_du_corps_reps',
    consignes: ['Avant des pieds sur une marche.', 'Descendre les talons le plus bas possible, puis monter sur la pointe.', 'Tenir une seconde en haut.', 'Sur une jambe ou avec un haltère pour corser.'],
    erreurs: ['Rebondir sans amplitude.'],
    plusDifficile: 'mollets-machine'
  },
  {
    id: 'mollets-machine', nom: 'Mollets à la machine', mouvement: 'mollets', qualites: ['hypertrophie'],
    primaires: ['mollets'], secondaires: [], materiel: un('machines', 'presse'),
    difficulte: 1, charge: 'machine', facteur: 1, mesure: 'charge_reps',
    consignes: ['Avant des pieds sur le bord du support.', 'Grande amplitude, montée rapide, descente lente.'],
    erreurs: ['Plier les genoux pour tricher.'],
    plusFacile: 'mollets-debout'
  },

  // ---------------- Isolation ----------------
  {
    id: 'curl-halteres', nom: 'Curl aux haltères', mouvement: 'iso_biceps', qualites: ['hypertrophie'],
    primaires: ['biceps'], secondaires: ['avant_bras'], materiel: un('halteres'),
    difficulte: 1, charge: 'halteres', facteur: 1, mesure: 'charge_reps',
    consignes: ['Coudes collés au corps.', 'Monter en tournant la paume vers le haut.', 'Redescendre lentement jusqu’en bas.'],
    erreurs: ['Balancer le buste.', 'Coudes qui avancent.'],
    plusDifficile: 'curl-poulie'
  },
  {
    id: 'curl-poulie', nom: 'Curl à la poulie', mouvement: 'iso_biceps', qualites: ['hypertrophie'],
    primaires: ['biceps'], secondaires: ['avant_bras'], materiel: un('poulie'),
    difficulte: 1, charge: 'poulie', facteur: 1.6, mesure: 'charge_reps',
    consignes: ['Face à la poulie basse.', 'Coudes fixes, monter la barre ou la corde.', 'Descente lente.'],
    erreurs: ['Reculer le buste pour tirer.'],
    plusFacile: 'curl-halteres'
  },
  {
    id: 'tractions-supination', nom: 'Tractions en supination', mouvement: 'iso_biceps', qualites: ['force', 'hypertrophie'],
    primaires: ['biceps', 'dos'], secondaires: ['avant_bras'], materiel: un('barre_traction'),
    difficulte: 3, charge: 'corps', facteur: 4, partPoidsDuCorps: 1, lestable: true, mesure: 'poids_du_corps_reps',
    consignes: ['Mains paumes vers soi, largeur d’épaules.', 'Tirer jusqu’au menton au-dessus de la barre.', 'Descente contrôlée.'],
    erreurs: ['Demi-répétitions.'],
    plusFacile: 'curl-halteres'
  },
  {
    id: 'extension-triceps-poulie', nom: 'Extension des triceps à la poulie', mouvement: 'iso_triceps', qualites: ['hypertrophie'],
    primaires: ['triceps'], secondaires: [], materiel: un('poulie'),
    difficulte: 1, charge: 'poulie', facteur: 1, mesure: 'charge_reps',
    consignes: ['Face à la poulie haute, coudes collés au corps.', 'Tendre complètement les bras vers le bas.', 'Remonter lentement.'],
    erreurs: ['Coudes qui s’écartent.', 'Pencher le buste pour pousser.'],
    plusFacile: 'extension-triceps-haltere'
  },
  {
    id: 'extension-triceps-haltere', nom: 'Extension des triceps à l’haltère au-dessus de la tête', mouvement: 'iso_triceps', qualites: ['hypertrophie'],
    primaires: ['triceps'], secondaires: [], materiel: un('halteres'),
    difficulte: 1, charge: 'halteres', facteur: 0.6, mesure: 'charge_reps',
    consignes: ['Haltère tenu à deux mains au-dessus de la tête.', 'Descendre derrière la tête en gardant les coudes pointés vers le haut.', 'Remonter bras tendus.'],
    erreurs: ['Coudes qui s’ouvrent.', 'Cambrer le dos.'],
    plusFacile: 'pompes-diamant', plusDifficile: 'extension-triceps-poulie'
  },
  {
    id: 'pompes-diamant', nom: 'Pompes mains serrées', mouvement: 'iso_triceps', qualites: ['hypertrophie', 'endurance'],
    primaires: ['triceps'], secondaires: ['pectoraux'], materiel: [],
    difficulte: 2, charge: 'corps', facteur: 2.5, partPoidsDuCorps: 0.64, mesure: 'poids_du_corps_reps',
    consignes: ['Mains rapprochées sous la poitrine.', 'Coudes le long du corps.', 'Descendre et pousser en gardant le corps droit.'],
    erreurs: ['Coudes qui s’écartent.'],
    plusDifficile: 'dips'
  },
  {
    id: 'elevations-laterales', nom: 'Élévations latérales', mouvement: 'iso_epaules', qualites: ['hypertrophie'],
    primaires: ['epaules'], secondaires: [], materiel: un('halteres'),
    difficulte: 1, charge: 'halteres', facteur: 1, mesure: 'charge_reps',
    consignes: ['Haltères le long du corps, coudes légèrement fléchis.', 'Monter les bras sur les côtés jusqu’à l’horizontale.', 'Redescendre lentement.'],
    erreurs: ['Hausser les épaules.', 'Balancer le buste.'],
    plusDifficile: 'elevations-laterales-poulie'
  },
  {
    id: 'elevations-laterales-poulie', nom: 'Élévations latérales à la poulie', mouvement: 'iso_epaules', qualites: ['hypertrophie'],
    primaires: ['epaules'], secondaires: [], materiel: un('poulie'),
    difficulte: 1, charge: 'poulie', facteur: 0.8, mesure: 'charge_reps',
    consignes: ['De profil, poignée de la poulie basse dans la main opposée.', 'Monter le bras sur le côté jusqu’à l’horizontale.', 'Répétitions indiquées pour chaque bras.'],
    erreurs: ['Tirer avec le trapèze.'],
    plusFacile: 'elevations-laterales'
  },
  {
    id: 'oiseau-halteres', nom: 'Oiseau aux haltères', mouvement: 'iso_epaules', qualites: ['hypertrophie'],
    primaires: ['epaules', 'dos'], secondaires: [], materiel: un('halteres'),
    difficulte: 1, charge: 'halteres', facteur: 0.8, mesure: 'charge_reps',
    consignes: ['Buste penché presque à l’horizontale, dos plat.', 'Ouvrir les bras sur les côtés.', 'Serrer les omoplates en haut.'],
    erreurs: ['Se redresser pendant la série.'],
    plusDifficile: 'face-pull'
  },
  {
    id: 'face-pull', nom: 'Tirage visage à la poulie', mouvement: 'iso_epaules', qualites: ['hypertrophie', 'mobilite'],
    primaires: ['epaules', 'dos'], secondaires: [], materiel: un('poulie'),
    difficulte: 1, charge: 'poulie', facteur: 1.5, mesure: 'charge_reps',
    consignes: ['Corde à la poulie haute.', 'Tirer vers le visage en écartant les mains.', 'Finir coudes hauts, mains au niveau des oreilles.'],
    erreurs: ['Charge trop lourde : le buste recule.'],
    plusFacile: 'oiseau-halteres'
  },
  {
    id: 'ecarte-poulie', nom: 'Écarté à la poulie', mouvement: 'iso_pectoraux', qualites: ['hypertrophie'],
    primaires: ['pectoraux'], secondaires: ['epaules'], materiel: un('poulie'),
    difficulte: 1, charge: 'poulie', facteur: 1, mesure: 'charge_reps',
    consignes: ['Entre les deux poulies, un pas en avant.', 'Bras légèrement fléchis, ramener les mains devant la poitrine.', 'Revenir lentement en ouvrant.'],
    erreurs: ['Plier les coudes : cela devient un développé.'],
    plusFacile: 'ecarte-halteres'
  },
  {
    id: 'ecarte-halteres', nom: 'Écarté aux haltères', mouvement: 'iso_pectoraux', qualites: ['hypertrophie'],
    primaires: ['pectoraux'], secondaires: ['epaules'], materiel: un('halteres'),
    difficulte: 1, charge: 'halteres', facteur: 0.7, mesure: 'charge_reps',
    consignes: ['Allongé (banc ou sol), haltères au-dessus de la poitrine.', 'Ouvrir les bras légèrement fléchis.', 'Remonter en serrant les pectoraux.'],
    erreurs: ['Descendre trop bas : les épaules souffrent.'],
    plusDifficile: 'ecarte-poulie'
  },
  {
    id: 'leg-extension', nom: 'Extension des jambes à la machine', mouvement: 'iso_quadriceps', qualites: ['hypertrophie'],
    primaires: ['quadriceps'], secondaires: [], materiel: un('machines'),
    difficulte: 1, charge: 'machine', facteur: 1, mesure: 'charge_reps',
    consignes: ['Genoux alignés avec l’axe de la machine.', 'Tendre les jambes, tenir 1 seconde.', 'Redescendre lentement.'],
    erreurs: ['Lancer la charge.'],
    plusFacile: 'squat-poids-corps'
  },
  {
    id: 'leg-curl', nom: 'Flexion des jambes à la machine', mouvement: 'iso_ischios', qualites: ['hypertrophie'],
    primaires: ['ischios'], secondaires: ['mollets'], materiel: un('machines'),
    difficulte: 1, charge: 'machine', facteur: 1, mesure: 'charge_reps',
    consignes: ['Genoux alignés avec l’axe de la machine.', 'Plier les jambes au maximum.', 'Revenir lentement.'],
    erreurs: ['Décoller les hanches.'],
    plusFacile: 'pont-fessier-une-jambe', plusDifficile: 'nordic-curl'
  },
  {
    id: 'nordic-curl', nom: 'Nordic curl (ischios)', mouvement: 'iso_ischios', qualites: ['force', 'hypertrophie'],
    primaires: ['ischios'], secondaires: ['fessiers'], materiel: [],
    difficulte: 4, charge: 'corps', facteur: 1, partPoidsDuCorps: 0.6, mesure: 'poids_du_corps_reps',
    consignes: ['À genoux, chevilles bloquées sous un meuble stable ou tenues par quelqu’un.', 'Se laisser descendre vers l’avant le plus lentement possible, corps droit.', 'Se rattraper avec les mains, repousser pour remonter.', 'Excellent pour prévenir les blessures des ischios en sprint.'],
    erreurs: ['Plier les hanches.', 'Tomber d’un coup.'],
    plusFacile: 'pont-fessier-une-jambe'
  },
  {
    id: 'pince-avant-bras', nom: 'Serrage de pince', mouvement: 'iso_avant_bras', qualites: ['force', 'endurance'],
    primaires: ['avant_bras'], secondaires: [], materiel: un('pince'),
    difficulte: 1, charge: 'aucune', mesure: 'reps',
    consignes: ['Serrer complètement la pince.', 'Tenir 1 seconde, relâcher lentement.', 'Répétitions indiquées pour chaque main.'],
    erreurs: ['Ne pas fermer complètement.'],
    plusDifficile: 'suspension-barre'
  },
  {
    id: 'suspension-barre', nom: 'Suspension à la barre', mouvement: 'iso_avant_bras', qualites: ['endurance', 'force'],
    primaires: ['avant_bras'], secondaires: ['dos'], materiel: un('barre_traction'),
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Suspendu bras tendus, épaules légèrement engagées.', 'Tenir le plus longtemps possible.'],
    erreurs: ['Épaules complètement relâchées aux oreilles.'],
    plusFacile: 'pince-avant-bras'
  },
  {
    id: 'pullover-poulie', nom: 'Pull-over à la poulie', mouvement: 'iso_dos', qualites: ['hypertrophie'],
    primaires: ['dos'], secondaires: ['triceps'], materiel: un('poulie'),
    difficulte: 1, charge: 'poulie', facteur: 1, mesure: 'charge_reps',
    consignes: ['Face à la poulie haute, bras tendus.', 'Ramener la barre vers les cuisses en gardant les bras tendus.', 'Remonter lentement.'],
    erreurs: ['Plier les coudes.'],
    plusFacile: 'pullover-haltere'
  },
  {
    id: 'pullover-haltere', nom: 'Pull-over à l’haltère', mouvement: 'iso_dos', qualites: ['hypertrophie', 'mobilite'],
    primaires: ['dos', 'pectoraux'], secondaires: [], materiel: un('halteres'),
    difficulte: 1, charge: 'halteres', facteur: 0.8, mesure: 'charge_reps',
    consignes: ['Allongé, haltère tenu à deux mains au-dessus de la poitrine.', 'Descendre derrière la tête, bras presque tendus.', 'Revenir au-dessus de la poitrine.'],
    erreurs: ['Cambrer fortement le dos.'],
    plusDifficile: 'pullover-poulie'
  },

  // ---------------- Mobilité ----------------
  {
    id: 'mob-hanches-9090', nom: 'Mobilité des hanches 90/90', mouvement: 'mobilite', qualites: ['mobilite'],
    primaires: ['fessiers'], secondaires: [], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Assis au sol, jambe avant pliée à 90° devant, jambe arrière pliée à 90° sur le côté.', 'Buste droit, pencher doucement vers l’avant au-dessus de la jambe avant.', 'Changer de côté en faisant pivoter les genoux.'],
    erreurs: ['Arrondir le dos pour aller plus loin.']
  },
  {
    id: 'mob-cheville-mur', nom: 'Mobilité de cheville genou au mur', mouvement: 'mobilite', qualites: ['mobilite'],
    primaires: ['mollets'], secondaires: [], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Face à un mur, un pied à quelques centimètres du mur.', 'Avancer le genou pour toucher le mur, talon au sol.', 'Reculer le pied petit à petit ; alterner les côtés.'],
    erreurs: ['Talon qui décolle.', 'Genou qui part vers l’intérieur.']
  },
  {
    id: 'mob-thoracique', nom: 'Ouverture thoracique au sol', mouvement: 'mobilite', qualites: ['mobilite'],
    primaires: ['dos'], secondaires: ['epaules'], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Allongé sur le côté, genoux pliés à 90°, bras tendus devant soi.', 'Ouvrir le bras du dessus vers l’arrière en suivant la main des yeux.', 'Garder les genoux collés au sol ; alterner les côtés.'],
    erreurs: ['Genoux qui se soulèvent.']
  },
  {
    id: 'mob-flechisseurs', nom: 'Étirement des fléchisseurs de hanche', mouvement: 'mobilite', qualites: ['mobilite'],
    primaires: ['quadriceps'], secondaires: ['fessiers'], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Un genou au sol, l’autre pied devant.', 'Serrer le fessier de la jambe arrière et avancer légèrement le bassin.', 'Sentir l’étirement devant la hanche ; alterner les côtés.'],
    erreurs: ['Cambrer le bas du dos au lieu de serrer le fessier.']
  },
  {
    id: 'mob-epaules-serviette', nom: 'Passages d’épaules avec une serviette', mouvement: 'mobilite', qualites: ['mobilite'],
    primaires: ['epaules'], secondaires: ['pectoraux'], materiel: [],
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Tenir une serviette ou un bâton à deux mains, bras tendus, mains très écartées.', 'Passer lentement les bras au-dessus de la tête puis derrière le dos.', 'Rapprocher les mains au fil des séances.'],
    erreurs: ['Plier les coudes.', 'Mains trop rapprochées au début.']
  },

  // ---------------- Cardio par intervalles ----------------
  {
    id: 'velo-assault-intervalles', nom: 'Fractionné au vélo d’assaut', mouvement: 'cardio', qualites: ['endurance', 'puissance'],
    primaires: ['quadriceps', 'fessiers'], secondaires: ['epaules'], materiel: un('velo_assault'),
    difficulte: 2, charge: 'aucune', mesure: 'tenue',
    consignes: ['Pédaler et pousser-tirer avec les bras à fond pendant la phase d’effort.', 'Récupérer en pédalant tranquillement.', 'Garder le même effort sur toutes les répétitions.'],
    erreurs: ['Partir trop vite et s’écrouler à la fin.'],
    plusFacile: 'rameur-intervalles'
  },
  {
    id: 'rameur-intervalles', nom: 'Fractionné au rameur', mouvement: 'cardio', qualites: ['endurance', 'puissance'],
    primaires: ['dos', 'quadriceps'], secondaires: ['fessiers', 'biceps'], materiel: un('rameur'),
    difficulte: 2, charge: 'aucune', mesure: 'tenue',
    consignes: ['Pousser d’abord avec les jambes, puis basculer le buste, puis tirer avec les bras.', 'Retour dans l’ordre inverse.', 'Effort à fond pendant les phases intenses.'],
    erreurs: ['Tirer avec les bras avant de pousser des jambes.'],
    plusDifficile: 'velo-assault-intervalles'
  },
  {
    id: 'skierg-intervalles', nom: 'Fractionné au ski-erg', mouvement: 'cardio', qualites: ['endurance', 'puissance'],
    primaires: ['dos', 'abdos'], secondaires: ['triceps', 'epaules'], materiel: un('skierg'),
    difficulte: 2, charge: 'aucune', mesure: 'tenue',
    consignes: ['Tirer les poignées vers le bas en fléchissant légèrement les hanches.', 'Effort à fond pendant les phases intenses.'],
    erreurs: ['Tirer avec les bras seuls.'],
    plusFacile: 'rameur-intervalles'
  },
  {
    id: 'corde-intervalles', nom: 'Fractionné à la corde à sauter', mouvement: 'cardio', qualites: ['endurance', 'vitesse'],
    primaires: ['mollets', 'quadriceps'], secondaires: ['epaules'], materiel: un('corde'),
    difficulte: 1, charge: 'aucune', mesure: 'tenue',
    consignes: ['Petits sauts sur l’avant des pieds.', 'Poignets qui tournent, coudes près du corps.', 'Rythme maximal pendant l’effort, rythme tranquille pendant la récupération.'],
    erreurs: ['Sauter trop haut.', 'Tourner la corde avec les épaules.'],
    plusDifficile: 'velo-assault-intervalles'
  },
  {
    id: 'navettes-intervalles', nom: 'Fractionné en navettes', mouvement: 'cardio', qualites: ['endurance', 'vitesse'],
    primaires: ['quadriceps', 'fessiers', 'ischios'], secondaires: ['mollets'], materiel: un('espace_course', 'panier_basket'),
    difficulte: 2, charge: 'aucune', mesure: 'tenue',
    consignes: ['Allers-retours de 20 m à allure soutenue pendant l’effort.', 'Marcher pendant la récupération.', 'Freiner bas à chaque demi-tour.'],
    erreurs: ['Partir à fond dès le premier aller.'],
    plusFacile: 'burpees-intervalles'
  },
  {
    id: 'burpees-intervalles', nom: 'Fractionné au poids du corps (burpees)', mouvement: 'cardio', qualites: ['endurance'],
    primaires: ['quadriceps', 'pectoraux'], secondaires: ['epaules', 'abdos'], materiel: [],
    difficulte: 2, charge: 'aucune', mesure: 'tenue',
    consignes: ['S’accroupir, poser les mains, lancer les pieds en arrière, revenir et sauter.', 'Rythme régulier pendant l’effort.', 'Récupérer debout.'],
    erreurs: ['Dos qui s’affaisse en position de planche.'],
    plusDifficile: 'navettes-intervalles'
  }
];

const PAR_ID = new Map(EXERCICES.map((e) => [e.id, e]));

export function exercice(id: string): Exercice | undefined {
  return PAR_ID.get(id);
}

/** Exercices aimés pendant l'interview : petit bonus lors d'un remplacement. */
export const PREFERES = new Set(['tractions', 'dips', 'pompes', 'pompes-poignees', 'corde-intervalles', 'velo-assault-intervalles']);
