// Tests de niveau et objectifs (cahier des charges 5.9 et 5.10).

import type { ExercicePrevu, Seance, Serie } from './types';
import { maxEstime } from './progression';
import type { Dispo } from './materiel';

export type Unite = 'cm' | 's' | 'm' | 'palier';

export interface EpreuveMesure {
  id: string;
  nom: string;
  unite: Unite;
  /** Plus grand = mieux (sauf le sprint, où plus petit = mieux). */
  sens: 'haut' | 'bas';
  materiel: string[][];
  consigne: string;
  essais: number;
}

export const EPREUVES: EpreuveMesure[] = [
  {
    id: 'test-detente', nom: 'Détente verticale', unite: 'cm', sens: 'haut', materiel: [], essais: 3,
    consigne: 'Debout contre un mur, marquez la hauteur atteinte bras tendu. Sautez sur place et marquez le plus haut point touché. Notez la différence en centimètres ; gardez le meilleur de 3 essais.'
  },
  {
    id: 'test-longueur', nom: 'Saut en longueur sans élan', unite: 'cm', sens: 'haut', materiel: [], essais: 3,
    consigne: 'Pieds derrière une ligne, sautez le plus loin possible. Mesurez jusqu’au talon le plus proche de la ligne ; gardez le meilleur de 3 essais.'
  },
  {
    id: 'test-sprint20', nom: 'Sprint 20 m départ arrêté', unite: 's', sens: 'bas', materiel: [['espace_course']], essais: 2,
    consigne: 'Départ debout, chronométré par quelqu’un, ou filmé au ralenti. Récupération complète entre les essais ; gardez le meilleur temps.'
  },
  {
    id: 'test-lancer', nom: 'Lancer de médecine-ball depuis la poitrine', unite: 'm', sens: 'haut', materiel: [['medecine_ball']], essais: 3,
    consigne: 'Assis dos au mur ou debout, lancez le ballon le plus loin possible depuis la poitrine. Notez le poids du ballon pour refaire le test à l’identique.'
  },
  {
    id: 'test-navette', nom: 'Test navette 20 m (VO2 max estimée)', unite: 'palier', sens: 'haut', materiel: [['espace_course', 'panier_basket']], essais: 1,
    consigne: 'Allers-retours entre deux lignes à 20 m, au rythme des bips de l’application. La vitesse augmente chaque minute. Arrêtez quand vous ne tenez plus le rythme.'
  }
];

export function epreuve(id: string): EpreuveMesure | undefined {
  return EPREUVES.find((e) => e.id === id);
}

/** Vitesse d'un palier du test navette de Léger : 8,5 km/h au palier 1, + 0,5 km/h par palier. */
export function vitessePalier(palier: number): number {
  return 8 + 0.5 * palier;
}

/** VO2 max estimée (Léger, version adulte) : 6,0 × vitesse du dernier palier − 24,4. */
export function vo2DepuisPalier(palier: number): number {
  return Math.round((6 * vitessePalier(palier) - 24.4) * 10) / 10;
}

/** Durée d'un aller de 20 m au palier donné, en secondes. */
export function dureeNavette(palier: number): number {
  return 20 / (vitessePalier(palier) / 3.6);
}

/** Exercices de force du test complet (charge pour 3 à 5 répétitions, jamais un vrai maximum). */
export const TESTS_FORCE = ['squat-arriere', 'developpe-couche', 'souleve-terre-roumain'];
export const TESTS_REPETITIONS = ['tractions', 'dips', 'pompes'];

export function epreuveDisponible(e: EpreuveMesure, dispo: Dispo): boolean {
  return e.materiel.every((g) => g.some((id) => dispo.materiel.includes(id)));
}

/** Épreuve de test transformée en étape de séance. */
export function prevoirEpreuve(e: EpreuveMesure): ExercicePrevu {
  return {
    exerciceId: e.id,
    testId: e.id,
    nom: e.nom,
    mesure: 'test',
    series: 1,
    reposSec: 120,
    consigne: e.consigne,
    priorite: 1
  };
}

// ---------- Objectifs ----------

export interface Objectif {
  /** Identifiant de l'épreuve ou de l'exercice (maximum estimé). */
  id: string;
  nom: string;
  unite: string;
  sens: 'haut' | 'bas';
  depart: number;
  cible: number;
  echeance: string;
}

/** Gains proposés à 6 mois pour un sportif qui reprend (fourchettes prudentes, cahier des charges 5.10). */
const GAINS: Record<string, { type: 'pourcent' | 'ajout'; valeur: number }> = {
  'test-detente': { type: 'pourcent', valeur: 0.07 },
  'test-longueur': { type: 'pourcent', valeur: 0.05 },
  'test-sprint20': { type: 'pourcent', valeur: -0.04 },
  'test-lancer': { type: 'pourcent', valeur: 0.1 },
  'test-navette': { type: 'ajout', valeur: 2 },
  'squat-arriere': { type: 'pourcent', valeur: 0.15 },
  'developpe-couche': { type: 'pourcent', valeur: 0.12 },
  'souleve-terre-roumain': { type: 'pourcent', valeur: 0.15 },
  tractions: { type: 'ajout', valeur: 4 },
  dips: { type: 'ajout', valeur: 5 },
  pompes: { type: 'ajout', valeur: 8 }
};

export function arrondiObjectif(x: number, unite: string): number {
  if (unite === 's') return Math.round(x * 100) / 100;
  if (unite === 'm') return Math.round(x * 10) / 10;
  if (unite === 'kg') return Math.round(x / 2.5) * 2.5;
  return Math.round(x);
}

export function proposerObjectif(id: string, nom: string, unite: string, sens: 'haut' | 'bas', depart: number, echeance: string): Objectif | undefined {
  const g = GAINS[id];
  if (!g || !(depart > 0)) return undefined;
  const cible = g.type === 'pourcent' ? depart * (1 + g.valeur) : depart + g.valeur;
  return { id, nom, unite, sens, depart, cible: arrondiObjectif(cible, unite), echeance };
}

/** Avancement de 0 à 1 (borné), quel que soit le sens de l'objectif. */
export function avancement(o: Objectif, actuel: number): number {
  const total = o.cible - o.depart;
  if (total === 0) return 1;
  return Math.min(1, Math.max(0, (actuel - o.depart) / total));
}

/** Étapes intermédiaires : une cible par fin de cycle, découpée régulièrement. */
export function etapes(o: Objectif, nbCycles = 4): number[] {
  return Array.from({ length: nbCycles }, (_, i) => arrondiObjectif(o.depart + ((o.cible - o.depart) * (i + 1)) / nbCycles, o.unite));
}

// ---------- Résultats des tests ----------

export interface Resultat {
  date: number;
  valeur: number;
  seanceId: string;
}

/**
 * Résultats tirés des séances de test (source unique : l'historique, donc toute correction s'y reflète).
 * Épreuves : la valeur saisie. Force : meilleur maximum estimé. Répétitions : meilleure série.
 */
export function resultatsTests(seances: Seance[], series: Serie[]): Map<string, Resultat[]> {
  const parSeance = new Map<string, Serie[]>();
  for (const s of series) parSeance.set(s.seanceId, [...(parSeance.get(s.seanceId) ?? []), s]);
  const res = new Map<string, Resultat[]>();
  const ajouter = (id: string, r: Resultat) => res.set(id, [...(res.get(id) ?? []), r]);
  for (const se of seances) {
    const type = se.plan.programme?.type;
    if (se.supprimeeLe || se.statut !== 'terminee' || (type !== 'test' && type !== 'test_leger')) continue;
    const ss = parSeance.get(se.id) ?? [];
    for (const e of EPREUVES) {
      const v = ss.filter((x) => x.exerciceId === e.id && x.valeur !== undefined).map((x) => x.valeur!);
      if (v.length) ajouter(e.id, { date: se.debut, valeur: e.sens === 'haut' ? Math.max(...v) : Math.min(...v), seanceId: se.id });
    }
    if (type === 'test') {
      for (const id of TESTS_FORCE) {
        const m = ss.filter((x) => x.exerciceId === id).map((x) => maxEstime(x.chargeKg ?? 0, x.reps ?? 0) ?? 0);
        const best = Math.max(0, ...m);
        if (best > 0) ajouter(id, { date: se.debut, valeur: Math.round(best * 10) / 10, seanceId: se.id });
      }
    }
    for (const id of TESTS_REPETITIONS) {
      const r = ss.filter((x) => x.exerciceId === id).map((x) => x.reps ?? 0);
      const best = Math.max(0, ...r);
      if (best > 0) ajouter(id, { date: se.debut, valeur: best, seanceId: se.id });
    }
  }
  for (const l of res.values()) l.sort((a, b) => a.date - b.date);
  return res;
}
