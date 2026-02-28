"use client";

import { useState } from "react";
import { Protocol, ProtocolFormValues, StudyType } from "@/lib/types/protocol";
import { ExploratoryProtocol, ExploratoryFormValues } from "@/lib/types/exploratory";
import { Survey, SurveyFormValues } from "@/lib/types/survey";
import { ModeratedProtocol, ModeratedFormValues } from "@/lib/types/moderated";
import { UnmoderatedProtocol, UnmoderatedFormValues } from "@/lib/types/unmoderated";
import { Brief } from "@/lib/types/brief";
import { ProtocolForm } from "@/components/tools/ProtocolForm";
import { ProtocolPreview } from "@/components/tools/ProtocolPreview";
import { ExploratoryForm } from "@/components/tools/ExploratoryForm";
import { ExploratoryPreview } from "@/components/tools/ExploratoryPreview";
import { SurveyForm } from "@/components/tools/SurveyForm";
import { SurveyPreview } from "@/components/tools/SurveyPreview";
import { ModeratedForm } from "@/components/tools/ModeratedForm";
import { ModeratedPreview } from "@/components/tools/ModeratedPreview";
import { UnmoderatedForm } from "@/components/tools/UnmoderatedForm";
import { UnmoderatedPreview } from "@/components/tools/UnmoderatedPreview";
import { BriefPreview } from "@/components/tools/BriefPreview";
import { BriefContextForm, BriefContext } from "@/components/tools/BriefContextForm";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ─────────────────────────────────────────────────────────────────

type AnyResult = Protocol | ExploratoryProtocol | Survey | ModeratedProtocol | UnmoderatedProtocol;
type AnyFormValues = ProtocolFormValues | ExploratoryFormValues | SurveyFormValues | ModeratedFormValues | UnmoderatedFormValues;
type PageState = "idle" | "streaming" | "done" | "error";

const STUDY_TYPE_OPTIONS: { value: StudyType; label: string }[] = [
  { value: "exploratory_interview", label: "Entretien exploratoire" },
  { value: "moderated_usability", label: "Test d'utilisabilité modéré" },
  { value: "unmoderated_usability", label: "Test d'utilisabilité non-modéré" },
  { value: "survey", label: "Sondage / Survey" },
  // diary_study: désactivé — à finaliser dans une prochaine itération
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ProtocolGeneratorPage() {
  const [studyType, setStudyType] = useState<StudyType>("exploratory_interview");
  const [pageState, setPageState] = useState<PageState>("idle");
  const [streamBuffer, setStreamBuffer] = useState("");
  const [result, setResult] = useState<AnyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // ── Brief states ────────────────────────────────────────────────────────
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefState, setBriefState] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [briefStreamBuffer, setBriefStreamBuffer] = useState("");
  const [isExportingBrief, setIsExportingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [briefContextOpen, setBriefContextOpen] = useState(false);

  function handleTypeChange(newType: StudyType) {
    setStudyType(newType);
    setPageState("idle");
    setResult(null);
    setError(null);
    setStreamBuffer("");
    setBrief(null);
    setBriefState("idle");
    setBriefStreamBuffer("");
    setBriefError(null);
    setBriefContextOpen(false);
  }

  async function handleGenerate(values: AnyFormValues) {
    setPageState("streaming");
    setStreamBuffer("");
    setResult(null);
    setError(null);
    setBrief(null);
    setBriefState("idle");
    setBriefStreamBuffer("");
    setBriefError(null);
    setBriefContextOpen(false);

    try {
      const response = await fetch("/api/generate-protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Erreur ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Impossible de lire le flux de réponse");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (chunk.includes("__ERROR__:")) {
          const msg = chunk.split("__ERROR__:")[1] ?? "Erreur inconnue";
          throw new Error(msg);
        }

        accumulated += chunk;
        setStreamBuffer(accumulated);
      }

      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Aucun JSON trouvé dans la réponse");

      let parsed: AnyResult;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`JSON invalide reçu : ${msg}. Réessaie.`);
      }

      setResult(parsed);
      setPageState("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(message);
      setPageState("error");
    }
  }

  async function handleExport() {
    if (!result) return;
    setIsExporting(true);
    try {
      const response = await fetch("/api/export-protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol: result }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.study_type}-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur d'export";
      alert(message);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleGenerateBrief(context: BriefContext) {
    if (!result) return;
    setBriefContextOpen(false);
    setBriefState("streaming");
    setBriefStreamBuffer("");
    setBrief(null);
    setBriefError(null);

    try {
      const response = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol: result, briefContext: context }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Erreur ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Impossible de lire le flux de réponse");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        if (chunk.includes("__ERROR__:")) {
          const msg = chunk.split("__ERROR__:")[1] ?? "Erreur inconnue";
          throw new Error(msg);
        }

        accumulated += chunk;
        setBriefStreamBuffer(accumulated);
      }

      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Aucun JSON trouvé dans la réponse");

      let parsed: Brief;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`JSON invalide reçu : ${msg}. Réessaie.`);
      }

      setBrief(parsed);
      setBriefState("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      setBriefError(message);
      setBriefState("error");
    }
  }

  async function handleExportBrief() {
    if (!brief) return;
    setIsExportingBrief(true);
    try {
      const response = await fetch("/api/export-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `brief-${brief.project_title.slice(0, 40).replace(/\s+/g, "-")}-${Date.now()}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur d'export";
      alert(message);
    } finally {
      setIsExportingBrief(false);
    }
  }

  const isLoading = pageState === "streaming";
  const isExploratory = studyType === "exploratory_interview";
  const isSurvey = studyType === "survey";
  const isModerated = studyType === "moderated_usability";
  const isUnmoderated = studyType === "unmoderated_usability";

  // Determine which preview to show — based on active study type or received result
  const activeStudyType = result?.study_type ?? studyType;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Générateur de protocole</h1>
        <p className="text-muted-foreground mt-1">
          Remplissez le formulaire pour générer un protocole d&apos;étude UX complet et structuré.
        </p>
      </div>

      {/* Study type selector */}
      <div className="mb-6">
        <label className="text-sm font-medium block mb-1.5">Type d&apos;étude</label>
        <Select
          value={studyType}
          onValueChange={(v) => handleTypeChange(v as StudyType)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STUDY_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Formulaire */}
        <div className="sticky top-6">
          {isExploratory ? (
            <ExploratoryForm onSubmit={handleGenerate} isLoading={isLoading} />
          ) : isSurvey ? (
            <SurveyForm onSubmit={handleGenerate} isLoading={isLoading} />
          ) : isModerated ? (
            <ModeratedForm onSubmit={handleGenerate} isLoading={isLoading} />
          ) : isUnmoderated ? (
            <UnmoderatedForm onSubmit={handleGenerate} isLoading={isLoading} />
          ) : (
            <ProtocolForm
              studyType={studyType as Exclude<StudyType, "exploratory_interview">}
              onSubmit={handleGenerate}
              isLoading={isLoading}
            />
          )}

          {pageState === "error" && error && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <strong>Erreur :</strong> {error}
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          {/* "Créer le brief" button — shown only when protocol is done */}
          {pageState === "done" && (
            <div className="mb-4">
              {briefContextOpen ? (
                <BriefContextForm
                  onSubmit={handleGenerateBrief}
                  onCancel={() => setBriefContextOpen(false)}
                />
              ) : (
                <Button
                  onClick={() => setBriefContextOpen(true)}
                  disabled={briefState === "streaming"}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  {briefState === "streaming"
                    ? "Génération du brief…"
                    : "Créer le brief stakeholders"}
                </Button>
              )}
            </div>
          )}

          {pageState === "idle" ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed text-muted-foreground text-sm">
              <span className="text-4xl mb-3">📋</span>
              <p>Le protocole généré apparaîtra ici</p>
            </div>
          ) : (
            <>
              <Separator className="lg:hidden mb-6" />

              {activeStudyType === "exploratory_interview" ? (
                <ExploratoryPreview
                  protocol={result?.study_type === "exploratory_interview"
                    ? (result as ExploratoryProtocol)
                    : null}
                  isStreaming={pageState === "streaming"}
                  streamBuffer={streamBuffer}
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              ) : activeStudyType === "survey" ? (
                <SurveyPreview
                  survey={result?.study_type === "survey" ? (result as Survey) : null}
                  isStreaming={pageState === "streaming"}
                  streamBuffer={streamBuffer}
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              ) : activeStudyType === "moderated_usability" ? (
                <ModeratedPreview
                  protocol={result?.study_type === "moderated_usability"
                    ? (result as ModeratedProtocol)
                    : null}
                  isStreaming={pageState === "streaming"}
                  streamBuffer={streamBuffer}
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              ) : activeStudyType === "unmoderated_usability" ? (
                <UnmoderatedPreview
                  protocol={result?.study_type === "unmoderated_usability"
                    ? (result as UnmoderatedProtocol)
                    : null}
                  isStreaming={pageState === "streaming"}
                  streamBuffer={streamBuffer}
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              ) : (
                <ProtocolPreview
                  protocol={result as Protocol | null}
                  isStreaming={pageState === "streaming"}
                  streamBuffer={streamBuffer}
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Brief section — full width, below the 2-column grid */}
      {briefState !== "idle" && (
        <div className="mt-10">
          <Separator className="mb-6" />
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-semibold">Brief stakeholders</h2>
          </div>

          {briefState === "error" && briefError && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <strong>Erreur :</strong> {briefError}
            </div>
          )}

          <BriefPreview
            brief={brief}
            isStreaming={briefState === "streaming"}
            streamBuffer={briefStreamBuffer}
            onExport={handleExportBrief}
            isExporting={isExportingBrief}
          />
        </div>
      )}
    </div>
  );
}
