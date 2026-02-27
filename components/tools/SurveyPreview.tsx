"use client";

import React from "react";
import { Survey, SurveyBlock, SurveyQuestion, SurveyQuestionType } from "@/lib/types/survey";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Streaming progress ────────────────────────────────────────────────────

const STREAMING_STAGES = [
  {
    id: "analyse",
    label: "Analyse des dimensions",
    sublabel: "Compréhension des objectifs de mesure",
    marker: null,
    pct: 5,
  },
  {
    id: "blocs",
    label: "Structure des blocs",
    sublabel: "Organisation screening → thématiques → clôture",
    marker: '"blocks"',
    pct: 20,
  },
  {
    id: "questions",
    label: "Rédaction des questions",
    sublabel: "Formulation neutre, sans biais",
    marker: '"questions"',
    pct: 45,
  },
  {
    id: "echelles",
    label: "Échelles et options",
    sublabel: "Likert, NPS, QCM, matrices…",
    marker: '"options"',
    pct: 65,
  },
  {
    id: "logique",
    label: "Logique conditionnelle",
    sublabel: "Skip logic et règles de screening",
    marker: '"skip_logic"',
    pct: 82,
  },
  {
    id: "finalisation",
    label: "Finalisation",
    sublabel: "Consentement, critères de screening",
    marker: '"consent_note"',
    pct: 95,
  },
] as const;

function detectStageIndex(buffer: string): number {
  for (let i = STREAMING_STAGES.length - 1; i >= 0; i--) {
    const marker = STREAMING_STAGES[i].marker;
    if (marker && buffer.includes(marker)) return i;
  }
  return 0;
}

function StreamingProgress({ buffer }: { buffer: string }) {
  const currentIdx = detectStageIndex(buffer);
  const pct = STREAMING_STAGES[currentIdx].pct;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Génération du sondage…</span>
          <span className="text-xs text-muted-foreground">{pct} %</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <ol className="space-y-2">
        {STREAMING_STAGES.map((stage, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <li key={stage.id} className="flex gap-3 items-start">
              <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5">
                {isDone ? (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">✓</span>
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </span>
              <div>
                <p className={`text-sm font-medium leading-tight ${
                  isDone ? "text-muted-foreground line-through decoration-muted-foreground/40"
                  : isCurrent ? "text-foreground"
                  : "text-muted-foreground/50"
                }`}>{stage.label}</p>
                {isCurrent && <p className="text-xs text-muted-foreground mt-0.5">{stage.sublabel}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="space-y-3 pt-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}

// ─── Question type config ──────────────────────────────────────────────────

const QUESTION_TYPE_CONFIG: Record<SurveyQuestionType, { label: string; color: string }> = {
  likert:       { label: "Likert",         color: "bg-blue-100 text-blue-800" },
  nps:          { label: "NPS",            color: "bg-purple-100 text-purple-800" },
  csat:         { label: "CSAT",           color: "bg-yellow-100 text-yellow-800" },
  mcq_single:   { label: "Choix unique",   color: "bg-green-100 text-green-800" },
  mcq_multiple: { label: "Choix multiple", color: "bg-teal-100 text-teal-800" },
  ranking:      { label: "Classement",     color: "bg-orange-100 text-orange-800" },
  open_short:   { label: "Ouvert",         color: "bg-gray-100 text-gray-700" },
  matrix:       { label: "Matrice",        color: "bg-indigo-100 text-indigo-800" },
  slider:       { label: "Curseur",        color: "bg-pink-100 text-pink-800" },
  demographic:  { label: "Démographique",  color: "bg-slate-100 text-slate-700" },
};

const BLOCK_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  screening:      { label: "Screening",            color: "bg-red-100 text-red-800" },
  intro:          { label: "Introduction",          color: "bg-blue-100 text-blue-800" },
  demographics:   { label: "Données démographiques", color: "bg-slate-100 text-slate-700" },
  thematic:       { label: "Thématique",            color: "bg-violet-100 text-violet-800" },
  standard_scale: { label: "Échelle normée",        color: "bg-indigo-100 text-indigo-800" },
  closing:        { label: "Clôture",               color: "bg-green-100 text-green-800" },
};

// ─── Answer renderers ──────────────────────────────────────────────────────

function ScaleAnswer({ q }: { q: SurveyQuestion }) {
  const min = q.scale_min ?? 1;
  const max = q.scale_max ?? 5;
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="mt-2">
      <div className="flex gap-1.5 items-end flex-wrap">
        {points.map((n) => (
          <div key={n} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground">{n}</span>
            <div className="w-6 h-6 rounded-full border border-muted-foreground/40 bg-background" />
          </div>
        ))}
      </div>
      {q.scale_labels && (
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{q.scale_labels.min}</span>
          <span>{q.scale_labels.max}</span>
        </div>
      )}
    </div>
  );
}

function NpsAnswer({ q }: { q: SurveyQuestion }) {
  return (
    <div className="mt-2">
      <div className="flex gap-1 flex-wrap">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <div
            key={n}
            className="w-7 h-7 rounded border border-muted-foreground/30 flex items-center justify-center text-xs font-medium text-muted-foreground bg-muted/30"
          >
            {n}
          </div>
        ))}
      </div>
      {q.scale_labels && (
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{q.scale_labels.min}</span>
          <span>{q.scale_labels.max}</span>
        </div>
      )}
    </div>
  );
}

function CsatAnswer() {
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="text-xl text-muted-foreground/30">★</span>
      ))}
    </div>
  );
}

function McqAnswer({ q, multiple }: { q: SurveyQuestion; multiple: boolean }) {
  const opts = q.options ?? [];
  return (
    <ul className="mt-2 space-y-1">
      {opts.map((opt, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
          {multiple ? (
            <span className="w-4 h-4 rounded border border-muted-foreground/40 shrink-0 bg-background" />
          ) : (
            <span className="w-4 h-4 rounded-full border border-muted-foreground/40 shrink-0 bg-background" />
          )}
          {opt}
        </li>
      ))}
    </ul>
  );
}

function RankingAnswer({ q }: { q: SurveyQuestion }) {
  const opts = q.options ?? [];
  return (
    <ul className="mt-2 space-y-1">
      {opts.map((opt, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="shrink-0 w-5 h-5 rounded border border-muted-foreground/30 text-xs flex items-center justify-center font-medium">
            {i + 1}
          </span>
          {opt}
        </li>
      ))}
    </ul>
  );
}

function OpenAnswer() {
  return (
    <div className="mt-2 rounded border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground italic bg-muted/20">
      Zone de réponse texte libre…
    </div>
  );
}

function MatrixAnswer({ q }: { q: SurveyQuestion }) {
  const min = q.scale_min ?? 1;
  const max = q.scale_max ?? 5;
  const cols = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const rows = q.matrix_rows ?? [];

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left w-2/5 pb-1 pr-2 font-normal text-muted-foreground" />
            {cols.map((n) => (
              <th key={n} className="text-center pb-1 px-1 font-medium text-muted-foreground w-8">
                {n}
              </th>
            ))}
          </tr>
          {q.scale_labels && (
            <tr>
              <th />
              <th className="text-left font-normal text-muted-foreground/70 pb-1 pr-1" colSpan={Math.ceil(cols.length / 2)}>
                {q.scale_labels.min}
              </th>
              <th className="text-right font-normal text-muted-foreground/70 pb-1 pl-1" colSpan={Math.floor(cols.length / 2)}>
                {q.scale_labels.max}
              </th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-muted/20" : ""}>
              <td className="text-foreground pr-2 py-1.5 text-xs">{row}</td>
              {cols.map((_, ci) => (
                <td key={ci} className="text-center py-1.5">
                  <span className="inline-block w-4 h-4 rounded-full border border-muted-foreground/40 bg-background" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SliderAnswer({ q }: { q: SurveyQuestion }) {
  return (
    <div className="mt-2 px-1">
      <div className="h-1.5 rounded-full bg-muted relative">
        <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/50 absolute left-1/2 -top-1 -ml-1.5 border-2 border-background shadow" />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
        <span>{q.scale_min ?? 0}</span>
        <span>{q.scale_max ?? 100}</span>
      </div>
    </div>
  );
}

function AnswerRenderer({ q }: { q: SurveyQuestion }) {
  switch (q.type) {
    case "likert":       return <ScaleAnswer q={q} />;
    case "nps":          return <NpsAnswer q={q} />;
    case "csat":         return <CsatAnswer />;
    case "mcq_single":   return <McqAnswer q={q} multiple={false} />;
    case "mcq_multiple": return <McqAnswer q={q} multiple={true} />;
    case "ranking":      return <RankingAnswer q={q} />;
    case "open_short":   return <OpenAnswer />;
    case "matrix":       return <MatrixAnswer q={q} />;
    case "slider":       return <SliderAnswer q={q} />;
    case "demographic":
      return q.options?.length ? <McqAnswer q={q} multiple={false} /> : <OpenAnswer />;
    default:             return null;
  }
}

// ─── Question card ─────────────────────────────────────────────────────────

function QuestionCard({ q, globalIndex }: { q: SurveyQuestion; globalIndex: number }) {
  const typeConfig = QUESTION_TYPE_CONFIG[q.type] ?? { label: q.type, color: "bg-gray-100 text-gray-700" };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-start gap-2 px-4 py-3">
        <span className="shrink-0 text-sm font-semibold text-muted-foreground w-8">
          {q.id ?? `Q${globalIndex}`}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <Badge className={`${typeConfig.color} border-0 text-xs shrink-0`}>{typeConfig.label}</Badge>
            {q.required && (
              <span className="text-xs text-destructive font-medium shrink-0">Obligatoire</span>
            )}
            {q.is_screening && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium shrink-0">
                Screening
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-foreground leading-snug">{q.text}</p>

          <AnswerRenderer q={q} />

          {q.skip_logic && (
            <p className="mt-2 text-xs text-blue-600 italic">
              ↳ {q.skip_logic}
            </p>
          )}
          {q.analysis_note && (
            <p className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1 italic">
              Note d&apos;analyse : {q.analysis_note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Block card ─────────────────────────────────────────────────────────────

function BlockCard({ block, questionOffset }: { block: SurveyBlock; questionOffset: number }) {
  const config = BLOCK_TYPE_CONFIG[block.type] ?? { label: block.type, color: "bg-gray-100 text-gray-700" };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">{block.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${config.color} border-0 text-xs`}>{config.label}</Badge>
            {block.standard_scale_name && (
              <Badge className="bg-indigo-100 text-indigo-800 border-0 text-xs">
                {block.standard_scale_name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {block.questions.length} question{block.questions.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        {block.description && (
          <p className="text-xs text-muted-foreground italic mt-1">{block.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {block.questions.map((q, i) => (
          <QuestionCard key={q.id ?? i} q={q} globalIndex={questionOffset + i + 1} />
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  in_app: "In-app",
  qr_intercept: "QR / Intercept",
  external_panel: "Panel externe",
};

interface SurveyPreviewProps {
  survey: Survey | null;
  isStreaming: boolean;
  streamBuffer: string;
  onExport: () => void;
  isExporting: boolean;
}

export function SurveyPreview({
  survey,
  isStreaming,
  streamBuffer,
  onExport,
  isExporting,
}: SurveyPreviewProps) {
  if (!isStreaming && !survey) return null;
  if (isStreaming) return <StreamingProgress buffer={streamBuffer} />;
  if (!survey) return null;

  const totalQuestions = survey.blocks.reduce((acc, b) => acc + (b.questions?.length ?? 0), 0);

  // Compute cumulative question offset per block
  const blockOffsets: number[] = [];
  let offset = 0;
  for (const block of survey.blocks) {
    blockOffsets.push(offset);
    offset += block.questions?.length ?? 0;
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">{survey.title}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
            <span>~{survey.estimated_completion_minutes} min</span>
            <span>·</span>
            <span>{totalQuestions} question{totalQuestions > 1 ? "s" : ""}</span>
            <span>·</span>
            <span>{CHANNEL_LABELS[survey.distribution_channel] ?? survey.distribution_channel}</span>
          </div>
        </div>
        <Button onClick={onExport} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? "Export…" : "Télécharger .docx"}
        </Button>
      </div>

      {survey.screening_criteria && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          <span className="font-semibold">Critères de screening : </span>
          {survey.screening_criteria}
        </div>
      )}

      <Separator />

      {/* Blocs */}
      <div className="space-y-4">
        {survey.blocks.map((block, i) => (
          <BlockCard key={i} block={block} questionOffset={blockOffsets[i]} />
        ))}
      </div>

      {/* Consentement */}
      {survey.consent_note && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Note de consentement
            </h3>
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-4 text-sm leading-relaxed">
                {survey.consent_note}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
