// Jalon J5 : simulation d'une « semaine chaotique » (cahier des charges, partie 8).
// Horloge contrôlée : chaque étape se passe un jour précis de janvier 2027 (cycle 1, semaine 3 du programme).
// Lancement : npm run build && node e2e/semaine.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}
const { chromium, devices } = playwright;

const PORT = 4180;
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
let etapes = 0;
function verifier(condition, message) {
  etapes++;
  if (condition) console.log(`  ✓ ${message}`);
  else {
    echecs++;
    console.log(`  ✗ ${message}`);
  }
}

const navigateur = await chromium.launch();
const contexte = await navigateur.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
const page = await contexte.newPage();
const erreurs = [];
page.on('pageerror', (e) => erreurs.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') erreurs.push(m.text());
});
const capture = async (nom) => {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SORTIE}/${nom}.png`, fullPage: true });
};
const vu = (loc) => loc.waitFor({ timeout: 5000 }).then(() => true, () => false);
const absent = (loc) => loc.waitFor({ state: 'detached', timeout: 5000 }).then(() => true, () => false);
const carte = () => page.getByRole('region', { name: 'Séance du jour' });
const feuille = (nom) => page.getByRole('dialog', { name: nom });
async function aller(jour, heure = 10) {
  await page.clock.setSystemTime(new Date(2027, 0, jour, heure));
  await page.reload();
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor();
}

try {
  await page.clock.install({ time: new Date(2027, 0, 11, 10) });
  await page.goto(URL);
  await page.getByRole('button', { name: 'Commencer' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'C’est parti' }).click();

  console.log('Lundi : peu de temps');
  verifier(await vu(page.getByText(/Semaine 3 · Cycle 1 · Bases · séance A/)), 'séance A proposée le lundi');
  const complete = Number(await carte().locator('.grand-chiffre').first().innerText().then((t) => t.match(/\d+/)[0]));
  await page.getByLabel('Temps disponible en minutes').fill('35');
  verifier(await vu(carte().getByText('35 min', { exact: true }).first()), 'temps disponible réglé à 35 minutes');
  const raccourcie = Number(await carte().locator('.grand-chiffre').first().innerText().then((t) => t.match(/\d+/)[0]));
  verifier(raccourcie <= 35 || raccourcie < complete, `séance raccourcie (${complete} → ${raccourcie} min)`);
  verifier((await carte().locator('.grise').count()) > 0, 'exercices retirés grisés, avec la raison');
  verifier(await vu(carte().locator('.grise').getByText(/pas assez de temps/).first()), 'raison affichée');
  verifier(await carte().getByText('Saut sur box').isVisible() && await carte().getByText('Squat arrière').isVisible(), 'le travail principal est gardé');
  await capture('j5-01-temps');
  await page.getByRole('button', { name: 'Revenir à la séance complète' }).click();
  verifier(await absent(carte().locator('.grise').first()), 'séance complète rétablie');

  await page.getByRole('button', { name: 'Commencer', exact: true }).click();
  await page.getByRole('button', { name: 'Échauffement fait' }).click();
  await page.getByRole('button', { name: /^Valider/ }).first().click();
  await page.getByRole('button', { name: 'Passer' }).click();
  await page.getByRole('button', { name: 'Options de la séance' }).click();
  await page.getByRole('button', { name: 'Terminer la séance maintenant' }).click();
  await page.getByRole('button', { name: 'Enregistrer la séance' }).click();
  await page.getByText('Séance enregistrée').waitFor();

  console.log('Mardi : séance C avancée, contrôles de récupération');
  await aller(12);
  verifier(await vu(page.getByText(/séance B/)), 'le mardi, la séance B est la suivante');
  await carte().getByRole('button', { name: 'Changer de séance' }).click();
  await feuille('Changer de séance').getByRole('button', { name: /Vitesse, appuis et chaîne arrière/ }).click();
  verifier(await vu(page.getByText(/séance C/)), 'séance C choisie à la place');
  verifier(await vu(carte().getByText(/Moins de 48 h depuis une séance lourde du bas du corps/)), 'alerte : moins de 48 h après la séance A');
  await capture('j5-02-recuperation');
  await carte().getByRole('button', { name: 'Version allégée' }).click();
  verifier(await vu(carte().getByText(/Version allégée : moitié moins de séries/)), 'version allégée appliquée');
  await page.getByRole('button', { name: 'Revenir à la séance complète' }).click();
  verifier(await absent(carte().getByText(/Version allégée : moitié/)), 'retour à la séance complète');

  console.log('Mardi : fatigue, douleur, nuit courte');
  await carte().getByRole('button', { name: 'Fatigue ou douleur' }).click();
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Je suis fatigué aujourd’hui' }).click();
  verifier(await vu(feuille('Fatigue ou douleur').getByText(/ne donne pas de conseil médical/)), 'message médical fixe affiché');
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Genou' }).click();
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Fermer' }).click();
  verifier(await vu(carte().getByText(/Fatigue signalée : 30 % de séries en moins/)), 'fatigue : séance allégée');
  verifier(await vu(page.getByText('Douleur signalée : genou')), 'douleur au genou gardée en mémoire');
  verifier(await vu(carte().getByText(/zone signalée \(genou\)/).first()), 'exercices sollicitant le genou retirés ou remplacés');
  verifier(!(await carte().getByRole('button', { name: 'Fiche : Sprint court' }).isVisible()), 'plus de sprint avec un genou douloureux');
  await page.getByLabel('5 heures de sommeil').click();
  verifier(await vu(page.getByText('Moins de 6 h de sommeil')), 'nuit courte : allègement proposé, pas imposé');
  await page.getByRole('region', { name: 'Nuit courte' }).getByRole('button', { name: 'Alléger' }).click();
  await capture('j5-03-adaptations');
  await page.getByText('Douleur signalée : genou').click();
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Genou' }).click();
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Fermer' }).click();
  verifier(await absent(page.getByText('Douleur signalée : genou')), 'la douleur se retire d’un geste');

  console.log('Mercredi : seconde fatigue → semaine allégée proposée');
  await aller(13);
  await carte().getByRole('button', { name: 'Fatigue ou douleur' }).click();
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Je suis fatigué aujourd’hui' }).click();
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Fermer' }).click();
  verifier(await vu(page.getByText('Semaine allégée conseillée')), 'semaine allégée proposée après 2 fatigues');
  await page.getByRole('button', { name: 'Alléger la semaine' }).click();
  verifier(await vu(page.getByText(/Semaine 3 · Cycle 1 · Bases · allégée/)), 'semaine allégée acceptée');
  verifier(await vu(carte().getByText(/Semaine allégée : environ moitié moins de séries/)), 'séances de la semaine allégées');
  await capture('j5-04-semaine-allegee');

  console.log('Mercredi soir : basket à la place de la séance B');
  await page.getByRole('button', { name: 'Séance libre' }).click();
  await feuille('Séance libre').getByRole('button', { name: 'Activité' }).click();
  await feuille('Séance libre').getByLabel('Nom de l’activité').fill('Basket entre amis');
  await feuille('Séance libre').getByRole('button', { name: '1 h', exact: true }).click();
  await feuille('Séance libre').getByRole('button', { name: 'Séance B' }).click();
  await capture('j5-05-seance-libre');
  await feuille('Séance libre').getByRole('button', { name: 'Enregistrer l’activité' }).click();
  verifier(await vu(page.getByText(/Basket entre amis enregistré/)), 'activité enregistrée');
  verifier(await vu(page.getByRole('region', { name: 'Séances enregistrées' }).getByText('Basket entre amis')), 'activité dans l’historique');

  console.log('Vendredi : séance C manquée');
  await aller(15);
  await page.getByRole('button', { name: 'Programme', exact: true }).click();
  verifier(await vu(page.getByText('Manquée · à faire')), 'séance C du jeudi : manquée, toujours à faire');
  verifier(await vu(page.getByText(/^Faite/).nth(1)), 'séances A et B (basket) faites');
  await capture('j5-06-programme');
  await page.getByRole('button', { name: "Aujourd'hui" }).click();
  verifier(await vu(page.getByText(/séance C/)), 'la séance manquée devient la prochaine');

  console.log('Dimanche : plus assez de jours');
  await aller(17);
  verifier(await vu(page.getByText(/séance D laissée de côté/)), 'dimanche : la séance D est laissée, la C gardée');
  verifier(await vu(page.getByText(/séance C/)), 'séance C proposée le dimanche');

  console.log('Mardi suivant : équilibre musculaire');
  await aller(19);
  verifier(await vu(page.getByText(/Semaine 4 · Cycle 1 · Bases · séance A/)), 'la semaine suivante repart normalement');
  verifier(!(await page.getByText('Semaine allégée conseillée').isVisible()), 'les fatigues de la semaine passée ne comptent plus');
  verifier(await vu(page.getByText('Groupes musculaires à surveiller')), 'alerte d’équilibre');
  const ajout = page.getByRole('button', { name: /Ajouter « .* » à la séance du jour/ }).first();
  const nomAjout = (await ajout.innerText()).match(/« (.*) »/)[1];
  await ajout.click();
  verifier(await vu(carte().getByRole('button', { name: `Fiche : ${nomAjout}` })), `« ${nomAjout} » ajouté à la séance du jour`);
  await capture('j5-07-equilibre');
  await page.getByRole('button', { name: 'Progrès', exact: true }).click();
  verifier(await vu(page.getByText('Volume des 7 derniers jours')), 'volume par groupe musculaire dans Progrès');
  await page.getByRole('button', { name: "Aujourd'hui" }).click();

  console.log('En séance : douleur au genou');
  await page.getByRole('button', { name: 'Commencer', exact: true }).click();
  await page.getByRole('button', { name: 'Échauffement fait' }).click();
  await page.getByRole('button', { name: 'Options de la séance' }).click();
  await page.getByRole('button', { name: 'Fatigue ou douleur' }).click();
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Genou' }).click();
  await feuille('Fatigue ou douleur').getByRole('button', { name: 'Adapter les exercices suivants' }).click();
  verifier(await vu(page.getByText('Suite de la séance adaptée à la douleur')), 'suite de la séance adaptée');
  verifier(await vu(page.getByRole('button', { name: 'Annuler' })), 'adaptation annulable');
  await capture('j5-08-en-seance');

  verifier(erreurs.length === 0, `aucune erreur dans la console${erreurs.length ? ' : ' + erreurs.join(' | ') : ''}`);
} catch (e) {
  echecs++;
  console.log('  ✗ ÉCHEC :', e.message);
  await capture('zz-echec-semaine').catch(() => undefined);
} finally {
  await navigateur.close();
  serveur.kill();
}
console.log(`\n${etapes - echecs}/${etapes} vérifications réussies`);
process.exit(echecs ? 1 : 0);
