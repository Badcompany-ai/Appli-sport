import { nombre } from '../domain/format';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { mesures, ajouterMesure, supprimerMesure, restaurerMesure } from '../data/nutrition';
import { courbeTendance, rythme, tendance, type Mesure } from '../domain/corps';
import { Courbe } from './Courbe';
import { useReglage } from './reglages';
import { Feuille } from './Feuille';
import { afficherBandeau } from './bandeau';

/** Poids utilisé dans tous les calculs : tendance des pesées, sinon le poids du profil. */
export function usePoids() {
  const [profil] = useReglage('profil');
  const pesees = useLiveQuery(() => mesures('poids'));
  const tailles = useLiveQuery(() => mesures('taille'));
  const t = pesees ? tendance(pesees, Date.now()) : undefined;
  return { poids: t ?? profil?.poidsKg ?? 82, tendance: t, pesees, tailles };
}

export const f1 = (x: number) => nombre(x, 1);

/** Pesée en 5 secondes, ou tour de taille : valeur préremplie, + et −, puis Enregistrer. */
export function FeuilleMesure({ type, depart, onFermer }: { type: Mesure['type']; depart: number; onFermer: () => void }) {
  const [v, setV] = useState(Math.round(depart * 10) / 10);
  const pas = type === 'poids' ? [0.1, 1] : [0.5, 2];
  const unite = type === 'poids' ? 'kg' : 'cm';
  const changer = (d: number) => setV((x) => Math.max(1, Math.round((x + d) * 10) / 10));
  return (
    <Feuille titre={type === 'poids' ? 'Pesée' : 'Tour de taille'} onFermer={onFermer}>
      {type === 'taille' && <span className="doux petit">Au niveau du nombril, debout et détendu, le matin, sans serrer le mètre.</span>}
      <div className="pile" style={{ alignItems: 'center', gap: 4 }}>
        <span className="grand-chiffre" style={{ fontSize: 56 }} aria-live="polite">{f1(v)}<small> {unite}</small></span>
      </div>
      <div className="grille-2" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <button className="bouton" aria-label={`Moins ${pas[1]} ${unite}`} onClick={() => changer(-pas[1])}>−{String(pas[1]).replace('.', ',')}</button>
        <button className="bouton" aria-label={`Moins ${pas[0]} ${unite}`} onClick={() => changer(-pas[0])}>−{String(pas[0]).replace('.', ',')}</button>
        <button className="bouton" aria-label={`Plus ${pas[0]} ${unite}`} onClick={() => changer(pas[0])}>+{String(pas[0]).replace('.', ',')}</button>
        <button className="bouton" aria-label={`Plus ${pas[1]} ${unite}`} onClick={() => changer(pas[1])}>+{String(pas[1]).replace('.', ',')}</button>
      </div>
      <button
        className="bouton principal plein"
        onClick={async () => {
          const m = await ajouterMesure(type, v);
          onFermer();
          afficherBandeau(`${type === 'poids' ? 'Pesée' : 'Tour de taille'} : ${f1(v)} ${unite}`, () => supprimerMesure(m.id));
        }}
      >
        Enregistrer
      </button>
    </Feuille>
  );
}

export async function supprimerMesureAvecAnnulation(m: Mesure) {
  await supprimerMesure(m.id);
  afficherBandeau(`${m.type === 'poids' ? 'Pesée' : 'Mesure'} supprimée`, () => restaurerMesure(m));
}


/** Section « Corps » de l'onglet Progrès : tendance en gros, pesées en points pâles, tour de taille. */
export function SectionCorps() {
  const { pesees, tailles, tendance: t, poids } = usePoids();
  const [feuille, setFeuille] = useState<Mesure['type'] | null>(null);
  const [liste, setListe] = useState(false);
  if (!pesees || !tailles) return null;
  const maintenant = Date.now();
  const r = rythme(pesees, maintenant);
  const derniereTaille = tailles[tailles.length - 1];
  const fleche = (x: number) => (Math.abs(x) < 0.05 ? '→' : x < 0 ? '↘' : '↗');
  const signe = (x: number) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${f1(Math.abs(x))}`;
  return (
    <section className="pile" aria-label="Corps">
      <h2 className="titre-2">Corps</h2>
      <div className="carte">
        {pesees.length === 0 ? (
          <span className="doux">Aucune pesée pour l’instant. Pesez-vous 2 à 3 fois par semaine, le matin : la tendance lisse les variations d’un jour à l’autre.</span>
        ) : (
          <>
            <div className="ligne ecartee" style={{ alignItems: 'baseline' }}>
              <div className="pile" style={{ gap: 0 }}>
                <span className="doux petit gras">Tendance sur 7 jours</span>
                <span className="grand-chiffre">{f1(t ?? poids)}<small> kg</small></span>
                <span className="doux petit">Dernière pesée : {f1(pesees[pesees.length - 1].valeur)} kg</span>
              </div>
              {r ? (
                <span className="gras" style={{ textAlign: 'right' }}>
                  {fleche(r.kgSemaine)} {signe(r.kgSemaine)} kg/sem.
                  <br />
                  <span className="doux petit">{signe(r.pctSemaine)} % par semaine</span>
                </span>
              ) : (
                <span className="doux petit" style={{ textAlign: 'right', maxWidth: 150 }}>Rythme dès 4 pesées sur 14 jours</span>
              )}
            </div>
            <Courbe points={courbeTendance(pesees)} brut={pesees.map((p) => ({ date: p.date, valeur: p.valeur }))} format={(v) => `${f1(v)} kg`} lectureDiscrete />
            <span className="doux petit">Ligne : tendance. Points pâles : pesées du jour (elles varient de 1 à 2 kg avec l’eau, le sel et les repas).</span>
          </>
        )}
        <div className="grille-2">
          <button className="bouton principal" onClick={() => setFeuille('poids')}>Peser</button>
          <button className="bouton" disabled={!pesees.length} onClick={() => setListe(true)}>Pesées</button>
        </div>
      </div>
      <div className="carte compacte">
        <div className="ligne ecartee">
          <div className="pile" style={{ gap: 2 }}>
            <span className="gras">Tour de taille</span>
            <span className="doux petit">
              {derniereTaille
                ? `${f1(derniereTaille.valeur)} cm · ${new Date(derniereTaille.date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long' })}${tailles.length > 1 ? ` · ${signe(derniereTaille.valeur - tailles[tailles.length - 2].valeur)} cm` : ''}`
                : 'Indicateur principal de silhouette. Une mesure toutes les 4 semaines suffit.'}
            </span>
          </div>
          <button className="bouton" onClick={() => setFeuille('taille')}>Mesurer</button>
        </div>
        {tailles.length > 1 && <Courbe points={tailles.map((m) => ({ date: m.date, valeur: m.valeur }))} format={(v) => `${f1(v)} cm`} />}
      </div>
      {feuille && (
        <FeuilleMesure
          type={feuille}
          depart={feuille === 'poids' ? pesees[pesees.length - 1]?.valeur ?? poids : derniereTaille?.valeur ?? 85}
          onFermer={() => setFeuille(null)}
        />
      )}
      {liste && (
        <Feuille titre="Pesées" onFermer={() => setListe(false)}>
          <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0, maxHeight: '55dvh', overflowY: 'auto' }}>
            {[...pesees, ...tailles].sort((a, b) => b.date - a.date).slice(0, 60).map((m) => (
              <div key={m.id} className="element-liste">
                <div className="pile" style={{ gap: 2 }}>
                  <span className="gras">{f1(m.valeur)} {m.type === 'poids' ? 'kg' : 'cm (taille)'}</span>
                  <span className="doux petit">{new Date(m.date).toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                <button className="bouton discret danger" onClick={() => void supprimerMesureAvecAnnulation(m)}>Supprimer</button>
              </div>
            ))}
          </div>
        </Feuille>
      )}
    </section>
  );
}

