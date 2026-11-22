import { useState } from 'react';

// Courbe d'un seul indicateur (une série : pas de légende, le titre la nomme).
// Trait fin de 2 px, points de 8 px, axes discrets ; toucher un point affiche sa valeur et sa date.

export interface PointCourbe {
  date: number;
  valeur: number;
}

const JOURS_COURTS = (t: number) => new Date(t).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' });

/** « brut » : valeurs brutes affichées en petits points pâles derrière la courbe (pesées autour de la tendance). */
export function Courbe({ points, format, brut = [] }: { points: PointCourbe[]; format: (v: number) => string; brut?: PointCourbe[] }) {
  const [choisi, setChoisi] = useState<number | null>(points.length ? points.length - 1 : null);
  if (points.length === 0) return null;
  const L = 320;
  const H = 150;
  const marge = { g: 8, d: 8, h: 14, b: 22 };
  const vs = [...points, ...brut].map((p) => p.valeur);
  let min = Math.min(...vs);
  let max = Math.max(...vs);
  if (max - min < 1) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.15;
  min -= pad;
  max += pad;
  const t0 = points[0].date;
  const t1 = points[points.length - 1].date;
  const x = (t: number) => (points.length === 1 ? L / 2 : marge.g + ((t - t0) / (t1 - t0 || 1)) * (L - marge.g - marge.d));
  const y = (v: number) => marge.h + (1 - (v - min) / (max - min)) * (H - marge.h - marge.b);
  const chemin = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.valeur).toFixed(1)}`).join(' ');
  const p = choisi !== null ? points[choisi] : undefined;

  return (
    <div className="pile" style={{ gap: 6 }}>
      <div className="ligne ecartee" style={{ minHeight: 40 }} aria-live="polite">
        {p && (
          <>
            <span className="grand-chiffre" style={{ fontSize: 28 }}>{format(p.valeur)}</span>
            <span className="doux petit gras">{new Date(p.date).toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
          </>
        )}
      </div>
      <svg viewBox={`0 0 ${L} ${H}`} width="100%" role="img" aria-label={`Évolution sur ${points.length} séance${points.length > 1 ? 's' : ''}`} style={{ display: 'block', touchAction: 'pan-y' }}>
        {[min + pad, (min + max) / 2, max - pad].map((v, i) => (
          <line key={i} x1={marge.g} x2={L - marge.d} y1={y(v)} y2={y(v)} style={{ stroke: '#26262a', strokeWidth: 1 }} />
        ))}
        {p && <line x1={x(p.date)} x2={x(p.date)} y1={marge.h - 6} y2={H - marge.b} style={{ stroke: '#3a3a3c', strokeWidth: 1 }} />}
        {brut.map((b, i) => (
          <circle key={`b${i}`} cx={x(b.date)} cy={y(b.valeur)} r={2.5} style={{ fill: 'var(--doux)', opacity: 0.45 }} />
        ))}
        <path d={chemin} style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' }} />
        {points.map((pt, i) => (
          <g key={i} onClick={() => setChoisi(i)} style={{ cursor: 'pointer' }}>
            <circle cx={x(pt.date)} cy={y(pt.valeur)} r={16} style={{ fill: 'transparent' }} />
            <circle
              cx={x(pt.date)}
              cy={y(pt.valeur)}
              r={i === choisi ? 6 : 4}
              style={{ fill: i === choisi ? 'var(--accent)' : 'var(--carte)', stroke: 'var(--accent)', strokeWidth: 2 }}
            />
          </g>
        ))}
        <text x={marge.g} y={H - 6} style={{ fill: 'var(--doux)', fontSize: 11 }}>{JOURS_COURTS(t0)}</text>
        {points.length > 1 && (
          <text x={L - marge.d} y={H - 6} textAnchor="end" style={{ fill: 'var(--doux)', fontSize: 11 }}>{JOURS_COURTS(t1)}</text>
        )}
      </svg>
    </div>
  );
}
