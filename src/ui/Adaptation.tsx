import { PastilleSeance } from './couleurs';
import { useMemo, useState } from 'react';
import { EXERCICES, NOMS_MOUVEMENTS } from '../domain/exercices';
import { estDisponible } from '../domain/remplacement';
import { MESSAGE_MEDICAL, ZONES, type AlerteEquilibre, type Zone } from '../domain/adaptation';
import type { Dispo } from '../domain/materiel';
import type { SeancePrevue } from '../domain/types';
import { ACTIVITES, kcalNettes } from '../domain/depense';
import { Feuille } from './Feuille';

// Écrans du jalon J5 : fatigue et douleur, sommeil, choix de la séance, séance libre, équilibre.

export function FeuilleSignalement(props: {
  fatigue: boolean;
  douleurs: Zone[];
  onFatigue: (v: boolean) => void;
  onDouleurs: (z: Zone[]) => void;
  onFermer: () => void;
  /** En séance : la fatigue et la douleur s'appliquent aux exercices suivants. */
  enSeance?: { exercice: string; touche: boolean; onArreter: () => void; onAppliquer: () => void };
}) {
  const { fatigue, douleurs, enSeance } = props;
  return (
    <Feuille titre="Fatigue ou douleur" onFermer={props.onFermer}>
      <div className="pile" style={{ gap: 8 }}>
        <span className="gras">Fatigue</span>
        <span className="doux petit">30 % de séries en moins, charges − 5 %, pas d’effort maximal en sprint ni en saut.</span>
        <button className="bouton plein" aria-pressed={fatigue} onClick={() => props.onFatigue(!fatigue)}>
          {fatigue ? 'Fatigue signalée' : enSeance ? 'Je suis fatigué : alléger la suite' : 'Je suis fatigué aujourd’hui'}
        </button>
      </div>
      <div className="pile" style={{ gap: 8 }}>
        <span className="gras">Douleur</span>
        <span className="doux petit">Touchez la zone. Les exercices qui la sollicitent sont retirés ou remplacés, jusqu’à ce que vous la retiriez.</span>
        <div className="pilules" role="group" aria-label="Zones douloureuses">
          {ZONES.map((z) => {
            const on = douleurs.includes(z.id);
            return (
              <button key={z.id} className="bouton" aria-pressed={on} onClick={() => props.onDouleurs(on ? douleurs.filter((x) => x !== z.id) : [...douleurs, z.id])}>
                {z.nom}
              </button>
            );
          })}
        </div>
        {enSeance && douleurs.length > 0 && (
          <button className="bouton principal plein" onClick={enSeance.onAppliquer}>Adapter les exercices suivants</button>
        )}
        {enSeance?.touche && (
          <button className="bouton plein" onClick={enSeance.onArreter}>Arrêter « {enSeance.exercice} »</button>
        )}
      </div>
      <span className="doux petit">{MESSAGE_MEDICAL}</span>
    </Feuille>
  );
}

const HEURES = [4, 5, 6, 7, 8, 9];

export function CarteSommeil({ heures, onChoisir }: { heures?: number; onChoisir: (h: number | undefined) => void }) {
  if (heures !== undefined) {
    return (
      <div className="ligne ecartee doux petit">
        <span>Sommeil cette nuit : <span className="gras">{heures <= 4 ? '4 h ou moins' : heures >= 9 ? '9 h ou plus' : `${heures} h`}</span></span>
        <button className="bouton discret" onClick={() => onChoisir(undefined)}>Modifier</button>
      </div>
    );
  }
  return (
    <section className="carte compacte" aria-label="Sommeil">
      <span className="gras">Sommeil cette nuit</span>
      <div className="choix-reps" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        {HEURES.map((h) => (
          <button key={h} className="bouton" style={{ fontSize: 'var(--t-3)' }} onClick={() => onChoisir(h)} aria-label={`${h} heures de sommeil`}>
            {h === 4 ? '≤4' : h === 9 ? '9+' : h}
          </button>
        ))}
      </div>
    </section>
  );
}

export function FeuilleChoixSeance({ seances, actuelle, onChoisir, onFermer }: { seances: SeancePrevue[]; actuelle?: string; onChoisir: (lettre: string) => void; onFermer: () => void }) {
  return (
    <Feuille titre="Changer de séance" onFermer={onFermer}>
      <span className="doux petit">Séances qui restent à faire cette semaine. L’ordre conseillé reste le meilleur, mais vous pouvez en avancer une.</span>
      <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
        {seances.map((s) => (
          <button key={s.id} className="lien-liste" onClick={() => onChoisir(s.programme?.lettre ?? '')} aria-pressed={s.programme?.lettre === actuelle}>
            <span className="gras ligne" style={{ gap: 8 }}><PastilleSeance lettre={s.programme?.lettre} />{s.nom}</span>
            <span className="doux petit">{s.exercices.length} exercices{s.programme?.lettre === actuelle ? ' · prévue aujourd’hui' : ''}</span>
          </button>
        ))}
      </div>
    </Feuille>
  );
}

export function FeuilleSeanceLibre(props: {
  dispo: Dispo;
  remplacables: SeancePrevue[];
  onCommencer: (ids: string[], remplace?: string) => void;
  onActivite: (nom: string, dureeMin: number, remplace: string | undefined, activite: { id: string; met: number }) => void;
  onFermer: () => void;
  poidsKg: number;
}) {
  const [onglet, setOnglet] = useState<'exercices' | 'activite'>('exercices');
  const [choisis, setChoisis] = useState<string[]>([]);
  const [recherche, setRecherche] = useState('');
  const [remplace, setRemplace] = useState<string | undefined>();
  const [nom, setNom] = useState('');
  const [type, setType] = useState('basket-loisir');
  const act = ACTIVITES.find((a) => a.id === type)!;
  const [duree, setDuree] = useState(60);
  const liste = useMemo(() => {
    const r = recherche.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return EXERCICES.filter((e) => e.mesure !== 'test' && (!r || e.nom.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(r)))
      .sort((a, b) => Number(estDisponible(b, props.dispo)) - Number(estDisponible(a, props.dispo)));
  }, [recherche, props.dispo]);

  const choixRemplace = props.remplacables.length > 0 && (
    <div className="pile" style={{ gap: 6 }}>
      <span className="petit gras">Remplace une séance du programme ?</span>
      <div className="pilules">
        <button className="bouton" aria-pressed={!remplace} onClick={() => setRemplace(undefined)}>Non</button>
        {props.remplacables.map((s) => (
          <button key={s.id} className="bouton" aria-pressed={remplace === s.programme?.lettre} onClick={() => setRemplace(s.programme?.lettre)}>
            Séance {s.programme?.lettre}
          </button>
        ))}
      </div>
      <span className="doux petit">{remplace ? `La séance ${remplace} sera comptée comme faite.` : 'Le programme n’est pas décalé.'}</span>
    </div>
  );

  return (
    <Feuille titre="Séance libre" onFermer={props.onFermer}>
      <div className="lieux" role="group" aria-label="Type de séance libre" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <button className="bouton" aria-pressed={onglet === 'exercices'} onClick={() => setOnglet('exercices')}>Exercices</button>
        <button className="bouton" aria-pressed={onglet === 'activite'} onClick={() => setOnglet('activite')}>Activité</button>
      </div>
      {onglet === 'exercices' ? (
        <>
          <input className="champ-texte" type="search" placeholder="Chercher un exercice" aria-label="Chercher un exercice" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          {choisis.length > 0 && <span className="petit gras">{choisis.length} exercice{choisis.length > 1 ? 's' : ''} choisi{choisis.length > 1 ? 's' : ''}</span>}
          <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0, maxHeight: '38dvh', overflowY: 'auto' }}>
            {liste.map((e) => {
              const on = choisis.includes(e.id);
              const dispo = estDisponible(e, props.dispo);
              return (
                <button key={e.id} className="lien-liste" aria-pressed={on} onClick={() => setChoisis(on ? choisis.filter((x) => x !== e.id) : [...choisis, e.id])}>
                  <span className="gras">{on ? '✓ ' : ''}{e.nom}</span>
                  <span className="doux petit">{NOMS_MOUVEMENTS[e.mouvement]}{dispo ? '' : ' · matériel absent ici'}</span>
                </button>
              );
            })}
          </div>
          {choixRemplace}
          <button className="bouton principal plein" disabled={!choisis.length} onClick={() => props.onCommencer(choisis, remplace)}>
            Commencer la séance libre
          </button>
        </>
      ) : (
        <>
          <label className="pile" style={{ gap: 6 }}>
            <span className="petit gras">Activité</span>
            <select className="champ-texte" aria-label="Type d’activité" value={type} onChange={(e) => setType(e.target.value)}>
              {ACTIVITES.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          </label>
          <input className="champ-texte" placeholder={`Nom (facultatif) : ${act.nom}`} aria-label="Nom de l’activité" value={nom} onChange={(e) => setNom(e.target.value)} />
          <div className="pile" style={{ gap: 6 }}>
            <span className="petit gras">Durée</span>
            <div className="pilules">
              {[30, 45, 60, 90, 120].map((d) => (
                <button key={d} className="bouton" aria-pressed={duree === d} onClick={() => setDuree(d)}>{d < 60 ? `${d} min` : `${Math.floor(d / 60)} h${d % 60 ? ` ${d % 60}` : ''}`}</button>
              ))}
            </div>
          </div>
          <span className="doux petit">
            Dépense estimée : environ {Math.round(kcalNettes(act.met, props.poidsKg, duree) / 10) * 10} kcal en plus du repos (MET {String(act.met).replace('.', ',')}, Compendium des activités physiques 2024).{act.note ? ` ${act.note}` : ''}
          </span>
          {choixRemplace}
          <button className="bouton principal plein" onClick={() => props.onActivite(nom.trim() || act.nom, duree, remplace, { id: act.id, met: act.met })}>
            Enregistrer l’activité
          </button>
        </>
      )}
    </Feuille>
  );
}

export function CarteEquilibre({ alertes, onAjouter }: { alertes: AlerteEquilibre[]; onAjouter?: (id: string) => void }) {
  if (!alertes.length) return null;
  return (
    <section className="carte compacte alerte" aria-label="Équilibre musculaire">
      <span className="gras">Groupes musculaires à surveiller</span>
      {alertes.slice(0, 2).map((a) => (
        <div key={a.muscle} className="pile" style={{ gap: 4 }}>
          <span className="petit">{a.texte}</span>
          {a.suggestion && onAjouter && (
            <button className="bouton discret" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => onAjouter(a.suggestion!.id)}>
              Ajouter « {a.suggestion.nom} » à la séance du jour
            </button>
          )}
          {a.suggestion && !onAjouter && <span className="doux petit">Suggestion : {a.suggestion.nom} à la prochaine séance.</span>}
        </div>
      ))}
    </section>
  );
}
