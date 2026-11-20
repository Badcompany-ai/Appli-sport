// Profil de l'utilisateur, prérempli avec les réponses de l'interview (SUIVI.md).

export type Priorite = 'athlete' | 'physique' | 'force' | 'equilibre';
export type Jour = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = lundi … 6 = dimanche

export const NOMS_JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const NOMS_JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const NOMS_PRIORITES: Record<Priorite, string> = {
  athlete: 'Athlète explosif (vitesse, détente, frappe)',
  physique: 'Physique (muscle et moins de gras)',
  force: 'Force',
  equilibre: 'Équilibre des trois'
};

export interface Profil {
  age: number;
  sexe: 'homme' | 'femme';
  tailleCm: number;
  /** Poids estimé, en attendant les pesées. */
  poidsKg: number;
  priorite: Priorite;
  seancesParSemaine: 3 | 4 | 5;
  dureeMin: number;
  /** Jours préférés pour les séances. */
  jours: Jour[];
  /** Lundi de la première semaine (AAAA-MM-JJ). */
  debut: string;
  /** Date visée pour les objectifs (AAAA-MM-JJ). */
  echeance: string;
  apprendreEpaule: boolean;
  seanceMobilite: boolean;
  modules: { corps: boolean; nutrition: boolean };
}

/** Réponses de l'interview du 20/11/2026. */
export const PROFIL_INTERVIEW: Profil = {
  age: 25,
  sexe: 'homme',
  tailleCm: 188,
  poidsKg: 82,
  priorite: 'athlete',
  seancesParSemaine: 4,
  dureeMin: 60,
  jours: [0, 1, 3, 6],
  debut: '2026-12-28',
  echeance: '2027-06-27',
  apprendreEpaule: true,
  seanceMobilite: true,
  modules: { corps: true, nutrition: true }
};

// ---------- Dates (en jours locaux, sans heure) ----------

export function versCle(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function depuisCle(cle: string): Date {
  const [a, m, j] = cle.split('-').map(Number);
  return new Date(a, m - 1, j);
}

/** Lundi de la semaine contenant cette date. */
export function lundiDe(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const jour = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - jour);
  return r;
}

/** Nombre de jours entiers entre deux dates locales. */
export function joursEntre(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

/** Jours de séance : les jours préférés, complétés si besoin pour atteindre le nombre de séances. */
export function joursDeSeance(profil: Profil): Jour[] {
  const choisis = [...new Set(profil.jours)].sort((a, b) => a - b).slice(0, profil.seancesParSemaine);
  const ordreAjout: Jour[] = [5, 3, 1, 4, 2, 0, 6];
  for (const j of ordreAjout) {
    if (choisis.length >= profil.seancesParSemaine) break;
    if (!choisis.includes(j)) choisis.push(j);
  }
  return choisis.sort((a, b) => a - b);
}
