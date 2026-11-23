import { useEffect, useRef, useState } from 'react';
import { FACTEURS, tempsReel } from '../domain/chrono';

// Idée I3 : chronométrer un sprint sur une vidéo, image par image. La vidéo reste dans le téléphone.

export function ChronoVideo({ onTemps, onFermer }: { onTemps: (secondes: number) => void; onFermer: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duree, setDuree] = useState(0);
  const [t, setT] = useState(0);
  const [facteur, setFacteur] = useState(1);
  const [depart, setDepart] = useState<number | undefined>();
  const [arrivee, setArrivee] = useState<number | undefined>();

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  const aller = (x: number) => {
    const v = video.current;
    if (!v) return;
    const c = Math.max(0, Math.min(duree || v.duration || 0, x));
    v.currentTime = c;
    setT(c);
  };
  const pas = facteur > 1 ? 1 / 30 : 1 / 120;
  const resultat = depart !== undefined && arrivee !== undefined ? tempsReel(depart, arrivee, facteur) : undefined;
  const sec = (x: number) => `${x.toFixed(3).replace('.', ',')} s`;

  return (
    <div className="seance" role="dialog" aria-label="Chronométrer sur une vidéo" style={{ zIndex: 70, overflowY: 'auto' }}>
      <div className="ligne ecartee">
        <h2 className="titre-2">Chrono vidéo</h2>
        <button className="bouton" onClick={onFermer}>Fermer</button>
      </div>
      {!url ? (
        <>
          <span className="petit">Filmez le sprint de côté, si possible en <b>ralenti</b> (app Appareil photo → Ralenti), avec la ligne de départ et d’arrivée dans l’image. Puis choisissez la vidéo.</span>
          <label className="bouton principal plein" style={{ cursor: 'pointer' }}>
            Choisir la vidéo
            <input
              type="file"
              accept="video/*"
              aria-label="Choisir la vidéo du sprint"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setUrl(URL.createObjectURL(f));
              }}
            />
          </label>
        </>
      ) : (
        <>
          <video
            ref={video}
            src={url}
            playsInline
            muted
            preload="auto"
            style={{ width: '100%', borderRadius: 16, background: '#000', maxHeight: '45dvh' }}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setDuree(v.duration);
              // iOS n'affiche la première image qu'après une lecture.
              void v.play().then(() => v.pause()).catch(() => undefined);
            }}
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          />
          <input className="curseur" type="range" min={0} max={duree || 1} step={0.001} value={t} aria-label="Position dans la vidéo" onChange={(e) => aller(Number(e.target.value))} />
          <div className="grille-2" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
            <button className="bouton" aria-label="Reculer de 10 images" onClick={() => aller(t - 10 * pas)}>«</button>
            <button className="bouton" aria-label="Image précédente" onClick={() => aller(t - pas)}>‹</button>
            <button className="bouton" aria-label="Image suivante" onClick={() => aller(t + pas)}>›</button>
            <button className="bouton" aria-label="Avancer de 10 images" onClick={() => aller(t + 10 * pas)}>»</button>
          </div>
          <div className="grille-2">
            <button className="bouton" onClick={() => setDepart(t)}>{depart === undefined ? 'Marquer le départ' : `Départ : ${sec(depart)}`}</button>
            <button className="bouton" onClick={() => setArrivee(t)}>{arrivee === undefined ? 'Marquer l’arrivée' : `Arrivée : ${sec(arrivee)}`}</button>
          </div>
          <div className="pile" style={{ gap: 6 }}>
            <span className="petit gras">La vidéo se lit-elle au ralenti ici ?</span>
            <div className="pilules" role="group" aria-label="Ralenti">
              {FACTEURS.map((f) => (
                <button key={f.valeur} className="bouton" aria-pressed={facteur === f.valeur} onClick={() => setFacteur(f.valeur)} style={{ fontSize: 13 }}>{f.nom}</button>
              ))}
            </div>
          </div>
          <div className="carte compacte" style={{ alignItems: 'center' }}>
            <span className="grand-chiffre">{resultat !== undefined ? `${resultat.toFixed(2).replace('.', ',')} s` : '—'}</span>
            <span className="doux petit">{resultat === undefined ? 'Marquez le premier mouvement, puis le passage du buste sur la ligne.' : 'Temps réel du sprint'}</span>
          </div>
          <button className="bouton principal plein" disabled={resultat === undefined} onClick={() => resultat !== undefined && onTemps(resultat)}>Utiliser ce temps</button>
        </>
      )}
    </div>
  );
}
