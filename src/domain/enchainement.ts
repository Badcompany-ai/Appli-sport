// Exercices enchaînés par deux (audit P4 « contraste » et P9 « paires ») :
// les exercices d'un même groupe se font en alternance, série par série.

import type { SeancePrevue } from './types';

/** Indices des exercices du groupe qui commence (ou contient) l'index donné. */
export function membresDuGroupe(plan: SeancePrevue, index: number): number[] {
  const ex = plan.exercices[index];
  if (!ex?.groupe) return [index];
  const res: number[] = [];
  let i = index;
  while (i > 0 && plan.exercices[i - 1].groupe === ex.groupe) i--;
  while (i < plan.exercices.length && plan.exercices[i].groupe === ex.groupe) res.push(i++);
  return res;
}

/** Prochaine série à faire dans le groupe : l'exercice le moins avancé, dans l'ordre. */
export function serieSuivante(plan: SeancePrevue, index: number, faites: (exerciceId: string) => number): { membre: number; numero: number } | null {
  const membres = membresDuGroupe(plan, index);
  let choix: { membre: number; numero: number } | null = null;
  for (const m of membres) {
    const ex = plan.exercices[m];
    const n = faites(ex.exerciceId);
    if (n >= ex.series) continue;
    if (!choix || n < choix.numero) choix = { membre: m, numero: n };
  }
  return choix;
}

/** Après une série validée : le groupe est-il fini, et quel repos prendre ? */
export function apresSerie(
  plan: SeancePrevue,
  membreValide: number,
  faites: (exerciceId: string) => number
): { groupeFini: boolean; reposSec: number; prochainIndex: number } {
  const membres = membresDuGroupe(plan, membreValide);
  const dernier = membres[membres.length - 1];
  // Après un tour complet, le repos est le plus long des repos prévus pour les exercices du groupe.
  const reposTour = Math.max(...membres.map((m) => plan.exercices[m].reposSec));
  const suivante = serieSuivante(plan, membres[0], faites);
  if (!suivante) return { groupeFini: true, reposSec: reposTour, prochainIndex: dernier + 1 };
  const memeTour = suivante.membre > membreValide;
  const reposSec = memeTour ? plan.exercices[membreValide].reposIntra ?? 0 : reposTour;
  return { groupeFini: false, reposSec, prochainIndex: membres[0] };
}
