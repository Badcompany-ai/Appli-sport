// Une couleur par type de séance, pour reconnaître la séance d'un coup d'œil.
// Les valeurs sont dans src/styles.css (--seance-a, --seance-b…).

export function couleurSeance(lettre: string | undefined): string {
  switch (lettre) {
    case 'A': return 'var(--seance-a)';
    case 'B': return 'var(--seance-b)';
    case 'C': return 'var(--seance-c)';
    case 'D': return 'var(--seance-d)';
    case 'E': return 'var(--seance-e)';
    case 'M': return 'var(--seance-mobilite)';
    default: return 'var(--seance-autre)';
  }
}

/** Petite pastille ronde de la couleur de la séance (décorative). */
export function PastilleSeance({ lettre }: { lettre: string | undefined }) {
  return <span className="pastille-seance" style={{ background: couleurSeance(lettre) }} aria-hidden="true" />;
}
