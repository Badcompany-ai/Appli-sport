// Catalogue du matériel et préréglages des trois lieux (cahier des charges, partie 6.3).

export type Lieu = 'salle' | 'maison' | 'exterieur';

export const LIEUX: { id: Lieu; nom: string }[] = [
  { id: 'salle', nom: 'Salle' },
  { id: 'maison', nom: 'Maison' },
  { id: 'exterieur', nom: 'Extérieur' }
];

export type Famille = 'Barres' | 'Haltères et kettlebells' | 'Machines' | 'Poids du corps' | 'Cardio' | 'Athlétisme' | 'Boxe';

export interface Equipement {
  id: string;
  nom: string;
  famille: Famille;
}

export const EQUIPEMENTS: Equipement[] = [
  { id: 'barre', nom: 'Barre et disques', famille: 'Barres' },
  { id: 'rack', nom: 'Rack ou cage à squat', famille: 'Barres' },
  { id: 'banc', nom: 'Banc réglable', famille: 'Barres' },
  { id: 'halteres', nom: 'Haltères', famille: 'Haltères et kettlebells' },
  { id: 'kettlebell', nom: 'Kettlebells', famille: 'Haltères et kettlebells' },
  { id: 'presse', nom: 'Presse à cuisses', famille: 'Machines' },
  { id: 'poulie', nom: 'Poulies (vis-à-vis, tirage)', famille: 'Machines' },
  { id: 'machines', nom: 'Machines guidées (leg curl, leg extension…)', famille: 'Machines' },
  { id: 'barre_traction', nom: 'Barre de traction ou barre fixe', famille: 'Poids du corps' },
  { id: 'barres_paralleles', nom: 'Barres parallèles', famille: 'Poids du corps' },
  { id: 'poignees_pompes', nom: 'Poignées de pompes', famille: 'Poids du corps' },
  { id: 'roue_abdo', nom: 'Roue abdominale', famille: 'Poids du corps' },
  { id: 'tapis', nom: 'Tapis', famille: 'Poids du corps' },
  { id: 'pince', nom: 'Accessoires d’avant-bras', famille: 'Poids du corps' },
  { id: 'ceinture_lest', nom: 'Ceinture de lest', famille: 'Poids du corps' },
  { id: 'velo_assault', nom: 'Vélo d’assaut', famille: 'Cardio' },
  { id: 'rameur', nom: 'Rameur', famille: 'Cardio' },
  { id: 'skierg', nom: 'Ski-erg', famille: 'Cardio' },
  { id: 'corde', nom: 'Corde à sauter', famille: 'Cardio' },
  { id: 'box', nom: 'Box de saut', famille: 'Athlétisme' },
  { id: 'medecine_ball', nom: 'Médecine-ball', famille: 'Athlétisme' },
  { id: 'traineau', nom: 'Traîneau', famille: 'Athlétisme' },
  { id: 'espace_course', nom: 'Terrain plat (30 m ou plus)', famille: 'Athlétisme' },
  { id: 'panier_basket', nom: 'Terrain de basket avec panier', famille: 'Athlétisme' },
  { id: 'ballon_basket', nom: 'Ballon de basket', famille: 'Athlétisme' },
  { id: 'sac_frappe', nom: 'Sac de frappe', famille: 'Boxe' }
];

export const FAMILLES: Famille[] = ['Barres', 'Haltères et kettlebells', 'Machines', 'Poids du corps', 'Cardio', 'Athlétisme', 'Boxe'];

/** Matériel disponible à un endroit, avec la charge maximale des haltères et kettlebells. */
export interface Dispo {
  materiel: string[];
  halteresMaxKg: number;
  kettlebellMaxKg: number;
}

/** Préréglages tirés de l'interview (série 5). */
export const PRESETS: Record<Lieu, Dispo> = {
  salle: {
    materiel: [
      'barre', 'rack', 'banc', 'halteres', 'kettlebell', 'presse', 'poulie', 'machines', 'barre_traction',
      'barres_paralleles', 'ceinture_lest', 'tapis', 'velo_assault', 'rameur', 'skierg', 'box', 'medecine_ball', 'traineau',
      'espace_course', 'sac_frappe'
    ],
    halteresMaxKg: 40,
    kettlebellMaxKg: 32
  },
  maison: {
    materiel: ['halteres', 'pince', 'roue_abdo', 'poignees_pompes', 'tapis', 'corde'],
    halteresMaxKg: 10,
    kettlebellMaxKg: 0
  },
  exterieur: {
    materiel: ['espace_course', 'barre_traction', 'barres_paralleles', 'panier_basket'],
    halteresMaxKg: 0,
    kettlebellMaxKg: 0
  }
};

export function nomEquipement(id: string): string {
  return EQUIPEMENTS.find((e) => e.id === id)?.nom ?? id;
}
