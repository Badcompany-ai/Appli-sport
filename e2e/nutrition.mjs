// Jalon J6 : corps et nutrition (pesée, tendance, journal, recherche, scan, aliments personnels, repas, dépense du sport).
// Open Food Facts est simulé : le test ne dépend pas du réseau.
// Lancement : npm run build && node e2e/nutrition.mjs
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

const PORT = 4181;
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

const navigateur = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const contexte = await navigateur.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, acceptDownloads: true, permissions: ['camera'] });
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
  await page.getByRole('navigation', { name: 'Navigation principale' }).waitFor();
  await page.getByRole('button', { name: "Aujourd'hui" }).click();
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor();
}

// Open Food Facts simulé : un skyr connu, un produit sans valeurs, le reste inconnu.
let reseau = true;
await contexte.route('https://world.openfoodfacts.org/**', (route) => {
  if (!reseau) return route.abort('internetdisconnected');
  const url = route.request().url();
  if (url.includes('/product/7610000000017') || url.includes('/product/7610000000011')) {
    return route.fulfill({ json: { status: 1, product: { product_name: 'Skyr nature', brands: 'Migros', quantity: '450 g', serving_quantity: 150, nutriments: { 'energy-kcal_100g': 63, proteins_100g: 11, fat_100g: 0.2, carbohydrates_100g: 4 } } } });
  }
  if (url.includes('/product/')) return route.fulfill({ json: { status: 0 } });
  if (url.includes('search.pl')) {
    return route.fulfill({ json: { products: [{ code: '7613000000001', product_name: 'Barre protéinée chocolat', brands: 'Coop', nutriments: { 'energy-kcal_100g': 360, proteins_100g: 33 } }] } });
  }
  return route.fulfill({ status: 404, body: '' });
});

const nombreDe = async (loc) => Number((await loc.innerText()).replace(/[^\d]/g, ''));
const jauge = (nom) => page.getByLabel(new RegExp(`^${nom} : `));
const lireJauge = async (nom) => {
  const t = await jauge(nom).getAttribute('aria-label');
  const m = t.match(/: ([\d  ’']+) sur ([\d  ’']+)/);
  return { valeur: Number(m[1].replace(/\D/g, '')), cible: Number(m[2].replace(/\D/g, '')) };
};

try {
  await page.clock.install({ time: new Date(2027, 0, 11, 8) });
  await page.goto(URL);
  await page.getByRole('button', { name: 'Commencer' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'C’est parti' }).click();

  console.log('Pesée en 5 secondes');
  verifier(await vu(page.getByRole('region', { name: 'Mesures du jour' }).getByRole('button', { name: 'Peser' })), 'bouton « Peser » sur Aujourd’hui');
  await page.getByRole('region', { name: 'Mesures du jour' }).getByRole('button', { name: 'Peser' }).click();
  verifier(await vu(feuille('Pesée').getByText('82,0')), 'dernier poids prérempli (82 kg du profil)');
  await feuille('Pesée').getByRole('button', { name: 'Moins 1 kg' }).click();
  await feuille('Pesée').getByRole('button', { name: 'Plus 0.1 kg' }).click();
  await feuille('Pesée').getByRole('button', { name: 'Enregistrer' }).click();
  verifier(await vu(page.getByText('Pesée : 81,1 kg')), 'pesée enregistrée (81,1 kg), annulable');
  for (const [jour, kg] of [[13, 81.4], [15, 80.9], [18, 81.0], [20, 80.7], [22, 80.6], [25, 80.4]]) {
    await aller(jour, 8);
    await page.getByRole('region', { name: 'Mesures du jour' }).getByRole('button', { name: 'Peser' }).click();
    const actuel = Number((await feuille('Pesée').locator('.grand-chiffre').innerText()).replace(/[^\d,]/g, '').replace(',', '.'));
    const pas = Math.round((kg - actuel) * 10);
    for (let i = 0; i < Math.abs(pas); i++) await feuille('Pesée').getByRole('button', { name: pas > 0 ? 'Plus 0.1 kg' : 'Moins 0.1 kg' }).click();
    await feuille('Pesée').getByRole('button', { name: 'Enregistrer' }).click();
    await page.getByText(/^Pesée : /).waitFor();
  }
  await page.getByRole('button', { name: 'Progrès', exact: true }).click();
  verifier(await vu(page.getByText('Tendance sur 7 jours')), 'tendance affichée en premier');
  verifier(await vu(page.getByText(/kg\/sem\./)), 'rythme réel en kg par semaine après 14 jours');
  await page.getByRole('region', { name: 'Corps' }).getByRole('button', { name: 'Mesurer' }).click();
  await feuille('Tour de taille').getByRole('button', { name: 'Enregistrer' }).click();
  verifier(await vu(page.getByText(/85,0 cm/)), 'tour de taille enregistré');
  await capture('j6-01-corps');

  console.log('Nutrition : objectifs du jour');
  await aller(25, 12);
  await page.getByRole('button', { name: 'Nutrition', exact: true }).click();
  const avant = await lireJauge('Calories');
  verifier(avant.valeur === 0 && avant.cible > 2000 && avant.cible < 2600, `objectif d’un jour sans sport : ${avant.cible} kcal`);
  verifier((await lireJauge('Protéines')).cible === 161, 'protéines : 2 g par kg de la tendance (≈ 80,5 kg)');

  console.log('Recherche hors ligne dans la base suisse, portions');
  await page.getByRole('button', { name: 'Ajouter un aliment' }).click();
  await feuille('Ajouter un aliment').getByLabel('Chercher un aliment').fill('oeuf entier');
  await feuille('Ajouter un aliment').getByRole('button', { name: /^Oeuf de poule, entier, cuit dur/ }).click();
  await page.getByRole('button', { name: 'Une portion de plus' }).click();
  await page.getByRole('button', { name: 'Une portion de plus' }).click();
  verifier(await vu(page.getByRole('dialog', { name: /^Oeuf de poule/ }).getByText('2 ×')), 'portion « 1 œuf » proposée, 2 œufs choisis');
  await page.getByRole('button', { name: 'Midi' }).click();
  await capture('j6-02-quantite');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  verifier(await vu(page.getByRole('button', { name: /Modifier : Oeuf de poule/ })), 'aliment dans le journal');
  const apres = await lireJauge('Calories');
  verifier(apres.valeur > 140 && apres.valeur < 200, `un repas met à jour les jauges (${apres.valeur} kcal)`);
  verifier((await lireJauge('Protéines')).valeur >= 13, 'protéines mises à jour');

  console.log('Compléments en un geste, estimation, modification');
  await page.getByRole('button', { name: 'Ajouter 1 dose : Protéine en poudre' }).click();
  verifier(await vu(page.getByText('Protéine en poudre ajouté')), 'protéine en poudre en un geste');
  await page.getByRole('button', { name: 'Ajouter un aliment' }).click();
  await feuille('Ajouter un aliment').getByRole('button', { name: 'Estimation' }).click();
  await feuille('Estimation rapide').getByLabel('Nom du repas').fill('Burger et frites');
  await feuille('Estimation rapide').getByLabel('Calories estimées').fill('1100');
  await feuille('Estimation rapide').getByLabel('Protéines estimées').fill('40');
  await feuille('Estimation rapide').getByRole('button', { name: 'Ajouter' }).click();
  verifier(await vu(page.getByRole('button', { name: 'Modifier : Burger et frites' })), 'estimation rapide ajoutée');
  await page.getByRole('button', { name: 'Modifier : Burger et frites' }).click();
  await feuille('Burger et frites').getByLabel('Calories').fill('1000');
  await feuille('Burger et frites').getByRole('button', { name: 'Enregistrer' }).click();
  verifier(await vu(page.getByRole('button', { name: 'Modifier : Burger et frites' }).getByText(/1\s?000 kcal/)), 'aliment modifié');
  await page.getByRole('button', { name: 'Modifier : Burger et frites' }).click();
  await feuille('Burger et frites').getByRole('button', { name: 'Supprimer' }).click();
  verifier(await absent(page.getByRole('button', { name: 'Modifier : Burger et frites' })), 'aliment supprimé');
  await page.getByRole('button', { name: 'Annuler' }).click();
  verifier(await vu(page.getByRole('button', { name: 'Modifier : Burger et frites' })), 'suppression annulée');

  console.log('Scan : caméra, photo, produit connu, inconnu, hors ligne');
  await page.getByRole('button', { name: 'Scanner', exact: true }).click();
  verifier(await vu(page.getByText('Placez le code-barres dans le cadre orange.')), 'caméra ouverte (une seule fois)');
  const flux = await page.evaluate(() => new Promise((ok) => setTimeout(() => {
    const v = document.querySelector('video');
    ok(!!v && !!v.srcObject && v.srcObject.getVideoTracks()[0]?.readyState === 'live');
  }, 1500)));
  verifier(flux, 'image de la caméra toujours active après les rafraîchissements de l’écran');
  await page.getByLabel('Photographier le code-barres').setInputFiles('e2e/code-test.png');
  verifier(await vu(feuille('Skyr nature')), 'code lu sur une photo (solution de secours)');
  await feuille('Skyr nature').getByRole('button', { name: 'Fermer' }).click();
  verifier(await page.evaluate(() => !document.querySelector('video')), 'caméra éteinte après la lecture');
  await page.getByRole('button', { name: 'Scanner', exact: true }).click();
  await page.getByRole('textbox', { name: 'Code-barres' }).fill('7610000000017');
  await page.getByRole('button', { name: 'OK' }).click();
  verifier(await vu(feuille('Skyr nature')), 'produit trouvé dans Open Food Facts');
  verifier(await vu(page.getByRole('button', { name: '1 portion (150 g)' })), 'portion de l’emballage reprise');
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
  await page.getByRole('button', { name: 'Scanner', exact: true }).click();
  await page.getByRole('textbox', { name: 'Code-barres' }).fill('7610000000024');
  await page.getByRole('button', { name: 'OK' }).click();
  verifier(await vu(page.getByText(/Produit inconnu d’Open Food Facts/)), 'produit inconnu : saisie de l’étiquette proposée');
  await feuille('Nouvel aliment').getByLabel('Nom du produit').fill('Pain protéiné Denner');
  await feuille('Nouvel aliment').getByLabel('Calories (kcal)').fill('260');
  await feuille('Nouvel aliment').getByLabel('Protéines (g)').fill('24');
  await feuille('Nouvel aliment').getByLabel('Nom de la portion').fill('1 tranche');
  await feuille('Nouvel aliment').getByLabel('Grammes de la portion').fill('50');
  await feuille('Nouvel aliment').getByRole('button', { name: 'Enregistrer' }).click();
  await feuille('Pain protéiné Denner').getByRole('button', { name: 'Ajouter', exact: true }).click();
  verifier(await vu(page.getByRole('button', { name: /Modifier : Pain protéiné Denner/ })), 'aliment personnel créé et ajouté');
  await page.getByRole('button', { name: 'Scanner', exact: true }).click();
  await page.getByRole('textbox', { name: 'Code-barres' }).fill('7610000000024');
  await page.getByRole('button', { name: 'OK' }).click();
  verifier(await vu(feuille('Pain protéiné Denner')), 'le code est reconnu la fois suivante');
  await feuille('Pain protéiné Denner').getByRole('button', { name: 'Fermer' }).click();
  reseau = false;
  await page.getByRole('button', { name: 'Scanner', exact: true }).click();
  await page.getByRole('textbox', { name: 'Code-barres' }).fill('7610000000031');
  await page.getByRole('button', { name: 'OK' }).click();
  verifier(await vu(page.getByText(/Pas de réseau : le code est gardé/)), 'hors ligne : code mis en attente');
  await feuille('Nouvel aliment').getByRole('button', { name: 'Retour' }).click();
  await feuille('Ajouter un aliment').getByRole('button', { name: 'Fermer' }).click();
  reseau = true;

  console.log('Recherche en ligne, favoris, repas enregistrés, copier la veille');
  await page.getByRole('button', { name: 'Ajouter un aliment' }).click();
  await feuille('Ajouter un aliment').getByLabel('Chercher un aliment').fill('barre protéinée');
  await feuille('Ajouter un aliment').getByRole('button', { name: 'Chercher « barre protéinée » en ligne' }).click();
  verifier(await vu(feuille('Ajouter un aliment').getByRole('button', { name: /Barre protéinée chocolat · Coop/ })), 'recherche Open Food Facts (produits vendus en Suisse)');
  await feuille('Ajouter un aliment').getByRole('button', { name: 'Fermer' }).click();
  await page.getByRole('button', { name: 'Enregistrer comme repas' }).click();
  await feuille('Enregistrer comme repas').getByLabel('Nom du repas').fill('Mon midi');
  await feuille('Enregistrer comme repas').getByRole('button', { name: 'Enregistrer' }).click();
  // Attendre la confirmation (repas écrit dans la base) avant de changer de jour.
  await page.getByText('Repas « Mon midi » enregistré').waitFor();
  await aller(26, 9);
  await page.getByRole('button', { name: 'Nutrition', exact: true }).click();
  await page.getByRole('button', { name: 'Ajouter un aliment' }).click();
  verifier(await vu(feuille('Ajouter un aliment').getByText('Récents')), 'aliments récents en tête de liste');
  await feuille('Ajouter un aliment').getByRole('button', { name: /^Mon midi/ }).click();
  verifier(await vu(page.getByRole('button', { name: /^Modifier : / }).nth(3)), 'repas enregistré ajouté en un geste');
  await page.getByRole('button', { name: 'Jour précédent' }).click();
  verifier(await vu(page.getByRole('heading', { name: 'Hier' })), 'navigation vers la veille');
  await page.getByRole('button', { name: 'Jour suivant' }).click();

  console.log('Dépense du sport : padel 2 h');
  const sansSport = await lireJauge('Calories');
  await page.getByRole('button', { name: "Aujourd'hui" }).click();
  await page.getByRole('button', { name: 'Séance libre' }).click();
  await feuille('Séance libre').getByRole('button', { name: 'Activité' }).click();
  await feuille('Séance libre').getByLabel('Type d’activité').selectOption('padel');
  await feuille('Séance libre').getByRole('button', { name: '2 h', exact: true }).click();
  verifier(await vu(feuille('Séance libre').getByText(/environ 800 kcal/)), 'dépense estimée affichée avant d’enregistrer (≈ 800 kcal)');
  verifier(await vu(feuille('Séance libre').getByText(/valeur du tennis en double/)), 'source de la valeur du padel expliquée');
  await feuille('Séance libre').getByRole('button', { name: 'Enregistrer l’activité' }).click();
  await page.getByRole('button', { name: 'Nutrition', exact: true }).click();
  verifier(await vu(page.getByText(/Padel · 120 min · 8\d\d kcal/)), 'padel dans « Sport du jour »');
  const avecSport = await lireJauge('Calories');
  verifier(avecSport.cible - sansSport.cible > 750, `objectif du jour augmenté de ${avecSport.cible - sansSport.cible} kcal`);
  await capture('j6-03-nutrition');
  await page.getByRole('button', { name: "Aujourd'hui" }).click();
  verifier(await vu(page.getByRole('region', { name: 'Séance du jour' }).getByRole('button', { name: 'Commencer', exact: true })), 'après le padel, la séance prévue reste à faire le même jour');
  await page.getByRole('button', { name: 'Nutrition', exact: true }).click();

  console.log('Données conservées');
  await page.reload();
  await page.getByRole('button', { name: 'Nutrition', exact: true }).click();
  verifier(await vu(page.getByRole('button', { name: /^Modifier : / }).nth(3)), 'le journal survit à la fermeture');
  await contexte.setOffline(true);
  reseau = false;
  await page.reload();
  await page.getByRole('button', { name: 'Ajouter un aliment' }).click();
  await feuille('Ajouter un aliment').getByLabel('Chercher un aliment').fill('banane');
  verifier(await vu(feuille('Ajouter un aliment').getByRole('button', { name: /^Banane, crue/ })), 'base suisse disponible sans connexion');
  await contexte.setOffline(false);

  verifier(erreurs.filter((e) => !/openfoodfacts|ERR_INTERNET|Failed to fetch|net::/i.test(e)).length === 0, `aucune erreur dans la console${erreurs.length ? ' : ' + erreurs.join(' | ') : ''}`);
} catch (e) {
  echecs++;
  console.log('  ✗ ÉCHEC :', e.message);
  await capture('zz-echec-nutrition').catch(() => undefined);
} finally {
  await navigateur.close();
  serveur.kill();
}
console.log(`\n${etapes - echecs}/${etapes} vérifications réussies`);
process.exit(echecs ? 1 : 0);
