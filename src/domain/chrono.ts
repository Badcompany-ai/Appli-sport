// Idée I3 : chronométrer un sprint sur une vidéo. On repère l'image du départ et celle de l'arrivée ;
// si la vidéo est un ralenti exporté (lu plus lentement), on divise par le facteur du ralenti.

export const FACTEURS = [
  { valeur: 1, nom: 'Vidéo normale ou ralenti lu à vitesse réelle' },
  { valeur: 4, nom: 'Ralenti lu 4 fois plus lentement (120 images/s)' },
  { valeur: 8, nom: 'Ralenti lu 8 fois plus lentement (240 images/s)' }
];

/** Temps réel en secondes, arrondi au centième. */
export function tempsReel(departSec: number, arriveeSec: number, facteur: number): number | undefined {
  const d = arriveeSec - departSec;
  if (!(d > 0) || !(facteur > 0)) return undefined;
  return Math.round((d / facteur) * 100) / 100;
}
