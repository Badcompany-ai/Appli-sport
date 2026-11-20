import { describe, expect, it } from 'vitest';
import { etatRepos, lienRaccourci, prolonger } from './repos';
import { kg, minSec, ilYA } from './format';
import { SEANCE_DEMO, dureeEstimeeMin } from './demo';

describe('minuteur de repos', () => {
  it('calcule le temps restant à partir de l’heure de fin', () => {
    const e = etatRepos(1_000_000 + 90_000, 120, 1_000_000 + 0);
    expect(e.restantSec).toBe(90);
    expect(e.termine).toBe(false);
    expect(e.progression).toBeCloseTo(0.25);
  });
  it('reste juste après une mise en pause de l’application', () => {
    // L’application est restée en arrière-plan 5 minutes : le repos est fini.
    const e = etatRepos(1_000_000 + 90_000, 90, 1_000_000 + 300_000);
    expect(e.termine).toBe(true);
    expect(e.restantSec).toBe(0);
    expect(e.progression).toBe(1);
  });
  it('+30 s prolonge le repos et le total', () => {
    const p = prolonger(1_000_000 + 10_000, 90, 30, 1_000_000);
    expect(p.fin).toBe(1_000_000 + 40_000);
    expect(p.totalSec).toBe(90);
    const q = prolonger(1_000_000 - 5_000, 90, 30, 1_000_000);
    expect(q.fin).toBe(1_000_000 + 30_000);
  });
  it('construit le lien du raccourci avec la durée', () => {
    expect(lienRaccourci('Repos', 120)).toBe('shortcuts://run-shortcut?name=Repos&input=text&text=120');
    expect(lienRaccourci('Mon repos', 89.6)).toBe('shortcuts://run-shortcut?name=Mon%20repos&input=text&text=90');
  });
});

describe('mise en forme', () => {
  it('écrit les charges à la française', () => {
    expect(kg(62.5)).toBe('62,5');
    expect(kg(60)).toBe('60');
  });
  it('écrit les durées en minutes et secondes', () => {
    expect(minSec(125)).toBe('2:05');
    expect(minSec(0)).toBe('0:00');
    expect(minSec(-3)).toBe('0:00');
  });
  it('écrit les dates relatives', () => {
    const maintenant = new Date(2026, 11, 28, 18).getTime();
    expect(ilYA(new Date(2026, 11, 28, 7).getTime(), maintenant)).toBe("aujourd'hui");
    expect(ilYA(new Date(2026, 11, 27, 23).getTime(), maintenant)).toBe('hier');
    expect(ilYA(new Date(2026, 11, 23, 9).getTime(), maintenant)).toBe('il y a 5 jours');
  });
});

describe('séance de démonstration', () => {
  it('a une durée estimée raisonnable', () => {
    const d = dureeEstimeeMin(SEANCE_DEMO);
    expect(d).toBeGreaterThan(5);
    expect(d).toBeLessThan(25);
  });
});
