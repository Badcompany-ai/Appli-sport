// Accès aux fonctions de l'iPhone disponibles pour une application web.

// ---------- Son ----------

let contexte: AudioContext | undefined;

/**
 * À appeler lors d'un toucher : iOS n'autorise le son qu'après une action de l'utilisateur.
 * Le type « ambient » mélange nos sons à la musique au lieu de la couper (Safari 17 et plus).
 */
export function preparerSon() {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'ambient';
    if (!contexte) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      contexte = new Ctor();
    }
    if (contexte.state === 'suspended') void contexte.resume();
  } catch {
    // Pas de son disponible : l'écran signale quand même la fin du repos.
  }
}

/** Trois bips courts. */
export function bip(nombre = 3) {
  if (!contexte) return;
  const t0 = contexte.currentTime + 0.02;
  for (let i = 0; i < nombre; i++) {
    const osc = contexte.createOscillator();
    const gain = contexte.createGain();
    osc.type = 'sine';
    osc.frequency.value = i === nombre - 1 ? 1320 : 880;
    const debut = t0 + i * 0.22;
    gain.gain.setValueAtTime(0.0001, debut);
    gain.gain.exponentialRampToValueAtTime(0.5, debut + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, debut + 0.16);
    osc.connect(gain).connect(contexte.destination);
    osc.start(debut);
    osc.stop(debut + 0.18);
  }
}

// ---------- Écran allumé ----------

let verrou: { release: () => Promise<void> } | undefined;
let souhaite = false;

async function demanderVerrou() {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    if (nav.wakeLock && document.visibilityState === 'visible') verrou = await nav.wakeLock.request('screen');
  } catch {
    // Refusé (batterie faible, etc.) : sans conséquence sur les données.
  }
}

document.addEventListener('visibilitychange', () => {
  if (souhaite && document.visibilityState === 'visible') void demanderVerrou();
});

export function garderEcranAllume(oui: boolean) {
  souhaite = oui;
  if (oui) void demanderVerrou();
  else {
    void verrou?.release().catch(() => undefined);
    verrou = undefined;
  }
}

// ---------- Stockage persistant ----------

/** Demande à l'iPhone de ne jamais effacer les données de lui-même. */
export async function demanderStockagePersistant(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function stockagePersistant(): Promise<boolean | undefined> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : undefined;
  } catch {
    return undefined;
  }
}

/** L'application est-elle ouverte depuis l'écran d'accueil (et non dans Safari) ? */
export function estInstallee(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

// ---------- Partage de fichier ----------

/** Envoie un fichier via le menu de partage (AirDrop, Fichiers, iCloud Drive), sinon le télécharge. */
export async function partagerFichier(nom: string, texte: string): Promise<'partage' | 'telecharge' | 'annule'> {
  const fichier = new File([texte], nom, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [fichier] })) {
    try {
      await nav.share({ files: [fichier], title: nom });
      return 'partage';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'annule';
    }
  }
  const url = URL.createObjectURL(fichier);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'telecharge';
}
