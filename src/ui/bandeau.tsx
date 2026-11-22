import { useEffect, useRef, useState } from 'react';

// Bandeau « Annuler » affiché 10 secondes après une action importante.
// Glisser vers le haut le ferme tout de suite.

interface Message {
  id: number;
  texte: string;
  annuler?: () => void | Promise<void>;
}

let courant: Message | null = null;
let compteur = 0;
let minuterie: ReturnType<typeof setTimeout> | undefined;
const abonnes = new Set<(m: Message | null) => void>();

function publier(m: Message | null) {
  courant = m;
  abonnes.forEach((f) => f(m));
}

export function afficherBandeau(texte: string, annuler?: () => void | Promise<void>, dureeMs = 10000) {
  if (minuterie) clearTimeout(minuterie);
  const m = { id: ++compteur, texte, annuler };
  publier(m);
  minuterie = setTimeout(() => {
    if (courant?.id === m.id) publier(null);
  }, dureeMs);
}

export function fermerBandeau() {
  if (minuterie) clearTimeout(minuterie);
  publier(null);
}

export function Bandeau() {
  const [m, setM] = useState<Message | null>(courant);
  const [dy, setDy] = useState(0);
  const depart = useRef<number | null>(null);
  useEffect(() => {
    abonnes.add(setM);
    return () => {
      abonnes.delete(setM);
    };
  }, []);
  useEffect(() => setDy(0), [m]);
  if (!m) return null;
  const finGeste = () => {
    if (depart.current === null) return;
    depart.current = null;
    if (dy < -24) fermerBandeau();
    else setDy(0);
  };
  return (
    <div
      className="bandeau"
      role="status"
      aria-live="polite"
      data-glisse={dy !== 0 ? '' : undefined}
      style={{ transform: dy ? `translateY(${dy}px)` : undefined, opacity: dy ? Math.max(0.2, 1 + dy / 80) : undefined }}
      onPointerDown={(e) => {
        depart.current = e.clientY;
        if (!(e.target as HTMLElement).closest('button')) e.currentTarget.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (depart.current === null) return;
        setDy(Math.min(0, e.clientY - depart.current));
      }}
      onPointerUp={finGeste}
      onPointerCancel={finGeste}
    >
      <span>{m.texte}</span>
      {m.annuler && (
        <button
          className="bouton"
          onClick={async () => {
            const f = m.annuler;
            publier(null);
            await f?.();
          }}
        >
          Annuler
        </button>
      )}
    </div>
  );
}
