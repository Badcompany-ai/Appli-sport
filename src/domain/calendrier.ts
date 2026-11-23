// Rappels au Calendrier de l'iPhone (cahier des charges, partie 2) : un fichier .ics, sans serveur.
// Événements répétés (règle RRULE), heure locale de l'appareil, alarme intégrée.

import { joursDeSeance, type Profil } from './profil';

export interface ReglageRappels {
  seances: boolean;
  heureSeance: string; // « 18:00 »
  pesees: boolean;
  taille: boolean;
  sauvegarde: boolean;
}

export const RAPPELS_DEFAUT: ReglageRappels = { seances: true, heureSeance: '18:00', pesees: true, taille: true, sauvegarde: true };

const JOURS_ICS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export interface Evenement {
  uid: string;
  titre: string;
  description: string;
  debut: Date;
  dureeMin: number;
  /** Jours de la semaine (0 = lundi) et intervalle en semaines. */
  repetition?: { jours: number[]; intervalle?: number; jusqua?: Date };
  alarmeMinAvant: number;
}

const p2 = (n: number) => String(n).padStart(2, '0');
const dateLocale = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`;

function echapper(t: string): string {
  return t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Coupe les lignes à 75 octets environ, comme le demande la norme iCalendar (RFC 5545). */
function plier(ligne: string): string {
  const morceaux: string[] = [];
  let reste = ligne;
  while (reste.length > 70) {
    morceaux.push(reste.slice(0, 70));
    reste = ' ' + reste.slice(70);
  }
  morceaux.push(reste);
  return morceaux.join('\r\n');
}

export function genererICS(evenements: Evenement[], maintenant: Date): string {
  const l: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Appli sport//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Sport'];
  const stamp = `${maintenant.getUTCFullYear()}${p2(maintenant.getUTCMonth() + 1)}${p2(maintenant.getUTCDate())}T${p2(maintenant.getUTCHours())}${p2(maintenant.getUTCMinutes())}00Z`;
  for (const e of evenements) {
    const fin = new Date(e.debut.getTime() + e.dureeMin * 60000);
    l.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stamp}`, `DTSTART:${dateLocale(e.debut)}`, `DTEND:${dateLocale(fin)}`, `SUMMARY:${echapper(e.titre)}`, `DESCRIPTION:${echapper(e.description)}`);
    if (e.repetition) {
      const r = [`FREQ=WEEKLY`, `BYDAY=${e.repetition.jours.map((j) => JOURS_ICS[j]).join(',')}`];
      if (e.repetition.intervalle && e.repetition.intervalle > 1) r.push(`INTERVAL=${e.repetition.intervalle}`);
      if (e.repetition.jusqua) r.push(`UNTIL=${dateLocale(e.repetition.jusqua)}`);
      l.push(`RRULE:${r.join(';')}`);
    }
    l.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${echapper(e.titre)}`, `TRIGGER:-PT${e.alarmeMinAvant}M`, 'END:VALARM', 'END:VEVENT');
  }
  l.push('END:VCALENDAR');
  return l.map(plier).join('\r\n') + '\r\n';
}

/** Prochaine date (à partir d'aujourd'hui) tombant sur l'un des jours donnés, à l'heure donnée. */
function prochainJour(depuis: Date, jours: number[], heure: number, minute: number): Date {
  for (let i = 0; i < 8; i++) {
    const d = new Date(depuis.getFullYear(), depuis.getMonth(), depuis.getDate() + i, heure, minute);
    if (jours.includes((d.getDay() + 6) % 7)) return d;
  }
  return depuis;
}

export function evenementsRappels(profil: Profil, r: ReglageRappels, maintenant: Date): Evenement[] {
  const [a, m, j] = profil.echeance.split('-').map(Number);
  const fin = new Date(a, m - 1, j, 23, 59);
  const [debutA, debutM, debutJ] = profil.debut.split('-').map(Number);
  const debutProgramme = new Date(debutA, debutM - 1, debutJ);
  const depart = debutProgramme > maintenant ? debutProgramme : maintenant;
  const ev: Evenement[] = [];
  if (r.seances) {
    const [h, mn] = r.heureSeance.split(':').map(Number);
    const jours = joursDeSeance(profil);
    ev.push({
      uid: 'seances@appli-sport',
      titre: 'Séance de sport',
      description: 'Ouvrez l’application : la séance du jour est prête (Aujourd’hui → Commencer).',
      debut: prochainJour(depart, jours, h, mn),
      dureeMin: profil.dureeMin,
      repetition: { jours, jusqua: fin },
      alarmeMinAvant: 30
    });
  }
  if (r.pesees) {
    ev.push({
      uid: 'pesees@appli-sport',
      titre: 'Pesée (5 secondes)',
      description: 'Le matin, après les toilettes, avant de manger : Aujourd’hui → Peser.',
      debut: prochainJour(maintenant, [0, 3, 5], 7, 30),
      dureeMin: 5,
      repetition: { jours: [0, 3, 5] },
      alarmeMinAvant: 0
    });
  }
  if (r.taille) {
    ev.push({
      uid: 'taille@appli-sport',
      titre: 'Tour de taille',
      description: 'Au niveau du nombril, debout et détendu, le matin : Progrès → Corps → Mesurer. Facultatif.',
      debut: prochainJour(maintenant, [6], 8, 0),
      dureeMin: 5,
      repetition: { jours: [6], intervalle: 4 },
      alarmeMinAvant: 0
    });
  }
  if (r.sauvegarde) {
    ev.push({
      uid: 'sauvegarde@appli-sport',
      titre: 'Sauvegarde de l’application sport',
      description: 'Profil → Exporter une sauvegarde, puis l’envoyer sur le Mac (AirDrop ou iCloud Drive).',
      debut: prochainJour(maintenant, [6], 20, 0),
      dureeMin: 5,
      repetition: { jours: [6] },
      alarmeMinAvant: 0
    });
  }
  return ev;
}
