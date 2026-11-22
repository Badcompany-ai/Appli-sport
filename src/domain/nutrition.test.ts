import { describe, expect, it } from 'vitest';
import { courbeTendance, peseeConseillee, rythme, tailleDue, tendance, tendanceA, type Mesure } from './corps';
import { ACTIVITES, kcalNettes, kcalSeance } from './depense';
import { ecartJournalier, metabolismeBase, NUTRITION_DEFAUT, objectifsDuJour } from './nutrition';
import { additionner, alimentOFF, alimentSuisse, pourQuantite, rechercher, type LigneSuisse } from './aliments';
import { PROFIL_INTERVIEW } from './profil';
import type { Seance } from './types';
import lignes from '../data/aliments-suisses.json';

const J = 86400000;
const t0 = new Date(2027, 0, 1, 8).getTime();
const pesee = (jour: number, kg: number): Mesure => ({ id: String(jour), type: 'poids', valeur: kg, date: t0 + jour * J });

describe('poids et tendance (8)', () => {
  it('la tendance pondère davantage les pesées récentes', () => {
    const p = [pesee(0, 82), pesee(6, 80)];
    const t = tendanceA(p, t0 + 6 * J)!;
    expect(t).toBeLessThan(81);
    expect(t).toBeGreaterThan(80);
  });

  it('une pesée de plus de 7 jours ne compte plus dans la tendance', () => {
    expect(tendanceA([pesee(0, 90), pesee(8, 80)], t0 + 8 * J)).toBe(80);
    expect(tendance([pesee(0, 90)], t0 + 30 * J)).toBe(90);
  });

  it('rythme réel : pente de la tendance en kg et en % par semaine', () => {
    const p = Array.from({ length: 8 }, (_, i) => pesee(i * 3, 82 - i * 3 * (0.2 / 7)));
    const r = rythme(p, t0 + 21 * J)!;
    expect(r.kgSemaine).toBeCloseTo(-0.2, 1);
    expect(r.pctSemaine).toBeCloseTo(-0.25, 1);
  });

  it('pas de rythme avec moins de 4 pesées ou moins de 14 jours', () => {
    expect(rythme([pesee(0, 82), pesee(7, 82), pesee(14, 82)], t0 + 14 * J)).toBeUndefined();
    expect(rythme([pesee(0, 82), pesee(3, 82), pesee(6, 82), pesee(9, 82)], t0 + 9 * J)).toBeUndefined();
  });

  it('courbe de tendance : un point par pesée', () => {
    expect(courbeTendance([pesee(1, 82), pesee(0, 83)]).map((p) => p.date)).toEqual([t0, t0 + J]);
  });

  it('pesée conseillée tous les 2 jours, tour de taille toutes les 4 semaines', () => {
    expect(peseeConseillee([pesee(0, 82)], t0 + J)).toBe(false);
    expect(peseeConseillee([pesee(0, 82)], t0 + 2 * J)).toBe(true);
    expect(tailleDue([], t0)).toBe(true);
    expect(tailleDue([{ ...pesee(0, 85), type: 'taille' }], t0 + 20 * J)).toBe(false);
  });
});

describe('dépense du sport (Compendium 2024)', () => {
  it('dépense nette = (MET − 1) × poids × durée', () => {
    expect(kcalNettes(8, 82, 60)).toBeCloseTo(574);
    expect(kcalNettes(1, 82, 60)).toBe(0);
  });

  it('basket 1 h et padel 2 h', () => {
    const basket = ACTIVITES.find((a) => a.id === 'basket-match')!;
    const padel = ACTIVITES.find((a) => a.id === 'padel')!;
    expect(Math.round(kcalNettes(basket.met, 82, 60))).toBe(574);
    expect(Math.round(kcalNettes(padel.met, 82, 120))).toBe(820);
    expect(padel.note).toMatch(/tennis en double/);
  });

  const seance = (minutes: number, extra: Partial<Seance> = {}): Seance => ({
    id: 's', planId: 'p', nom: 'Séance', plan: { id: 'p', nom: 'Séance', exercices: [] }, statut: 'terminee',
    debut: t0, fin: t0 + minutes * 60000, exerciceIndex: 0, notes: {}, ...extra
  });

  it('séance de musculation d’une heure : environ 330 kcal pour 82 kg', () => {
    expect(Math.round(kcalSeance(seance(60), [], 82))).toBe(328);
  });

  it('le temps de fractionné compte plus que le reste de la séance', () => {
    const sans = kcalSeance(seance(60), [], 82);
    const avec = kcalSeance(seance(60), Array.from({ length: 6 }, () => ({ exerciceId: 'velo-assault-intervalles', dureeSec: 30 })), 82);
    expect(avec - sans).toBeCloseTo((8.8 - 5) * 82 * (180 / 3600));
  });

  it('une activité utilise son propre MET, une séance oubliée ouverte est plafonnée à 2 h 30', () => {
    expect(Math.round(kcalSeance(seance(120, { activite: { id: 'padel', met: 6 } }), [], 82))).toBe(820);
    expect(kcalSeance(seance(600), [], 82)).toBe(kcalSeance(seance(150), [], 82));
  });
});

describe('besoins et objectifs (9)', () => {
  it('métabolisme de base de l’interview : 1 875 kcal', () => {
    expect(metabolismeBase(PROFIL_INTERVIEW, 82)).toBe(1875);
  });

  it('sèche lente : environ − 225 kcal par jour', () => {
    expect(Math.round(ecartJournalier({ mode: 'seche', rythme: 'lent' }, 82))).toBe(-226);
    expect(ecartJournalier({ mode: 'maintien', rythme: 'lent' }, 82)).toBe(0);
  });

  it('jour sans sport puis jour avec 1 h de séance', () => {
    const repos = objectifsDuJour(PROFIL_INTERVIEW, 82, NUTRITION_DEFAUT, 0);
    expect(repos.base).toBe(2625);
    expect(Math.abs(repos.kcal - 2400)).toBeLessThanOrEqual(1);
    const seance = objectifsDuJour(PROFIL_INTERVIEW, 82, NUTRITION_DEFAUT, 328);
    expect(Math.abs(seance.kcal - 2728)).toBeLessThanOrEqual(1);
    expect(seance.typeKcal).toBe('plafond');
  });

  it('protéines 2 g/kg en sèche, lipides ≥ 25 %, fibres 30 g, glucides = le reste', () => {
    const o = objectifsDuJour(PROFIL_INTERVIEW, 82, NUTRITION_DEFAUT, 328);
    expect(o.proteines).toBe(164);
    expect(o.lipides).toBe(Math.round((0.25 * o.kcal) / 9));
    expect(o.fibres).toBe(30);
    expect(Math.abs(o.proteines * 4 + o.lipides * 9 + o.glucides * 4 - o.kcal)).toBeLessThan(10);
  });

  it('plancher : jamais sous le métabolisme de base ni sous 1 500 kcal', () => {
    const o = objectifsDuJour(PROFIL_INTERVIEW, 82, { ...NUTRITION_DEFAUT, correctionKcal: -2000 }, 0);
    expect(o.kcal).toBe(1875);
    expect(o.plancher).toBe(true);
  });
});

describe('aliments', () => {
  const base = (lignes as unknown as LigneSuisse[]).map(alimentSuisse);

  it('la base suisse est complète et cohérente', () => {
    expect(base.length).toBeGreaterThan(1200);
    for (const a of base) {
      expect(a.pour100.kcal).toBeGreaterThanOrEqual(0);
      expect(a.pour100.kcal).toBeLessThan(950);
    }
  });

  it('recherche sans accents, les noms qui commencent par le terme d’abord', () => {
    const r = rechercher(base, 'oeuf entier');
    expect(r[0].nom).toMatch(/^Oeuf de poule, entier/);
    expect(r[0].portions[0]).toEqual({ nom: '1 œuf', g: 55 });
    expect(rechercher(base, 'mozzarella')[0].nom).toBe('Mozzarella');
    expect(rechercher(base, 'pizza jambon').length).toBeGreaterThan(0);
  });

  it('quantités et totaux', () => {
    const n = pourQuantite({ kcal: 200, proteines: 10, lipides: 5, glucides: 20, fibres: 2 }, 150);
    expect(n.kcal).toBe(300);
    expect(additionner([n, n]).proteines).toBe(30);
  });

  it('Open Food Facts : produit lu, portions reprises', () => {
    const a = alimentOFF({ product_name: 'Skyr nature', brands: 'M-Budget, Migros', quantity: '450 g', serving_quantity: 150, nutriments: { 'energy-kcal_100g': 63, proteins_100g: 11, fat_100g: 0.2, carbohydrates_100g: 4 } }, '7610000000000')!;
    expect(a.nom).toBe('Skyr nature');
    expect(a.marque).toBe('M-Budget');
    expect(a.portions.map((p) => p.g)).toEqual([150, 450]);
  });

  it('Open Food Facts : des kJ saisis comme kcal sont corrigés, un produit sans protéines est refusé', () => {
    const a = alimentOFF({ product_name: 'Chocolat', nutriments: { 'energy-kcal_100g': 2300, 'energy-kj_100g': 2300, proteins_100g: 7 } }, '1')!;
    expect(a.pour100.kcal).toBe(550);
    expect(alimentOFF({ product_name: 'X', nutriments: { 'energy-kcal_100g': 100 } }, '2')).toBeUndefined();
  });
});
