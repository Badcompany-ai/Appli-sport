import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import {
  dernierePerformance,
  enregistrerSerie,
  mettreALaCorbeille,
  modifierSeance,
  restaurerSeance,
  seriesDeLaSeance,
  supprimerSerie,
  terminerSeance
} from '../../data/operations';
import type { ExercicePrevu, Seance, Serie } from '../../domain/types';
import { etatRepos, lienRaccourci, prolonger } from '../../domain/repos';
import { ilYA, kg, minSec } from '../../domain/format';
import { bip, garderEcranAllume, preparerSon } from '../../platform/appareil';
import { afficherBandeau } from '../bandeau';
import { IconeFermer, IconeMinuteur, IconePlus } from '../icones';
import { useReglage } from '../reglages';
import { Feuille } from '../Feuille';
import { Fiche } from '../Fiche';
import { candidats, convertir } from '../../domain/remplacement';
import { NOMS_MOUVEMENTS } from '../../domain/exercices';
import { PRESETS } from '../../domain/materiel';
import { dureeNavette, epreuve, vo2DepuisPalier } from '../../domain/niveau';
import { POIDS_PAR_DEFAUT, detailPrevu } from './Aujourdhui';

export function ModeSeance({ seanceId, onFermer }: { seanceId: string; onFermer: () => void }) {
  const seance = useLiveQuery(async () => (await db.seances.get(seanceId)) ?? null, [seanceId]);
  const series = useLiveQuery(() => seriesDeLaSeance(seanceId), [seanceId]);
  const [raccourci] = useReglage('raccourci');
  const [son] = useReglage('sonApplication');
  const [menu, setMenu] = useState(false);
  const [note, setNote] = useState(false);
  const [fiche, setFiche] = useState(false);
  const [remplacer, setRemplacer] = useState(false);

  useEffect(() => {
    garderEcranAllume(true);
    return () => garderEcranAllume(false);
  }, []);

  // La séance a été abandonnée ou terminée ailleurs : on referme proprement.
  const fermee = seance === null || (seance !== undefined && (!!seance.supprimeeLe || seance.statut === 'terminee'));
  useEffect(() => {
    if (fermee) onFermer();
  }, [fermee, onFermer]);

  if (!seance || !series || fermee) return <div className="seance" aria-busy="true" />;

  const plan = seance.plan;
  const idx = Math.min(seance.exerciceIndex, plan.exercices.length);
  const totalSeries = plan.exercices.reduce((n, e) => n + e.series, 0);
  const progression = totalSeries ? series.length / totalSeries : 0;

  if (idx >= plan.exercices.length) {
    return <FinSeance seance={seance} series={series} onFermer={onFermer} />;
  }

  if (plan.echauffement?.length && !seance.echauffementFait && idx === 0 && series.length === 0) {
    return (
      <div className="seance" role="dialog" aria-label="Échauffement">
        <div className="ligne ecartee">
          <button className="bouton rond" aria-label="Fermer (la séance reste en cours)" onClick={onFermer}><IconeFermer /></button>
          <span className="doux petit gras">{plan.nom}</span>
          <span style={{ width: 44 }} />
        </div>
        <h1 className="titre" style={{ fontSize: 30 }}>Échauffement</h1>
        <span className="doux">Environ 8 à 10 minutes, de plus en plus intense.</span>
        <div className="carte">
          <ol className="liste-etapes" style={{ fontSize: 17, gap: 12 }}>
            {plan.echauffement.map((e) => <li key={e}>{e}</li>)}
          </ol>
        </div>
        <div style={{ flexGrow: 1 }} />
        <button className="bouton principal geant" onClick={() => { preparerSon(); void modifierSeance(seance.id, { echauffementFait: true }); }}>
          Échauffement fait
        </button>
      </div>
    );
  }

  const ex = plan.exercices[idx];
  const faites = series.filter((s) => s.exerciceId === ex.exerciceId);
  const numero = faites.length;

  async function valider(valeurs: { chargeKg?: number; reps?: number; dureeSec?: number; valeur?: number }) {
    if (!seance) return;
    preparerSon();
    const maintenant = Date.now();
    const serie = await enregistrerSerie({ seanceId: seance.id, exerciceId: ex.exerciceId, numero, faiteLe: maintenant, ...valeurs });
    const finExercice = numero + 1 >= ex.series;
    const finSeance = finExercice && idx === plan.exercices.length - 1;
    const repos = finSeance ? 0 : ex.reposSec;
    await modifierSeance(seance.id, {
      exerciceIndex: finExercice ? idx + 1 : idx,
      reposFin: repos ? maintenant + repos * 1000 : undefined,
      reposTotalSec: repos || undefined
    });
    afficherBandeau('Série enregistrée', async () => {
      await supprimerSerie(serie.id);
      await modifierSeance(seance.id, { exerciceIndex: idx, reposFin: undefined, reposTotalSec: undefined });
    });
    if (repos && raccourci.actif) {
      // Lance le raccourci « Repos » : il préviendra par notification, même hors de l'application.
      window.location.href = lienRaccourci(raccourci.nom, repos);
    }
  }

  const prochain = prochaineEtape(seance, series);

  return (
    <div className="seance" role="dialog" aria-label={`Séance : ${plan.nom}`}>
      <div className="ligne ecartee">
        <button className="bouton rond" aria-label="Fermer (la séance reste en cours)" onClick={onFermer}><IconeFermer /></button>
        <span className="doux petit gras">Exercice {idx + 1} sur {plan.exercices.length}</span>
        <button className="bouton rond" aria-label="Options de la séance" onClick={() => setMenu(true)}><IconePlus /></button>
      </div>
      <div className="barre-progres" aria-hidden="true"><div style={{ width: `${Math.round(progression * 100)}%` }} /></div>

      <div className="pile" style={{ gap: 8 }}>
        <h1 className="titre" style={{ fontSize: 30 }}>{ex.nom}</h1>
        {ex.consigne && <span className="mention-orange gras petit">{ex.consigne}</span>}
        {ex.raisonCharge && numero === 0 && <span className="doux petit">{ex.raisonCharge}</span>}
        {ex.mesure !== 'test' && <div className="points" >
          <span className="doux gras petit" style={{ marginRight: 4 }}>{numero < ex.series ? `Série ${numero + 1} sur ${ex.series}` : 'Série supplémentaire'}</span>
          {Array.from({ length: ex.series }, (_, i) => (
            <span key={i} className={`point ${i < numero ? 'fait' : i === numero ? 'actuel' : ''}`} />
          ))}
        </div>}
      </div>

      {ex.mesure === 'test' ? (
        ex.testId === 'test-navette' ? (
          <Navette key={`${ex.exerciceId}-${numero}`} onValider={(palier) => valider({ valeur: palier })} />
        ) : (
          <SaisieTest key={`${ex.exerciceId}-${numero}`} ex={ex} onValider={(v) => valider({ valeur: v })} />
        )
      ) : ex.mesure === 'tenue' ? (
        <SaisieTenue key={`${ex.exerciceId}-${numero}`} ex={ex} son={son} onValider={(d) => valider({ dureeSec: d })} />
      ) : (
        <SaisieReps key={`${ex.exerciceId}-${numero}`} ex={ex} faites={faites} seanceId={seance.id} onValider={valider} />
      )}

      {ex.mesure === 'test' ? (
        <button className="bouton plein" onClick={() => setNote(true)}>Note</button>
      ) : (
        <div className="grille-3">
          <button className="bouton" onClick={() => setRemplacer(true)}>Remplacer</button>
          <button className="bouton" onClick={() => setFiche(true)}>Fiche</button>
          <button className="bouton" onClick={() => setNote(true)}>Note</button>
        </div>
      )}

      <DernierePerf ex={ex} seanceId={seance.id} />

      {seance.notes[ex.exerciceId] && (
        <button className="carte compacte" style={{ border: 'none', textAlign: 'left' }} onClick={() => setNote(true)}>
          <span className="etiquette">Note</span>
          <span style={{ whiteSpace: 'pre-wrap' }}>{seance.notes[ex.exerciceId]}</span>
        </button>
      )}

      {seance.reposFin !== undefined && (
        <Repos
          fin={seance.reposFin}
          totalSec={seance.reposTotalSec ?? 60}
          prochain={prochain}
          raccourciActif={raccourci.actif}
          son={son}
          onPlus30={() => {
            const p = prolonger(seance.reposFin!, seance.reposTotalSec ?? 60, 30, Date.now());
            void modifierSeance(seance.id, { reposFin: p.fin, reposTotalSec: p.totalSec });
          }}
          onFin={() => void modifierSeance(seance.id, { reposFin: undefined, reposTotalSec: undefined })}
        />
      )}

      {menu && (
        <Feuille onFermer={() => setMenu(false)} titre="Options">
          <button className="bouton plein" onClick={() => { setMenu(false); setNote(true); }}>
            {seance.notes[ex.exerciceId] ? 'Modifier la note' : 'Ajouter une note'} sur {ex.nom}
          </button>
          <button
            className="bouton plein"
            onClick={async () => {
              setMenu(false);
              await modifierSeance(seance.id, { exerciceIndex: idx + 1, reposFin: undefined, reposTotalSec: undefined });
              afficherBandeau(`${ex.nom} passé`, () => modifierSeance(seance.id, { exerciceIndex: idx }));
            }}
          >
            Passer cet exercice
          </button>
          <button
            className="bouton plein"
            onClick={async () => {
              setMenu(false);
              await modifierSeance(seance.id, { exerciceIndex: plan.exercices.length, reposFin: undefined, reposTotalSec: undefined });
            }}
          >
            Terminer la séance maintenant
          </button>
          <button
            className="bouton plein danger"
            onClick={async () => {
              setMenu(false);
              await mettreALaCorbeille(seance.id);
              afficherBandeau('Séance abandonnée (corbeille)', () => restaurerSeance(seance.id));
            }}
          >
            Abandonner la séance
          </button>
        </Feuille>
      )}

      {fiche && <Fiche id={ex.exerciceId} onFermer={() => setFiche(false)} />}

      {remplacer && (
        <Feuille titre={`Remplacer : ${ex.nom}`} onFermer={() => setRemplacer(false)}>
          <span className="doux petit">Équivalents disponibles avec le matériel du jour, du plus proche au moins proche.</span>
          {(() => {
            const ctx = { dispo: seance.dispo ?? PRESETS.salle, poidsCorpsKg: POIDS_PAR_DEFAUT };
            const exclus = new Set(plan.exercices.map((e) => e.exerciceId));
            const liste = candidats(ex, ctx, exclus).slice(0, 8);
            if (!liste.length) return <span className="gras">Aucun équivalent disponible avec ce matériel.</span>;
            return (
              <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
                {liste.map(({ ex: c }) => {
                  const { nouveau } = convertir(ex, c, ctx);
                  return (
                    <button
                      key={c.id}
                      className="lien-liste"
                      onClick={async () => {
                        setRemplacer(false);
                        const avant = plan;
                        const restantes = Math.max(1, ex.series - faites.length);
                        const exercices = plan.exercices.map((e, i) => (i === idx ? { ...nouveau, series: restantes, choixManuel: true } : e));
                        if (faites.length > 0) exercices.splice(idx, 0, { ...ex, series: faites.length });
                        await modifierSeance(seance.id, { plan: { ...plan, exercices }, exerciceIndex: faites.length > 0 ? idx + 1 : idx });
                        afficherBandeau(`${ex.nom} → ${c.nom}`, () => modifierSeance(seance.id, { plan: avant, exerciceIndex: idx }));
                      }}
                    >
                      <span className="gras">{c.nom}</span>
                      <span className="doux petit">{detailPrevu({ ...nouveau, series: Math.max(1, ex.series - faites.length) })} · {NOMS_MOUVEMENTS[c.mouvement]}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </Feuille>
      )}

      {note && (
        <Feuille onFermer={() => setNote(false)} titre={`Note : ${ex.nom}`}>
          <textarea
            className="champ"
            autoFocus
            aria-label="Note libre"
            defaultValue={seance.notes[ex.exerciceId] ?? ''}
            placeholder="Sensations, réglage de la machine, consigne…"
            onChange={(e) => void modifierSeance(seance.id, { notes: { ...seance.notes, [ex.exerciceId]: e.target.value } })}
          />
          <button className="bouton principal plein" onClick={() => setNote(false)}>OK</button>
        </Feuille>
      )}
    </div>
  );
}

function prochaineEtape(seance: Seance, series: Serie[]): string {
  const idx = seance.exerciceIndex;
  const ex = seance.plan.exercices[idx];
  if (!ex) return 'Fin de la séance';
  const n = series.filter((s) => s.exerciceId === ex.exerciceId).length;
  if (ex.mesure === 'test') return `${ex.nom} · épreuve`;
  const detail =
    ex.mesure === 'tenue'
      ? `${ex.dureeSec} s`
      : ex.mesure === 'charge_reps'
        ? `${kg(ex.chargeKg ?? 0)} kg × ${ex.reps}`
        : `${ex.reps} répétitions`;
  return `${ex.nom} · série ${n + 1} sur ${ex.series} · ${detail}`;
}

// ---------- Saisie d'une série avec répétitions ----------

function SaisieReps({
  ex,
  faites,
  seanceId,
  onValider
}: {
  ex: ExercicePrevu;
  faites: Serie[];
  seanceId: string;
  onValider: (v: { chargeKg?: number; reps: number }) => void;
}) {
  const derniere = useLiveQuery(() => dernierePerformance(ex.exerciceId, seanceId), [ex.exerciceId, seanceId]);
  const precedenteIci = faites[faites.length - 1]?.chargeKg;
  const depart = precedenteIci ?? ex.chargeKg ?? derniere?.series[0]?.chargeKg ?? (ex.mesure === 'charge_reps' ? 20 : 0);
  const [charge, setCharge] = useState<number | undefined>(undefined);
  const valeurCharge = charge ?? depart;
  const pas = ex.pasKg ?? 2.5;
  const vise = ex.reps ?? 8;
  const [reps, setReps] = useState(vise);
  const choix = Array.from({ length: 5 }, (_, i) => Math.max(1, vise - 2) + i);
  const lest = ex.mesure === 'poids_du_corps_reps';
  const sansCharge = ex.mesure === 'reps';

  // Saisie en deux gestes au plus : choisir une valeur (si besoin), puis « Valider ».
  return (
    <div className="carte" style={{ gap: 16 }}>
      {ex.tempoLent && <span className="mention-orange gras petit" style={{ textAlign: 'center' }}>Descente lente : 3 secondes à chaque répétition</span>}
      <div className={sansCharge ? '' : 'grille-2'}>
        {!sansCharge && <div className="pile" style={{ alignItems: 'center', gap: 6 }}>
          <span className="etiquette">{lest ? 'Lest' : 'Charge'}</span>
          <span className="valeur-geante" aria-live="polite">{kg(valeurCharge)}</span>
          <span className="doux petit gras">kg</span>
          <div className="ligne" style={{ gap: 8 }}>
            <button className="bouton" style={{ width: 52 }} aria-label={`Moins ${kg(pas)} kg`} onClick={() => setCharge(Math.max(0, valeurCharge - pas))}>−</button>
            <button className="bouton" style={{ width: 52 }} aria-label={`Plus ${kg(pas)} kg`} onClick={() => setCharge(valeurCharge + pas)}>+</button>
          </div>
        </div>}
        <div className="pile" style={{ alignItems: 'center', gap: 6 }}>
          <span className="etiquette">Répétitions</span>
          <span className="valeur-geante" aria-live="polite" style={{ color: reps !== vise ? 'var(--accent)' : undefined }}>{reps}</span>
          <span className="doux petit gras">objectif {vise}</span>
          <div className="ligne" style={{ gap: 8 }}>
            <button className="bouton" style={{ width: 52 }} aria-label="Une répétition de moins" onClick={() => setReps(Math.max(0, reps - 1))}>−</button>
            <button className="bouton" style={{ width: 52 }} aria-label="Une répétition de plus" onClick={() => setReps(reps + 1)}>+</button>
          </div>
        </div>
      </div>
      <div className="pile" style={{ gap: 8 }}>
        <span className="doux petit gras">Répétitions faites</span>
        <div className="choix-reps" role="radiogroup" aria-label="Répétitions faites">
          {choix.map((r) => (
            <button
              key={r}
              role="radio"
              aria-checked={r === reps}
              aria-label={`${r} répétitions`}
              className={`bouton ${r === reps ? 'choisi' : ''}`}
              onClick={() => setReps(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <button className="bouton principal geant" onClick={() => onValider({ chargeKg: sansCharge ? undefined : valeurCharge, reps })}>
        {sansCharge || (lest && valeurCharge === 0) ? `Valider ${reps} répétitions` : `Valider ${reps} × ${kg(valeurCharge)} kg`}
      </button>
    </div>
  );
}

// ---------- Exercice tenu (chronomètre) ----------

function SaisieTenue({ ex, son, onValider }: { ex: ExercicePrevu; son: boolean; onValider: (dureeSec: number) => void }) {
  const [debut, setDebut] = useState<number | undefined>();
  const [maintenant, setMaintenant] = useState(Date.now());
  const cibleAtteinte = useRef(false);
  const cible = ex.dureeSec ?? 30;

  useEffect(() => {
    if (debut === undefined) return;
    const t = setInterval(() => setMaintenant(Date.now()), 200);
    return () => clearInterval(t);
  }, [debut]);

  const ecoule = debut ? Math.floor((maintenant - debut) / 1000) : 0;
  useEffect(() => {
    if (debut && ecoule >= cible && !cibleAtteinte.current) {
      cibleAtteinte.current = true;
      if (son) bip(2);
    }
  }, [ecoule, cible, debut, son]);

  return (
    <div className="carte" style={{ alignItems: 'center', gap: 14 }}>
      <span className="etiquette">{debut ? 'Temps tenu' : `Objectif ${cible} s`}</span>
      <span className="valeur-geante" style={{ fontSize: 88, color: ecoule >= cible ? 'var(--accent)' : undefined }}>{minSec(ecoule)}</span>
      {debut === undefined ? (
        <button className="bouton principal geant" onClick={() => { preparerSon(); setDebut(Date.now()); setMaintenant(Date.now()); }}>
          Démarrer le chronomètre
        </button>
      ) : (
        <button className="bouton principal geant" onClick={() => onValider(Math.max(1, ecoule))}>
          Arrêter et enregistrer
        </button>
      )}
    </div>
  );
}

// ---------- Rappel de la dernière performance ----------

function DernierePerf({ ex, seanceId }: { ex: ExercicePrevu; seanceId: string }) {
  const d = useLiveQuery(() => dernierePerformance(ex.exerciceId, seanceId), [ex.exerciceId, seanceId]);
  if (d === undefined) {
    return (
      <div className="carte compacte">
        <span className="doux petit gras">Dernière fois</span>
        <span className="gras">Première fois sur cet exercice</span>
      </div>
    );
  }
  let texte: string;
  if (ex.mesure === 'test') {
    const e = epreuve(ex.exerciceId);
    texte = d.series.map((s) => `${String(s.valeur ?? '').replace('.', ',')} ${e ? NOMS_UNITES[e.unite] : ''}`).join(' · ');
  } else if (ex.mesure === 'tenue') texte = d.series.map((s) => `${s.dureeSec ?? 0} s`).join(' · ');
  else {
    const reps = d.series.map((s) => s.reps ?? 0).join(' · ');
    const c = d.series[0]?.chargeKg ?? 0;
    texte = ex.mesure === 'reps' || (ex.mesure === 'poids_du_corps_reps' && !c) ? `${reps} répétitions` : `${kg(c)} kg × ${reps}`;
  }
  return (
    <div className="carte compacte">
      <span className="doux petit gras">Dernière fois · {ilYA(d.seance.debut, Date.now())}</span>
      <span className="gras" style={{ fontSize: 17 }}>{texte}</span>
    </div>
  );
}

// ---------- Écran de repos ----------

function Repos(props: {
  fin: number;
  totalSec: number;
  prochain: string;
  raccourciActif: boolean;
  son: boolean;
  onPlus30: () => void;
  onFin: () => void;
}) {
  const [maintenant, setMaintenant] = useState(Date.now());
  const sonne = useRef(false);
  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 250);
    const reveil = () => setMaintenant(Date.now());
    document.addEventListener('visibilitychange', reveil);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', reveil);
    };
  }, []);
  const e = etatRepos(props.fin, props.totalSec, maintenant);
  useEffect(() => {
    if (e.termine && !sonne.current) {
      sonne.current = true;
      // Son seulement si l'application est à l'écran depuis la fin du repos (sinon le raccourci a déjà prévenu).
      if (props.son && document.visibilityState === 'visible' && maintenant - props.fin < 3000) bip(3);
    }
    if (!e.termine) sonne.current = false;
  }, [e.termine, props.son, props.fin, maintenant]);

  const r = 126;
  const c = 2 * Math.PI * r;
  return (
    <div className={`repos ${e.termine ? 'fini' : ''}`} role="dialog" aria-label="Repos">
      <div className="pile" style={{ alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800 }}>{e.termine ? 'Repos terminé' : 'Repos'}</span>
      </div>
      <div className="anneau">
        <svg viewBox="0 0 280 280" role="img" aria-label={`Temps restant : ${minSec(e.restantSec)}`}>
          <circle cx="140" cy="140" r={r} style={{ fill: 'none', strokeWidth: 16, stroke: e.termine ? 'rgba(0,0,0,0.15)' : 'var(--carte-2)' }} />
          <circle
            cx="140"
            cy="140"
            r={r}
            style={{
              fill: 'none',
              strokeWidth: 16,
              strokeLinecap: 'round',
              stroke: e.termine ? '#000' : 'var(--accent)',
              strokeDasharray: c,
              strokeDashoffset: c * e.progression,
              transition: 'stroke-dashoffset 250ms linear'
            }}
          />
        </svg>
        <div className="temps" aria-live="off">{e.termine ? 'Go' : minSec(e.restantSec)}</div>
      </div>
      {props.raccourciActif ? (
        <div className="pastille"><IconeMinuteur /><span>Notification programmée par le raccourci</span></div>
      ) : (
        <div className="pastille"><span>Son dans l'application seulement</span></div>
      )}
      <div className="pile" style={{ width: '100%', maxWidth: 520 }}>
        <div className="carte compacte">
          <span className="etiquette" style={{ color: 'inherit', opacity: 0.7 }}>Ensuite</span>
          <span className="gras" style={{ fontSize: 17 }}>{props.prochain}</span>
        </div>
        <div className="grille-2">
          <button className="bouton" style={{ minHeight: 56, fontSize: 18 }} onClick={props.onPlus30}>+30 s</button>
          <button className="bouton principal" onClick={props.onFin}>{e.termine ? 'Série suivante' : 'Passer'}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Fin de séance ----------

function FinSeance({ seance, series, onFermer }: { seance: Seance; series: Serie[]; onFermer: () => void }) {
  const dureeMin = Math.max(1, Math.round((Date.now() - seance.debut) / 60000));
  const volume = series.reduce((t, s) => t + (s.chargeKg ?? 0) * (s.reps ?? 0), 0);
  return (
    <div className="seance" role="dialog" aria-label="Fin de séance">
      <span className="surtitre">Bravo</span>
      <h1 className="titre">Séance terminée</h1>
      <div className="grille-3">
        <div className="carte compacte"><span className="grand-chiffre">{dureeMin}</span><span className="doux petit gras">minutes</span></div>
        <div className="carte compacte"><span className="grand-chiffre">{series.length}</span><span className="doux petit gras">séries</span></div>
        <div className="carte compacte"><span className="grand-chiffre">{kg(Math.round(volume))}</span><span className="doux petit gras">kg soulevés</span></div>
      </div>
      <div className="carte">
        {seance.plan.exercices.map((ex) => {
          const s = series.filter((x) => x.exerciceId === ex.exerciceId);
          const detail = s.length === 0
            ? 'non fait'
            : ex.mesure === 'test'
              ? s.map((x) => `${String(x.valeur ?? '').replace('.', ',')} ${NOMS_UNITES[epreuve(ex.exerciceId)?.unite ?? ''] ?? ''}`).join(' · ')
            : ex.mesure === 'tenue'
              ? s.map((x) => `${x.dureeSec} s`).join(' · ')
              : s.map((x) => `${x.reps}${x.chargeKg ? ` × ${kg(x.chargeKg)}` : ''}`).join(' · ');
          return (
            <div key={ex.exerciceId} className="element-liste">
              <span className="gras">{ex.nom}</span>
              <span className="doux">{detail}</span>
            </div>
          );
        })}
      </div>
      <div style={{ flexGrow: 1 }} />
      <button
        className="bouton principal geant"
        onClick={async () => {
          await terminerSeance(seance.id);
          onFermer();
          afficherBandeau('Séance enregistrée', () => modifierSeance(seance.id, { statut: 'en_cours', fin: undefined }));
        }}
      >
        Enregistrer la séance
      </button>
      <button
        className="bouton plein discret"
        onClick={() => void modifierSeance(seance.id, { exerciceIndex: Math.max(0, seance.plan.exercices.length - 1) })}
      >
        Revenir au dernier exercice
      </button>
    </div>
  );
}

export { Feuille } from '../Feuille';

// ---------- Épreuves de test ----------

export const NOMS_UNITES: Record<string, string> = { cm: 'cm', s: 's', m: 'm', palier: 'paliers' };

function SaisieTest({ ex, onValider }: { ex: ExercicePrevu; onValider: (v: number) => void }) {
  const e = epreuve(ex.exerciceId);
  const [texte, setTexte] = useState('');
  const v = Number(texte.replace(',', '.'));
  const ok = texte.trim() !== '' && Number.isFinite(v) && v > 0;
  return (
    <div className="carte" style={{ gap: 14 }}>
      <span className="etiquette">Meilleur résultat{e && e.essais > 1 ? ` sur ${e.essais} essais` : ''}</span>
      <label className="ligne" style={{ gap: 10, alignItems: 'baseline', justifyContent: 'center' }}>
        <input
          className="valeur-geante"
          inputMode="decimal"
          aria-label={`Résultat en ${e ? NOMS_UNITES[e.unite] : ''}`}
          placeholder="0"
          value={texte}
          onChange={(x) => setTexte(x.target.value.replace(/[^0-9.,]/g, ''))}
          style={{ width: 180, textAlign: 'center', background: 'var(--carte-2)', border: 'none', borderRadius: 16, color: 'var(--texte)', padding: '8px 0' }}
        />
        <span className="doux gras">{e ? NOMS_UNITES[e.unite] : ''}</span>
      </label>
      <button className="bouton principal geant" disabled={!ok} onClick={() => onValider(Math.round(v * 100) / 100)}>
        Enregistrer le résultat
      </button>
    </div>
  );
}

/**
 * Test navette de Léger : allers-retours de 20 m au rythme des bips.
 * Palier 1 à 8,5 km/h, + 0,5 km/h chaque minute ; un bip à chaque aller, trois au changement de palier.
 */
function Navette({ onValider }: { onValider: (palier: number) => void }) {
  const [debut, setDebut] = useState<number | undefined>();
  const [maintenant, setMaintenant] = useState(Date.now());
  const dernierAller = useRef(-1);
  useEffect(() => {
    if (debut === undefined) return;
    const t = setInterval(() => setMaintenant(Date.now()), 100);
    return () => clearInterval(t);
  }, [debut]);

  // Position dans le test : chaque palier dure environ 1 minute (nombre entier d'allers).
  let palier = 1;
  let allers = 0;
  let allersDansPalier = 0;
  let dansAller = 0;
  if (debut !== undefined) {
    let t = (maintenant - debut) / 1000;
    for (;;) {
      const d = dureeNavette(palier);
      const n = Math.max(1, Math.round(60 / d));
      if (t < n * d) {
        allersDansPalier = Math.floor(t / d);
        dansAller = 1 - (t - allersDansPalier * d) / d;
        allers += allersDansPalier;
        break;
      }
      t -= n * d;
      allers += n;
      palier++;
    }
  }
  useEffect(() => {
    if (debut === undefined) return;
    if (allers !== dernierAller.current) {
      const nouveauPalier = allersDansPalier === 0 && allers > 0;
      if (dernierAller.current >= 0) bip(nouveauPalier ? 3 : 1);
      dernierAller.current = allers;
    }
  }, [allers, allersDansPalier, debut]);

  if (debut === undefined) {
    return (
      <div className="carte" style={{ gap: 14 }}>
        <span className="doux">Deux lignes à 20 m. Gardez l’application ouverte, son activé (pas en mode silencieux) : chaque bip = vous devez être sur l’autre ligne.</span>
        <button className="bouton principal geant" onClick={() => { preparerSon(); bip(1); dernierAller.current = 0; setDebut(Date.now()); setMaintenant(Date.now()); }}>
          Démarrer le test
        </button>
        <SaisieManuellePalier onValider={onValider} />
      </div>
    );
  }
  return (
    <div className="carte" style={{ alignItems: 'center', gap: 12 }}>
      <span className="etiquette">Palier</span>
      <span className="valeur-geante" style={{ fontSize: 96 }}>{palier}</span>
      <span className="doux gras">{(8 + 0.5 * palier).toString().replace('.', ',')} km/h · aller {allers + 1}</span>
      <div className="barre-progres" style={{ width: '100%', height: 10 }}><div style={{ width: `${Math.round(dansAller * 100)}%`, transition: 'none' }} /></div>
      <button className="bouton principal geant" onClick={() => onValider(palier)}>J’arrête : palier {palier}</button>
      <span className="doux petit">VO2 max estimée si vous arrêtez maintenant : {String(vo2DepuisPalier(palier)).replace('.', ',')} ml/kg/min</span>
    </div>
  );
}

function SaisieManuellePalier({ onValider }: { onValider: (palier: number) => void }) {
  const [p, setP] = useState(6);
  return (
    <div className="ligne ecartee">
      <span className="doux petit">Déjà fait ailleurs ? Palier atteint :</span>
      <div className="ligne" style={{ gap: 6 }}>
        <button className="bouton" style={{ width: 44 }} aria-label="Palier moins" onClick={() => setP(Math.max(1, p - 1))}>−</button>
        <span className="gras" style={{ minWidth: 24, textAlign: 'center' }}>{p}</span>
        <button className="bouton" style={{ width: 44 }} aria-label="Palier plus" onClick={() => setP(p + 1)}>+</button>
        <button className="bouton" onClick={() => onValider(p)}>OK</button>
      </div>
    </div>
  );
}
