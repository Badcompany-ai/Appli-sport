// Minuteur de repos : basé sur une heure de fin, pour rester juste même si
// l'application est mise en pause ou fermée puis rouverte.

export interface EtatRepos {
  restantSec: number;
  progression: number; // 0 au début, 1 à la fin
  termine: boolean;
}

export function etatRepos(fin: number, totalSec: number, maintenant: number): EtatRepos {
  const restantMs = Math.max(0, fin - maintenant);
  const restantSec = Math.ceil(restantMs / 1000);
  const total = Math.max(1, totalSec);
  return {
    restantSec,
    progression: Math.min(1, Math.max(0, 1 - restantMs / (total * 1000))),
    termine: restantMs <= 0
  };
}

/** Ajoute du temps au repos en cours (bouton « +30 s »). */
export function prolonger(fin: number, totalSec: number, ajoutSec: number, maintenant: number) {
  const base = Math.max(fin, maintenant);
  const nouvelleFin = base + ajoutSec * 1000;
  const restant = (nouvelleFin - maintenant) / 1000;
  return { fin: nouvelleFin, totalSec: Math.max(totalSec, Math.ceil(restant)) };
}

/**
 * Adresse qui lance le raccourci « Repos » de l'app Raccourcis avec la durée en secondes.
 * Le raccourci attend cette durée puis affiche une notification (sans couper la musique).
 */
export function lienRaccourci(nom: string, dureeSec: number): string {
  return `shortcuts://run-shortcut?name=${encodeURIComponent(nom)}&input=text&text=${Math.round(dureeSec)}`;
}
