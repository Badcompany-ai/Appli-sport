import type { SeancePrevue } from './types';

/**
 * Séance de démonstration du jalon J1. Le vrai programme, généré à partir du
 * profil, arrive au jalon J3. Elle est courte pour pouvoir être testée vite.
 */
export const SEANCE_DEMO: SeancePrevue = {
  id: 'demo',
  nom: 'Séance de démonstration',
  exercices: [
    {
      exerciceId: 'squat-arriere',
      nom: 'Squat arrière',
      mesure: 'charge_reps',
      series: 3,
      reps: 5,
      chargeKg: 60,
      reposSec: 120,
      pasKg: 2.5
    },
    {
      exerciceId: 'pompes',
      nom: 'Pompes',
      mesure: 'poids_du_corps_reps',
      series: 3,
      reps: 10,
      chargeKg: 0,
      reposSec: 90,
      pasKg: 2.5
    },
    {
      exerciceId: 'planche',
      nom: 'Gainage planche',
      mesure: 'tenue',
      series: 2,
      dureeSec: 45,
      reposSec: 60
    }
  ]
};

/** Durée estimée d'une séance en minutes : effort + repos + 1 minute d'installation par exercice. */
export function dureeEstimeeMin(plan: SeancePrevue): number {
  let sec = 0;
  for (const ex of plan.exercices) {
    const effort = ex.mesure === 'tenue' ? ex.dureeSec ?? 30 : (ex.reps ?? 8) * 4;
    sec += ex.series * effort + (ex.series - 1) * ex.reposSec + 60;
  }
  return Math.round(sec / 60);
}
