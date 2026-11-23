# Origine des skills de design (installées le 23/11/2026)

Copiées sans exécuter de code, après lecture de chaque fichier.

| Skill | Source | Version (commit) | Contenu installé |
|---|---|---|---|
| frontend-design | anthropics/skills, skills/frontend-design | e4bb5d9 | SKILL.md, LICENSE.txt |
| web-design-guidelines | vercel-labs/agent-skills, skills/web-design-guidelines | 5a37a63 | SKILL.md, references/command.md (empreinte SHA-256 vérifiée) |
| emil-design-eng | emilkowalski/skills, skills/emil-design-eng | 64eb3de | SKILL.md, LICENSE (MIT) |
| improve-animations | emilkowalski/skills, skills/improve-animations | 64eb3de | SKILL.md, AUDIT.md, PLAN-TEMPLATE.md, LICENSE (MIT) |
| impeccable | pbakaus/impeccable, .claude/skills/impeccable | b49177d | SKILL.md, reference/, LICENSE (Apache 2.0), NOTICE.md |

Volontairement **non installés** pour impeccable : les hooks (.claude/settings.json), le dossier scripts/ (lanceur qui télécharge un moteur binaire, scripts du mode « live »), les sous-agents (.claude/agents/). Sans eux, la skill suit son mode de repli prévu (« Launcher unavailable ») : relecture directe du code et du rendu, sans le détecteur automatique ni l'archivage des rapports.
