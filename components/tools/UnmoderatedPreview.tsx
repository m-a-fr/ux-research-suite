"use client";

import React from "react";
import {
  UnmoderatedProtocol,
  MonadicProtocol,
  ABProtocol,
  BenchmarkProtocol,
  UnmoderatedTask,
  UnmoderatedPostTaskQuestion,
  AutomatedMetric,
} from "@/lib/types/unmoderated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Streaming progress ────────────────────────────────────────────────────

const MONADIC_STAGES = [
  { id: "analyse", label: "Analyse des paramètres", sublabel: "Compréhension du contexte produit", marker: null, pct: 5 },
  { id: "titre", label: "Titre et méta-données", sublabel: "Nom, plateforme, outil", marker: '"title"', pct: 15 },
  { id: "welcome", label: "Bloc d'accueil", sublabel: "Introduction affichée par l'outil", marker: '"welcome_block"', pct: 28 },
  { id: "taches", label: "Script des tâches", sublabel: "Instructions écran, URL de départ", marker: '"tasks"', pct: 55 },
  { id: "questions", label: "Questions post-tâche", sublabel: "SEQ et métriques automatiques", marker: '"post_task_questions"', pct: 75 },
  { id: "closing", label: "Clôture & guide d'analyse", sublabel: "Message de fin, interprétation des données", marker: '"closing_block"', pct: 95 },
] as const;

const AB_STAGES = [
  { id: "analyse", label: "Analyse des paramètres", sublabel: "Design expérimental et variantes", marker: null, pct: 5 },
  { id: "titre", label: "Titre et méta-données", sublabel: "Design A/B, contrebalancement", marker: '"title"', pct: 15 },
  { id: "welcome", label: "Bloc d'accueil", sublabel: "Instructions neutres (sans révéler les variantes)", marker: '"welcome_block"', pct: 25 },
  { id: "variants", label: "Script des variantes", sublabel: "Tâches A et B avec scénarios identiques", marker: '"variants"', pct: 55 },
  { id: "comparison", label: "Questions de comparaison", sublabel: "Préférence et justification (within uniquement)", marker: '"comparison_questions"', pct: 80 },
  { id: "analyse_guide", label: "Guide d'analyse", sublabel: "Méthode statistique, interprétation", marker: '"analysis_guide"', pct: 95 },
] as const;

const BENCHMARK_STAGES = [
  { id: "analyse", label: "Analyse des paramètres", sublabel: "Produits, échelles normées, contexte", marker: null, pct: 5 },
  { id: "titre", label: "Titre et méta-données", sublabel: "Type de benchmark, standard_scales", marker: '"title"', pct: 12 },
  { id: "welcome", label: "Bloc d'accueil", sublabel: "Instructions neutres multi-produits", marker: '"welcome_block"', pct: 22 },
  { id: "products", label: "Produits et tâches", sublabel: "Tâches standardisées cross-produits", marker: '"products"', pct: 55 },
  { id: "scales", label: "Échelles normées", sublabel: "SUS, UMUX-Lite, SUPR-Q par produit", marker: '"post_product_questions"', pct: 78 },
  { id: "analyse_guide", label: "Guide d'analyse", sublabel: "Scoring SUS, positionnement relatif", marker: '"analysis_guide"', pct: 95 },
] as const;

type AnyStage = { id: string; label: string; sublabel: string; marker: string | null; pct: number };

function detectStage(buffer: string, stages: readonly AnyStage[]): number {
  for (let i = stages.length - 1; i >= 0; i--) {
    const m = stages[i].marker;
    if (m && buffer.includes(m)) return i;
  }
  return 0;
}

function StreamingProgress({ buffer, stages }: { buffer: string; stages: readonly AnyStage[] }) {
  const idx = detectStage(buffer, stages);
  const pct = stages[idx].pct;
  return (
    <div className="space-y-5">
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">Génération en cours…</span>
          <span className="text-xs text-muted-foreground">{pct} %</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <ol className="space-y-2">
        {stages.map((stage, i) => {
          const isDone = i < idx;
          const isCurrent = i === idx;
          return (
            <li key={stage.id} className="flex gap-3 items-start">
              <span className="mt-0.5 shrink-0">
                {isDone ? (
                  <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">✓</span>
                ) : isCurrent ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse block mt-1" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30 block mt-1.5" />
                )}
              </span>
              <div>
                <p className={`text-sm font-medium leading-tight ${isDone ? "text-muted-foreground line-through decoration-muted-foreground/40" : isCurrent ? "text-foreground" : "text-muted-foreground/50"}`}>
                  {stage.label}
                </p>
                {isCurrent && <p className="text-xs text-muted-foreground mt-0.5">{stage.sublabel}</p>}
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

// ─── Shared rendering helpers ──────────────────────────────────────────────

const METRIC_LABELS: Record<AutomatedMetric, string> = {
  completion_rate: "Taux de complétion",
  time_on_task: "Temps sur tâche",
  click_count: "Nombre de clics",
  misclick_rate: "Taux de misclicks",
  first_click: "1er clic",
  drop_off_point: "Point d'abandon",
  heatmap: "Heatmap",
  screen_recording: "Enregistrement écran",
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  seq: "SEQ (1–7)",
  likert_5: "Likert (1–5)",
  likert_7: "Likert (1–7)",
  nps: "NPS (0–10)",
  open_short: "Réponse libre",
  mcq_single: "QCM — choix unique",
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
  seq: "bg-blue-100 text-blue-800",
  likert_5: "bg-violet-100 text-violet-800",
  likert_7: "bg-violet-100 text-violet-800",
  nps: "bg-green-100 text-green-800",
  open_short: "bg-gray-100 text-gray-700",
  mcq_single: "bg-orange-100 text-orange-800",
};

const PLATFORM_LABELS: Record<string, string> = { web: "Web", mobile: "Mobile", desktop: "Desktop" };
const FIDELITY_LABELS: Record<string, string> = { live_product: "Produit live", prototype_hifi: "Prototype hi-fi", prototype_lowfi: "Prototype lo-fi" };

function QuestionRow({ q, index }: { q: UnmoderatedPostTaskQuestion; index: number }) {
  return (
    <div className="flex gap-3 items-start py-1.5">
      <span className="text-xs text-muted-foreground font-medium mt-0.5 shrink-0">{index + 1}.</span>
      <div className="flex-1 space-y-1">
        <p className="text-sm">{q.text}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${QUESTION_TYPE_COLORS[q.type] ?? "bg-gray-100 text-gray-700"} border-0 text-xs`}>
            {QUESTION_TYPE_LABELS[q.type] ?? q.type}
          </Badge>
          {q.scale_labels && (
            <span className="text-xs text-muted-foreground">{q.scale_labels.min} → {q.scale_labels.max}</span>
          )}
        </div>
        {q.options && q.options.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-0.5 pl-2 mt-1">
            {q.options.map((opt, i) => <li key={i}>○ {opt}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, compact = false }: { task: UnmoderatedTask; compact?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Tâche {task.task_number}</p>
            <CardTitle className="text-sm leading-snug">{task.task_title}</CardTitle>
          </div>
          <Badge className="bg-muted text-muted-foreground border border-border text-xs shrink-0">⏱ {task.time_limit_minutes} min</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Affiché au participant</p>
            <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">Vue participant</Badge>
          </div>
          <p className="bg-muted/40 rounded px-3 py-2 border-l-2 border-emerald-400 leading-relaxed text-sm">
            {task.screen_text}
          </p>
        </div>
        {task.starting_url && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">URL de départ</p>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{task.starting_url}</code>
          </div>
        )}
        {!compact && (
          <>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Critère de succès</p>
                <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">Interne</Badge>
              </div>
              <p>{task.success_criteria}</p>
            </div>
            {task.automated_metrics.length > 0 && (
              <div>
                <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Métriques automatiques</p>
                <div className="flex flex-wrap gap-1.5">
                  {task.automated_metrics.map((m) => (
                    <Badge key={m} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">{METRIC_LABELS[m] ?? m}</Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        {task.post_task_questions.length > 0 && (
          <div>
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">Questions post-tâche</p>
            <div className="divide-y divide-border">
              {task.post_task_questions.map((q, i) => <QuestionRow key={i} q={q} index={i} />)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScreenBlock({ title, screenText, label }: { title: string; screenText: string; label: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">{label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed bg-muted/40 rounded px-3 py-2 border-l-2 border-emerald-400">{screenText}</p>
      </CardContent>
    </Card>
  );
}

function HeaderMeta({ protocol, onExport, isExporting, extraBadges }: {
  protocol: { title: string; platform: string; fidelity: string; tool: string; estimated_duration_minutes: number };
  onExport: () => void;
  isExporting: boolean;
  extraBadges?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-xl font-semibold">{protocol.title}</h2>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">{PLATFORM_LABELS[protocol.platform] ?? protocol.platform}</Badge>
          <Badge className="bg-violet-100 text-violet-800 border-0 text-xs">{FIDELITY_LABELS[protocol.fidelity] ?? protocol.fidelity}</Badge>
          <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">{protocol.tool}</Badge>
          {extraBadges}
          <span className="text-xs text-muted-foreground">~{protocol.estimated_duration_minutes} min</span>
        </div>
      </div>
      <Button onClick={onExport} disabled={isExporting} variant="outline" size="sm">
        {isExporting ? "Export…" : "Télécharger .docx"}
      </Button>
    </div>
  );
}

// ─── Monadic view ──────────────────────────────────────────────────────────

function MonadicView({ protocol, onExport, isExporting }: { protocol: MonadicProtocol; onExport: () => void; isExporting: boolean }) {
  return (
    <div className="space-y-5">
      <HeaderMeta protocol={protocol} onExport={onExport} isExporting={isExporting} />
      <Separator />
      {protocol.screener_questions.length > 0 && (
        <>
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-2">Screener</h3>
            <ul className="space-y-1.5">
              {protocol.screener_questions.map((q, i) => (
                <li key={i} className="flex gap-2 text-sm"><span className="shrink-0 text-muted-foreground">{i + 1}.</span><span>{q}</span></li>
              ))}
            </ul>
          </div>
          <Separator />
        </>
      )}
      <div className="space-y-2">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Bloc d&apos;accueil</h3>
        <ScreenBlock title={protocol.welcome_block.title} screenText={protocol.welcome_block.screen_text} label="Vue participant" />
      </div>
      <Separator />
      <div className="space-y-3">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Tâches ({protocol.tasks.length})</h3>
        {protocol.tasks.map((task, i) => <TaskCard key={i} task={task} />)}
      </div>
      <Separator />
      <div className="space-y-2">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Bloc de clôture</h3>
        <ScreenBlock title={protocol.closing_block.title} screenText={protocol.closing_block.screen_text} label="Vue participant" />
      </div>
      {protocol.analysis_guide && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">Guide d&apos;analyse</h3>
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-4 text-sm leading-relaxed">{protocol.analysis_guide}</CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── A/B view ──────────────────────────────────────────────────────────────

function ABView({ protocol, onExport, isExporting }: { protocol: ABProtocol; onExport: () => void; isExporting: boolean }) {
  const isWithin = protocol.ab_design === "within";
  return (
    <div className="space-y-5">
      <HeaderMeta
        protocol={protocol}
        onExport={onExport}
        isExporting={isExporting}
        extraBadges={
          <>
            <Badge className={`border-0 text-xs ${isWithin ? "bg-indigo-100 text-indigo-800" : "bg-orange-100 text-orange-800"}`}>
              {isWithin ? "Within-subjects" : "Between-subjects"}
            </Badge>
            {protocol.counterbalancing && (
              <Badge className="bg-green-100 text-green-800 border-0 text-xs">Contrebalancé</Badge>
            )}
          </>
        }
      />
      <Separator />
      <div className="space-y-2">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Bloc d&apos;accueil</h3>
        <ScreenBlock title={protocol.welcome_block.title} screenText={protocol.welcome_block.screen_text} label="Vue participant" />
      </div>
      <Separator />
      <div className="space-y-4">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Variantes</h3>
        {protocol.variants.map((variant, vi) => (
          <div key={vi}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/10 text-primary border-0 text-sm font-bold px-3">{variant.label}</Badge>
              <span className="font-medium text-sm">{variant.product_name}</span>
              <span className="text-xs text-muted-foreground">— {variant.description}</span>
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-primary/20">
              {variant.tasks.map((task, ti) => <TaskCard key={ti} task={task} compact />)}
            </div>
          </div>
        ))}
      </div>
      {isWithin && protocol.comparison_questions.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-2">Questions de comparaison</h3>
            <Card>
              <CardContent className="pt-4 pb-2 divide-y divide-border">
                {protocol.comparison_questions.map((q, i) => <QuestionRow key={i} q={q} index={i} />)}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      {protocol.analysis_guide && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">Guide d&apos;analyse</h3>
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-4 text-sm leading-relaxed">{protocol.analysis_guide}</CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Benchmark view ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  our_product: "bg-blue-100 text-blue-800",
  competitor: "bg-orange-100 text-orange-800",
  previous_version: "bg-gray-100 text-gray-700",
};

const ROLE_LABELS: Record<string, string> = {
  our_product: "Notre produit",
  competitor: "Concurrent",
  previous_version: "Version précédente",
};

function BenchmarkView({ protocol, onExport, isExporting }: { protocol: BenchmarkProtocol; onExport: () => void; isExporting: boolean }) {
  return (
    <div className="space-y-5">
      <HeaderMeta
        protocol={protocol}
        onExport={onExport}
        isExporting={isExporting}
        extraBadges={
          <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">
            {protocol.benchmark_type === "internal" ? "Benchmark interne" : "Benchmark compétitif"}
          </Badge>
        }
      />
      {protocol.standard_scales.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Échelles :</span>
          {protocol.standard_scales.map((s) => (
            <Badge key={s} className="bg-violet-100 text-violet-800 border-0 text-xs">{s}</Badge>
          ))}
        </div>
      )}
      <Separator />
      <div className="space-y-2">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">Bloc d&apos;accueil</h3>
        <ScreenBlock title={protocol.welcome_block.title} screenText={protocol.welcome_block.screen_text} label="Vue participant" />
      </div>
      <Separator />
      <div className="space-y-5">
        <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
          Produits testés ({protocol.products.length})
        </h3>
        {protocol.products.map((product, pi) => (
          <div key={pi} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={`${ROLE_COLORS[product.role] ?? "bg-gray-100 text-gray-700"} border-0 text-xs`}>
                {ROLE_LABELS[product.role] ?? product.role}
              </Badge>
              <span className="font-semibold text-sm">{product.name}</span>
            </div>
            <div className="space-y-2 pl-2 border-l-2 border-border">
              {product.tasks.map((task, ti) => <TaskCard key={ti} task={task} compact />)}
            </div>
            {product.post_product_questions.length > 0 && (
              <div className="pl-2">
                <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Échelles normées après toutes les tâches
                </p>
                <Card>
                  <CardContent className="pt-3 pb-2 divide-y divide-border">
                    {product.post_product_questions.map((q, qi) => <QuestionRow key={qi} q={q} index={qi} />)}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ))}
      </div>
      {protocol.analysis_guide && (
        <>
          <Separator />
          <div>
            <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground mb-3">Guide d&apos;analyse</h3>
            <Card className="border-dashed">
              <CardContent className="pt-4 pb-4 text-sm leading-relaxed">{protocol.analysis_guide}</CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface UnmoderatedPreviewProps {
  protocol: UnmoderatedProtocol | null;
  isStreaming: boolean;
  streamBuffer: string;
  onExport: () => void;
  isExporting: boolean;
}

function getStages(buffer: string) {
  if (buffer.includes('"test_design": "ab"') || buffer.includes('"test_design":"ab"')) return AB_STAGES;
  if (buffer.includes('"test_design": "benchmark"') || buffer.includes('"test_design":"benchmark"')) return BENCHMARK_STAGES;
  return MONADIC_STAGES;
}

export function UnmoderatedPreview({ protocol, isStreaming, streamBuffer, onExport, isExporting }: UnmoderatedPreviewProps) {
  if (!isStreaming && !protocol) return null;

  if (isStreaming) {
    return <StreamingProgress buffer={streamBuffer} stages={getStages(streamBuffer)} />;
  }

  if (!protocol) return null;

  if (protocol.test_design === "ab") {
    return <ABView protocol={protocol} onExport={onExport} isExporting={isExporting} />;
  }
  if (protocol.test_design === "benchmark") {
    return <BenchmarkView protocol={protocol} onExport={onExport} isExporting={isExporting} />;
  }
  return <MonadicView protocol={protocol as MonadicProtocol} onExport={onExport} isExporting={isExporting} />;
}
