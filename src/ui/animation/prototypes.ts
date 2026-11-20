import type { Animation } from './Silhouette';

// Prototypes (3 exercices) pour valider le rendu avant de dessiner toute la bibliothèque.

export const SQUAT_ARRIERE: Animation = {
  duree: 3,
  accessoires: [{ type: 'barre-dos' }],
  poses: [
    { ancre: { point: 'cheville', x: -8, y: -5 }, tronc: 178, cuisse: 2, tibia: -2, bras: -40, avantBras: 170, tete: 0 },
    { ancre: { point: 'cheville', x: -8, y: -5 }, tronc: 135, cuisse: 85, tibia: -35, bras: -10, avantBras: 120, tete: 30 }
  ]
};

export const POMPES: Animation = {
  duree: 2.4,
  poses: [
    { ancre: { point: 'poignet', x: 52, y: -3 }, tronc: 104, cuisse: -76, tibia: -76, bras: 2, avantBras: 0, pied: -10, tete: 0 },
    { ancre: { point: 'poignet', x: 52, y: -3 }, tronc: 96, cuisse: -84, tibia: -84, bras: -55, avantBras: 25, pied: -10, tete: 0 }
  ]
};

export const TRACTIONS: Animation = {
  duree: 3,
  cadre: [-110, -175, 220, 210],
  sol: false,
  accessoires: [{ type: 'barre-fixe', x: 10, y: -160 }],
  poses: [
    { ancre: { point: 'poignet', x: 10, y: -160 }, tronc: 182, cuisse: 8, tibia: -20, bras: 172, avantBras: 176, tete: 8 },
    { ancre: { point: 'poignet', x: 10, y: -160 }, tronc: 192, cuisse: 20, tibia: -28, bras: 40, avantBras: 172, tete: 12 }
  ]
};
