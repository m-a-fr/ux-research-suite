# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> User Research Suite — Outil web open-source propulsé par Claude AI pour automatiser les tâches répétitives du UX research : génération de protocoles d'étude, slides de brief et analyse de résultats.

---

## Commandes

```bash
# Démarrage du projet (première fois)
npx create-next-app@latest . --typescript --tailwind --app
npm install @anthropic-ai/sdk docx pptxgenjs xlsx
npx shadcn-ui@latest init

# Développement
npm run dev

# Build & lint
npm run build
npm run lint
```

---

## Stack technique

- **Framework** : Next.js 14 (App Router, TypeScript)
- **Styling** : Tailwind CSS + shadcn/ui (composants UI exclusivement via shadcn)
- **IA** : Anthropic SDK Node.js — `claude-sonnet-4-6`, streaming activé, `max_tokens: 4096`
- **Export fichiers** : `docx` → Word, `pptxgenjs` → PowerPoint, `xlsx` → Excel
- **Pas de base de données en v1** — sessions stateless, outputs téléchargés directement
- **Déploiement** : Vercel + `docker-compose` pour self-hosting

---

## Architecture des dossiers

```
/app
  /tools
    /protocol-generator/     → Use case 1 : génération de protocoles
    /brief-builder/          → Use case 2 : slides de brief stakeholders
    /results-analyzer/       → Use case 3 : analyse de résultats d'études
  /api
    /generate-protocol/      → route.ts — appel Claude + streaming
    /generate-brief/         → route.ts — appel Claude + streaming
    /analyze-results/        → route.ts — appel Claude + streaming
/lib
  /prompts/                  → prompts adaptatifs par type d'étude (un fichier par type)
  /exporters/                → docx.ts, pptx.ts, xlsx.ts (server-side uniquement)
  /parsers/                  → parsing et validation JSON des réponses Claude
  /types/                    → interfaces TypeScript partagées (protocole, brief, analyse)
/components
  /ui/                       → composants shadcn/ui
  /tools/                    → composants spécifiques à chaque outil
```

---

## Contraintes critiques

- **API Key** : `ANTHROPIC_API_KEY` ne doit jamais être exposée côté client — toutes les requêtes Claude passent par `/app/api/`.
- **Streaming obligatoire** sur toutes les routes API — utiliser `ReadableStream` avec l'Anthropic SDK pour éviter les timeouts.
- **JSON structuré uniquement** : Claude répond toujours via `tool_use` ou format contraint, jamais en markdown libre. Le front reconstruit la mise en forme.
- **Validation JSON** : envelopper le parsing dans un try/catch et relancer avec un prompt de correction si le JSON est invalide.
- **Prompts adaptatifs** : un prompt système distinct par type d'étude dans `/lib/prompts/`, pas de prompt générique.
- **Chunking** : pour les fichiers volumineux (use case 3), découper en chunks de 3000 tokens max avant envoi à Claude.
- **Exporters server-side only** : `docx`, `pptx`, `xlsx` ne sont pas compatibles browser — s'exécutent uniquement dans les API routes.

---

## Variables d'environnement

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Use case 1 — Générateur de protocole

**Inputs** : type d'étude (`exploratory_interview` | `moderated_usability` | `unmoderated_usability` | `survey` | `diary_study`), objectif de recherche, audience cible, durée prévue, nombre de participants.

**Export** : `.docx`

### Schéma JSON de sortie
```json
{
  "study_type": "moderated_usability",
  "title": "string",
  "duration_minutes": 60,
  "sections": [
    {
      "type": "intro | warmup | tasks | debrief",
      "title": "string",
      "duration_minutes": 5,
      "script": "string",
      "questions": ["string"],
      "tips": "string"
    }
  ],
  "tasks": [
    {
      "task": "string",
      "scenario": "string",
      "success_criteria": "string"
    }
  ],
  "observer_guide": "string",
  "consent_note": "string",
  "materials_needed": ["string"]
}
```

### Exemple de prompt système (`moderated_usability`)
```
Tu es un expert en UX research. Génère un protocole de test d'utilisabilité modéré professionnel en JSON valide.
Le protocole doit respecter les standards UX industry : intro > warmup > tâches > debrief.
Adapte la durée et la profondeur au nombre de participants et à l'objectif fourni.
Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte avant ou après.
```

---

## Use case 2 — Brief Builder (slides stakeholders)

**Inputs** : nom du projet, objectif business, questions de recherche, méthodologie, audience participants, timeline, décisions attendues. Optionnel : contexte concurrentiel, contraintes.

**Export** : `.pptx` (8–10 slides : cover → contexte → objectifs → méthodologie → participants → planning → décisions attendues → next steps)

### Schéma JSON de sortie
```json
{
  "title": "string",
  "slides": [
    {
      "slide_number": 1,
      "type": "cover | context | objectives | methodology | participants | timeline | expected_decisions",
      "title": "string",
      "body": "string",
      "bullets": ["string"],
      "speaker_notes": "string"
    }
  ]
}
```

---

## Use case 3 — Analyseur de résultats

**Inputs acceptés** : CSV (Maze, UserTesting, Typeform…), fichier texte/markdown (notes de sessions, verbatims), ou texte collé directement.

**Exports** : `.xlsx` (tableau d'insights) + `.docx` (rapport synthèse)

### Schéma JSON de sortie
```json
{
  "summary": "string",
  "key_findings": [
    {
      "finding": "string",
      "severity": "critical | major | minor",
      "frequency": "string",
      "verbatims": ["string"],
      "recommendation": "string"
    }
  ],
  "patterns": ["string"],
  "metrics": {
    "task_completion_rate": "string",
    "average_satisfaction": "string",
    "nps": "string"
  },
  "next_steps": ["string"]
}
```
