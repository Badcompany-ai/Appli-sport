// Besoins et objectifs journaliers (cahier des charges, partie 9).

import type { Profil } from './profil';

export type ModeNutrition = 'seche' | 'maintien' | 'prise';
export type RythmeNutrition = 'lent' | 'modere';

export interface ReglageNutrition {
  mode: ModeNutrition;
  rythme: RythmeNutrition;
  /** Correction issue de l'ajustement automatique (jalon J7), en kcal par jour. */
  correctionKcal: number;
}

export const NUTRITION_DEFAUT: ReglageNutrition = { mode: 'seche', rythme: 'lent', correctionKcal: 0 };

export const NOMS_MODES: Record<ModeNutrition, string> = { seche: 'Sèche', maintien: 'Maintien', prise: 'Prise de masse' };
export const NOMS_RYTHMES: Record<RythmeNutrition, string> = { lent: 'lent', modere: 'modéré' };

/**
 * Niveau d'activité hors sport : travail assis (FAO/OMS 2004 : 1,40 à 1,69 pour une vie sédentaire).
 * Le sport n'est pas compté dans ce niveau : il est ajouté chaque jour d'après les séances et activités réelles.
 */
export const NIVEAU_HORS_SPORT = 1.4;

/** Métabolisme de base, formule de Mifflin-St Jeor (1990). */
export function metabolismeBase(profil: Pick<Profil, 'sexe' | 'tailleCm' | 'age'>, poidsKg: number): number {
  return 10 * poidsKg + 6.25 * profil.tailleCm - 5 * profil.age + (profil.sexe === 'homme' ? 5 : -161);
}

/** Écart journalier visé, en kcal : 1 kg ≈ 7 700 kcal ; rythme de 0,25 % (lent) ou 0,5 % (modéré) du poids par semaine. */
export function ecartJournalier(r: Pick<ReglageNutrition, 'mode' | 'rythme'>, poidsKg: number): number {
  if (r.mode === 'maintien') return 0;
  const pct = r.rythme === 'lent' ? 0.0025 : 0.005;
  const signe = r.mode === 'seche' ? -1 : 1;
  return (signe * pct * poidsKg * 7700) / 7;
}

export interface Objectifs {
  /** Dépense estimée du jour : base hors sport + sport. */
  depense: number;
  base: number;
  sport: number;
  kcal: number;
  proteines: number;
  lipides: number;
  glucides: number;
  fibres: number;
  /** Les calories sont un plafond en sèche, une cible au maintien, un minimum en prise de masse. */
  typeKcal: 'plafond' | 'cible' | 'minimum';
  /** Le plancher de sécurité a été appliqué. */
  plancher: boolean;
}

export function objectifsDuJour(profil: Pick<Profil, 'sexe' | 'tailleCm' | 'age'>, poidsKg: number, r: ReglageNutrition, sportKcal: number): Objectifs {
  const mb = metabolismeBase(profil, poidsKg);
  const base = mb * NIVEAU_HORS_SPORT;
  const depense = base + sportKcal;
  const brut = depense + ecartJournalier(r, poidsKg) + r.correctionKcal;
  // Garde-fous : jamais sous le métabolisme de base, ni sous 1 500 kcal (homme) ou 1 200 kcal (femme).
  const plancher = Math.max(mb, profil.sexe === 'homme' ? 1500 : 1200);
  const kcal = Math.max(brut, plancher);
  const proteines = (r.mode === 'seche' ? 2.0 : 1.8) * poidsKg;
  const lipides = Math.max((0.25 * kcal) / 9, 0.6 * poidsKg);
  const glucides = Math.max(0, (kcal - proteines * 4 - lipides * 9) / 4);
  return {
    depense: Math.round(depense),
    base: Math.round(base),
    sport: Math.round(sportKcal),
    kcal: Math.round(kcal),
    proteines: Math.round(proteines),
    lipides: Math.round(lipides),
    glucides: Math.round(glucides),
    fibres: 30,
    typeKcal: r.mode === 'seche' ? 'plafond' : r.mode === 'maintien' ? 'cible' : 'minimum',
    plancher: brut < plancher
  };
}

export const EXPLICATIONS: Record<'kcal' | 'proteines' | 'lipides' | 'glucides' | 'fibres', string> = {
  kcal: 'Métabolisme de base (Mifflin-St Jeor, 1990) × 1,4 pour une journée sans sport (FAO/OMS, 2004), plus la dépense des séances et activités du jour (Compendium des activités physiques, 2024), plus l’écart visé : 1 kg ≈ 7 700 kcal. Une perte lente préserve mieux la force (Garthe et collègues, 2011).',
  proteines: '2,0 g par kg en sèche, 1,8 g sinon : les gains plafonnent vers 1,6 g par kg (Morton et collègues, 2018) ; on vise plus haut en déficit pour protéger le muscle (Helms et collègues, 2014).',
  lipides: '25 % des calories, jamais sous 0,6 g par kg : l’EFSA recommande 20 à 35 % des calories en lipides.',
  glucides: 'Le reste des calories : ils alimentent les efforts intenses (Société internationale de nutrition sportive).',
  fibres: 'Au moins 30 g par jour (ANSES, Société suisse de nutrition).'
};
