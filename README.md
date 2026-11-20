# Appli sport

Application d'entraînement personnelle (application web installable sur iPhone, fonctionne sans connexion, données uniquement sur l'appareil).

- Cahier des charges : `docs/cahier-des-charges.md`
- Suivi des décisions et de l'avancement : `SUIVI.md` (à lire en premier pour reprendre le travail)

## Commandes

```bash
npm install          # installer les outils
npm run dev          # version de développement
npm test             # tests automatiques des règles
npm run build        # construire la version publiée (dossier dist)
npm run e2e          # vérifications de bout en bout au format iPhone (après build)
```

La publication sur GitHub Pages se fait automatiquement à chaque mise à jour de la branche `main` (`.github/workflows/pages.yml`).
