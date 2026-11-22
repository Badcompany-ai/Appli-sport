import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BaseSport, utiliserBase, db } from './db';
import * as nu from './nutrition';
import * as op from './operations';
import { COMPLEMENTS, additionner } from '../domain/aliments';
import { lireSauvegarde } from '../domain/sauvegarde';

let n = 0;
beforeEach(async () => {
  utiliserBase(new BaseSport('nutri-' + n++));
  await db.open();
});

const proteine = COMPLEMENTS[0];

describe('journal', () => {
  it('un aliment ajouté met à jour les totaux et la liste des récents', async () => {
    await nu.ajouterAuJournal(proteine, nu.entreeDepuisAliment(proteine, 30, '1 dose'), '2027-01-11', 100);
    const j = await nu.journalDuJour('2027-01-11');
    expect(Math.round(additionner(j.map((e) => e.nutriments)).proteines)).toBe(23);
    expect((await nu.alimentsConnus())[0]).toMatchObject({ id: proteine.id, nbUsages: 1, dernierUsage: 100 });
  });

  it('suppression annulable sans perte', async () => {
    const e = await nu.ajouterAuJournal(proteine, nu.entreeDepuisAliment(proteine, 30, '1 dose'), '2027-01-11');
    await nu.supprimerEntree(e.id);
    expect(await nu.journalDuJour('2027-01-11')).toHaveLength(0);
    await nu.restaurerEntrees([e]);
    expect(await nu.journalDuJour('2027-01-11')).toEqual([e]);
  });

  it('copier la veille et repas enregistrés', async () => {
    await nu.ajouterAuJournal(proteine, nu.entreeDepuisAliment(proteine, 30, '1 dose'), '2027-01-10');
    await nu.ajouterAuJournal(undefined, { nom: 'Estimation', grammes: 0, quantite: 'restaurant', nutriments: { kcal: 900, proteines: 40, lipides: 0, glucides: 0, fibres: 0 } }, '2027-01-10');
    await nu.copierJour('2027-01-10', '2027-01-11');
    expect(await nu.journalDuJour('2027-01-11')).toHaveLength(2);
    const r = await nu.enregistrerRepas('Mon petit-déjeuner', await nu.journalDuJour('2027-01-10'));
    await nu.ajouterRepas(r, '2027-01-12');
    expect(await nu.journalDuJour('2027-01-12')).toHaveLength(2);
  });

  it('le journal, les pesées et les aliments sont dans la sauvegarde', async () => {
    await nu.ajouterAuJournal(proteine, nu.entreeDepuisAliment(proteine, 30, '1 dose'), '2027-01-11');
    await nu.ajouterMesure('poids', 81.4, 5);
    const fichier = JSON.stringify(await op.exporterTout(10));
    await db.journal.clear();
    await db.mesures.clear();
    const lu = lireSauvegarde(fichier);
    expect(lu.ok).toBe(true);
    if (lu.ok) await op.importerTout(lu.contenu, 20);
    expect(await nu.journalDuJour('2027-01-11')).toHaveLength(1);
    expect((await nu.mesures('poids'))[0].valeur).toBe(81.4);
  });
});

describe('dépense du jour', () => {
  it('séance et activité terminées le jour même', async () => {
    const debut = new Date(2027, 0, 11, 18).getTime();
    await op.enregistrerActivite('Padel', 120, { semaine: 2, lettre: 'ACT', type: 'activite' }, { id: 'padel', met: 6 }, debut + 120 * 60000);
    const d = await nu.sportDuJour('2027-01-11', 82);
    expect(d).toHaveLength(1);
    expect(d[0].kcal).toBe(820);
    expect(await nu.sportDuJour('2027-01-12', 82)).toHaveLength(0);
  });
});
