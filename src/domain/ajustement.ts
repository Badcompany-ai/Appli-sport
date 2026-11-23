// Ajustement automatique des calories (cahier des charges 9.3) et idée I2 (« la silhouette avant la balance »).

import { rythme, type Mesure } from './corps';
import { ecartJournalier, type ReglageNutrition } from './nutrition';

const JOUR = 86400000;
export const PERIODE_JOURS = 14;
export const CORRECTION_MAX = 150;
export const SEUIL_KG_SEMAINE = 0.1;

export type Proposition =
  | { etat: 'attente'; texte: string; prochaine: number }
  | { etat: 'reporte'; texte: string }
  | { etat: 'aucun'; texte: string }
  | { etat: 'proposition'; delta: number; texte: string };

const f2 = (x: number) => String(Math.round(Math.abs(x) * 100) / 100).replace('.', ',');

function direction(kg: number): string {
  if (Math.abs(kg) < 0.005) return 'est restée stable';
  return `a ${kg < 0 ? 'baissé' : 'monté'} de ${f2(kg)} kg par semaine`;
}

/**
 * Tous les 14 jours, avec au moins 4 pesées : compare le rythme réel au rythme visé
 * et propose une correction de 150 kcal au plus. Rien en dessous de 0,1 kg par semaine d'écart.
 * I2 : en sèche, si le tour de taille récent baisse et que les performances montent,
 * on ne réduit pas davantage (recomposition).
 */
export function proposerAjustement(p: {
  pesees: Mesure[];
  tailles: Mesure[];
  reglage: ReglageNutrition;
  poidsKg: number;
  /** Date de la dernière décision (acceptée ou refusée), ou de la première pesée. */
  depuis: number;
  maintenant: number;
  performancesEnHausse: boolean;
}): Proposition {
  const prochaine = p.depuis + PERIODE_JOURS * JOUR;
  if (p.maintenant < prochaine) {
    const jours = Math.ceil((prochaine - p.maintenant) / JOUR);
    return { etat: 'attente', prochaine, texte: `Prochain ajustement dans ${jours} jour${jours > 1 ? 's' : ''}.` };
  }
  const periode = p.pesees.filter((m) => m.date > p.maintenant - PERIODE_JOURS * JOUR && m.date <= p.maintenant);
  const r = rythme(p.pesees, p.maintenant);
  if (periode.length < 4 || !r) {
    return { etat: 'reporte', texte: `Ajustement reporté : il faut au moins 4 pesées sur 2 semaines (${periode.length} pour l’instant).` };
  }
  const vise = (ecartJournalier(p.reglage, p.poidsKg) * 7) / 7700;
  const ecart = r.kgSemaine - vise;
  const debut = `Ces 2 semaines, votre tendance ${direction(r.kgSemaine)}${p.reglage.mode === 'maintien' ? '' : ` au lieu de ${vise < 0 ? '−' : '+'} ${f2(vise)}`}`;
  if (Math.abs(ecart) < SEUIL_KG_SEMAINE) return { etat: 'aucun', texte: `${debut} : c’est dans le rythme visé, rien à changer.` };
  let delta = Math.round((-ecart * 7700) / 7);
  delta = Math.max(-CORRECTION_MAX, Math.min(CORRECTION_MAX, delta));
  delta = Math.round(delta / 10) * 10;

  if (delta < 0 && p.reglage.mode === 'seche') {
    const recentes = p.tailles.filter((m) => m.date <= p.maintenant).sort((a, b) => a.date - b.date);
    const derniere = recentes[recentes.length - 1];
    const avant = recentes[recentes.length - 2];
    const recente = derniere && p.maintenant - derniere.date <= 28 * JOUR;
    if (recente && avant && derniere.valeur < avant.valeur && p.performancesEnHausse) {
      return {
        etat: 'aucun',
        texte: `${debut}, mais votre tour de taille baisse (${f2(derniere.valeur - avant.valeur)} cm) et vos performances montent : c’est une recomposition, l’objectif ne baisse pas.`
      };
    }
  }
  return { etat: 'proposition', delta, texte: `${debut} : objectif ajusté de ${delta < 0 ? '−' : '+'} ${Math.abs(delta)} kcal par jour.` };
}
