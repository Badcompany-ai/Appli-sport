import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  corbeille,
  ecrireReglage,
  exporterTout,
  importerTout,
  listeCopies,
  restaurerSeance
} from '../../data/operations';
import { lireSauvegarde, nomFichier, type ContenuSauvegarde, type ResumeSauvegarde } from '../../domain/sauvegarde';
import { lienRaccourci } from '../../domain/repos';
import { dateLongue, ilYA } from '../../domain/format';
import { bip, choisirTypeSon, estInstallee, partagerFichier, preparerSon, stockagePersistant } from '../../platform/appareil';
import { afficherBandeau } from '../bandeau';
import { useReglage } from '../reglages';
import { Feuille } from '../Feuille';

const PHRASE_RACCOURCI =
  'Attends le nombre de secondes reçu en entrée, puis fais vibrer l’appareil, puis affiche une notification « Repos terminé ».';

export function Profil({ majDisponible, installerMaj }: { majDisponible: boolean; installerMaj: () => void }) {
  const [raccourci, setRaccourci] = useReglage('raccourci');
  const [son, setSon] = useReglage('sonApplication');
  const [prioritaire, setPrioritaire] = useReglage('sonPrioritaire');
  const [derniereSauvegarde] = useReglage('derniereSauvegarde');
  const copies = useLiveQuery(() => listeCopies());
  const poubelle = useLiveQuery(() => corbeille());
  const [persistant, setPersistant] = useState<boolean | undefined>();
  const [aImporter, setAImporter] = useState<{ contenu: ContenuSauvegarde; resume: ResumeSauvegarde; source: string } | null>(null);
  const [guide, setGuide] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const maintenant = Date.now();

  useEffect(() => {
    void stockagePersistant().then(setPersistant);
  }, []);

  async function exporter() {
    const contenu = await exporterTout();
    const r = await partagerFichier(nomFichier(Date.now()), JSON.stringify(contenu));
    if (r !== 'annule') {
      await ecrireReglage('derniereSauvegarde', Date.now());
      afficherBandeau(r === 'partage' ? 'Sauvegarde envoyée' : 'Sauvegarde téléchargée');
    }
  }

  async function choisirFichier(f: File | undefined) {
    if (!f) return;
    const r = lireSauvegarde(await f.text());
    if (!r.ok) afficherBandeau(r.erreur);
    else setAImporter({ contenu: r.contenu, resume: r.resume, source: f.name });
    if (fichier.current) fichier.current.value = '';
  }

  return (
    <main className="ecran">
      <h1 className="titre">Profil</h1>

      {!estInstallee() && (
        <section className="carte" aria-label="Installer l'application">
          <span className="gras">Installer sur l'écran d'accueil</span>
          <ol className="liste-etapes">
            <li>Dans Safari, touchez le bouton <b>Partager</b> (carré avec une flèche vers le haut).</li>
            <li>Choisissez <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>.</li>
            <li>Ouvrez ensuite l'application depuis sa nouvelle icône : elle fonctionnera sans connexion.</li>
          </ol>
        </section>
      )}

      {majDisponible && (
        <section className="carte compacte">
          <span className="gras">Nouvelle version disponible</span>
          <span className="doux petit">Vos données sont conservées. L'installation recharge l'application.</span>
          <button className="bouton principal plein" onClick={installerMaj}>Installer la mise à jour</button>
        </section>
      )}

      <section className="pile" aria-label="Fin de repos">
        <h2 className="titre-2">Fin de repos</h2>
        <div className="carte">
          <label className="reglage">
            <span className="pile" style={{ gap: 2 }}>
              <span className="gras">Notification hors de l'application</span>
              <span className="doux petit">Via le raccourci « {raccourci.nom} » de l'app Raccourcis</span>
            </span>
            <input type="checkbox" role="switch" className="interrupteur" checked={raccourci.actif} onChange={(e) => void setRaccourci({ ...raccourci, actif: e.target.checked })} />
          </label>
          <button className="bouton plein" onClick={() => setGuide(true)}>Créer ou vérifier le raccourci</button>
          <a className="bouton plein" href={lienRaccourci(raccourci.nom, 15)} style={{ textDecoration: 'none' }}>
            Tester : notification dans 15 secondes
          </a>
          <label className="reglage">
            <span className="pile" style={{ gap: 2 }}>
              <span className="gras">Son dans l'application</span>
              <span className="doux petit">Se mélange à votre musique sans la couper</span>
            </span>
            <input type="checkbox" role="switch" className="interrupteur" checked={son} onChange={(e) => void setSon(e.target.checked)} />
          </label>
          <label className="reglage">
            <span className="pile" style={{ gap: 2 }}>
              <span className="gras">Son prioritaire (essai)</span>
              <span className="doux petit">Pour tenter de sonner en mode silencieux : la musique baisse un instant pendant le bip</span>
            </span>
            <input type="checkbox" role="switch" className="interrupteur" checked={prioritaire} onChange={(e) => { choisirTypeSon(e.target.checked ? 'transient' : 'ambient'); void setPrioritaire(e.target.checked); }} />
          </label>
          <button className="bouton plein" onClick={() => { preparerSon(); setTimeout(() => bip(3), 50); }}>Tester le son</button>
          <span className="doux petit">Rien entendu ? Vérifiez que l'iPhone n'est pas en mode silencieux et que le volume est monté : iOS coupe ce type de son en mode silencieux, même si la musique continue.</span>
        </div>
      </section>

      <section className="pile" aria-label="Données">
        <h2 className="titre-2">Mes données</h2>
        <div className="carte">
          <span className="doux petit">
            Vos données restent sur ce téléphone. {persistant === true ? 'Stockage protégé : l’iPhone ne les effacera pas de lui-même.' : persistant === false ? 'Installez l’application sur l’écran d’accueil pour mieux protéger le stockage.' : ''}
          </span>
          <span className="petit">
            Dernière sauvegarde : <b>{derniereSauvegarde ? `${dateLongue(derniereSauvegarde)} (${ilYA(derniereSauvegarde, maintenant)})` : 'jamais'}</b>
          </span>
          <button className="bouton principal plein" onClick={exporter}>Exporter une sauvegarde</button>
          <button className="bouton plein" onClick={() => fichier.current?.click()}>Importer une sauvegarde</button>
          <input ref={fichier} type="file" accept="application/json,.json" hidden onChange={(e) => void choisirFichier(e.target.files?.[0])} />
        </div>

        <div className="carte" style={{ gap: 0 }}>
          <span className="gras" style={{ paddingBottom: 6 }}>Copies automatiques</span>
          <span className="doux petit" style={{ paddingBottom: 6 }}>Une par jour, les 7 dernières, gardées sur ce téléphone.</span>
          {copies && copies.length === 0 && <span className="doux petit">La première sera créée au prochain lancement.</span>}
          {copies?.map((c) => (
            <div key={c.id} className="element-liste">
              <span className="petit">
                {dateLongue(c.creeeLe)} · {new Date(c.creeeLe).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                {c.raison === 'avant_import' ? ' · avant import' : ''}
              </span>
              <button
                className="bouton discret"
                onClick={() => {
                  const r = lireSauvegarde(c.contenu);
                  if (r.ok) setAImporter({ contenu: r.contenu, resume: r.resume, source: `copie du ${dateLongue(c.creeeLe)}` });
                }}
              >
                Revenir
              </button>
            </div>
          ))}
        </div>

        <div className="carte" style={{ gap: 0 }}>
          <span className="gras" style={{ paddingBottom: 6 }}>Corbeille</span>
          <span className="doux petit" style={{ paddingBottom: 6 }}>Les séances supprimées y restent 30 jours.</span>
          {poubelle && poubelle.length === 0 && <span className="doux petit">La corbeille est vide.</span>}
          {poubelle?.map((s) => (
            <div key={s.id} className="element-liste">
              <span className="petit">{s.nom} · {dateLongue(s.debut)}</span>
              <button
                className="bouton discret"
                onClick={async () => {
                  await restaurerSeance(s.id);
                  afficherBandeau('Séance restaurée');
                }}
              >
                Restaurer
              </button>
            </div>
          ))}
        </div>
      </section>

      <p className="doux petit" style={{ textAlign: 'center' }}>Version {__VERSION__} · jalon J1</p>

      {aImporter && (
        <Feuille titre="Remplacer les données ?" onFermer={() => setAImporter(null)}>
          <span>
            Source : <b>{aImporter.source}</b>
            {aImporter.resume.exporteeLe ? ` (créée le ${dateLongue(aImporter.resume.exporteeLe)})` : ''}
          </span>
          <span>
            Elle contient <b>{aImporter.resume.seances} séance{aImporter.resume.seances > 1 ? 's' : ''}</b> et{' '}
            <b>{aImporter.resume.series} série{aImporter.resume.series > 1 ? 's' : ''}</b>.
          </span>
          <span className="doux petit">Vos données actuelles seront remplacées. Une copie de sécurité est faite avant, et reste disponible 30 jours dans « Copies automatiques ».</span>
          <button
            className="bouton principal plein"
            onClick={async () => {
              await importerTout(aImporter.contenu);
              setAImporter(null);
              afficherBandeau('Données remplacées');
            }}
          >
            Remplacer mes données
          </button>
          <button className="bouton plein" onClick={() => setAImporter(null)}>Annuler</button>
        </Feuille>
      )}

      {guide && (
        <Feuille titre="Raccourci « Repos »" onFermer={() => setGuide(false)}>
          <span className="doux">Une seule fois, environ 2 minutes. Le raccourci reçoit la durée du repos, attend, puis vous prévient par une notification qui ne coupe pas la musique.</span>
          <ol className="liste-etapes">
            <li>Ouvrez l'app <b>Raccourcis</b> et touchez <b>+</b>.</li>
            <li>
              Si l'écran <b>Décrire un raccourci</b> s'affiche, écrivez ou collez cette phrase :
              <div className="citation" style={{ marginTop: 8 }}>{PHRASE_RACCOURCI}</div>
              <button
                className="bouton plein"
                style={{ marginTop: 8 }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(PHRASE_RACCOURCI);
                    afficherBandeau('Phrase copiée');
                  } catch {
                    afficherBandeau('Copie impossible : sélectionnez la phrase à la main');
                  }
                }}
              >
                Copier la phrase
              </button>
            </li>
            <li>
              Sinon, dans l'éditeur, ajoutez dans l'ordre : <b>Attendre</b> (durée : touchez le champ et choisissez <b>Entrée du raccourci</b>), <b>Faire vibrer l'appareil</b>, <b>Afficher la notification</b> (« Repos terminé »).
            </li>
            <li>Vérifiez que la durée de l'action <b>Attendre</b> utilise bien l'<b>entrée du raccourci</b>, et non un nombre fixe.</li>
            <li>Nommez le raccourci exactement <b>{raccourci.nom}</b>.</li>
            <li>Revenez ici, activez « Notification hors de l'application », puis touchez <b>Tester</b>.</li>
          </ol>
          <button className="bouton principal plein" onClick={() => setGuide(false)}>Compris</button>
        </Feuille>
      )}
    </main>
  );
}
