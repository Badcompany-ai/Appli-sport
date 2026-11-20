// Moteur de remplacement des exercices selon le matériel (cahier des charges, partie 6.2).
// C'est la fonctionnalité la plus importante : chaque règle est testée.

import { EXERCICES, MOUVEMENTS_PROCHES, NOMS_MOUVEMENTS, PREFERES, exercice, type Exercice } from './exercices';
import { nomEquipement, type Dispo } from './materiel';
import { kg } from './format';
import type { ExercicePrevu, SeancePrevue } from './types';
import { epreuve, epreuveDisponible } from './niveau';

export interface Contexte {
  dispo: Dispo;
  /** Poids du corps (tendance), pour les exercices au poids du corps. */
  poidsCorpsKg: number;
  /** Exercices déjà pratiqués (petit bonus). */
  dejaFaits?: Set<string>;
}

export type TypeChangement = 'remplace' | 'retire' | 'ajuste';

export interface Changement {
  type: TypeChangement;
  avant: string;
  apres?: string;
  raison: string;
}

// ---------- Disponibilité et charges ----------

export function estDisponible(ex: Exercice, dispo: Dispo): boolean {
  return ex.materiel.every((groupe) => groupe.some((id) => dispo.materiel.includes(id)));
}

/** Premier matériel manquant, pour l'expliquer (« Pas de barre et disques »). */
export function materielManquant(ex: Exercice, dispo: Dispo): string | undefined {
  const g = ex.materiel.find((groupe) => !groupe.some((id) => dispo.materiel.includes(id)));
  return g?.map(nomEquipement).join(' ni ');
}

/** Charge maximale utilisable pour cet exercice avec le matériel du jour (par haltère pour les haltères). */
export function capaciteKg(ex: Exercice, ctx: Contexte): number {
  const m = ctx.dispo.materiel;
  const permis = new Set(ex.materiel.flat());
  const hal = m.includes('halteres') && (permis.has('halteres') || ex.charge === 'halteres') ? ctx.dispo.halteresMaxKg : 0;
  const kb = m.includes('kettlebell') && (permis.has('kettlebell') || ex.charge === 'kettlebell') ? ctx.dispo.kettlebellMaxKg : 0;
  switch (ex.charge) {
    case 'barre':
    case 'machine':
    case 'poulie':
      return Infinity;
    case 'halteres':
    case 'kettlebell':
      return Math.max(hal, kb);
    case 'corps': {
      // Lest possible avec un haltère ou une kettlebell (tenu entre les pieds), seulement si l'exercice s'y prête.
      if (!ex.lestable) return chargeCorps(ex, ctx);
      const lest = Math.max(m.includes('halteres') ? ctx.dispo.halteresMaxKg : 0, m.includes('kettlebell') ? ctx.dispo.kettlebellMaxKg : 0);
      return chargeCorps(ex, ctx) + lest;
    }
    default:
      return 0;
  }
}

function chargeCorps(ex: Exercice, ctx: Contexte): number {
  return (ex.partPoidsDuCorps ?? 1) * ctx.poidsCorpsKg;
}

/** Charge réellement déplacée par l'exercice prévu (poids du corps compris). */
function chargeEffective(ex: Exercice, prevu: ExercicePrevu, ctx: Contexte): number | undefined {
  if (ex.charge === 'aucune') return undefined;
  if (ex.charge === 'corps') return chargeCorps(ex, ctx) + (prevu.chargeKg ?? 0);
  return prevu.chargeKg;
}

/** Charge que le remplaçant devrait déplacer pour un effort équivalent. */
export function chargeRequise(orig: Exercice, prevu: ExercicePrevu, cand: Exercice, ctx: Contexte): number | undefined {
  const eff = chargeEffective(orig, prevu, ctx);
  if (eff === undefined || !orig.facteur || !cand.facteur || cand.charge === 'aucune') return undefined;
  return (eff / orig.facteur) * cand.facteur;
}

function adequation(orig: Exercice, prevu: ExercicePrevu, cand: Exercice, ctx: Contexte): number {
  if (orig.charge === 'aucune') return cand.charge === 'aucune' ? 1 : 0.8;
  if (cand.charge === 'aucune') return 0.5;
  const besoin = chargeRequise(orig, prevu, cand, ctx);
  if (besoin === undefined || besoin <= 0) return 1;
  const cap = capaciteKg(cand, ctx);
  if (cap >= besoin) {
    // Exercice au poids du corps beaucoup trop lourd pour la charge visée.
    if (cand.charge === 'corps' && chargeCorps(cand, ctx) > besoin * 1.6) return 0.6;
    return 1;
  }
  return Math.max(0, cap / besoin);
}

// ---------- Note d'un candidat ----------

function partage<T>(a: T[], b: T[]): number {
  if (!a.length) return 1;
  const sb = new Set(b);
  return a.filter((x) => sb.has(x)).length / a.length;
}

function jaccard<T>(a: T[], b: T[]): number {
  const u = new Set([...a, ...b]);
  if (!u.size) return 1;
  const sb = new Set(b);
  return a.filter((x) => sb.has(x)).length / u.size;
}

export function noter(orig: Exercice, prevu: ExercicePrevu, cand: Exercice, ctx: Contexte): number {
  const memeMouvement = cand.mouvement === orig.mouvement;
  return (
    (memeMouvement ? 2 : 0) +
    3 * partage(orig.qualites, cand.qualites) +
    2 * jaccard(orig.primaires, cand.primaires) +
    4 * adequation(orig, prevu, cand, ctx) +
    1 * (1 - Math.abs(orig.difficulte - cand.difficulte) / 4) +
    (PREFERES.has(cand.id) ? 0.75 : 0) +
    (ctx.dejaFaits?.has(cand.id) ? 0.5 : 0)
  );
}

/** Équivalents possibles, du meilleur au moins bon. */
export function candidats(prevu: ExercicePrevu, ctx: Contexte, exclus: Set<string> = new Set()): { ex: Exercice; note: number }[] {
  const orig = exercice(prevu.origineId ?? prevu.exerciceId) ?? exercice(prevu.exerciceId);
  if (!orig) return [];
  const mouvements = new Set([orig.mouvement, ...(MOUVEMENTS_PROCHES[orig.mouvement] ?? [])]);
  return EXERCICES.filter(
    (e) => e.id !== prevu.exerciceId && mouvements.has(e.mouvement) && !exclus.has(e.id) && estDisponible(e, ctx.dispo)
  )
    .map((e) => ({ ex: e, note: noter(orig, prevu, e, ctx) }))
    .sort((a, b) => b.note - a.note || a.ex.nom.localeCompare(b.ex.nom));
}

// ---------- Ajustement des séries ----------

function pasDe(ex: Exercice): number {
  switch (ex.charge) {
    case 'halteres': return 1;
    case 'kettlebell': return 4;
    case 'machine': return 5;
    default: return 2.5;
  }
}

function arrondir(x: number, pas: number): number {
  return Math.max(0, Math.round(x / pas) * pas);
}

/** Répétitions pour un effort équivalent avec une charge plus légère (formule d'Epley). */
export function repsEquivalentes(reps: number, chargeVisee: number, chargeDispo: number): { reps: number; tempoLent: boolean } {
  if (chargeDispo <= 0 || chargeDispo >= chargeVisee * 0.95) return { reps, tempoLent: false };
  const max = chargeVisee * (1 + reps / 30);
  const r = 30 * (max / chargeDispo - 1);
  if (r <= reps) return { reps, tempoLent: false };
  return { reps: Math.min(15, Math.ceil(r)), tempoLent: r > 15 };
}

/** Construit l'exercice de remplacement, avec charge et répétitions ajustées. */
export function convertir(prevu: ExercicePrevu, cand: Exercice, ctx: Contexte): { nouveau: ExercicePrevu; ajustement?: string } {
  const orig = exercice(prevu.origineId ?? prevu.exerciceId) ?? exercice(prevu.exerciceId)!;
  const nouveau: ExercicePrevu = {
    exerciceId: cand.id,
    nom: cand.nom,
    mesure: cand.mesure,
    series: prevu.series,
    reposSec: prevu.reposSec,
    origineId: prevu.origineId ?? prevu.exerciceId,
    pasKg: pasDe(cand)
  };
  // Mesure : on garde les répétitions ou la durée selon le type du remplaçant.
  if (cand.mesure === 'tenue') nouveau.dureeSec = prevu.dureeSec ?? 30;
  else nouveau.reps = prevu.reps ?? 6;

  let ajustement: string | undefined;
  const besoin = chargeRequise(orig, prevu, cand, ctx);
  if (besoin !== undefined && (cand.mesure === 'charge_reps' || cand.mesure === 'poids_du_corps_reps')) {
    const cap = capaciteKg(cand, ctx);
    const disponible = Math.min(besoin, cap);
    if (cand.charge === 'corps') {
      const base = chargeCorps(cand, ctx);
      nouveau.chargeKg = cand.lestable ? arrondir(Math.max(0, disponible - base), 2.5) : 0;
    } else {
      nouveau.chargeKg = arrondir(disponible, pasDe(cand));
    }
    const equiv = repsEquivalentes(nouveau.reps ?? 6, besoin, cap);
    if (equiv.reps !== nouveau.reps || equiv.tempoLent) {
      nouveau.reps = equiv.reps;
      nouveau.tempoLent = equiv.tempoLent;
      const limite = cand.charge === 'corps' ? 'poids du corps' : `${kg(cap)} kg au maximum`;
      ajustement = `charge limitée (${limite}) : ${equiv.reps} répétitions${equiv.tempoLent ? ' avec descente lente (3 s)' : ''} pour un effort comparable`;
    }
  } else if (cand.charge === 'corps' && cand.mesure === 'poids_du_corps_reps') {
    nouveau.chargeKg = 0;
  }
  return { nouveau, ajustement };
}

function phraseRaison(orig: Exercice, prevu: ExercicePrevu, cand: Exercice, ctx: Contexte, ajustement?: string): string {
  const manque = materielManquant(orig, ctx.dispo);
  const parties = [manque ? `Pas de ${manque.charAt(0).toLowerCase()}${manque.slice(1)}` : 'Remplacé'];
  parties.push(
    cand.mouvement === orig.mouvement
      ? `même mouvement (${NOMS_MOUVEMENTS[orig.mouvement].toLowerCase()})`
      : `mouvement proche (${NOMS_MOUVEMENTS[cand.mouvement].toLowerCase()})`
  );
  if (ajustement) parties.push(ajustement);
  void prevu;
  return parties.join(' ; ') + '.';
}

// ---------- Recalcul de la séance du jour ----------

export function adapterSeance(plan: SeancePrevue, ctx: Contexte): { plan: SeancePrevue; changements: Changement[] } {
  const resultat: ExercicePrevu[] = [];
  const changements: Changement[] = [];
  const retires: { prevu: ExercicePrevu; orig: Exercice }[] = [];
  const utilises = new Set(plan.exercices.map((e) => e.exerciceId));

  for (const prevu of plan.exercices) {
    if (prevu.testId) {
      const e = epreuve(prevu.testId);
      if (e && !epreuveDisponible(e, ctx.dispo)) {
        const manque = e.materiel.find((g) => !g.some((id) => ctx.dispo.materiel.includes(id)))?.map(nomEquipement).join(' ou ');
        changements.push({ type: 'retire', avant: prevu.nom, raison: `Épreuve impossible ici (il faut : ${manque}). À faire un autre jour.` });
      } else resultat.push(prevu);
      continue;
    }
    const ex = exercice(prevu.exerciceId);
    if (!ex) {
      resultat.push(prevu);
      continue;
    }
    if (estDisponible(ex, ctx.dispo)) {
      // Disponible, mais la charge prévue peut dépasser ce que permet le matériel (haltères légers).
      const cap = capaciteKg(ex, ctx);
      if ((ex.charge === 'halteres' || ex.charge === 'kettlebell') && prevu.chargeKg && cap < prevu.chargeKg) {
        const equiv = repsEquivalentes(prevu.reps ?? 6, prevu.chargeKg, cap);
        resultat.push({ ...prevu, chargeKg: cap, reps: equiv.reps, tempoLent: equiv.tempoLent });
        changements.push({
          type: 'ajuste',
          avant: prevu.nom,
          raison: `Haltères limités à ${kg(cap)} kg : ${equiv.reps} répétitions${equiv.tempoLent ? ' avec descente lente (3 s)' : ''} pour un effort comparable.`
        });
      } else resultat.push(prevu);
      continue;
    }
    const exclus = new Set([...utilises].filter((id) => id !== prevu.exerciceId));
    const choix = candidats(prevu, ctx, exclus)[0];
    if (choix) {
      const { nouveau, ajustement } = convertir(prevu, choix.ex, ctx);
      resultat.push(nouveau);
      utilises.add(choix.ex.id);
      changements.push({ type: 'remplace', avant: prevu.nom, apres: choix.ex.nom, raison: phraseRaison(ex, prevu, choix.ex, ctx, ajustement) });
    } else {
      retires.push({ prevu, orig: ex });
    }
  }

  // Aucun équivalent : l'exercice est retiré et ses séries reportées sur un exercice qui travaille les mêmes muscles.
  for (const { prevu, orig } of retires) {
    const cible = resultat.find((r) => {
      const e = exercice(r.exerciceId);
      return e && e.primaires.some((m) => orig.primaires.includes(m)) && r.series < 5;
    });
    let raison = `Aucun équivalent avec le matériel coché (${materielManquant(orig, ctx.dispo) ?? 'matériel manquant'}).`;
    if (cible) {
      const ajout = Math.min(2, 5 - cible.series, prevu.series);
      cible.series += ajout;
      raison += ` ${ajout} série${ajout > 1 ? 's' : ''} ajoutée${ajout > 1 ? 's' : ''} à « ${cible.nom} », qui travaille les mêmes muscles.`;
    }
    changements.push({ type: 'retire', avant: prevu.nom, raison });
  }

  return { plan: { ...plan, exercices: resultat }, changements };
}

/** Crée un exercice prévu à partir de la bibliothèque. */
export function prevoir(id: string, series: number, opts: { reps?: number; dureeSec?: number; chargeKg?: number; reposSec: number }): ExercicePrevu {
  const ex = exercice(id);
  if (!ex) throw new Error(`Exercice inconnu : ${id}`);
  return {
    exerciceId: id,
    nom: ex.nom,
    mesure: ex.mesure,
    series,
    reps: ex.mesure === 'tenue' ? undefined : opts.reps,
    dureeSec: ex.mesure === 'tenue' ? opts.dureeSec : undefined,
    chargeKg: ex.mesure === 'charge_reps' ? opts.chargeKg : ex.mesure === 'poids_du_corps_reps' ? opts.chargeKg ?? 0 : undefined,
    reposSec: opts.reposSec,
    pasKg: pasDe(ex)
  };
}
