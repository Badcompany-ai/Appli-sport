// Adaptation au quotidien (cahier des charges, partie 7, et audit P8).
// Toutes ces fonctions sont pures : elles prennent une séance prévue et renvoient
// une nouvelle séance, avec la liste des ajustements expliqués en une phrase.

import { exercice, EXERCICES, NOMS_MUSCLES, type Exercice, type Muscle, type Mouvement } from './exercices';
import { arrondirCharge } from './progression';
import { candidats, convertir, estDisponible, prevoir, type Contexte } from './remplacement';
import { dureeEstimeeMin } from './demo';
import type { Dispo } from './materiel';
import type { ExercicePrevu, Ressenti, SeancePrevue } from './types';

export interface Ajustement {
  nom: string;
  raison: string;
  /** L'exercice est retiré de la séance (affiché grisé). */
  retire?: boolean;
}

export interface Adapte {
  plan: SeancePrevue;
  ajustements: Ajustement[];
}

const EXPLOSIFS: Mouvement[] = ['saut_v', 'saut_h', 'bonds', 'sprint', 'changement_direction'];
const PAS_DE_MAX = 'Pas d’effort maximal aujourd’hui : environ 80 % de votre vitesse ou de votre hauteur.';

function mouvementDe(e: ExercicePrevu): Mouvement | undefined {
  return exercice(e.exerciceId)?.mouvement;
}

function estExplosif(e: ExercicePrevu): boolean {
  const m = mouvementDe(e);
  return !!m && EXPLOSIFS.includes(m) && e.mesure !== 'test';
}

/** Un groupe réduit à un seul exercice redevient un exercice normal. */
export function nettoyerGroupes(exercices: ExercicePrevu[]): ExercicePrevu[] {
  return exercices.map((e) => {
    if (!e.groupe) return e;
    const n = exercices.filter((x) => x.groupe === e.groupe).length;
    return n > 1 ? e : { ...e, groupe: undefined, reposIntra: undefined };
  });
}

function estTest(plan: SeancePrevue): boolean {
  return plan.programme?.type === 'test' || plan.programme?.type === 'test_leger';
}

// ---------- 7.1 Temps disponible ----------

/** Durée totale en minutes, échauffement compris (10 minutes, ou 5 s'il est raccourci). */
export function dureeTotaleMin(plan: SeancePrevue): number {
  return dureeEstimeeMin(plan) + (plan.echauffement?.length ? (plan.echauffementCourt ? 5 : 10) : 0);
}

/**
 * Raccourcit la séance pour tenir dans le temps disponible, dans l'ordre de la règle 7.1 :
 * priorité 3 retirée, une série de moins en priorité 2, priorité 2 retirée,
 * une série de moins en priorité 1, échauffement raccourci (jamais supprimé).
 */
export function ajusterAuTemps(plan: SeancePrevue, minutes: number): Adapte {
  let p: SeancePrevue = { ...plan, exercices: [...plan.exercices] };
  const ajustements: Ajustement[] = [];
  const tient = () => dureeTotaleMin(p) <= minutes;
  if (tient()) return { plan, ajustements };

  const retirer = (prio: 2 | 3) => {
    for (let i = p.exercices.length - 1; i >= 0 && !tient(); i--) {
      const e = p.exercices[i];
      if ((e.priorite ?? 2) !== prio) continue;
      // Un exercice d'abord raccourci puis retiré n'apparaît qu'une fois.
      for (let k = ajustements.length - 1; k >= 0; k--) if (ajustements[k].nom === e.nom && !ajustements[k].retire) ajustements.splice(k, 1);
      ajustements.push({ nom: e.nom, raison: `Retiré : pas assez de temps (${prio === 3 ? 'complément' : 'soutien'}).`, retire: true });
      p = { ...p, exercices: nettoyerGroupes(p.exercices.filter((_, j) => j !== i)) };
    }
  };
  const uneSerieDeMoins = (prio: 1 | 2) => {
    for (let i = 0; i < p.exercices.length && !tient(); i++) {
      const e = p.exercices[i];
      if ((e.priorite ?? 2) !== prio || e.series <= 2 || e.mesure === 'test') continue;
      ajustements.push({ nom: e.nom, raison: `${e.series} → ${e.series - 1} séries : pas assez de temps.` });
      p = { ...p, exercices: p.exercices.map((x, j) => (j === i ? { ...x, series: x.series - 1 } : x)) };
    }
  };

  retirer(3);
  uneSerieDeMoins(2);
  retirer(2);
  uneSerieDeMoins(1);
  if (!tient() && p.echauffement?.length && !p.echauffementCourt) {
    p = { ...p, echauffementCourt: true };
    ajustements.push({ nom: 'Échauffement', raison: 'Raccourci à 5 minutes (jamais supprimé).' });
  }
  return { plan: p, ajustements };
}

// ---------- 7.3, 7.5 et P8 : alléger ----------

export type Allegement = 'fatigue' | 'sommeil' | 'semaine' | 'deplacement';

const TEXTES_ALLEGEMENT: Record<Allegement, string> = {
  fatigue: 'Fatigue signalée : 30 % de séries en moins, charges − 5 %, pas d’effort maximal en sprint ni en saut.',
  sommeil: 'Moins de 6 h de sommeil : un tiers de sauts et de sprints en moins. Les charges ne changent pas.',
  semaine: 'Semaine allégée : environ moitié moins de séries, mêmes charges, pas de sprint ni de saut au maximum.',
  deplacement: 'Version allégée : moitié moins de séries, mêmes charges, pour respecter la récupération.'
};

/** « dejaAllege » : la séance a déjà moins de séries (semaine ou version allégée) ; la fatigue ne baisse alors que les charges. */
export function alleger(plan: SeancePrevue, mode: Allegement, dejaAllege = false): Adapte {
  if (estTest(plan)) return { plan, ajustements: [] };
  const exercices = plan.exercices.map((e) => {
    const explosif = estExplosif(e);
    if (mode === 'sommeil') {
      if (!explosif) return e;
      return { ...e, series: Math.max(1, Math.round((e.series * 2) / 3)) };
    }
    if (mode === 'fatigue') {
      const r: ExercicePrevu = { ...e, series: dejaAllege ? e.series : Math.max(1, Math.round(e.series * 0.7)) };
      if (e.chargeKg && e.mesure === 'charge_reps') r.chargeKg = arrondirCharge(e.chargeKg * 0.95, e.pasKg ?? 2.5);
      if (explosif) r.consigne = PAS_DE_MAX;
      return r;
    }
    const r: ExercicePrevu = { ...e, series: Math.max(1, Math.ceil(e.series / 2)) };
    if (explosif) r.consigne = PAS_DE_MAX;
    return r;
  });
  const raison = mode === 'fatigue' && dejaAllege ? 'Fatigue signalée : charges − 5 %, pas d’effort maximal en sprint ni en saut (séries déjà réduites).' : TEXTES_ALLEGEMENT[mode];
  return { plan: { ...plan, exercices }, ajustements: [{ nom: 'Toute la séance', raison }] };
}

// ---------- 7.5 Douleur ----------

export type Zone = 'epaule' | 'coude' | 'poignet' | 'dos' | 'hanche' | 'genou' | 'cheville' | 'autre';

export const ZONES: { id: Zone; nom: string }[] = [
  { id: 'epaule', nom: 'Épaule' },
  { id: 'coude', nom: 'Coude' },
  { id: 'poignet', nom: 'Poignet' },
  { id: 'dos', nom: 'Dos' },
  { id: 'hanche', nom: 'Hanche' },
  { id: 'genou', nom: 'Genou' },
  { id: 'cheville', nom: 'Cheville' },
  { id: 'autre', nom: 'Autre' }
];

export const MESSAGE_MEDICAL =
  'L’application ne donne pas de conseil médical. Si une douleur persiste ou est vive, consultez un professionnel de santé.';

const ZONES_MOUVEMENT: Record<Mouvement, Zone[]> = {
  squat: ['genou', 'hanche', 'dos'],
  charniere: ['dos', 'hanche'],
  unilateral: ['genou', 'hanche', 'cheville'],
  poussee_h: ['epaule', 'coude', 'poignet'],
  poussee_v: ['epaule', 'coude', 'dos'],
  tirage_h: ['epaule', 'coude', 'dos'],
  tirage_v: ['epaule', 'coude'],
  saut_v: ['genou', 'cheville', 'hanche'],
  saut_h: ['genou', 'cheville', 'hanche'],
  bonds: ['genou', 'cheville', 'hanche'],
  sprint: ['cheville', 'genou', 'hanche'],
  changement_direction: ['cheville', 'genou'],
  lancer: ['epaule', 'coude', 'dos'],
  frappe: ['epaule', 'coude', 'poignet'],
  gainage_ext: ['dos'],
  gainage_rot: ['dos'],
  porter: ['poignet', 'dos'],
  mollets: ['cheville'],
  iso_biceps: ['coude', 'poignet'],
  iso_triceps: ['coude'],
  iso_epaules: ['epaule'],
  iso_pectoraux: ['epaule'],
  iso_quadriceps: ['genou'],
  iso_ischios: ['genou'],
  iso_avant_bras: ['poignet', 'coude'],
  iso_dos: ['epaule'],
  cardio: [],
  mobilite: []
};

const ZONES_CARDIO: Record<string, Zone[]> = {
  'velo-assault-intervalles': ['genou', 'hanche'],
  'rameur-intervalles': ['dos', 'genou'],
  'skierg-intervalles': ['epaule', 'dos'],
  'corde-intervalles': ['cheville', 'genou'],
  'navettes-intervalles': ['cheville', 'genou'],
  'burpees-intervalles': ['epaule', 'poignet', 'genou']
};

export function zonesExercice(ex: Exercice): Zone[] {
  return ex.mouvement === 'cardio' ? ZONES_CARDIO[ex.id] ?? [] : ZONES_MOUVEMENT[ex.mouvement];
}

function touche(ex: Exercice | undefined, zones: Zone[]): boolean {
  return !!ex && zonesExercice(ex).some((z) => zones.includes(z));
}

export function sollicite(e: ExercicePrevu, zones: Zone[]): boolean {
  return touche(exercice(e.exerciceId), zones);
}

/** Retire les exercices qui sollicitent une zone douloureuse, ou les remplace par un équivalent qui l'épargne. */
export function eviterZones(plan: SeancePrevue, zones: Zone[], ctx: Contexte): Adapte {
  const z = zones.filter((x) => x !== 'autre');
  if (!z.length) return { plan, ajustements: [] };
  const ajustements: Ajustement[] = [];
  const utilises = new Set(plan.exercices.map((e) => e.exerciceId));
  const exercices: ExercicePrevu[] = [];
  const noms = z.map((x) => ZONES.find((y) => y.id === x)!.nom.toLowerCase()).join(', ');
  for (const e of plan.exercices) {
    if (!sollicite(e, z)) {
      exercices.push(e);
      continue;
    }
    const cand = candidats(e, ctx, utilises).find((c) => !touche(c.ex, z));
    if (cand) {
      utilises.add(cand.ex.id);
      exercices.push({ ...convertir(e, cand.ex, ctx).nouveau, choixManuel: e.choixManuel });
      ajustements.push({ nom: e.nom, raison: `Remplacé par ${cand.ex.nom} : épargne la zone signalée (${noms}).` });
    } else {
      ajustements.push({ nom: e.nom, raison: `Retiré : sollicite la zone signalée (${noms}).`, retire: true });
    }
  }
  return { plan: { ...plan, exercices: nettoyerGroupes(exercices) }, ajustements };
}

// ---------- 7.3 Proposer une semaine allégée ----------

/**
 * Vrai quand une série de valeurs (maximum estimé ou répétitions, de la plus ancienne à la plus récente)
 * stagne ou baisse sur les 3 dernières séances : aucune ne dépasse la valeur d'avant.
 */
export function stagne(valeurs: number[]): boolean {
  if (valeurs.length < 4) return false;
  const avant = valeurs[valeurs.length - 4];
  return valeurs.slice(-3).every((v) => v <= avant);
}

export function raisonAllegement(donnees: {
  ressentisSemaine: Ressenti[];
  fatiguesSemaine: number;
  /** Valeurs par exercice principal, de la plus ancienne à la plus récente. */
  progressionPrincipaux: number[][];
}): string | undefined {
  const durs = donnees.ressentisSemaine.filter((r) => r === 'dur').length;
  if (durs >= 3) return `${durs} exercices jugés « trop dur » cette semaine.`;
  if (donnees.fatiguesSemaine >= 2) return `Fatigue signalée ${donnees.fatiguesSemaine} fois cette semaine.`;
  const n = donnees.progressionPrincipaux.filter(stagne).length;
  if (n >= 2) return `${n} exercices principaux stagnent ou baissent depuis 3 séances.`;
  return undefined;
}

// ---------- 7.4 Séances manquées ou déplacées ----------

/** Importance des séances quand il ne reste pas assez de jours (tests d'abord, puis A, C, B, D, E). */
const IMPORTANCE = ['T1', 'T2', 'L', 'A', 'C', 'B', 'D', 'E'];

/**
 * Séances encore faisables cette semaine. S'il reste moins de jours que de séances,
 * on garde les plus importantes ; les autres sont laissées (elles ne s'empilent pas sur la semaine suivante).
 */
export function seancesAFaire(semaine: SeancePrevue[], faites: Set<string>, joursRestants: number): { aFaire: SeancePrevue[]; laissees: SeancePrevue[] } {
  const restantes = semaine.filter((s) => !faites.has(s.programme?.lettre ?? ''));
  if (restantes.length <= joursRestants) return { aFaire: restantes, laissees: [] };
  const rang = (s: SeancePrevue) => {
    const i = IMPORTANCE.indexOf(s.programme?.lettre ?? '');
    return i < 0 ? 99 : i;
  };
  const gardees = new Set([...restantes].sort((a, b) => rang(a) - rang(b)).slice(0, Math.max(0, joursRestants)));
  return { aFaire: restantes.filter((s) => gardees.has(s)), laissees: restantes.filter((s) => !gardees.has(s)) };
}

/** Séance lourde du bas du corps : un exercice principal de squat, de charnière ou sur une jambe, avec charge. */
export function lourdeBasDuCorps(plan: SeancePrevue): boolean {
  return plan.exercices.some((e) => {
    const m = mouvementDe(e);
    return e.mesure === 'charge_reps' && (e.priorite ?? 1) === 1 && (m === 'squat' || m === 'charniere' || m === 'unilateral');
  });
}

export interface SeanceFaite {
  fin: number;
  plan: SeancePrevue;
}

const JOUR = 86400000;

function jourLocal(t: number): number {
  const d = new Date(t);
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / JOUR;
}

/** Contrôles de la règle 7.4 avant de faire une séance aujourd'hui. Renvoie les alertes, vides si tout va bien. */
export function controlesRecuperation(plan: SeancePrevue, historique: SeanceFaite[], maintenant: number): string[] {
  const alertes: string[] = [];
  const entrainements = historique.filter((s) => s.plan.programme?.type !== 'mobilite' && s.plan.programme?.type !== 'activite');
  if (lourdeBasDuCorps(plan)) {
    const recente = entrainements.find((s) => lourdeBasDuCorps(s.plan) && maintenant - s.fin < 48 * 3600000 && jourLocal(s.fin) !== jourLocal(maintenant));
    if (recente) {
      const h = Math.round((maintenant - recente.fin) / 3600000);
      alertes.push(`Moins de 48 h depuis une séance lourde du bas du corps (${recente.plan.nom}, il y a ${h} h).`);
    }
  }
  const jours = new Set(entrainements.map((s) => jourLocal(s.fin)));
  const aujourdhui = jourLocal(maintenant);
  if (!jours.has(aujourdhui) && jours.has(aujourdhui - 1) && jours.has(aujourdhui - 2) && jours.has(aujourdhui - 3)) {
    alertes.push('Ce serait un 4e jour d’entraînement d’affilée (3 au maximum).');
  }
  return alertes;
}

// ---------- 7.7 Équilibre musculaire ----------

/** Repère de séries difficiles par semaine pour chaque groupe. */
export const REPERES: Record<Muscle, number> = {
  pectoraux: 10, dos: 10, epaules: 8, biceps: 6, triceps: 6, avant_bras: 4, abdos: 6,
  fessiers: 10, quadriceps: 10, ischios: 10, mollets: 6
};

const SANS_VOLUME: Mouvement[] = ['cardio', 'mobilite'];

/** Séries difficiles par groupe : 1 pour un muscle principal, ½ pour un muscle secondaire. */
export function volumeParMuscle(series: { exerciceId: string }[]): Record<Muscle, number> {
  const v = Object.fromEntries(Object.keys(REPERES).map((m) => [m, 0])) as Record<Muscle, number>;
  for (const s of series) {
    const ex = exercice(s.exerciceId);
    if (!ex || SANS_VOLUME.includes(ex.mouvement)) continue;
    for (const m of ex.primaires) v[m] += 1;
    for (const m of ex.secondaires) v[m] += 0.5;
  }
  return v;
}

export interface AlerteEquilibre {
  muscle: Muscle;
  texte: string;
  suggestion?: Exercice;
}

/** Alerte quand un groupe est sous la moitié de son repère sur 7 jours, ou à zéro sur 10 jours. */
export function alertesEquilibre(sept: Record<Muscle, number>, dix: Record<Muscle, number>, dispo: Dispo, exclus: Set<string> = new Set()): AlerteEquilibre[] {
  const alertes: AlerteEquilibre[] = [];
  for (const m of Object.keys(REPERES) as Muscle[]) {
    if (sept[m] >= REPERES[m] / 2 && dix[m] > 0) continue;
    const suggestion = EXERCICES.find(
      (e) => e.primaires[0] === m && e.mesure !== 'test' && !SANS_VOLUME.includes(e.mouvement) && !exclus.has(e.id) && estDisponible(e, dispo)
    );
    const n = Math.round(sept[m] * 2) / 2;
    alertes.push({
      muscle: m,
      texte: `${NOMS_MUSCLES[m]} : ${String(n).replace('.', ',')} série${n > 1 ? 's' : ''} sur 7 jours (repère ${REPERES[m]}).`,
      suggestion
    });
  }
  return alertes;
}

/** Exercice ajouté à la séance du jour (suggestion d'équilibre ou séance libre). */
export function exerciceAjoute(id: string): ExercicePrevu {
  const ex = exercice(id)!;
  const base =
    ex.mesure === 'tenue'
      ? ex.mouvement === 'cardio'
        ? prevoir(id, 6, { dureeSec: 30, reposSec: 30 })
        : prevoir(id, 3, { dureeSec: 30, reposSec: 45 })
      : ex.mesure === 'reps'
        ? prevoir(id, 3, { reps: 6, reposSec: 90 })
        : prevoir(id, 3, { reps: 12, reposSec: 75 });
  return { ...base, repsMin: base.reps ? Math.max(1, base.reps - 2) : undefined, priorite: 3 };
}
