import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BaseSport, utiliserBase, db } from './db';
import * as op from './operations';
import * as nu from './nutrition';
import { calculerBilan, joursDAffilee, performances } from './bilan';
import { COMPLEMENTS } from '../domain/aliments';
import { prevoir } from '../domain/remplacement';
import type { SeancePrevue } from '../domain/types';

let n = 0;
beforeEach(async () => {
  utiliserBase(new BaseSport('bilan-' + n++));
  await db.open();
});

const J = 86400000;
const lundi = new Date(2027, 1, 1).getTime();
const plan: SeancePrevue = { id: 'p', nom: 'Force', exercices: [prevoir('squat-arriere', 3, { reps: 5, reposSec: 120 })], programme: { semaine: 5, lettre: 'A', type: 'entrainement' } };

async function seance(t: number, charge: number) {
  const s = await op.demarrerSeance(plan, t);
  await op.enregistrerSerie({ seanceId: s.id, exerciceId: 'squat-arriere', numero: 0, chargeKg: charge, reps: 5, faiteLe: t + 1 });
  await op.terminerSeance(s.id, t + 3600000);
}

describe('bilan de la semaine', () => {
  it('séances, activités, records, poids, nutrition et sommeil', async () => {
    await seance(lundi - 20 * J, 100);
    await seance(lundi + J, 105);
    await op.enregistrerActivite('Padel', 120, { semaine: 5, lettre: 'ACT', type: 'activite' }, { id: 'padel', met: 6 }, lundi + 3 * J);
    await nu.ajouterMesure('poids', 82, lundi - 2 * J);
    await nu.ajouterMesure('poids', 81.6, lundi + 5 * J);
    await nu.ajouterAuJournal(COMPLEMENTS[0], nu.entreeDepuisAliment(COMPLEMENTS[0], 30, '1 dose'), '2027-02-02');
    const b = await calculerBilan(lundi, { seancesPrevues: 4, sommeil: { '2027-02-01': 5, '2027-02-02': 8 }, fatigues: [] });
    expect(b.seancesFaites).toBe(1);
    expect(b.activites).toEqual([{ nom: 'Padel', minutes: 120 }]);
    expect(b.records).toEqual(['Squat arrière']);
    expect(b.volumeKg).toBe(525);
    expect(b.poids?.avant).toBe(82);
    expect(b.poids?.apres).toBeLessThan(82);
    expect(b.nutrition.jours).toBe(1);
    expect(b.sommeil).toEqual({ nuits: 2, moyenne: 6.5, courtes: 1 });
  });

  it('performances en hausse quand le maximum estimé monte', async () => {
    await seance(lundi - 30 * J, 100);
    await seance(lundi - 3 * J, 110);
    expect(await performances(lundi)).toBe('hausse');
  });
});

describe('compléments pris (I7)', () => {
  it('compte les jours d’affilée', async () => {
    const c = COMPLEMENTS[1];
    for (const j of ['2027-02-03', '2027-02-02', '2027-02-01']) await nu.ajouterAuJournal(c, nu.entreeDepuisAliment(c, 5, '1 dose'), j);
    expect(await joursDAffilee(c.id, ['2027-02-04', '2027-02-03', '2027-02-02', '2027-02-01', '2027-01-31'])).toEqual({ aujourdhui: false, serie: 3 });
    expect(await joursDAffilee(c.id, ['2027-02-03', '2027-02-02', '2027-02-01'])).toEqual({ aujourdhui: true, serie: 3 });
  });
});
