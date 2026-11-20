import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { demarrerSeance, mettreALaCorbeille, restaurerSeance, seanceEnCours, seancesTerminees } from '../../data/operations';
import { SEANCE_DEMO, dureeEstimeeMin } from '../../domain/demo';
import { dateLongue, ilYA, minSec } from '../../domain/format';
import { demanderStockagePersistant, preparerSon } from '../../platform/appareil';
import { afficherBandeau } from '../bandeau';
import { useReglage } from '../reglages';

const SEPT_JOURS = 7 * 86400000;

export function Aujourdhui({ ouvrirSeance, allerA }: { ouvrirSeance: (id: string) => void; allerA: (onglet: 'profil') => void }) {
  const enCours = useLiveQuery(() => seanceEnCours());
  const historique = useLiveQuery(() => seancesTerminees());
  const nbSeries = useLiveQuery(() => db.series.count());
  const [derniereSauvegarde] = useReglage('derniereSauvegarde');
  const maintenant = Date.now();
  const plan = SEANCE_DEMO;

  const sauvegardeEnRetard = (nbSeries ?? 0) > 0 && maintenant - derniereSauvegarde > SEPT_JOURS;

  return (
    <main className="ecran">
      <div className="pile" style={{ gap: 2 }}>
        <span className="surtitre">{dateLongue(maintenant)}</span>
        <h1 className="titre">Aujourd'hui</h1>
      </div>

      <section className="carte" aria-label="Séance du jour">
        <span className="doux petit gras">Jalon J1 · le vrai programme arrive au jalon J3</span>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>{plan.nom}</span>
        <div className="ligne" style={{ gap: 18, alignItems: 'baseline' }}>
          <span className="grand-chiffre">{dureeEstimeeMin(plan)}<small> min</small></span>
          <span className="grand-chiffre">{plan.exercices.length}<small> exercices</small></span>
        </div>
        <span className="doux petit">{plan.exercices.map((e) => e.nom).join(' · ')}</span>
        {enCours ? (
          <button
            className="bouton principal plein"
            onClick={() => { preparerSon(); ouvrirSeance(enCours.id); }}
          >
            Reprendre la séance · {minSec((maintenant - enCours.debut) / 1000)}
          </button>
        ) : (
          <button
            className="bouton principal plein"
            onClick={async () => {
              preparerSon();
              void demanderStockagePersistant();
              const s = await demarrerSeance(plan);
              ouvrirSeance(s.id);
            }}
          >
            Commencer
          </button>
        )}
      </section>

      {sauvegardeEnRetard && (
        <button className="carte compacte" style={{ border: 'none', textAlign: 'left' }} onClick={() => allerA('profil')}>
          <span className="gras">Pensez à sauvegarder vos données</span>
          <span className="doux petit">
            {derniereSauvegarde ? `Dernière sauvegarde ${ilYA(derniereSauvegarde, maintenant)}.` : 'Aucune sauvegarde pour l’instant.'} Touchez pour exporter.
          </span>
        </button>
      )}

      <section className="pile" aria-label="Séances enregistrées">
        <h2 className="titre-2">Séances enregistrées</h2>
        {historique && historique.length === 0 && (
          <div className="carte compacte">
            <span className="doux">Aucune séance pour l'instant. Touchez « Commencer » pour essayer le mode séance.</span>
          </div>
        )}
        {historique && historique.length > 0 && (
          <div className="carte" style={{ gap: 0, paddingTop: 6, paddingBottom: 6 }}>
            {historique.slice(0, 20).map((s) => (
              <div key={s.id} className="element-liste">
                <div className="pile" style={{ gap: 2 }}>
                  <span className="gras">{s.nom}</span>
                  <span className="doux petit">
                    {dateLongue(s.debut)} · {Math.max(1, Math.round(((s.fin ?? s.debut) - s.debut) / 60000))} min
                  </span>
                </div>
                <button
                  className="bouton discret danger"
                  aria-label={`Supprimer la séance du ${dateLongue(s.debut)}`}
                  onClick={async () => {
                    await mettreALaCorbeille(s.id);
                    afficherBandeau('Séance mise à la corbeille', () => restaurerSeance(s.id));
                  }}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
