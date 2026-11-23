import { nombre } from './format';
// Bilan hebdomadaire (cahier des charges 4.11) : chiffres de la semaine et lecture croisée, neutre et factuelle.

export type Tendance = 'hausse' | 'stable' | 'baisse';

export interface DonneesBilan {
  /** Lundi de la semaine (début du jour). */
  lundi: number;
  seancesFaites: number;
  seancesPrevues: number;
  activites: { nom: string; minutes: number }[];
  volumeKg: number;
  records: string[];
  /** Maximums estimés des exercices principaux par rapport aux semaines précédentes. */
  performances?: Tendance;
  poids?: { avant?: number; apres: number };
  taille?: { valeur: number; variation?: number };
  nutrition: { jours: number; kcal?: number; proteines?: number; objectifProteines?: number };
  sommeil: { nuits: number; moyenne?: number; courtes: number };
  recommandation?: string;
}

const f1 = (x: number) => nombre(x, 1);
const ent = (x: number) => nombre(x);
const signe = (x: number) => `${x > 0 ? '+ ' : x < 0 ? '− ' : ''}${f1(Math.abs(x))}`;

const TEXTES_PERFS: Record<Tendance, string> = { hausse: 'en hausse', stable: 'stables', baisse: 'en baisse' };

/** Phrases de la lecture croisée, sans jugement ni couleur. */
export function lectureCroisee(b: DonneesBilan): string[] {
  const l: string[] = [];
  l.push(`Séances : ${b.seancesFaites} sur ${b.seancesPrevues}${b.activites.length ? ` et ${b.activites.length} activité${b.activites.length > 1 ? 's' : ''}` : ''}.`);
  if (b.poids?.avant !== undefined) l.push(`Tendance du poids : ${signe(b.poids.apres - b.poids.avant)} kg (${f1(b.poids.apres)} kg).`);
  else if (b.poids) l.push(`Tendance du poids : ${f1(b.poids.apres)} kg.`);
  if (b.taille) l.push(`Tour de taille : ${b.taille.variation !== undefined ? `${signe(b.taille.variation)} cm` : `${f1(b.taille.valeur)} cm`}.`);
  if (b.performances) l.push(`Maximums estimés : ${TEXTES_PERFS[b.performances]}.`);
  if (b.nutrition.jours) l.push(`Apports moyens (${b.nutrition.jours} jour${b.nutrition.jours > 1 ? 's' : ''} saisi${b.nutrition.jours > 1 ? 's' : ''}) : ${ent(b.nutrition.kcal ?? 0)} kcal, ${ent(b.nutrition.proteines ?? 0)} g de protéines.`);
  if (b.sommeil.nuits) l.push(`Sommeil : ${f1(b.sommeil.moyenne ?? 0)} h en moyenne sur ${b.sommeil.nuits} nuit${b.sommeil.nuits > 1 ? 's' : ''}${b.sommeil.courtes ? `, dont ${b.sommeil.courtes} de moins de 6 h` : ''}.`);
  return l;
}

/** Cohérence avec le rythme visé (sèche) : la tendance baisse doucement, sans perte de performance. */
export function coherence(b: DonneesBilan, rythmeViseKgSemaine: number): string | undefined {
  if (b.poids?.avant === undefined) return undefined;
  const reel = b.poids.apres - b.poids.avant;
  if (Math.abs(reel - rythmeViseKgSemaine) <= 0.25) return 'Cohérent avec le rythme visé.';
  return reel < rythmeViseKgSemaine ? 'Plus rapide que le rythme visé sur cette semaine (une semaine seule varie beaucoup).' : 'Plus lent que le rythme visé sur cette semaine (une semaine seule varie beaucoup).';
}
