# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> User Research Suite — Outil web open-source propulsé par Claude AI pour automatiser les tâches répétitives du UX research : génération de protocoles d'étude, slides de brief et analyse de résultats.

---

## Commandes

```bash
# Développement
npm run dev

# Build & lint
npm run build
npm run lint
```

---

## Stack technique

- **Framework** : Next.js 16 (App Router, TypeScript)
- **Styling** : Tailwind CSS v4 + shadcn/ui (composants UI exclusivement via shadcn). Pas de `tailwind.config.js` — config dans `app/globals.css` via `@import "tailwindcss"`.
- **IA** : Anthropic SDK Node.js — `claude-sonnet-4-6`, streaming activé, `max_tokens: 8192`
- **Export fichiers** : `docx` → Word, `pptxgenjs` → PowerPoint, `xlsx` → Excel
- **Pas de base de données en v1** — sessions stateless, outputs téléchargés directement
- **Déploiement** : Vercel + `docker-compose` pour self-hosting

---

## Architecture des dossiers

```
/app
  /tools
    /protocol-generator/     → Use case 1 : génération de protocoles
    /brief-builder/          → Use case 2 : slides de brief stakeholders (à venir)
    /results-analyzer/       → Use case 3 : analyse de résultats d'études (à venir)
  /api
    /generate-protocol/      → route.ts — appel Claude + streaming
    /export-protocol/        → route.ts — génération DOCX
    /generate-brief/         → route.ts — appel Claude + streaming (à venir)
    /analyze-results/        → route.ts — appel Claude + streaming (à venir)
/lib
  /prompts/                  → index.ts (dispatcher) + un fichier par type d'étude
  /exporters/                → docx-<type>.ts (server-side uniquement)
  /types/                    → interfaces TypeScript par type d'étude
/components
  /ui/                       → composants shadcn/ui
  /tools/                    → <Type>Form.tsx + <Type>Preview.tsx par type d'étude
```

---

## Contraintes critiques

- **API Key** : `ANTHROPIC_API_KEY` ne doit jamais être exposée côté client — toutes les requêtes Claude passent par `/app/api/`.
- **Streaming obligatoire** sur toutes les routes API — utiliser `ReadableStream` avec l'Anthropic SDK pour éviter les timeouts.
- **JSON structuré uniquement** : Claude répond toujours avec du JSON valide contraint par le prompt système, jamais en markdown libre.
- **Prompts adaptatifs** : un prompt système distinct par type d'étude dans `/lib/prompts/`, avec le schéma JSON attendu intégré dans le prompt.
- **Buffer → Uint8Array** : `new Response(buffer)` échoue en Next.js 16 — convertir : `new Uint8Array(nodeBuffer)`.
- **Exporters server-side only** : `docx`, `pptx`, `xlsx` ne sont pas compatibles browser — s'exécutent uniquement dans les API routes.
- **`z.coerce.number()` + react-hook-form** : nécessite `zodResolver(schema) as Resolver<FormSchema>` pour éviter l'erreur TS.

---

## Variables d'environnement

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Use case 1 — Générateur de protocole

### Types d'études disponibles

| Type | Status | Composants |
|------|--------|-----------|
| `exploratory_interview` | ✅ | ExploratoryForm / ExploratoryPreview / docx-exploratory |
| `moderated_usability` | ✅ | ModeratedForm / ModeratedPreview / docx-moderated |
| `unmoderated_usability` | ✅ | UnmoderatedForm / UnmoderatedPreview / docx-unmoderated |
| `survey` | ✅ | SurveyForm / SurveyPreview / docx-survey |
| `diary_study` | 🚧 désactivé | Coming soon — non sélectionnable |

### Architecture par type (pattern commun)

Chaque type d'étude a son propre slice :
- `lib/types/<type>.ts` — interfaces TypeScript + type `FormValues`
- `lib/prompts/<type>.ts` — prompt système avec schéma JSON intégré
- `components/tools/<Type>Form.tsx` — formulaire react-hook-form + Zod
- `components/tools/<Type>Preview.tsx` — preview en streaming avec détection de stages
- `lib/exporters/docx-<type>.ts` — exporter DOCX server-side

Le dispatcher `lib/prompts/index.ts` exporte `getSystemPrompt(studyType, testDesign?)`.

### Distinction fondamentale modéré / non-modéré

**Modéré** = guide animateur. Tout le contenu est rédigé du point de vue de l'animateur.
- Champs clés : `script` (voix de l'animateur), `probe_questions[condition/question]`, `observer_cues`, questions post-tâche structurées.
- Pas de `screen_text`, pas de `starting_url`.

**Non-modéré** = script outil. Le participant lit `screen_text` affiché par l'outil (2e personne impératif).
- Champs clés : `screen_text`, `starting_url` par tâche, `automated_metrics` (enum), `analysis_guide`.
- Pas de voix humaine, pas de probe questions.

---

### Schémas JSON par type

#### `exploratory_interview`
```json
{
  "study_type": "exploratory_interview",
  "title": "string",
  "interview_style": "semi_directive | non_directive",
  "duration_minutes": 60,
  "sections": [{
    "type": "intro | warmup | themes | closing",
    "title": "string",
    "duration_minutes": 5,
    "script": "string",
    "questions": [{ "text": "string", "modality": "string", "options": ["string"] }],
    "tips": "string"
  }],
  "consent_note": "string",
  "materials_needed": ["string"]
}
```

#### `moderated_usability`
```json
{
  "study_type": "moderated_usability",
  "title": "string",
  "product_name": "string",
  "platform": "web | mobile | desktop",
  "fidelity": "live_product | prototype_hifi | prototype_lowfi",
  "think_aloud": "concurrent | retrospective | none",
  "duration_minutes": 60,
  "sections": [{
    "type": "intro | warmup | tasks | debrief",
    "title": "string",
    "duration_minutes": 5,
    "script": "string",
    "questions": [{ "text": "string", "modality": "string", "options": ["string"] }],
    "tips": "string"
  }],
  "tasks": [{
    "task": "string",
    "scenario": "string",
    "success_criteria": "string",
    "time_limit_minutes": 5,
    "observer_cues": ["string"],
    "probe_questions": [{ "condition": "string", "question": "string" }],
    "post_task_questions": [{ "text": "string", "modality": "string", "options": ["string"] }]
  }],
  "observer_guide": "string",
  "consent_note": "string",
  "materials_needed": ["string"]
}
```

#### `unmoderated_usability` — 3 designs (union discriminée sur `test_design`)

**Monadic** :
```json
{
  "study_type": "unmoderated_usability",
  "test_design": "monadic",
  "title": "string",
  "product_name": "string",
  "platform": "web | mobile | desktop",
  "tool": "string",
  "estimated_duration_minutes": 15,
  "welcome_block": { "screen_text": "string" },
  "tasks": [{
    "task": "string",
    "screen_text": "string",
    "starting_url": "string",
    "automated_metrics": ["task_completion", "time_on_task", "click_count", "error_count", "navigation_path"],
    "post_task_questions": [{ "text": "string", "modality": "string" }],
    "success_criteria": "string"
  }],
  "closing_block": { "screen_text": "string" },
  "screener_questions": ["string"],
  "analysis_guide": "string"
}
```

**A/B** (`ab_design: "within" | "between"`, `counterbalancing: boolean`) :
```json
{
  "study_type": "unmoderated_usability",
  "test_design": "ab",
  "ab_design": "within | between",
  "counterbalancing": true,
  "variants": [
    { "label": "A", "product_name": "string", "description": "string", "tasks": [{...}] },
    { "label": "B", "product_name": "string", "description": "string", "tasks": [{...}] }
  ],
  "comparison_questions": [{ "text": "string", "modality": "string" }],
  "welcome_block": { "screen_text": "string" },
  "closing_block": { "screen_text": "string" },
  "screener_questions": ["string"],
  "analysis_guide": "string"
}
```
> `comparison_questions` est vide pour between-subjects (pas de comparaison directe). `welcome_block` ne révèle PAS qu'il y a 2 variantes.

**Benchmark** (`benchmark_type: "internal" | "competitive"`) :
```json
{
  "study_type": "unmoderated_usability",
  "test_design": "benchmark",
  "benchmark_type": "internal | competitive",
  "standard_scales": ["SUS", "UMUX-Lite"],
  "benchmark_context": "string",
  "products": [{
    "name": "string",
    "role": "our_product | competitor | previous_version",
    "tasks": [{ "task": "string", "screen_text": "string", "starting_url": "string", "automated_metrics": [...] }],
    "post_product_questions": [{ "text": "string", "modality": "string" }]
  }],
  "welcome_block": { "screen_text": "string" },
  "closing_block": { "screen_text": "string" },
  "screener_questions": ["string"],
  "analysis_guide": "string"
}
```
> Les tâches sont standardisées (même `screen_text`, `starting_url` différent). `post_product_questions` inclut les 10 items SUS complets et/ou les 2 items UMUX-Lite. `analysis_guide` contient la formule de calcul SUS.

#### `survey`
```json
{
  "study_type": "survey",
  "title": "string",
  "estimated_duration_minutes": 8,
  "blocks": [{
    "type": "screening | intro | scale_nps | scale_sus | scale_umux | likert | open | demographic",
    "title": "string",
    "questions": [{ "text": "string", "modality": "string", "options": ["string"] }]
  }]
}
```

---

## Use case 2 — Brief Builder (à implémenter)

**Export** : `.pptx` (8–10 slides)

---

## Use case 3 — Analyseur de résultats (à implémenter)

**Inputs acceptés** : CSV, texte/markdown, verbatims collés directement.
**Exports** : `.xlsx` + `.docx`
