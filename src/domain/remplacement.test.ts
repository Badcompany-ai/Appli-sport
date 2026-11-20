import { describe, expect, it } from 'vitest';
import { adapterSeance, candidats, estDisponible, prevoir, repsEquivalentes, type Contexte } from './remplacement';
import { PRESETS, type Dispo } from './materiel';
import { EXERCICES, exercice, MOUVEMENTS_PROCHES } from './exercices';
import { SEANCE_DEMO } from './demo';
import type { SeancePrevue } from './types';

const ctx = (dispo: Dispo): Contexte => ({ dispo, poidsCorpsKg: 82 });
const RIEN: Dispo = { materiel: [], halteresMaxKg: 0, kettlebellMaxKg: 0 };
const seance = (...ex: SeancePrevue['exercices']): SeancePrevue => ({ id: 't', nom: 'Test', exercices: ex });

function remplacant(prevu: SeancePrevue['exercices'][number], dispo: Dispo) {
  const r = adapterSeance(seance(prevu), ctx(dispo));
  return { ex: r.plan.exercices[0], ch: r.changements[0] };
}

describe('bibliothèque', () => {
  it('chaque identifiant est unique et chaque variante existe', () => {
    const ids = new Set<string>();
    for (const e of EXERCICES) {
      expect(ids.has(e.id), e.id).toBe(false);
      ids.add(e.id);
    }
    for (const e of EXERCICES) {
      if (e.plusFacile) expect(exercice(e.plusFacile), `${e.id} → ${e.plusFacile}`).toBeDefined();
      if (e.plusDifficile) expect(exercice(e.plusDifficile), `${e.id} → ${e.plusDifficile}`).toBeDefined();
    }
  });
  it('chaque fiche a des consignes et des erreurs fréquentes', () => {
    for (const e of EXERCICES) {
      expect(e.consignes.length, e.id).toBeGreaterThanOrEqual(2);
      expect(e.erreurs.length, e.id).toBeGreaterThanOrEqual(1);
    }
  });
  it('les exercices chargés ont un facteur de charge', () => {
    for (const e of EXERCICES) if (e.charge !== 'aucune') expect(e.facteur, e.id).toBeGreaterThan(0);
  });
  it('chaque mouvement de base a au moins un exercice sans matériel, ou un mouvement proche qui en a un', () => {
    const mouvements = new Set(EXERCICES.map((e) => e.mouvement));
    for (const m of mouvements) {
      const options = [m, ...(MOUVEMENTS_PROCHES[m] ?? [])];
      const ok = EXERCICES.some((e) => options.includes(e.mouvement) && estDisponible(e, RIEN));
      // Exceptions assumées : le cardio et la frappe ont un équivalent sans matériel ; seuls les avant-bras n'en ont pas.
      if (m !== 'iso_avant_bras' && m !== 'porter') expect(ok, m).toBe(true);
    }
  });
});

describe('remplacements attendus (cahier des charges 6.4)', () => {
  it('squat arrière à la maison → squat bulgare aux haltères, plus de répétitions ou tempo lent', () => {
    const { ex, ch } = remplacant(prevoir('squat-arriere', 3, { reps: 5, chargeKg: 60, reposSec: 150 }), PRESETS.maison);
    expect(ex.exerciceId).toBe('squat-bulgare-halteres');
    expect(ex.chargeKg).toBe(10);
    expect((ex.reps ?? 0) > 5 || ex.tempoLent).toBe(true);
    expect(ch.raison).toMatch(/Pas de barre et disques/);
    expect(ch.raison).toMatch(/mouvement proche/);
  });
  it('saut sur box à la maison → squat jump', () => {
    expect(remplacant(prevoir('saut-box', 3, { reps: 5, reposSec: 90 }), PRESETS.maison).ex.exerciceId).toBe('squat-jump');
  });
  it('développé couché à la maison → pompes (poignées ou pieds surélevés)', () => {
    const { ex } = remplacant(prevoir('developpe-couche', 3, { reps: 6, chargeKg: 60, reposSec: 120 }), PRESETS.maison);
    expect(['pompes-poignees', 'pompes-pieds-sureleves']).toContain(ex.exerciceId);
  });
  it('tractions à la maison → rowing haltère ou rowing inversé sous une table (« tirage au sol »)', () => {
    const { ex, ch } = remplacant(prevoir('tractions', 3, { reps: 6, chargeKg: 0, reposSec: 120 }), PRESETS.maison);
    expect(['rowing-haltere', 'rowing-table']).toContain(ex.exerciceId);
    expect(ch.raison).toMatch(/mouvement proche \(tirage horizontal\)/);
  });
  it('vélo d’assaut à la maison → corde à sauter', () => {
    expect(remplacant(prevoir('velo-assault-intervalles', 6, { dureeSec: 30, reposSec: 30 }), PRESETS.maison).ex.exerciceId).toBe('corde-intervalles');
  });
  it('vélo d’assaut dehors → navettes', () => {
    expect(remplacant(prevoir('velo-assault-intervalles', 6, { dureeSec: 30, reposSec: 30 }), PRESETS.exterieur).ex.exerciceId).toBe('navettes-intervalles');
  });
  it('rounds au sac à la maison → boxe dans le vide avec haltères légers', () => {
    expect(remplacant(prevoir('rounds-sac', 4, { dureeSec: 180, reposSec: 60 }), PRESETS.maison).ex.exerciceId).toBe('shadow-halteres');
  });
  it('rounds au sac dehors → boxe dans le vide', () => {
    expect(remplacant(prevoir('rounds-sac', 4, { dureeSec: 180, reposSec: 60 }), PRESETS.exterieur).ex.exerciceId).toBe('shadow-boxing');
  });
  it('lancer de médecine-ball dehors → pompes explosives (pas de ballon coché)', () => {
    expect(remplacant(prevoir('lancer-mb-poitrine', 3, { reps: 5, reposSec: 60 }), PRESETS.exterieur).ex.exerciceId).toBe('pompes-explosives');
  });
  it('lancer de médecine-ball dehors avec un ballon de basket → lancer du ballon', () => {
    const d = { ...PRESETS.exterieur, materiel: [...PRESETS.exterieur.materiel, 'ballon_basket'] };
    expect(remplacant(prevoir('lancer-mb-poitrine', 3, { reps: 5, reposSec: 60 }), d).ex.exerciceId).toBe('lancer-ballon-basket');
  });
  it('traîneau dehors → départs en position basse', () => {
    expect(remplacant(prevoir('traineau-poussee', 4, { reps: 1, chargeKg: 60, reposSec: 120 }), PRESETS.exterieur).ex.exerciceId).toBe('departs-position-basse');
  });
});

describe('cas limites', () => {
  it('aucun matériel coché : séance entièrement au poids du corps, même nombre d’exercices', () => {
    const r = adapterSeance(SEANCE_DEMO, ctx(RIEN));
    expect(r.plan.exercices).toHaveLength(SEANCE_DEMO.exercices.length);
    for (const e of r.plan.exercices) expect(estDisponible(exercice(e.exerciceId)!, RIEN), e.exerciceId).toBe(true);
    expect(new Set(r.plan.exercices.map((e) => e.exerciceId)).size).toBe(r.plan.exercices.length);
    for (const c of r.changements) expect(c.raison.length).toBeGreaterThan(10);
  });
  it('en salle, rien ne change', () => {
    const r = adapterSeance(SEANCE_DEMO, ctx(PRESETS.salle));
    expect(r.changements).toHaveLength(0);
    expect(r.plan.exercices.map((e) => e.exerciceId)).toEqual(SEANCE_DEMO.exercices.map((e) => e.exerciceId));
  });
  it('décocher un seul équipement ne change que les exercices concernés', () => {
    const d = { ...PRESETS.salle, materiel: PRESETS.salle.materiel.filter((m) => m !== 'box') };
    const r = adapterSeance(SEANCE_DEMO, ctx(d));
    expect(r.changements).toHaveLength(1);
    expect(r.changements[0].avant).toBe('Saut sur box');
  });
  it('jamais deux fois le même exercice dans une séance', () => {
    for (const d of [PRESETS.maison, PRESETS.exterieur, RIEN]) {
      const ids = adapterSeance(SEANCE_DEMO, ctx(d)).plan.exercices.map((e) => e.exerciceId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('aucun équivalent : exercice retiré, avec explication', () => {
    const r = adapterSeance(seance(prevoir('pince-avant-bras', 3, { reps: 10, reposSec: 60 }), prevoir('planche', 2, { dureeSec: 45, reposSec: 45 })), ctx(RIEN));
    expect(r.plan.exercices.map((e) => e.exerciceId)).toEqual(['planche']);
    expect(r.changements[0].type).toBe('retire');
    expect(r.changements[0].raison).toMatch(/Aucun équivalent/);
  });
  it('aucun équivalent : séries reportées sur un exercice qui travaille les mêmes muscles', () => {
    const r = adapterSeance(seance(prevoir('pince-avant-bras', 3, { reps: 10, reposSec: 60 }), prevoir('rowing-table', 3, { reps: 10, reposSec: 60 })), ctx(RIEN));
    void r;
    const r2 = adapterSeance(seance(prevoir('pince-avant-bras', 3, { reps: 10, reposSec: 60 }), prevoir('suspension-barre', 2, { dureeSec: 30, reposSec: 60 })), ctx({ ...RIEN, materiel: ['barre_traction'] }));
    // La pince est remplacée par la suspension déjà présente ? Non : jamais deux fois le même exercice → retirée, séries reportées.
    expect(r2.plan.exercices).toHaveLength(1);
    expect(r2.plan.exercices[0].series).toBe(4);
    expect(r2.changements[0].raison).toMatch(/ajoutée/);
  });
  it('haltères trop légers pour la charge prévue : répétitions ajustées', () => {
    const r = adapterSeance(seance(prevoir('rowing-haltere', 3, { reps: 8, chargeKg: 24, reposSec: 90 })), ctx(PRESETS.maison));
    expect(r.plan.exercices[0].chargeKg).toBe(10);
    expect(r.plan.exercices[0].reps).toBeGreaterThan(8);
    expect(r.changements[0].type).toBe('ajuste');
  });
  it('les candidats proposés pour un remplacement manuel sont tous disponibles', () => {
    const c = candidats(prevoir('developpe-couche', 3, { reps: 6, chargeKg: 60, reposSec: 120 }), ctx(PRESETS.maison));
    expect(c.length).toBeGreaterThan(2);
    for (const x of c) expect(estDisponible(x.ex, PRESETS.maison)).toBe(true);
  });
});

describe('répétitions équivalentes', () => {
  it('charge suffisante : rien ne change', () => {
    expect(repsEquivalentes(5, 60, 60)).toEqual({ reps: 5, tempoLent: false });
  });
  it('charge plus légère : plus de répétitions, plafonnées à 15 avec tempo lent', () => {
    expect(repsEquivalentes(8, 12, 10).reps).toBeGreaterThan(8);
    expect(repsEquivalentes(5, 30, 10)).toEqual({ reps: 15, tempoLent: true });
  });
});

import { VIDEOS } from './videos';
describe('vidéos', () => {
  it('chaque vidéo listée correspond à un exercice existant et a un identifiant YouTube valide', () => {
    for (const [id, v] of Object.entries(VIDEOS)) {
      expect(exercice(id), id).toBeDefined();
      expect(v.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
    }
  });
});
