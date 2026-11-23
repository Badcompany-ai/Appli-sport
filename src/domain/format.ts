// Mise en forme à la française.

/** 62.5 → « 62,5 » ; 60 → « 60 ». */
export function kg(valeur: number): string {
  const arrondi = Math.round(valeur * 100) / 100;
  return String(arrondi).replace('.', ',');
}

/** 125 → « 2:05 ». */
export function minSec(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « Lundi 28 décembre ». */
export function dateLongue(t: number): string {
  const d = new Date(t);
  const j = JOURS[d.getDay()];
  return `${j.charAt(0).toUpperCase()}${j.slice(1)} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

/** « il y a 5 jours », « aujourd'hui », « hier ». */
export function ilYA(t: number, maintenant: number): string {
  const jour = (x: number) => {
    const d = new Date(x);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
  };
  const n = Math.round(jour(maintenant) - jour(t));
  if (n <= 0) return "aujourd'hui";
  if (n === 1) return 'hier';
  return `il y a ${n} jours`;
}

/** Nombre à la française, identique sur tous les appareils : 2650.4 → « 2 650 », (80.84, 1) → « 80,8 ». */
export function nombre(x: number, decimales = 0): string {
  const negatif = x < 0;
  const fixe = Math.abs(x).toFixed(decimales);
  const [entier, dec] = fixe.split('.');
  const groupe = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${negatif && Number(fixe) !== 0 ? '-' : ''}${groupe}${dec ? `,${dec}` : ''}`;
}
