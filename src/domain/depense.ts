// Dépense d'énergie due au sport (idée de l'utilisateur, 22/11/2026).
// Valeurs MET du Compendium des activités physiques 2024 (Herrmann et collègues, pacompendium.com).
// Un MET = la dépense au repos. Dépense nette = (MET − 1) × poids (kg) × durée (h) :
// on retire le repos, déjà compté dans le métabolisme de base.

import { exercice } from './exercices';
import type { Seance } from './types';

export interface Activite {
  id: string;
  nom: string;
  met: number;
  /** Code du Compendium 2024. */
  code: string;
  note?: string;
}

export const ACTIVITES: Activite[] = [
  { id: 'basket-match', nom: 'Basket (match)', met: 8.0, code: '15040' },
  { id: 'basket-loisir', nom: 'Basket (shoots, entre amis)', met: 6.0, code: '15050' },
  { id: 'padel', nom: 'Padel', met: 6.0, code: '15680', note: 'Pas de valeur « padel » dans le Compendium : valeur du tennis en double.' },
  { id: 'tennis-simple', nom: 'Tennis (simple)', met: 8.0, code: '15690' },
  { id: 'tennis-double', nom: 'Tennis (double)', met: 6.0, code: '15680' },
  { id: 'foot', nom: 'Football (entre amis)', met: 7.0, code: '15610' },
  { id: 'foot-match', nom: 'Football (match)', met: 9.5, code: '15605' },
  { id: 'volley', nom: 'Volley-ball', met: 4.0, code: '15710' },
  { id: 'badminton', nom: 'Badminton', met: 5.5, code: '15030' },
  { id: 'squash', nom: 'Squash', met: 7.3, code: '15652' },
  { id: 'course', nom: 'Course à pied (8 km/h)', met: 8.5, code: '12030' },
  { id: 'course-rapide', nom: 'Course à pied (10 km/h)', met: 10.5, code: '12060' },
  { id: 'velo', nom: 'Vélo (sortie)', met: 6.8, code: '01200' },
  { id: 'natation', nom: 'Natation (tranquille)', met: 5.8, code: '18240' },
  { id: 'randonnee', nom: 'Randonnée', met: 6.0, code: '17080' },
  { id: 'marche', nom: 'Marche rapide', met: 4.8, code: '17200' },
  { id: 'ski', nom: 'Ski ou snowboard', met: 6.3, code: '19160' },
  { id: 'escalade', nom: 'Escalade (bloc)', met: 8.8, code: '15534' },
  { id: 'boxe', nom: 'Boxe (sparring)', met: 7.8, code: '15120' },
  { id: 'yoga', nom: 'Yoga', met: 2.3, code: '02175' },
  { id: 'autre', nom: 'Autre sport (intensité moyenne)', met: 6.0, code: '—' }
];

export function activite(id: string | undefined): Activite | undefined {
  return ACTIVITES.find((a) => a.id === id);
}

/** Dépense nette en kcal. */
export function kcalNettes(met: number, poidsKg: number, minutes: number): number {
  return Math.max(0, (met - 1) * poidsKg * (minutes / 60));
}

/** Séance de musculation et d'explosivité, repos compris (Compendium 02052 : 5,0). */
export const MET_SEANCE = 5.0;
/** Fractionné sur machine (Compendium 01305 : 8,8). */
export const MET_INTERVALLES = 8.8;
/** Rounds au sac (Compendium 15125 : 9,3). */
export const MET_ROUNDS = 9.3;
/** Mobilité et étirements (Compendium 02101 : 2,3). */
export const MET_MOBILITE = 2.3;

/** Dépense nette d'une séance terminée (durée réelle plafonnée à 2 h 30). */
export function kcalSeance(seance: Seance, series: { exerciceId: string; dureeSec?: number }[], poidsKg: number): number {
  const minutes = Math.min(150, Math.max(0, ((seance.fin ?? seance.debut) - seance.debut) / 60000));
  const act = seance.activite;
  if (act) return kcalNettes(act.met, poidsKg, minutes);
  if (seance.plan.programme?.type === 'mobilite') return kcalNettes(MET_MOBILITE, poidsKg, minutes);
  let kcal = kcalNettes(MET_SEANCE, poidsKg, minutes);
  // Le temps d'effort en fractionné ou en rounds dépense plus que la moyenne de la séance.
  for (const s of series) {
    const m = exercice(s.exerciceId)?.mouvement;
    if (!s.dureeSec || (m !== 'cardio' && m !== 'frappe')) continue;
    const met = m === 'cardio' ? MET_INTERVALLES : MET_ROUNDS;
    kcal += (met - MET_SEANCE) * poidsKg * (s.dureeSec / 3600);
  }
  return kcal;
}
