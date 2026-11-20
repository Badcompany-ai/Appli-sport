import { useCallback, useEffect, useState } from 'react';
import { Aujourdhui } from './screens/Aujourdhui';
import { ModeSeance } from './screens/ModeSeance';
import { Profil } from './screens/Profil';
import { Bientot } from './screens/Bientot';
import { Programme } from './screens/Programme';
import { Depart } from './screens/Depart';
import { useReglage } from './reglages';
import { Bandeau } from './bandeau';
import { IconeAujourdhui, IconeNutrition, IconeProfil, IconeProgramme, IconeProgres } from './icones';
import { copieQuotidienneSiBesoin, seanceEnCours, viderCorbeilleAncienne } from '../data/operations';

type Onglet = 'aujourdhui' | 'programme' | 'progres' | 'nutrition' | 'profil';

const ONGLETS: { id: Onglet; nom: string; Icone: () => JSX.Element }[] = [
  { id: 'aujourdhui', nom: "Aujourd'hui", Icone: IconeAujourdhui },
  { id: 'programme', nom: 'Programme', Icone: IconeProgramme },
  { id: 'progres', nom: 'Progrès', Icone: IconeProgres },
  { id: 'nutrition', nom: 'Nutrition', Icone: IconeNutrition },
  { id: 'profil', nom: 'Profil', Icone: IconeProfil }
];

const TROIS_HEURES = 3 * 3600000;

function ongletMemorise(): Onglet {
  try {
    const o = sessionStorage.getItem('onglet') as Onglet | null;
    return o && ONGLETS.some((x) => x.id === o) ? o : 'aujourdhui';
  } catch {
    return 'aujourdhui';
  }
}

export function App({ majDisponible, installerMaj }: { majDisponible: boolean; installerMaj: () => void }) {
  const [onglet, setOnglet] = useState<Onglet>(ongletMemorise);
  const [seanceOuverte, setSeanceOuverte] = useState<string | null>(null);

  useEffect(() => {
    try { sessionStorage.setItem('onglet', onglet); } catch { /* sans importance */ }
    window.scrollTo(0, 0);
  }, [onglet]);

  useEffect(() => {
    // Au lancement : copie de sécurité du jour, ménage de la corbeille,
    // et reprise automatique d'une séance interrompue récemment.
    void copieQuotidienneSiBesoin();
    void viderCorbeilleAncienne();
    void seanceEnCours().then((s) => {
      if (s && Date.now() - s.debut < TROIS_HEURES) setSeanceOuverte(s.id);
    });
  }, []);

  const fermerSeance = useCallback(() => setSeanceOuverte(null), []);
  const [profil, setProfil, profilLu] = useReglage('profil');
  const [modifierProfil, setModifierProfil] = useState(false);

  return (
    <>
      {onglet === 'aujourdhui' && <Aujourdhui ouvrirSeance={setSeanceOuverte} allerA={setOnglet} />}
      {onglet === 'programme' && <Programme />}
      {onglet === 'progres' && <Bientot onglet="progres" />}
      {onglet === 'nutrition' && <Bientot onglet="nutrition" />}
      {onglet === 'profil' && <Profil majDisponible={majDisponible && !seanceOuverte} installerMaj={installerMaj} modifierProfil={() => setModifierProfil(true)} />}

      <nav className="onglets" aria-label="Navigation principale">
        {ONGLETS.map(({ id, nom, Icone }) => (
          <button key={id} className="onglet" aria-current={onglet === id ? 'page' : undefined} onClick={() => setOnglet(id)}>
            <Icone />
            {nom}
          </button>
        ))}
      </nav>

      {seanceOuverte && <ModeSeance seanceId={seanceOuverte} onFermer={fermerSeance} />}
      {profilLu && (!profil || modifierProfil) && (
        <Depart
          initial={profil}
          onAnnuler={profil ? () => setModifierProfil(false) : undefined}
          onTerminer={async (p) => {
            await setProfil(p);
            setModifierProfil(false);
            setOnglet('aujourdhui');
          }}
        />
      )}
      <Bandeau />
    </>
  );
}
