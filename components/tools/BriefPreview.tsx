"use client";

import React from "react";
import { Brief, BriefSlide, BriefSlideType } from "@/lib/types/brief";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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
    id: "project_title",
    label: "Titre et métadonnées",
    sublabel: "Nom du projet, type d'étude, date",
    marker: '"project_title"',
    pct: 15,
  },
  {
    id: "slides",
    label: "Génération des slides",
    sublabel: "Contexte, objectifs, méthodologie…",
    marker: '"slides"',
    pct: 30,
  },
  {
    id: "progress",
    label: "Rédaction du contenu",
    sublabel: "Bullets et speaker notes par slide",
    marker: '"slide_number"',
    pct: 60,
  },
  {
    id: "finalisation",
    label: "Finalisation",
    sublabel: "Décisions et prochaines étapes",
    marker: '"next_steps"',
    pct: 90,
  },
] as const;

function countSlides(buffer: string): number {
  return (buffer.match(/"slide_number"/g) ?? []).length;
}

function detectStageIndex(buffer: string): number {
  for (let i = STREAMING_STAGES.length - 1; i >= 0; i--) {
    const marker = STREAMING_STAGES[i].marker;
    if (marker && buffer.includes(marker)) return i;
  }
  return 0;
}

function StreamingProgress({ buffer }: { buffer: string }) {
  const currentIdx = detectStageIndex(buffer);
  const slideCount = countSlides(buffer);
  const pct = STREAMING_STAGES[currentIdx].pct;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Génération du brief… {slideCount > 0 ? `(${slideCount}/9 slides)` : ""}
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
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">{stage.sublabel}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Skeleton slide cards */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Slide card ────────────────────────────────────────────────────────────

const SLIDE_TYPE_LABELS: Record<BriefSlideType, string> = {
  cover: "Couverture",
  context: "Contexte",
  objectives: "Objectifs",
  methodology: "Méthodologie",
  participants: "Participants",
  timeline: "Calendrier",
  deliverables: "Livrables",
  decisions: "Décisions",
  next_steps: "Prochaines étapes",
};

const SLIDE_TYPE_ICONS: Record<BriefSlideType, string> = {
  cover: "🎯",
  context: "🔍",
  objectives: "📌",
  methodology: "🧪",
  participants: "👥",
  timeline: "📅",
  deliverables: "📦",
  decisions: "⚖️",
  next_steps: "🚀",
};

const SLIDE_TYPE_COLORS: Record<BriefSlideType, string> = {
  cover: "bg-slate-800 text-white border-slate-700",
  context: "bg-slate-100 text-slate-700",
  objectives: "bg-blue-100 text-blue-800",
  methodology: "bg-violet-100 text-violet-800",
  participants: "bg-green-100 text-green-800",
  timeline: "bg-amber-100 text-amber-800",
  deliverables: "bg-orange-100 text-orange-800",
  decisions: "bg-red-100 text-red-800",
  next_steps: "bg-emerald-100 text-emerald-800",
};

function SlideCard({ slide }: { slide: BriefSlide }) {
  const colorClass = SLIDE_TYPE_COLORS[slide.type] ?? "bg-gray-100 text-gray-800";
  const label = SLIDE_TYPE_LABELS[slide.type] ?? slide.type;
  const icon = SLIDE_TYPE_ICONS[slide.type] ?? "📄";
  const isCover = slide.type === "cover";

  return (
    <Card className={`overflow-hidden ${isCover ? "border-slate-700" : ""}`}>
      {/* Card header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b ${
          isCover ? "bg-slate-800 border-slate-700" : "bg-muted/30 border-border"
        }`}
      >
        <span className="text-base">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                isCover ? "text-slate-300" : "text-muted-foreground"
              }`}
            >
              {slide.slide_number}
            </span>
            <Badge
              className={`${colorClass} border-0 text-xs px-1.5 py-0 h-auto shrink-0`}
            >
              {label}
            </Badge>
          </div>
          <p
            className={`text-xs font-medium mt-0.5 truncate ${
              isCover ? "text-white" : "text-foreground"
            }`}
          >
            {slide.title}
          </p>
        </div>
      </div>

      {/* Bullets preview */}
      <CardContent className="px-3 py-2.5">
        <ul className="space-y-1">
          {slide.bullets.slice(0, 3).map((bullet, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
              <span className="mt-1 w-1 h-1 rounded-full bg-primary/40 shrink-0" />
              <span className="line-clamp-2 leading-snug">{bullet}</span>
            </li>
          ))}
          {slide.bullets.length > 3 && (
            <li className="text-xs text-muted-foreground/50 pl-2.5">
              +{slide.bullets.length - 3} autres…
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
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
}

export function BriefPreview({
  brief,
  isStreaming,
  streamBuffer,
  onExport,
  isExporting,
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
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
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
        <Button onClick={onExport} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? "Export…" : "Télécharger .pptx"}
        </Button>
      </div>

      <Separator />

      {/* 3×3 slide grid */}
      <div className="grid grid-cols-3 gap-3">
        {brief.slides.map((slide) => (
          <SlideCard key={slide.slide_number} slide={slide} />
        ))}
      </div>
    </div>
  );
}
