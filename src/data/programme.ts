import { db } from './db';
import { dernierePerformance } from './operations';
import { exercice } from '../domain/exercices';
import { arrondirCharge, maxEstime, prochaineCharge } from '../domain/progression';
import type { Seance, SeancePrevue, Serie } from '../domain/types';

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
      // Règle 7.2 : deux fois « trop dur » d'affilée → − 10 % et une série de moins.
      if (derniere && (await deuxFoisTropDur(e.exerciceId))) {
        const base = derniere.series.reduce((m, x) => Math.max(m, x.chargeKg ?? 0), 0);
        if (base > 0) {
          return {
            ...e,
            chargeKg: arrondirCharge(base * 0.9, e.pasKg ?? 2.5),
            series: Math.max(2, e.series - 1),
            raisonCharge: 'Deux fois « trop dur » d’affilée : − 10 % et une série de moins, pour repartir sur de bonnes bases.'
          };
        }
      }
      return { ...e, chargeKg: r.chargeKg ?? e.chargeKg, raisonCharge: r.raison };
    })
  );
  return { ...plan, exercices };
}

/** Les deux dernières séances avec cet exercice ont reçu le ressenti « trop dur ». */
export async function deuxFoisTropDur(exerciceId: string): Promise<boolean> {
  const ids = new Set((await db.series.where('exerciceId').equals(exerciceId).toArray()).map((x) => x.seanceId));
  const seances = (await db.seances.bulkGet([...ids])).filter((x): x is Seance => !!x && !x.supprimeeLe && x.statut === 'terminee');
  const deux = seances.sort((a, b) => b.debut - a.debut).slice(0, 2);
  return deux.length === 2 && deux.every((x) => x.ressentis?.[exerciceId] === 'dur');
}

// ---------- Adaptation (jalon J5) ----------

const JOUR_MS = 86400000;

/** Séances terminées et non supprimées depuis une date. */
export async function seancesDepuis(t: number): Promise<Seance[]> {
  const l = await db.seances.where('statut').equals('terminee').toArray();
  return l.filter((s) => !s.supprimeeLe && (s.fin ?? s.debut) >= t).sort((a, b) => (a.fin ?? a.debut) - (b.fin ?? b.debut));
}

/** Séries des séances terminées depuis une date (pour le volume par muscle). */
export async function seriesDepuis(t: number): Promise<Serie[]> {
  const seances = new Set((await seancesDepuis(t)).map((s) => s.id));
  const l = await db.series.where('faiteLe').aboveOrEqual(t).toArray();
  return l.filter((s) => seances.has(s.seanceId));
}

/** Données pour décider s'il faut proposer une semaine allégée (règle 7.3). */
export async function donneesAllegement(fatigues: number[], lundi: number, maintenant = Date.now()) {
  // « Dans la semaine » : depuis le lundi de la semaine en cours.
  const semaine = await seancesDepuis(lundi);
  const ressentisSemaine = semaine.flatMap((s) => Object.values(s.ressentis ?? {}));
  const fatiguesSemaine = fatigues.filter((t) => t >= lundi && t <= maintenant).length;
  // Exercices principaux : priorité 1 avec charge, suivis sur les 8 dernières semaines.
  const recentes = await seancesDepuis(maintenant - 8 * 7 * JOUR_MS);
  const valeurs = new Map<string, number[]>();
  for (const s of recentes) {
    const principaux = s.plan.exercices.filter((e) => e.priorite === 1 && e.mesure === 'charge_reps').map((e) => e.exerciceId);
    if (!principaux.length) continue;
    const series = await db.series.where('seanceId').equals(s.id).toArray();
    for (const id of principaux) {
      const best = Math.max(0, ...series.filter((x) => x.exerciceId === id).map((x) => maxEstime(x.chargeKg ?? 0, x.reps ?? 0) ?? 0));
      if (best > 0) valeurs.set(id, [...(valeurs.get(id) ?? []), best]);
    }
  }
  return { ressentisSemaine, fatiguesSemaine, progressionPrincipaux: [...valeurs.values()] };
}
