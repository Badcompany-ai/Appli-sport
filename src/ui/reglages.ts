import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { ecrireReglage } from '../data/operations';

export interface ReglageRaccourci {
  actif: boolean;
  nom: string;
}

export const DEFAUTS = {
  raccourci: { actif: false, nom: 'Repos' } as ReglageRaccourci,
  sonApplication: true,
  derniereSauvegarde: 0
};

type Cles = keyof typeof DEFAUTS;

/** Lit un réglage et se met à jour tout seul quand il change. */
export function useReglage<K extends Cles>(cle: K): [(typeof DEFAUTS)[K], (v: (typeof DEFAUTS)[K]) => Promise<void>] {
  const valeur = useLiveQuery(async () => (await db.reglages.get(cle))?.valeur as (typeof DEFAUTS)[K] | undefined, [cle]);
  return [valeur ?? DEFAUTS[cle], (v) => ecrireReglage(cle, v)];
}
