// Données du jalon J7 : performances, bilan de la semaine, ajustement, compléments pris.

import { db } from './db';
import { seancesDepuis, donneesAllegement } from './programme';
import { mesures } from './nutrition';
import { maxEstime } from '../domain/progression';
import { exercice } from '../domain/exercices';
import { tendanceA } from '../domain/corps';
import { raisonAllegement } from '../domain/adaptation';
import type { DonneesBilan, Tendance } from '../domain/bilan';
import type { Seance, Serie } from '../domain/types';

const JOUR = 86400000;
const TYPES_ENTRAINEMENT = ['entrainement', 'test', 'test_leger', 'libre'];

function estEntrainement(s: Seance): boolean {
  const t = s.plan.programme?.type;
  return !t || TYPES_ENTRAINEMENT.includes(t);
}

async function seriesDe(seances: Seance[]): Promise<Serie[]> {
  const ids = seances.map((s) => s.id);
  return ids.length ? db.series.where('seanceId').anyOf(ids).toArray() : [];
}

function meilleursMax(series: Serie[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of series) {
    if (exercice(s.exerciceId)?.mesure !== 'charge_reps') continue;
    const v = maxEstime(s.chargeKg ?? 0, s.reps ?? 0) ?? 0;
    if (v > (m.get(s.exerciceId) ?? 0)) m.set(s.exerciceId, v);
  }
  return m;
}

/**
 * Évolution des maximums estimés des exercices avec charge : meilleur des 14 derniers jours
 * comparé au meilleur des 4 semaines d'avant (moyenne des rapports).
 */
export async function performances(fin = Date.now()): Promise<Tendance | undefined> {
  const toutes = (await seancesDepuis(fin - 42 * JOUR)).filter((s) => (s.fin ?? s.debut) < fin && estEntrainement(s));
  const series = await seriesDe(toutes);
  const recent = meilleursMax(series.filter((s) => s.faiteLe >= fin - 14 * JOUR));
  const avant = meilleursMax(series.filter((s) => s.faiteLe < fin - 14 * JOUR));
  const rapports = [...recent].filter(([id]) => avant.has(id)).map(([id, v]) => v / avant.get(id)!);
  if (!rapports.length) return undefined;
  const moyenne = rapports.reduce((a, b) => a + b, 0) / rapports.length;
  return moyenne > 1.01 ? 'hausse' : moyenne < 0.99 ? 'baisse' : 'stable';
}

/** Bilan de la semaine qui commence au lundi donné. */
export async function calculerBilan(lundi: number, opts: { seancesPrevues: number; sommeil: Record<string, number>; fatigues: number[] }): Promise<DonneesBilan> {
  const fin = lundi + 7 * JOUR;
  const semaine = (await seancesDepuis(lundi)).filter((s) => (s.fin ?? s.debut) < fin);
  const entrainements = semaine.filter(estEntrainement);
  const activites = semaine.filter((s) => s.plan.programme?.type === 'activite').map((s) => ({ nom: s.nom, minutes: Math.round(((s.fin ?? s.debut) - s.debut) / 60000) }));
  const series = await seriesDe(entrainements);
  const volumeKg = series.reduce((t, s) => t + (s.chargeKg ?? 0) * (s.reps ?? 0), 0);

  // Records : meilleur maximum estimé de la semaine supérieur à tout ce qui précède.
  const avantSemaine = (await seancesDepuis(0)).filter((s) => (s.fin ?? s.debut) < lundi);
  const maxAvant = meilleursMax(await seriesDe(avantSemaine));
  const records = [...meilleursMax(series)].filter(([id, v]) => maxAvant.has(id) && v > maxAvant.get(id)!).map(([id]) => exercice(id)?.nom ?? id);

  const pesees = await mesures('poids');
  const apres = tendanceA(pesees, fin - 1);
  const avant = tendanceA(pesees, lundi - 1);
  const tailles = (await mesures('taille')).filter((m) => m.date < fin);
  const derniere = tailles[tailles.length - 1];
  const taille = derniere && derniere.date >= lundi ? { valeur: derniere.valeur, variation: tailles.length > 1 ? derniere.valeur - tailles[tailles.length - 2].valeur : undefined } : undefined;

  const jours = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi + i * JOUR + 12 * 3600000);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  });
  const journal = await db.journal.where('jour').anyOf(jours).toArray();
  const joursSaisis = jours.filter((j) => journal.some((e) => e.jour === j));
  const somme = (k: 'kcal' | 'proteines') => journal.reduce((t, e) => t + e.nutriments[k], 0);
  const nuits = jours.map((j) => opts.sommeil[j]).filter((h): h is number => h !== undefined);

  const donnees = await donneesAllegement(opts.fatigues, lundi, fin);
  const raison = raisonAllegement(donnees);

  return {
    lundi,
    seancesFaites: entrainements.length,
    seancesPrevues: opts.seancesPrevues,
    activites,
    volumeKg,
    records,
    performances: await performances(fin),
    poids: apres !== undefined ? { avant, apres } : undefined,
    taille,
    nutrition: {
      jours: joursSaisis.length,
      kcal: joursSaisis.length ? somme('kcal') / joursSaisis.length : undefined,
      proteines: joursSaisis.length ? somme('proteines') / joursSaisis.length : undefined
    },
    sommeil: { nuits: nuits.length, moyenne: nuits.length ? nuits.reduce((a, b) => a + b, 0) / nuits.length : undefined, courtes: nuits.filter((h) => h < 6).length },
    recommandation: raison ? `Semaine allégée conseillée : ${raison}` : undefined
  };
}

/** La semaine contient-elle quelque chose à résumer ? */
export async function semaineActive(lundi: number): Promise<boolean> {
  const fin = lundi + 7 * JOUR;
  const s = (await seancesDepuis(lundi)).some((x) => (x.fin ?? x.debut) < fin);
  const m = (await db.mesures.where('date').between(lundi, fin).count()) > 0;
  return s || m;
}

/** Jours consécutifs (jusqu'à aujourd'hui ou hier) où un complément a été noté. */
export async function joursDAffilee(alimentId: string, jours: string[]): Promise<{ aujourdhui: boolean; serie: number }> {
  const entrees = await db.journal.where('jour').anyOf(jours).toArray();
  const pris = new Set(entrees.filter((e) => e.alimentId === alimentId).map((e) => e.jour));
  const aujourdhui = pris.has(jours[0]);
  let serie = 0;
  for (let i = aujourdhui ? 0 : 1; i < jours.length && pris.has(jours[i]); i++) serie++;
  return { aujourdhui, serie };
}
