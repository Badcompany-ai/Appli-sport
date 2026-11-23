import { useEffect, useRef, useState } from 'react';

// Lecture d'un code-barres avec l'appareil photo (bibliothèque ZXing, chargée seulement à l'ouverture).
// Rien n'est envoyé ailleurs : l'image reste dans le téléphone, seul le numéro lu est utilisé.
// La caméra n'est ouverte qu'une fois par affichage : iOS gère mal les ouvertures répétées (écran noir).

async function creerLecteur() {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
  const indices = new Map();
  indices.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]);
  indices.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(indices);
}

type Etat = 'ouverture' | 'actif' | 'refuse' | 'indisponible' | 'photo';

export function Scanner({ onCode, onFermer }: { onCode: (code: string) => void; onFermer: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const rappel = useRef(onCode);
  rappel.current = onCode;
  const [etat, setEtat] = useState<Etat>('ouverture');
  const [lenteur, setLenteur] = useState(false);
  const [manuel, setManuel] = useState('');
  const [messagePhoto, setMessagePhoto] = useState<string | null>(null);

  useEffect(() => {
    let fini = false;
    let flux: MediaStream | undefined;
    let controles: { stop: () => void } | undefined;
    const arreter = () => {
      controles?.stop();
      flux?.getTracks().forEach((t) => t.stop());
    };
    const delai = setTimeout(() => setLenteur(true), 5000);
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('non supporté'), { name: 'NotSupportedError' });
        flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (fini || !video.current) return arreter();
        const v = video.current;
        v.setAttribute('playsinline', 'true');
        v.muted = true;
        v.srcObject = flux;
        await v.play().catch(() => undefined);
        setEtat('actif');
        const lecteur = await creerLecteur();
        if (fini) return arreter();
        controles = await lecteur.decodeFromStream(flux, v, (resultat) => {
          if (resultat && !fini) {
            fini = true;
            arreter();
            rappel.current(resultat.getText());
          }
        });
        if (fini) arreter();
      } catch (e) {
        if (!fini) setEtat((e as Error)?.name === 'NotAllowedError' ? 'refuse' : 'indisponible');
      }
    })();
    return () => {
      fini = true;
      clearTimeout(delai);
      arreter();
    };
  }, []);

  async function lirePhoto(fichier: File) {
    setMessagePhoto('Lecture de la photo…');
    const url = URL.createObjectURL(fichier);
    try {
      const lecteur = await creerLecteur();
      const r = await lecteur.decodeFromImageUrl(url);
      rappel.current(r.getText());
    } catch {
      setMessagePhoto('Code non lu sur cette photo. Reprenez-la de plus près, bien nette, ou tapez le code.');
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const texte =
    etat === 'refuse'
      ? 'L’appareil photo est refusé. Fermez puis rouvrez l’application pour qu’iOS le redemande, ou utilisez « Photographier le code ».'
      : etat === 'indisponible'
        ? 'Caméra en direct indisponible. Utilisez « Photographier le code » ou tapez le code.'
        : etat === 'ouverture'
          ? 'Ouverture de la caméra…'
          : 'Placez le code-barres dans le cadre orange.';

  return (
    <div className="seance" role="dialog" aria-label="Scanner un code-barres" style={{ zIndex: 70 }}>
      <div className="ligne ecartee">
        <h2 className="titre-2">Scanner</h2>
        <button className="bouton" onClick={onFermer}>Fermer</button>
      </div>
      {(etat === 'ouverture' || etat === 'actif') && (
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '4 / 3' }}>
          <video ref={video} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: '10%', right: '10%', top: '35%', height: '30%', border: '3px solid var(--accent)', borderRadius: 12 }} />
        </div>
      )}
      <span className="doux petit" aria-live="polite">{texte}</span>
      {lenteur && etat !== 'refuse' && etat !== 'indisponible' && (
        <span className="doux petit">Écran noir ? Utilisez « Photographier le code » : c’est l’appareil photo de l’iPhone qui s’ouvre.</span>
      )}
      <label className="bouton plein" style={{ cursor: 'pointer' }}>
        Photographier le code
        <input
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Photographier le code-barres"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void lirePhoto(f);
          }}
        />
      </label>
      {messagePhoto && <span className="petit" aria-live="polite">{messagePhoto}</span>}
      <form
        className="ligne"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          const c = manuel.replace(/\D/g, '');
          if (c.length >= 8) rappel.current(c);
        }}
      >
        <input className="champ-texte" inputMode="numeric" placeholder="Ou tapez le code (8 à 13 chiffres)" aria-label="Code-barres" value={manuel} onChange={(e) => setManuel(e.target.value)} />
        <button className="bouton principal" type="submit" disabled={manuel.replace(/\D/g, '').length < 8}>OK</button>
      </form>
    </div>
  );
}
