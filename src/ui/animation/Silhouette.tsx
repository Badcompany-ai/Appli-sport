import { useEffect, useRef, useState } from 'react';

// Animation d'exercice dessinée dans l'application : une silhouette vue de profil,
// définie par quelques positions clés (angles des segments), interpolées en boucle.
// Angles en degrés : 0 = segment vers le bas, 90 = vers l'avant (droite), 180 = vers le haut.

export interface Pose {
  /** Point d'ancrage fixé au sol ou à l'agrès, en coordonnées de la scène. */
  ancre: { point: 'cheville' | 'poignet' | 'hanche'; x: number; y: number };
  tronc: number; // de la hanche vers l'épaule
  cuisse: number; // de la hanche vers le genou
  tibia: number; // du genou vers la cheville
  bras: number; // de l'épaule vers le coude
  avantBras: number; // du coude vers le poignet
  pied?: number; // de la cheville vers les orteils (défaut : 90)
  tete?: number; // inclinaison de la tête par rapport au tronc
}

export type Accessoire =
  | { type: 'barre-dos' }
  | { type: 'barre-mains' }
  | { type: 'halteres' }
  | { type: 'barre-fixe'; x: number; y: number }
  | { type: 'banc'; x: number; y: number; l: number; h: number }
  | { type: 'box'; x: number; y: number; l: number; h: number };

export interface Animation {
  /** Cadre de la scène : [x, y, largeur, hauteur] (défaut : sol en bas). */
  cadre?: [number, number, number, number];
  sol?: boolean;
  poses: Pose[];
  /** Durée d'un aller-retour complet, en secondes. */
  duree: number;
  accessoires?: Accessoire[];
}

const L = { tronc: 52, cou: 8, tete: 10, bras: 29, avantBras: 27, cuisse: 44, tibia: 42, pied: 15 };

const rad = (d: number) => (d * Math.PI) / 180;
/** Vecteur d'un segment : 0° = vers le bas, 90° = vers la droite. */
const v = (angle: number, l: number) => ({ x: Math.sin(rad(angle)) * l, y: Math.cos(rad(angle)) * l });

function articulations(p: Pose) {
  // Calcul depuis la hanche placée en (0, 0) (y vers le bas), puis translation sur l'ancre.
  const hanche = { x: 0, y: 0 };
  const add = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: a.x + b.x, y: a.y + b.y });
  const epaule = add(hanche, v(p.tronc, L.tronc));
  const cou = add(epaule, v(p.tronc + (p.tete ?? 0), L.cou));
  const tete = add(cou, v(p.tronc + (p.tete ?? 0), L.tete));
  const coude = add(epaule, v(p.bras, L.bras));
  const poignet = add(coude, v(p.avantBras, L.avantBras));
  const genou = add(hanche, v(p.cuisse, L.cuisse));
  const cheville = add(genou, v(p.tibia, L.tibia));
  const orteils = add(cheville, v(p.pied ?? 90, L.pied));
  const pts = { hanche, epaule, cou, tete, coude, poignet, genou, cheville, orteils };
  const ref = pts[p.ancre.point];
  const dx = p.ancre.x - ref.x;
  const dy = p.ancre.y - ref.y;
  const res = {} as typeof pts;
  for (const [k, val] of Object.entries(pts)) res[k as keyof typeof pts] = { x: val.x + dx, y: val.y + dy };
  return res;
}

function interpoler(a: Pose, b: Pose, t: number): Pose {
  const m = (x: number, y: number) => x + (y - x) * t;
  return {
    ancre: { point: a.ancre.point, x: m(a.ancre.x, b.ancre.x), y: m(a.ancre.y, b.ancre.y) },
    tronc: m(a.tronc, b.tronc),
    cuisse: m(a.cuisse, b.cuisse),
    tibia: m(a.tibia, b.tibia),
    bras: m(a.bras, b.bras),
    avantBras: m(a.avantBras, b.avantBras),
    pied: m(a.pied ?? 90, b.pied ?? 90),
    tete: m(a.tete ?? 0, b.tete ?? 0)
  };
}

/** Position dans le cycle (0 à 1) → pose, avec un aller-retour doux entre les positions clés. */
export function poseA(anim: Animation, phase: number): Pose {
  const n = anim.poses.length;
  if (n === 1) return anim.poses[0];
  // Aller : 0 → n-1, retour : n-1 → 0 ; pauses courtes aux extrémités.
  const aller = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  const tenu = Math.min(1, Math.max(0, (aller - 0.08) / 0.84));
  const doux = tenu < 0.5 ? 2 * tenu * tenu : 1 - Math.pow(-2 * tenu + 2, 2) / 2;
  const pos = doux * (n - 1);
  const i = Math.min(n - 2, Math.floor(pos));
  return interpoler(anim.poses[i], anim.poses[i + 1], pos - i);
}

export function Silhouette({ anim, phaseFixe, taille = 300 }: { anim: Animation; phaseFixe?: number; taille?: number }) {
  const [phase, setPhase] = useState(phaseFixe ?? 0);
  const debut = useRef(performance.now());
  useEffect(() => {
    if (phaseFixe !== undefined) return;
    let id = 0;
    const boucle = (t: number) => {
      setPhase((((t - debut.current) / 1000) % anim.duree) / anim.duree);
      id = requestAnimationFrame(boucle);
    };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
  }, [anim, phaseFixe]);

  const p = articulations(poseA(anim, phaseFixe ?? phase));
  const trait = { stroke: 'var(--texte)', strokeWidth: 9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const loin = { ...trait, stroke: '#5c5c62' };
  const ligne = (a: { x: number; y: number }, b: { x: number; y: number }, s = trait) => <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={s} />;

  return (
    <svg viewBox={(anim.cadre ?? [-110, -170, 220, 180]).join(' ')} width="100%" style={{ maxWidth: taille, display: 'block', margin: '0 auto' }} role="img" aria-label="Animation de l’exercice">
      {anim.sol !== false && <line x1={-200} y1={0} x2={200} y2={0} style={{ stroke: '#3a3a3c', strokeWidth: 2 }} />}
      {anim.accessoires?.map((a, i) =>
        a.type === 'barre-dos' ? (
          <g key={'d' + i}>
            <circle cx={p.epaule.x - 6} cy={p.epaule.y + 3} r={13} style={{ fill: 'var(--accent)' }} />
            <circle cx={p.epaule.x - 6} cy={p.epaule.y + 3} r={3} style={{ fill: '#000' }} />
          </g>
        ) : null
      )}
      {anim.accessoires?.map((a, i) =>
        a.type === 'box' || a.type === 'banc' ? (
          <rect key={i} x={a.x} y={a.y - a.h} width={a.l} height={a.h} rx={3} style={{ fill: '#2c2c2e' }} />
        ) : a.type === 'barre-fixe' ? (
          <g key={i}>
            <line x1={a.x - 40} y1={a.y} x2={a.x + 40} y2={a.y} style={{ stroke: '#98989f', strokeWidth: 5, strokeLinecap: 'round' }} />
          </g>
        ) : null
      )}
      {/* Membres du côté éloigné, plus sombres */}
      <g transform="translate(-5 0)">
        {ligne(p.hanche, p.genou, loin)}
        {ligne(p.genou, p.cheville, loin)}
        {ligne(p.cheville, p.orteils, { ...loin, strokeWidth: 7 })}
        {ligne(p.epaule, p.coude, loin)}
        {ligne(p.coude, p.poignet, loin)}
      </g>
      {/* Corps */}
      {ligne(p.hanche, p.epaule, { ...trait, strokeWidth: 13 })}
      {ligne(p.epaule, p.cou)}
      <circle cx={p.tete.x} cy={p.tete.y} r={L.tete} style={{ fill: 'var(--texte)' }} />
      {ligne(p.hanche, p.genou)}
      {ligne(p.genou, p.cheville)}
      {ligne(p.cheville, p.orteils, { ...trait, strokeWidth: 7 })}
      {ligne(p.epaule, p.coude)}
      {ligne(p.coude, p.poignet)}
      {anim.accessoires?.map((a, i) =>
        a.type === 'barre-mains' ? (
          <g key={i}>
            <circle cx={p.poignet.x} cy={p.poignet.y} r={17} style={{ fill: 'var(--accent)' }} />
            <circle cx={p.poignet.x} cy={p.poignet.y} r={4} style={{ fill: '#000' }} />
          </g>
        ) : a.type === 'halteres' ? (
          <rect key={i} x={p.poignet.x - 10} y={p.poignet.y - 5} width={20} height={10} rx={3} style={{ fill: 'var(--accent)' }} />
        ) : null
      )}
    </svg>
  );
}
