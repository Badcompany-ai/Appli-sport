import { describe, expect, it } from 'vitest';
import { seriesEchauffement } from './echauffement';
import { forceRelative, indicateur, pointsExercice, recordsBattus, valeurSerie } from './records';
import { prochaineCharge } from './progression';
import type { Seance, Serie } from './types';

const seance = (id: string, debut: number, extra: Partial<Seance> = {}): Seance => ({
  id, planId: id, nom: id, plan: { id, nom: id, exercices: [] }, statut: 'terminee', debut, exerciceIndex: 0, notes: {}, ...extra
});
let n = 0;
const serie = (seanceId: string, exerciceId: string, v: Partial<Serie>): Serie => ({ id: String(n++), seanceId, exerciceId, numero: 0, faiteLe: 0, ...v });

describe('séries d’échauffement', () => {
  it('montée progressive avant 100 kg à la barre', () => {
    expect(seriesEchauffement(100, { barre: 20 })).toEqual([
      { chargeKg: 20, reps: 8 }, { chargeKg: 50, reps: 5 }, { chargeKg: 70, reps: 3 }, { chargeKg: 85, reps: 1 }
    ]);
  });
  it('rien pour une charge légère', () => {
    expect(seriesEchauffement(30, { barre: 20 })).toEqual([]);
  });
  it('les paliers trop proches sont retirés', () => {
    const s = seriesEchauffement(45, { barre: 20 });
    for (let i = 1; i < s.length; i++) expect(s[i].chargeKg - s[i - 1].chargeKg).toBeGreaterThanOrEqual(5);
    expect(s.every((x) => x.chargeKg < 45 - 4.9)).toBe(true);
  });
  it('déclenché à 60 % du maximum estimé connu', () => {
    expect(seriesEchauffement(30, { pas: 1, maxEstime: 45 }).length).toBeGreaterThan(0);
  });
});

describe('records et graphiques', () => {
  const seances = [seance('a', 1000), seance('b', 2000), seance('c', 3000, { supprimeeLe: 5 })];
  const series = [
    serie('a', 'squat-arriere', { chargeKg: 80, reps: 5 }),
    serie('b', 'squat-arriere', { chargeKg: 85, reps: 5 }),
    serie('b', 'squat-arriere', { chargeKg: 80, reps: 8 }),
    serie('c', 'squat-arriere', { chargeKg: 200, reps: 5 }),
    serie('a', 'tractions', { chargeKg: 0, reps: 8 }),
    serie('b', 'tractions', { chargeKg: 0, reps: 7 })
  ];
  it('maximum estimé avec poids du corps pour les tractions', () => {
    expect(indicateur('tractions')).toBe('max');
    expect(valeurSerie(series[4], 80)).toBeCloseTo(80 * (1 + 8 / 30), 1);
  });
  it('un point par séance (meilleure série), séances supprimées exclues', () => {
    const p = pointsExercice('squat-arriere', seances, series, 80);
    expect(p.map((x) => x.seanceId)).toEqual(['a', 'b']);
    expect(p[1].valeur).toBeCloseTo(101.3, 1);
  });
  it('record battu détecté, pas à la première séance ni sans progrès', () => {
    expect(recordsBattus('a', seances, series, 80)).toEqual([]);
    const r = recordsBattus('b', seances, series, 80);
    expect(r.map((x) => x.exerciceId)).toEqual(['squat-arriere']);
  });
  it('force relative', () => {
    expect(forceRelative(123, 82)).toBe(1.5);
  });
});

describe('ressenti et progression (règle 7.2)', () => {
  const faites = [{ chargeKg: 60, reps: 8 }, { chargeKg: 60, reps: 8 }];
  it('trop facile : progression accélérée', () => {
    expect(prochaineCharge(faites, 8, 2.5, undefined, 6, 2, 'facile').chargeKg).toBe(65);
    expect(prochaineCharge([{ chargeKg: 60, reps: 6 }], 8, 2.5, undefined, 6, 2, 'facile').chargeKg).toBe(62.5);
  });
  it('trop dur avec répétitions manquées : − 5 %', () => {
    expect(prochaineCharge([{ chargeKg: 100, reps: 5 }], 8, 2.5, undefined, 6, 2, 'dur').chargeKg).toBe(95);
  });
  it('trop dur mais répétitions faites : même charge', () => {
    expect(prochaineCharge(faites, 8, 2.5, undefined, 6, 2, 'dur').chargeKg).toBe(60);
  });
});
