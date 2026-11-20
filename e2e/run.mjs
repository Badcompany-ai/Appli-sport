// Vérifications de bout en bout au format iPhone, sur la version construite (dist).
// Lancement : npm run build && npm run e2e
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}
const { chromium, devices } = playwright;

const PORT = 4179;
const URL = `http://localhost:${PORT}/Appli-sport/`;
const SORTIE = 'e2e/out';
mkdirSync(SORTIE, { recursive: true });

const serveur = spawn('node_modules/.bin/vite', ['preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((ok, ko) => {
  const t = setTimeout(() => ko(new Error('Le serveur ne démarre pas')), 20000);
  serveur.stdout.on('data', (d) => {
    if (String(d).includes(String(PORT))) {
      clearTimeout(t);
      ok();
    }
  });
});

let echecs = 0;
let etape = 0;
function verifier(condition, message) {
  etape++;
  if (condition) console.log(`  ✓ ${message}`);
  else {
    echecs++;
    console.log(`  ✗ ${message}`);
  }
}

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, acceptDownloads: true });
const page = await contexte.newPage();
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') erreurs.push(m.text());
});
const capture = async (nom) => {
  await page.waitForTimeout(400); // laisse finir les animations
  await page.screenshot({ path: `${SORTIE}/${nom}.png` });
};
const nbSeries = () =>
  page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('appli-sport');
        r.onsuccess = () => {
          const tx = r.result.transaction('series', 'readonly');
          const c = tx.objectStore('series').count();
          c.onsuccess = () => {
            ok(c.result);
            r.result.close();
          };
        };
      })
  );

try {
  console.log('Premier lancement');
  await page.goto(URL);
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  verifier(await page.getByText('Aucune séance pour l').isVisible(), 'écran de première utilisation non vide');
  await capture('01-aujourdhui');

  console.log('Mode séance');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByRole('heading', { name: 'Squat arrière' }).waitFor();
  verifier(await page.getByText('Première fois sur cet exercice').isVisible(), 'rappel de performance (première fois)');
  await capture('02-seance');
  await page.getByRole('button', { name: /Valider 5 × 60 kg/ }).click();
  await page.getByRole('dialog', { name: 'Repos' }).waitFor();
  verifier((await nbSeries()) === 1, 'la série est enregistrée immédiatement');
  verifier(await page.getByText(/Squat arrière · série 2 sur 3/).isVisible(), 'le repos annonce la série suivante');
  await capture('03-repos');
  await page.getByRole('button', { name: 'Passer' }).click();

  console.log('Autre nombre de répétitions en deux gestes');
  await page.getByRole('radio', { name: '4 répétitions' }).click();
  verifier((await nbSeries()) === 1, 'choisir un nombre ne valide pas la série');
  await page.getByRole('button', { name: /Valider 4 × 60 kg/ }).click();
  await page.getByRole('button', { name: 'Passer' }).click();
  verifier((await nbSeries()) === 2, 'deuxième série enregistrée');

  console.log('Annuler une série');
  await page.getByRole('button', { name: /Valider 5 × 60 kg/ }).click();
  await page.getByRole('button', { name: 'Annuler' }).click();
  await page.waitForTimeout(300);
  verifier((await nbSeries()) === 2, 'la série annulée est supprimée');
  verifier(await page.getByText('Série 3 sur 3').isVisible(), 'on revient à la série 3');

  console.log('Fermeture brutale puis reprise');
  await page.reload();
  await page.getByRole('heading', { name: 'Squat arrière' }).waitFor();
  verifier(await page.getByText('Série 3 sur 3').isVisible(), 'la séance reprend exactement au même endroit');

  console.log('Charge modifiée puis exercice suivant');
  await page.getByRole('button', { name: 'Plus 2,5 kg' }).click();
  await page.getByRole('button', { name: /Valider 5 × 62,5 kg/ }).click();
  verifier(await page.getByText(/Pompes · série 1 sur 3/).waitFor().then(() => true, () => false), 'après la dernière série, le repos annonce l’exercice suivant');

  console.log('Fin du repos (horloge avancée)');
  // Horloge simulée : on avance le temps de 2 min 05 sans attendre réellement.
  await page.clock.install();
  await page.reload();
  await page.getByRole('dialog', { name: 'Repos' }).waitFor();
  await page.clock.fastForward('02:05');
  await page.getByText('Repos terminé').waitFor();
  verifier(await page.getByRole('button', { name: 'Série suivante' }).isVisible(), 'écran de fin de repos');
  await capture('04-repos-fini');
  await page.getByRole('button', { name: 'Série suivante' }).click();
  await page.getByRole('heading', { name: 'Pompes' }).waitFor();
  await capture('05-pompes');

  console.log('Note libre');
  await page.getByRole('button', { name: 'Options de la séance' }).click();
  await page.getByRole('button', { name: /Ajouter une note/ }).click();
  await page.getByLabel('Note libre').fill('Prise de mains un peu large');
  await page.getByRole('button', { name: 'OK' }).click();
  verifier(await page.getByText('Prise de mains un peu large').isVisible(), 'la note est affichée');

  console.log('Fin de séance');
  await page.getByRole('button', { name: 'Options de la séance' }).click();
  await page.getByRole('button', { name: 'Terminer la séance maintenant' }).click();
  await page.getByRole('heading', { name: 'Séance terminée' }).waitFor();
  await capture('06-fin');
  await page.getByRole('button', { name: 'Enregistrer la séance' }).click();
  await page.getByRole('heading', { name: 'Séances enregistrées' }).waitFor();
  verifier(await page.getByRole('button', { name: /Supprimer la séance/ }).waitFor().then(async () => (await page.getByRole('button', { name: /Supprimer la séance/ }).count()) === 1, () => false), 'la séance apparaît dans l’historique');
  await capture('06b-historique');

  console.log('Dernière performance à la séance suivante');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByRole('heading', { name: 'Squat arrière' }).waitFor();
  verifier(await page.getByText('60 kg × 5 · 4 · 5').isVisible(), 'rappel : 60 kg × 5 · 4 · 5');
  verifier(await page.getByRole('button', { name: /Valider 5 × 60 kg/ }).isVisible(), 'la charge de départ reprend la dernière séance');
  await page.getByRole('button', { name: 'Options de la séance' }).click();
  await page.getByRole('button', { name: 'Abandonner la séance' }).click();
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor();

  console.log('Sans connexion');
  await contexte.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor({ timeout: 5000 });
  verifier(true, 'l’application s’ouvre sans connexion');
  verifier((await nbSeries()) === 3, 'les données ont survécu (3 séries)');
  await contexte.setOffline(false);

  console.log('Sauvegarde : export puis import');
  await page.getByRole('button', { name: 'Profil' }).click();
  await capture('07-profil');
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter une sauvegarde' }).click()]);
  const chemin = `${SORTIE}/${telechargement.suggestedFilename()}`;
  await telechargement.saveAs(chemin);
  const sauvegarde = JSON.parse(readFileSync(chemin, 'utf8'));
  verifier(sauvegarde.application === 'appli-sport' && sauvegarde.donnees.series.length === 3, 'le fichier contient les 3 séries');
  verifier(await page.getByText(/Dernière sauvegarde : .*aujourd'hui/).isVisible(), 'date de dernière sauvegarde mise à jour');
  await page.locator('input[type=file]').setInputFiles(chemin);
  await page.getByRole('dialog', { name: 'Remplacer les données ?' }).waitFor();
  verifier(await page.getByText('3 séries').isVisible(), 'aperçu avant import');
  await page.getByRole('button', { name: 'Remplacer mes données' }).click();
  await page.getByText('Données remplacées').waitFor();
  verifier((await nbSeries()) === 3, 'import sans perte');
  verifier(await page.getByText('avant import').isVisible(), 'copie de sécurité faite avant import');

  console.log('Corbeille');
  verifier(await page.getByRole('button', { name: 'Restaurer' }).count() === 1, 'la séance abandonnée est dans la corbeille');

  verifier(erreurs.length === 0, `aucune erreur dans la console${erreurs.length ? ' : ' + erreurs.join(' | ') : ''}`);
} catch (e) {
  echecs++;
  console.log('  ✗ ÉCHEC :', e.message);
  await capture('zz-echec').catch(() => undefined);
} finally {
  await navigateur.close();
  serveur.kill();
}

console.log(`\n${etape - echecs}/${etape} vérifications réussies`);
process.exit(echecs ? 1 : 0);
