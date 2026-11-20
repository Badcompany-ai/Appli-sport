import type { SeancePrevue } from './types';
import { prevoir } from './remplacement';

/**
 * Séance de démonstration (jalons J1 et J2), proche de la future séance A.
 * Le vrai programme, généré à partir du profil, arrive au jalon J3.
 */
export const SEANCE_DEMO: SeancePrevue = {
  id: 'demo',
  nom: 'Séance de démonstration',
  exercices: [
    prevoir('saut-box', 3, { reps: 5, reposSec: 90 }),
    prevoir('squat-arriere', 3, { reps: 5, chargeKg: 60, reposSec: 150 }),
    prevoir('developpe-couche', 3, { reps: 6, chargeKg: 60, reposSec: 120 }),
    prevoir('tractions', 3, { reps: 6, chargeKg: 0, reposSec: 120 }),
    prevoir('lancer-mb-poitrine', 3, { reps: 5, reposSec: 60 }),
    prevoir('velo-assault-intervalles', 6, { dureeSec: 30, reposSec: 30 }),
    prevoir('planche', 2, { dureeSec: 45, reposSec: 45 })
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
