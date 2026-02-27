"use client";

import React from "react";
import { ModeratedProtocol, ModeratedSection, ModeratedTask } from "@/lib/types/moderated";
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
    sublabel: "Compréhension du contexte produit et des objectifs",
    marker: null,
    pct: 5,
  },
  {
    id: "titre",
    label: "Titre et méta-données",
    sublabel: "Nom du protocole, plateforme, fidélité, think-aloud",
    marker: '"title"',
    pct: 15,
  },
  {
    id: "sections",
    label: "Sections du protocole",
    sublabel: "Introduction, mise en chauffe, tâches, debrief",
    marker: '"sections"',
    pct: 30,
  },
  {
    id: "taches",
    label: "Tâches utilisateur",
    sublabel: "Scénarios, critères de succès, temps limite",
    marker: '"tasks"',
    pct: 55,
  },
  {
    id: "cues",
    label: "Signaux comportementaux",
    sublabel: "Observer cues et questions post-tâche",
    marker: '"observer_cues"',
    pct: 72,
  },
  {
    id: "probes",
    label: "Questions conditionnelles",
    sublabel: "Probe questions déclenchées par des comportements précis",
    marker: '"probe_questions"',
    pct: 87,
  },
  {
    id: "finalisation",
    label: "Guide observateur & finalisation",
    sublabel: "Consentement, matériels, instructions observateur",
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
          <span className="text-xs font-medium text-muted-foreground">Génération du protocole…</span>
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
                  isDone
                    ? "text-muted-foreground line-through decoration-muted-foreground/40"
                    : isCurrent
                    ? "text-foreground"
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
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

// ─── Labels ────────────────────────────────────────────────────────────────

const SECTION_TYPE_LABELS: Record<string, string> = {
  intro: "Introduction",
  warmup: "Mise en chauffe",
  tasks: "Tâches",
  debrief: "Debrief",
};

const SECTION_TYPE_COLORS: Record<string, string> = {
  intro: "bg-blue-100 text-blue-800",
  warmup: "bg-green-100 text-green-800",
  tasks: "bg-violet-100 text-violet-800",
  debrief: "bg-orange-100 text-orange-800",
};

const PLATFORM_LABELS: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  desktop: "Desktop",
};

const FIDELITY_LABELS: Record<string, string> = {
  live_product: "Produit live",
  prototype_hifi: "Prototype hi-fi",
  prototype_lowfi: "Prototype lo-fi",
};

const THINK_ALOUD_LABELS: Record<string, string> = {
  concurrent: "Think-aloud concurrent",
  retrospective: "Think-aloud rétrospectif",
  none: "Sans think-aloud",
};

// ─── Section card ──────────────────────────────────────────────────────────

function SectionCard({ section }: { section: ModeratedSection }) {
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
        {section.script && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Script modérateur
            </p>
            <p className="text-foreground leading-relaxed italic bg-muted/40 rounded px-3 py-2 border-l-2 border-primary/30">
              {section.script}
            </p>
          </div>
        )}

        {section.questions.length > 0 && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
              Questions
            </p>
            <ul className="space-y-1.5">
              {section.questions.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="shrink-0 text-muted-foreground font-medium">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {section.tips && (
          <p className="text-amber-700 bg-amber-50 rounded px-3 py-2 text-xs italic border border-amber-200">
            💡 {section.tips}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Task card ─────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: ModeratedTask }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              Tâche {task.task_number}
            </p>
            <CardTitle className="text-base leading-snug">{task.task}</CardTitle>
          </div>
          <Badge className="bg-muted text-muted-foreground border border-border text-xs shrink-0">
            ⏱ {task.time_limit_minutes} min max
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {/* Scenario */}
        <div>
          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Scénario (lu au participant)
          </p>
          <p className="italic bg-muted/40 rounded px-3 py-2 border-l-2 border-primary/30 leading-relaxed">
            {task.scenario}
          </p>
        </div>

        {/* Success criteria */}
        <div>
          <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Critère de succès
          </p>
          <p className="text-foreground">{task.success_criteria}</p>
        </div>

        {/* Observer cues */}
        {task.observer_cues.length > 0 && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
              Signaux à observer
            </p>
            <ul className="space-y-1.5">
              {task.observer_cues.map((cue, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Post-task questions */}
        {task.post_task_questions.length > 0 && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
              Questions post-tâche
            </p>
            <ul className="space-y-1.5">
              {task.post_task_questions.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="shrink-0 text-muted-foreground font-medium">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Probe questions */}
        {task.probe_questions.length > 0 && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
              Questions conditionnelles (probes)
            </p>
            <div className="space-y-2">
              {task.probe_questions.map((probe, i) => (
                <div key={i} className="rounded border border-border bg-muted/20 px-3 py-2 space-y-1">
                  <p className="text-xs text-amber-700 font-medium">
                    Si : {probe.condition}
                  </p>
                  <p className="text-sm">→ {probe.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface ModeratedPreviewProps {
  protocol: ModeratedProtocol | null;
  isStreaming: boolean;
  streamBuffer: string;
  onExport: () => void;
  isExporting: boolean;
}

export function ModeratedPreview({
  protocol,
  isStreaming,
  streamBuffer,
  onExport,
  isExporting,
}: ModeratedPreviewProps) {
  if (!isStreaming && !protocol) return null;
  if (isStreaming) return <StreamingProgress buffer={streamBuffer} />;
  if (!protocol) return null;

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">{protocol.title}</h2>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">{protocol.product_name}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
              {PLATFORM_LABELS[protocol.platform] ?? protocol.platform}
            </Badge>
            <Badge className="bg-violet-100 text-violet-800 border-0 text-xs">
              {FIDELITY_LABELS[protocol.fidelity] ?? protocol.fidelity}
            </Badge>
            <Badge className="bg-green-100 text-green-800 border-0 text-xs">
              {THINK_ALOUD_LABELS[protocol.think_aloud] ?? protocol.think_aloud}
            </Badge>
            <span className="text-xs text-muted-foreground">{protocol.duration_minutes} min</span>
          </div>
        </div>
        <Button onClick={onExport} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? "Export…" : "Télécharger .docx"}
        </Button>
      </div>

      <Separator />

      {/* Sections */}
      <div className="space-y-3">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Protocole
        </h3>
        {protocol.sections.map((section, i) => (
          <SectionCard key={i} section={section} />
        ))}
      </div>

      {/* Tasks */}
      {protocol.tasks.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
              Tâches ({protocol.tasks.length})
            </h3>
            {protocol.tasks.map((task, i) => (
              <TaskCard key={i} task={task} />
            ))}
          </div>
        </>
      )}

      {/* Guide observateur */}
      {protocol.observer_guide && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Guide observateur / note-taker
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
