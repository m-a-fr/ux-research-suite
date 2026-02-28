import React from "react";
import { Document, Page, View, Text, renderToBuffer } from "@react-pdf/renderer";
import { Brief, BriefSlide } from "@/lib/types/brief";

// ─── HTML → text lines (copied from pptx-brief.ts) ─────────────────────────

function htmlToLines(html: string): string[] {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 4)
    .slice(0, 7);
}

// ─── Design tokens ──────────────────────────────────────────────────────────

const DARK  = "#171717";
const BLUE  = "#4D91E0";
const TEXT  = "#1F2937";
const MUTED = "#6B7280";
const WHITE = "#FFFFFF";
const LIGHT_BDR = "#E2E8F0";
const DARK_BDR  = "#2D2D2D";

const ACCENTS: Record<string, string> = {
  cover:        "#4D91E0",
  context:      "#64748B",
  objectives:   "#4D91E0",
  methodology:  "#6366F1",
  participants: "#0D9488",
  timeline:     "#4D91E0",
  deliverables: "#3D9A6F",
  insights:     "#5B52C7",
  next_steps:   "#4D91E0",
};

const BG_COLORS: Record<string, string> = {
  context:      "#F8FAFC",
  objectives:   "#F8FAFC",
  methodology:  "#FAFAFE",
  participants: "#F0FDFA",
  timeline:     "#F8FAFC",
  deliverables: "#F8FCFA",
  insights:     "#FAFAFE",
  next_steps:   "#F8FAFC",
};

// ─── Slide size: 720 × 405 pt (16:9) ───────────────────────────────────────

const SLIDE_SIZE: [number, number] = [720, 405];

// ─── Cover slide ────────────────────────────────────────────────────────────

function CoverSlide({ slide, brief }: { slide: BriefSlide; brief: Brief }) {
  const lines = htmlToLines(slide.html);

  return (
    <Page size={SLIDE_SIZE}>
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: DARK }}>
        {/* Left accent strip */}
        <View style={{ width: 8, backgroundColor: BLUE }} />

        {/* Main content area */}
        <View
          style={{
            flex: 1,
            paddingTop: 48,
            paddingLeft: 36,
            paddingRight: 48,
            paddingBottom: 24,
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: WHITE,
                marginBottom: 10,
              }}
            >
              {slide.title}
            </Text>
            {lines[0] && (
              <Text style={{ fontSize: 12, color: BLUE }}>
                {lines[0]}
              </Text>
            )}
          </View>

          {/* Additional lines as bullet list */}
          {lines.length > 1 && (
            <View style={{ marginTop: 20, gap: 6 }}>
              {lines.slice(1).map((line, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <Text style={{ fontSize: 9, color: BLUE, marginRight: 6, marginTop: 1 }}>▸</Text>
                  <Text style={{ fontSize: 9, color: "#C8D8EA", flex: 1 }}>{line}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={{ fontSize: 8.5, color: MUTED }}>{brief.generated_date}</Text>
        </View>
      </View>
    </Page>
  );
}

// ─── Content slide ───────────────────────────────────────────────────────────

function ContentSlide({ slide }: { slide: BriefSlide }) {
  const acc = ACCENTS[slide.type] ?? ACCENTS.context;
  const bg  = BG_COLORS[slide.type] ?? "#F8FAFC";
  const lines = htmlToLines(slide.html);
  const num = String(slide.slide_number).padStart(2, "0");

  return (
    <Page size={SLIDE_SIZE}>
      <View style={{ flex: 1, backgroundColor: bg }}>
        {/* Header bar */}
        <View
          style={{
            height: 34,
            backgroundColor: DARK,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Accent strip */}
          <View style={{ width: 5, backgroundColor: acc, alignSelf: "stretch" }} />
          {/* Slide number */}
          <Text
            style={{
              fontSize: 9,
              color: acc,
              fontFamily: "Courier",
              marginLeft: 8,
              marginRight: 6,
            }}
          >
            {num}
          </Text>
          {/* Divider */}
          <View
            style={{
              width: 1,
              height: 16,
              backgroundColor: DARK_BDR,
              marginRight: 8,
            }}
          />
          {/* Title */}
          <Text style={{ fontSize: 14, fontWeight: "bold", color: WHITE }}>
            {slide.title}
          </Text>
        </View>

        {/* Lines */}
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
          {lines.length === 0 ? null : lines.map((line, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: i < lines.length - 1 ? 0.5 : 0,
                borderBottomColor: LIGHT_BDR,
              }}
            >
              {/* Accent bar */}
              <View
                style={{
                  width: 3,
                  height: 18,
                  backgroundColor: acc,
                  borderRadius: 2,
                  marginRight: 12,
                }}
              />
              <Text style={{ fontSize: 11, color: TEXT, flex: 1 }}>{line}</Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateBriefPdf(brief: Brief): Promise<Buffer> {
  const doc = (
    <Document title={brief.project_title} author="User Research Suite">
      {brief.slides.map((slide) =>
        slide.type === "cover" ? (
          <CoverSlide key={slide.slide_number} slide={slide} brief={brief} />
        ) : (
          <ContentSlide key={slide.slide_number} slide={slide} />
        )
      )}
    </Document>
  );

  return Buffer.from(await renderToBuffer(doc));
}
