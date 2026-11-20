import { IconeFermer } from './icones';

// ---------- Feuille du bas ----------

export function Feuille({ titre, onFermer, children }: { titre: string; onFermer: () => void; children: React.ReactNode }) {
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
