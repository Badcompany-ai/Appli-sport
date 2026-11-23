import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { calculerBilan } from '../data/bilan';
import { nombre } from '../domain/format';
import { useReglage } from './reglages';
import { titreSemaine, useSemainesPassees } from './Bilan';
import type { PointCourbe } from './Courbe';

/** Vrai sur un grand écran (Mac, iPad en paysage). */
export function useEcranLarge(): boolean {
  const requete = '(min-width: 900px)';
  const [large, setLarge] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(requete).matches);
  useEffect(() => {
    const m = window.matchMedia?.(requete);
    if (!m) return;
    const f = () => setLarge(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return !!large;
}

const JOUR = 86400000;

/** Tableaux comparatifs du mode analyse (idée I9). */
export function TableauxAnalyse({ exercices, format }: { exercices: { id: string; nom: string; pts: PointCourbe[]; record: number }[]; format: (id: string, v: number) => string }) {
  const [profil] = useReglage('profil');
  const [sommeil] = useReglage('sommeil');
  const [fatigues] = useReglage('fatigues');
  const semaines = useSemainesPassees(8);
  const bilans = useLiveQuery(
    async () => (semaines ? Promise.all(semaines.map((l) => calculerBilan(l, { seancesPrevues: profil?.seancesParSemaine ?? 4, sommeil, fatigues }))) : undefined),
    [semaines, profil?.seancesParSemaine, sommeil, fatigues]
  );
  const maintenant = Date.now();
  return (
    <section className="pile" aria-label="Analyse">
      <h2 className="titre-2">Analyse</h2>
      <div className="grille-analyse">
        <div className="carte defile-x">
          <span className="gras">Exercices</span>
          <table className="tableau">
            <thead>
              <tr><th>Exercice</th><th>Dernier</th><th>Il y a 4 sem.</th><th>Évolution</th><th>Record</th><th>Séances</th></tr>
            </thead>
            <tbody>
              {exercices.map((e) => {
                const dernier = e.pts[e.pts.length - 1];
                const ancien = [...e.pts].reverse().find((p) => p.date <= maintenant - 28 * JOUR);
                const evol = ancien && ancien.valeur ? ((dernier.valeur - ancien.valeur) / ancien.valeur) * 100 : undefined;
                return (
                  <tr key={e.id}>
                    <td>{e.nom}</td>
                    <td>{format(e.id, dernier.valeur)}</td>
                    <td>{ancien ? format(e.id, ancien.valeur) : '—'}</td>
                    <td>{evol !== undefined ? `${evol > 0 ? '+' : ''}${nombre(evol, 1)} %` : '—'}</td>
                    <td>{format(e.id, e.record)}</td>
                    <td>{e.pts.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="carte defile-x">
          <span className="gras">Semaines</span>
          <table className="tableau">
            <thead>
              <tr><th>Semaine</th><th>Séances</th><th>Tonnage</th><th>Poids</th><th>kcal</th><th>Prot.</th><th>Sommeil</th></tr>
            </thead>
            <tbody>
              {(bilans ?? []).map((b) => (
                <tr key={b.lundi}>
                  <td>{titreSemaine(b.lundi).replace('Semaine du ', '')}</td>
                  <td>{b.seancesFaites}/{b.seancesPrevues}</td>
                  <td>{nombre(b.volumeKg / 1000, 1)} t</td>
                  <td>{b.poids ? `${nombre(b.poids.apres, 1)} kg` : '—'}</td>
                  <td>{b.nutrition.kcal !== undefined ? nombre(b.nutrition.kcal) : '—'}</td>
                  <td>{b.nutrition.proteines !== undefined ? `${nombre(b.nutrition.proteines)} g` : '—'}</td>
                  <td>{b.sommeil.moyenne !== undefined ? `${nombre(b.sommeil.moyenne, 1)} h` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bilans && bilans.length === 0 && <span className="doux petit">Les semaines terminées apparaîtront ici.</span>}
        </div>
      </div>
    </section>
  );
}
