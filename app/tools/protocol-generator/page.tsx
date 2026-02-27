"use client";

import { useState } from "react";
import { Protocol, ProtocolFormValues } from "@/lib/types/protocol";
import { ProtocolForm } from "@/components/tools/ProtocolForm";
import { ProtocolPreview } from "@/components/tools/ProtocolPreview";
import { Separator } from "@/components/ui/separator";

type PageState = "idle" | "streaming" | "done" | "error";

export default function ProtocolGeneratorPage() {
  const [pageState, setPageState] = useState<PageState>("idle");
  const [streamBuffer, setStreamBuffer] = useState("");
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function handleGenerate(values: ProtocolFormValues) {
    setPageState("streaming");
    setStreamBuffer("");
    setProtocol(null);
    setError(null);

    try {
      const response = await fetch("/api/generate-protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? `Erreur ${response.status}`);
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

      // Parsing du JSON final
      let parsed: Protocol;
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Aucun JSON trouvé dans la réponse");
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`JSON invalide reçu de Claude : ${msg}. Réessaie — si le problème persiste, raccourcis l'objectif.`);
      }

      setProtocol(parsed);
      setPageState("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(message);
      setPageState("error");
    }
  }

  async function handleExport() {
    if (!protocol) return;
    setIsExporting(true);
    try {
      const response = await fetch("/api/export-protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ protocol }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `protocole-${protocol.study_type}-${Date.now()}.docx`;
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

  const isLoading = pageState === "streaming";

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Générateur de protocole</h1>
        <p className="text-muted-foreground mt-1">
          Remplissez le formulaire pour générer un protocole d&apos;étude UX complet et structuré.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Formulaire */}
        <div className="sticky top-6">
          <ProtocolForm onSubmit={handleGenerate} isLoading={isLoading} />

          {pageState === "error" && error && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <strong>Erreur :</strong> {error}
            </div>
          )}
        </div>

        {/* Preview */}
        <div>
          {pageState === "idle" ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed text-muted-foreground text-sm">
              <span className="text-4xl mb-3">📋</span>
              <p>Le protocole généré apparaîtra ici</p>
            </div>
          ) : (
            <>
              <Separator className="lg:hidden mb-6" />
              <ProtocolPreview
                protocol={protocol}
                isStreaming={pageState === "streaming"}
                streamBuffer={streamBuffer}
                onExport={handleExport}
                isExporting={isExporting}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
