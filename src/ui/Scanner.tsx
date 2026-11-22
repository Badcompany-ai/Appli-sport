import { useEffect, useRef, useState } from 'react';

// Lecture d'un code-barres avec l'appareil photo (bibliothèque ZXing, chargée seulement à l'ouverture).
// Rien n'est envoyé ailleurs : l'image reste dans le téléphone, seul le numéro lu est utilisé.

export function Scanner({ onCode, onFermer }: { onCode: (code: string) => void; onFermer: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [manuel, setManuel] = useState('');

  useEffect(() => {
    let arret: (() => void) | undefined;
    let fini = false;
    (async () => {
      try {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
        const indices = new Map();
        indices.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]);
        const lecteur = new BrowserMultiFormatReader(indices);
        if (fini || !video.current) return;
        const controles = await lecteur.decodeFromConstraints({ video: { facingMode: 'environment' } }, video.current, (resultat) => {
          if (resultat && !fini) {
            fini = true;
            controles.stop();
            onCode(resultat.getText());
          }
        });
        arret = () => controles.stop();
        if (fini) arret();
      } catch (e) {
        const nom = (e as Error)?.name;
        setErreur(
          nom === 'NotAllowedError'
            ? 'L’appareil photo est refusé. Autorisez-le dans Réglages → Safari → Appareil photo, ou tapez le code ci-dessous.'
            : 'Appareil photo indisponible. Tapez le code ci-dessous.'
        );
      }
    })();
    return () => {
      fini = true;
      arret?.();
    };
  }, [onCode]);

  return (
    <div className="seance" role="dialog" aria-label="Scanner un code-barres" style={{ zIndex: 70 }}>
      <div className="ligne ecartee">
        <h2 className="titre-2">Scanner</h2>
        <button className="bouton" onClick={onFermer}>Fermer</button>
      </div>
      {!erreur && (
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '3 / 4' }}>
          <video ref={video} playsInline muted autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: '10%', right: '10%', top: '42%', height: '16%', border: '3px solid var(--accent)', borderRadius: 12 }} />
        </div>
      )}
      <span className="doux petit">{erreur ?? 'Placez le code-barres dans le cadre orange.'}</span>
      <form
        className="ligne"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          const c = manuel.replace(/\D/g, '');
          if (c.length >= 8) onCode(c);
        }}
      >
        <input className="champ-texte" inputMode="numeric" placeholder="Ou tapez le code (8 à 13 chiffres)" aria-label="Code-barres" value={manuel} onChange={(e) => setManuel(e.target.value)} />
        <button className="bouton principal" type="submit" disabled={manuel.replace(/\D/g, '').length < 8}>OK</button>
      </form>
    </div>
  );
}
