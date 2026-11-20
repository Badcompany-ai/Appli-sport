// Générateur de programme (cahier des charges, partie 5).
// 2 semaines de reprise, puis 4 cycles de 6 semaines (5 de travail + 1 allégée avec tests).

import { exercice } from './exercices';
import { EPREUVES, prevoirEpreuve } from './niveau';
import type { Profil } from './profil';
import { prevoir } from './remplacement';
import type { ExercicePrevu, SeancePrevue } from './types';

export type CleePhase = 'reprise' | 'c1' | 'c2' | 'c3' | 'c4';

export const NOMS_PHASES: Record<CleePhase, string> = {
  reprise: 'Reprise',
  c1: 'Cycle 1 · Bases',
  c2: 'Cycle 2 · Force',
  c3: 'Cycle 3 · Puissance',
  c4: 'Cycle 4 · Vitesse'
};

export const NB_SEMAINES = 26;

export interface InfoSemaine {
  index: number;
  phase: CleePhase;
  /** Numéro de la semaine dans sa phase (1 à 6, ou 1 à 2 pour la reprise). */
  dansPhase: number;
  allegee: boolean;
  test: 'leger' | 'complet' | null;
  apresProgramme: boolean;
}

export function infoSemaine(index: number): InfoSemaine {
  const i = Math.max(0, index);
  if (i < 2) return { index: i, phase: 'reprise', dansPhase: i + 1, allegee: false, test: i === 0 ? 'leger' : 'complet', apresProgramme: false };
  const apres = i >= NB_SEMAINES;
  // Après le programme : on continue sur le modèle du cycle 4 (maintien) en attendant un nouveau programme.
  const j = apres ? 2 + 18 + ((i - NB_SEMAINES) % 6) : i;
  const cycle = Math.floor((j - 2) / 6) + 1;
  const dansPhase = ((j - 2) % 6) + 1;
  return {
    index: i,
    phase: (`c${cycle}` as CleePhase),
    dansPhase,
    allegee: dansPhase === 6,
    test: dansPhase === 6 ? 'complet' : null,
    apresProgramme: apres
  };
}

// ---------- Prescriptions par rôle et par phase (règle 5.4) ----------

type Role =
  | 'plyo' | 'plyo2' | 'contraste' | 'sprint' | 'sprint_max' | 'cod' | 'lancer' | 'lancer_rot' | 'olympique'
  | 'force_principal' | 'force_secondaire' | 'hypertrophie' | 'isolation' | 'nordic' | 'gainage' | 'boxe' | 'cardio';

interface Prescription {
  series: number;
  reps?: [number, number];
  dureeSec?: number;
  reposSec: number;
}

const P = (series: number, reps: [number, number] | number, reposSec: number): Prescription =>
  typeof reps === 'number' ? { series, dureeSec: reps, reposSec } : { series, reps, reposSec };

// Audit du 20/11/2026 : sauts dosés en contacts au sol (P7), contraste à partir du cycle 2 (P4),
// sprints en mètres et vitesse maximale (P5), intervalles longs pour la VO2 max (P6), rotation à chaque cycle (P3).
const PRESCRIPTIONS: Record<CleePhase, Record<Role, Prescription>> = {
  reprise: {
    plyo: P(4, [5, 5], 90), plyo2: P(4, [5, 5], 90), contraste: P(0, [3, 3], 0), sprint: P(6, [1, 1], 90), sprint_max: P(0, [1, 1], 0),
    cod: P(4, 20, 60), lancer: P(3, [6, 6], 60), lancer_rot: P(3, [5, 5], 60), olympique: P(4, [8, 8], 90),
    force_principal: P(4, [8, 10], 120), force_secondaire: P(3, [10, 12], 90), hypertrophie: P(3, [10, 12], 90),
    isolation: P(3, [12, 15], 60), nordic: P(2, [4, 4], 90), gainage: P(3, 40, 45), boxe: P(4, 120, 60), cardio: P(8, 20, 40)
  },
  c1: {
    plyo: P(5, [5, 5], 90), plyo2: P(4, [8, 8], 90), contraste: P(0, [3, 3], 0), sprint: P(6, [1, 1], 90), sprint_max: P(0, [1, 1], 0),
    cod: P(4, [1, 1], 90), lancer: P(3, [5, 5], 60), lancer_rot: P(3, [5, 5], 60), olympique: P(4, [3, 3], 120),
    force_principal: P(4, [6, 8], 150), force_secondaire: P(3, [8, 10], 120), hypertrophie: P(3, [8, 12], 90),
    isolation: P(3, [10, 15], 60), nordic: P(3, [4, 6], 120), gainage: P(3, 40, 45), boxe: P(4, 180, 60), cardio: P(4, 240, 120)
  },
  c2: {
    plyo: P(4, [5, 5], 120), plyo2: P(4, [8, 8], 120), contraste: P(5, [3, 3], 0), sprint: P(6, [1, 1], 120), sprint_max: P(2, [1, 1], 240),
    cod: P(4, [1, 1], 90), lancer: P(5, [3, 3], 0), lancer_rot: P(3, [5, 5], 60), olympique: P(4, [3, 3], 150),
    force_principal: P(5, [4, 5], 180), force_secondaire: P(4, [5, 6], 150), hypertrophie: P(3, [6, 10], 120),
    isolation: P(3, [10, 12], 60), nordic: P(3, [4, 6], 120), gainage: P(3, 45, 45), boxe: P(4, 180, 60), cardio: P(4, 240, 120)
  },
  c3: {
    plyo: P(5, [4, 4], 120), plyo2: P(5, [8, 8], 120), contraste: P(4, [3, 3], 0), sprint: P(6, [1, 1], 150), sprint_max: P(2, [1, 1], 240),
    cod: P(4, [1, 1], 90), lancer: P(4, [3, 3], 0), lancer_rot: P(4, [5, 5], 60), olympique: P(4, [2, 3], 150),
    force_principal: P(4, [3, 5], 180), force_secondaire: P(3, [5, 6], 120), hypertrophie: P(3, [8, 10], 90),
    isolation: P(3, [10, 12], 60), nordic: P(3, [5, 6], 120), gainage: P(3, 45, 45), boxe: P(5, 180, 60), cardio: P(5, 180, 120)
  },
  c4: {
    plyo: P(4, [5, 5], 120), plyo2: P(5, [10, 10], 120), contraste: P(3, [3, 3], 0), sprint: P(8, [1, 1], 120), sprint_max: P(3, [1, 1], 210),
    cod: P(5, [1, 1], 90), lancer: P(3, [3, 3], 0), lancer_rot: P(4, [5, 5], 60), olympique: P(4, [2, 2], 150),
    force_principal: P(3, [3, 3], 180), force_secondaire: P(3, [5, 5], 120), hypertrophie: P(3, [8, 10], 90),
    isolation: P(3, [10, 12], 60), nordic: P(2, [5, 6], 120), gainage: P(3, 45, 45), boxe: P(5, 180, 60), cardio: P(10, 30, 30)
  }
};

/** Distance des sprints par phase (audit P5 : 100 à 150 m par séance en cycle 1, jusqu'à 250-300 m en cycle 4). */
const DISTANCE_SPRINT: Record<CleePhase, number> = { reprise: 20, c1: 20, c2: 25, c3: 30, c4: 30 };

const CONSIGNES_SPRINT: Record<CleePhase, string> = {
  reprise: 'Accélérations progressives à environ 70 % de votre vitesse : pas de sprint au maximum pendant la reprise.',
  c1: 'À fond depuis un départ debout, récupération complète entre chaque (environ 2 minutes).',
  c2: 'À fond, en variant les départs (debout, à genoux), récupération complète.',
  c3: 'À fond, récupération complète (2 à 3 minutes).',
  c4: 'À fond, en variant les départs (debout, à genoux, allongé), récupération complète.'
};

// ---------- Modèles de séances (règle 5.2) ----------

type ChoixExercice = string | Partial<Record<CleePhase | 'defaut', string>>;
interface Element {
  role: Role;
  ex: ChoixExercice;
  priorite: 1 | 2 | 3;
  /** Phases où l'élément est présent (toutes par défaut). */
  phases?: CleePhase[];
  /** Répétitions imposées pour cet exercice. */
  reps?: [number, number];
  /** Exercices enchaînés : même identifiant, dans les phases indiquées. */
  groupe?: { id: string; phases?: CleePhase[]; reposIntra: number };
}

interface Modele {
  lettre: string;
  nom: string;
  echauffement: string[];
  elements: Element[];
}

const ECH_BAS = [
  '3 minutes de corde à sauter ou de vélo, tranquille',
  'Mobilité : hanches 90/90 et cheville genou au mur, 1 minute de chaque côté',
  '10 squats au poids du corps et 10 fentes',
  'Gammes : montées de genoux et talons-fesses, 2 × 15 m',
  '3 sauts progressifs à 50, 70 puis 90 % de votre hauteur'
];
const ECH_HAUT = [
  '3 minutes de rameur ou de corde, tranquille',
  'Mobilité : passages d’épaules avec une serviette et ouverture thoracique, 1 minute chacun',
  '10 pompes faciles et 10 rowings légers',
  '2 séries légères du premier exercice de force'
];
const ECH_VITESSE = [
  '4 minutes de footing très léger',
  'Mobilité : fléchisseurs de hanche et cheville, 1 minute de chaque côté',
  'Gammes : montées de genoux, talons-fesses, pas chassés, 2 × 15 m',
  '3 accélérations progressives sur 30 m (60, 75, 90 %)'
];
const ECH_TEST = [
  '5 minutes de cardio léger',
  'Mobilité complète : hanches, chevilles, épaules',
  'Gammes et 3 accélérations progressives',
  '3 sauts et 3 lancers d’essai à intensité croissante',
  'Bien récupérer (2 à 3 minutes) avant chaque épreuve'
];

const CONTRASTE: CleePhase[] = ['c2', 'c3', 'c4'];

const A: Modele = {
  lettre: 'A', nom: 'Explosivité et force du bas du corps', echauffement: ECH_BAS,
  elements: [
    { role: 'plyo', ex: { reprise: 'squat-jump', c3: 'saut-profondeur', defaut: 'saut-box' }, priorite: 1 },
    { role: 'plyo2', ex: { reprise: 'saut-longueur', defaut: 'bonds-enchaines' }, priorite: 2 },
    { role: 'force_principal', ex: 'squat-arriere', priorite: 1, groupe: { id: 'contraste-bas', phases: CONTRASTE, reposIntra: 60 } },
    { role: 'contraste', ex: 'squat-jump', priorite: 2, phases: CONTRASTE, groupe: { id: 'contraste-bas', reposIntra: 0 } },
    { role: 'force_secondaire', ex: 'squat-bulgare-halteres', priorite: 2 },
    { role: 'isolation', ex: { reprise: 'mollets-debout', defaut: 'mollets-machine' }, priorite: 3 },
    { role: 'gainage', ex: { reprise: 'planche', defaut: 'roue-abdo' }, priorite: 3 }
  ]
};
const B: Modele = {
  lettre: 'B', nom: 'Haut du corps et boxe', echauffement: ECH_HAUT,
  elements: [
    { role: 'lancer_rot', ex: 'lancer-mb-rotation', priorite: 1 },
    { role: 'lancer', ex: 'lancer-mb-poitrine', priorite: 2, phases: ['reprise', 'c1'] },
    { role: 'force_principal', ex: 'developpe-couche', priorite: 1, groupe: { id: 'contraste-haut', phases: CONTRASTE, reposIntra: 60 } },
    { role: 'lancer', ex: 'lancer-mb-poitrine', priorite: 2, phases: CONTRASTE, groupe: { id: 'contraste-haut', reposIntra: 0 } },
    { role: 'force_secondaire', ex: 'tractions', priorite: 1, groupe: { id: 'tirer-pousser', reposIntra: 60 } },
    { role: 'hypertrophie', ex: 'dips', priorite: 2, groupe: { id: 'tirer-pousser', reposIntra: 60 } },
    { role: 'isolation', ex: 'elevations-laterales', priorite: 3, groupe: { id: 'bras-b', reposIntra: 0 } },
    { role: 'isolation', ex: 'curl-poulie', priorite: 3, groupe: { id: 'bras-b', reposIntra: 0 } },
    { role: 'isolation', ex: 'extension-triceps-haltere', priorite: 3, groupe: { id: 'bras-b', reposIntra: 0 } },
    { role: 'boxe', ex: 'rounds-sac', priorite: 2 }
  ]
};
const C: Modele = {
  lettre: 'C', nom: 'Vitesse, appuis et chaîne arrière', echauffement: ECH_VITESSE,
  elements: [
    { role: 'sprint', ex: 'sprint-court', priorite: 1 },
    { role: 'sprint_max', ex: 'sprint-lance', priorite: 1, phases: ['c2', 'c3', 'c4'] },
    { role: 'cod', ex: { reprise: 'pas-chasses', defaut: 'navettes-cod' }, priorite: 2 },
    { role: 'olympique', ex: { reprise: 'swing-kettlebell', defaut: 'epaule-suspension' }, priorite: 1 },
    { role: 'force_principal', ex: 'souleve-terre-roumain', priorite: 1 },
    { role: 'nordic', ex: 'nordic-curl', priorite: 2, groupe: { id: 'nordic-gainage', reposIntra: 30 } },
    { role: 'gainage', ex: 'pallof', priorite: 3, groupe: { id: 'nordic-gainage', reposIntra: 30 } }
  ]
};
const D: Modele = {
  lettre: 'D', nom: 'Physique et cardio', echauffement: ECH_HAUT,
  elements: [
    { role: 'force_secondaire', ex: 'developpe-militaire', priorite: 1 },
    { role: 'hypertrophie', ex: 'rowing-barre', priorite: 1, groupe: { id: 'tirer-pousser-d', reposIntra: 60 } },
    { role: 'hypertrophie', ex: 'developpe-incline-halteres', priorite: 2, groupe: { id: 'tirer-pousser-d', reposIntra: 60 } },
    { role: 'isolation', ex: 'curl-halteres', priorite: 3, groupe: { id: 'bras-d', reposIntra: 0 } },
    { role: 'isolation', ex: 'extension-triceps-poulie', priorite: 3, groupe: { id: 'bras-d', reposIntra: 0 } },
    { role: 'isolation', ex: 'face-pull', priorite: 3, groupe: { id: 'bras-d', reposIntra: 0 } },
    { role: 'cardio', ex: 'velo-assault-intervalles', priorite: 2 }
  ]
};
const E: Modele = {
  lettre: 'E', nom: 'Haut du corps et corde', echauffement: ECH_HAUT,
  elements: [
    { role: 'hypertrophie', ex: 'developpe-halteres', priorite: 1 },
    { role: 'hypertrophie', ex: 'tirage-vertical-poulie', priorite: 1 },
    { role: 'isolation', ex: 'elevations-laterales-poulie', priorite: 3, groupe: { id: 'iso-e', reposIntra: 0 } },
    { role: 'isolation', ex: 'face-pull', priorite: 3, groupe: { id: 'iso-e', reposIntra: 0 } },
    { role: 'isolation', ex: 'curl-poulie', priorite: 3, groupe: { id: 'bras-e', reposIntra: 0 } },
    { role: 'isolation', ex: 'extension-triceps-haltere', priorite: 3, groupe: { id: 'bras-e', reposIntra: 0 } },
    { role: 'cardio', ex: 'corde-intervalles', priorite: 2 }
  ]
};
// Version à 3 séances : la séance C reprend le cardio de la séance D.
const C3: Modele = { ...C, elements: [...C.elements, { role: 'cardio', ex: 'velo-assault-intervalles', priorite: 3 }] };

export function modeles(seancesParSemaine: 3 | 4 | 5): Modele[] {
  if (seancesParSemaine === 3) return [A, B, C3];
  if (seancesParSemaine === 5) return [A, B, C, D, E];
  return [A, B, C, D];
}

function choisir(ex: ChoixExercice, phase: CleePhase, profil: Profil): string | undefined {
  const id = typeof ex === 'string' ? ex : ex[phase] ?? ex.defaut;
  if (id === 'epaule-suspension' && !profil.apprendreEpaule) return 'swing-kettlebell';
  return id;
}

function construire(modele: Modele, info: InfoSemaine, profil: Profil): SeancePrevue {
  const exercices: ExercicePrevu[] = [];
  const reprise = info.phase === 'reprise';
  for (const el of modele.elements) {
    if (el.phases && !el.phases.includes(info.phase)) continue;
    const id = choisir(el.ex, info.phase, profil);
    if (!id || !exercice(id)) continue;
    const pr = PRESCRIPTIONS[info.phase][el.role];
    if (pr.series === 0) continue;
    const series = info.allegee ? Math.max(1, Math.ceil(pr.series / 2)) : pr.series;
    const ex = exercice(id)!;
    const reps = el.reps ?? pr.reps;
    let prevu: ExercicePrevu;
    if (ex.mesure === 'tenue') prevu = prevoir(id, series, { dureeSec: pr.dureeSec ?? 30, reposSec: pr.reposSec });
    else prevu = prevoir(id, series, { reps: reps?.[1] ?? 8, reposSec: pr.reposSec });
    prevu.priorite = el.priorite;
    if (reps && ex.mesure !== 'tenue') prevu.repsMin = reps[0];
    const groupeActif = el.groupe && (!el.groupe.phases || el.groupe.phases.includes(info.phase));
    if (groupeActif) {
      prevu.groupe = el.groupe!.id;
      prevu.reposIntra = el.groupe!.reposIntra;
    }
    if (el.role === 'sprint' || el.role === 'sprint_max') {
      prevu.distanceM = el.role === 'sprint_max' ? 20 : DISTANCE_SPRINT[info.phase];
      prevu.consigne = info.allegee ? 'Semaine allégée : environ 80 % de votre vitesse.' : el.role === 'sprint_max' ? 'Vitesse maximale : 20 à 30 m d’élan progressif, puis 20 m à fond. Récupération complète (3 minutes au moins).' : CONSIGNES_SPRINT[info.phase];
    }
    if (el.role === 'contraste') prevu.consigne = 'Environ 1 minute après la série lourde : 3 sauts le plus haut possible, chaque saut à fond.';
    if (el.role === 'lancer' && groupeActif) prevu.consigne = 'Environ 1 minute après la série lourde : 3 lancers depuis la poitrine, le plus fort possible.';
    if (el.role === 'lancer_rot') prevu.consigne = 'Répétitions pour chaque côté. La force part du pied arrière et des hanches, comme un crochet.';
    if (el.role === 'nordic' && reprise) prevu.consigne = 'Version douce : descendez lentement sur la moitié du trajet seulement, puis repoussez-vous avec les mains.';
    if (el.role === 'olympique' && id === 'epaule-suspension' && info.phase === 'c1') prevu.consigne = 'Apprentissage : barre légère, la technique d’abord. Notez « Mouvement propre » quand c’est le cas.';
    if (el.role === 'cardio' && pr.dureeSec && pr.dureeSec >= 120) prevu.consigne = 'Intervalles longs : effort soutenu (difficile à parler), récupération en pédalant tranquillement.';
    if (reprise && (el.role === 'force_principal' || el.role === 'force_secondaire' || el.role === 'hypertrophie')) {
      prevu.consigne = 'Reprise : charge confortable, il doit vous rester 3 à 4 répétitions en réserve.';
    }
    if (!reprise && el.role === 'isolation' && !prevu.consigne) prevu.consigne = 'Dernière série : allez jusqu’à 0 ou 1 répétition de l’échec.';
    if (info.allegee && !prevu.consigne) prevu.consigne = 'Semaine allégée : moitié moins de séries, mêmes charges.';
    exercices.push(prevu);
  }
  return {
    id: `S${info.index + 1}-${modele.lettre}`,
    nom: modele.nom,
    exercices,
    echauffement: modele.echauffement,
    programme: { semaine: info.index, lettre: modele.lettre, type: 'entrainement' }
  };
}

/** Contacts au sol des sauts d'une séance (audit P7). */
export function contactsAuSol(plan: SeancePrevue): number {
  let n = 0;
  for (const e of plan.exercices) {
    const ex = exercice(e.exerciceId);
    if (!ex || !['saut_v', 'saut_h', 'bonds'].includes(ex.mouvement)) continue;
    const parJambe = e.exerciceId === 'bonds-une-jambe' ? 2 : 1;
    n += e.series * (e.reps ?? 0) * parJambe;
  }
  return n;
}

// ---------- Séances de test ----------

function seanceTestLeger(info: InfoSemaine): SeancePrevue {
  const max = 'Maximum de répétitions propres, en vous arrêtant 1 à 2 répétitions avant l’échec.';
  const ex: ExercicePrevu[] = [
    { ...prevoir('pompes', 1, { reps: 15, reposSec: 120 }), consigne: max },
    { ...prevoir('tractions', 1, { reps: 8, reposSec: 150 }), consigne: max },
    { ...prevoir('dips', 1, { reps: 10, reposSec: 150 }), consigne: max },
    { ...prevoir('planche', 1, { dureeSec: 120, reposSec: 90 }), consigne: 'Tenir jusqu’à 2 minutes au maximum, sans forcer au-delà.' },
    { ...prevoir('squat-goblet', 1, { reps: 10, reposSec: 90 }), consigne: 'Une série de 10 avec une charge confortable : elle sert à régler vos premières charges.' }
  ];
  for (const e of ex) e.priorite = 1;
  // Après les tests : un vrai bloc de travail pour que la séance ne soit pas « pour rien ».
  const reprise = 'Reprise : charge confortable, il doit vous rester 3 à 4 répétitions en réserve.';
  const suite = [
    { ...prevoir('developpe-militaire', 3, { reps: 12, reposSec: 90 }), repsMin: 10, consigne: reprise, priorite: 2 as const },
    { ...prevoir('rowing-barre', 3, { reps: 12, reposSec: 90 }), repsMin: 10, consigne: reprise, priorite: 2 as const },
    { ...prevoir('face-pull', 3, { reps: 15, reposSec: 60 }), repsMin: 12, priorite: 3 as const },
    { ...prevoir('velo-assault-intervalles', 8, { dureeSec: 20, reposSec: 40 }), priorite: 3 as const }
  ];
  ex.push(...suite);
  return {
    id: `S${info.index + 1}-L`,
    nom: 'Test léger de reprise',
    exercices: ex,
    echauffement: ECH_HAUT,
    programme: { semaine: info.index, lettre: 'L', type: 'test_leger' }
  };
}

function seanceTestAthletique(info: InfoSemaine): SeancePrevue {
  return {
    id: `S${info.index + 1}-T1`,
    nom: 'Tests athlétiques',
    exercices: EPREUVES.map(prevoirEpreuve),
    echauffement: ECH_TEST,
    programme: { semaine: info.index, lettre: 'T1', type: 'test' }
  };
}

function seanceTestForce(info: InfoSemaine): SeancePrevue {
  const charge = 'Montez par paliers jusqu’à une charge que vous ne pouvez soulever que 3 à 5 fois, jamais jusqu’à l’échec complet. Le maximum est estimé à partir de la meilleure série.';
  const reps = 'Maximum de répétitions propres, une seule série.';
  const exercices: ExercicePrevu[] = [
    { ...prevoir('squat-arriere', 4, { reps: 5, reposSec: 180 }), consigne: charge },
    { ...prevoir('developpe-couche', 4, { reps: 5, reposSec: 180 }), consigne: charge },
    { ...prevoir('souleve-terre-roumain', 4, { reps: 5, reposSec: 180 }), consigne: charge },
    { ...prevoir('tractions', 1, { reps: 10, reposSec: 180 }), consigne: reps },
    { ...prevoir('dips', 1, { reps: 12, reposSec: 180 }), consigne: reps },
    { ...prevoir('pompes', 1, { reps: 25, reposSec: 120 }), consigne: reps }
  ];
  for (const e of exercices) e.priorite = 1;
  return {
    id: `S${info.index + 1}-T2`,
    nom: 'Tests de force',
    exercices,
    echauffement: ECH_HAUT,
    programme: { semaine: info.index, lettre: 'T2', type: 'test' }
  };
}

export function seanceMobilite(index: number): SeancePrevue {
  const ids = ['mob-hanches-9090', 'mob-cheville-mur', 'mob-flechisseurs', 'mob-thoracique', 'mob-epaules-serviette', 'planche-laterale'];
  return {
    id: `S${index + 1}-M`,
    nom: 'Mobilité (jour de repos)',
    exercices: ids.map((id) => ({ ...prevoir(id, 2, { dureeSec: 60, reposSec: 15 }), priorite: 2 as const })),
    programme: { semaine: index, lettre: 'M', type: 'mobilite' }
  };
}

/** Les séances d'une semaine, dans l'ordre où les faire. */
export function seancesDeLaSemaine(profil: Profil, index: number): SeancePrevue[] {
  const info = infoSemaine(index);
  const normales = modeles(profil.seancesParSemaine).map((m) => construire(m, info, profil));
  if (info.test === 'leger') return [...normales.slice(0, -1), seanceTestLeger(info)];
  if (info.test === 'complet') return [...normales.slice(0, normales.length - 2), seanceTestAthletique(info), seanceTestForce(info)];
  return normales;
}

/** Prochaine séance à faire : la première de la semaine qui n'est pas encore faite (une séance manquée n'est pas perdue). */
export function prochaineSeance(semaine: SeancePrevue[], lettresFaites: Set<string>): SeancePrevue | undefined {
  return semaine.find((s) => !lettresFaites.has(s.programme?.lettre ?? ''));
}

export function indexSemaine(debut: Date, aujourdhui: Date): number {
  const ua = Date.UTC(debut.getFullYear(), debut.getMonth(), debut.getDate());
  const ub = Date.UTC(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
  return Math.floor((ub - ua) / 86400000 / 7);
}
