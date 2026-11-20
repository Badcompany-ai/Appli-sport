import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { ecrireReglage } from '../data/operations';
import { PRESETS, type Dispo, type Lieu } from '../domain/materiel';

export interface Journee {
  date: string;
  lieu: Lieu;
  /** Matériel modifié pour aujourd'hui seulement (sinon : préréglage du lieu). */
  dispo?: Dispo;
}

export function cleDuJour(t = Date.now()): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Lieu et matériel du jour, avec les préréglages modifiables des trois lieux. */
export function useJournee() {
  const presets = useLiveQuery(async () => ((await db.reglages.get('presets'))?.valeur as Record<Lieu, Dispo> | undefined) ?? PRESETS);
  const journee = useLiveQuery(async () => (await db.reglages.get('journee'))?.valeur as Journee | undefined);
  const charge = presets !== undefined && journee !== null;
  const aujourdhui = cleDuJour();
  const j: Journee = journee && journee.date === aujourdhui ? journee : { date: aujourdhui, lieu: journee?.lieu ?? 'salle' };
  const p = presets ?? PRESETS;
  const dispo = j.dispo ?? p[j.lieu];
  const modifieAujourdhui = !!j.dispo;

  return {
    charge,
    lieu: j.lieu,
    dispo,
    presets: p,
    modifieAujourdhui,
    choisirLieu: (lieu: Lieu) => ecrireReglage<Journee>('journee', { date: aujourdhui, lieu }),
    changerDispo: (d: Dispo) => ecrireReglage<Journee>('journee', { date: aujourdhui, lieu: j.lieu, dispo: d }),
    revenirAuPreset: () => ecrireReglage<Journee>('journee', { date: aujourdhui, lieu: j.lieu }),
    enregistrerPreset: async (d: Dispo) => {
      await ecrireReglage('presets', { ...p, [j.lieu]: d });
      await ecrireReglage<Journee>('journee', { date: aujourdhui, lieu: j.lieu });
    }
  };
}
