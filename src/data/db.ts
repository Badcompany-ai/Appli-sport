import Dexie, { type Table } from 'dexie';
import type { Copie, Reglage, Seance, Serie } from '../domain/types';

/**
 * Base de données interne du navigateur (IndexedDB), uniquement sur l'appareil.
 * Toute évolution de structure passe par un nouveau numéro de version Dexie,
 * avec conversion des anciennes données : rien n'est perdu lors des mises à jour.
 */
export class BaseSport extends Dexie {
  seances!: Table<Seance, string>;
  series!: Table<Serie, string>;
  reglages!: Table<Reglage, string>;
  copies!: Table<Copie, string>;

  constructor(nom = 'appli-sport') {
    super(nom);
    this.version(1).stores({
      seances: 'id, statut, debut, supprimeeLe',
      series: 'id, seanceId, exerciceId, faiteLe',
      reglages: 'cle',
      copies: 'id, creeeLe'
    });
  }
}

export let db = new BaseSport();

/** Pour les tests : utiliser une base séparée. */
export function utiliserBase(nouvelle: BaseSport) {
  db = nouvelle;
}

export function nouvelId(): string {
  return crypto.randomUUID();
}
