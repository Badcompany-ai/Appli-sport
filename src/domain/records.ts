// Records personnels et données des graphiques par exercice (cahier des charges 4.8 et 5.6).

import { exercice } from './exercices';
import { maxEstime } from './progression';
import type { Seance, Serie } from './types';

export type Indicateur = 'max' | 'reps' | 'duree' | 'valeur';

/** Ce qu'on suit pour un exercice : maximum estimé (charge totale, poids du corps compris), répétitions, durée ou valeur de test. */
export function indicateur(exerciceId: string): Indicateur {
  const ex = exercice(exerciceId);
  if (!ex) return 'valeur';
  if (ex.mesure === 'tenue') return 'duree';
  if (ex.mesure === 'reps') return 'reps';
  return 'max';
}

/** Charge totale d'une série : poids du corps (part portée) + lest, ou charge externe. */
export function chargeTotale(exerciceId: string, s: Serie, poidsCorpsKg: number): number {
  const ex = exercice(exerciceId);
  if (ex?.charge === 'corps') return (ex.partPoidsDuCorps ?? 1) * poidsCorpsKg + (s.chargeKg ?? 0);
  return s.chargeKg ?? 0;
}

/** Valeur d'une série pour l'indicateur de l'exercice. */
export function valeurSerie(s: Serie, poidsCorpsKg: number): number | undefined {
  const ind = indicateur(s.exerciceId);
  if (ind === 'duree') return s.dureeSec;
  if (ind === 'reps') return s.reps;
  if (ind === 'valeur') return s.valeur;
  return maxEstime(chargeTotale(s.exerciceId, s, poidsCorpsKg), s.reps ?? 0);
}

export interface Point {
  date: number;
  valeur: number;
  seanceId: string;
}

/** Meilleure valeur de chaque séance, dans l'ordre chronologique (séances terminées, non supprimées). */
export function pointsExercice(exerciceId: string, seances: Seance[], series: Serie[], poidsCorpsKg: number): Point[] {
  const valides = new Map(seances.filter((s) => !s.supprimeeLe && s.statut === 'terminee').map((s) => [s.id, s]));
  const parSeance = new Map<string, number>();
  for (const s of series) {
    if (s.exerciceId !== exerciceId || !valides.has(s.seanceId)) continue;
    const v = valeurSerie(s, poidsCorpsKg);
    if (v === undefined || !(v > 0)) continue;
    parSeance.set(s.seanceId, Math.max(parSeance.get(s.seanceId) ?? 0, v));
  }
  return [...parSeance.entries()]
    .map(([id, valeur]) => ({ seanceId: id, valeur: Math.round(valeur * 10) / 10, date: valides.get(id)!.debut }))
    .sort((a, b) => a.date - b.date);
}

export interface Record {
  exerciceId: string;
  nom: string;
  indicateur: Indicateur;
  valeur: number;
  ancien?: number;
}

/**
 * Records battus pendant une séance : la meilleure valeur de la séance dépasse
 * strictement la meilleure valeur de toutes les séances précédentes (première fois exclue).
 */
export function recordsBattus(seanceId: string, seances: Seance[], series: Serie[], poidsCorpsKg: number): Record[] {
  const seance = seances.find((s) => s.id === seanceId);
  if (!seance) return [];
  const ids = [...new Set(series.filter((s) => s.seanceId === seanceId).map((s) => s.exerciceId))];
  const res: Record[] = [];
  for (const id of ids) {
    const autres = seances.filter((s) => s.id !== seanceId && s.debut < seance.debut);
    const avant = pointsExercice(id, autres, series, poidsCorpsKg);
    if (!avant.length) continue;
    const ancien = Math.max(...avant.map((p) => p.valeur));
    const ici = Math.max(0, ...series.filter((s) => s.seanceId === seanceId && s.exerciceId === id).map((s) => valeurSerie(s, poidsCorpsKg) ?? 0));
    if (ici > ancien + 0.05) res.push({ exerciceId: id, nom: exercice(id)?.nom ?? id, indicateur: indicateur(id), valeur: Math.round(ici * 10) / 10, ancien });
  }
  return res;
}

/** Force relative : maximum estimé ÷ poids du corps (par exemple 1,4 × votre poids). */
export function forceRelative(max: number, poidsCorpsKg: number): number {
  return poidsCorpsKg > 0 ? Math.round((max / poidsCorpsKg) * 100) / 100 : 0;
}
