import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { demarrerSeance, mettreALaCorbeille, restaurerSeance, seanceEnCours, seancesTerminees } from '../../data/operations';
import { SEANCE_DEMO, dureeEstimeeMin } from '../../domain/demo';
import { NOMS_PHASES, indexSemaine, infoSemaine, prochaineSeance, seanceMobilite, seancesDeLaSemaine } from '../../domain/programme';
import { depuisCle, joursEntre, lundiDe, versCle } from '../../domain/profil';
import { appliquerProgression, lettresFaites } from '../../data/programme';
import type { SeancePrevue } from '../../domain/types';
import { dateLongue, ilYA, kg, minSec } from '../../domain/format';
import { LIEUX } from '../../domain/materiel';
import { adapterSeance } from '../../domain/remplacement';
import type { ExercicePrevu } from '../../domain/types';
import { demanderStockagePersistant, preparerSon } from '../../platform/appareil';
import { afficherBandeau } from '../bandeau';
import { useReglage } from '../reglages';
import { useJournee } from '../journee';
import { FeuilleChangements, FeuilleMateriel } from '../Materiel';
import { Fiche } from '../Fiche';

const SEPT_JOURS = 7 * 86400000;
export const POIDS_PAR_DEFAUT = 82; // interview, série 3 (à remplacer par la pesée au jalon J6)

export function detailPrevu(e: ExercicePrevu): string {
  if (e.mesure === 'test') return 'épreuve mesurée';
  const reps = e.repsMin && e.repsMin !== e.reps ? `${e.repsMin}–${e.reps}` : `${e.reps}`;
  const base =
    e.mesure === 'tenue'
      ? `${e.series} × ${e.dureeSec} s`
      : e.mesure === 'charge_reps'
        ? `${e.series} × ${reps} · ${e.chargeKg !== undefined ? `${kg(e.chargeKg)} kg` : 'charge à choisir'}`
        : e.mesure === 'poids_du_corps_reps' && e.chargeKg
          ? `${e.series} × ${reps} · lest ${kg(e.chargeKg)} kg`
          : `${e.series} × ${reps}`;
  return e.tempoLent ? `${base} · descente lente` : base;
}

export function Aujourdhui({ ouvrirSeance, allerA }: { ouvrirSeance: (id: string) => void; allerA: (onglet: 'profil') => void }) {
  const enCours = useLiveQuery(() => seanceEnCours());
  const historique = useLiveQuery(() => seancesTerminees());
  const nbSeries = useLiveQuery(() => db.series.count());
  const [derniereSauvegarde] = useReglage('derniereSauvegarde');
  const journee = useJournee();
  const [feuille, setFeuille] = useState<'materiel' | 'changements' | null>(null);
  const [fiche, setFiche] = useState<string | null>(null);
  const [essai, setEssai] = useState(false);
  const [mobilite, setMobilite] = useState(false);
  const [profil, setProfil] = useReglage('profil');
  const maintenant = Date.now();
  const poids = profil?.poidsKg ?? POIDS_PAR_DEFAUT;

  // Semaine du programme et prochaine séance à faire.
  const index = profil ? indexSemaine(depuisCle(profil.debut), new Date(maintenant)) : -1;
  const avantDebut = index < 0;
  const info = infoSemaine(Math.max(0, index));
  const faites = useLiveQuery(() => lettresFaites(index), [index, historique?.length]);
  const semaine = useMemo(() => (profil ? seancesDeLaSemaine(profil, Math.max(0, index)) : []), [profil, index]);
  const prochaine = faites ? prochaineSeance(semaine, faites) : undefined;
  const source: SeancePrevue | undefined = avantDebut || essai ? SEANCE_DEMO : mobilite && profil ? seanceMobilite(index) : prochaine;
  const avecCharges = useLiveQuery(async () => (source ? appliquerProgression(source) : undefined), [source?.id, mobilite, essai, historique?.length]);

  const { plan, changements } = useMemo(
    () => (avecCharges ? adapterSeance(avecCharges, { dispo: journee.dispo, poidsCorpsKg: poids }) : { plan: undefined, changements: [] }),
    [avecCharges, journee.dispo, poids]
  );

  const sauvegardeEnRetard = (nbSeries ?? 0) > 0 && maintenant - derniereSauvegarde > SEPT_JOURS;

  return (
    <main className="ecran">
      <div className="pile" style={{ gap: 2 }}>
        <span className="surtitre">{dateLongue(maintenant)}</span>
        <h1 className="titre">Aujourd'hui</h1>
      </div>

      {!enCours && (
        <div className="lieux" role="group" aria-label="Lieu d'entraînement">
          {LIEUX.map((l) => (
            <button key={l.id} className="bouton" aria-pressed={journee.lieu === l.id} onClick={() => void journee.choisirLieu(l.id)}>
              {l.nom}
            </button>
          ))}
        </div>
      )}

      {!enCours && profil && avantDebut && !essai && (
        <section className="carte" aria-label="Début du programme">
          <span className="doux petit gras">Votre programme</span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Commence le {dateLongue(depuisCle(profil.debut).getTime()).toLowerCase()}</span>
          <span className="doux">Dans {-Math.floor(joursEntre(depuisCle(profil.debut), new Date(maintenant)))} jours. En attendant, vous pouvez faire une séance d’essai.</span>
          <div className="grille-2">
            <button className="bouton" onClick={() => setEssai(true)}>Séance d’essai</button>
            <button
              className="bouton"
              onClick={async () => {
                const lundi = lundiDe(new Date(maintenant));
                const ech = new Date(lundi);
                ech.setDate(ech.getDate() + 26 * 7 - 1);
                const avant = profil;
                await setProfil({ ...profil, debut: versCle(lundi), echeance: versCle(ech) });
                afficherBandeau('Programme avancé à cette semaine', () => setProfil(avant));
              }}
            >
              Commencer cette semaine
            </button>
          </div>
        </section>
      )}

      {!enCours && !avantDebut && !prochaine && !mobilite && faites && (
        <section className="carte" aria-label="Semaine terminée">
          <span className="doux petit gras">Semaine {index + 1} · {NOMS_PHASES[info.phase]}</span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Semaine terminée</span>
          <span className="doux">Les {semaine.length} séances sont faites. Repos, ou une séance de mobilité.</span>
        </section>
      )}

      {(enCours || (plan && (!avantDebut || essai))) && (
      <section className="carte" aria-label="Séance du jour">
        <span className="doux petit gras">
          {enCours
            ? 'Séance en cours'
            : essai || avantDebut
              ? 'Séance d’essai (avant le début du programme)'
              : `Semaine ${index + 1} · ${NOMS_PHASES[info.phase]}${info.allegee ? ' · allégée' : ''}${plan?.programme?.lettre && plan.programme.lettre.length === 1 && plan.programme.lettre !== 'L' && plan.programme.lettre !== 'M' ? ` · séance ${plan.programme.lettre}` : ''}`}
        </span>
        <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>{enCours ? enCours.nom : plan?.nom}</span>
        {enCours ? (
          <button className="bouton principal plein" onClick={() => { preparerSon(); ouvrirSeance(enCours.id); }}>
            Reprendre la séance · {minSec((maintenant - enCours.debut) / 1000)}
          </button>
        ) : plan && (
          <>
            <div className="ligne" style={{ gap: 18, alignItems: 'baseline' }}>
              <span className="grand-chiffre">{dureeEstimeeMin(plan) + (plan.echauffement?.length ? 10 : 0)}<small> min</small></span>
              <span className="grand-chiffre">{plan.exercices.length}<small> exercices</small></span>
            </div>
            {journee.dispo.materiel.length === 0 && <span className="mention-orange gras petit">Aucun matériel coché : séance au poids du corps.</span>}
            {changements.length > 0 && (
              <button className="bouton plein" style={{ justifyContent: 'space-between' }} onClick={() => setFeuille('changements')}>
                <span className="mention-orange">
                  {changements.length} changement{changements.length > 1 ? 's' : ''} selon le matériel
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>Voir pourquoi</span>
              </button>
            )}
            <div className="pile" style={{ gap: 0 }}>
              {plan.exercices.map((e) => (
                <button key={e.exerciceId} className="lien-liste" onClick={() => setFiche(e.exerciceId)} aria-label={`Fiche : ${e.nom}`}>
                  <span className={`gras ${e.origineId ? 'mention-orange' : ''}`}>{e.nom}</span>
                  <span className="doux petit">{detailPrevu(e)}</span>
                </button>
              ))}
            </div>
            <div className="grille-2">
              <button className="bouton" onClick={() => setFeuille('materiel')}>Matériel</button>
              <button
                className="bouton principal"
                onClick={async () => {
                  preparerSon();
                  void demanderStockagePersistant();
                  const s = await demarrerSeance(plan, Date.now(), { lieu: journee.lieu, dispo: journee.dispo });
                  setEssai(false);
                  setMobilite(false);
                  ouvrirSeance(s.id);
                }}
              >
                Commencer
              </button>
            </div>
            {(essai || mobilite) && (
              <button className="bouton plein discret" onClick={() => { setEssai(false); setMobilite(false); }}>
                Revenir à la séance prévue
              </button>
            )}
          </>
        )}
      </section>
      )}

      {!enCours && !avantDebut && profil?.seanceMobilite && !mobilite && (
        <button className="bouton plein" onClick={() => setMobilite(true)}>Séance de mobilité (15 min)</button>
      )}

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
                    {s.lieu ? ` · ${LIEUX.find((l) => l.id === s.lieu)?.nom}` : ''}
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

      {feuille === 'materiel' && (
        <FeuilleMateriel
          lieu={journee.lieu}
          dispo={journee.dispo}
          modifieAujourdhui={journee.modifieAujourdhui}
          changements={changements}
          onChanger={(d) => void journee.changerDispo(d)}
          onEnregistrerPreset={(d) => void journee.enregistrerPreset(d)}
          onRevenir={() => void journee.revenirAuPreset()}
          onFermer={() => setFeuille(null)}
        />
      )}
      {feuille === 'changements' && <FeuilleChangements changements={changements} onFermer={() => setFeuille(null)} />}
      {fiche && <Fiche id={fiche} onFermer={() => setFiche(null)} />}
    </main>
  );
}
