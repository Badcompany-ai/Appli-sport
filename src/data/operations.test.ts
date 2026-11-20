import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BaseSport, utiliserBase, db } from './db';
import * as op from './operations';
import { SEANCE_DEMO } from '../domain/demo';
import { lireSauvegarde } from '../domain/sauvegarde';

let n = 0;
beforeEach(async () => {
  utiliserBase(new BaseSport('test-' + n++));
  await db.open();
});

const JOUR = 86400000;

describe('séances et séries', () => {
  it('reprend la séance en cours au lieu d’en créer une seconde', async () => {
    const a = await op.demarrerSeance(SEANCE_DEMO, 1000);
    const b = await op.demarrerSeance(SEANCE_DEMO, 2000);
    expect(b.id).toBe(a.id);
  });

  it('enregistre chaque série immédiatement et retrouve la dernière performance', async () => {
    const s1 = await op.demarrerSeance(SEANCE_DEMO, 1000);
    await op.enregistrerSerie({ seanceId: s1.id, exerciceId: 'squat-arriere', numero: 0, chargeKg: 60, reps: 5, faiteLe: 1100 });
    await op.enregistrerSerie({ seanceId: s1.id, exerciceId: 'squat-arriere', numero: 1, chargeKg: 60, reps: 4, faiteLe: 1200 });
    await op.terminerSeance(s1.id, 1300);
    const s2 = await op.demarrerSeance(SEANCE_DEMO, 5 * JOUR);
    expect(s2.id).not.toBe(s1.id);
    const d = await op.dernierePerformance('squat-arriere', s2.id);
    expect(d?.seance.id).toBe(s1.id);
    expect(d?.series.map((s) => s.reps)).toEqual([5, 4]);
  });

  it('une série supprimée (annuler) disparaît', async () => {
    const s = await op.demarrerSeance(SEANCE_DEMO, 1000);
    const serie = await op.enregistrerSerie({ seanceId: s.id, exerciceId: 'pompes', numero: 0, reps: 10, faiteLe: 1100 });
    await op.supprimerSerie(serie.id);
    expect(await op.seriesDeLaSeance(s.id)).toHaveLength(0);
  });

  it('une séance à la corbeille est restaurable, puis purgée après 30 jours', async () => {
    const s = await op.demarrerSeance(SEANCE_DEMO, 1000);
    await op.enregistrerSerie({ seanceId: s.id, exerciceId: 'pompes', numero: 0, reps: 10, faiteLe: 1100 });
    await op.terminerSeance(s.id, 1200);
    await op.mettreALaCorbeille(s.id, 2000);
    expect(await op.seancesTerminees()).toHaveLength(0);
    expect(await op.dernierePerformance('pompes')).toBeUndefined();
    await op.restaurerSeance(s.id);
    expect(await op.seancesTerminees()).toHaveLength(1);
    await op.mettreALaCorbeille(s.id, 2000);
    expect(await op.viderCorbeilleAncienne(2000 + 29 * JOUR)).toBe(0);
    expect(await op.viderCorbeilleAncienne(2000 + 31 * JOUR)).toBe(1);
    expect(await db.series.count()).toBe(0);
  });
});

describe('sauvegardes', () => {
  it('exporte puis réimporte sans perte, avec une copie de sécurité', async () => {
    const s = await op.demarrerSeance(SEANCE_DEMO, 1000);
    await op.enregistrerSerie({ seanceId: s.id, exerciceId: 'squat-arriere', numero: 0, chargeKg: 62.5, reps: 5, faiteLe: 1100 });
    await op.ecrireReglage('raccourci', { actif: true, nom: 'Repos' });
    const texte = JSON.stringify(await op.exporterTout(5000));

    utiliserBase(new BaseSport('test-import-' + n++));
    await db.open();
    await op.demarrerSeance(SEANCE_DEMO, 9000); // donnée qui sera remplacée
    const lu = lireSauvegarde(texte);
    expect(lu.ok).toBe(true);
    if (!lu.ok) return;
    await op.importerTout(lu.contenu, 10000);
    expect(await db.seances.count()).toBe(1);
    expect((await db.series.toArray())[0].chargeKg).toBe(62.5);
    expect(await op.lireReglage('raccourci', null)).toEqual({ actif: true, nom: 'Repos' });
    const copies = await op.listeCopies();
    expect(copies[0].raison).toBe('avant_import');
  });

  it('garde une copie automatique par jour, 7 au maximum', async () => {
    for (let j = 0; j < 10; j++) {
      expect(await op.copieQuotidienneSiBesoin(j * JOUR)).toBe(true);
      expect(await op.copieQuotidienneSiBesoin(j * JOUR + 1000)).toBe(false);
    }
    const copies = await op.listeCopies();
    expect(copies).toHaveLength(7);
    expect(copies[0].creeeLe).toBe(9 * JOUR);
  });
});
