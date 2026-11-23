import { useLiveQuery } from 'dexie-react-hooks';
import { additionner } from '../domain/aliments';
import { NUTRITION_DEFAUT, objectifsDuJour, type ReglageNutrition } from '../domain/nutrition';
import { journalDuJour, sportDuJour } from '../data/nutrition';
import { lireReglage } from '../data/operations';
import { nombre } from '../domain/format';
import type { Profil } from '../domain/profil';
import { usePoids } from './corps';
import { cleDuJour } from './journee';

// Anneaux du jour, façon Apple Forme : séances de la semaine, protéines et calories du jour.
// Toucher un anneau ouvre l'onglet qui le détaille.

function Anneau({ part, couleur }: { part: number; couleur: string }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, part));
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
      <circle cx="22" cy="22" r={r} style={{ fill: 'none', stroke: `color-mix(in srgb, ${couleur} 22%, transparent)`, strokeWidth: 6 }} />
      {p > 0 && (
        <circle
          className="anneau-trait"
          cx="22"
          cy="22"
          r={r}
          style={{ fill: 'none', stroke: couleur, strokeWidth: 6, strokeLinecap: 'round', strokeDasharray: `${c * p} ${c}` }}
        />
      )}
    </svg>
  );
}

function Case({ part, couleur, valeur, nom, detail, onClick }: { part: number; couleur: string; valeur: string; nom: string; detail: string; onClick: () => void }) {
  return (
    <button className="case-anneau" onClick={onClick} aria-label={`${nom} : ${valeur} ${detail}`}>
      <Anneau part={part} couleur={couleur} />
      <span className="pile" style={{ gap: 0, minWidth: 0 }}>
        <span className="valeur-anneau">{valeur}</span>
        <span className="doux" style={{ fontSize: 'var(--t-1)', fontWeight: 600 }}>{nom}</span>
      </span>
    </button>
  );
}

export function Anneaux({ profil, seances, allerA }: {
  profil: Profil;
  /** Séances faites et prévues cette semaine (absent avant le début du programme). */
  seances?: { faites: number; total: number };
  allerA: (onglet: 'programme' | 'nutrition') => void;
}) {
  const jour = cleDuJour();
  const { poids } = usePoids();
  const avecNutrition = profil.modules?.nutrition !== false;
  const donnees = useLiveQuery(async () => {
    if (!avecNutrition) return null;
    const [reglage, entrees, sport] = await Promise.all([
      lireReglage<ReglageNutrition>('nutrition', NUTRITION_DEFAUT),
      journalDuJour(jour),
      sportDuJour(jour, poids)
    ]);
    const obj = objectifsDuJour(profil, poids, reglage, sport.reduce((t, s) => t + s.kcal, 0));
    const total = additionner(entrees.map((e) => e.nutriments));
    return { obj, total };
  }, [jour, poids, avecNutrition, profil]);

  if (!seances && !donnees) return null;
  return (
    <div className="anneaux" role="group" aria-label="Anneaux du jour">
      {seances && (
        <Case part={seances.faites / Math.max(1, seances.total)} couleur="var(--accent)" valeur={`${seances.faites}/${seances.total}`} nom="Séances" detail="cette semaine" onClick={() => allerA('programme')} />
      )}
      {donnees && (
        <>
          <Case part={donnees.total.proteines / Math.max(1, donnees.obj.proteines)} couleur="var(--bleu)" valeur={`${nombre(donnees.total.proteines)} g`} nom="Protéines" detail={`sur ${nombre(donnees.obj.proteines)} g`} onClick={() => allerA('nutrition')} />
          <Case part={donnees.total.kcal / Math.max(1, donnees.obj.kcal)} couleur="var(--texte)" valeur={nombre(donnees.total.kcal)} nom="Calories" detail={`sur ${nombre(donnees.obj.kcal)} kcal`} onClick={() => allerA('nutrition')} />
        </>
      )}
    </div>
  );
}
