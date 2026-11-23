import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { ecrireReglage } from '../data/operations';
import type { Profil } from '../domain/profil';
import type { Objectif } from '../domain/niveau';
import type { Zone } from '../domain/adaptation';
import { RAPPELS_DEFAUT, type ReglageRappels } from '../domain/calendrier';

export interface ReglageRaccourci {
  actif: boolean;
  nom: string;
}

export const DEFAUTS = {
  raccourci: { actif: false, nom: 'Repos' } as ReglageRaccourci,
  sonApplication: true,
  derniereSauvegarde: 0,
  profil: null as Profil | null,
  objectifs: null as Objectif[] | null,
  /** Heures de fatigue signalées (pour proposer une semaine allégée). */
  fatigues: [] as number[],
  /** Zones douloureuses signalées, gardées jusqu'à ce que l'utilisateur les retire. */
  douleurs: [] as Zone[],
  /** Heures de sommeil par jour (AAAA-MM-JJ). */
  sommeil: {} as Record<string, number>,
  /** Réponse à la proposition de semaine allégée. */
  allegement: null as { semaine: number; accepte: boolean } | null,
  /** Rappel du tour de taille repoussé (« plus tard »). */
  tailleIgnoreeLe: 0,
  /** Lundi du dernier bilan hebdomadaire ouvert. */
  bilanVu: 0,
  /** Ajustement automatique : date de la dernière décision (0 = depuis la première pesée). */
  ajustementDepuis: 0,
  /** Rappels au Calendrier. */
  rappels: RAPPELS_DEFAUT as ReglageRappels
};

type Cles = keyof typeof DEFAUTS;

/** Lit un réglage et se met à jour tout seul quand il change. Le 3e élément indique si la lecture est terminée. */
export function useReglage<K extends Cles>(cle: K): [(typeof DEFAUTS)[K], (v: (typeof DEFAUTS)[K]) => Promise<void>, boolean] {
  const lu = useLiveQuery(async () => ({ v: (await db.reglages.get(cle))?.valeur as (typeof DEFAUTS)[K] | undefined }), [cle]);
  return [lu?.v ?? DEFAUTS[cle], (v) => ecrireReglage(cle, v), lu !== undefined];
}
