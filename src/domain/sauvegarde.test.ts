import { describe, expect, it } from 'vitest';
import { construireSauvegarde, lireSauvegarde, nomFichier, VERSION_FORMAT } from './sauvegarde';

const vide = { seances: [], series: [], reglages: [] };

describe('fichier de sauvegarde', () => {
  it('relit ce qu’il écrit', () => {
    const c = construireSauvegarde(vide, 123);
    const r = lireSauvegarde(JSON.stringify(c));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.resume).toEqual({ seances: 0, series: 0, exporteeLe: 123 });
  });
  it('refuse un fichier illisible ou étranger', () => {
    expect(lireSauvegarde('pas du json').ok).toBe(false);
    expect(lireSauvegarde('{"application":"autre"}').ok).toBe(false);
    expect(lireSauvegarde(JSON.stringify({ application: 'appli-sport', format: 1 })).ok).toBe(false);
  });
  it('refuse une sauvegarde d’une version plus récente', () => {
    const c = { ...construireSauvegarde(vide, 1), format: VERSION_FORMAT + 1 };
    const r = lireSauvegarde(JSON.stringify(c));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreur).toMatch(/plus récente/);
  });
  it('refuse une série abîmée', () => {
    const c = construireSauvegarde({ ...vide, series: [{ id: 1 } as never] }, 1);
    expect(lireSauvegarde(JSON.stringify(c)).ok).toBe(false);
  });
  it('nomme le fichier avec la date', () => {
    expect(nomFichier(new Date(2026, 11, 28).getTime())).toBe('sauvegarde-sport-2026-12-28.json');
  });
});
