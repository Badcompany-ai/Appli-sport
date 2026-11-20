// Types partagés par toute l'application.

/** Façon de mesurer une série. */
export type Mesure = 'charge_reps' | 'poids_du_corps_reps' | 'reps' | 'tenue' | 'test';

export interface ExercicePrevu {
  /** Identifiant stable de l'exercice (sert à retrouver la dernière performance). */
  exerciceId: string;
  nom: string;
  mesure: Mesure;
  series: number;
  /** Répétitions visées (séries avec répétitions). */
  reps?: number;
  /** Charge visée en kg (charge externe ou lest). */
  chargeKg?: number;
  /** Durée visée en secondes (exercices tenus). */
  dureeSec?: number;
  /** Repos après chaque série, en secondes. */
  reposSec: number;
  /** Pas d'ajustement de la charge en kg. */
  pasKg?: number;
  /** Exercice prévu à l'origine, si celui-ci le remplace. */
  origineId?: string;
  /** Descente lente (3 secondes) pour compenser une charge trop légère. */
  tempoLent?: boolean;
  /** Remplacement choisi par l'utilisateur (conservé lors des recalculs). */
  choixManuel?: boolean;
  /** Bas de la fourchette de répétitions (le haut est « reps »). */
  repsMin?: number;
  /** 1 = travail principal, 2 = soutien, 3 = complément (pour raccourcir une séance). */
  priorite?: 1 | 2 | 3;
  /** Consigne du jour en une phrase (intensité, distance…). */
  consigne?: string;
  /** Explication de la charge proposée. */
  raisonCharge?: string;
  /** Épreuve de test de niveau mesurée par une valeur (cm, s, m, palier). */
  testId?: string;
}

export interface SeancePrevue {
  id: string;
  nom: string;
  exercices: ExercicePrevu[];
  /** Étapes de l'échauffement (méthode RAMP). */
  echauffement?: string[];
  /** Place dans le programme. */
  programme?: { semaine: number; lettre: string; type: 'entrainement' | 'test' | 'test_leger' | 'mobilite' };
}

export type StatutSeance = 'en_cours' | 'terminee';

/** Une séance réalisée (ou en cours), enregistrée dans l'appareil. */
export interface Seance {
  id: string;
  planId: string;
  nom: string;
  plan: SeancePrevue;
  statut: StatutSeance;
  debut: number;
  fin?: number;
  /** Position actuelle dans la séance (index de l'exercice). */
  exerciceIndex: number;
  /** Fin du repos en cours (horodatage), pour reprendre après une interruption. */
  reposFin?: number;
  /** Durée totale du repos en cours, en secondes. */
  reposTotalSec?: number;
  /** Notes libres par exercice. */
  notes: Record<string, string>;
  /** Lieu et matériel du jour (pour proposer des remplacements pendant la séance). */
  lieu?: 'salle' | 'maison' | 'exterieur';
  dispo?: { materiel: string[]; halteresMaxKg: number; kettlebellMaxKg: number };
  /** L'échauffement a été validé. */
  echauffementFait?: boolean;
  /** Suppression douce : la séance va à la corbeille pendant 30 jours. */
  supprimeeLe?: number;
}

/** Une série enregistrée. */
export interface Serie {
  id: string;
  seanceId: string;
  exerciceId: string;
  /** Numéro de la série dans l'exercice, à partir de 0. */
  numero: number;
  chargeKg?: number;
  reps?: number;
  dureeSec?: number;
  /** Résultat d'une épreuve de test (cm, s, m, palier). */
  valeur?: number;
  faiteLe: number;
}

export interface Reglage<T = unknown> {
  cle: string;
  valeur: T;
}

export interface Copie {
  id: string;
  creeeLe: number;
  raison: 'quotidienne' | 'avant_import';
  /** Contenu complet de la sauvegarde, au format d'export. */
  contenu: string;
}
