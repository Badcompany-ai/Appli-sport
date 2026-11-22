import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BaseSport, utiliserBase, db } from './db';
import * as op from './operations';
import { appliquerProgression } from './programme';
import { prevoir } from '../domain/remplacement';
import type { Ressenti, SeancePrevue } from '../domain/types';

let n = 0;
beforeEach(async () => {
  utiliserBase(new BaseSport('prog-' + n++));
  await db.open();
});

const plan: SeancePrevue = { id: 'p', nom: 'Bas du corps', exercices: [{ ...prevoir('squat-arriere', 4, { reps: 6, reposSec: 150 }), repsMin: 6 }] };

async function seance(t: number, ressenti: Ressenti) {
  const s = await op.demarrerSeance(plan, t);
  for (let i = 0; i < 4; i++) await op.enregistrerSerie({ seanceId: s.id, exerciceId: 'squat-arriere', numero: i, chargeKg: 100, reps: 6, faiteLe: t + i });
  await op.modifierSeance(s.id, { ressentis: { 'squat-arriere': ressenti } });
  await op.terminerSeance(s.id, t + 100);
}

describe('ressenti (7.2)', () => {
  it('deux fois « trop dur » d’affilée : − 10 % et une série de moins', async () => {
    await seance(1000, 'dur');
    await seance(2000, 'dur');
    const e = (await appliquerProgression(plan)).exercices[0];
    expect(e.chargeKg).toBe(90);
    expect(e.series).toBe(3);
    expect(e.raisonCharge).toMatch(/Deux fois/);
  });

  it('une seule fois « trop dur » : la charge est gardée', async () => {
    await seance(1000, 'correct');
    await seance(2000, 'dur');
    const e = (await appliquerProgression(plan)).exercices[0];
    expect(e.chargeKg).toBe(100);
    expect(e.series).toBe(4);
  });
});
