import type { Reglage, Seance, Serie } from './types';

/** Version du format de sauvegarde. Elle augmente si la structure change. */
export const VERSION_FORMAT = 1;

export interface ContenuSauvegarde {
  application: 'appli-sport';
  format: number;
  exporteeLe: number;
  donnees: {
    seances: Seance[];
    series: Serie[];
    reglages: Reglage[];
  };
}

export interface ResumeSauvegarde {
  seances: number;
  series: number;
  exporteeLe: number;
}

export function construireSauvegarde(
  donnees: ContenuSauvegarde['donnees'],
  maintenant: number
): ContenuSauvegarde {
  return { application: 'appli-sport', format: VERSION_FORMAT, exporteeLe: maintenant, donnees };
}

export type ResultatLecture =
  | { ok: true; contenu: ContenuSauvegarde; resume: ResumeSauvegarde }
  | { ok: false; erreur: string };

/** Lit et vérifie un fichier de sauvegarde avant tout remplacement. */
export function lireSauvegarde(texte: string): ResultatLecture {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return { ok: false, erreur: "Ce fichier n'est pas une sauvegarde lisible." };
  }
  if (!brut || typeof brut !== 'object') return { ok: false, erreur: "Ce fichier n'est pas une sauvegarde de l'application." };
  const c = brut as Partial<ContenuSauvegarde>;
  if (c.application !== 'appli-sport') return { ok: false, erreur: "Ce fichier ne vient pas de cette application." };
  if (typeof c.format !== 'number') return { ok: false, erreur: 'Version de sauvegarde inconnue.' };
  if (c.format > VERSION_FORMAT) {
    return { ok: false, erreur: "Cette sauvegarde vient d'une version plus récente de l'application. Mettez l'application à jour, puis réessayez." };
  }
  const d = c.donnees;
  if (!d || !Array.isArray(d.seances) || !Array.isArray(d.series) || !Array.isArray(d.reglages)) {
    return { ok: false, erreur: 'Sauvegarde incomplète ou abîmée.' };
  }
  for (const s of d.seances) {
    if (!s || typeof s.id !== 'string' || typeof s.debut !== 'number') return { ok: false, erreur: 'Une séance de la sauvegarde est abîmée.' };
  }
  for (const s of d.series) {
    if (!s || typeof s.id !== 'string' || typeof s.seanceId !== 'string') return { ok: false, erreur: 'Une série de la sauvegarde est abîmée.' };
  }
  const contenu = migrer(c as ContenuSauvegarde);
  return {
    ok: true,
    contenu,
    resume: {
      seances: contenu.donnees.seances.filter((s) => !s.supprimeeLe).length,
      series: contenu.donnees.series.length,
      exporteeLe: typeof c.exporteeLe === 'number' ? c.exporteeLe : 0
    }
  };
}

/** Convertit une ancienne sauvegarde au format actuel (aucune conversion nécessaire en version 1). */
function migrer(c: ContenuSauvegarde): ContenuSauvegarde {
  return { ...c, format: VERSION_FORMAT };
}

/** Nom de fichier lisible : « sauvegarde-sport-2026-12-28.json ». */
export function nomFichier(maintenant: number): string {
  const d = new Date(maintenant);
  const p = (n: number) => String(n).padStart(2, '0');
  return `sauvegarde-sport-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}
