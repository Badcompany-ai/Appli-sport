// Données du corps et de la nutrition (jalon J6), uniquement sur l'appareil.

import { db, nouvelId } from './db';
import type { Mesure } from '../domain/corps';
import {
  alimentOFF, alimentSuisse, CHAMPS_OFF, pourQuantite, type Aliment, type EntreeJournal, type Etiquette, type LigneSuisse, type Repas
} from '../domain/aliments';
import { kcalSeance } from '../domain/depense';
import { lireReglage, ecrireReglage } from './operations';

// ---------- Corps ----------

export async function ajouterMesure(type: Mesure['type'], valeur: number, date = Date.now()): Promise<Mesure> {
  const m: Mesure = { id: nouvelId(), type, valeur, date };
  await db.mesures.add(m);
  return m;
}

export async function supprimerMesure(id: string) {
  await db.mesures.delete(id);
}

export async function restaurerMesure(m: Mesure) {
  await db.mesures.put(m);
}

export async function mesures(type: Mesure['type']): Promise<Mesure[]> {
  return (await db.mesures.where('type').equals(type).toArray()).sort((a, b) => a.date - b.date);
}

// ---------- Base suisse (chargée à la demande, gardée hors ligne par le service worker) ----------

let baseSuisse: (Aliment & { synonymes?: string })[] | undefined;

export async function alimentsSuisses(): Promise<(Aliment & { synonymes?: string })[]> {
  if (!baseSuisse) {
    const m = await import('./aliments-suisses.json');
    baseSuisse = (m.default as unknown as LigneSuisse[]).map(alimentSuisse);
  }
  return baseSuisse;
}

// ---------- Open Food Facts (seulement avec réseau) ----------

const OFF = 'https://world.openfoodfacts.org';

async function lireJSON(url: string, ms = 8000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

export type ResultatCode = { etat: 'trouve'; aliment: Aliment } | { etat: 'inconnu' } | { etat: 'incomplet'; nom?: string } | { etat: 'hors_ligne' };

/** Cherche un code-barres : d'abord sur l'appareil, puis dans Open Food Facts. */
export async function chercherCode(code: string): Promise<ResultatCode> {
  const local = await db.aliments.where('code').equals(code).first();
  if (local) return { etat: 'trouve', aliment: local };
  try {
    const r = (await lireJSON(`${OFF}/api/v2/product/${encodeURIComponent(code)}.json?fields=${CHAMPS_OFF}`)) as { status?: number; product?: Parameters<typeof alimentOFF>[0] } | null;
    if (!r || r.status === 0 || !r.product) return { etat: 'inconnu' };
    const a = alimentOFF(r.product, code);
    if (!a) return { etat: 'incomplet', nom: r.product.product_name_fr || r.product.product_name };
    await db.aliments.put(a);
    return { etat: 'trouve', aliment: a };
  } catch {
    return { etat: 'hors_ligne' };
  }
}

/** Recherche par nom dans Open Food Facts, limitée aux produits vendus en Suisse. */
export async function rechercherOFF(terme: string): Promise<Aliment[] | 'hors_ligne'> {
  const url = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(terme)}&search_simple=1&json=1&page_size=20&tagtype_0=countries&tag_contains_0=contains&tag_0=switzerland&fields=${CHAMPS_OFF}`;
  try {
    const r = (await lireJSON(url, 10000)) as { products?: (Parameters<typeof alimentOFF>[0] & { code?: string })[] } | null;
    return (r?.products ?? []).map((p) => (p.code ? alimentOFF(p, p.code) : undefined)).filter((a): a is Aliment => !!a);
  } catch {
    return 'hors_ligne';
  }
}

/** Codes scannés sans réseau : recherchés au retour de la connexion. */
export async function mettreEnAttente(code: string) {
  const l = await lireReglage<string[]>('codesEnAttente', []);
  if (!l.includes(code)) await ecrireReglage('codesEnAttente', [...l, code]);
}

export async function rechercherCodesEnAttente(): Promise<Aliment[]> {
  const l = await lireReglage<string[]>('codesEnAttente', []);
  if (!l.length || !navigator.onLine) return [];
  const trouves: Aliment[] = [];
  const restants: string[] = [];
  for (const code of l) {
    const r = await chercherCode(code);
    if (r.etat === 'trouve') trouves.push(r.aliment);
    else if (r.etat === 'hors_ligne') restants.push(code);
  }
  await ecrireReglage('codesEnAttente', restants);
  return trouves;
}

// ---------- Aliments de l'utilisateur ----------

export async function alimentsConnus(): Promise<Aliment[]> {
  return (await db.aliments.toArray()).sort((a, b) => (b.dernierUsage ?? 0) - (a.dernierUsage ?? 0));
}

export async function enregistrerAliment(a: Aliment) {
  await db.aliments.put(a);
}

export async function basculerFavori(a: Aliment) {
  const existant = (await db.aliments.get(a.id)) ?? a;
  await db.aliments.put({ ...existant, favori: !existant.favori });
}

// ---------- Journal ----------

export async function ajouterAuJournal(
  aliment: Aliment | undefined,
  e: Pick<EntreeJournal, 'nom' | 'grammes' | 'quantite' | 'nutriments'> & { etiquette?: Etiquette },
  jour: string,
  maintenant = Date.now()
): Promise<EntreeJournal> {
  const entree: EntreeJournal = { id: nouvelId(), jour, ajouteLe: maintenant, alimentId: aliment?.id, ...e };
  await db.transaction('rw', db.journal, db.aliments, async () => {
    await db.journal.add(entree);
    if (aliment) {
      const existant = (await db.aliments.get(aliment.id)) ?? aliment;
      await db.aliments.put({ ...existant, dernierUsage: maintenant, nbUsages: (existant.nbUsages ?? 0) + 1 });
    }
  });
  return entree;
}

export function entreeDepuisAliment(a: Aliment, grammes: number, quantite: string) {
  return { nom: a.marque ? `${a.nom} (${a.marque})` : a.nom, grammes, quantite, nutriments: pourQuantite(a.pour100, grammes) };
}

export async function journalDuJour(jour: string): Promise<EntreeJournal[]> {
  return (await db.journal.where('jour').equals(jour).toArray()).sort((a, b) => a.ajouteLe - b.ajouteLe);
}

export async function modifierEntree(id: string, changements: Partial<EntreeJournal>) {
  await db.journal.update(id, changements);
}

export async function supprimerEntree(id: string) {
  await db.journal.delete(id);
}

export async function restaurerEntrees(entrees: EntreeJournal[]) {
  await db.journal.bulkPut(entrees);
}

export async function supprimerEntrees(ids: string[]) {
  await db.journal.bulkDelete(ids);
}

/** Copie les aliments d'un autre jour (par exemple la veille) dans le jour voulu. */
export async function copierJour(depuis: string, vers: string, maintenant = Date.now()): Promise<EntreeJournal[]> {
  const source = await journalDuJour(depuis);
  const copies = source.map((e, i) => ({ ...e, id: nouvelId(), jour: vers, ajouteLe: maintenant + i }));
  await db.journal.bulkAdd(copies);
  return copies;
}

// ---------- Repas enregistrés ----------

export async function listeRepas(): Promise<Repas[]> {
  return (await db.repas.toArray()).sort((a, b) => a.nom.localeCompare(b.nom));
}

export async function enregistrerRepas(nom: string, entrees: EntreeJournal[]): Promise<Repas> {
  const r: Repas = { id: nouvelId(), nom, elements: entrees.map(({ alimentId, nom, grammes, quantite, nutriments }) => ({ alimentId, nom, grammes, quantite, nutriments })) };
  await db.repas.add(r);
  return r;
}

export async function supprimerRepas(id: string) {
  await db.repas.delete(id);
}

export async function ajouterRepas(r: Repas, jour: string, maintenant = Date.now()): Promise<EntreeJournal[]> {
  const entrees = r.elements.map((e, i) => ({ ...e, id: nouvelId(), jour, ajouteLe: maintenant + i }));
  await db.journal.bulkAdd(entrees);
  return entrees;
}

// ---------- Dépense du sport ----------

export interface DepenseSport {
  id: string;
  nom: string;
  minutes: number;
  kcal: number;
}

/** Séances et activités terminées ce jour-là, avec leur dépense nette. */
export async function sportDuJour(jour: string, poidsKg: number): Promise<DepenseSport[]> {
  const [a, m, j] = jour.split('-').map(Number);
  const debut = new Date(a, m - 1, j).getTime();
  const fin = new Date(a, m - 1, j + 1).getTime();
  const seances = (await db.seances.where('statut').equals('terminee').toArray()).filter((s) => !s.supprimeeLe && (s.fin ?? s.debut) >= debut && (s.fin ?? s.debut) < fin);
  const res: DepenseSport[] = [];
  for (const s of seances) {
    const series = await db.series.where('seanceId').equals(s.id).toArray();
    res.push({ id: s.id, nom: s.nom, minutes: Math.round(((s.fin ?? s.debut) - s.debut) / 60000), kcal: Math.round(kcalSeance(s, series, poidsKg)) });
  }
  return res;
}
