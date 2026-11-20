import { describe, expect, it } from 'vitest';
import { apresSerie, membresDuGroupe, serieSuivante } from './enchainement';
import { prevoir } from './remplacement';
import type { SeancePrevue } from './types';

const plan: SeancePrevue = {
  id: 't', nom: 't',
  exercices: [
    prevoir('squat-arriere', 3, { reps: 5, chargeKg: 100, reposSec: 180 }),
    { ...prevoir('curl-halteres', 2, { reps: 12, reposSec: 0 }), groupe: 'p', reposIntra: 0 },
    { ...prevoir('extension-triceps-poulie', 2, { reps: 12, reposSec: 90 }), groupe: 'p' }
  ]
};

describe('exercices enchaînés', () => {
  it('trouve les membres d’un groupe', () => {
    expect(membresDuGroupe(plan, 0)).toEqual([0]);
    expect(membresDuGroupe(plan, 1)).toEqual([1, 2]);
    expect(membresDuGroupe(plan, 2)).toEqual([1, 2]);
  });
  it('alterne curl puis triceps, série par série', () => {
    const c: Record<string, number> = {};
    const f = (id: string) => c[id] ?? 0;
    expect(serieSuivante(plan, 1, f)).toEqual({ membre: 1, numero: 0 });
    c['curl-halteres'] = 1;
    expect(apresSerie(plan, 1, f)).toEqual({ groupeFini: false, reposSec: 0, prochainIndex: 1 });
    expect(serieSuivante(plan, 1, f)).toEqual({ membre: 2, numero: 0 });
    c['extension-triceps-poulie'] = 1;
    expect(apresSerie(plan, 2, f)).toEqual({ groupeFini: false, reposSec: 90, prochainIndex: 1 });
    expect(serieSuivante(plan, 1, f)).toEqual({ membre: 1, numero: 1 });
    c['curl-halteres'] = 2;
    c['extension-triceps-poulie'] = 2;
    expect(apresSerie(plan, 2, f)).toEqual({ groupeFini: true, reposSec: 90, prochainIndex: 3 });
  });
  it('après un tour de contraste, le repos est celui de la série lourde', () => {
    const contraste: SeancePrevue = {
      id: 'c', nom: 'c',
      exercices: [
        { ...prevoir('developpe-couche', 5, { reps: 5, chargeKg: 80, reposSec: 180 }), groupe: 'k', reposIntra: 60 },
        { ...prevoir('lancer-mb-poitrine', 5, { reps: 3, reposSec: 0 }), groupe: 'k', reposIntra: 0 }
      ]
    };
    const c: Record<string, number> = { 'developpe-couche': 1 };
    expect(apresSerie(contraste, 0, (id) => c[id] ?? 0)).toMatchObject({ reposSec: 60, groupeFini: false });
    c['lancer-mb-poitrine'] = 1;
    expect(apresSerie(contraste, 1, (id) => c[id] ?? 0)).toMatchObject({ reposSec: 180, groupeFini: false });
  });
  it('un exercice seul se comporte normalement', () => {
    expect(apresSerie(plan, 0, () => 1)).toEqual({ groupeFini: false, reposSec: 180, prochainIndex: 0 });
    expect(apresSerie(plan, 0, () => 3)).toEqual({ groupeFini: true, reposSec: 180, prochainIndex: 1 });
  });
});
