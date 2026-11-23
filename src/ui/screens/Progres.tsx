import { PastilleSeance } from '../couleurs';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { mettreALaCorbeille, modifierSeance, modifierSerie, restaurerSeance, enregistrerSerie, supprimerSerie } from '../../data/operations';
import { exercice, NOMS_MUSCLES, type Muscle } from '../../domain/exercices';
import { REPERES, volumeParMuscle } from '../../domain/adaptation';
import { forceRelative, indicateur, pointsExercice, type Indicateur } from '../../domain/records';
import { dateLongue, kg } from '../../domain/format';
import { lundiDe, versCle } from '../../domain/profil';
import type { Serie } from '../../domain/types';
import { useReglage } from '../reglages';
import { Feuille } from '../Feuille';
import { Courbe } from '../Courbe';
import { Fiche } from '../Fiche';
import { afficherBandeau } from '../bandeau';
import { SectionCorps, usePoids } from '../corps';
import { FeuilleBilan, titreSemaine, useSemainesPassees } from '../Bilan';
import { TableauxAnalyse, useEcranLarge } from '../Analyse';

const f1 = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');

function formatIndicateur(ind: Indicateur): (v: number) => string {
  if (ind === 'max') return (v) => `${f1(v)} kg`;
  if (ind === 'duree') return (v) => `${Math.round(v)} s`;
  if (ind === 'reps') return (v) => `${Math.round(v)} rép.`;
  return (v) => f1(v);
}

const NOMS_INDICATEURS: Record<Indicateur, string> = {
  max: 'Maximum estimé (1 répétition)',
  duree: 'Meilleure durée',
  reps: 'Meilleure série (répétitions)',
  valeur: 'Résultat'
};

export function Progres() {
  const seances = useLiveQuery(() => db.seances.toArray());
  const series = useLiveQuery(() => db.series.toArray());
  const [profil] = useReglage('profil');
  const { poids } = usePoids();
  const [exerciceVu, setExerciceVu] = useState<string | null>(null);
  const [seanceVue, setSeanceVue] = useState<string | null>(null);
  const [fiche, setFiche] = useState<string | null>(null);
  const [bilan, setBilan] = useState<number | null>(null);
  const semaines = useSemainesPassees();
  const large = useEcranLarge();

  const terminees = useMemo(() => (seances ?? []).filter((s) => s.statut === 'terminee' && !s.supprimeeLe).sort((a, b) => b.debut - a.debut), [seances]);

  const exercices = useMemo(() => {
    if (!seances || !series) return [];
    const ids = new Set(series.filter((s) => terminees.some((t) => t.id === s.seanceId)).map((s) => s.exerciceId));
    return [...ids]
      .filter((id) => exercice(id))
      .map((id) => {
        const pts = pointsExercice(id, seances, series, poids);
        return { id, pts, dernier: pts[pts.length - 1], record: Math.max(0, ...pts.map((p) => p.valeur)) };
      })
      .filter((e) => e.pts.length > 0)
      .sort((a, b) => (b.dernier?.date ?? 0) - (a.dernier?.date ?? 0));
  }, [seances, series, terminees, poids]);

  // Régularité : séances faites par semaine, sur les 6 dernières semaines.
  const regularite = useMemo(() => {
    const lundi = lundiDe(new Date());
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(lundi);
      d.setDate(d.getDate() - 7 * (5 - i));
      const fin = new Date(d);
      fin.setDate(fin.getDate() + 7);
      const n = terminees.filter((s) => s.debut >= d.getTime() && s.debut < fin.getTime() && s.plan.programme?.type !== 'mobilite').length;
      return { cle: versCle(d), n, courante: i === 5 };
    });
  }, [terminees]);
  const objectif = profil?.seancesParSemaine ?? 4;

  // Volume des 7 derniers jours par groupe musculaire (règle 7.7).
  const volume = useMemo(() => {
    if (!series) return undefined;
    const depuis = Date.now() - 7 * 86400000;
    const ids = new Set(terminees.map((t) => t.id));
    return volumeParMuscle(series.filter((s) => s.faiteLe >= depuis && ids.has(s.seanceId)));
  }, [series, terminees]);

  if (!seances || !series) return <main className="ecran" aria-busy="true" />;

  const vu = exerciceVu ? exercices.find((e) => e.id === exerciceVu) : undefined;

  return (
    <main className="ecran large">
      <h1 className="titre">Progrès</h1>
      {large && terminees.length > 0 && (
        <TableauxAnalyse
          exercices={exercices.map((e) => ({ id: e.id, nom: exercice(e.id)?.nom ?? e.id, pts: e.pts, record: e.record }))}
          format={(id, v) => formatIndicateur(indicateur(id))(v)}
        />
      )}

      {profil?.modules?.corps !== false && <SectionCorps />}

      {semaines && semaines.length > 0 && (
        <section className="pile" aria-label="Bilans">
          <h2 className="titre-2">Bilans des semaines</h2>
          <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
            {semaines.map((l) => (
              <button key={l} className="lien-liste" onClick={() => setBilan(l)}>
                <span className="gras">{titreSemaine(l)}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {bilan !== null && <FeuilleBilan lundi={bilan} onFermer={() => setBilan(null)} />}

      {terminees.length === 0 ? (
        <div className="carte">
          <span className="gras">Rien à afficher pour l’instant</span>
          <span className="doux">Vos graphiques, records et l’historique apparaîtront ici dès votre première séance enregistrée.</span>
        </div>
      ) : (
        <>
          <section className="pile" aria-label="Régularité">
            <h2 className="titre-2">Régularité</h2>
            <div className="carte compacte">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 6, alignItems: 'end', height: 72 }} aria-label="Séances par semaine, 6 dernières semaines">
                {regularite.map((s) => (
                  <div key={s.cle} className="pile" style={{ gap: 4, alignItems: 'center' }}>
                    <span className="petit gras">{s.n}</span>
                    <div style={{ width: '100%', height: Math.max(4, Math.min(1, s.n / objectif) * 40), borderRadius: '4px 4px 0 0', background: s.courante ? 'var(--accent)' : '#3a3a3c' }} />
                  </div>
                ))}
              </div>
              <span className="doux petit">Séances par semaine (6 dernières, cette semaine en orange) · objectif {objectif}</span>
            </div>
          </section>

          {volume && (
            <section className="pile" aria-label="Volume par muscle">
              <h2 className="titre-2">Volume des 7 derniers jours</h2>
              <div className="carte" style={{ gap: 10 }}>
                {(Object.keys(REPERES) as Muscle[]).map((m) => {
                  const v = Math.round(volume[m] * 2) / 2;
                  const bas = v < REPERES[m] / 2;
                  return (
                    <div key={m} className="pile" style={{ gap: 4 }}>
                      <div className="ligne ecartee petit">
                        <span className={`gras ${bas ? 'mention-orange' : ''}`}>{NOMS_MUSCLES[m]}</span>
                        <span className="doux">{String(v).replace('.', ',')} / {REPERES[m]} séries</span>
                      </div>
                      <div className="barre-volume"><div style={{ width: `${Math.min(100, (v / REPERES[m]) * 100)}%` }} /></div>
                    </div>
                  );
                })}
                <span className="doux petit">Séries difficiles : 1 pour un muscle principal, ½ pour un muscle secondaire. En orange : moins de la moitié du repère.</span>
              </div>
            </section>
          )}

          <section className="pile" aria-label="Exercices">
            <h2 className="titre-2">Exercices</h2>
            <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
              {exercices.map((e) => {
                const ind = indicateur(e.id);
                const fmt = formatIndicateur(ind);
                const prec = e.pts[e.pts.length - 2];
                const tendance = prec ? (e.dernier!.valeur > prec.valeur ? '↑' : e.dernier!.valeur < prec.valeur ? '↓' : '=') : '';
                return (
                  <button key={e.id} className="lien-liste" onClick={() => setExerciceVu(e.id)}>
                    <div className="ligne ecartee" style={{ width: '100%' }}>
                      <span className="gras">{exercice(e.id)?.nom}</span>
                      <span className="gras">{fmt(e.dernier!.valeur)} {tendance}</span>
                    </div>
                    <span className="doux petit">
                      {e.pts.length} séance{e.pts.length > 1 ? 's' : ''} · record {fmt(e.record)}
                      {ind === 'max' ? ` · ${f1(forceRelative(e.record, poids))} × votre poids` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="pile" aria-label="Historique">
            <h2 className="titre-2">Historique</h2>
            <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
              {terminees.slice(0, 50).map((s) => (
                <button key={s.id} className="lien-liste" onClick={() => setSeanceVue(s.id)} aria-label={`Séance du ${dateLongue(s.debut)} : ${s.nom}`}>
                  <span className="gras ligne" style={{ gap: 8 }}><PastilleSeance lettre={s.plan.programme?.lettre} />{s.nom}</span>
                  <span className="doux petit">
                    {dateLongue(s.debut)} · {series.filter((x) => x.seanceId === s.id).length} séries · {Math.max(1, Math.round(((s.fin ?? s.debut) - s.debut) / 60000))} min
                  </span>
                </button>
              ))}
            </div>
            <span className="doux petit">Touchez une séance pour la corriger (charges, répétitions, date) ou la supprimer.</span>
          </section>
        </>
      )}

      {vu && (
        <Feuille titre={exercice(vu.id)?.nom ?? ''} onFermer={() => setExerciceVu(null)}>
          <span className="etiquette">{NOMS_INDICATEURS[indicateur(vu.id)]}</span>
          <Courbe points={vu.pts} format={formatIndicateur(indicateur(vu.id))} />
          <div className="grille-3">
            <div className="carte compacte"><span className="doux petit gras">Record</span><span className="gras" style={{ fontSize: 18 }}>{formatIndicateur(indicateur(vu.id))(vu.record)}</span></div>
            <div className="carte compacte"><span className="doux petit gras">Séances</span><span className="gras" style={{ fontSize: 18 }}>{vu.pts.length}</span></div>
            {indicateur(vu.id) === 'max' ? (
              <div className="carte compacte"><span className="doux petit gras">Force relative</span><span className="gras" style={{ fontSize: 18 }}>{f1(forceRelative(vu.record, poids))} ×</span></div>
            ) : (
              <div className="carte compacte"><span className="doux petit gras">Dernière</span><span className="gras" style={{ fontSize: 18 }}>{formatIndicateur(indicateur(vu.id))(vu.dernier!.valeur)}</span></div>
            )}
          </div>
          {indicateur(vu.id) === 'max' && (
            <span className="doux petit">
              Maximum estimé avec la formule d’Epley à partir de vos séries de 1 à 10 répétitions{exercice(vu.id)?.charge === 'corps' ? ', poids du corps compris (charge totale = poids du corps + lest)' : ''}. Force relative = maximum estimé ÷ votre poids ({f1(poids)} kg).
            </span>
          )}
          <button className="bouton plein" onClick={() => setFiche(vu.id)}>Fiche de l’exercice</button>
        </Feuille>
      )}

      {seanceVue && <FeuilleHistorique seanceId={seanceVue} onFermer={() => setSeanceVue(null)} />}
      {fiche && <Fiche id={fiche} onFermer={() => setFiche(null)} />}
    </main>
  );
}

/** Correction d'une séance passée : date, charges, répétitions, durées, suppression. */
function FeuilleHistorique({ seanceId, onFermer }: { seanceId: string; onFermer: () => void }) {
  const seance = useLiveQuery(() => db.seances.get(seanceId), [seanceId]);
  const series = useLiveQuery(async () => (await db.series.where('seanceId').equals(seanceId).toArray()).sort((a, b) => a.faiteLe - b.faiteLe), [seanceId]);
  if (!seance || !series) return null;

  const groupes = new Map<string, Serie[]>();
  for (const s of series) groupes.set(s.exerciceId, [...(groupes.get(s.exerciceId) ?? []), s]);

  const changerDate = async (valeur: string) => {
    const [a, m, j] = valeur.split('-').map(Number);
    if (!a) return;
    const d = new Date(seance.debut);
    const nouvelle = new Date(a, m - 1, j, d.getHours(), d.getMinutes()).getTime();
    const delta = nouvelle - seance.debut;
    const avant = { debut: seance.debut, fin: seance.fin };
    await modifierSeance(seance.id, { debut: nouvelle, fin: seance.fin !== undefined ? seance.fin + delta : undefined });
    afficherBandeau('Date modifiée', () => modifierSeance(seance.id, avant));
  };

  return (
    <Feuille titre={seance.nom} onFermer={onFermer}>
      <label className="reglage">
        <span className="gras">Date</span>
        <input type="date" className="champ-texte" style={{ width: 'auto' }} value={versCle(new Date(seance.debut))} onChange={(e) => void changerDate(e.target.value)} />
      </label>
      {[...groupes.entries()].map(([exId, ss]) => {
        const ex = exercice(exId);
        const nom = ex?.nom ?? seance.plan.exercices.find((e) => e.exerciceId === exId)?.nom ?? exId;
        const pas = seance.plan.exercices.find((e) => e.exerciceId === exId)?.pasKg ?? 2.5;
        return (
          <div key={exId} className="carte compacte" style={{ gap: 6 }}>
            <span className="gras">{nom}</span>
            {ss.map((s, i) => (
              <div key={s.id} className="ligne ecartee" style={{ gap: 6, flexWrap: 'wrap' }}>
                <span className="doux petit" style={{ minWidth: 54 }}>Série {i + 1}</span>
                {s.valeur !== undefined ? (
                  <Reglette label="Résultat" valeur={s.valeur} pas={s.valeur >= 10 ? 1 : 0.01} format={f1} onChange={(v) => void modifierSerie(s.id, { valeur: v })} />
                ) : s.dureeSec !== undefined ? (
                  <Reglette label="Durée" valeur={s.dureeSec} pas={5} format={(v) => `${v} s`} onChange={(v) => void modifierSerie(s.id, { dureeSec: v })} />
                ) : (
                  <>
                    {s.chargeKg !== undefined && <Reglette label="Charge" valeur={s.chargeKg} pas={pas} format={(v) => `${kg(v)} kg`} onChange={(v) => void modifierSerie(s.id, { chargeKg: v })} />}
                    <Reglette label="Répétitions" valeur={s.reps ?? 0} pas={1} format={(v) => `${v}`} onChange={(v) => void modifierSerie(s.id, { reps: v })} />
                  </>
                )}
                <button
                  className="bouton discret danger"
                  style={{ minHeight: 40, padding: '0 8px' }}
                  aria-label={`Supprimer la série ${i + 1} de ${nom}`}
                  onClick={async () => {
                    const copie = { ...s };
                    await supprimerSerie(s.id);
                    afficherBandeau('Série supprimée', async () => {
                      const { id: _id, ...reste } = copie;
                      void _id;
                      await enregistrerSerie(reste);
                    });
                  }}
                >
                  Suppr.
                </button>
              </div>
            ))}
          </div>
        );
      })}
      {series.length === 0 && <span className="doux">Aucune série enregistrée dans cette séance.</span>}
      <button
        className="bouton plein danger"
        onClick={async () => {
          await mettreALaCorbeille(seance.id);
          onFermer();
          afficherBandeau('Séance mise à la corbeille', () => restaurerSeance(seance.id));
        }}
      >
        Supprimer la séance
      </button>
    </Feuille>
  );
}

function Reglette({ label, valeur, pas, format, onChange }: { label: string; valeur: number; pas: number; format: (v: number) => string; onChange: (v: number) => void }) {
  const r = (x: number) => Math.round(x * 100) / 100;
  return (
    <div className="ligne" style={{ gap: 4 }}>
      <button className="bouton" style={{ width: 36, minHeight: 36, padding: 0 }} aria-label={`${label} : moins`} onClick={() => onChange(Math.max(0, r(valeur - pas)))}>−</button>
      <span className="gras" style={{ minWidth: 64, textAlign: 'center' }}>{format(valeur)}</span>
      <button className="bouton" style={{ width: 36, minHeight: 36, padding: 0 }} aria-label={`${label} : plus`} onClick={() => onChange(r(valeur + pas))}>+</button>
    </div>
  );
}
