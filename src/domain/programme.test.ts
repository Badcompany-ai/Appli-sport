import { describe, expect, it } from 'vitest';
import { infoSemaine, NB_SEMAINES, prochaineSeance, seancesDeLaSemaine, seanceMobilite, indexSemaine } from './programme';
import { PROFIL_INTERVIEW, joursDeSeance, lundiDe, depuisCle, type Profil } from './profil';
import { exercice } from './exercices';
import { dureeEstimeeMin } from './demo';
import { adapterSeance } from './remplacement';
import { PRESETS } from './materiel';
import { maxEstime, chargePour, prochaineCharge } from './progression';
import { avancement, dureeNavette, etapes, proposerObjectif, resultatsTests, vo2DepuisPalier } from './niveau';
import type { Seance, Serie } from './types';

const profil = PROFIL_INTERVIEW;

describe('structure du programme', () => {
  it('2 semaines de reprise puis 4 cycles de 6 semaines (26 semaines)', () => {
    expect(NB_SEMAINES).toBe(26);
    expect(infoSemaine(0)).toMatchObject({ phase: 'reprise', test: 'leger' });
    expect(infoSemaine(1)).toMatchObject({ phase: 'reprise', test: 'complet' });
    expect(infoSemaine(2)).toMatchObject({ phase: 'c1', dansPhase: 1, allegee: false });
    expect(infoSemaine(7)).toMatchObject({ phase: 'c1', dansPhase: 6, allegee: true, test: 'complet' });
    expect(infoSemaine(8)).toMatchObject({ phase: 'c2', dansPhase: 1 });
    expect(infoSemaine(25)).toMatchObject({ phase: 'c4', dansPhase: 6, test: 'complet' });
    expect(infoSemaine(26)).toMatchObject({ apresProgramme: true, phase: 'c4' });
  });
  it('4 séances par semaine, avec test léger en semaine 1 et tests complets en fin de reprise et de cycle', () => {
    const s1 = seancesDeLaSemaine(profil, 0);
    expect(s1.map((s) => s.programme?.lettre)).toEqual(['A', 'B', 'C', 'L']);
    const s2 = seancesDeLaSemaine(profil, 1);
    expect(s2.map((s) => s.programme?.lettre)).toEqual(['A', 'B', 'T1', 'T2']);
    expect(seancesDeLaSemaine(profil, 4).map((s) => s.programme?.lettre)).toEqual(['A', 'B', 'C', 'D']);
    expect(seancesDeLaSemaine(profil, 7).map((s) => s.programme?.lettre)).toEqual(['A', 'B', 'T1', 'T2']);
  });
  it('s’adapte à 3 ou 5 séances par semaine', () => {
    expect(seancesDeLaSemaine({ ...profil, seancesParSemaine: 3 }, 4)).toHaveLength(3);
    expect(seancesDeLaSemaine({ ...profil, seancesParSemaine: 5 }, 4)).toHaveLength(5);
  });
  it('tous les exercices existent et chaque séance tient en environ une heure', () => {
    for (let i = 0; i < NB_SEMAINES; i++) {
      for (const s of seancesDeLaSemaine(profil, i)) {
        for (const e of s.exercices) if (!e.testId) expect(exercice(e.exerciceId), `${s.id} ${e.exerciceId}`).toBeDefined();
        if (s.programme?.type === 'entrainement') {
          const d = dureeEstimeeMin(s) + 10; // + échauffement
          expect(d, `${s.id} : ${d} min`).toBeLessThanOrEqual(75);
          expect(d).toBeGreaterThanOrEqual(25);
        }
      }
    }
  });
  it('les efforts explosifs sont placés en début de séance', () => {
    const a = seancesDeLaSemaine(profil, 4)[0];
    expect(a.exercices[0].exerciceId).toBe('saut-box');
    const c = seancesDeLaSemaine(profil, 4)[2];
    expect(c.exercices[0].exerciceId).toBe('sprint-court');
  });
  it('pas de sprint au maximum pendant la reprise', () => {
    const c = seancesDeLaSemaine(profil, 0)[2];
    expect(c.exercices.find((e) => e.exerciceId === 'sprint-court')?.consigne).toMatch(/70 %/);
  });
  it('la semaine allégée divise les séries par deux', () => {
    const normal = seancesDeLaSemaine(profil, 6)[0];
    const allegee = seancesDeLaSemaine(profil, 7)[0];
    const sq = (s: typeof normal) => s.exercices.find((e) => e.exerciceId === 'squat-arriere')!.series;
    expect(sq(allegee)).toBe(Math.ceil(sq(normal) / 2));
  });
  it('les charges deviennent plus lourdes (moins de répétitions) au fil des cycles', () => {
    const reps = (i: number) => seancesDeLaSemaine(profil, i)[0].exercices.find((e) => e.exerciceId === 'squat-arriere')!.reps!;
    expect(reps(0)).toBeGreaterThan(reps(2));
    expect(reps(2)).toBeGreaterThan(reps(8));
    expect(reps(8)).toBeGreaterThanOrEqual(reps(20));
  });
  it('sans apprentissage de l’épaulé, le swing le remplace', () => {
    const p: Profil = { ...profil, apprendreEpaule: false };
    const c = seancesDeLaSemaine(p, 4)[2];
    expect(c.exercices.some((e) => e.exerciceId === 'epaule-suspension')).toBe(false);
    expect(c.exercices.some((e) => e.exerciceId === 'swing-kettlebell')).toBe(true);
  });
  it('les séances du programme restent valables à la maison et dehors (remplacements)', () => {
    for (const lieu of ['maison', 'exterieur'] as const) {
      for (const s of seancesDeLaSemaine(profil, 4)) {
        const r = adapterSeance(s, { dispo: PRESETS[lieu], poidsCorpsKg: 82 });
        expect(r.plan.exercices.length, `${lieu} ${s.id}`).toBeGreaterThanOrEqual(s.exercices.length - 2);
      }
    }
  });
  it('les épreuves impossibles sont reportées avec une explication', () => {
    const t1 = seancesDeLaSemaine(profil, 1)[2];
    const r = adapterSeance(t1, { dispo: PRESETS.maison, poidsCorpsKg: 82 });
    expect(r.plan.exercices.some((e) => e.testId === 'test-sprint20')).toBe(false);
    expect(r.changements.some((c) => /Épreuve impossible ici/.test(c.raison))).toBe(true);
  });
  it('séance de mobilité de 15 minutes environ', () => {
    const m = seanceMobilite(3);
    expect(dureeEstimeeMin(m)).toBeLessThanOrEqual(20);
  });
});

describe('calendrier', () => {
  it('une séance manquée reste la prochaine à faire', () => {
    const semaine = seancesDeLaSemaine(profil, 4);
    expect(prochaineSeance(semaine, new Set())?.programme?.lettre).toBe('A');
    expect(prochaineSeance(semaine, new Set(['A']))?.programme?.lettre).toBe('B');
    expect(prochaineSeance(semaine, new Set(['A', 'B', 'C', 'D']))).toBeUndefined();
  });
  it('numéro de semaine à partir du lundi de début', () => {
    const debut = depuisCle('2026-12-28');
    expect(indexSemaine(debut, new Date(2026, 11, 28))).toBe(0);
    expect(indexSemaine(debut, new Date(2027, 0, 3))).toBe(0);
    expect(indexSemaine(debut, new Date(2027, 0, 4))).toBe(1);
    expect(indexSemaine(debut, new Date(2026, 11, 20))).toBe(-2);
    expect(lundiDe(new Date(2026, 10, 20)).getDate()).toBe(16);
  });
  it('jours de séance : préférés, complétés si besoin', () => {
    expect(joursDeSeance(profil)).toEqual([0, 1, 3, 6]);
    expect(joursDeSeance({ ...profil, jours: [0], seancesParSemaine: 3 })).toHaveLength(3);
  });
});

describe('progression des charges', () => {
  it('formule d’Epley, valable jusqu’à 10 répétitions', () => {
    expect(maxEstime(100, 5)).toBeCloseTo(116.67, 1);
    expect(maxEstime(100, 1)).toBe(100);
    expect(maxEstime(100, 12)).toBeUndefined();
    expect(chargePour(116.67, 5, 0)).toBeCloseTo(100, 0);
  });
  it('double progression : charge + 1 palier quand toutes les séries atteignent le haut de la fourchette', () => {
    expect(prochaineCharge([{ chargeKg: 60, reps: 8 }, { chargeKg: 60, reps: 8 }], 8, 2.5).chargeKg).toBe(62.5);
    expect(prochaineCharge([{ chargeKg: 60, reps: 8 }, { chargeKg: 60, reps: 6 }], 8, 2.5).chargeKg).toBe(60);
  });
  it('autre fourchette de répétitions la dernière fois : on repart du maximum estimé', () => {
    // 62,5 kg × 5 la dernière fois, aujourd'hui 8 à 10 répétitions en reprise (3 en réserve).
    const r = prochaineCharge([{ chargeKg: 62.5, reps: 5 }], 10, 2.5, 72.9, 8, 3);
    expect(r.chargeKg).toBe(52.5);
  });
  it('sans historique : depuis le maximum estimé, sinon charge à choisir', () => {
    expect(prochaineCharge(undefined, 8, 2.5, 100, 6).chargeKg).toBe(80);
    expect(prochaineCharge(undefined, 8, 2.5).chargeKg).toBeUndefined();
  });
});

describe('tests de niveau et objectifs', () => {
  it('VO2 max du test navette (Léger, adulte)', () => {
    expect(vo2DepuisPalier(1)).toBeCloseTo(26.6, 1);
    expect(vo2DepuisPalier(9)).toBeCloseTo(50.6, 1);
    expect(dureeNavette(1)).toBeCloseTo(8.47, 1);
  });
  it('objectifs proposés et avancement, dans les deux sens', () => {
    const d = proposerObjectif('test-detente', 'Détente', 'cm', 'haut', 60, '2027-06-27')!;
    expect(d.cible).toBe(64);
    expect(avancement(d, 62)).toBeCloseTo(0.5);
    const s = proposerObjectif('test-sprint20', 'Sprint', 's', 'bas', 3.2, '2027-06-27')!;
    expect(s.cible).toBeCloseTo(3.07, 2);
    expect(avancement(s, 3.2)).toBe(0);
    expect(avancement(s, 3.0)).toBe(1);
    expect(etapes(d)).toEqual([61, 62, 63, 64]);
  });
  it('résultats extraits de l’historique des séances de test', () => {
    const seance = (id: string, type: 'test' | 'test_leger' | 'entrainement', debut: number): Seance => ({
      id, planId: id, nom: id, statut: 'terminee', debut, exerciceIndex: 0, notes: {},
      plan: { id, nom: id, exercices: [], programme: { semaine: 1, lettre: 'T', type } }
    });
    const serie = (seanceId: string, exerciceId: string, v: Partial<Serie>): Serie => ({ id: Math.random().toString(), seanceId, exerciceId, numero: 0, faiteLe: 0, ...v });
    const r = resultatsTests(
      [seance('t', 'test', 10), seance('e', 'entrainement', 20)],
      [
        serie('t', 'test-detente', { valeur: 55 }), serie('t', 'test-detente', { valeur: 58 }),
        serie('t', 'squat-arriere', { chargeKg: 80, reps: 5 }), serie('t', 'squat-arriere', { chargeKg: 90, reps: 3 }),
        serie('t', 'tractions', { reps: 11 }),
        serie('e', 'squat-arriere', { chargeKg: 200, reps: 5 })
      ]
    );
    expect(r.get('test-detente')?.[0].valeur).toBe(58);
    expect(r.get('squat-arriere')?.[0].valeur).toBeCloseTo(99, 0);
    expect(r.get('squat-arriere')).toHaveLength(1);
    expect(r.get('tractions')?.[0].valeur).toBe(11);
  });
});
