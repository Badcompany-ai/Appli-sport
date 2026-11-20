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
  const vu = (loc) => loc.waitFor({ timeout: 5000 }).then(() => true, () => false);
  const carte = () => page.getByRole('region', { name: 'Séance du jour' });

  console.log('Premier lancement');
  await page.goto(URL);
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);

  console.log('Parcours de départ (prérempli)');
  await page.getByRole('dialog', { name: 'Parcours de départ' }).waitFor();
  await capture('00-depart');
  await page.getByRole('button', { name: 'Commencer' }).click();
  verifier(await vu(page.getByText('188')), 'profil prérempli avec l’interview (188 cm)');
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Continuer' }).click();
  await capture('00b-pret');
  await page.getByRole('button', { name: 'C’est parti' }).click();
  verifier(await vu(page.getByText(/Commence le lundi 28 décembre/)), 'avant le début : date de début affichée');
  verifier(await page.getByText('Aucune séance pour l').isVisible(), 'écran de première utilisation non vide');
  await page.getByRole('button', { name: 'Séance d’essai' }).click();
  verifier(!(await page.getByText(/changement.* selon le matériel/).isVisible()), 'en salle, la séance n’est pas modifiée');
  await capture('01-aujourdhui');

  console.log('Matériel : changement de lieu');
  await page.getByRole('button', { name: 'Maison', exact: true }).click();
  verifier(await vu(page.getByText(/changements selon le matériel/)), 'à la maison, la séance affiche ses changements');
  verifier(await vu(carte().getByText('Squat bulgare aux haltères')), 'squat arrière remplacé par le squat bulgare');
  await capture('02-maison');
  await page.getByRole('button', { name: /Voir pourquoi/ }).click();
  verifier(await vu(page.getByText(/Pas de barre et disques ; mouvement proche/).first()), 'chaque changement est expliqué');
  await capture('03-pourquoi');
  await page.getByRole('button', { name: 'OK' }).click();

  console.log('Matériel : décocher un équipement recalcule la séance');
  await page.getByRole('button', { name: 'Matériel', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Haltères' }).uncheck();
  verifier(await vu(page.getByText('Modifié pour aujourd’hui seulement')), 'modification pour aujourd’hui seulement');
  await page.getByRole('button', { name: 'OK' }).click();
  verifier(!(await carte().getByText('Squat bulgare aux haltères').isVisible()), 'sans haltères, le squat bulgare aux haltères disparaît');
  verifier(await vu(carte().getByText(/Squat bulgare au poids du corps|Squat sur une jambe/)), 'remplacé par un équivalent au poids du corps');
  await page.getByRole('button', { name: 'Matériel', exact: true }).click();
  for (let i = 0; i < 40 && (await page.getByRole('checkbox', { checked: true }).count()) > 0; i++) {
    await page.getByRole('checkbox', { checked: true }).first().click();
  }
  verifier(await vu(page.getByText('Aucun matériel coché : séance entièrement au poids du corps.')), 'aucun matériel coché : message clair');
  await capture('04-materiel');
  await page.getByRole('button', { name: 'Revenir au préréglage' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('button', { name: 'Salle', exact: true }).click();
  verifier(await vu(carte().getByText('Squat arrière')), 'retour en salle : séance d’origine');

  console.log('Fiche d’exercice');
  await carte().getByRole('button', { name: 'Fiche : Squat arrière' }).click();
  verifier(await vu(page.getByText('Erreurs fréquentes')), 'la fiche affiche consignes et erreurs');
  verifier(await vu(page.getByRole('link', { name: /Rechercher une vidéo/ }).or(page.getByRole('button', { name: /Voir la démonstration/ }))), 'vidéo vérifiée ou bouton de recherche');
  await capture('05-fiche');
  await page.getByRole('button', { name: /Plus facile : Squat goblet/ }).click();
  verifier(await vu(page.getByRole('dialog', { name: 'Squat goblet' })), 'les variantes ouvrent leur fiche');
  await page.getByRole('dialog', { name: 'Squat goblet' }).getByRole('button', { name: 'Fermer' }).click();

  console.log('Mode séance');
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByRole('heading', { name: 'Saut sur box' }).waitFor();
  verifier(await page.getByText('Première fois sur cet exercice').isVisible(), 'rappel de performance (première fois)');
  await capture('06-seance');
  await page.getByRole('button', { name: 'Valider 5 répétitions' }).click();
  await page.getByRole('dialog', { name: 'Repos' }).waitFor();
  verifier((await nbSeries()) === 1, 'la série est enregistrée immédiatement');
  verifier(await page.getByText(/Saut sur box · série 2 sur 3/).isVisible(), 'le repos annonce la série suivante');
  await capture('07-repos');
  await page.getByRole('button', { name: 'Passer' }).click();

  console.log('Autre nombre de répétitions en deux gestes');
  await page.getByRole('radio', { name: '4 répétitions' }).click();
  verifier((await nbSeries()) === 1, 'choisir un nombre ne valide pas la série');
  await page.getByRole('button', { name: 'Valider 4 répétitions' }).click();
  await page.getByRole('button', { name: 'Passer' }).click();
  verifier((await nbSeries()) === 2, 'deuxième série enregistrée');

  console.log('Annuler une série');
  await page.getByRole('button', { name: 'Valider 5 répétitions' }).click();
  await page.getByRole('button', { name: 'Annuler' }).click();
  await page.waitForTimeout(300);
  verifier((await nbSeries()) === 2, 'la série annulée est supprimée');
  verifier(await page.getByText('Série 3 sur 3').isVisible(), 'on revient à la série 3');

  console.log('Fermeture brutale puis reprise');
  await page.reload();
  await page.getByRole('heading', { name: 'Saut sur box' }).waitFor();
  verifier(await page.getByText('Série 3 sur 3').isVisible(), 'la séance reprend exactement au même endroit');
  await page.getByRole('button', { name: 'Valider 5 répétitions' }).click();
  verifier(await vu(page.getByText(/Squat arrière · série 1 sur 3/)), 'après la dernière série, le repos annonce l’exercice suivant');

  console.log('Fin du repos (horloge avancée)');
  await page.clock.install();
  await page.reload();
  await page.getByRole('dialog', { name: 'Repos' }).waitFor();
  await page.clock.fastForward('02:35');
  await page.getByText('Repos terminé').waitFor();
  verifier(await page.getByRole('button', { name: 'Série suivante' }).isVisible(), 'écran de fin de repos');
  await capture('08-repos-fini');
  await page.getByRole('button', { name: 'Série suivante' }).click();
  await page.getByRole('heading', { name: 'Squat arrière' }).waitFor();

  console.log('Remplacer un exercice en séance');
  await page.getByRole('button', { name: 'Remplacer', exact: true }).click();
  const options = page.getByRole('dialog', { name: 'Remplacer : Squat arrière' }).locator('.lien-liste');
  verifier((await options.count()) >= 3, 'plusieurs équivalents proposés');
  await capture('09-remplacer');
  const premier = (await options.first().locator('.gras').textContent()).trim();
  await options.first().click();
  verifier(await vu(page.getByRole('heading', { name: premier })), `remplacé par « ${premier} »`);
  await page.getByRole('button', { name: 'Annuler' }).click();
  verifier(await vu(page.getByRole('heading', { name: 'Squat arrière' })), 'le remplacement peut être annulé');

  console.log('Fiche depuis la séance, charge modifiée, note');
  await page.getByRole('button', { name: 'Fiche', exact: true }).click();
  verifier(await vu(page.getByText('Consignes')), 'fiche ouverte depuis la séance');
  await page.getByRole('dialog', { name: 'Squat arrière' }).getByRole('button', { name: 'Fermer' }).click();
  await page.getByRole('button', { name: 'Plus 2,5 kg' }).click();
  await page.getByRole('button', { name: /Valider 5 × 62,5 kg/ }).click();
  await page.getByRole('button', { name: 'Passer' }).click();
  await page.getByRole('button', { name: 'Note', exact: true }).click();
  await page.getByLabel('Note libre').fill('Pieds un peu plus écartés');
  await page.getByRole('button', { name: 'OK' }).click();
  verifier(await page.getByText('Pieds un peu plus écartés').isVisible(), 'la note est affichée');

  console.log('Fin de séance');
  await page.getByRole('button', { name: 'Options de la séance' }).click();
  await page.getByRole('button', { name: 'Terminer la séance maintenant' }).click();
  await page.getByRole('heading', { name: 'Séance terminée' }).waitFor();
  await capture('10-fin');
  await page.getByRole('button', { name: 'Enregistrer la séance' }).click();
  await page.getByRole('heading', { name: 'Séances enregistrées' }).waitFor();
  verifier(await vu(page.getByRole('button', { name: /Supprimer la séance/ })), 'la séance apparaît dans l’historique');

  console.log('Dernière performance à la séance suivante');
  await page.clock.resume?.();
  await page.getByRole('button', { name: 'Séance d’essai' }).click();
  await page.getByRole('button', { name: 'Commencer' }).click();
  await page.getByRole('heading', { name: 'Saut sur box' }).waitFor();
  verifier(await vu(page.getByText('5 · 4 · 5 répétitions')), 'rappel : 5 · 4 · 5 répétitions');
  await page.getByRole('button', { name: 'Options de la séance' }).click();
  await page.getByRole('button', { name: 'Abandonner la séance' }).click();
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor();

  console.log('Programme : commencer cette semaine');
  await page.getByRole('button', { name: 'Commencer cette semaine' }).click();
  verifier(await vu(page.getByText(/Semaine 1 · Reprise · séance A/)), 'séance A de la semaine 1 proposée');
  verifier(await vu(carte().getByText('Squat jump')), 'reprise : squat jump (pas de box)');
  await capture('13-programme-jour');
  await page.getByRole('button', { name: 'Commencer' }).click();
  verifier(await vu(page.getByRole('heading', { name: 'Échauffement' })), 'échauffement guidé avant la séance');
  await capture('14-echauffement');
  await page.getByRole('button', { name: 'Échauffement fait' }).click();
  verifier(await vu(page.getByRole('heading', { name: 'Squat jump' })), 'premier exercice après l’échauffement');
  verifier(await vu(page.getByText('Série 1 sur 4')), 'reprise : 4 séries de sauts');
  await page.getByRole('button', { name: 'Options de la séance' }).click();
  await page.getByRole('button', { name: 'Abandonner la séance' }).click();
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor();
  await page.getByRole('button', { name: 'Programme' }).click();
  verifier(await vu(page.getByText('Cette semaine')), 'onglet Programme : semaine en cours');
  verifier(await vu(page.getByText('Test léger de reprise')), 'test léger prévu en semaine 1');
  verifier(await vu(page.getByText(/Les objectifs seront proposés/)), 'objectifs annoncés après le premier test');
  await page.getByRole('button', { name: 'Voir la séance : Haut du corps et boxe' }).click();
  verifier(await vu(page.getByRole('dialog', { name: 'Haut du corps et boxe' }).getByText('Développé couché')), 'contenu d’une séance consultable');
  await capture('15b-seance-detail');
  await page.getByRole('dialog', { name: 'Haut du corps et boxe' }).getByRole('button', { name: 'Fermer' }).click();
  await page.getByRole('button', { name: 'Semaine suivante' }).click();
  verifier(await vu(page.getByRole('heading', { name: 'Semaine 2' })), 'navigation vers la semaine suivante');
  verifier(await vu(page.getByText('Tests athlétiques')), 'semaine 2 : tests athlétiques prévus');
  await page.getByRole('button', { name: 'Remettre le début au lundi 28 décembre' }).click();
  verifier(await vu(page.getByText(/Commence le lundi 28 décembre/)), 'début remis au 28 décembre');
  await capture('15-programme');
  await page.getByRole('button', { name: "Aujourd'hui" }).click();

  console.log('Bibliothèque d’exercices');
  await page.getByRole('button', { name: 'Programme' }).click();
  await page.getByLabel('Rechercher un exercice').fill('traction');
  verifier(await vu(page.getByRole('button', { name: 'Tractions lestées' })), 'recherche dans la bibliothèque');
  await capture('11-bibliotheque');
  await page.getByRole('button', { name: "Aujourd'hui" }).click();

  console.log('Sans connexion');
  await contexte.setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor({ timeout: 5000 });
  verifier(true, 'l’application s’ouvre sans connexion');
  verifier((await nbSeries()) === 4, 'les données ont survécu (4 séries)');
  await contexte.setOffline(false);

  console.log('Sauvegarde : export puis import');
  await page.getByRole('button', { name: 'Profil' }).click();
  await capture('12-profil');
  const [telechargement] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exporter une sauvegarde' }).click()]);
  const chemin = `${SORTIE}/${telechargement.suggestedFilename()}`;
  await telechargement.saveAs(chemin);
  const sauvegarde = JSON.parse(readFileSync(chemin, 'utf8'));
  verifier(sauvegarde.application === 'appli-sport' && sauvegarde.donnees.series.length === 4, 'le fichier contient les 4 séries');
  verifier(await vu(page.getByText(/Dernière sauvegarde : /)), 'date de dernière sauvegarde mise à jour');
  await page.locator('input[type=file]').setInputFiles(chemin);
  await page.getByRole('dialog', { name: 'Remplacer les données ?' }).waitFor();
  verifier(await page.getByText('4 séries').isVisible(), 'aperçu avant import');
  await page.getByRole('button', { name: 'Remplacer mes données' }).click();
  await page.getByText('Données remplacées').waitFor();
  verifier((await nbSeries()) === 4, 'import sans perte');
  verifier(await page.getByText('avant import').isVisible(), 'copie de sécurité faite avant import');

  console.log('Corbeille');
  verifier((await page.getByRole('button', { name: 'Restaurer' }).count()) === 2, 'les 2 séances abandonnées sont dans la corbeille');

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
