// Onglets dont le contenu arrive dans un jalon suivant : jamais d'écran vide,
// on explique ce qui viendra et quand.

const CONTENU = {
  programme: {
    titre: 'Programme',
    jalon: 'J3',
    points: ['Reprise de 2 semaines, puis 4 cycles de 6 semaines', 'Vos 4 séances de la semaine, déplaçables', 'Tests de niveau et objectifs']
  },
  progres: {
    titre: 'Progrès',
    jalon: 'J4',
    points: ['Graphiques par exercice et records', 'Maximum estimé et force relative', 'Tests athlétiques et bilan de la semaine']
  },
  nutrition: {
    titre: 'Nutrition',
    jalon: 'J6',
    points: ['Calories et protéines du jour', 'Scan des codes-barres et recherche d’aliments', 'Repas enregistrés et copie de la veille']
  }
} as const;

export function Bientot({ onglet }: { onglet: keyof typeof CONTENU }) {
  const c = CONTENU[onglet];
  return (
    <main className="ecran">
      <h1 className="titre">{c.titre}</h1>
      <div className="carte">
        <span className="doux petit gras">Arrive au jalon {c.jalon}</span>
        <ul className="liste-etapes">
          {c.points.map((p) => <li key={p}>{p}</li>)}
        </ul>
      </div>
    </main>
  );
}
