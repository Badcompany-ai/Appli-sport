// Suivi du corps (cahier des charges, partie 8).

export interface Mesure {
  id: string;
  type: 'poids' | 'taille';
  /** kg pour le poids, cm pour le tour de taille. */
  valeur: number;
  date: number;
}

const JOUR = 86400000;

/**
 * Tendance du poids à une date : moyenne des pesées des 7 derniers jours,
 * avec plus de poids pour les plus récentes (poids 7 pour aujourd'hui, 1 pour il y a 6 jours).
 */
export function tendanceA(pesees: Mesure[], t: number): number | undefined {
  let somme = 0;
  let poids = 0;
  for (const p of pesees) {
    const age = (t - p.date) / JOUR;
    if (age < 0 || age >= 7) continue;
    const w = 7 - Math.floor(age);
    somme += p.valeur * w;
    poids += w;
  }
  return poids ? somme / poids : undefined;
}

/** Tendance actuelle ; à défaut de pesée récente, la dernière pesée connue. */
export function tendance(pesees: Mesure[], maintenant: number): number | undefined {
  const t = tendanceA(pesees, maintenant);
  if (t !== undefined) return t;
  const derniere = [...pesees].filter((p) => p.date <= maintenant).sort((a, b) => b.date - a.date)[0];
  return derniere?.valeur;
}

/** Points de tendance (un par jour de pesée), pour le graphique. */
export function courbeTendance(pesees: Mesure[]): { date: number; valeur: number }[] {
  return [...pesees]
    .sort((a, b) => a.date - b.date)
    .map((p) => ({ date: p.date, valeur: tendanceA(pesees, p.date)! }));
}

/**
 * Rythme réel : pente de la tendance sur les 21 derniers jours (au moins 14 jours couverts
 * et 4 pesées), en kg par semaine et en % du poids par semaine.
 */
export function rythme(pesees: Mesure[], maintenant: number): { kgSemaine: number; pctSemaine: number; jours: number } | undefined {
  const recentes = pesees.filter((p) => p.date <= maintenant && maintenant - p.date <= 21 * JOUR).sort((a, b) => a.date - b.date);
  if (recentes.length < 4) return undefined;
  const jours = (recentes[recentes.length - 1].date - recentes[0].date) / JOUR;
  if (jours < 13.5) return undefined;
  const pts = recentes.map((p) => ({ x: (p.date - recentes[0].date) / JOUR, y: tendanceA(pesees, p.date)! }));
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (!den) return undefined;
  const kgSemaine = (num / den) * 7;
  return { kgSemaine, pctSemaine: (kgSemaine / my) * 100, jours: Math.round(jours) };
}

/** Pesée conseillée : 2 à 3 fois par semaine, donc s'il n'y en a pas eu depuis 2 jours. */
export function peseeConseillee(pesees: Mesure[], maintenant: number): boolean {
  const derniere = Math.max(0, ...pesees.map((p) => p.date));
  return maintenant - derniere >= 2 * JOUR - 3600000;
}

/** Tour de taille : rappel au plus toutes les 4 semaines. */
export function tailleDue(tailles: Mesure[], maintenant: number): boolean {
  const derniere = Math.max(0, ...tailles.map((p) => p.date));
  return maintenant - derniere >= 28 * JOUR;
}
