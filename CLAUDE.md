# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> User Research Suite — Outil web open-source propulsé par Claude AI pour automatiser les tâches répétitives du UX research : génération de protocoles d'étude, slides de brief et analyse de résultats.

**GitHub** : https://github.com/m-a-fr/ux-research-suite

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
- **Export fichiers** : `docx` → Word, `pptxgenjs` → PowerPoint, `@react-pdf/renderer` → PDF, `xlsx` → Excel
- **Pas de base de données en v1** — sessions stateless, outputs téléchargés directement
- **Déploiement** : Vercel + `docker-compose` pour self-hosting

---

## Architecture des dossiers

```
/app
  page.tsx                     → Landing page (hero, pain points, features, CTA)
  layout.tsx                   → Header global + bouton "Essayer" dans la nav
  /tools
    /protocol-generator/
      page.tsx                 → UC1 (Générateur de protocole) + UC2 (Brief Builder) — même page, use client
  /api
    /generate-protocol/route.ts     → Streaming Claude → JSON protocole
    /export-protocol/route.ts       → Génération DOCX (docx-<type>.ts)
    /export-protocol-pdf/route.ts   → Génération PDF A4 (pdf-protocol.tsx)
    /generate-brief/route.ts        → Streaming Claude → JSON brief (phases réflexion + brief)
    /export-brief/route.ts          → Génération PPTX (pptx-brief.ts)
    /export-brief-pdf/route.ts      → Génération PDF 16:9 (pdf-brief.tsx)

/lib
  utils.ts
  /prompts/
    index.ts                   → Dispatcher getSystemPrompt(studyType, testDesign?)
    exploratory_interview.ts
    moderated_usability.ts
    unmoderated_usability.ts
    survey.ts
    diary_study.ts             → désactivé (coming soon)
    brief.ts                   → prompt 2 phases : <reflexion> + <brief> JSON
  /exporters/
    docx.ts                    → utilitaires communs
    docx-template.ts
    docx-exploratory.ts
    docx-moderated.ts
    docx-unmoderated.ts
    docx-survey.ts
    pptx-brief.ts              → Export PPTX : renderCover() + renderContent() via htmlToLines()
    pdf-brief.tsx              → Export PDF 16:9 : CoverSlide + ContentSlide (@react-pdf/renderer)
    pdf-protocol.tsx           → Export PDF A4 : dispatch par study_type (@react-pdf/renderer)
  /types/
    protocol.ts                → AnyResult, StudyType, FormValues union
    exploratory.ts
    moderated.ts
    unmoderated.ts
    survey.ts
    brief.ts                   → BriefSlideType, BriefSlide (+ html: string), Brief
    pizzip.d.ts                → déclaration type pour PizZip

/components
  /ui/                         → shadcn/ui : badge, button, card, form, input,
                                             label, select, separator, skeleton, textarea
  /tools/
    ProtocolForm.tsx           → sélecteur de type d'étude
    ProtocolPreview.tsx        → preview générique
    ExploratoryForm.tsx / ExploratoryPreview.tsx
    ModeratedForm.tsx / ModeratedPreview.tsx
    UnmoderatedForm.tsx / UnmoderatedPreview.tsx
    SurveyForm.tsx / SurveyPreview.tsx
    BriefPreview.tsx           → streaming progress (6 étapes) + wrapper BriefSlideViewer
    BriefSlideViewer.tsx       → viewer 16:9, thumbnails, nav clavier ←/→, export/reset
```

---

## Contraintes critiques

- **API Key** : `ANTHROPIC_API_KEY` ne doit jamais être exposée côté client — toutes les requêtes Claude passent par `/app/api/`.
- **Streaming obligatoire** sur toutes les routes API — utiliser `ReadableStream` avec l'Anthropic SDK pour éviter les timeouts.
- **JSON structuré uniquement** : Claude répond toujours avec du JSON valide contraint par le prompt système, jamais en markdown libre.
- **Prompts adaptatifs** : un prompt système distinct par type d'étude dans `/lib/prompts/`, avec le schéma JSON attendu intégré dans le prompt.
- **Buffer → Uint8Array** : `new Response(buffer)` échoue en Next.js 16 — convertir : `new Uint8Array(nodeBuffer)`.
- **Exporters server-side only** : `docx`, `pptx`, `@react-pdf/renderer`, `xlsx` ne sont pas compatibles browser — s'exécutent uniquement dans les API routes.
- **`z.coerce.number()` + react-hook-form** : nécessite `zodResolver(schema) as Resolver<FormSchema>` pour éviter l'erreur TS.
- **Thème achromatique** : `globals.css` utilise oklch sans chroma (noir/blanc pur). Pour des couleurs d'accent sur la landing, utiliser `style={{ background: "oklch(...)" }}` ou des valeurs arbitraires Tailwind.

---

## Variables d'environnement

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Landing page (`app/page.tsx`)

Page d'accueil marketing. Structure :
- **Hero** : fond sombre + glow bleu radial, titre avec dégradé CSS (`WebkitBackgroundClip: "text"`), mock output card (protocole généré) visible sur desktop
- **Pain points** : 3 colonnes avec grands numéros `01/02/03`
- **Features** : 3 cartes avec colonne gauche `bg-muted/40` + colonne droite description + bullets
- **Différenciateurs** : 4 icônes SVG inline + texte
- **CTA final** : fond sombre symétrique au hero
- **Footer** : licence MIT + lien Claude AI + Next.js

Bouton "Essayer" ajouté dans le header (`layout.tsx`) → `/tools/protocol-generator`.

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

## Use case 2 — Brief Builder ✅

Intégré dans `/app/tools/protocol-generator/page.tsx` (pas de page séparée).
**Exports** : `.pptx` via `/api/export-brief/` → `pptx-brief.ts` · `.pdf` via `/api/export-brief-pdf/` → `pdf-brief.tsx`

### Architecture HTML slides (livrable principal)

Claude génère chaque slide comme un fragment HTML auto-contenu avec **styles inline uniquement** (pas de classes CSS — Tailwind ne fonctionne pas dans `dangerouslySetInnerHTML`).

**`BriefSlide` interface** :
```ts
interface BriefSlide {
  slide_number: number;
  type: BriefSlideType;      // cover | context | objectives | ...
  title: string;             // header PPTX + identification
  speaker_notes: string;     // notes présentateur PPTX
  html: string;              // fragment HTML inline-styles → viewer browser
}
```

**Schéma JSON généré dans `<brief>`** :
```json
{
  "source_study_type": "string",
  "project_title": "string",
  "generated_date": "YYYY-MM-DD",
  "slides": [
    {
      "slide_number": 1,
      "type": "cover",
      "title": "string",
      "speaker_notes": "string",
      "html": "<div style=\"width:100%;height:100%;...\">...</div>"
    }
  ]
}
```

### Viewer browser (`BriefSlideViewer.tsx`)
- Container 16:9 via `aspectRatio: "16/9"` + `dangerouslySetInnerHTML`
- `sanitize()` locale : strip `<script>`, `on*=`, `javascript:`
- Navigation : boutons ←/→ + compteur + keyboard `ArrowLeft`/`ArrowRight`
- Thumbnail strip : miniatures scalées à 25% via `transform: scale(0.25)`

### Export PPTX (`pptx-brief.ts`)
Le PPTX est un livrable secondaire dérivé du HTML via `htmlToLines()` :
```ts
// Extrait max 7 lignes de texte lisibles depuis le HTML de Claude
function htmlToLines(html: string): string[] { ... }
```
- `renderCover()` : design dark hero (fond #171717, glow bleu, sidebar bleue)
- `renderContent()` : header sombre + liste de lignes avec barres accent
- Couleur accent : `ACCENTS[slide.type]` — déterminée par le type, pas par le HTML
- `san()` / `deepSan()` — sanitize chars > U+00FF pour btoa() de pptxgenjs

### Export PDF (`pdf-brief.tsx` + `pdf-protocol.tsx`)
Exporters server-side via `@react-pdf/renderer` (JSX pur, sans Chromium).

**Brief PDF** (`pdf-brief.tsx`) :
- Taille de page : `[720, 405]` pt (16:9 paysage)
- `CoverSlide` : fond `#171717`, bande bleue gauche 8pt, titre 28pt blanc, lignes via `htmlToLines()`
- `ContentSlide` : fond `BG_COLORS[slide.type]`, header sombre, lignes avec barre accent `ACCENTS[slide.type]`
- `htmlToLines()` copiée localement depuis `pptx-brief.ts` (extraction texte depuis HTML Claude)
- `export async function generateBriefPdf(brief: Brief): Promise<Buffer>`

**Protocole PDF** (`pdf-protocol.tsx`) :
- Taille de page : `"A4"` portrait
- `CoverPage` : fond `#171717`, bande bleue, titre 28pt, type d'étude, meta rows
- `ContentPage` : fond `#F8FAFC`, padding 36pt
- Composants partagés : `SectionHeader`, `ScriptBox` (fond `#F1F5F9`, italic), `BulletItem` (▌ bleu), `TipText` (fond amber), `Label`
- Dispatch par `study_type` : `ExploratoryContent` / `ModeratedContent` / `UnmoderatedContent` (→ `MonadicContent` / `ABContent` / `BenchmarkContent`) / `SurveyContent`
- `export async function generateProtocolPdf(protocol: AnyProtocol): Promise<Buffer>`

### Prompt brief (`lib/prompts/brief.ts`)
- Génération en 2 phases : `<reflexion>` (1 ligne/slide) + `<brief>` (JSON avec HTML)
- 6 étapes de streaming détectées via markers dans `BriefPreview.tsx`
- Ton mesuré obligatoire (pas de "permettra de décider", "orientera la stratégie")
- Palette fixe fournie : DARK `#171717`, BLUE `#4D91E0`, TEXT `#1F2937`, LIGHT `#F8FAFC`
- 3 exemples HTML dans le prompt (cover dark, liste accent, deux colonnes)
- `max_tokens: 16000` (réflexion ~500 + HTML × 9 slides ~6000 + JSON wrapper)

### Extraction JSON (`page.tsx`)
```ts
const briefTag = accumulated.match(/<brief>([\s\S]*?)<\/brief>/);
const jsonStr = briefTag ? briefTag[1] : accumulated;
const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
```

---

## Use case 3 — Analyseur de résultats 🚧

**Inputs acceptés** : CSV (Maze, UserTesting, Typeform), texte/markdown, verbatims collés directement.
**Exports** : `.xlsx` + `.docx`
**Spec** : chunking 3000 tokens max, route `/api/analyze-results`, composants `ResultsUploader` + `ResultsReport`.
