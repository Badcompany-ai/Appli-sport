// Aliments, portions et journal (cahier des charges, parties 9.5 et 9.6).

export interface Nutriments {
  kcal: number;
  proteines: number;
  lipides: number;
  glucides: number;
  fibres: number;
}

export interface Portion {
  nom: string;
  g: number;
}

export type SourceAliment = 'suisse' | 'off' | 'perso' | 'complement' | 'estimation';

export interface Aliment {
  id: string;
  nom: string;
  source: SourceAliment;
  /** Valeurs pour 100 g (ou 100 ml pour une boisson). */
  pour100: Nutriments;
  portions: Portion[];
  /** Exprimé en ml plutôt qu'en g. */
  ml?: boolean;
  code?: string;
  marque?: string;
  categorie?: string;
  dernierUsage?: number;
  nbUsages?: number;
  favori?: boolean;
}

export type Etiquette = 'matin' | 'midi' | 'soir' | 'collation';
export const ETIQUETTES: { id: Etiquette; nom: string }[] = [
  { id: 'matin', nom: 'Matin' },
  { id: 'midi', nom: 'Midi' },
  { id: 'soir', nom: 'Soir' },
  { id: 'collation', nom: 'Collation' }
];

export interface EntreeJournal {
  id: string;
  /** Jour local, AAAA-MM-JJ. */
  jour: string;
  ajouteLe: number;
  alimentId?: string;
  nom: string;
  grammes: number;
  /** Description de la quantité (« 2 × 1 œuf »). */
  quantite: string;
  nutriments: Nutriments;
  etiquette?: Etiquette;
}

export interface Repas {
  id: string;
  nom: string;
  elements: Pick<EntreeJournal, 'alimentId' | 'nom' | 'grammes' | 'quantite' | 'nutriments'>[];
}

export const ZERO: Nutriments = { kcal: 0, proteines: 0, lipides: 0, glucides: 0, fibres: 0 };

export function pourQuantite(pour100: Nutriments, g: number): Nutriments {
  const k = g / 100;
  return {
    kcal: pour100.kcal * k,
    proteines: pour100.proteines * k,
    lipides: pour100.lipides * k,
    glucides: pour100.glucides * k,
    fibres: pour100.fibres * k
  };
}

export function additionner(liste: Nutriments[]): Nutriments {
  return liste.reduce(
    (t, n) => ({
      kcal: t.kcal + n.kcal,
      proteines: t.proteines + n.proteines,
      lipides: t.lipides + n.lipides,
      glucides: t.glucides + n.glucides,
      fibres: t.fibres + n.fibres
    }),
    ZERO
  );
}

export function normaliser(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Recherche tolérante : tous les mots doivent apparaître ; les noms qui commencent par le terme passent devant. */
export function rechercher<T extends { nom: string; synonymes?: string }>(liste: T[], terme: string, max = 30): T[] {
  const t = normaliser(terme).trim();
  if (!t) return [];
  const mots = t.split(/\s+/);
  const notes: { a: T; note: number }[] = [];
  for (const a of liste) {
    const n = normaliser(a.nom);
    const texte = a.synonymes ? `${n} ${normaliser(a.synonymes)}` : n;
    if (!mots.every((m) => texte.includes(m))) continue;
    let note = 0;
    if (n.startsWith(t)) note += 10;
    if (n.startsWith(mots[0])) note += 5;
    if (/\bcru\b|\bcrue\b/.test(n)) note -= 1;
    note -= n.length / 100;
    notes.push({ a, note });
  }
  return notes.sort((x, y) => y.note - x.note).slice(0, max).map((x) => x.a);
}

// ---------- Base suisse des valeurs nutritives (OSAV, version 7.1) ----------

/** Ligne compacte : [id, nom, synonymes, catégorie, kcal, protéines, lipides, glucides, fibres, ml]. */
export type LigneSuisse = [number, string, string, string, number, number, number, number, number, number];

/** Portions courantes (repères arrondis) ; les grammes restent toujours modifiables. */
function portionsParDefaut(nom: string, categorie: string): Portion[] {
  const n = normaliser(nom);
  const p: Portion[] = [];
  if (/^oeuf de poule entier/.test(n)) p.push({ nom: '1 œuf', g: 55 });
  if (/^yogourt|^yaourt/.test(n)) p.push({ nom: '1 pot', g: 180 });
  if (/^pain /.test(n) || n === 'pain') p.push({ nom: '1 tranche', g: 40 });
  if (/^banane crue/.test(n)) p.push({ nom: '1 banane', g: 120 });
  if (/^(pomme|poire|orange) crue/.test(n)) p.push({ nom: '1 fruit', g: 150 });
  if (/^lait/.test(n)) p.push({ nom: '1 verre', g: 250 });
  if (categorie.startsWith('Plats')) p.push({ nom: '1 assiette', g: 350 });
  return p;
}

export function alimentSuisse(l: LigneSuisse): Aliment & { synonymes?: string } {
  const [id, nom, synonymes, categorie, kcal, proteines, lipides, glucides, fibres, ml] = l;
  return {
    id: `ch-${id}`,
    nom,
    synonymes: synonymes || undefined,
    source: 'suisse',
    categorie,
    pour100: { kcal, proteines, lipides, glucides, fibres },
    portions: portionsParDefaut(nom, categorie),
    ml: ml === 1
  };
}

// ---------- Open Food Facts ----------

interface ProduitOFF {
  code?: string;
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  quantity?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

const nombre = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Convertit un produit Open Food Facts. Renvoie undefined si les calories ou les protéines manquent
 * ou sont incohérentes (plus de 900 kcal pour 100 g) : l'utilisateur saisit alors l'étiquette.
 */
export function alimentOFF(p: ProduitOFF, code: string): Aliment | undefined {
  const n = p.nutriments ?? {};
  let kcal = nombre(n['energy-kcal_100g']);
  const kj = nombre(n['energy-kj_100g']) ?? nombre(n['energy_100g']);
  // Erreur fréquente : des kJ saisis dans la case kcal.
  if (kj !== undefined && (kcal === undefined || kcal > 900)) kcal = kj / 4.184;
  const proteines = nombre(n['proteins_100g']);
  if (kcal === undefined || proteines === undefined || kcal > 900 || kcal < 0) return undefined;
  const nom = (p.product_name_fr || p.product_name || '').trim();
  if (!nom) return undefined;
  const portions: Portion[] = [];
  const serving = nombre(p.serving_quantity);
  if (serving && serving > 0 && serving <= 1000) portions.push({ nom: `1 portion (${Math.round(serving)} g)`, g: serving });
  const q = /^\s*(\d+(?:[.,]\d+)?)\s*(g|ml)\s*$/i.exec(p.quantity ?? '');
  if (q) {
    const g = parseFloat(q[1].replace(',', '.'));
    if (g > 0 && g <= 1000 && g !== serving) portions.push({ nom: `1 emballage (${Math.round(g)} ${q[2].toLowerCase()})`, g });
  }
  return {
    id: `off-${code}`,
    nom,
    marque: p.brands?.split(',')[0]?.trim() || undefined,
    source: 'off',
    code,
    pour100: {
      kcal: Math.round(kcal),
      proteines,
      lipides: nombre(n['fat_100g']) ?? 0,
      glucides: nombre(n['carbohydrates_100g']) ?? 0,
      fibres: nombre(n['fiber_100g']) ?? 0
    },
    portions,
    ml: q?.[2].toLowerCase() === 'ml'
  };
}

export const CHAMPS_OFF = 'code,product_name,product_name_fr,brands,quantity,serving_quantity,nutriments';

// ---------- Compléments (raccourcis en un geste) ----------
// Valeurs typiques d'étiquette, modifiables par l'utilisateur selon son produit.

export const COMPLEMENTS: Aliment[] = [
  { id: 'cpl-proteine', nom: 'Protéine en poudre', source: 'complement', pour100: { kcal: 380, proteines: 78, lipides: 6, glucides: 6, fibres: 0 }, portions: [{ nom: '1 dose', g: 30 }] },
  { id: 'cpl-creatine', nom: 'Créatine', source: 'complement', pour100: { ...ZERO }, portions: [{ nom: '1 dose', g: 5 }] },
  { id: 'cpl-collagene', nom: 'Collagène', source: 'complement', pour100: { kcal: 360, proteines: 90, lipides: 0, glucides: 0, fibres: 0 }, portions: [{ nom: '1 dose', g: 10 }] },
  { id: 'cpl-potassium', nom: 'Potassium', source: 'complement', pour100: { ...ZERO }, portions: [{ nom: '1 dose', g: 1 }] }
];

/** Texte d'une quantité : « 2 × 1 œuf » ou « 150 g ». */
export function texteQuantite(g: number, portion?: Portion, nb = 1, ml = false): string {
  if (portion) return nb === 1 ? portion.nom : `${String(nb).replace('.', ',')} × ${portion.nom}`;
  return `${Math.round(g)} ${ml ? 'ml' : 'g'}`;
}
