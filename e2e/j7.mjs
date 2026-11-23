// Jalon J7 : ajustement automatique, bilan hebdomadaire, idées de protéines (I5), compléments pris (I7),
// rappels Calendrier et chronométrage vidéo (cachés), mode analyse sur grand écran (I9).
// Lancement : npm run build && node e2e/j7.mjs
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

const PORT = 4182;
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
const contexte = await navigateur.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1, acceptDownloads: true });
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

const J = 86400000;
const maintenant = new Date(2027, 1, 1, 8).getTime(); // lundi 1er février 2027

/** Écrit directement dans la base de l'appareil (préparation du scénario). */
const injecter = (table, objets) =>
  page.evaluate(
    ({ table, objets }) =>
      new Promise((ok, ko) => {
        const r = indexedDB.open('appli-sport');
        r.onsuccess = () => {
          const tx = r.result.transaction(table, 'readwrite');
          for (const o of objets) tx.objectStore(table).put(o);
          tx.oncomplete = () => { r.result.close(); ok(); };
          tx.onerror = () => ko(tx.error);
        };
      }),
    { table, objets }
  );
const lire = (table) =>
  page.evaluate(
    (table) =>
      new Promise((ok) => {
        const r = indexedDB.open('appli-sport');
        r.onsuccess = () => {
          const q = r.result.transaction(table).objectStore(table).getAll();
          q.onsuccess = () => { r.result.close(); ok(q.result); };
        };
      }),
    table
  );
const attendre = async (f, ms = 5000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await f()) return true;
    await page.waitForTimeout(100);
  }
  return false;
};
const lireJauge = async (nom) => {
  const t = await page.getByLabel(new RegExp(`^${nom} : `)).getAttribute('aria-label');
  const m = t.match(/: ([\d  ’']+) sur ([\d  ’']+)/);
  return { valeur: Number(m[1].replace(/\D/g, '')), cible: Number(m[2].replace(/\D/g, '')) };
};

try {
  await page.clock.install({ time: new Date(maintenant) });
  await page.goto(URL);
  await page.getByRole('button', { name: 'Commencer' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'C’est parti' }).click();
  await page.getByRole('heading', { name: "Aujourd'hui" }).waitFor();

  // Trois semaines de pesées stables, une séance la semaine dernière, du journal et du sommeil.
  await injecter('mesures', Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, type: 'poids', valeur: 82 + (i % 2 ? 0.2 : -0.2), date: maintenant - (18 - i * 3) * J })));
  const plan = { id: 'S6-A', nom: 'Explosivité et force du bas du corps', exercices: [{ exerciceId: 'squat-arriere', nom: 'Squat arrière', mesure: 'charge_reps', series: 3, reps: 5, reposSec: 150, priorite: 1 }], programme: { semaine: 4, lettre: 'A', type: 'entrainement' } };
  const debutSeance = maintenant - 6 * J + 9 * 3600000;
  await injecter('seances', [{ id: 's1', planId: plan.id, nom: plan.nom, plan, statut: 'terminee', debut: debutSeance, fin: debutSeance + 3600000, exerciceIndex: 1, notes: {} }]);
  await injecter('series', [0, 1, 2].map((i) => ({ id: `x${i}`, seanceId: 's1', exerciceId: 'squat-arriere', numero: i, chargeKg: 100, reps: 5, faiteLe: debutSeance + i * 300000 })));
  await injecter('journal', [{ id: 'j1', jour: '2027-01-27', ajouteLe: maintenant - 5 * J, nom: 'Repas estimé', grammes: 0, quantite: 'estimation', nutriments: { kcal: 2500, proteines: 150, lipides: 0, glucides: 0, fibres: 0 } }]);
  await injecter('reglages', [{ cle: 'sommeil', valeur: { '2027-01-26': 5, '2027-01-27': 7 } }]);
  await page.reload();

  console.log('Bilan de la semaine');
  verifier(await vu(page.getByText('Bilan de la semaine dernière')), 'bilan proposé à l’ouverture, la semaine finie');
  await page.getByText('Bilan de la semaine dernière').click();
  const bilan = feuille('Bilan de la semaine');
  verifier(await vu(bilan.getByText('Séances : 1 sur 4.')), 'séances faites sur prévues');
  verifier(await vu(bilan.getByText(/Apports moyens \(1 jour saisi\) : 2\s?500 kcal, 150 g de protéines\./)), 'moyenne des apports des jours saisis');
  verifier(await vu(bilan.getByText(/Sommeil : 6,0 h en moyenne sur 2 nuits, dont 1 de moins de 6 h\./)), 'sommeil croisé (I4)');
  verifier(await vu(bilan.getByText(/Tendance du poids/)), 'tendance du poids');
  verifier(await vu(bilan.getByText(/pas des prescriptions médicales/)), 'avertissement fixe');
  await capture('j7-01-bilan');
  await bilan.getByRole('button', { name: 'OK' }).click();
  verifier(await absent(page.getByText('Bilan de la semaine dernière')), 'le bilan ne revient pas une fois lu');
  await page.getByRole('button', { name: 'Progrès', exact: true }).click();
  verifier(await vu(page.getByRole('button', { name: /Semaine du 25 janvier au 31 janvier/ })), 'bilans gardés dans Progrès');

  console.log('Ajustement automatique (toutes les 2 semaines)');
  await page.getByRole('button', { name: 'Nutrition', exact: true }).click();
  const avant = await lireJauge('Calories');
  verifier(await vu(page.getByText(/votre tendance .* au lieu de − 0,2\d? : objectif ajusté de − 150 kcal par jour/)), 'poids stable en sèche : − 150 kcal proposés, avec l’explication');
  await capture('j7-02-ajustement');
  await page.getByRole('region', { name: 'Ajustement de l’objectif' }).getByRole('button', { name: 'Accepter' }).click();
  await page.getByText('Objectif ajusté').waitFor();
  verifier(await attendre(async () => (await lireJauge('Calories')).cible === avant.cible - 150), 'objectif baissé de 150 kcal');
  verifier(await absent(page.getByRole('region', { name: 'Ajustement de l’objectif' })), 'plus de proposition avant 14 jours');
  await page.getByRole('button', { name: 'Annuler' }).click();
  verifier(await vu(page.getByRole('region', { name: 'Ajustement de l’objectif' })), 'ajustement annulable');
  await page.getByRole('region', { name: 'Ajustement de l’objectif' }).getByRole('button', { name: 'Garder l’ancien' }).click();
  verifier(await attendre(async () => (await lireJauge('Calories')).cible === avant.cible), 'proposition refusée : objectif inchangé');

  console.log('Idées pour finir ses protéines (I5) et compléments pris (I7)');
  verifier(await vu(page.getByText(/Il vous reste \d+ g de protéines/)), 'reste de protéines affiché');
  await page.getByRole('region', { name: 'Idées pour finir ses protéines' }).getByRole('button', { name: /Protéine en poudre/ }).click();
  verifier(await attendre(async () => (await lireJauge('Protéines')).valeur > 20), 'idée ajoutée en un geste');
  await page.getByRole('button', { name: 'Ajouter 1 dose : Créatine' }).click();
  verifier(await vu(page.getByRole('button', { name: 'Ajouter 1 dose : Créatine' }).getByText('✓ Créatine')), 'créatine cochée pour aujourd’hui');
  verifier(await vu(page.getByText(/Créatine : 1 jour d’affilée/)), 'jours d’affilée de créatine');
  await capture('j7-03-nutrition');

  console.log('Rappels Calendrier : cachés (ne marchent pas sur l’iPhone de l’utilisateur)');
  await page.getByRole('button', { name: 'Profil', exact: true }).click();
  await page.getByRole('button', { name: 'À propos et sources' }).waitFor();
  verifier(!(await page.getByRole('button', { name: 'Ajouter au Calendrier' }).isVisible()), 'rappels Calendrier cachés dans le Profil');
  await page.getByRole('button', { name: 'À propos et sources' }).click();
  verifier(await vu(feuille('À propos').getByText(/Compendium des activités physiques 2024/)), 'à propos : sources et avertissement');
  await feuille('À propos').getByRole('button', { name: 'OK' }).click();

  console.log('Chronométrage vidéo d’un sprint : caché (ne marche pas chez l’utilisateur)');
  await page.getByRole('button', { name: "Aujourd'hui" }).click();
  await page.getByRole('region', { name: 'Séance du jour' }).getByRole('button', { name: 'Changer de séance' }).click();
  await feuille('Changer de séance').getByRole('button', { name: /Vitesse, appuis et chaîne arrière/ }).click();
  // Attendre que la carte affiche la séance choisie avant de la commencer.
  await page.getByRole('region', { name: 'Séance du jour' }).getByText('Vitesse, appuis et chaîne arrière').waitFor();
  await page.getByRole('region', { name: 'Séance du jour' }).getByRole('button', { name: 'Commencer', exact: true }).click();
  await page.getByRole('button', { name: 'Échauffement fait' }).click();
  verifier(await vu(page.getByRole('button', { name: 'Sprint fait' })), 'sprint : validation en un geste');
  verifier(!(await page.getByRole('button', { name: /Chronométrer sur une vidéo/ }).isVisible()), 'chrono vidéo caché');

  console.log('Mode analyse sur grand écran (I9)');
  const mac = await navigateur.newContext({ viewport: { width: 1280, height: 860 } });
  const pageMac = await mac.newPage();
  await pageMac.clock.install({ time: new Date(maintenant) });
  await pageMac.goto(URL);
  await pageMac.getByRole('button', { name: 'Commencer' }).click();
  for (let i = 0; i < 5; i++) await pageMac.getByRole('button', { name: 'Continuer' }).click();
  await pageMac.getByRole('button', { name: 'C’est parti' }).click();
  await pageMac.evaluate(({ plan, debut }) => new Promise((ok) => {
    const r = indexedDB.open('appli-sport');
    r.onsuccess = () => {
      const tx = r.result.transaction(['seances', 'series'], 'readwrite');
      tx.objectStore('seances').put({ id: 's1', planId: plan.id, nom: plan.nom, plan, statut: 'terminee', debut, fin: debut + 3600000, exerciceIndex: 1, notes: {} });
      tx.objectStore('series').put({ id: 'x1', seanceId: 's1', exerciceId: 'squat-arriere', numero: 0, chargeKg: 100, reps: 5, faiteLe: debut });
      tx.oncomplete = () => ok();
    };
  }), { plan, debut: debutSeance });
  await pageMac.reload();
  await pageMac.getByRole('button', { name: 'Progrès', exact: true }).click();
  verifier(await vu(pageMac.getByRole('region', { name: 'Analyse' })), 'tableaux d’analyse sur grand écran');
  verifier(await vu(pageMac.getByRole('cell', { name: 'Squat arrière' })), 'tableau comparatif des exercices');
  verifier(await vu(pageMac.getByRole('cell', { name: /25 janvier/ })), 'tableau des semaines (séances, tonnage, poids, nutrition, sommeil)');
  await pageMac.screenshot({ path: `${SORTIE}/j7-05-mac.png` });
  await mac.close();
  verifier(!(await page.getByRole('region', { name: 'Analyse' }).count()), 'pas de tableaux sur iPhone');

  verifier(erreurs.length === 0, `aucune erreur dans la console${erreurs.length ? ' : ' + erreurs.join(' | ') : ''}`);
} catch (e) {
  echecs++;
  console.log('  ✗ ÉCHEC :', e.message);
  await capture('zz-echec-j7').catch(() => undefined);
} finally {
  await navigateur.close();
  serveur.kill();
}
console.log(`\n${etapes - echecs}/${etapes} vérifications réussies`);
process.exit(echecs ? 1 : 0);
