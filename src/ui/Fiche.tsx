import { useState } from 'react';
import { exercice, NOMS_MUSCLES, NOMS_MOUVEMENTS } from '../domain/exercices';
import { lienRecherche, VIDEOS } from '../domain/videos';
import { nomEquipement } from '../domain/materiel';
import { Feuille } from './Feuille';

/** Fiche d'un exercice : vidéo vérifiée (sinon recherche), consignes, erreurs, muscles, variantes. */
export function Fiche({ id, onFermer }: { id: string; onFermer: () => void }) {
  const [courant, setCourant] = useState(id);
  const [video, setVideo] = useState(false);
  const ex = exercice(courant);
  if (!ex) return null;
  const v = VIDEOS[ex.id];
  const enLigne = typeof navigator === 'undefined' || navigator.onLine;
  const facile = ex.plusFacile ? exercice(ex.plusFacile) : undefined;
  const difficile = ex.plusDifficile ? exercice(ex.plusDifficile) : undefined;

  return (
    <Feuille titre={ex.nom} onFermer={onFermer}>
      {v ? (
        enLigne ? (
          video ? (
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden', background: '#000' }}>
              <iframe
                title={`Démonstration : ${ex.nom}`}
                src={`https://www.youtube-nocookie.com/embed/${v.id}?playsinline=1&rel=0&autoplay=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          ) : (
            <button className="bouton plein" style={{ minHeight: 56 }} onClick={() => setVideo(true)}>
              Voir la démonstration · {v.chaine}
            </button>
          )
        ) : (
          <div className="carte compacte"><span className="doux petit">Vidéo indisponible sans connexion. Les consignes ci-dessous restent valables.</span></div>
        )
      ) : (
        <a className="bouton plein" href={lienRecherche(ex.nom)} target="_blank" rel="noreferrer">
          Rechercher une vidéo de « {ex.nom} »
        </a>
      )}

      <div className="ligne" style={{ flexWrap: 'wrap', gap: 6 }}>
        <span className="pastille-info">{NOMS_MOUVEMENTS[ex.mouvement]}</span>
        {ex.primaires.map((m) => <span key={m} className="pastille-info forte">{NOMS_MUSCLES[m]}</span>)}
        {ex.secondaires.map((m) => <span key={m} className="pastille-info">{NOMS_MUSCLES[m]}</span>)}
      </div>

      <div className="pile" style={{ gap: 6 }}>
        <span className="etiquette">Consignes</span>
        <ol className="liste-etapes">{ex.consignes.map((c) => <li key={c}>{c}</li>)}</ol>
      </div>
      <div className="pile" style={{ gap: 6 }}>
        <span className="etiquette">Erreurs fréquentes</span>
        <ul className="liste-etapes">{ex.erreurs.map((c) => <li key={c}>{c}</li>)}</ul>
      </div>
      <div className="pile" style={{ gap: 6 }}>
        <span className="etiquette">Matériel</span>
        <span>{ex.materiel.length ? ex.materiel.map((g) => g.map(nomEquipement).join(' ou ')).join(' + ') : 'Aucun'}</span>
      </div>
      {(facile || difficile) && (
        <div className="pile" style={{ gap: 6 }}>
          <span className="etiquette">Variantes</span>
          <div className="grille-2">
            {facile ? <button className="bouton" onClick={() => { setCourant(facile.id); setVideo(false); }}>Plus facile : {facile.nom}</button> : <span />}
            {difficile ? <button className="bouton" onClick={() => { setCourant(difficile.id); setVideo(false); }}>Plus difficile : {difficile.nom}</button> : <span />}
          </div>
        </div>
      )}
    </Feuille>
  );
}
