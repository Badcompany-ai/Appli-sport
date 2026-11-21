// Règles de progression des charges (cahier des charges 5.5 et 5.6).

/** Formule d'Epley : maximum estimé sur une répétition. Valable de 1 à 10 répétitions. */
export function maxEstime(chargeKg: number, reps: number): number | undefined {
  if (reps < 1 || reps > 10 || chargeKg <= 0) return undefined;
  return reps === 1 ? chargeKg : chargeKg * (1 + reps / 30);
}

/** Charge pour un nombre de répétitions en gardant « reserve » répétitions en réserve (Epley inversée). */
export function chargePour(max: number, reps: number, reserve = 2): number {
  return max / (1 + (reps + reserve) / 30);
}

export function arrondirCharge(x: number, pas = 2.5): number {
  return Math.max(0, Math.round(x / pas) * pas);
}

export interface SerieFaite {
  chargeKg?: number;
  reps?: number;
}

/**
 * Double progression : tant que toutes les séries n'atteignent pas le haut de la fourchette,
 * on garde la charge (en visant plus de répétitions) ; dès qu'elles l'atteignent, la charge monte d'un palier.
 */
export function prochaineCharge(
  derniere: SerieFaite[] | undefined,
  repsMax: number,
  pasKg: number,
  maxConnu?: number,
  repsMin = repsMax,
  reserve = 2,
  ressenti?: 'facile' | 'correct' | 'dur'
): { chargeKg?: number; raison: string } {
  const avecCharge = derniere?.filter((s) => s.reps !== undefined) ?? [];
  // La dernière fois, une autre fourchette de répétitions (ex. 5 au lieu de 8 à 10) : on repart du maximum estimé.
  const autreFourchette =
    avecCharge.length > 0 &&
    (Math.max(...avecCharge.map((s) => s.reps ?? 0)) < repsMin - 1 || Math.min(...avecCharge.map((s) => s.reps ?? 0)) > repsMax + 3);
  if (avecCharge.length && !autreFourchette) {
    const charge = avecCharge[0].chargeKg ?? 0;
    const toutesAuMax = avecCharge.every((s) => (s.reps ?? 0) >= repsMax);
    const toutesAuMin = avecCharge.every((s) => (s.reps ?? 0) >= repsMin);
    // Ressenti (règle 7.2) : « trop facile » accélère, « trop dur » freine.
    if (ressenti === 'facile') return { chargeKg: charge + pasKg * (toutesAuMax ? 2 : 1), raison: `Jugé trop facile la dernière fois : + ${String(pasKg * (toutesAuMax ? 2 : 1)).replace('.', ',')} kg.` };
    if (ressenti === 'dur' && !toutesAuMin) {
      const baisse = Math.max(pasKg, Math.round((charge * 0.05) / pasKg) * pasKg);
      return { chargeKg: Math.max(0, charge - baisse), raison: `Jugé trop dur et répétitions manquées : − ${String(baisse).replace('.', ',')} kg.` };
    }
    if (ressenti === 'dur') return { chargeKg: charge, raison: 'Jugé trop dur la dernière fois : même charge.' };
    if (toutesAuMax) return { chargeKg: charge + pasKg, raison: `Toutes les séries à ${repsMax} répétitions la dernière fois : + ${String(pasKg).replace('.', ',')} kg.` };
    return { chargeKg: charge, raison: 'Même charge : viser plus de répétitions que la dernière fois.' };
  }
  if (maxConnu) {
    return {
      chargeKg: arrondirCharge(chargePour(maxConnu, repsMin, reserve), pasKg),
      raison: `Charge calculée à partir de votre maximum estimé, avec ${reserve} répétitions en réserve.`
    };
  }
  return { chargeKg: undefined, raison: 'Première fois : choisissez une charge confortable (il doit rester 2 à 3 répétitions en réserve).' };
}
