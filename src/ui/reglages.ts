import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { ecrireReglage } from '../data/operations';
import type { Profil } from '../domain/profil';
import type { Objectif } from '../domain/niveau';

export interface ReglageRaccourci {
  actif: boolean;
  nom: string;
}

export const DEFAUTS = {
  raccourci: { actif: false, nom: 'Repos' } as ReglageRaccourci,
  sonApplication: true,
  derniereSauvegarde: 0,
  profil: null as Profil | null,
  objectifs: null as Objectif[] | null
};

type Cles = keyof typeof DEFAUTS;

/** Lit un réglage et se met à jour tout seul quand il change. Le 3e élément indique si la lecture est terminée. */
export function useReglage<K extends Cles>(cle: K): [(typeof DEFAUTS)[K], (v: (typeof DEFAUTS)[K]) => Promise<void>, boolean] {
  const lu = useLiveQuery(async () => ({ v: (await db.reglages.get(cle))?.valeur as (typeof DEFAUTS)[K] | undefined }), [cle]);
  return [lu?.v ?? DEFAUTS[cle], (v) => ecrireReglage(cle, v), lu !== undefined];
}
