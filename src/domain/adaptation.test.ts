import { describe, expect, it } from 'vitest';
import {
  ajusterAuTemps, alertesEquilibre, alleger, controlesRecuperation, dureeTotaleMin, eviterZones, lourdeBasDuCorps,
  raisonAllegement, seancesAFaire, sollicite, stagne, volumeParMuscle
} from './adaptation';
import { PROFIL_INTERVIEW } from './profil';
import { seancesDeLaSemaine } from './programme';
import { PRESETS } from './materiel';
import type { SeancePrevue } from './types';

const semaine = seancesDeLaSemaine(PROFIL_INTERVIEW, 4); // cycle 1, semaine normale
const [A, B, C, D] = semaine;
const ctx = { dispo: PRESETS.salle, poidsCorpsKg: 82 };
const series = (p: SeancePrevue) => p.exercices.reduce((n, e) => n + e.series, 0);

describe('temps disponible (7.1)', () => {
  it('ne touche à rien si la séance tient', () => {
    const r = ajusterAuTemps(B, 200);
    expect(r.plan).toBe(B);
    expect(r.ajustements).toEqual([]);
  });

  it('retire d’abord les compléments (priorité 3)', () => {
    const r = ajusterAuTemps(B, dureeTotaleMin(B) - 5);
    expect(dureeTotaleMin(r.plan)).toBeLessThanOrEqual(dureeTotaleMin(B) - 5);
    expect(r.ajustements.every((a) => a.retire && /complément/.test(a.raison))).toBe(true);
    expect(r.plan.exercices.filter((e) => e.priorite === 1).length).toBe(B.exercices.filter((e) => e.priorite === 1).length);
  });

  it('garde toujours le travail principal et l’échauffement, même avec 20 minutes', () => {
    const r = ajusterAuTemps(A, 20);
    expect(r.plan.exercices.every((e) => e.priorite === 1)).toBe(true);
    expect(r.plan.exercices.every((e) => e.series >= 2)).toBe(true);
    expect(r.plan.echauffement?.length).toBeGreaterThan(0);
    expect(r.plan.echauffementCourt).toBe(true);
  });

  it('un exercice raccourci puis retiré n’apparaît qu’une fois', () => {
    const r = ajusterAuTemps(A, 20);
    const noms = r.ajustements.map((a) => a.nom);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it('un groupe réduit à un exercice n’est plus enchaîné', () => {
    const r = ajusterAuTemps(C, 30);
    for (const e of r.plan.exercices) if (e.groupe) expect(r.plan.exercices.filter((x) => x.groupe === e.groupe).length).toBeGreaterThan(1);
  });
});

describe('alléger', () => {
  it('fatigue : 30 % de séries en moins, charges − 5 %, pas de sprint au maximum', () => {
    const p = { ...C, exercices: C.exercices.map((e) => (e.mesure === 'charge_reps' ? { ...e, chargeKg: 100 } : e)) };
    const r = alleger(p, 'fatigue');
    expect(series(r.plan)).toBeLessThan(series(p) * 0.8);
    expect(r.plan.exercices.find((e) => e.exerciceId === 'souleve-terre-roumain')?.chargeKg).toBe(95);
    expect(r.plan.exercices.find((e) => e.exerciceId === 'sprint-court')?.consigne).toMatch(/Pas d’effort maximal/);
  });

  it('sommeil court : un tiers de sauts en moins, charges inchangées', () => {
    const r = alleger(A, 'sommeil');
    const saut = (p: SeancePrevue) => p.exercices.find((e) => e.priorite === 1 && /saut/.test(e.exerciceId))!;
    expect(saut(r.plan).series).toBe(Math.round((saut(A).series * 2) / 3));
    expect(r.plan.exercices.find((e) => e.exerciceId === 'squat-arriere')).toEqual(A.exercices.find((e) => e.exerciceId === 'squat-arriere'));
  });

  it('semaine allégée : environ moitié moins de séries', () => {
    const r = alleger(D, 'semaine');
    expect(series(r.plan)).toBeLessThanOrEqual(Math.ceil(series(D) * 0.6));
    expect(series(r.plan)).toBeGreaterThanOrEqual(Math.floor(series(D) * 0.45));
  });

  it('fatigue sur une séance déjà allégée : charges − 5 % mais pas de séries en moins', () => {
    const p = alleger(D, 'semaine').plan;
    expect(series(alleger(p, 'fatigue', true).plan)).toBe(series(p));
  });

  it('les séances de test ne sont jamais allégées', () => {
    const test = seancesDeLaSemaine(PROFIL_INTERVIEW, 7).find((s) => s.programme?.type === 'test')!;
    expect(alleger(test, 'fatigue').plan).toBe(test);
  });
});

describe('douleur (7.5)', () => {
  it('genou : plus aucun exercice ne sollicite le genou, et des équivalents sont proposés', () => {
    const r = eviterZones(A, ['genou'], ctx);
    expect(r.plan.exercices.some((e) => sollicite(e, ['genou']))).toBe(false);
    expect(r.ajustements.length).toBeGreaterThan(0);
  });

  it('épaule : le haut du corps est retiré ou remplacé', () => {
    const r = eviterZones(B, ['epaule'], ctx);
    expect(r.plan.exercices.some((e) => sollicite(e, ['epaule']))).toBe(false);
  });

  it('« autre » ne retire rien', () => {
    expect(eviterZones(A, ['autre'], ctx).plan).toBe(A);
  });
});

describe('semaine allégée proposée (7.3)', () => {
  it('stagnation : aucune des 3 dernières valeurs ne dépasse celle d’avant', () => {
    expect(stagne([100, 100, 99, 100])).toBe(true);
    expect(stagne([100, 101, 99, 98])).toBe(false);
    expect(stagne([100, 99, 98])).toBe(false);
  });

  it('proposée après 3 « trop dur », 2 fatigues, ou 2 exercices principaux qui stagnent', () => {
    const base = { ressentisSemaine: [], fatiguesSemaine: 0, progressionPrincipaux: [] };
    expect(raisonAllegement(base)).toBeUndefined();
    expect(raisonAllegement({ ...base, ressentisSemaine: ['dur', 'dur', 'correct', 'dur'] })).toMatch(/3 exercices/);
    expect(raisonAllegement({ ...base, fatiguesSemaine: 2 })).toMatch(/Fatigue/);
    expect(raisonAllegement({ ...base, progressionPrincipaux: [[100, 100, 100, 100], [50, 49, 48, 50], [60, 61, 62, 63]] })).toMatch(/2 exercices principaux/);
    expect(raisonAllegement({ ...base, progressionPrincipaux: [[100, 100, 100, 100]] })).toBeUndefined();
  });
});

describe('séances manquées et déplacées (7.4)', () => {
  it('une séance manquée reste à faire', () => {
    const r = seancesAFaire(semaine, new Set(['B']), 5);
    expect(r.aFaire.map((s) => s.programme?.lettre)).toEqual(['A', 'C', 'D']);
  });

  it('s’il reste moins de jours que de séances, on garde les plus importantes', () => {
    const r = seancesAFaire(semaine, new Set(), 2);
    expect(r.aFaire.map((s) => s.programme?.lettre)).toEqual(['A', 'C']);
    expect(r.laissees.map((s) => s.programme?.lettre)).toEqual(['B', 'D']);
  });

  it('A et C sont lourdes pour le bas du corps, B et D non', () => {
    expect([A, B, C, D].map(lourdeBasDuCorps)).toEqual([true, false, true, false]);
  });

  it('alerte si moins de 48 h après une séance lourde du bas du corps', () => {
    const lundi = new Date(2027, 0, 4, 18).getTime();
    const mardi = new Date(2027, 0, 5, 18).getTime();
    const jeudi = new Date(2027, 0, 7, 18).getTime();
    expect(controlesRecuperation(C, [{ fin: lundi, plan: A }], mardi)[0]).toMatch(/48 h/);
    expect(controlesRecuperation(B, [{ fin: lundi, plan: A }], mardi)).toEqual([]);
    expect(controlesRecuperation(C, [{ fin: lundi, plan: A }], jeudi)).toEqual([]);
  });

  it('alerte au 4e jour d’affilée', () => {
    const j = (n: number) => new Date(2027, 0, 4 + n, 18).getTime();
    const h = [0, 1, 2].map((n) => ({ fin: j(n), plan: D }));
    expect(controlesRecuperation(B, h, j(3)).join()).toMatch(/4e jour/);
    expect(controlesRecuperation(B, h.slice(1), j(3))).toEqual([]);
  });
});

describe('équilibre musculaire (7.7)', () => {
  it('muscle principal = 1 série, secondaire = ½', () => {
    const v = volumeParMuscle([{ exerciceId: 'squat-arriere' }, { exerciceId: 'squat-arriere' }]);
    expect(v.quadriceps).toBe(2);
    expect(v.ischios).toBe(1);
    expect(v.pectoraux).toBe(0);
  });

  it('le cardio et la mobilité ne comptent pas', () => {
    const v = volumeParMuscle([{ exerciceId: 'velo-assault-intervalles' }, { exerciceId: 'mob-hanches-9090' }]);
    expect(Object.values(v).every((n) => n === 0)).toBe(true);
  });

  it('une semaine complète du programme ne déclenche pas d’alerte', () => {
    const toutes = semaine.flatMap((s) => s.exercices.flatMap((e) => Array.from({ length: e.series }, () => ({ exerciceId: e.exerciceId }))));
    const v = volumeParMuscle(toutes);
    expect(alertesEquilibre(v, v, PRESETS.salle).map((a) => a.muscle)).toEqual([]);
  });

  it('un groupe négligé est signalé, avec un exercice disponible en suggestion', () => {
    const v = volumeParMuscle([{ exerciceId: 'developpe-couche' }]);
    const a = alertesEquilibre(v, v, PRESETS.salle).find((x) => x.muscle === 'ischios')!;
    expect(a.texte).toMatch(/Ischio-jambiers : 0 série/);
    expect(a.suggestion?.primaires[0]).toBe('ischios');
  });
});
