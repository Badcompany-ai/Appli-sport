import { useEffect, useState } from 'react';

// Bandeau « Annuler » affiché 10 secondes après une action importante.

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

export function Bandeau() {
  const [m, setM] = useState<Message | null>(courant);
  useEffect(() => {
    abonnes.add(setM);
    return () => {
      abonnes.delete(setM);
    };
  }, []);
  if (!m) return null;
  return (
    <div className="bandeau" role="status" aria-live="polite">
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
