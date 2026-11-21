import { db } from './db';
import { dernierePerformance } from './operations';
import { exercice } from '../domain/exercices';
import { maxEstime, prochaineCharge } from '../domain/progression';
import type { SeancePrevue } from '../domain/types';

const DOUZE_SEMAINES = 12 * 7 * 86400000;

/** Meilleur maximum estimé récent sur un exercice (séries de 1 à 10 répétitions, séances non supprimées). */
export async function meilleurMax(exerciceId: string, maintenant = Date.now()): Promise<number | undefined> {
  const series = await db.series.where('exerciceId').equals(exerciceId).toArray();
  let best = 0;
  const cache = new Map<string, boolean>();
  for (const s of series) {
    if (maintenant - s.faiteLe > DOUZE_SEMAINES) continue;
    if (!cache.has(s.seanceId)) cache.set(s.seanceId, !(await db.seances.get(s.seanceId))?.supprimeeLe);
    if (!cache.get(s.seanceId)) continue;
    best = Math.max(best, maxEstime(s.chargeKg ?? 0, s.reps ?? 0) ?? 0);
  }
  return best || undefined;
}

/** Lettres des séances déjà faites dans une semaine du programme. */
export async function lettresFaites(semaine: number): Promise<Set<string>> {
  const l = await db.seances.where('statut').equals('terminee').toArray();
  return new Set(l.filter((s) => !s.supprimeeLe && s.plan.programme?.semaine === semaine).map((s) => s.plan.programme!.lettre));
}

/** Charges proposées pour chaque exercice, d'après l'historique (double progression). */
export async function appliquerProgression(plan: SeancePrevue): Promise<SeancePrevue> {
  const test = plan.programme?.type === 'test' || plan.programme?.type === 'test_leger';
  const exercices = await Promise.all(
    plan.exercices.map(async (e) => {
      const ex = exercice(e.exerciceId);
      if (!ex || test) return e;
      const avecCharge = e.mesure === 'charge_reps' || (e.mesure === 'poids_du_corps_reps' && ex.lestable);
      if (!avecCharge) return e;
      const derniere = await dernierePerformance(e.exerciceId);
      const max = e.mesure === 'charge_reps' ? await meilleurMax(e.exerciceId) : undefined;
      const reprise = plan.programme?.semaine !== undefined && plan.programme.semaine < 2;
      const ressenti = derniere?.seance.ressentis?.[e.exerciceId];
      const r = prochaineCharge(derniere?.series, e.reps ?? 8, e.pasKg ?? 2.5, max, e.repsMin ?? e.reps ?? 8, reprise ? 3 : 2, ressenti);
      if (e.mesure === 'poids_du_corps_reps' && !derniere) return { ...e, chargeKg: 0 };
      if (r.chargeKg === undefined && e.chargeKg !== undefined) return e;
      return { ...e, chargeKg: r.chargeKg ?? e.chargeKg, raisonCharge: r.raison };
    })
  );
  return { ...plan, exercices };
}
