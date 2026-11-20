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

/** Durée estimée d'une séance en minutes : effort + repos + 1 minute d'installation par exercice.
 * Dans un enchaînement de 2 exercices, le repos entre eux est court et le vrai repos vient après la paire. */
export function dureeEstimeeMin(plan: SeancePrevue): number {
  let sec = 0;
  plan.exercices.forEach((ex, i) => {
    const effort = ex.mesure === 'tenue' ? ex.dureeSec ?? 30 : (ex.reps ?? 8) * 4;
    const suivant = plan.exercices[i + 1];
    const dansPaire = !!ex.groupe && suivant?.groupe === ex.groupe;
    const membres = plan.exercices.filter((x) => ex.groupe && x.groupe === ex.groupe);
    const reposTour = membres.length ? Math.max(...membres.map((x) => x.reposSec)) : ex.reposSec;
    const repos = dansPaire ? ex.series * (ex.reposIntra ?? 0) : (ex.series - 1) * reposTour;
    sec += ex.series * effort + repos + (ex.groupe && plan.exercices[i - 1]?.groupe === ex.groupe ? 0 : 60);
  });
  return Math.round(sec / 60);
}
