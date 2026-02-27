# User Research Suite

Outil web open-source propulsé par **Claude AI** pour automatiser les tâches répétitives du UX research : génération de protocoles d'étude, slides de brief stakeholders et analyse de résultats.

---

## Sommaire

- [Aperçu](#aperçu)
- [Déploiement sur Vercel](#déploiement-sur-vercel)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Use cases](#use-cases)
- [API Reference](#api-reference)
- [Flux de données](#flux-de-données)
- [Contraintes & décisions techniques](#contraintes--décisions-techniques)
- [Roadmap](#roadmap)

---

## Aperçu

User Research Suite permet aux UX researchers de générer en quelques secondes des livrables structurés et professionnels habituellement chronophages à produire. L'interface est entièrement en français.

**Statut actuel : Sprint 1 terminé — Use case 1 fonctionnel**

| Outil | Statut |
|---|---|
| Générateur de protocole | ✅ Disponible |
| Brief Builder (slides stakeholders) | 🔜 À venir |
| Analyseur de résultats | 🔜 À venir |

---

## Déploiement sur Vercel

Vercel est la façon la plus simple de mettre l'outil en ligne. Pas de serveur à gérer, pas de ligne de commande : tout se fait depuis votre navigateur.

> **Temps estimé : 10 à 15 minutes**

---

### Ce dont vous avez besoin avant de commencer

- Un compte **GitHub** — gratuit sur [github.com](https://github.com) (c'est là que le code est stocké)
- Un compte **Vercel** — gratuit sur [vercel.com](https://vercel.com) (c'est là que le site sera hébergé)
- Votre **clé API Anthropic** — obtenue sur [console.anthropic.com](https://console.anthropic.com)

---

### Étape 1 — Mettre le code sur GitHub

Si ce n'est pas déjà fait, le code doit être publié sur GitHub pour que Vercel puisse y accéder.

1. Connectez-vous à [github.com](https://github.com)
2. Cliquez sur le bouton **"New"** (ou **"+"** en haut à droite) → **"New repository"**
3. Donnez un nom au dépôt (ex : `user-research-suite`), laissez-le en **Private** si vous ne voulez pas qu'il soit public
4. Cliquez sur **"Create repository"**
5. Suivez les instructions affichées pour pousser le code existant :

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-nom/user-research-suite.git
git push -u origin main
```

Votre code est maintenant sur GitHub.

---

### Étape 2 — Connecter le projet à Vercel

1. Rendez-vous sur [vercel.com](https://vercel.com) et cliquez sur **"Sign Up"** si vous n'avez pas encore de compte — connectez-vous directement avec votre compte GitHub, c'est plus simple
2. Une fois connecté, cliquez sur le bouton **"Add New…"** → **"Project"**
3. Dans la liste de vos dépôts GitHub, repérez `user-research-suite` et cliquez sur **"Import"**

---

### Étape 3 — Configurer la clé API

C'est l'étape la plus importante. Sans elle, l'outil ne peut pas communiquer avec Claude AI.

1. Avant de cliquer sur "Deploy", repérez la section **"Environment Variables"** sur la page de configuration
2. Cliquez sur **"Add"**
3. Dans le champ **Name**, saisissez exactement :
   ```
   ANTHROPIC_API_KEY
   ```
4. Dans le champ **Value**, collez votre clé API Anthropic (elle commence par `sk-ant-`)
5. Cliquez sur **"Add"** pour confirmer

> ⚠️ Ne partagez jamais cette clé. Elle donne accès à votre compte Anthropic et à votre crédit.

---

### Étape 4 — Lancer le déploiement

1. Cliquez sur le bouton **"Deploy"**
2. Vercel compile et déploie automatiquement le projet — cela prend environ 1 à 2 minutes
3. Une fois terminé, vous verrez une page de confirmation avec **l'adresse de votre site** (ex : `user-research-suite.vercel.app`)
4. Cliquez sur l'adresse pour ouvrir l'outil — il est en ligne 🎉

---

### Étape 5 — Mettre à jour le site après une modification

Dès que vous poussez du nouveau code sur GitHub, Vercel redéploie automatiquement. Vous n'avez rien à faire.

```bash
git add .
git commit -m "Description de la modification"
git push
```

Le site est mis à jour en 1 à 2 minutes.

---

### En cas de problème

**Le site affiche une erreur lors de la génération**
→ Vérifiez que la variable `ANTHROPIC_API_KEY` est bien renseignée : dans Vercel, allez dans votre projet → **Settings** → **Environment Variables**.

**La clé est correcte mais ça ne fonctionne toujours pas**
→ Vérifiez que votre compte Anthropic a du crédit disponible sur [console.anthropic.com](https://console.anthropic.com) → **Billing**.

**Le déploiement échoue (erreur rouge dans Vercel)**
→ Cliquez sur le déploiement en erreur pour voir les logs. L'erreur est généralement affichée en rouge avec un message explicite. Vous pouvez le partager avec un développeur pour diagnostic.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | Tailwind CSS v4 + shadcn/ui (style new-york) |
| IA | Anthropic SDK — `claude-sonnet-4-6` |
| Export | `docx` → Word, `pptxgenjs` → PowerPoint, `xlsx` → Excel |
| Formulaires | react-hook-form + Zod |
| Fonts | Geist (next/font/google) |
| Déploiement cible | Vercel / Docker |

---

## Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9
- Une **clé API Anthropic** — [console.anthropic.com](https://console.anthropic.com)

---

## Installation

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd <dossier>

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local
# → Renseigner ANTHROPIC_API_KEY dans .env.local

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Commandes disponibles

```bash
npm run dev      # Serveur de développement (Turbopack)
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Linter ESLint
```

---

## Configuration

### Variables d'environnement

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

> La clé n'est jamais exposée côté client — toutes les requêtes Claude passent exclusivement par les routes `/app/api/`.

---

## Architecture

### Structure des dossiers

```
/app
  /api
    /generate-protocol/   → POST — streaming Claude → JSON protocol
    /export-protocol/     → POST — génération DOCX → téléchargement
  /tools
    /protocol-generator/  → Use case 1 : page formulaire + preview
  layout.tsx              → Layout racine + header de navigation
  page.tsx                → Landing page (3 cards outils)
  globals.css             → Variables CSS Tailwind v4 + shadcn

/components
  /ui/                    → Composants shadcn/ui (button, card, form…)
  /tools/
    ProtocolForm.tsx      → Formulaire de saisie (react-hook-form + Zod)
    ProtocolPreview.tsx   → Rendu structuré du protocole généré

/lib
  /types/
    protocol.ts           → Interfaces TypeScript partagées
  /prompts/
    index.ts              → Dispatcher getSystemPrompt(studyType)
    moderated_usability.ts
    exploratory_interview.ts
    unmoderated_usability.ts
    survey.ts
    diary_study.ts
  /exporters/
    docx.ts               → Générateur DOCX server-side (docx library)
```

### Types TypeScript principaux (`/lib/types/protocol.ts`)

```typescript
type StudyType =
  | "exploratory_interview"
  | "moderated_usability"
  | "unmoderated_usability"
  | "survey"
  | "diary_study";

interface Protocol {
  study_type: StudyType;
  title: string;
  duration_minutes: number;
  sections: ProtocolSection[];
  tasks: ProtocolTask[];
  observer_guide: string;
  consent_note: string;
  materials_needed: string[];
}

interface ProtocolSection {
  type: "intro" | "warmup" | "tasks" | "debrief";
  title: string;
  duration_minutes: number;
  script: string;
  questions: string[];
  tips: string;
}

interface ProtocolTask {
  task: string;
  scenario: string;
  success_criteria: string;
}
```

---

## Use cases

### Use case 1 — Générateur de protocole ✅

**Inputs (formulaire)**

| Champ | Type | Contraintes |
|---|---|---|
| Type d'étude | Select | 5 options |
| Objectif de recherche | Textarea | min. 10 caractères |
| Audience cible | Input | min. 3 caractères |
| Durée (minutes) | Number | 15 – 480 |
| Nombre de participants | Number | 1 – 500 |

**Types d'étude supportés**

| Valeur | Label |
|---|---|
| `moderated_usability` | Test d'utilisabilité modéré |
| `exploratory_interview` | Entretien exploratoire |
| `unmoderated_usability` | Test d'utilisabilité non-modéré |
| `survey` | Sondage / Survey |
| `diary_study` | Diary Study |

**Output**

- Preview structuré en temps réel (streaming) avec sections, tâches, guide observateur
- Export `.docx` téléchargeable

**Schéma JSON retourné par Claude**

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

---

### Use case 2 — Brief Builder 🔜

Génération de slides de brief stakeholders au format `.pptx` (8–10 slides : cover → contexte → objectifs → méthodologie → participants → planning → décisions attendues → next steps).

---

### Use case 3 — Analyseur de résultats 🔜

Analyse de fichiers CSV (Maze, UserTesting, Typeform…), notes de sessions ou verbatims. Export `.xlsx` (tableau d'insights) + `.docx` (rapport de synthèse).

---

## API Reference

### `POST /api/generate-protocol`

Génère un protocole UX via Claude AI avec streaming.

**Request body**

```json
{
  "studyType": "moderated_usability",
  "objective": "Comprendre comment les utilisateurs...",
  "audience": "Acheteurs en ligne, 25-45 ans",
  "duration": 60,
  "participants": 5
}
```

**Response** — `text/plain` (streaming)

Flux de texte contenant le JSON brut du protocole, streamé caractère par caractère.
En cas d'erreur : le flux se termine par `\n__ERROR__:<message>`.

**Erreurs**

| Code | Cas |
|---|---|
| `400` | Corps de requête invalide |
| `422` | Validation Zod échouée |
| `200` + `__ERROR__` | Erreur Claude pendant le stream |

---

### `POST /api/export-protocol`

Génère et télécharge le protocole au format Word.

**Request body**

```json
{
  "protocol": { ...objet Protocol complet... }
}
```

**Response** — `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

Fichier `.docx` en téléchargement direct.

**Erreurs**

| Code | Cas |
|---|---|
| `400` | Corps invalide |
| `422` | Protocole manquant ou incomplet |
| `500` | Erreur lors de la génération DOCX |

---

## Flux de données

```
Utilisateur
    │
    ▼
ProtocolForm (react-hook-form + Zod)
    │ POST JSON
    ▼
/api/generate-protocol
    │ getSystemPrompt(studyType)
    │ anthropic.messages.stream(claude-sonnet-4-6, max_tokens: 8192)
    ▼
ReadableStream → chunks text/plain
    │
    ▼
Client (page.tsx)
    │ accumule le buffer
    │ JSON.parse() sur le texte complet
    ▼
ProtocolPreview
    │ FormattedText (rendu listes/gras/paragraphes)
    │
    ├── [clic export]
    │       │ POST /api/export-protocol
    │       ▼
    │   generateProtocolDocx() → Buffer → Uint8Array
    │       │
    │       ▼
    │   Téléchargement .docx
    ▼
Fin
```

---

## Contraintes & décisions techniques

### Sécurité
- `ANTHROPIC_API_KEY` uniquement côté serveur (routes `/app/api/`)
- Jamais exposée dans le bundle client

### Streaming obligatoire
Toutes les routes Claude utilisent `ReadableStream` pour éviter les timeouts sur les générations longues (10–30 secondes).

### JSON structuré uniquement
Claude répond en JSON contraint par le prompt système. Le front reconstruit la mise en forme — pas de markdown libre côté modèle.

### Limite de tokens
`max_tokens: 8192` sur toutes les routes Claude. Si la limite est atteinte (`stop_reason === "max_tokens"`), un message d'erreur clair est envoyé au client via le stream.

### Exporters server-side uniquement
`docx`, `pptxgenjs`, `xlsx` sont incompatibles avec l'environnement browser — ils s'exécutent exclusivement dans les routes API Next.js.

### Prompts adaptatifs
Un fichier de prompt distinct par type d'étude dans `/lib/prompts/`. Pas de prompt générique : chaque type a ses propres instructions, structure et ton.

### Note de compatibilité — Next.js 16 + Tailwind v4
Le projet a été scaffoldé avec Next.js 16 et Tailwind CSS v4 (pas de `tailwind.config.js` — configuration via `globals.css`). shadcn/ui détecte automatiquement v4.

### Workaround npm — nom de package
Le répertoire "Mehdi Next" contient des espaces et majuscules, invalides pour npm. Le `package.json` utilise le nom `user-research-suite`.

---

## Roadmap

### Sprint 2 — Brief Builder
- [ ] Formulaire inputs (projet, objectifs business, questions de recherche, timeline…)
- [ ] Route `/api/generate-brief` avec streaming
- [ ] Composants `BriefForm` + `BriefPreview`
- [ ] Exporter `/lib/exporters/pptx.ts`
- [ ] Route `/api/export-brief`

### Sprint 3 — Analyseur de résultats
- [ ] Upload fichiers CSV / texte (Maze, UserTesting, Typeform)
- [ ] Chunking 3000 tokens max avant envoi Claude
- [ ] Route `/api/analyze-results` avec streaming
- [ ] Composants `ResultsUploader` + `ResultsReport`
- [ ] Exporters `xlsx.ts` (tableau d'insights) + rapport `docx`

### Améliorations transversales
- [ ] Historique des sessions (localStorage)
- [ ] Thème sombre
- [ ] Déploiement Vercel + `docker-compose` pour self-hosting
- [ ] Tests unitaires (exporters, parsers)
- [ ] Internationalisation (EN)
