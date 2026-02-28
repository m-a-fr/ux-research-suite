"use client";

import React from "react";
import { Brief } from "@/lib/types/brief";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BriefSlideViewer } from "./BriefSlideViewer";

// ─── Streaming progress ────────────────────────────────────────────────────

const STREAMING_STAGES = [
  {
    id: "init",
    label: "Initialisation",
    sublabel: "Analyse du protocole et cadrage du brief",
    marker: null,
    pct: 5,
  },
  {
    id: "reflexion",
    label: "Réflexion",
    sublabel: "Analyse slide par slide avant rédaction",
    marker: "<reflexion>",
    pct: 20,
  },
  {
    id: "per_slide",
    label: "Rédaction des slides",
    sublabel: "Contenu HTML et speaker notes",
    marker: "## Slide",
    pct: 20, // interpolated dynamically between 20% and 74%
  },
  {
    id: "evaluation",
    label: "Évaluation globale",
    sublabel: "Note et constats de qualité",
    marker: "## Évaluation",
    pct: 75,
  },
  {
    id: "revision",
    label: "Révisions",
    sublabel: "Corrections de ton et de contenu",
    marker: "## Révisions",
    pct: 85,
  },
  {
    id: "finalisation",
    label: "Finalisation",
    sublabel: "Génération du JSON structuré",
    marker: "<brief>",
    pct: 95,
  },
] as const;

type StageId = (typeof STREAMING_STAGES)[number]["id"];

function countSlides(buffer: string): number {
  return (buffer.match(/## Slide \d+/g) ?? []).length;
}

function computePct(buffer: string, currentId: StageId): number {
  if (currentId === "per_slide") {
    const n = countSlides(buffer);
    // Interpolate linearly between 20% (0 slides) and 74% (9 slides)
    return Math.round(20 + Math.min(n / 9, 1) * 54);
  }
  const stage = STREAMING_STAGES.find((s) => s.id === currentId);
  return stage?.pct ?? 5;
}

function detectStageIndex(buffer: string): number {
  // Walk stages in reverse to find the last matched marker
  for (let i = STREAMING_STAGES.length - 1; i >= 0; i--) {
    const marker = STREAMING_STAGES[i].marker;
    if (marker && buffer.includes(marker)) return i;
  }
  return 0;
}

function StreamingProgress({ buffer }: { buffer: string }) {
  const currentIdx = detectStageIndex(buffer);
  const currentStage = STREAMING_STAGES[currentIdx];
  const slideCount = countSlides(buffer);
  const pct = computePct(buffer, currentStage.id);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Génération du brief…{" "}
            {currentStage.id === "per_slide" && slideCount > 0
              ? `(${slideCount}/9 slides)`
              : ""}
          </span>
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
              <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold">
                {isDone ? (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                    ✓
                  </span>
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </span>
              <div>
                <p
                  className={`text-sm font-medium leading-tight ${
                    isDone
                      ? "text-muted-foreground line-through decoration-muted-foreground/40"
                      : isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {stage.label}
                  {isCurrent && stage.id === "per_slide" && slideCount > 0
                    ? ` (${slideCount}/9)`
                    : ""}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">{stage.sublabel}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Skeleton viewer 16:9 */}
      <div className="space-y-3 pt-2">
        <Skeleton className="w-full rounded-xl" style={{ aspectRatio: "16/9" }} />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ─── Study type labels ─────────────────────────────────────────────────────

const STUDY_TYPE_LABELS: Record<string, string> = {
  exploratory_interview: "Entretiens exploratoires",
  moderated_usability: "Test modéré",
  unmoderated_usability: "Test non-modéré",
  survey: "Sondage",
  diary_study: "Journal de bord",
};

// ─── Main component ────────────────────────────────────────────────────────

interface BriefPreviewProps {
  brief: Brief | null;
  isStreaming: boolean;
  streamBuffer: string;
  onExport: () => void;
  isExporting: boolean;
  onReset?: () => void;
  onExportPdf?: () => void;
}

export function BriefPreview({
  brief,
  isStreaming,
  streamBuffer,
  onExport,
  isExporting,
  onReset,
  onExportPdf,
}: BriefPreviewProps) {
  if (!isStreaming && !brief) return null;

  if (isStreaming) {
    return <StreamingProgress buffer={streamBuffer} />;
  }

  if (!brief) return null;

  const studyLabel =
    STUDY_TYPE_LABELS[brief.source_study_type] ?? brief.source_study_type;

  return (
    <div className="space-y-5">
      {/* Header metadata */}
      <div>
        <h2 className="text-xl font-semibold">{brief.project_title}</h2>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {studyLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {brief.slides.length} slides · {brief.generated_date}
          </span>
        </div>
      </div>

      {/* Slide viewer with built-in controls */}
      <BriefSlideViewer
        brief={brief}
        onExport={onExport}
        isExporting={isExporting}
        onReset={onReset}
        onExportPdf={onExportPdf}
      />
    </div>
  );
}
