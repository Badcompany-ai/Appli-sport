import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { EXERCICES, NOMS_MOUVEMENTS, exercice, type Mouvement } from '../../domain/exercices';
import { NOMS_PHASES, NB_SEMAINES, contactsAuSol, indexSemaine, infoSemaine, seancesDeLaSemaine, type CleePhase } from '../../domain/programme';
import { NOMS_JOURS, PROFIL_INTERVIEW, depuisCle, joursDeSeance } from '../../domain/profil';
import { EPREUVES, TESTS_FORCE, TESTS_REPETITIONS, avancement, epreuve, etapes, proposerObjectif, resultatsTests, vo2DepuisPalier, type Objectif } from '../../domain/niveau';
import { dateLongue } from '../../domain/format';
import { appliquerProgression, lettresFaites } from '../../data/programme';
import { dureeEstimeeMin } from '../../domain/demo';
import { detailPrevu } from './Aujourdhui';
import type { SeancePrevue } from '../../domain/types';
import { useReglage } from '../reglages';
import { Fiche } from '../Fiche';
import { Feuille } from '../Feuille';
import { afficherBandeau } from '../bandeau';

function sansAccents(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const PHASES: { cle: CleePhase; semaines: number }[] = [
  { cle: 'reprise', semaines: 2 },
  { cle: 'c1', semaines: 6 },
  { cle: 'c2', semaines: 6 },
  { cle: 'c3', semaines: 6 },
  { cle: 'c4', semaines: 6 }
];

function nomTest(id: string): { nom: string; unite: string; sens: 'haut' | 'bas' } {
  const e = epreuve(id);
  if (e) return { nom: e.nom, unite: e.unite === 'palier' ? 'paliers' : e.unite, sens: e.sens };
  if (TESTS_FORCE.includes(id)) return { nom: `${exercice(id)?.nom} (maximum estimé)`, unite: 'kg', sens: 'haut' };
  return { nom: `${exercice(id)?.nom} (répétitions)`, unite: 'rép.', sens: 'haut' };
}

function f(x: number): string {
  return String(Math.round(x * 100) / 100).replace('.', ',');
}

export function Programme() {
  const [profil, setProfil] = useReglage('profil');
  const [objectifs, setObjectifs] = useReglage('objectifs');
  const [fiche, setFiche] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [edition, setEdition] = useState<Objectif | null>(null);
  const [valeurEdition, setValeurEdition] = useState('');

  const index = profil ? indexSemaine(depuisCle(profil.debut), new Date()) : -1;
  const [semaineChoisie, setSemaineChoisie] = useState<number | null>(null);
  const [seanceVue, setSeanceVue] = useState<SeancePrevue | null>(null);
  const semaineCourante = Math.max(0, index);
  const semaineAffichee = semaineChoisie ?? semaineCourante;
  const info = infoSemaine(semaineCourante);
  const infoVue = infoSemaine(semaineAffichee);
  const avecCharges = useLiveQuery(async () => (seanceVue ? appliquerProgression(seanceVue) : undefined), [seanceVue?.id]);
  const semaine = useMemo(() => (profil ? seancesDeLaSemaine(profil, semaineAffichee) : []), [profil, semaineAffichee]);
  const faites = useLiveQuery(() => lettresFaites(semaineAffichee), [semaineAffichee]);
  const resultats = useLiveQuery(async () => resultatsTests(await db.seances.toArray(), await db.series.toArray()));

  const proposes = useMemo(() => {
    if (!resultats || !profil) return [];
    const ids = [...EPREUVES.map((e) => e.id), ...TESTS_FORCE, ...TESTS_REPETITIONS];
    return ids
      .map((id) => {
        const r = resultats.get(id);
        if (!r?.length) return undefined;
        const n = nomTest(id);
        return proposerObjectif(id, n.nom, n.unite, n.sens, r[0].valeur, profil.echeance);
      })
      .filter((o): o is Objectif => !!o);
  }, [resultats, profil]);

  const groupes = useMemo(() => {
    const q = sansAccents(recherche.trim());
    const filtres = EXERCICES.filter((e) => !q || sansAccents(e.nom).includes(q) || sansAccents(NOMS_MOUVEMENTS[e.mouvement]).includes(q));
    const m = new Map<Mouvement, typeof EXERCICES>();
    for (const e of filtres) m.set(e.mouvement, [...(m.get(e.mouvement) ?? []), e]);
    return [...m.entries()];
  }, [recherche]);

  const jours = profil ? joursDeSeance(profil) : [];
  const actuel = (id: string) => resultats?.get(id)?.at(-1)?.valeur;

  return (
    <main className="ecran">
      <h1 className="titre">Programme</h1>

      {profil && (
        <section className="carte" aria-label="Ligne de temps">
          <span className="doux petit gras">
            {index < 0 ? `Commence le ${dateLongue(depuisCle(profil.debut).getTime()).toLowerCase()}` : info.apresProgramme ? 'Programme de 6 mois terminé : maintien en attendant le suivant' : `Semaine ${index + 1} sur ${NB_SEMAINES}`}
          </span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>{NOMS_PHASES[info.phase]}{info.allegee ? ' · semaine allégée et tests' : ''}</span>
          {profil.debut !== PROFIL_INTERVIEW.debut && (
            <button
              className="bouton plein"
              onClick={async () => {
                const avant = profil;
                await setProfil({ ...profil, debut: PROFIL_INTERVIEW.debut, echeance: PROFIL_INTERVIEW.echeance });
                setSemaineChoisie(null);
                afficherBandeau('Début remis au 28 décembre', () => setProfil(avant));
              }}
            >
              Remettre le début au lundi 28 décembre
            </button>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 6fr 6fr 6fr 6fr', gap: 4 }} aria-hidden="true">
            {PHASES.map((p, i) => {
              const debutPhase = PHASES.slice(0, i).reduce((n, x) => n + x.semaines, 0);
              const dedans = index >= debutPhase && index < debutPhase + p.semaines;
              const fini = index >= debutPhase + p.semaines;
              const part = dedans ? (index - debutPhase + 1) / p.semaines : fini ? 1 : 0;
              return (
                <div key={p.cle} className="pile" style={{ gap: 4 }}>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--accent-piste)', overflow: 'hidden' }}>
                    <div style={{ height: 8, width: `${part * 100}%`, background: 'var(--accent)' }} />
                  </div>
                  <span className="doux" style={{ fontSize: 10, fontWeight: 600 }}>{p.cle === 'reprise' ? 'Rep.' : p.cle.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {profil && (
        <section className="pile" aria-label="Séances de la semaine">
          <div className="ligne ecartee">
            <button className="bouton rond" aria-label="Semaine précédente" disabled={semaineAffichee <= 0} onClick={() => setSemaineChoisie(semaineAffichee - 1)}>‹</button>
            <div className="pile" style={{ gap: 0, alignItems: 'center' }}>
              <h2 className="titre-2">{semaineAffichee === semaineCourante ? (index < 0 ? 'Première semaine' : 'Cette semaine') : `Semaine ${semaineAffichee + 1}`}</h2>
              <span className="doux petit">{NOMS_PHASES[infoVue.phase]}{infoVue.allegee ? ' · allégée et tests' : ''}</span>
            </div>
            <button className="bouton rond" aria-label="Semaine suivante" disabled={semaineAffichee >= NB_SEMAINES - 1} onClick={() => setSemaineChoisie(semaineAffichee + 1)}>›</button>
          </div>
          {semaineAffichee !== semaineCourante && (
            <button className="bouton discret" onClick={() => setSemaineChoisie(null)}>Revenir à la semaine en cours</button>
          )}
          <div className="carte" style={{ gap: 0, paddingTop: 4, paddingBottom: 4 }}>
            {semaine.map((s, i) => {
              const fait = faites?.has(s.programme?.lettre ?? '');
              const prochaine = !fait && semaine.slice(0, i).every((x) => faites?.has(x.programme?.lettre ?? ''));
              // Semaine en cours : une séance dont le jour suggéré est passé est « manquée » (elle reste à faire).
              const ajd = (new Date().getDay() + 6) % 7;
              const enCours = semaineAffichee === semaineCourante && index >= 0;
              const manquee = !fait && enCours && jours[i] !== undefined && jours[i] < ajd;
              const passee = !fait && (semaineAffichee < semaineCourante);
              return (
                <button key={s.id} className="element-liste" style={{ background: 'none', border: 'none', borderBottom: '1px solid #222224', width: '100%', textAlign: 'left' }} onClick={() => setSeanceVue(s)} aria-label={`Voir la séance : ${s.nom}`}>
                  <div className="pile" style={{ gap: 2 }}>
                    <span className={`gras ${prochaine ? 'mention-orange' : ''}`}>{s.nom}</span>
                    <span className="doux petit">
                      {jours[i] !== undefined ? `${NOMS_JOURS[jours[i]]} (suggéré)` : ''} · {s.exercices.length} {s.programme?.type === 'test' ? 'épreuves ou exercices' : 'exercices'}
                    </span>
                  </div>
                  <span className={`petit gras ${fait ? '' : 'doux'}`}>{fait ? 'Faite' : passee ? 'Non faite' : manquee ? (prochaine ? 'Manquée · à faire' : 'Manquée') : prochaine ? 'Prochaine' : 'À venir'} ›</span>
                </button>
              );
            })}
          </div>
          <span className="doux petit">Touchez une séance pour voir son contenu. Une séance manquée n’est pas perdue : elle reste la prochaine à faire.</span>
        </section>
      )}

      <section className="pile" aria-label="Objectifs">
        <h2 className="titre-2">Objectifs</h2>
        {objectifs && objectifs.length > 0 ? (
          <div className="carte">
            {objectifs.map((o) => {
              const v = actuel(o.id) ?? o.depart;
              const a = avancement(o, v);
              return (
                <button key={o.id} className="lien-liste" onClick={() => { setEdition(o); setValeurEdition(f(o.cible)); }}>
                  <div className="ligne ecartee" style={{ width: '100%' }}>
                    <span className="gras">{o.nom}</span>
                    <span className="petit gras">{Math.round(a * 100)} %</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--accent-piste)', width: '100%', overflow: 'hidden' }}>
                    <div style={{ height: 8, width: `${a * 100}%`, background: 'var(--accent)' }} />
                  </div>
                  <span className="doux petit">
                    Départ {f(o.depart)} · actuel {f(v)} · objectif {f(o.cible)} {o.unite} · étapes {etapes(o).map(f).join(' → ')}
                  </span>
                </button>
              );
            })}
            {proposes.some((p) => !objectifs.some((o) => o.id === p.id)) && (
              <button
                className="bouton plein"
                onClick={async () => {
                  const avant = objectifs;
                  await setObjectifs([...objectifs, ...proposes.filter((p) => !objectifs.some((o) => o.id === p.id))]);
                  afficherBandeau('Nouveaux objectifs ajoutés', () => setObjectifs(avant));
                }}
              >
                Ajouter les objectifs des nouveaux tests ({proposes.filter((p) => !objectifs.some((o) => o.id === p.id)).length})
              </button>
            )}
          </div>
        ) : proposes.length > 0 ? (
          <div className="carte">
            <span className="gras">Objectifs proposés d’après votre test</span>
            <span className="doux petit">Gains prudents pour 6 mois ; touchez un objectif plus tard pour le modifier ou le retirer.</span>
            {proposes.map((o) => (
              <div key={o.id} className="element-liste">
                <span className="petit">{o.nom}</span>
                <span className="petit gras">{f(o.depart)} → {f(o.cible)} {o.unite}</span>
              </div>
            ))}
            <button className="bouton principal plein" onClick={async () => { await setObjectifs(proposes); afficherBandeau('Objectifs enregistrés', () => setObjectifs(null)); }}>
              Accepter ces objectifs
            </button>
          </div>
        ) : (
          <div className="carte compacte">
            <span className="doux">Les objectifs seront proposés après votre premier test complet (fin de la semaine 2), à partir de vos résultats.</span>
          </div>
        )}
      </section>

      {resultats && resultats.size > 0 && (
        <section className="pile" aria-label="Résultats des tests">
          <h2 className="titre-2">Résultats des tests</h2>
          <div className="carte" style={{ gap: 0, paddingTop: 4, paddingBottom: 4 }}>
            {[...resultats.entries()].map(([id, l]) => {
              const n = nomTest(id);
              const dernier = l[l.length - 1];
              return (
                <div key={id} className="element-liste">
                  <div className="pile" style={{ gap: 2 }}>
                    <span className="gras">{n.nom}</span>
                    <span className="doux petit">{l.length > 1 ? `Premier : ${f(l[0].valeur)} ${n.unite}` : dateLongue(dernier.date)}</span>
                  </div>
                  <span className="gras">
                    {f(dernier.valeur)} {n.unite}
                    {id === 'test-navette' ? ` · VO2 ${f(vo2DepuisPalier(dernier.valeur))}` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <h2 className="titre-2">Exercices ({EXERCICES.length})</h2>
      <input
        className="champ-texte"
        type="search"
        placeholder="Rechercher (squat, tirage, saut…)"
        aria-label="Rechercher un exercice"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      {groupes.length === 0 && <div className="carte compacte"><span className="doux">Aucun exercice ne correspond à « {recherche} ».</span></div>}
      {groupes.map(([mouvement, liste]) => (
        <section key={mouvement} className="pile" style={{ gap: 6 }}>
          <span className="etiquette">{NOMS_MOUVEMENTS[mouvement]}</span>
          <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
            {liste.map((e) => (
              <button key={e.id} className="lien-liste" onClick={() => setFiche(e.id)}>
                <span className="gras">{e.nom}</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {seanceVue && (
        <Feuille titre={seanceVue.nom} onFermer={() => setSeanceVue(null)}>
          <span className="doux petit">
            Semaine {(seanceVue.programme?.semaine ?? 0) + 1} · {NOMS_PHASES[infoSemaine(seanceVue.programme?.semaine ?? 0).phase]} · environ {dureeEstimeeMin(seanceVue) + (seanceVue.echauffement?.length ? 10 : 0)} min{contactsAuSol(seanceVue) ? ` · ${contactsAuSol(seanceVue)} contacts au sol` : ''}
          </span>
          {seanceVue.echauffement && (
            <div className="pile" style={{ gap: 6 }}>
              <span className="etiquette">Échauffement</span>
              <ul className="liste-etapes" style={{ fontSize: 14 }}>{seanceVue.echauffement.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}
          <span className="etiquette">Exercices</span>
          <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
            {(avecCharges ?? seanceVue).exercices.map((e) => (
              <button key={e.exerciceId} className="lien-liste" onClick={() => !e.testId && setFiche(e.exerciceId)} aria-label={e.testId ? e.nom : `Fiche : ${e.nom}`}>
                <span className="gras">{e.nom}</span>
                <span className="doux petit">{detailPrevu(e)} · repos {e.reposSec >= 60 ? `${Math.floor(e.reposSec / 60)} min${e.reposSec % 60 ? ` ${e.reposSec % 60} s` : ''}` : `${e.reposSec} s`}</span>
                {e.consigne && <span className="mention-orange petit">{e.consigne}</span>}
              </button>
            ))}
          </div>
          <span className="doux petit">Prévu en salle : le lieu et le matériel du jour adaptent la séance au moment de la commencer. Les charges se précisent avec vos résultats.</span>
        </Feuille>
      )}
      {fiche && <Fiche id={fiche} onFermer={() => setFiche(null)} />}
      {edition && objectifs && (
        <Feuille titre={edition.nom} onFermer={() => setEdition(null)}>
          <label className="pile" style={{ gap: 6 }}>
            <span className="etiquette">Objectif ({edition.unite})</span>
            <input className="champ-texte" inputMode="decimal" value={valeurEdition} onChange={(e) => setValeurEdition(e.target.value)} />
          </label>
          <button
            className="bouton principal plein"
            onClick={async () => {
              const v = Number(valeurEdition.replace(',', '.'));
              if (!Number.isFinite(v) || v <= 0) return afficherBandeau('Valeur invalide');
              const avant = objectifs;
              await setObjectifs(objectifs.map((o) => (o.id === edition.id ? { ...o, cible: v } : o)));
              setEdition(null);
              afficherBandeau('Objectif modifié', () => setObjectifs(avant));
            }}
          >
            Enregistrer
          </button>
          <button
            className="bouton plein danger"
            onClick={async () => {
              const avant = objectifs;
              await setObjectifs(objectifs.filter((o) => o.id !== edition.id));
              setEdition(null);
              afficherBandeau('Objectif retiré', () => setObjectifs(avant));
            }}
          >
            Retirer cet objectif
          </button>
        </Feuille>
      )}
    </main>
  );
}
