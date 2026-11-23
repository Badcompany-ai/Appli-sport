import { describe, expect, it } from 'vitest';
import { proposerAjustement } from './ajustement';
import { genererICS, evenementsRappels, RAPPELS_DEFAUT } from './calendrier';
import { tempsReel } from './chrono';
import { coherence, lectureCroisee, type DonneesBilan } from './bilan';
import { NUTRITION_DEFAUT } from './nutrition';
import { PROFIL_INTERVIEW } from './profil';
import type { Mesure } from './corps';

const J = 86400000;
const t0 = new Date(2027, 1, 1, 8).getTime();
const pesees = (kgSemaine: number, depart = 82): Mesure[] =>
  Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, type: 'poids' as const, valeur: depart + (kgSemaine / 7) * i * 3, date: t0 + i * 3 * J }));
const base = { tailles: [] as Mesure[], reglage: NUTRITION_DEFAUT, poidsKg: 82, depuis: t0, maintenant: t0 + 21 * J, performancesEnHausse: false };

describe('ajustement automatique (9.3)', () => {
  it('pas avant 14 jours', () => {
    const r = proposerAjustement({ ...base, pesees: pesees(0), maintenant: t0 + 10 * J });
    expect(r.etat).toBe('attente');
  });

  it('reporté avec moins de 4 pesées', () => {
    const r = proposerAjustement({ ...base, pesees: pesees(0).slice(0, 3) });
    expect(r.etat).toBe('reporte');
    expect(r.texte).toMatch(/4 pesées/);
  });

  it('dans le rythme visé : rien à changer', () => {
    const r = proposerAjustement({ ...base, pesees: pesees(-0.2) });
    expect(r.etat).toBe('aucun');
  });

  it('poids stable en sèche : − 150 kcal au plus, avec une phrase d’explication', () => {
    const r = proposerAjustement({ ...base, pesees: pesees(0) });
    expect(r.etat).toBe('proposition');
    if (r.etat === 'proposition') {
      expect(r.delta).toBe(-150);
      expect(r.texte).toMatch(/au lieu de − 0,21 : objectif ajusté de − 150 kcal/);
    }
  });

  it('perte trop rapide : on remonte l’objectif', () => {
    const r = proposerAjustement({ ...base, pesees: pesees(-0.5) });
    expect(r.etat === 'proposition' && r.delta > 0).toBe(true);
  });

  it('I2 : tour de taille en baisse et performances en hausse → pas de baisse', () => {
    const tailles: Mesure[] = [
      { id: 't1', type: 'taille', valeur: 86, date: t0 },
      { id: 't2', type: 'taille', valeur: 85, date: t0 + 18 * J }
    ];
    const r = proposerAjustement({ ...base, pesees: pesees(0), tailles, performancesEnHausse: true });
    expect(r.etat).toBe('aucun');
    expect(r.texte).toMatch(/recomposition/);
    expect(proposerAjustement({ ...base, pesees: pesees(0), tailles, performancesEnHausse: false }).etat).toBe('proposition');
  });

  it('I2 : sans mesure récente du tour de taille, la règle ne s’applique pas', () => {
    const tailles: Mesure[] = [
      { id: 't1', type: 'taille', valeur: 86, date: t0 - 60 * J },
      { id: 't2', type: 'taille', valeur: 85, date: t0 - 40 * J }
    ];
    expect(proposerAjustement({ ...base, pesees: pesees(0), tailles, performancesEnHausse: true }).etat).toBe('proposition');
  });
});

describe('rappels Calendrier', () => {
  const ics = genererICS(evenementsRappels(PROFIL_INTERVIEW, RAPPELS_DEFAUT, new Date(2026, 10, 23, 10)), new Date(2026, 10, 23, 10));

  it('fichier iCalendar valide avec 4 rappels répétés et une alarme chacun', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(4);
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });

  it('séances les jours choisis (lundi, mardi, jeudi, dimanche) à partir du début du programme', () => {
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,TH,SU;UNTIL=20270627T235900');
    expect(ics).toContain('DTSTART:20261228T180000');
  });

  it('tour de taille toutes les 4 semaines, échappement des virgules', () => {
    expect(ics).toContain('INTERVAL=4');
    expect(ics).toMatch(/Au niveau du nombril\\, debout/);
  });
});

describe('chronométrage vidéo (I3)', () => {
  it('temps réel = écart entre les images ÷ facteur du ralenti', () => {
    expect(tempsReel(1.2, 4.4, 1)).toBe(3.2);
    expect(tempsReel(2, 27.6, 8)).toBe(3.2);
    expect(tempsReel(3, 2, 1)).toBeUndefined();
  });
});

describe('bilan hebdomadaire (4.11)', () => {
  const b: DonneesBilan = {
    lundi: t0, seancesFaites: 3, seancesPrevues: 4, activites: [{ nom: 'Padel', minutes: 120 }], volumeKg: 12000, records: [],
    performances: 'hausse', poids: { avant: 81.0, apres: 80.8 }, taille: { valeur: 85, variation: -0.5 },
    nutrition: { jours: 5, kcal: 2650, proteines: 158 }, sommeil: { nuits: 6, moyenne: 6.4, courtes: 2 }
  };

  it('lecture croisée neutre et factuelle', () => {
    expect(lectureCroisee(b)).toEqual([
      'Séances : 3 sur 4 et 1 activité.',
      'Tendance du poids : − 0,2 kg (80,8 kg).',
      'Tour de taille : − 0,5 cm.',
      'Maximums estimés : en hausse.',
      'Apports moyens (5 jours saisis) : 2\u202f650 kcal, 158 g de protéines.',
      'Sommeil : 6,4 h en moyenne sur 6 nuits, dont 2 de moins de 6 h.'
    ]);
    expect(coherence(b, -0.2)).toBe('Cohérent avec le rythme visé.');
  });
});
