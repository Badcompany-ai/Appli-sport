import { useEffect, useState } from 'react';
import { EQUIPEMENTS, FAMILLES, LIEUX, type Dispo, type Lieu } from '../domain/materiel';
import type { Changement } from '../domain/remplacement';
import { Feuille } from './Feuille';
import { afficherBandeau } from './bandeau';

/** Liste à cocher du matériel du jour. Chaque case recalcule la séance immédiatement. */
export function FeuilleMateriel(props: {
  lieu: Lieu;
  dispo: Dispo;
  modifieAujourdhui: boolean;
  changements: Changement[];
  onChanger: (d: Dispo) => void;
  onEnregistrerPreset: (d: Dispo) => void;
  onRevenir: () => void;
  onFermer: () => void;
}) {
  // État local immédiat (la case change sans attendre l'enregistrement), puis enregistrement.
  const [dispo, setDispo] = useState(props.dispo);
  useEffect(() => setDispo(props.dispo), [props.dispo]);
  const changer = (d: Dispo) => {
    setDispo(d);
    props.onChanger(d);
  };
  const nomLieu = LIEUX.find((l) => l.id === props.lieu)?.nom ?? '';
  const basculer = (id: string, oui: boolean) =>
    changer({ ...dispo, materiel: oui ? [...dispo.materiel, id] : dispo.materiel.filter((m) => m !== id) });
  const rien = dispo.materiel.length === 0;

  return (
    <Feuille titre={`Matériel · ${nomLieu}`} onFermer={props.onFermer}>
      <div className="carte compacte" aria-live="polite">
        {rien ? (
          <span className="gras">Aucun matériel coché : séance entièrement au poids du corps.</span>
        ) : props.changements.length === 0 ? (
          <span className="doux">Séance inchangée avec ce matériel.</span>
        ) : (
          <span className="gras">
            {props.changements.length} changement{props.changements.length > 1 ? 's' : ''} dans la séance du jour
          </span>
        )}
        {props.changements.slice(0, 3).map((c, i) => (
          <span key={i} className="petit doux">
            {c.avant} → {c.apres ?? 'retiré'}
          </span>
        ))}
      </div>

      {FAMILLES.map((f) => (
        <div key={f} className="pile" style={{ gap: 0 }}>
          <span className="etiquette" style={{ paddingTop: 8 }}>{f}</span>
          {EQUIPEMENTS.filter((e) => e.famille === f).map((e) => {
            const coche = dispo.materiel.includes(e.id);
            return (
              <div key={e.id}>
                <label className="case">
                  <input type="checkbox" checked={coche} onChange={(ev) => basculer(e.id, ev.target.checked)} />
                  <span>{e.nom}</span>
                </label>
                {coche && (e.id === 'halteres' || e.id === 'kettlebell') && (
                  <div className="ligne ecartee" style={{ padding: '4px 0 10px 36px' }}>
                    <span className="doux petit">Charge maximale : <b style={{ color: 'var(--texte)' }}>{e.id === 'halteres' ? dispo.halteresMaxKg : dispo.kettlebellMaxKg} kg</b></span>
                    <div className="ligne" style={{ gap: 6 }}>
                      {[-2, 2].map((d) => (
                        <button
                          key={d}
                          className="bouton"
                          style={{ width: 48, minHeight: 40 }}
                          aria-label={`${d > 0 ? 'Plus' : 'Moins'} 2 kg (${e.nom})`}
                          onClick={() =>
                            changer(
                              e.id === 'halteres'
                                ? { ...dispo, halteresMaxKg: Math.max(0, dispo.halteresMaxKg + d) }
                                : { ...dispo, kettlebellMaxKg: Math.max(0, dispo.kettlebellMaxKg + d) }
                            )
                          }
                        >
                          {d > 0 ? '+' : '−'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <span className="doux petit">
        {props.modifieAujourdhui ? `Modifié pour aujourd’hui seulement. Demain, le préréglage « ${nomLieu} » reviendra.` : `Préréglage « ${nomLieu} ».`}
      </span>
      {props.modifieAujourdhui && (
        <div className="grille-2">
          <button className="bouton" onClick={props.onRevenir}>Revenir au préréglage</button>
          <button
            className="bouton"
            onClick={() => {
              props.onEnregistrerPreset(dispo);
              afficherBandeau(`Préréglage « ${nomLieu} » enregistré`);
            }}
          >
            Garder pour « {nomLieu} »
          </button>
        </div>
      )}
      <button className="bouton principal plein" onClick={props.onFermer}>OK</button>
    </Feuille>
  );
}

/** Explications des changements de la séance du jour. */
export function FeuilleChangements({ changements, onFermer }: { changements: Changement[]; onFermer: () => void }) {
  return (
    <Feuille titre="Ce qui a changé" onFermer={onFermer}>
      <div className="carte" style={{ gap: 0, paddingTop: 4, paddingBottom: 4 }}>
        {changements.map((c, i) => (
          <div key={i} className="changement">
            <span className="titre-ch">
              {c.type === 'retire' ? <>{c.avant} : <b>retiré</b></> : c.type === 'ajuste' ? <>{c.avant} : <b>ajusté</b></> : <>{c.avant} → <b>{c.apres}</b></>}
            </span>
            <span className="doux petit">{c.raison}</span>
          </div>
        ))}
      </div>
      <button className="bouton principal plein" onClick={onFermer}>OK</button>
    </Feuille>
  );
}
