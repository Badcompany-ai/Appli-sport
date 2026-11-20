import { useMemo, useState } from 'react';
import { EXERCICES, NOMS_MOUVEMENTS, type Mouvement } from '../../domain/exercices';
import { Fiche } from '../Fiche';

function sansAccents(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Onglet Programme : le programme arrive au jalon J3 ; la bibliothèque d'exercices est déjà là. */
export function Programme() {
  const [recherche, setRecherche] = useState('');
  const [fiche, setFiche] = useState<string | null>(null);
  const groupes = useMemo(() => {
    const q = sansAccents(recherche.trim());
    const filtres = EXERCICES.filter((e) => !q || sansAccents(e.nom).includes(q) || sansAccents(NOMS_MOUVEMENTS[e.mouvement]).includes(q));
    const m = new Map<Mouvement, typeof EXERCICES>();
    for (const e of filtres) m.set(e.mouvement, [...(m.get(e.mouvement) ?? []), e]);
    return [...m.entries()];
  }, [recherche]);

  return (
    <main className="ecran">
      <h1 className="titre">Programme</h1>
      <div className="carte compacte">
        <span className="doux petit gras">Arrive au jalon J3</span>
        <span>Reprise de 2 semaines, 4 cycles de 6 semaines, vos 4 séances de la semaine, tests de niveau et objectifs.</span>
      </div>

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
      {fiche && <Fiche id={fiche} onFermer={() => setFiche(null)} />}
    </main>
  );
}
