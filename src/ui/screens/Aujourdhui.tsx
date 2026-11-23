import { PastilleSeance, couleurSeance } from '../couleurs';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { demarrerSeance, enregistrerActivite, mettreALaCorbeille, restaurerSeance, seanceEnCours, seancesTerminees } from '../../data/operations';
import { SEANCE_DEMO } from '../../domain/demo';
import { NOMS_PHASES, contactsAuSol, indexSemaine, infoSemaine, seanceMobilite, seancesDeLaSemaine } from '../../domain/programme';
import { depuisCle, joursEntre, lundiDe, versCle } from '../../domain/profil';
import { appliquerProgression, donneesAllegement, lettresFaites, seancesDepuis, seriesDepuis } from '../../data/programme';
import {
  ajusterAuTemps, alertesEquilibre, alleger, controlesRecuperation, dureeTotaleMin, eviterZones, exerciceAjoute, raisonAllegement,
  seancesAFaire, volumeParMuscle, ZONES, type Ajustement
} from '../../domain/adaptation';
import { FeuilleMesure, usePoids } from '../corps';
import { peseeConseillee, tailleDue } from '../../domain/corps';
import { FeuilleBilan } from '../Bilan';
import { semaineActive } from '../../data/bilan';
import { CarteEquilibre, CarteSommeil, FeuilleChoixSeance, FeuilleSeanceLibre, FeuilleSignalement } from '../Adaptation';
import type { SeancePrevue } from '../../domain/types';
import { dateLongue, ilYA, kg, minSec } from '../../domain/format';
import { LIEUX } from '../../domain/materiel';
import { adapterSeance } from '../../domain/remplacement';
import type { ExercicePrevu } from '../../domain/types';
import { demanderStockagePersistant, preparerSon } from '../../platform/appareil';
import { afficherBandeau } from '../bandeau';
import { useReglage } from '../reglages';
import { cleDuJour, useJournee } from '../journee';
import { FeuilleChangements, FeuilleMateriel } from '../Materiel';
import { Fiche } from '../Fiche';

const SEPT_JOURS = 7 * 86400000;

export function detailPrevu(e: ExercicePrevu): string {
  if (e.mesure === 'test') return 'épreuve mesurée';
  if (e.distanceM) return `${e.series} × ${e.distanceM} m`;
  const reps = e.repsMin && e.repsMin !== e.reps ? `${e.repsMin}–${e.reps}` : `${e.reps}`;
  const base =
    e.mesure === 'tenue'
      ? `${e.series} × ${e.dureeSec} s`
      : e.mesure === 'charge_reps'
        ? `${e.series} × ${reps} · ${e.chargeKg !== undefined ? `${kg(e.chargeKg)} kg` : 'charge à choisir'}`
        : e.mesure === 'poids_du_corps_reps' && e.chargeKg
          ? `${e.series} × ${reps} · lest ${kg(e.chargeKg)} kg`
          : `${e.series} × ${reps}`;
  const enchaine = e.groupe ? ' · enchaîné' : '';
  return (e.tempoLent ? `${base} · descente lente` : base) + enchaine;
}

export function Aujourdhui({ ouvrirSeance, allerA }: { ouvrirSeance: (id: string) => void; allerA: (onglet: 'profil') => void }) {
  const enCours = useLiveQuery(() => seanceEnCours());
  const historique = useLiveQuery(() => seancesTerminees());
  const nbSeries = useLiveQuery(() => db.series.count());
  const [derniereSauvegarde] = useReglage('derniereSauvegarde');
  const journee = useJournee();
  const [feuille, setFeuille] = useState<'materiel' | 'changements' | 'signalement' | 'choix' | 'libre' | null>(null);
  const [fiche, setFiche] = useState<string | null>(null);
  const [essai, setEssai] = useState(false);
  const [mobilite, setMobilite] = useState(false);
  const [profil, setProfil] = useReglage('profil');
  const [sommeil, setSommeil] = useReglage('sommeil');
  const [douleurs, setDouleurs] = useReglage('douleurs');
  const [fatigues, setFatigues] = useReglage('fatigues');
  const [allegement, setAllegement] = useReglage('allegement');
  const maintenant = Date.now();
  const { poids, pesees, tailles } = usePoids();
  const [mesure, setMesure] = useState<'poids' | 'taille' | null>(null);
  const [tailleIgnoree, setTailleIgnoree] = useReglage('tailleIgnoreeLe');
  const [bilanVu, setBilanVu] = useReglage('bilanVu');
  const [bilanOuvert, setBilanOuvert] = useState(false);
  const lundiPasse = (() => { const d = lundiDe(new Date(maintenant)); d.setDate(d.getDate() - 7); return d.getTime(); })();
  const bilanDispo = useLiveQuery(async () => bilanVu < lundiPasse && (await semaineActive(lundiPasse)), [bilanVu, lundiPasse, historique?.length]);
  const jour = journee.jour;
  const cle = cleDuJour(maintenant);

  // Semaine du programme et prochaine séance à faire.
  const index = profil ? indexSemaine(depuisCle(profil.debut), new Date(maintenant)) : -1;
  const avantDebut = index < 0;
  const info = infoSemaine(Math.max(0, index));
  const faites = useLiveQuery(() => lettresFaites(index), [index, historique?.length]);
  const semaine = useMemo(() => (profil ? seancesDeLaSemaine(profil, Math.max(0, index)) : []), [profil, index]);
  // Séances des 4 derniers jours (contrôles de récupération) et des 10 derniers jours (équilibre).
  const recentes = useLiveQuery(() => seancesDepuis(maintenant - 4 * 86400000), [historique?.length]);
  const faiteAujourdhui = !!recentes?.some((s) => cleDuJour(s.fin ?? s.debut) === cle && s.plan.programme?.semaine === index && ['entrainement', 'test', 'test_leger'].includes(s.plan.programme.type));
  const joursRestants = 7 - ((new Date(maintenant).getDay() + 6) % 7) - (faiteAujourdhui ? 1 : 0);
  const { aFaire, laissees } = faites ? seancesAFaire(semaine, faites, joursRestants) : { aFaire: [], laissees: [] };
  const prochaine = (jour.lettre ? aFaire.find((s) => s.programme?.lettre === jour.lettre) : undefined) ?? aFaire[0];
  const deProgramme = !avantDebut && !essai && !mobilite;
  const base: SeancePrevue | undefined = avantDebut || essai ? SEANCE_DEMO : mobilite && profil ? seanceMobilite(index) : prochaine;
  const source = useMemo(
    () => (base && jour.ajouts?.length ? { ...base, exercices: [...base.exercices, ...jour.ajouts.filter((id) => !base.exercices.some((e) => e.exerciceId === id)).map(exerciceAjoute)] } : base),
    [base, jour.ajouts]
  );
  const avecCharges = useLiveQuery(async () => (source ? appliquerProgression(source) : undefined), [source, historique?.length]);

  // Semaine allégée conseillée (règle 7.3).
  const donnees = useLiveQuery(() => donneesAllegement(fatigues, lundiDe(new Date(maintenant)).getTime(), maintenant), [fatigues, historique?.length]);
  const raison = donnees && index >= 2 && !info.allegee ? raisonAllegement(donnees) : undefined;
  const semaineAllegee = deProgramme && allegement?.semaine === index && allegement.accepte;
  const proposerAllegement = deProgramme && !!raison && allegement?.semaine !== index;

  const heuresSommeil = sommeil[cle];
  const nuitCourte = heuresSommeil !== undefined && heuresSommeil < 6;

  // Toutes les adaptations du jour, dans l'ordre : matériel, douleur, allègements, temps disponible.
  const adapte = useMemo(() => {
    if (!avecCharges) return undefined;
    const r = adapterSeance(avecCharges, { dispo: journee.dispo, poidsCorpsKg: poids });
    let p = r.plan;
    const ajustements: Ajustement[] = [];
    const etape = (x: { plan: SeancePrevue; ajustements: Ajustement[] }) => {
      p = x.plan;
      ajustements.push(...x.ajustements);
    };
    if (douleurs.length) etape(eviterZones(p, douleurs, { dispo: journee.dispo, poidsCorpsKg: poids }));
    let dejaAllege = false;
    if (semaineAllegee && !mobilite) { etape(alleger(p, 'semaine')); dejaAllege = true; }
    else if (jour.versionAllegee && deProgramme) { etape(alleger(p, 'deplacement')); dejaAllege = true; }
    if (jour.fatigue && !mobilite) etape(alleger(p, 'fatigue', dejaAllege));
    if (jour.allegerSommeil && nuitCourte && !mobilite) etape(alleger(p, 'sommeil'));
    const complete = dureeTotaleMin(p);
    if (jour.tempsMin && jour.tempsMin < complete) etape(ajusterAuTemps(p, jour.tempsMin));
    return { plan: p, changements: r.changements, ajustements, complete };
  }, [avecCharges, journee.dispo, poids, douleurs, semaineAllegee, jour.versionAllegee, jour.fatigue, jour.allegerSommeil, jour.tempsMin, nuitCourte, mobilite, deProgramme]);
  const plan = adapte?.plan;
  const changements = adapte?.changements ?? [];
  const ajustements = adapte?.ajustements ?? [];
  const retires = ajustements.filter((a) => a.retire);
  const autresAjustements = ajustements.filter((a) => !a.retire);
  const alertesRecup = plan && deProgramme && !jour.versionAllegee && !semaineAllegee && recentes ? controlesRecuperation(plan, recentes.map((s) => ({ fin: s.fin ?? s.debut, plan: s.plan })), maintenant) : [];
  const aDesExplosifs = !!avecCharges?.exercices.some((e) => /saut|sprint|bonds|navettes|pas-chasses/.test(e.exerciceId));

  // Équilibre musculaire (règle 7.7) : seulement après une semaine d'historique.
  const equilibre = useLiveQuery(async () => {
    const premiere = (await seancesDepuis(0))[0];
    if (!premiere || maintenant - (premiere.fin ?? premiere.debut) < 7 * 86400000) return [];
    const v7 = volumeParMuscle(await seriesDepuis(maintenant - 7 * 86400000));
    const v10 = volumeParMuscle(await seriesDepuis(maintenant - 10 * 86400000));
    return alertesEquilibre(v7, v10, journee.dispo, new Set(plan?.exercices.map((e) => e.exerciceId)));
  }, [historique?.length, journee.dispo, plan?.exercices.length]);

  async function signalerFatigue(v: boolean) {
    await journee.maj({ fatigue: v });
    await setFatigues(v ? [...fatigues, Date.now()] : fatigues.filter((t) => cleDuJour(t) !== cle));
  }

  const sauvegardeEnRetard = (nbSeries ?? 0) > 0 && maintenant - derniereSauvegarde > SEPT_JOURS;

  return (
    <main className="ecran">
      <header className="entete">
        <h1 className="titre">Aujourd'hui</h1>
        <span className="doux">{dateLongue(maintenant).toLowerCase()}</span>
      </header>

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

      {!enCours && bilanDispo && (
        <button className="carte compacte alerte" style={{ textAlign: 'left', color: 'inherit' }} onClick={() => setBilanOuvert(true)}>
          <span className="gras">Bilan de la semaine dernière</span>
          <span className="doux petit">Séances, poids, nutrition et sommeil, en une page. Touchez pour l’ouvrir.</span>
        </button>
      )}
      {bilanOuvert && <FeuilleBilan lundi={lundiPasse} onFermer={() => { setBilanOuvert(false); void setBilanVu(lundiPasse); }} />}

      {!enCours && (
        <CarteSommeil
          heures={heuresSommeil}
          onChoisir={(h) => {
            const n = { ...sommeil };
            if (h === undefined) delete n[cle];
            else n[cle] = h;
            void setSommeil(n);
            if (h === undefined) void journee.maj({ allegerSommeil: undefined });
          }}
        />
      )}

      {!enCours && nuitCourte && aDesExplosifs && jour.allegerSommeil === undefined && (
        <section className="carte compacte alerte" aria-label="Nuit courte">
          <span className="gras">Moins de 6 h de sommeil</span>
          <span className="doux petit">Alléger les sauts et les sprints d’un tiers aujourd’hui ? Les charges ne changent pas.</span>
          <div className="grille-2">
            <button className="bouton" onClick={() => void journee.maj({ allegerSommeil: false })}>Garder</button>
            <button className="bouton clair" onClick={() => void journee.maj({ allegerSommeil: true })}>Alléger</button>
          </div>
        </section>
      )}

      {!enCours && proposerAllegement && (
        <section className="carte compacte alerte" aria-label="Semaine allégée conseillée">
          <span className="gras">Semaine allégée conseillée</span>
          <span className="doux petit">{raison} Proposition : environ moitié moins de séries jusqu’à dimanche, mêmes charges, pas de sprint ni de saut au maximum.</span>
          <div className="grille-2">
            <button className="bouton" onClick={async () => { await setAllegement({ semaine: index, accepte: false }); afficherBandeau('Semaine normale conservée', () => setAllegement(allegement)); }}>Non merci</button>
            <button className="bouton clair" onClick={async () => { await setAllegement({ semaine: index, accepte: true }); afficherBandeau('Semaine allégée', () => setAllegement(allegement)); }}>Alléger la semaine</button>
          </div>
        </section>
      )}

      {!enCours && douleurs.length > 0 && (
        <button className="carte compacte alerte" style={{ textAlign: 'left', color: 'inherit' }} onClick={() => setFeuille('signalement')}>
          <span className="gras">Douleur signalée : {douleurs.map((z) => ZONES.find((x) => x.id === z)?.nom.toLowerCase()).join(', ')}</span>
          <span className="doux petit">Les exercices qui sollicitent cette zone sont retirés ou remplacés. Touchez pour modifier.</span>
        </button>
      )}

      {!enCours && deProgramme && laissees.length > 0 && (
        <span className="doux petit">
          Plus assez de jours cette semaine : {laissees.map((s) => `séance ${s.programme?.lettre}`).join(', ')} laissée{laissees.length > 1 ? 's' : ''} de côté. La semaine prochaine repart normalement.
        </span>
      )}

      {!enCours && !avantDebut && !prochaine && !mobilite && faites && (
        <section className="carte" aria-label="Semaine terminée">
          <span className="doux petit gras">Semaine {index + 1} · {NOMS_PHASES[info.phase]}</span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Semaine terminée</span>
          <span className="doux">{laissees.length ? 'Les séances possibles sont faites.' : `Les ${semaine.length} séances sont faites.`} Repos, ou une séance de mobilité.</span>
        </section>
      )}

      {(enCours || (plan && (!avantDebut || essai))) && (
      <section className="carte vedette" aria-label="Séance du jour" style={{ '--teinte': couleurSeance((enCours?.plan ?? plan)?.programme?.lettre) } as React.CSSProperties}>
        <span className="doux petit gras ligne" style={{ gap: 8 }}>
          <PastilleSeance lettre={(enCours?.plan ?? plan)?.programme?.lettre} />
          {enCours
            ? 'Séance en cours'
            : essai || avantDebut
              ? 'Séance d’essai (avant le début du programme)'
              : `Semaine ${index + 1} · ${NOMS_PHASES[info.phase]}${info.allegee || semaineAllegee ? ' · allégée' : ''}${plan?.programme?.lettre && plan.programme.lettre.length === 1 && plan.programme.lettre !== 'L' && plan.programme.lettre !== 'M' ? ` · séance ${plan.programme.lettre}` : ''}`}
        </span>
        <span className="nom-seance">{enCours ? enCours.nom : plan?.nom}</span>
        {enCours ? (
          <button className="bouton principal plein" onClick={() => { preparerSon(); ouvrirSeance(enCours.id); }}>
            Reprendre la séance · {minSec((maintenant - enCours.debut) / 1000)}
          </button>
        ) : plan && (
          <>
            <div className="ligne" style={{ gap: 18, alignItems: 'baseline' }}>
              <span className="grand-chiffre">{dureeTotaleMin(plan)}<small> min</small></span>
              <span className="grand-chiffre">{plan.exercices.length}<small> exercices</small></span>
              {contactsAuSol(plan) > 0 && <span className="grand-chiffre">{contactsAuSol(plan)}<small> sauts</small></span>}
            </div>
            <button
              className="bouton principal geant"
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
            <div className={deProgramme && aFaire.length > 1 ? 'grille-3 actions-seance' : 'grille-2 actions-seance'}>
              {deProgramme && aFaire.length > 1 && <button className="bouton" onClick={() => setFeuille('choix')}>Changer de séance</button>}
              <button className="bouton" onClick={() => setFeuille('signalement')}>{jour.fatigue ? 'Fatigue signalée' : 'Fatigue ou douleur'}</button>
              <button className="bouton" onClick={() => setFeuille('materiel')}>Matériel</button>
            </div>
            {adapte && (
              <div className="pile" style={{ gap: 2 }}>
                <label className="ligne ecartee petit" htmlFor="temps-dispo">
                  <span className="gras">Temps disponible</span>
                  <span className={jour.tempsMin ? 'gras' : 'doux'}>{jour.tempsMin ? `${jour.tempsMin} min` : 'toute la séance'}</span>
                </label>
                <input
                  id="temps-dispo"
                  className="curseur"
                  type="range"
                  min={20}
                  max={Math.max(90, Math.ceil(adapte.complete / 5) * 5)}
                  step={5}
                  value={jour.tempsMin ?? Math.ceil(adapte.complete / 5) * 5}
                  aria-label="Temps disponible en minutes"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    void journee.maj({ tempsMin: v >= adapte.complete ? undefined : v });
                  }}
                />
              </div>
            )}
            {alertesRecup.length > 0 && (
              <div className="pile alerte" style={{ gap: 6, padding: 12, borderRadius: 16 }}>
                {alertesRecup.map((a) => <span key={a} className="petit gras">{a}</span>)}
                <span className="doux petit">Conseil : faites une autre séance aujourd’hui, ou la version allégée.</span>
                <div className="grille-2">
                  {aFaire.length > 1 ? <button className="bouton" onClick={() => setFeuille('choix')}>Autre séance</button> : <span />}
                  <button className="bouton" onClick={() => void journee.maj({ versionAllegee: true })}>Version allégée</button>
                </div>
              </div>
            )}
            {autresAjustements.length > 0 && (
              <div className="pile" style={{ gap: 4 }} aria-label="Ajustements du jour">
                {autresAjustements.map((a, i) => (
                  <span key={i} className="petit doux"><span className="gras" style={{ color: 'var(--texte)' }}>{a.nom} : </span>{a.raison}</span>
                ))}
              </div>
            )}
            {journee.dispo.materiel.length === 0 && <span className="gras petit">Aucun matériel coché : séance au poids du corps.</span>}
            {changements.length > 0 && (
              <button className="bouton plein" style={{ justifyContent: 'space-between' }} onClick={() => setFeuille('changements')}>
                <span className="gras">
                  {changements.length} changement{changements.length > 1 ? 's' : ''} selon le matériel
                </span>
                <span style={{ whiteSpace: 'nowrap' }}>Voir pourquoi</span>
              </button>
            )}
            <div className="pile" style={{ gap: 0 }}>
              {plan.exercices.map((e) => (
                <button key={e.exerciceId} className="lien-liste" onClick={() => setFiche(e.exerciceId)} aria-label={`Fiche : ${e.nom}`}>
                  <span className="gras ligne" style={{ gap: 8 }}>{e.nom}{e.origineId && <span className="etiquette-remplace">remplacé</span>}</span>
                  <span className="doux petit">{detailPrevu(e)}</span>
                </button>
              ))}
              {retires.map((a, i) => (
                <div key={`r${i}`} className="lien-liste grise">
                  <span className="gras">{a.nom}</span>
                  <span className="doux petit">{a.raison}</span>
                </div>
              ))}
            </div>
            {(jour.tempsMin || jour.fatigue || jour.versionAllegee || jour.allegerSommeil || jour.ajouts?.length) && (
              <button
                className="bouton discret"
                onClick={async () => {
                  const avant = jour;
                  await journee.maj({ tempsMin: undefined, fatigue: undefined, versionAllegee: undefined, allegerSommeil: nuitCourte ? false : undefined, ajouts: undefined });
                  if (jour.fatigue) await setFatigues(fatigues.filter((t) => cleDuJour(t) !== cle));
                  afficherBandeau('Séance prévue rétablie', () => journee.maj(avant));
                }}
              >
                Revenir à la séance complète
              </button>
            )}
            {(essai || mobilite) && (
              <button className="bouton plein discret" onClick={() => { setEssai(false); setMobilite(false); }}>
                Revenir à la séance prévue
              </button>
            )}
          </>
        )}
      </section>
      )}

      {!enCours && (
        <div className={!avantDebut && profil?.seanceMobilite && !mobilite ? 'grille-2' : 'pile'}>
          {!avantDebut && profil?.seanceMobilite && !mobilite && (
            <button className="bouton" onClick={() => setMobilite(true)}>Mobilité · 15 min</button>
          )}
          <button className="bouton" onClick={() => setFeuille('libre')}>Séance libre</button>
        </div>
      )}

      {!enCours && equilibre && <CarteEquilibre alertes={equilibre} onAjouter={plan && deProgramme ? (id) => void journee.maj({ ajouts: [...(jour.ajouts ?? []), id] }) : undefined} />}

      {!enCours && profil?.modules?.corps !== false && pesees && tailles && (peseeConseillee(pesees, maintenant) || (tailleDue(tailles, maintenant) && maintenant - tailleIgnoree > 7 * 86400000)) && (
        <section className="carte compacte" aria-label="Mesures du jour">
          <div className="grille-2">
            {peseeConseillee(pesees, maintenant) ? <button className="bouton" onClick={() => setMesure('poids')}>Peser</button> : <span />}
            {tailleDue(tailles, maintenant) && maintenant - tailleIgnoree > 7 * 86400000 ? <button className="bouton" onClick={() => setMesure('taille')}>Tour de taille</button> : <span />}
          </div>
          {tailleDue(tailles, maintenant) && maintenant - tailleIgnoree > 7 * 86400000 && (
            <button className="bouton discret" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => void setTailleIgnoree(maintenant)}>Tour de taille : plus tard</button>
          )}
        </section>
      )}
      {mesure && pesees && tailles && (
        <FeuilleMesure
          type={mesure}
          depart={mesure === 'poids' ? pesees[pesees.length - 1]?.valeur ?? poids : tailles[tailles.length - 1]?.valeur ?? 85}
          onFermer={() => setMesure(null)}
        />
      )}

      {sauvegardeEnRetard && (
        <button className="carte compacte discrete" style={{ textAlign: 'left' }} onClick={() => allerA('profil')}>
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
                  <span className="gras ligne" style={{ gap: 8 }}><PastilleSeance lettre={s.plan.programme?.lettre} />{s.nom}</span>
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
      {feuille === 'signalement' && (
        <FeuilleSignalement
          fatigue={!!jour.fatigue}
          douleurs={douleurs}
          onFatigue={(v) => void signalerFatigue(v)}
          onDouleurs={(z) => void setDouleurs(z)}
          onFermer={() => setFeuille(null)}
        />
      )}
      {feuille === 'choix' && (
        <FeuilleChoixSeance
          seances={aFaire}
          actuelle={prochaine?.programme?.lettre}
          onChoisir={(l) => { setFeuille(null); void journee.maj({ lettre: l, versionAllegee: undefined }); }}
          onFermer={() => setFeuille(null)}
        />
      )}
      {feuille === 'libre' && (
        <FeuilleSeanceLibre
          dispo={journee.dispo}
          remplacables={avantDebut ? [] : aFaire}
          onFermer={() => setFeuille(null)}
          onCommencer={async (ids, remplace) => {
            setFeuille(null);
            const libre: SeancePrevue = {
              id: `libre-${Date.now()}`,
              nom: remplace ? `Séance libre (remplace la séance ${remplace})` : 'Séance libre',
              exercices: ids.map((id) => ({ ...exerciceAjoute(id), priorite: 2 as const })),
              programme: { semaine: Math.max(0, index), lettre: remplace ?? 'LIBRE', type: remplace ? 'entrainement' : 'libre' }
            };
            preparerSon();
            const s = await demarrerSeance(await appliquerProgression(libre), Date.now(), { lieu: journee.lieu, dispo: journee.dispo });
            ouvrirSeance(s.id);
          }}
          poidsKg={poids}
          onActivite={async (nom, duree, remplace, activite) => {
            setFeuille(null);
            const s = await enregistrerActivite(nom, duree, { semaine: Math.max(0, index), lettre: remplace ?? 'ACT', type: 'activite' }, activite);
            afficherBandeau(`${nom} enregistré${remplace ? ` (remplace la séance ${remplace})` : ''}`, () => mettreALaCorbeille(s.id));
          }}
        />
      )}
      {fiche && <Fiche id={fiche} onFermer={() => setFiche(null)} />}
    </main>
  );
}
