import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
import { ecrireReglage } from '../data/operations';
import { PRESETS, type Dispo, type Lieu } from '../domain/materiel';

export interface Journee {
  date: string;
  lieu: Lieu;
  /** Matériel modifié pour aujourd'hui seulement (sinon : préréglage du lieu). */
  dispo?: Dispo;
  /** Temps disponible aujourd'hui, en minutes (sinon : toute la séance). */
  tempsMin?: number;
  /** Fatigue signalée aujourd'hui. */
  fatigue?: boolean;
  /** Réponse à la proposition d'alléger les sauts et sprints après une nuit courte. */
  allegerSommeil?: boolean;
  /** Séance de la semaine choisie pour aujourd'hui (lettre), à la place de la suivante. */
  lettre?: string;
  /** Version allégée choisie après une alerte de récupération. */
  versionAllegee?: boolean;
  /** Exercices ajoutés à la séance du jour. */
  ajouts?: string[];
}

export function cleDuJour(t = Date.now()): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Lieu, matériel et réglages du jour, avec les préréglages modifiables des trois lieux. */
export function useJournee() {
  const presets = useLiveQuery(async () => ((await db.reglages.get('presets'))?.valeur as Record<Lieu, Dispo> | undefined) ?? PRESETS);
  const journee = useLiveQuery(async () => (await db.reglages.get('journee'))?.valeur as Journee | undefined);
  const charge = presets !== undefined && journee !== null;
  const aujourdhui = cleDuJour();
  const j: Journee = journee && journee.date === aujourdhui ? journee : { date: aujourdhui, lieu: journee?.lieu ?? 'salle' };
  const p = presets ?? PRESETS;
  const dispo = j.dispo ?? p[j.lieu];
  const modifieAujourdhui = !!j.dispo;
  const maj = (changements: Partial<Journee>) => ecrireReglage<Journee>('journee', { ...j, ...changements, date: aujourdhui });

  return {
    charge,
    jour: j,
    lieu: j.lieu,
    dispo,
    presets: p,
    modifieAujourdhui,
    maj,
    choisirLieu: (lieu: Lieu) => maj({ lieu, dispo: undefined }),
    changerDispo: (d: Dispo) => maj({ dispo: d }),
    revenirAuPreset: () => maj({ dispo: undefined }),
    enregistrerPreset: async (d: Dispo) => {
      await ecrireReglage('presets', { ...p, [j.lieu]: d });
      await maj({ dispo: undefined });
    }
  };
}
