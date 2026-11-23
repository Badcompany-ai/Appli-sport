import { useLiveQuery } from 'dexie-react-hooks';
import { calculerBilan, semaineActive } from '../data/bilan';
import { lireReglage } from '../data/operations';
import { coherence, lectureCroisee } from '../domain/bilan';
import { ecartJournalier, NUTRITION_DEFAUT, type ReglageNutrition } from '../domain/nutrition';
import { nombre } from '../domain/format';
import { lundiDe } from '../domain/profil';
import { useReglage } from './reglages';
import { usePoids } from './corps';
import { Feuille } from './Feuille';

const JOUR = 86400000;
const jourMois = (t: number) => new Date(t).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long' });

export function titreSemaine(lundi: number): string {
  return `Semaine du ${jourMois(lundi)} au ${jourMois(lundi + 6 * JOUR)}`;
}

/** Lundis des semaines passées qui contiennent des séances ou des mesures (de la plus récente à la plus ancienne). */
export function useSemainesPassees(n = 8): number[] | undefined {
  return useLiveQuery(async () => {
    const lundi = lundiDe(new Date()).getTime();
    const l: number[] = [];
    for (let i = 1; i <= n; i++) {
      const d = new Date(lundi);
      d.setDate(d.getDate() - 7 * i);
      if (await semaineActive(d.getTime())) l.push(d.getTime());
    }
    return l;
  });
}

export function FeuilleBilan({ lundi, onFermer }: { lundi: number; onFermer: () => void }) {
  const [profil] = useReglage('profil');
  const [sommeil] = useReglage('sommeil');
  const [fatigues] = useReglage('fatigues');
  const { poids } = usePoids();
  const reglage = useLiveQuery(() => lireReglage<ReglageNutrition>('nutrition', NUTRITION_DEFAUT));
  const b = useLiveQuery(() => calculerBilan(lundi, { seancesPrevues: profil?.seancesParSemaine ?? 4, sommeil, fatigues }), [lundi, profil?.seancesParSemaine, sommeil, fatigues]);
  return (
    <Feuille titre="Bilan de la semaine" onFermer={onFermer}>
      <span className="doux petit gras">{titreSemaine(lundi)}</span>
      {!b || !reglage ? (
        <span className="doux">Calcul…</span>
      ) : (
        <>
          <div className="grille-3">
            <div className="carte compacte"><span className="grand-chiffre">{b.seancesFaites}<small>/{b.seancesPrevues}</small></span><span className="doux petit gras">séances</span></div>
            <div className="carte compacte"><span className="grand-chiffre">{nombre(b.volumeKg / 1000, 1)}<small> t</small></span><span className="doux petit gras">soulevées</span></div>
            <div className="carte compacte"><span className="grand-chiffre">{b.records.length}</span><span className="doux petit gras">record{b.records.length > 1 ? 's' : ''}</span></div>
          </div>
          <div className="carte" aria-label="Lecture croisée">
            {lectureCroisee(b).map((l) => <span key={l}>{l}</span>)}
            {reglage.mode !== 'maintien' && coherence(b, (ecartJournalier(reglage, poids) * 7) / 7700) && (
              <span className="gras">{coherence(b, (ecartJournalier(reglage, poids) * 7) / 7700)}</span>
            )}
          </div>
          {b.records.length > 0 && <span className="petit">Records : {b.records.join(', ')}.</span>}
          {b.activites.length > 0 && <span className="petit doux">Activités : {b.activites.map((a) => `${a.nom} (${a.minutes} min)`).join(', ')}.</span>}
          {b.recommandation && (
            <div className="carte compacte alerte"><span className="gras">Recommandation</span><span className="petit">{b.recommandation}</span></div>
          )}
          <span className="doux petit">Estimations, pas des prescriptions médicales. Une semaine seule varie beaucoup : la tendance sur plusieurs semaines compte davantage.</span>
        </>
      )}
      <button className="bouton principal plein" onClick={onFermer}>OK</button>
    </Feuille>
  );
}
