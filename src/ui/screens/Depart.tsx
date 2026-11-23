import { useState } from 'react';
import { NOMS_JOURS_COURTS, NOMS_PRIORITES, PROFIL_INTERVIEW, depuisCle, lundiDe, versCle, type Jour, type Priorite, type Profil } from '../../domain/profil';
import { dateLongue } from '../../domain/format';
import { NOMS_PHASES } from '../../domain/programme';

/** Parcours de départ (cahier des charges 4.1), prérempli avec l'interview. Modifiable ensuite. */
export function Depart({ initial, onTerminer, onAnnuler }: { initial: Profil | null; onTerminer: (p: Profil) => void; onAnnuler?: () => void }) {
  const [p, setP] = useState<Profil>(initial ?? PROFIL_INTERVIEW);
  const [etape, setEtape] = useState(initial ? 1 : 0);
  const maj = (c: Partial<Profil>) => setP({ ...p, ...c });
  const ETAPES = 6;
  const lundiCourant = versCle(lundiDe(new Date()));

  const Nombre = ({ label, valeur, unite, pas, min, max, onChange }: { label: string; valeur: number; unite: string; pas: number; min: number; max: number; onChange: (v: number) => void }) => (
    <div className="ligne ecartee" style={{ minHeight: 56 }}>
      <span className="gras">{label}</span>
      <div className="ligne" style={{ gap: 8 }}>
        <button className="bouton" style={{ width: 48 }} aria-label={`${label} : moins`} onClick={() => onChange(Math.max(min, valeur - pas))}>−</button>
        <span className="grand-chiffre" style={{ minWidth: 92, textAlign: 'center', fontSize: 26 }}>
          {String(valeur).replace('.', ',')}<small> {unite}</small>
        </span>
        <button className="bouton" style={{ width: 48 }} aria-label={`${label} : plus`} onClick={() => onChange(Math.min(max, valeur + pas))}>+</button>
      </div>
    </div>
  );

  const Choix = <T extends string | number>({ options, valeur, onChange, colonnes = 2 }: { options: { v: T; nom: string }[]; valeur: T; onChange: (v: T) => void; colonnes?: number }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colonnes}, minmax(0, 1fr))`, gap: 8 }} role="radiogroup">
      {options.map((o) => (
        <button key={String(o.v)} role="radio" aria-checked={o.v === valeur} className={`bouton ${o.v === valeur ? 'choisi' : ''}`} style={{ minHeight: 52, fontSize: 15 }} onClick={() => onChange(o.v)}>
          {o.nom}
        </button>
      ))}
    </div>
  );

  return (
    <div className="seance" role="dialog" aria-label="Parcours de départ" style={{ zIndex: 40 }}>
      <div className="ligne ecartee">
        {etape > (initial ? 1 : 0) ? <button className="bouton discret" onClick={() => setEtape(etape - 1)}>Retour</button> : onAnnuler ? <button className="bouton discret" onClick={onAnnuler}>Annuler</button> : <span />}
        <div className="points" aria-label={`Étape ${etape + 1} sur ${ETAPES + 1}`}>
          {Array.from({ length: ETAPES + 1 }, (_, i) => <span key={i} className={`point ${i < etape ? 'fait' : i === etape ? 'actuel' : ''}`} />)}
        </div>
        <span style={{ width: 60 }} />
      </div>

      {etape === 0 && (
        <div className="pile" style={{ gap: 16, flexGrow: 1, justifyContent: 'center' }}>
          <h1 className="titre">Bienvenue</h1>
          <p style={{ fontSize: 18, lineHeight: 1.45, margin: 0 }}>
            Votre programme sur 6 mois pour devenir plus explosif, plus fort et plus affûté, préparé à partir de vos réponses.
          </p>
          <p className="doux" style={{ margin: 0 }}>Tout est déjà prérempli : vérifiez, corrigez si besoin. Vos données restent sur ce téléphone.</p>
        </div>
      )}

      {etape === 1 && (
        <div className="pile">
          <h1 className="titre-2">Votre profil</h1>
          <div className="carte">
            <Choix options={[{ v: 'homme', nom: 'Homme' }, { v: 'femme', nom: 'Femme' }]} valeur={p.sexe} onChange={(v) => maj({ sexe: v as Profil['sexe'] })} />
            <Nombre label="Âge" valeur={p.age} unite="ans" pas={1} min={14} max={90} onChange={(v) => maj({ age: v })} />
            <Nombre label="Taille" valeur={p.tailleCm} unite="cm" pas={1} min={120} max={230} onChange={(v) => maj({ tailleCm: v })} />
            <Nombre label="Poids estimé" valeur={p.poidsKg} unite="kg" pas={0.5} min={35} max={200} onChange={(v) => maj({ poidsKg: v })} />
            <span className="doux petit">Le poids sert aux exercices au poids du corps ; il sera remplacé par vos pesées.</span>
          </div>
        </div>
      )}

      {etape === 2 && (
        <div className="pile">
          <h1 className="titre-2">Votre priorité</h1>
          <Choix colonnes={1} options={(Object.keys(NOMS_PRIORITES) as Priorite[]).map((v) => ({ v, nom: NOMS_PRIORITES[v] }))} valeur={p.priorite} onChange={(v) => maj({ priorite: v })} />
          <div className="carte">
            <label className="reglage">
              <span className="pile" style={{ gap: 2 }}>
                <span className="gras">Apprendre l’épaulé</span>
                <span className="doux petit">Apprentissage progressif ; sinon, swing à la kettlebell</span>
              </span>
              <input type="checkbox" role="switch" className="interrupteur" checked={p.apprendreEpaule} onChange={(e) => maj({ apprendreEpaule: e.target.checked })} />
            </label>
          </div>
        </div>
      )}

      {etape === 3 && (
        <div className="pile">
          <h1 className="titre-2">Votre semaine</h1>
          <span className="etiquette">Séances par semaine</span>
          <Choix colonnes={3} options={[3, 4, 5].map((v) => ({ v, nom: `${v} séances` }))} valeur={p.seancesParSemaine} onChange={(v) => maj({ seancesParSemaine: v as 3 | 4 | 5 })} />
          <span className="etiquette">Jours préférés</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
            {NOMS_JOURS_COURTS.map((n, i) => {
              const on = p.jours.includes(i as Jour);
              return (
                <button key={n} aria-pressed={on} className={`bouton ${on ? 'choisi' : ''}`} style={{ minHeight: 48, padding: 0, fontSize: 13 }} onClick={() => maj({ jours: on ? p.jours.filter((j) => j !== i) : [...p.jours, i as Jour] })}>
                  {n}
                </button>
              );
            })}
          </div>
          <span className="doux petit">S’il manque des jours, l’application en propose d’autres ; une séance manquée reste à faire plus tard dans la semaine.</span>
          <div className="carte">
            <label className="reglage">
              <span className="pile" style={{ gap: 2 }}>
                <span className="gras">Séance de mobilité</span>
                <span className="doux petit">15 minutes à la maison, un jour de repos</span>
              </span>
              <input type="checkbox" role="switch" className="interrupteur" checked={p.seanceMobilite} onChange={(e) => maj({ seanceMobilite: e.target.checked })} />
            </label>
          </div>
        </div>
      )}

      {etape === 4 && (
        <div className="pile">
          <h1 className="titre-2">Début et échéance</h1>
          <span className="etiquette">Premier jour du programme</span>
          <Choix
            colonnes={1}
            options={[
              { v: PROFIL_INTERVIEW.debut, nom: `${dateLongue(depuisCle(PROFIL_INTERVIEW.debut).getTime())} (prévu)` },
              ...(lundiCourant !== PROFIL_INTERVIEW.debut ? [{ v: lundiCourant, nom: `Cette semaine (${dateLongue(depuisCle(lundiCourant).getTime())})` }] : [])
            ]}
            valeur={p.debut}
            onChange={(v) => {
              const d = depuisCle(v);
              const ech = new Date(d);
              ech.setDate(ech.getDate() + 26 * 7 - 1);
              maj({ debut: v, echeance: versCle(ech) });
            }}
          />
          <div className="carte compacte">
            <span className="doux petit">Échéance des objectifs</span>
            <span className="gras">{dateLongue(depuisCle(p.echeance).getTime())} {depuisCle(p.echeance).getFullYear()}</span>
            <span className="doux petit">6 mois : 2 semaines de reprise, puis 4 cycles de 6 semaines.</span>
          </div>
        </div>
      )}

      {etape === 5 && (
        <div className="pile">
          <h1 className="titre-2">Matériel et fin de repos</h1>
          <div className="carte">
            <span className="gras">Vos 3 lieux sont préréglés</span>
            <span className="doux">Salle, maison et extérieur reprennent le matériel de l’interview. Modifiable à tout moment depuis Aujourd’hui, bouton « Matériel ».</span>
          </div>
          <div className="carte">
            <span className="gras">Notification de fin de repos</span>
            <span className="doux">Le raccourci « Repos » se règle dans Profil, rubrique Fin de repos.</span>
          </div>
        </div>
      )}

      {etape === 6 && (
        <div className="pile">
          <h1 className="titre-2">C’est prêt</h1>
          <div className="carte" style={{ gap: 0 }}>
            {[
              ['Semaines 1 et 2', `${NOMS_PHASES.reprise} : charges modérées, test léger, puis test complet`],
              ['Semaines 3 à 8', NOMS_PHASES.c1],
              ['Semaines 9 à 14', NOMS_PHASES.c2],
              ['Semaines 15 à 20', NOMS_PHASES.c3],
              ['Semaines 21 à 26', NOMS_PHASES.c4]
            ].map(([a, b]) => (
              <div key={a} className="element-liste">
                <span className="gras">{a}</span>
                <span className="doux petit" style={{ textAlign: 'right' }}>{b}</span>
              </div>
            ))}
          </div>
          <span className="doux petit">Chaque cycle finit par une semaine allégée avec des tests ; le programme s’ajuste à vos résultats.</span>
        </div>
      )}

      <div style={{ flexGrow: 1 }} />
      <button
        className="bouton principal geant"
        onClick={() => (etape < ETAPES ? setEtape(etape + 1) : onTerminer({ ...p, jours: [...new Set(p.jours)].sort((a, b) => a - b) }))}
      >
        {etape === 0 ? 'Commencer' : etape < ETAPES ? 'Continuer' : 'C’est parti'}
      </button>
    </div>
  );
}
