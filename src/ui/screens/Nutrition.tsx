import { nombre } from '../../domain/format';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  additionner, COMPLEMENTS, ETIQUETTES, pourQuantite, rechercher, texteQuantite, ZERO,
  type Aliment, type EntreeJournal, type Etiquette, type Nutriments, type Portion
} from '../../domain/aliments';
import {
  EXPLICATIONS, NOMS_MODES, NOMS_RYTHMES, NUTRITION_DEFAUT, ecartJournalier, objectifsDuJour,
  type ModeNutrition, type ReglageNutrition, type RythmeNutrition
} from '../../domain/nutrition';
import {
  ajouterAuJournal, ajouterRepas, alimentsConnus, alimentsSuisses, basculerFavori, chercherCode, copierJour, enregistrerAliment,
  enregistrerRepas, entreeDepuisAliment, journalDuJour, listeRepas, mettreEnAttente, modifierEntree, rechercherCodesEnAttente,
  rechercherOFF, restaurerEntrees, sportDuJour, supprimerEntree, supprimerEntrees, supprimerRepas
} from '../../data/nutrition';
import { lireReglage, ecrireReglage } from '../../data/operations';
import { nouvelId } from '../../data/db';
import { useReglage } from '../reglages';
import { usePoids } from '../corps';
import { cleDuJour } from '../journee';
import { Feuille } from '../Feuille';
import { Scanner } from '../Scanner';
import { afficherBandeau } from '../bandeau';
import { proposerAjustement } from '../../domain/ajustement';
import { joursDAffilee, performances } from '../../data/bilan';

const ent = (x: number) => nombre(x);
const g1 = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');

function decaler(jour: string, n: number): string {
  const [a, m, j] = jour.split('-').map(Number);
  return cleDuJour(new Date(a, m - 1, j + n, 12).getTime());
}

function nomDuJour(jour: string, aujourdhui: string): string {
  if (jour === aujourdhui) return 'Aujourd’hui';
  if (jour === decaler(aujourdhui, -1)) return 'Hier';
  const [a, m, j] = jour.split('-').map(Number);
  return new Date(a, m - 1, j).toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ---------- Écran principal ----------

export function Nutrition() {
  const [profil, setProfil] = useReglage('profil');
  const aujourdhui = cleDuJour();
  const [jour, setJour] = useState(aujourdhui);
  const { poids, pesees, tailles } = usePoids();
  const [ajDepuis, setAjDepuis] = useReglage('ajustementDepuis');
  const perfs = useLiveQuery(() => performances());
  const connus = useLiveQuery(() => alimentsConnus());
  const jours60 = useMemo(() => Array.from({ length: 60 }, (_, i) => decaler(aujourdhui, -i)), [aujourdhui]);
  const pris = useLiveQuery(async () => Promise.all(COMPLEMENTS.map((c) => joursDAffilee(c.id, jours60))), [jours60]);
  const reglage = useLiveQuery(() => lireReglage<ReglageNutrition>('nutrition', NUTRITION_DEFAUT));
  const entrees = useLiveQuery(() => journalDuJour(jour), [jour]);
  const sport = useLiveQuery(() => sportDuJour(jour, poids), [jour, poids]);
  const [feuille, setFeuille] = useState<'ajout' | 'scanner' | 'objectif' | 'repas' | 'info' | null>(null);
  const [edition, setEdition] = useState<EntreeJournal | null>(null);

  // Codes scannés sans réseau : recherchés dès que la connexion revient.
  useEffect(() => {
    const essayer = () =>
      void rechercherCodesEnAttente().then((t) => {
        if (t.length) afficherBandeau(`${t.length} produit${t.length > 1 ? 's' : ''} en attente retrouvé${t.length > 1 ? 's' : ''} : dans vos aliments récents`);
      });
    essayer();
    window.addEventListener('online', essayer);
    return () => window.removeEventListener('online', essayer);
  }, []);

  if (profil && !profil.modules.nutrition) {
    return (
      <main className="ecran">
        <h1 className="titre">Nutrition</h1>
        <div className="carte">
          <span className="doux">Le suivi de la nutrition est désactivé.</span>
          <button className="bouton principal plein" onClick={() => void setProfil({ ...profil, modules: { ...profil.modules, nutrition: true } })}>Activer</button>
        </div>
      </main>
    );
  }
  if (!profil || !reglage || !entrees || !sport) return <main className="ecran" aria-busy="true" />;

  const kcalSport = sport.reduce((t, s) => t + s.kcal, 0);
  const obj = objectifsDuJour(profil, poids, reglage, kcalSport);
  const total = additionner(entrees.map((e) => e.nutriments));
  const ecart = Math.round(ecartJournalier(reglage, poids) + reglage.correctionKcal);

  // Ajustement automatique toutes les 2 semaines (9.3), avec la règle I2.
  const proposition =
    pesees && tailles && pesees.length
      ? proposerAjustement({ pesees, tailles, reglage, poidsKg: poids, depuis: ajDepuis || pesees[0].date, maintenant: Date.now(), performancesEnHausse: perfs === 'hausse' })
      : undefined;

  // Idée I5 : finir ses protéines avec ses propres aliments, riches en protéines.
  const resteProt = obj.proteines - total.proteines;
  const idees = (() => {
    if (jour !== aujourdhui || resteProt < 10 || !connus) return [];
    const candidats = [...connus.filter((a) => a.favori), ...connus.filter((a) => !a.favori && a.dernierUsage), COMPLEMENTS[0]];
    const vus = new Set<string>();
    const res: { a: Aliment; g: number; texte: string }[] = [];
    for (const a of candidats) {
      if (vus.has(a.id) || res.length >= 2) continue;
      vus.add(a.id);
      const p = a.pour100.proteines;
      if (p < 8 || a.pour100.kcal / p > 12) continue;
      const portion = a.portions[0];
      if (portion) {
        const nb = Math.min(2, Math.max(0.5, Math.round(((resteProt / ((p * portion.g) / 100)) * 2)) / 2));
        res.push({ a, g: nb * portion.g, texte: `${String(nb).replace('.', ',')} × ${portion.nom} de ${a.nom}` });
      } else {
        const g = Math.min(500, Math.max(10, Math.round((resteProt / p) * 10) * 10));
        res.push({ a, g, texte: `${g} ${a.ml ? 'ml' : 'g'} de ${a.nom}` });
      }
    }
    return res;
  })();

  async function ajouterComplement(c: Aliment) {
    const connu = (await alimentsConnus()).find((a) => a.id === c.id) ?? c;
    const p = connu.portions[0];
    const e = await ajouterAuJournal(connu, entreeDepuisAliment(connu, p.g, p.nom), jour);
    afficherBandeau(`${connu.nom} ajouté`, () => supprimerEntree(e.id));
  }

  return (
    <main className="ecran">
      <div className="ligne ecartee">
        <button className="bouton rond" aria-label="Jour précédent" onClick={() => setJour(decaler(jour, -1))}>‹</button>
        <h1 className="titre-2">{nomDuJour(jour, aujourdhui)}</h1>
        <button className="bouton rond" aria-label="Jour suivant" disabled={jour >= aujourdhui} onClick={() => setJour(decaler(jour, 1))}>›</button>
      </div>

      <section className="carte" aria-label="Jauges du jour">
        <JaugeGrande
          nom="Calories"
          valeur={total.kcal}
          cible={obj.kcal}
          unite="kcal"
          texte={
            obj.typeKcal === 'plafond'
              ? total.kcal <= obj.kcal ? `Il reste ${ent(obj.kcal - total.kcal)} kcal` : `${ent(total.kcal - obj.kcal)} kcal au-dessus`
              : obj.typeKcal === 'minimum'
                ? total.kcal < obj.kcal ? `Encore ${ent(obj.kcal - total.kcal)} kcal` : 'Minimum atteint'
                : `${ent(Math.abs(obj.kcal - total.kcal))} kcal ${total.kcal <= obj.kcal ? 'restantes' : 'au-dessus'}`
          }
        />
        <JaugeGrande
          nom="Protéines"
          valeur={total.proteines}
          cible={obj.proteines}
          unite="g"
          texte={total.proteines < obj.proteines ? `Encore ${ent(obj.proteines - total.proteines)} g` : 'Minimum atteint'}
        />
        <div className="grille-3">
          <JaugePetite nom="Lipides" valeur={total.lipides} cible={obj.lipides} />
          <JaugePetite nom="Glucides" valeur={total.glucides} cible={obj.glucides} />
          <JaugePetite nom="Fibres" valeur={total.fibres} cible={obj.fibres} />
        </div>
        <button className="bouton discret petit" style={{ alignSelf: 'flex-start', padding: 0, minHeight: 44, color: 'var(--accent)', fontWeight: 600 }} onClick={() => setFeuille('info')}>
          D’où vient l’objectif ?
        </button>
      </section>

      {jour === aujourdhui && proposition && (proposition.etat === 'proposition' || proposition.etat === 'aucun') && (
        <section className="carte compacte alerte" aria-label="Ajustement de l’objectif">
          <span className="gras">Ajustement de l’objectif (toutes les 2 semaines)</span>
          <span className="petit">{proposition.texte}</span>
          {proposition.etat === 'proposition' ? (
            <div className="grille-2">
              <button className="bouton" onClick={async () => { const avant = ajDepuis; await setAjDepuis(Date.now()); afficherBandeau('Ancien objectif gardé', () => setAjDepuis(avant)); }}>Garder l’ancien</button>
              <button
                className="bouton clair"
                onClick={async () => {
                  const avant = { reglage, ajDepuis };
                  await ecrireReglage('nutrition', { ...reglage, correctionKcal: reglage.correctionKcal + proposition.delta });
                  await setAjDepuis(Date.now());
                  afficherBandeau('Objectif ajusté', async () => { await ecrireReglage('nutrition', avant.reglage); await setAjDepuis(avant.ajDepuis); });
                }}
              >
                Accepter
              </button>
            </div>
          ) : (
            <button className="bouton" onClick={() => void setAjDepuis(Date.now())}>OK</button>
          )}
        </section>
      )}

      {idees.length > 0 && (
        <section className="carte compacte" aria-label="Idées pour finir ses protéines">
          <span className="petit">Il vous reste {ent(resteProt)} g de protéines. Par exemple :</span>
          {idees.map((i) => (
            <button
              key={i.a.id}
              className="bouton discret"
              style={{ alignSelf: 'flex-start', paddingLeft: 0, textAlign: 'left' }}
              onClick={async () => {
                const portion = i.a.portions[0];
                const nb = portion ? i.g / portion.g : 1;
                const e = await ajouterAuJournal(i.a, entreeDepuisAliment(i.a, i.g, texteQuantite(i.g, portion, nb, i.a.ml)), jour);
                afficherBandeau(`${i.a.nom} ajouté`, () => supprimerEntree(e.id));
              }}
            >
              + {i.texte}
            </button>
          ))}
        </section>
      )}

      <section className="pile" aria-label="Ajouter">
        <div className="grille-2">
          <button className="bouton principal" onClick={() => setFeuille('ajout')}>Ajouter un aliment</button>
          <button className="bouton" onClick={() => setFeuille('scanner')}>Scanner</button>
        </div>
        <div className="raccourcis" role="group" aria-label="Compléments en un geste">
          {COMPLEMENTS.map((c, i) => {
            const p = jour === aujourdhui ? pris?.[i] : undefined;
            return (
              <button key={c.id} className="bouton" onClick={() => void ajouterComplement(c)} aria-label={`Ajouter 1 dose : ${c.nom}`} aria-pressed={!!p?.aujourdhui}>
                <span>{p?.aujourdhui ? '✓ ' : ''}{c.nom.replace(' en poudre', '')}</span>
                <span className="doux" style={{ fontSize: 11 }}>{p?.aujourdhui ? 'pris' : '+ 1 dose'}</span>
              </button>
            );
          })}
        </div>
        {pris && jour === aujourdhui && pris[1].serie > 0 && (
          <span className="doux petit">
            Créatine : {pris[1].serie} jour{pris[1].serie > 1 ? 's' : ''} d’affilée{pris[1].aujourdhui ? '' : ' (pas encore aujourd’hui)'}. Elle agit si elle est prise chaque jour.
          </span>
        )}
      </section>

      <section className="pile" aria-label="Journal">
        <h2 className="titre-2">Journal</h2>
        {entrees.length === 0 ? (
          <div className="carte compacte">
            <span className="doux">Rien de noté {jour === aujourdhui ? 'aujourd’hui' : 'ce jour-là'}.</span>
            <button
              className="bouton"
              onClick={async () => {
                const copies = await copierJour(decaler(jour, -1), jour);
                if (!copies.length) afficherBandeau('Rien à copier : la veille est vide');
                else afficherBandeau(`${copies.length} aliment${copies.length > 1 ? 's' : ''} copié${copies.length > 1 ? 's' : ''} de la veille`, () => supprimerEntrees(copies.map((c) => c.id)));
              }}
            >
              Copier la veille
            </button>
          </div>
        ) : (
          <div className="carte" style={{ gap: 0, paddingTop: 4, paddingBottom: 4 }}>
            {entrees.map((e) => (
              <button key={e.id} className="lien-liste" onClick={() => setEdition(e)} aria-label={`Modifier : ${e.nom}`}>
                <div className="ligne ecartee" style={{ width: '100%', gap: 8 }}>
                  <span className="gras" style={{ textAlign: 'left' }}>{e.nom}</span>
                  <span className="gras" style={{ whiteSpace: 'nowrap' }}>{ent(e.nutriments.kcal)} kcal</span>
                </div>
                <span className="doux petit">
                  {new Date(e.ajouteLe).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                  {e.etiquette ? ` · ${ETIQUETTES.find((x) => x.id === e.etiquette)?.nom}` : ''} · {e.quantite} · {g1(e.nutriments.proteines)} g de protéines
                </span>
              </button>
            ))}
          </div>
        )}
        {entrees.length > 0 && (
          <div className="grille-2">
            <button className="bouton" onClick={() => setFeuille('repas')}>Enregistrer comme repas</button>
            <button
              className="bouton"
              onClick={async () => {
                const copies = await copierJour(decaler(jour, -1), jour);
                if (!copies.length) afficherBandeau('Rien à copier : la veille est vide');
                else afficherBandeau(`${copies.length} aliment${copies.length > 1 ? 's' : ''} copié${copies.length > 1 ? 's' : ''} de la veille`, () => supprimerEntrees(copies.map((c) => c.id)));
              }}
            >
              Copier la veille
            </button>
          </div>
        )}
      </section>

      <section className="carte compacte" aria-label="Sport du jour">
        <div className="ligne ecartee">
          <span className="gras">Sport du jour</span>
          <span className="gras">{kcalSport ? `+ ${ent(kcalSport)} kcal` : '—'}</span>
        </div>
        {sport.length ? (
          sport.map((s) => <span key={s.id} className="doux petit">{s.nom} · {s.minutes} min · {ent(s.kcal)} kcal</span>)
        ) : (
          <span className="doux petit">Les séances et activités terminées ce jour-là s’ajoutent ici et augmentent l’objectif du jour.</span>
        )}
      </section>

      <button className="bouton plein" onClick={() => setFeuille('objectif')}>
        Objectif : {NOMS_MODES[reglage.mode].toLowerCase()}{reglage.mode !== 'maintien' ? `, rythme ${NOMS_RYTHMES[reglage.rythme]}` : ''} · Modifier
      </button>
      <span className="doux petit">Estimations, pas des prescriptions médicales. Valeurs des aliments : Base de données suisse des valeurs nutritives (OSAV, naehrwertdaten.ch) et Open Food Facts.</span>

      {feuille === 'ajout' && <FeuilleAjout jour={jour} onFermer={() => setFeuille(null)} />}
      {feuille === 'scanner' && <FeuilleAjout jour={jour} scanner onFermer={() => setFeuille(null)} />}
      {feuille === 'objectif' && <FeuilleObjectif reglage={reglage} poids={poids} onFermer={() => setFeuille(null)} />}
      {feuille === 'repas' && <FeuilleEnregistrerRepas entrees={entrees} onFermer={() => setFeuille(null)} />}
      {feuille === 'info' && (
        <Feuille titre="D’où viennent les objectifs" onFermer={() => setFeuille(null)}>
          <div className="pile" style={{ gap: 4 }}>
            <span className="gras">Calcul du jour</span>
            <span className="petit">Dépense sans sport : {ent(obj.base)} kcal</span>
            <span className="petit">Sport du jour : + {ent(obj.sport)} kcal</span>
            <span className="petit">Écart visé ({NOMS_MODES[reglage.mode].toLowerCase()}{reglage.mode !== 'maintien' ? ` ${NOMS_RYTHMES[reglage.rythme]}` : ''}) : {ecart < 0 ? '−' : '+'} {ent(Math.abs(ecart))} kcal</span>
            <span className="petit gras">Objectif : {ent(obj.kcal)} kcal ({obj.typeKcal}){obj.plancher ? ' — plancher de sécurité appliqué' : ''}</span>
            <span className="doux petit">Poids utilisé : {g1(poids)} kg (tendance de vos pesées, sinon le poids du profil).</span>
            <span className="doux petit">
              Ajustement automatique : {proposition ? proposition.texte : 'commence avec les pesées (au moins 4 sur 2 semaines).'}
              {reglage.correctionKcal ? ` Correction en cours : ${reglage.correctionKcal > 0 ? '+' : '−'} ${ent(Math.abs(reglage.correctionKcal))} kcal.` : ''}
            </span>
          </div>
          {(Object.keys(EXPLICATIONS) as (keyof typeof EXPLICATIONS)[]).map((k) => (
            <span key={k} className="petit"><span className="gras">{k === 'kcal' ? 'Calories' : k[0].toUpperCase() + k.slice(1)} : </span>{EXPLICATIONS[k]}</span>
          ))}
        </Feuille>
      )}
      {edition && <FeuilleEntree entree={edition} onFermer={() => setEdition(null)} />}
    </main>
  );
}

function JaugeGrande({ nom, valeur, cible, unite, texte }: { nom: string; valeur: number; cible: number; unite: string; texte: string }) {
  return (
    <div className="pile" style={{ gap: 6 }} aria-label={`${nom} : ${ent(valeur)} sur ${ent(cible)} ${unite}`}>
      <div className="ligne ecartee" style={{ alignItems: 'baseline' }}>
        <span className="gras">{nom}</span>
        <span className="jauge-valeurs"><span className="grand-chiffre" style={{ fontSize: 26 }}>{ent(valeur)}</span><span className="doux petit"> / {ent(cible)} {unite}</span></span>
      </div>
      <div className="jauge"><div style={{ width: `${Math.min(100, (valeur / Math.max(1, cible)) * 100)}%` }} /></div>
      <span className="doux petit">{texte}</span>
    </div>
  );
}

function JaugePetite({ nom, valeur, cible }: { nom: string; valeur: number; cible: number }) {
  return (
    <div className="pile" style={{ gap: 4 }}>
      <span className="petit gras">{nom}</span>
      <div className="jauge petite"><div style={{ width: `${Math.min(100, (valeur / Math.max(1, cible)) * 100)}%` }} /></div>
      <span className="doux petit">{ent(valeur)} / {ent(cible)} g</span>
    </div>
  );
}

// ---------- Ajouter un aliment ----------

type Etape =
  | { type: 'liste' }
  | { type: 'scanner' }
  | { type: 'quantite'; aliment: Aliment }
  | { type: 'perso'; code?: string; nom?: string; message?: string }
  | { type: 'estimation' };

function FeuilleAjout({ jour, scanner, onFermer }: { jour: string; scanner?: boolean; onFermer: () => void }) {
  const [etape, setEtape] = useState<Etape>(scanner ? { type: 'scanner' } : { type: 'liste' });
  const [recherche, setRecherche] = useState('');
  const [enLigne, setEnLigne] = useState<Aliment[] | 'hors_ligne' | 'attente' | null>(null);
  const connus = useLiveQuery(() => alimentsConnus());
  const suisses = useLiveQuery(() => alimentsSuisses());
  const repas = useLiveQuery(() => listeRepas());

  const resultatsConnus = useMemo(() => (connus && recherche ? rechercher(connus, recherche, 10) : []), [connus, recherche]);
  const resultatsSuisses = useMemo(() => {
    if (!suisses || !recherche) return [];
    const ids = new Set(resultatsConnus.map((a) => a.id));
    return rechercher(suisses, recherche, 25).filter((a) => !ids.has(a.id));
  }, [suisses, recherche, resultatsConnus]);

  const surCode = useCallback(async (code: string) => {
    setEtape({ type: 'liste' });
    afficherBandeau(`Code ${code} : recherche…`);
    const r = await chercherCode(code);
    if (r.etat === 'trouve') setEtape({ type: 'quantite', aliment: r.aliment });
    else if (r.etat === 'hors_ligne') {
      await mettreEnAttente(code);
      setEtape({ type: 'perso', code, message: 'Pas de réseau : le code est gardé et sera recherché au retour de la connexion. Vous pouvez aussi saisir l’étiquette maintenant.' });
    } else if (r.etat === 'incomplet') setEtape({ type: 'perso', code, nom: r.nom, message: 'Produit trouvé, mais sans calories ou protéines fiables. Recopiez l’étiquette (valeurs pour 100 g) : il sera reconnu les fois suivantes.' });
    else setEtape({ type: 'perso', code, message: 'Produit inconnu d’Open Food Facts. Recopiez l’étiquette (valeurs pour 100 g) : il sera reconnu les fois suivantes.' });
  }, []);

  if (etape.type === 'scanner') return <Scanner onCode={(c) => void surCode(c)} onFermer={scanner ? onFermer : () => setEtape({ type: 'liste' })} />;
  if (etape.type === 'quantite') return <FeuilleQuantite aliment={etape.aliment} jour={jour} onRetour={() => setEtape({ type: 'liste' })} onFermer={onFermer} />;
  if (etape.type === 'perso')
    return <FeuilleAlimentPerso code={etape.code} nom={etape.nom} message={etape.message} onRetour={() => setEtape({ type: 'liste' })} onCree={(a) => setEtape({ type: 'quantite', aliment: a })} />;
  if (etape.type === 'estimation') return <FeuilleEstimation jour={jour} onFermer={onFermer} onRetour={() => setEtape({ type: 'liste' })} />;

  const ligne = (a: Aliment) => (
    <button key={a.id} className="lien-liste" onClick={() => setEtape({ type: 'quantite', aliment: a })}>
      <span className="gras" style={{ textAlign: 'left' }}>{a.favori ? '★ ' : ''}{a.nom}{a.marque ? ` · ${a.marque}` : ''}</span>
      <span className="doux petit">{ent(a.pour100.kcal)} kcal · {g1(a.pour100.proteines)} g de protéines pour 100 {a.ml ? 'ml' : 'g'}</span>
    </button>
  );
  const favoris = (connus ?? []).filter((a) => a.favori);
  const recents = (connus ?? []).filter((a) => !a.favori && a.dernierUsage).slice(0, 12);

  return (
    <Feuille titre="Ajouter un aliment" onFermer={onFermer}>
      <input
        className="champ-texte"
        type="search"
        autoFocus
        placeholder="Chercher : œuf, poulet, pizza…"
        aria-label="Chercher un aliment"
        value={recherche}
        onChange={(e) => { setRecherche(e.target.value); setEnLigne(null); }}
      />
      <div className="grille-3">
        <button className="bouton" onClick={() => setEtape({ type: 'scanner' })}>Scanner</button>
        <button className="bouton" onClick={() => setEtape({ type: 'estimation' })}>Estimation</button>
        <button className="bouton" onClick={() => setEtape({ type: 'perso' })}>Créer</button>
      </div>
      <div className="pile" style={{ gap: 12, maxHeight: '52dvh', overflowY: 'auto' }}>
        {!recherche && (
          <>
            {repas && repas.length > 0 && (
              <div className="pile" style={{ gap: 4 }}>
                <span className="petit gras doux">Repas enregistrés</span>
                <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>
                  {repas.map((r) => {
                    const t = additionner(r.elements.map((e) => e.nutriments));
                    return (
                      <div key={r.id} className="element-liste">
                        <button
                          className="lien-liste"
                          style={{ border: 'none', flex: 1 }}
                          onClick={async () => {
                            const ajoutes = await ajouterRepas(r, jour);
                            onFermer();
                            afficherBandeau(`${r.nom} ajouté`, () => supprimerEntrees(ajoutes.map((e) => e.id)));
                          }}
                        >
                          <span className="gras">{r.nom}</span>
                          <span className="doux petit">{r.elements.length} aliments · {ent(t.kcal)} kcal · {g1(t.proteines)} g de protéines</span>
                        </button>
                        <button className="bouton discret danger" aria-label={`Supprimer le repas ${r.nom}`} onClick={async () => { await supprimerRepas(r.id); afficherBandeau('Repas supprimé', () => enregistrerRepas(r.nom, r.elements as EntreeJournal[]).then(() => undefined)); }}>×</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {favoris.length > 0 && (
              <div className="pile" style={{ gap: 4 }}>
                <span className="petit gras doux">Favoris</span>
                <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>{favoris.map(ligne)}</div>
              </div>
            )}
            {recents.length > 0 ? (
              <div className="pile" style={{ gap: 4 }}>
                <span className="petit gras doux">Récents</span>
                <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>{recents.map(ligne)}</div>
              </div>
            ) : (
              <span className="doux petit">Tapez un nom : la base suisse (1 246 aliments et plats courants) fonctionne sans réseau. Vos aliments utilisés apparaîtront ici.</span>
            )}
          </>
        )}
        {recherche && (
          <>
            {resultatsConnus.length > 0 && (
              <div className="pile" style={{ gap: 4 }}>
                <span className="petit gras doux">Vos aliments</span>
                <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>{resultatsConnus.map(ligne)}</div>
              </div>
            )}
            <div className="pile" style={{ gap: 4 }}>
              <span className="petit gras doux">Base suisse des valeurs nutritives</span>
              {resultatsSuisses.length ? (
                <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>{resultatsSuisses.map(ligne)}</div>
              ) : (
                <span className="doux petit">{suisses ? 'Aucun résultat.' : 'Chargement…'}</span>
              )}
            </div>
            <div className="pile" style={{ gap: 4 }}>
              <span className="petit gras doux">Produits emballés (Open Food Facts)</span>
              {Array.isArray(enLigne) ? (
                enLigne.length ? <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0 }}>{enLigne.map(ligne)}</div> : <span className="doux petit">Aucun produit trouvé en Suisse.</span>
              ) : (
                <button
                  className="bouton"
                  disabled={enLigne === 'attente'}
                  onClick={async () => {
                    setEnLigne('attente');
                    setEnLigne(await rechercherOFF(recherche));
                  }}
                >
                  {enLigne === 'attente' ? 'Recherche…' : enLigne === 'hors_ligne' ? 'Pas de réseau · Réessayer' : `Chercher « ${recherche} » en ligne`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Feuille>
  );
}

function FeuilleQuantite({ aliment, jour, onRetour, onFermer }: { aliment: Aliment; jour: string; onRetour: () => void; onFermer: () => void }) {
  const portions: Portion[] = aliment.portions;
  const [portion, setPortion] = useState<Portion | undefined>(portions[0]);
  const [nb, setNb] = useState(1);
  const [grammes, setGrammes] = useState(portions[0] ? portions[0].g : 100);
  const [etiquette, setEtiquette] = useState<Etiquette | undefined>();
  const favori = useLiveQuery(async () => !!(await alimentsConnus()).find((a) => a.id === aliment.id)?.favori, [aliment.id]);
  const g = portion ? portion.g * nb : grammes;
  const n = pourQuantite(aliment.pour100, g);
  const u = aliment.ml ? 'ml' : 'g';

  return (
    <Feuille titre={aliment.nom} onFermer={onFermer}>
      <div className="ligne ecartee">
        <span className="doux petit">{aliment.marque ? `${aliment.marque} · ` : ''}{aliment.source === 'suisse' ? 'Base suisse' : aliment.source === 'off' ? 'Open Food Facts' : aliment.source === 'complement' ? 'Complément' : 'Votre aliment'}</span>
        <button className="bouton discret" aria-pressed={!!favori} onClick={() => void basculerFavori(aliment)}>{favori ? '★ Favori' : '☆ Favori'}</button>
      </div>
      <div className="pilules" role="group" aria-label="Portion">
        {portions.map((p) => (
          <button key={p.nom} className="bouton" aria-pressed={portion?.nom === p.nom} onClick={() => { setPortion(p); setNb(1); }}>{p.nom}</button>
        ))}
        <button className="bouton" aria-pressed={!portion} onClick={() => { setPortion(undefined); setGrammes(Math.round(g)); }}>En {u}</button>
      </div>
      {portion ? (
        <div className="ligne ecartee">
          <button className="bouton rond" aria-label="Une portion de moins" onClick={() => setNb((x) => Math.max(0.5, x - 0.5))}>−</button>
          <span className="grand-chiffre" style={{ fontSize: 32 }}>{String(nb).replace('.', ',')} × <small>{portion.nom}</small></span>
          <button className="bouton rond" aria-label="Une portion de plus" onClick={() => setNb((x) => x + 0.5)}>+</button>
        </div>
      ) : (
        <label className="pile" style={{ gap: 4 }}>
          <span className="petit gras">Quantité ({u})</span>
          <input className="champ-nombre" type="number" inputMode="decimal" min={0} aria-label={`Quantité en ${u}`} value={grammes || ''} onChange={(e) => setGrammes(Number(e.target.value.replace(',', '.')) || 0)} />
        </label>
      )}
      <div className="valeurs-100">
        <div className="pile" style={{ gap: 0 }}><span className="gras">{ent(n.kcal)}</span><span className="doux petit">kcal</span></div>
        <div className="pile" style={{ gap: 0 }}><span className="gras">{g1(n.proteines)}</span><span className="doux petit">prot.</span></div>
        <div className="pile" style={{ gap: 0 }}><span className="gras">{g1(n.lipides)}</span><span className="doux petit">lip.</span></div>
        <div className="pile" style={{ gap: 0 }}><span className="gras">{g1(n.glucides)}</span><span className="doux petit">gluc.</span></div>
        <div className="pile" style={{ gap: 0 }}><span className="gras">{g1(n.fibres)}</span><span className="doux petit">fibres</span></div>
      </div>
      <div className="pilules" role="group" aria-label="Étiquette (facultatif)">
        {ETIQUETTES.map((x) => (
          <button key={x.id} className="bouton" aria-pressed={etiquette === x.id} onClick={() => setEtiquette(etiquette === x.id ? undefined : x.id)}>{x.nom}</button>
        ))}
      </div>
      <div className="grille-2">
        <button className="bouton" onClick={onRetour}>Retour</button>
        <button
          className="bouton principal"
          disabled={g <= 0}
          onClick={async () => {
            const e = await ajouterAuJournal(aliment, { ...entreeDepuisAliment(aliment, g, texteQuantite(g, portion, nb, aliment.ml)), etiquette }, jour);
            onFermer();
            afficherBandeau(`${aliment.nom} ajouté`, () => supprimerEntree(e.id));
          }}
        >
          Ajouter
        </button>
      </div>
    </Feuille>
  );
}

function champNombre(v: string): number | undefined {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function FeuilleAlimentPerso({ code, nom: nomInitial, message, onRetour, onCree }: { code?: string; nom?: string; message?: string; onRetour: () => void; onCree: (a: Aliment) => void }) {
  const [nom, setNom] = useState(nomInitial ?? '');
  const [v, setV] = useState({ kcal: '', proteines: '', lipides: '', glucides: '', fibres: '' });
  const [portion, setPortion] = useState({ nom: '', g: '' });
  const kcal = champNombre(v.kcal);
  const prot = champNombre(v.proteines);
  const valide = nom.trim() && kcal !== undefined && prot !== undefined && kcal <= 900;
  const champ = (k: keyof typeof v, label: string, obligatoire = false) => (
    <label className="pile" style={{ gap: 2 }}>
      <span className="petit gras">{label}{obligatoire ? ' *' : ''}</span>
      <input className="champ-texte" inputMode="decimal" aria-label={label} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
    </label>
  );
  return (
    <Feuille titre="Nouvel aliment" onFermer={onRetour}>
      {message && <span className="petit">{message}</span>}
      {code && <span className="doux petit">Code-barres : {code}</span>}
      <input className="champ-texte" placeholder="Nom du produit" aria-label="Nom du produit" value={nom} onChange={(e) => setNom(e.target.value)} />
      <span className="petit gras doux">Valeurs pour 100 g (comme sur l’étiquette)</span>
      <div className="grille-2">
        {champ('kcal', 'Calories (kcal)', true)}
        {champ('proteines', 'Protéines (g)', true)}
        {champ('lipides', 'Lipides (g)')}
        {champ('glucides', 'Glucides (g)')}
        {champ('fibres', 'Fibres (g)')}
      </div>
      <span className="petit gras doux">Portion (facultatif)</span>
      <div className="grille-2">
        <input className="champ-texte" placeholder="1 pot, 1 barre…" aria-label="Nom de la portion" value={portion.nom} onChange={(e) => setPortion({ ...portion, nom: e.target.value })} />
        <input className="champ-texte" inputMode="decimal" placeholder="grammes" aria-label="Grammes de la portion" value={portion.g} onChange={(e) => setPortion({ ...portion, g: e.target.value })} />
      </div>
      <div className="grille-2">
        <button className="bouton" onClick={onRetour}>Retour</button>
        <button
          className="bouton principal"
          disabled={!valide}
          onClick={async () => {
            const pg = champNombre(portion.g);
            const a: Aliment = {
              id: code ? `off-${code}` : `perso-${nouvelId()}`,
              nom: nom.trim(),
              source: 'perso',
              code,
              pour100: { kcal: kcal!, proteines: prot!, lipides: champNombre(v.lipides) ?? 0, glucides: champNombre(v.glucides) ?? 0, fibres: champNombre(v.fibres) ?? 0 },
              portions: pg ? [{ nom: portion.nom.trim() || `1 portion (${pg} g)`, g: pg }] : []
            };
            await enregistrerAliment(a);
            onCree(a);
          }}
        >
          Enregistrer
        </button>
      </div>
    </Feuille>
  );
}

function FeuilleEstimation({ jour, onRetour, onFermer }: { jour: string; onRetour: () => void; onFermer: () => void }) {
  const [nom, setNom] = useState('');
  const [kcal, setKcal] = useState('');
  const [prot, setProt] = useState('');
  const k = champNombre(kcal);
  const p = champNombre(prot);
  return (
    <Feuille titre="Estimation rapide" onFermer={onFermer}>
      <span className="doux petit">Pour un restaurant ou une livraison : notez une estimation. Astuce : la base suisse contient aussi des plats courants (burger, pizza, kebab, lasagne…).</span>
      <input className="champ-texte" placeholder="Par exemple : burger et frites" aria-label="Nom du repas" value={nom} onChange={(e) => setNom(e.target.value)} />
      <div className="grille-2">
        <label className="pile" style={{ gap: 2 }}><span className="petit gras">Calories (kcal) *</span><input className="champ-texte" inputMode="numeric" aria-label="Calories estimées" value={kcal} onChange={(e) => setKcal(e.target.value)} /></label>
        <label className="pile" style={{ gap: 2 }}><span className="petit gras">Protéines (g)</span><input className="champ-texte" inputMode="numeric" aria-label="Protéines estimées" value={prot} onChange={(e) => setProt(e.target.value)} /></label>
      </div>
      <div className="grille-2">
        <button className="bouton" onClick={onRetour}>Retour</button>
        <button
          className="bouton principal"
          disabled={k === undefined}
          onClick={async () => {
            const n: Nutriments = { ...ZERO, kcal: k!, proteines: p ?? 0 };
            const e = await ajouterAuJournal(undefined, { nom: nom.trim() || 'Repas estimé', grammes: 0, quantite: 'estimation', nutriments: n }, jour);
            onFermer();
            afficherBandeau('Estimation ajoutée', () => supprimerEntree(e.id));
          }}
        >
          Ajouter
        </button>
      </div>
    </Feuille>
  );
}

// ---------- Modifier une entrée du journal ----------

function FeuilleEntree({ entree, onFermer }: { entree: EntreeJournal; onFermer: () => void }) {
  const [grammes, setGrammes] = useState(String(Math.round(entree.grammes)));
  const [etiquette, setEtiquette] = useState<Etiquette | undefined>(entree.etiquette);
  const estimation = entree.grammes <= 0;
  const [kcal, setKcal] = useState(String(Math.round(entree.nutriments.kcal)));
  const [prot, setProt] = useState(String(Math.round(entree.nutriments.proteines)));
  return (
    <Feuille titre={entree.nom} onFermer={onFermer}>
      {estimation ? (
        <div className="grille-2">
          <label className="pile" style={{ gap: 2 }}><span className="petit gras">Calories (kcal)</span><input className="champ-texte" inputMode="numeric" aria-label="Calories" value={kcal} onChange={(e) => setKcal(e.target.value)} /></label>
          <label className="pile" style={{ gap: 2 }}><span className="petit gras">Protéines (g)</span><input className="champ-texte" inputMode="numeric" aria-label="Protéines" value={prot} onChange={(e) => setProt(e.target.value)} /></label>
        </div>
      ) : (
        <label className="pile" style={{ gap: 4 }}>
          <span className="petit gras">Quantité en grammes (actuellement : {entree.quantite})</span>
          <input className="champ-nombre" inputMode="decimal" aria-label="Quantité en grammes" value={grammes} onChange={(e) => setGrammes(e.target.value)} />
        </label>
      )}
      <div className="pilules" role="group" aria-label="Étiquette">
        {ETIQUETTES.map((x) => (
          <button key={x.id} className="bouton" aria-pressed={etiquette === x.id} onClick={() => setEtiquette(etiquette === x.id ? undefined : x.id)}>{x.nom}</button>
        ))}
      </div>
      <div className="grille-2">
        <button
          className="bouton danger"
          onClick={async () => {
            await supprimerEntree(entree.id);
            onFermer();
            afficherBandeau(`${entree.nom} supprimé`, () => restaurerEntrees([entree]));
          }}
        >
          Supprimer
        </button>
        <button
          className="bouton principal"
          onClick={async () => {
            const avant = entree;
            if (estimation) {
              await modifierEntree(entree.id, { etiquette, nutriments: { ...entree.nutriments, kcal: champNombre(kcal) ?? entree.nutriments.kcal, proteines: champNombre(prot) ?? entree.nutriments.proteines } });
            } else {
              const g = champNombre(grammes);
              if (!g) return;
              const k = g / entree.grammes;
              const n = entree.nutriments;
              await modifierEntree(entree.id, {
                etiquette,
                grammes: g,
                quantite: g === entree.grammes ? entree.quantite : `${Math.round(g)} g`,
                nutriments: { kcal: n.kcal * k, proteines: n.proteines * k, lipides: n.lipides * k, glucides: n.glucides * k, fibres: n.fibres * k }
              });
            }
            onFermer();
            afficherBandeau('Modifié', () => restaurerEntrees([avant]));
          }}
        >
          Enregistrer
        </button>
      </div>
    </Feuille>
  );
}

// ---------- Repas enregistrés ----------

function FeuilleEnregistrerRepas({ entrees, onFermer }: { entrees: EntreeJournal[]; onFermer: () => void }) {
  const [nom, setNom] = useState('');
  const [choisis, setChoisis] = useState<string[]>(entrees.map((e) => e.id));
  return (
    <Feuille titre="Enregistrer comme repas" onFermer={onFermer}>
      <input className="champ-texte" placeholder="Par exemple : mon petit-déjeuner" aria-label="Nom du repas" value={nom} onChange={(e) => setNom(e.target.value)} />
      <div className="carte" style={{ gap: 0, paddingTop: 0, paddingBottom: 0, maxHeight: '40dvh', overflowY: 'auto' }}>
        {entrees.map((e) => {
          const on = choisis.includes(e.id);
          return (
            <button key={e.id} className="lien-liste" aria-pressed={on} onClick={() => setChoisis(on ? choisis.filter((x) => x !== e.id) : [...choisis, e.id])}>
              <span className={`gras ${on ? '' : 'doux'}`}>{on ? '✓ ' : ''}{e.nom}</span>
              <span className="doux petit">{e.quantite} · {ent(e.nutriments.kcal)} kcal</span>
            </button>
          );
        })}
      </div>
      <button
        className="bouton principal plein"
        disabled={!nom.trim() || !choisis.length}
        onClick={async () => {
          await enregistrerRepas(nom.trim(), entrees.filter((e) => choisis.includes(e.id)));
          onFermer();
          afficherBandeau(`Repas « ${nom.trim()} » enregistré`);
        }}
      >
        Enregistrer
      </button>
    </Feuille>
  );
}

// ---------- Objectif ----------

function FeuilleObjectif({ reglage, poids, onFermer }: { reglage: ReglageNutrition; poids: number; onFermer: () => void }) {
  const choisir = async (r: Partial<ReglageNutrition>) => {
    const avant = reglage;
    await ecrireReglage('nutrition', { ...reglage, ...r });
    afficherBandeau('Objectif modifié', () => ecrireReglage('nutrition', avant));
  };
  const kgSemaine = (pct: number) => g1(poids * pct);
  return (
    <Feuille titre="Objectif" onFermer={onFermer}>
      <div className="pilules" role="group" aria-label="Mode">
        {(['seche', 'maintien', 'prise'] as ModeNutrition[]).map((m) => (
          <button key={m} className="bouton" aria-pressed={reglage.mode === m} onClick={() => void choisir({ mode: m })}>{NOMS_MODES[m]}</button>
        ))}
      </div>
      {reglage.mode !== 'maintien' && (
        <div className="pilules" role="group" aria-label="Rythme">
          {(['lent', 'modere'] as RythmeNutrition[]).map((r) => (
            <button key={r} className="bouton" aria-pressed={reglage.rythme === r} onClick={() => void choisir({ rythme: r })}>
              {r === 'lent' ? `Lent (${kgSemaine(0.0025)} kg/sem.)` : `Modéré (${kgSemaine(0.005)} kg/sem.)`}
            </button>
          ))}
        </div>
      )}
      <span className="doux petit">
        Sèche : une perte lente (0,25 à 0,5 % du poids par semaine) préserve mieux la force et le muscle (Garthe et collègues, 2011 ; Helms et collègues, 2014). Prise de masse : un rythme lent limite le gain de gras (Iraki et collègues, 2019). L’objectif ne descend jamais sous le métabolisme de base ni sous 1 500 kcal.
      </span>
      <button className="bouton principal plein" onClick={onFermer}>OK</button>
    </Feuille>
  );
}
