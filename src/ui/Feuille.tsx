import { useEffect } from 'react';
import { IconeFermer } from './icones';

// ---------- Feuille du bas ----------

// Nombre de feuilles ouvertes : la page derrière reste bloquée tant qu'il en reste une.
let ouvertes = 0;

export function Feuille({ titre, onFermer, children }: { titre: string; onFermer: () => void; children: React.ReactNode }) {
  useEffect(() => {
    ouvertes++;
    document.documentElement.classList.add('fige');
    return () => {
      ouvertes--;
      if (ouvertes === 0) document.documentElement.classList.remove('fige');
    };
  }, []);
  return (
    <div className="voile" onClick={onFermer}>
      <div className="feuille" role="dialog" aria-label={titre} onClick={(e) => e.stopPropagation()}>
        <div className="ligne ecartee">
          <h2 className="titre-2">{titre}</h2>
          <button className="bouton rond" aria-label="Fermer" onClick={onFermer}><IconeFermer /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
