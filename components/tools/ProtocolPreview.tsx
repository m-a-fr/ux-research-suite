"use client";

import React from "react";
import { Protocol, ProtocolQuestion, ProtocolSection } from "@/lib/types/protocol";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Barre de progression du streaming
// ---------------------------------------------------------------------------

const STREAMING_STAGES = [
  {
    id: "analyse",
    label: "Analyse de l'objectif",
    sublabel: "Compréhension du contexte et des paramètres",
    marker: null,
    pct: 5,
  },
  {
    id: "structure",
    label: "Titre et structure générale",
    sublabel: "Définition du cadre du protocole",
    marker: '"title"',
    pct: 18,
  },
  {
    id: "sections",
    label: "Rédaction des sections",
    sublabel: "Introduction, mise en chauffe, tâches, débrief",
    marker: '"sections"',
    pct: 45,
  },
  {
    id: "tasks",
    label: "Rédaction des tâches",
    sublabel: "Scénarios, critères de succès, métriques",
    marker: '"behavioral_metrics"',
    pct: 72,
  },
  {
    id: "guide",
    label: "Guide observateur & matériels",
    sublabel: "Consignes, ressources, note de consentement",
    marker: '"observer_guide"',
    pct: 90,
  },
  {
    id: "final",
    label: "Finalisation",
    sublabel: "Vérification et mise en forme",
    marker: '"materials_needed"',
    pct: 98,
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
      {/* Barre de progression */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Génération en cours…</span>
          <span className="text-xs text-muted-foreground">{pct} %</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Étapes */}
      <ol className="space-y-2">
        {STREAMING_STAGES.map((stage, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isPending = i > currentIdx;

          return (
            <li key={stage.id} className="flex gap-3 items-start">
              {/* Icône */}
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

              {/* Texte */}
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

      {/* Skeletons */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}

/** Rendu léger du texte structuré généré par Claude (listes, paragraphes, gras). */
function FormattedText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
        const isBulletList = lines.every((l) => /^[-•*]\s/.test(l));
        const isNumberedList = lines.every((l) => /^\d+[.)]\s/.test(l));

        if (isBulletList) {
          return (
            <ul key={pi} className="space-y-1 list-none">
              {lines.map((line, li) => (
                <li key={li} className="flex gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                  <span>{renderInline(line.replace(/^[-•*]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pi} className="space-y-1 list-none">
              {lines.map((line, li) => {
                const numMatch = line.match(/^(\d+)[.)]\s+([\s\S]*)/);
                const num = numMatch?.[1] ?? String(li + 1);
                const content = numMatch?.[2] ?? line;
                return (
                  <li key={li} className="flex gap-2">
                    <span className="shrink-0 font-medium text-muted-foreground w-5 text-right">
                      {num}.
                    </span>
                    <span>{renderInline(content)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        if (lines.length > 1) {
          return (
            <div key={pi} className="space-y-1.5">
              {lines.map((line, li) => (
                <p key={li}>{renderInline(line)}</p>
              ))}
            </div>
          );
        }

        return <p key={pi}>{renderInline(lines[0] ?? "")}</p>;
      })}
    </div>
  );
}

/** Rend le gras markdown `**text**` et les titres de section `Titre :` */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (i === 0 && /^[^:]{1,40}:\s/.test(part)) {
      const colonIdx = part.indexOf(":");
      return (
        <span key={i}>
          <strong>{part.slice(0, colonIdx)}</strong>
          {part.slice(colonIdx)}
        </span>
      );
    }
    return part;
  });
}

/** Liste numérotée avec numérotation absolue — format partagé questions & métriques déclaratives */
function NumberedList({
  items,
  startIndex,
  colorClass = "bg-muted text-muted-foreground",
}: {
  items: ProtocolQuestion[];
  startIndex: number;
  colorClass?: string;
}) {
  return (
    <ol className="space-y-3 list-none">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            className={`shrink-0 flex items-center justify-center w-5 h-5 rounded-full font-semibold text-xs mt-0.5 ${colorClass}`}
          >
            {startIndex + i}
          </span>
          <div className="space-y-1">
            <span className="text-foreground leading-relaxed">{item.text}</span>
            {item.modality && (
              <p className="text-xs text-muted-foreground italic">↳ {item.modality}</p>
            )}
            {item.options && item.options.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {item.options.map((opt, oi) => (
                  <li key={oi} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 w-4 h-4 rounded border border-muted-foreground/30 flex items-center justify-center text-[10px] font-medium bg-muted">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

const SECTION_TYPE_COLORS: Record<string, string> = {
  intro: "bg-blue-100 text-blue-800",
  warmup: "bg-green-100 text-green-800",
  tasks: "bg-purple-100 text-purple-800",
  debrief: "bg-orange-100 text-orange-800",
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  intro: "Introduction",
  warmup: "Mise en chauffe",
  tasks: "Tâches",
  debrief: "Debriefing",
};

function SectionCard({
  section,
  questionOffset,
}: {
  section: ProtocolSection;
  questionOffset: number;
}) {
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
              Script
            </p>
            <p className="text-foreground leading-relaxed">{section.script}</p>
          </div>
        )}

        {section.questions?.length > 0 && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Questions
            </p>
            <NumberedList items={section.questions} startIndex={questionOffset + 1} />
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

interface ProtocolPreviewProps {
  protocol: Protocol | null;
  isStreaming: boolean;
  streamBuffer: string;
  onExport: () => void;
  isExporting: boolean;
  onExportPdf?: () => void;
}

export function ProtocolPreview({
  protocol,
  isStreaming,
  streamBuffer,
  onExport,
  isExporting,
  onExportPdf,
}: ProtocolPreviewProps) {
  if (!isStreaming && !protocol) return null;

  if (isStreaming) {
    return <StreamingProgress buffer={streamBuffer} />;
  }

  if (!protocol) return null;

  // Séparer les sections principales des sections de débrief
  const mainSections = protocol.sections.filter((s) => s.type !== "debrief");
  const debriefSections = protocol.sections.filter((s) => s.type === "debrief");

  // Calculer le compteur absolu de questions
  // Phase 1 : questions des sections principales
  const mainSectionOffsets: number[] = [];
  let counter = 0;
  for (const section of mainSections) {
    mainSectionOffsets.push(counter);
    counter += section.questions?.length ?? 0;
  }

  // Phase 2 : métriques déclaratives par tâche (continuent le compteur)
  const taskDeclarativeOffsets: number[] = [];
  for (const task of protocol.tasks ?? []) {
    taskDeclarativeOffsets.push(counter);
    counter += task.declarative_metrics?.length ?? 0;
  }

  // Phase 3 : questions du débrief (continuent le compteur)
  const debriefOffsets: number[] = [];
  for (const section of debriefSections) {
    debriefOffsets.push(counter);
    counter += section.questions?.length ?? 0;
  }

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">{protocol.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Durée totale : {protocol.duration_minutes} min
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExportPdf && (
            <Button onClick={onExportPdf} disabled={isExporting} variant="ghost" size="sm">
              {isExporting ? "…" : ".pdf"}
            </Button>
          )}
          <Button onClick={onExport} disabled={isExporting} variant="outline" size="sm">
            {isExporting ? "Export…" : "Télécharger .docx"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Sections principales (hors débrief) */}
      {mainSections.length > 0 && (
        <div>
          <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
            Sections
          </h3>
          <div className="space-y-3">
            {mainSections.map((section, i) => (
              <SectionCard
                key={i}
                section={section}
                questionOffset={mainSectionOffsets[i]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tâches */}
      {protocol.tasks?.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Tâches
            </h3>
            <div className="space-y-3">
              {protocol.tasks.map((task, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-4 space-y-3 text-sm">
                    <p className="font-medium">{i + 1}. {task.task}</p>

                    <div>
                      <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Scénario
                      </p>
                      <FormattedText text={task.scenario} />
                    </div>

                    <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2">
                      <p className="font-medium text-xs uppercase tracking-wide text-green-700 mb-1">
                        Critère de succès
                      </p>
                      <div className="text-green-900">
                        <FormattedText text={task.success_criteria} />
                      </div>
                    </div>

                    {task.declarative_metrics?.length ? (
                      <div>
                        <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">
                          Questions post-tâche
                        </p>
                        <NumberedList
                          items={task.declarative_metrics}
                          startIndex={taskDeclarativeOffsets[i] + 1}
                        />
                      </div>
                    ) : null}

                    {task.behavioral_metrics?.length ? (
                      <div className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2">
                        <p className="font-semibold text-xs uppercase tracking-wide text-violet-700 mb-1.5">
                          📊 Métriques comportementales
                        </p>
                        <p className="text-xs text-violet-500 italic mb-2">
                          Collectées automatiquement par l&apos;outil
                        </p>
                        <ul className="space-y-1">
                          {task.behavioral_metrics.map((m, mi) => (
                            <li key={mi} className="flex gap-2 text-violet-900 text-xs">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Débrief — questions de clôture après les tâches */}
      {debriefSections.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Questions de clôture
            </h3>
            <div className="space-y-3">
              {debriefSections.map((section, i) => (
                <SectionCard
                  key={i}
                  section={section}
                  questionOffset={debriefOffsets[i]}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Guide observateur */}
      {protocol.observer_guide && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Guide observateur
            </h3>
            <Card>
              <CardContent className="pt-4 pb-4">
                <FormattedText text={protocol.observer_guide} />
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
              <CardContent className="pt-4 pb-4">
                <FormattedText text={protocol.consent_note} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
