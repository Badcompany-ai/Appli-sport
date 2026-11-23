import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
// Police étroite pour les gros chiffres (chrono, charges, calories) : plus grands dans la même place.
import '@fontsource/barlow-condensed/latin-700.css';
import './styles.css';
import { App } from './ui/App';

// Le programme de mise à jour : une nouvelle version est téléchargée en silence,
// puis installée seulement quand l'utilisateur le décide (jamais en pleine séance).
let installer: (recharger?: boolean) => Promise<void> = async () => undefined;
const abonnes = new Set<() => void>();
let majPrete = false;
installer = registerSW({
  onNeedRefresh() {
    majPrete = true;
    abonnes.forEach((f) => f());
  }
});

function Racine() {
  const [maj, setMaj] = useState(majPrete);
  useEffect(() => {
    const f = () => setMaj(true);
    abonnes.add(f);
    return () => {
      abonnes.delete(f);
    };
  }, []);
  return <App majDisponible={maj} installerMaj={() => void installer(true)} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Racine />
  </StrictMode>
);
