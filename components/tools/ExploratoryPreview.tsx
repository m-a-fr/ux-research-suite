"use client";

import React from "react";
import { ExploratoryProtocol, ExploratorySection, ExploratoryTheme } from "@/lib/types/exploratory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Streaming progress ────────────────────────────────────────────────────

const STREAMING_STAGES = [
  {
    id: "analyse",
    label: "Analyse des paramètres",
    sublabel: "Compréhension du contexte et des thèmes",
    marker: null,
    pct: 5,
  },
  {
    id: "titre",
    label: "Titre et cadrage",
    sublabel: "Style d'entretien et structure générale",
    marker: '"title"',
    pct: 15,
  },
  {
    id: "sections",
    label: "Structuration des sections",
    sublabel: "Introduction, exploration, approfondissement, clôture",
    marker: '"sections"',
    pct: 35,
  },
  {
    id: "questions",
    label: "Questions d'ouverture",
    sublabel: "Une question principale par thème, non-directive",
    marker: '"opening_question"',
    pct: 60,
  },
  {
    id: "probes",
    label: "Relances et probes",
    sublabel: "Formulations pour encourager l'élaboration",
    marker: '"probes"',
    pct: 80,
  },
  {
    id: "finalisation",
    label: "Guide observateur & finalisation",
    sublabel: "Conseils, transitions, matériels",
    marker: '"observer_guide"',
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
          <span className="text-xs font-medium text-muted-foreground">Génération du guide…</span>
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
                }`}>
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
      <div className="space-y-3 pt-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}

// ─── Rendering helpers ─────────────────────────────────────────────────────

const SECTION_TYPE_LABELS: Record<string, string> = {
  intro: "Introduction",
  warmup: "Mise en chauffe",
  exploration: "Exploration",
  deepdive: "Approfondissement",
  debrief: "Clôture",
};

const SECTION_TYPE_COLORS: Record<string, string> = {
  intro: "bg-blue-100 text-blue-800",
  warmup: "bg-green-100 text-green-800",
  exploration: "bg-violet-100 text-violet-800",
  deepdive: "bg-indigo-100 text-indigo-800",
  debrief: "bg-orange-100 text-orange-800",
};

function ThemeCard({ theme, index }: { theme: ExploratoryTheme; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Theme header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Thème {index + 1}
        </span>
        <span className="text-sm font-semibold text-foreground flex-1">{theme.theme}</span>
        {theme.sensitive && (
          <Badge className="bg-amber-100 text-amber-800 border-0 text-xs shrink-0">
            ⚠ Sensible
          </Badge>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Opening question */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
            Question d&apos;ouverture
          </p>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {theme.opening_question}
          </p>
        </div>

        {/* Probes */}
        {theme.probes.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
              Si le participant n&apos;élabore pas…
            </p>
            <ul className="space-y-1.5">
              {theme.probes.map((probe, pi) => (
                <li key={pi} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                  <span>{probe}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: ExploratorySection }) {
  const colorClass = SECTION_TYPE_COLORS[section.type] ?? "bg-gray-100 text-gray-800";
  const label = SECTION_TYPE_LABELS[section.type] ?? section.type;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">{section.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${colorClass} border-0 text-xs`}>{label}</Badge>
            <span className="text-xs text-muted-foreground">{section.duration_minutes} min</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {/* Script du chercheur */}
        {section.script && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Script
            </p>
            <p className="text-foreground leading-relaxed italic bg-muted/40 rounded px-3 py-2 border-l-2 border-primary/30">
              {section.script}
            </p>
          </div>
        )}

        {/* Thèmes */}
        {section.themes?.length > 0 && (
          <div className="space-y-2">
            {section.themes.map((theme, i) => (
              <ThemeCard key={i} theme={theme} index={i} />
            ))}
          </div>
        )}

        {/* Transition */}
        {section.transition_note && (
          <p className="text-amber-700 bg-amber-50 rounded px-3 py-2 text-xs italic border border-amber-200">
            ↪ {section.transition_note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

const STYLE_LABELS: Record<string, string> = {
  semi_directive: "Semi-directif",
  non_directive: "Non-directif",
};

interface ExploratoryPreviewProps {
  protocol: ExploratoryProtocol | null;
  isStreaming: boolean;
  streamBuffer: string;
  onExport: () => void;
  isExporting: boolean;
}

export function ExploratoryPreview({
  protocol,
  isStreaming,
  streamBuffer,
  onExport,
  isExporting,
}: ExploratoryPreviewProps) {
  if (!isStreaming && !protocol) return null;

  if (isStreaming) {
    return <StreamingProgress buffer={streamBuffer} />;
  }

  if (!protocol) return null;

  const styleLabel = STYLE_LABELS[protocol.interview_style] ?? protocol.interview_style;

  // Nombre total de thèmes pour donner une vue d'ensemble
  const totalThemes = protocol.sections.reduce(
    (acc, s) => acc + (s.themes?.length ?? 0),
    0
  );

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">{protocol.title}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>{protocol.duration_minutes} min</span>
            <span>·</span>
            <span>{styleLabel}</span>
            <span>·</span>
            <span>{totalThemes} thème{totalThemes > 1 ? "s" : ""}</span>
          </div>
        </div>
        <Button onClick={onExport} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? "Export…" : "Télécharger .docx"}
        </Button>
      </div>

      <Separator />

      {/* Sections */}
      <div className="space-y-3">
        {protocol.sections.map((section, i) => (
          <SectionCard key={i} section={section} />
        ))}
      </div>

      {/* Guide observateur */}
      {protocol.observer_guide && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Guide observateur
            </h3>
            <Card>
              <CardContent className="pt-4 pb-4 text-sm leading-relaxed">
                {protocol.observer_guide}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Matériels */}
      {protocol.materials_needed?.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-2">
              Matériels nécessaires
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {protocol.materials_needed.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Note de consentement */}
      {protocol.consent_note && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Note de consentement
            </h3>
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-4 text-sm leading-relaxed">
                {protocol.consent_note}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
