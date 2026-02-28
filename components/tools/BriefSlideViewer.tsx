"use client";

import { useState, useEffect, useCallback } from "react";
import { Brief } from "@/lib/types/brief";
import { Button } from "@/components/ui/button";

// ─── Sanitizer ──────────────────────────────────────────────────────────────
// Strips <script> tags and inline event handlers before rendering HTML from Claude.

function sanitize(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\s+on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "");
}

// ─── Component ─────────────────────────────────────────────────────────────

interface BriefSlideViewerProps {
  brief: Brief;
  onExport: () => void;
  isExporting: boolean;
  onReset?: () => void;
  onExportPdf?: () => void;
}

export function BriefSlideViewer({
  brief,
  onExport,
  isExporting,
  onReset,
  onExportPdf,
}: BriefSlideViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slides = brief.slides;
  const currentSlide = slides[currentIndex];

  const goToPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(slides.length - 1, i + 1));
  }, [slides.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "ArrowRight") goToNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  return (
    <div className="space-y-4">
      {/* 16:9 slide viewer */}
      <div
        className="relative w-full rounded-xl overflow-hidden shadow-2xl border"
        style={{ aspectRatio: "16/9" }}
      >
        <div
          className="absolute inset-0"
          dangerouslySetInnerHTML={{ __html: sanitize(currentSlide.html) }}
        />
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            aria-label="Slide précédente"
          >
            ←
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums min-w-[4.5rem] text-center">
            {currentIndex + 1} / {slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentIndex === slides.length - 1}
            aria-label="Slide suivante"
          >
            →
          </Button>
        </div>

        {/* Current slide title (desktop) */}
        <span className="text-sm text-muted-foreground truncate flex-1 text-center hidden sm:block">
          {currentSlide.title}
        </span>

        <div className="flex items-center gap-2">
          {onReset && (
            <Button onClick={onReset} variant="ghost" size="sm">
              Régénérer le brief
            </Button>
          )}
          {onExportPdf && (
            <Button onClick={onExportPdf} disabled={isExporting} variant="ghost" size="sm">
              {isExporting ? "…" : ".pdf"}
            </Button>
          )}
          <Button onClick={onExport} disabled={isExporting} variant="outline" size="sm">
            {isExporting ? "Export…" : "Télécharger .pptx"}
          </Button>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {slides.map((slide, i) => (
          <button
            key={slide.slide_number}
            onClick={() => setCurrentIndex(i)}
            className={`shrink-0 rounded border transition-all overflow-hidden ${
              i === currentIndex
                ? "border-primary ring-1 ring-primary"
                : "border-border opacity-50 hover:opacity-80"
            }`}
            style={{ width: 88, aspectRatio: "16/9", position: "relative" }}
            aria-label={`Slide ${i + 1}: ${slide.title}`}
            title={slide.title}
          >
            {/* Scaled-down slide preview */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "400%",
                height: "400%",
                transform: "scale(0.25)",
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
              dangerouslySetInnerHTML={{ __html: sanitize(slide.html) }}
            />
            {/* Slide number overlay */}
            <span
              style={{
                position: "absolute",
                bottom: 2,
                right: 4,
                fontSize: 8,
                color: "rgba(255,255,255,0.7)",
                background: "rgba(0,0,0,0.45)",
                borderRadius: 3,
                padding: "0 3px",
                lineHeight: "14px",
              }}
            >
              {i + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
