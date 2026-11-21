// Séries d'échauffement automatiques avant une charge lourde (cahier des charges 5.7).
// Montée progressive : barre à vide (ou 30 %) × 8, 50 % × 5, 70 % × 3, 85 % × 1.

export interface SerieEchauffement {
  chargeKg: number;
  reps: number;
}

export function seriesEchauffement(chargeTravail: number, opts: { pas?: number; barre?: number; maxEstime?: number } = {}): SerieEchauffement[] {
  const pas = opts.pas ?? 2.5;
  const barre = opts.barre ?? 0;
  // Déclenchement : charge d'au moins 40 kg, ou d'au moins 60 % du maximum estimé connu.
  const lourde = chargeTravail >= 40 || (opts.maxEstime !== undefined && chargeTravail >= 0.6 * opts.maxEstime && chargeTravail >= 20);
  if (!lourde) return [];
  const arrondi = (x: number) => Math.round(x / pas) * pas;
  const paliers: SerieEchauffement[] = [
    { chargeKg: barre || arrondi(chargeTravail * 0.3), reps: 8 },
    { chargeKg: arrondi(chargeTravail * 0.5), reps: 5 },
    { chargeKg: arrondi(chargeTravail * 0.7), reps: 3 },
    { chargeKg: arrondi(chargeTravail * 0.85), reps: 1 }
  ];
  // On retire les paliers trop proches du suivant ou de la charge de travail (moins de 5 kg d'écart).
  const res: SerieEchauffement[] = [];
  for (const p of paliers) {
    if (p.chargeKg <= 0 || p.chargeKg >= chargeTravail - 4.9) continue;
    if (res.length && p.chargeKg - res[res.length - 1].chargeKg < 4.9) continue;
    if (barre && p.chargeKg < barre) continue;
    res.push(p);
  }
  return res;
}
