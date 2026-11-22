import { db, nouvelId } from './db';
import type { Copie, SeancePrevue, Seance, Serie } from '../domain/types';
import { construireSauvegarde, type ContenuSauvegarde } from '../domain/sauvegarde';

const JOUR_MS = 86400000;
export const DUREE_CORBEILLE_MS = 30 * JOUR_MS;
export const NB_COPIES_QUOTIDIENNES = 7;

// ---------- Séances ----------

export async function seanceEnCours(): Promise<Seance | undefined> {
  const liste = await db.seances.where('statut').equals('en_cours').toArray();
  return liste.filter((s) => !s.supprimeeLe).sort((a, b) => b.debut - a.debut)[0];
}

export async function demarrerSeance(plan: SeancePrevue, maintenant = Date.now(), extra: Partial<Seance> = {}): Promise<Seance> {
  const existante = await seanceEnCours();
  if (existante) return existante;
  const seance: Seance = {
    id: nouvelId(),
    planId: plan.id,
    nom: plan.nom,
    plan,
    statut: 'en_cours',
    debut: maintenant,
    exerciceIndex: 0,
    notes: {},
    ...extra
  };
  await db.seances.add(seance);
  return seance;
}

export async function modifierSeance(id: string, changements: Partial<Seance>) {
  await db.seances.update(id, changements);
}

export async function enregistrerSerie(serie: Omit<Serie, 'id'>): Promise<Serie> {
  const complete: Serie = { ...serie, id: nouvelId() };
  await db.series.add(complete);
  return complete;
}

export async function supprimerSerie(id: string) {
  await db.series.delete(id);
}

export async function modifierSerie(id: string, changements: Partial<Serie>) {
  await db.series.update(id, changements);
}

export async function seriesDeLaSeance(seanceId: string): Promise<Serie[]> {
  const s = await db.series.where('seanceId').equals(seanceId).toArray();
  return s.sort((a, b) => a.faiteLe - b.faiteLe);
}

export async function terminerSeance(id: string, maintenant = Date.now()) {
  await db.seances.update(id, { statut: 'terminee', fin: maintenant, reposFin: undefined, reposTotalSec: undefined });
}

/** Dernière performance sur un exercice, dans une autre séance non supprimée. */
export async function dernierePerformance(
  exerciceId: string,
  seanceActuelleId?: string
): Promise<{ seance: Seance; series: Serie[] } | undefined> {
  const toutes = await db.series.where('exerciceId').equals(exerciceId).toArray();
  const parSeance = new Map<string, Serie[]>();
  for (const s of toutes) {
    if (s.seanceId === seanceActuelleId) continue;
    const l = parSeance.get(s.seanceId) ?? [];
    l.push(s);
    parSeance.set(s.seanceId, l);
  }
  let meilleure: { seance: Seance; series: Serie[] } | undefined;
  for (const [seanceId, series] of parSeance) {
    const seance = await db.seances.get(seanceId);
    if (!seance || seance.supprimeeLe) continue;
    if (!meilleure || seance.debut > meilleure.seance.debut) {
      meilleure = { seance, series: series.sort((a, b) => a.numero - b.numero) };
    }
  }
  return meilleure;
}

export async function seancesTerminees(): Promise<Seance[]> {
  const l = await db.seances.where('statut').equals('terminee').toArray();
  return l.filter((s) => !s.supprimeeLe).sort((a, b) => b.debut - a.debut);
}

// ---------- Corbeille ----------

export async function mettreALaCorbeille(id: string, maintenant = Date.now()) {
  await db.seances.update(id, { supprimeeLe: maintenant });
}

export async function restaurerSeance(id: string) {
  await db.seances.update(id, { supprimeeLe: undefined });
}

export async function corbeille(): Promise<Seance[]> {
  const l = await db.seances.toArray();
  return l.filter((s) => s.supprimeeLe).sort((a, b) => (b.supprimeeLe ?? 0) - (a.supprimeeLe ?? 0));
}

/** Supprime définitivement ce qui est à la corbeille depuis plus de 30 jours. */
export async function viderCorbeilleAncienne(maintenant = Date.now()) {
  const anciennes = (await corbeille()).filter((s) => maintenant - (s.supprimeeLe ?? maintenant) > DUREE_CORBEILLE_MS);
  await db.transaction('rw', db.seances, db.series, async () => {
    for (const s of anciennes) {
      await db.series.where('seanceId').equals(s.id).delete();
      await db.seances.delete(s.id);
    }
  });
  return anciennes.length;
}

// ---------- Réglages ----------

export async function lireReglage<T>(cle: string, defaut: T): Promise<T> {
  const r = await db.reglages.get(cle);
  return r ? (r.valeur as T) : defaut;
}

export async function ecrireReglage<T>(cle: string, valeur: T) {
  await db.reglages.put({ cle, valeur });
}

// ---------- Sauvegardes ----------

export async function exporterTout(maintenant = Date.now()): Promise<ContenuSauvegarde> {
  const [seances, series, reglages] = await Promise.all([db.seances.toArray(), db.series.toArray(), db.reglages.toArray()]);
  return construireSauvegarde({ seances, series, reglages }, maintenant);
}

/** Remplace toutes les données par celles d'une sauvegarde, après une copie de sécurité. */
export async function importerTout(contenu: ContenuSauvegarde, maintenant = Date.now()) {
  await creerCopie('avant_import', maintenant);
  await db.transaction('rw', db.seances, db.series, db.reglages, async () => {
    await Promise.all([db.seances.clear(), db.series.clear(), db.reglages.clear()]);
    await db.seances.bulkAdd(contenu.donnees.seances);
    await db.series.bulkAdd(contenu.donnees.series);
    await db.reglages.bulkPut(contenu.donnees.reglages);
  });
}

export async function creerCopie(raison: Copie['raison'], maintenant = Date.now()): Promise<Copie> {
  const contenu = JSON.stringify(await exporterTout(maintenant));
  const copie: Copie = { id: nouvelId(), creeeLe: maintenant, raison, contenu };
  await db.copies.add(copie);
  return copie;
}

/** Une copie automatique par jour, en gardant les 7 dernières. */
export async function copieQuotidienneSiBesoin(maintenant = Date.now()): Promise<boolean> {
  const quotidiennes = (await db.copies.toArray()).filter((c) => c.raison === 'quotidienne').sort((a, b) => b.creeeLe - a.creeeLe);
  const derniere = quotidiennes[0];
  let creee = false;
  if (!derniere || maintenant - derniere.creeeLe >= JOUR_MS) {
    await creerCopie('quotidienne', maintenant);
    creee = true;
  }
  const apres = (await db.copies.toArray()).filter((c) => c.raison === 'quotidienne').sort((a, b) => b.creeeLe - a.creeeLe);
  const aSupprimer = apres.slice(NB_COPIES_QUOTIDIENNES).map((c) => c.id);
  if (aSupprimer.length) await db.copies.bulkDelete(aSupprimer);
  // Les copies « avant import » sont gardées 30 jours.
  const vieilles = (await db.copies.toArray()).filter((c) => c.raison === 'avant_import' && maintenant - c.creeeLe > DUREE_CORBEILLE_MS);
  if (vieilles.length) await db.copies.bulkDelete(vieilles.map((c) => c.id));
  return creee;
}

export async function listeCopies(): Promise<Copie[]> {
  return (await db.copies.toArray()).sort((a, b) => b.creeeLe - a.creeeLe);
}

/** Activité libre (sport entre amis…) : comptée dans l'historique, sans séries. */
export async function enregistrerActivite(nom: string, dureeMin: number, programme: SeancePrevue['programme'], maintenant = Date.now()): Promise<Seance> {
  const plan: SeancePrevue = { id: `activite-${maintenant}`, nom, exercices: [], programme };
  const seance: Seance = {
    id: nouvelId(),
    planId: plan.id,
    nom,
    plan,
    statut: 'terminee',
    debut: maintenant - dureeMin * 60000,
    fin: maintenant,
    exerciceIndex: 0,
    notes: {}
  };
  await db.seances.add(seance);
  return seance;
}
