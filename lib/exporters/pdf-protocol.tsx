import React from "react";
import { Document, Page, View, Text, renderToBuffer } from "@react-pdf/renderer";
import { ExploratoryProtocol, ExploratorySection, ExploratoryTheme } from "@/lib/types/exploratory";
import { ModeratedProtocol, ModeratedSection, ModeratedTask } from "@/lib/types/moderated";
import {
  UnmoderatedProtocol,
  MonadicProtocol,
  ABProtocol,
  BenchmarkProtocol,
  UnmoderatedTask,
} from "@/lib/types/unmoderated";
import { Survey, SurveyBlock, SurveyQuestion } from "@/lib/types/survey";
import { Protocol } from "@/lib/types/protocol";

type AnyProtocol = Protocol | ExploratoryProtocol | Survey | ModeratedProtocol | UnmoderatedProtocol;

// ─── Design tokens ──────────────────────────────────────────────────────────

const DARK   = "#171717";
const BLUE   = "#4D91E0";
const TEXT   = "#1F2937";
const MUTED  = "#6B7280";
const WHITE  = "#FFFFFF";
const LIGHT  = "#F8FAFC";
const SCRIPT_BG = "#F1F5F9";
const TIP_BG    = "#FFFBEB";
const TIP_BORDER = "#FCD34D";
const HDR_ACCENT = "#4D91E0";

// ─── Shared primitives ───────────────────────────────────────────────────────

function SectionHeader({ title, accent = HDR_ACCENT }: { title: string; accent?: string }) {
  return (
    <View
      style={{
        backgroundColor: DARK,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 7,
        paddingHorizontal: 12,
        marginBottom: 8,
        marginTop: 14,
      }}
      wrap={false}
    >
      <View style={{ width: 4, backgroundColor: accent, alignSelf: "stretch", marginRight: 10 }} />
      <Text style={{ fontSize: 12, fontWeight: "bold", color: WHITE }}>{title}</Text>
    </View>
  );
}

function ScriptBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View
      style={{
        backgroundColor: SCRIPT_BG,
        borderLeftWidth: 3,
        borderLeftColor: BLUE,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 8,
      }}
      wrap={false}
    >
      <Text style={{ fontSize: 9, color: TEXT, fontStyle: "italic", lineHeight: 1.5 }}>{text}</Text>
    </View>
  );
}

function BulletItem({ text, accent = BLUE }: { text: string; accent?: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 4, paddingLeft: 4 }} wrap={false}>
      <Text style={{ fontSize: 9, color: accent, marginRight: 6, marginTop: 1 }}>▌</Text>
      <Text style={{ fontSize: 9, color: TEXT, flex: 1, lineHeight: 1.4 }}>{text}</Text>
    </View>
  );
}

function TipText({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View
      style={{
        backgroundColor: TIP_BG,
        borderWidth: 0.5,
        borderColor: TIP_BORDER,
        borderRadius: 3,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginTop: 4,
        marginBottom: 6,
      }}
      wrap={false}
    >
      <Text style={{ fontSize: 8.5, color: "#92400E", fontStyle: "italic" }}>↪ {text}</Text>
    </View>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 8,
        fontWeight: "bold",
        color: MUTED,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
        marginTop: 8,
      }}
    >
      {children}
    </Text>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 3 }}>
      <Text style={{ fontSize: 9, color: MUTED, width: 110 }}>{label}</Text>
      <Text style={{ fontSize: 9, color: TEXT, flex: 1 }}>{value}</Text>
    </View>
  );
}

// ─── Cover page ─────────────────────────────────────────────────────────────

function CoverPage({
  title,
  studyTypeLabel,
  date,
  meta,
}: {
  title: string;
  studyTypeLabel: string;
  date: string;
  meta?: { label: string; value: string }[];
}) {
  return (
    <Page size="A4">
      <View style={{ flex: 1, flexDirection: "row", backgroundColor: DARK }}>
        {/* Left accent strip */}
        <View style={{ width: 8, backgroundColor: BLUE }} />

        {/* Content */}
        <View
          style={{
            flex: 1,
            paddingTop: 72,
            paddingLeft: 48,
            paddingRight: 64,
            paddingBottom: 40,
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text style={{ fontSize: 10, color: BLUE, marginBottom: 16, letterSpacing: 1 }}>
              PROTOCOLE D&apos;ÉTUDE UX
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: WHITE,
                lineHeight: 1.3,
                marginBottom: 16,
              }}
            >
              {title}
            </Text>
            <Text style={{ fontSize: 13, color: BLUE, marginBottom: 32 }}>
              {studyTypeLabel}
            </Text>

            {meta && meta.length > 0 && (
              <View
                style={{
                  borderTopWidth: 0.5,
                  borderTopColor: "#2D2D2D",
                  paddingTop: 20,
                }}
              >
                {meta.map((m, i) => (
                  <MetaRow key={i} label={m.label} value={m.value} />
                ))}
              </View>
            )}
          </View>

          <View>
            <View style={{ height: 0.5, backgroundColor: "#2D2D2D", marginBottom: 12 }} />
            <Text style={{ fontSize: 9, color: MUTED }}>Généré le {date} · User Research Suite</Text>
          </View>
        </View>
      </View>
    </Page>
  );
}

// ─── Content page wrapper ────────────────────────────────────────────────────

function ContentPage({ children }: { children: React.ReactNode }) {
  return (
    <Page size="A4" style={{ backgroundColor: LIGHT, paddingHorizontal: 36, paddingVertical: 32 }}>
      {children}
    </Page>
  );
}

// ─── Exploratory ─────────────────────────────────────────────────────────────

function ExploratoryThemeView({ theme, index }: { theme: ExploratoryTheme; index: number }) {
  return (
    <View style={{ marginBottom: 8 }} wrap={false}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        <Text style={{ fontSize: 9, color: MUTED, marginRight: 6 }}>Thème {index + 1}</Text>
        <Text style={{ fontSize: 10, fontWeight: "bold", color: TEXT, flex: 1 }}>{theme.theme}</Text>
        {theme.sensitive && (
          <Text style={{ fontSize: 8, color: "#B45309", marginLeft: 4 }}>⚠ Sensible</Text>
        )}
      </View>
      <Label>Question d&apos;ouverture</Label>
      <Text style={{ fontSize: 9, color: TEXT, marginBottom: 4, lineHeight: 1.4 }}>
        {theme.opening_question}
      </Text>
      {theme.probes.length > 0 && (
        <>
          <Label>Relances</Label>
          {theme.probes.map((p, i) => (
            <BulletItem key={i} text={p} />
          ))}
        </>
      )}
    </View>
  );
}

function ExploratorySectionView({ section }: { section: ExploratorySection }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: "bold", color: TEXT }}>{section.title}</Text>
        <Text style={{ fontSize: 8.5, color: MUTED }}>{section.duration_minutes} min</Text>
      </View>
      {section.script ? <ScriptBox text={section.script} /> : null}
      {section.themes?.length > 0 && (
        <View style={{ paddingLeft: 8 }}>
          {section.themes.map((theme, i) => (
            <ExploratoryThemeView key={i} theme={theme} index={i} />
          ))}
        </View>
      )}
      {section.transition_note ? <TipText text={section.transition_note} /> : null}
    </View>
  );
}

function ExploratoryContent({ protocol }: { protocol: ExploratoryProtocol }) {
  const styleLabel =
    protocol.interview_style === "semi_directive" ? "Semi-directif" : "Non-directif";

  return (
    <>
      <CoverPage
        title={protocol.title}
        studyTypeLabel="Entretien exploratoire"
        date={new Date().toLocaleDateString("fr-FR")}
        meta={[
          { label: "Style", value: styleLabel },
          { label: "Durée", value: `${protocol.duration_minutes} min` },
        ]}
      />
      <ContentPage>
        <SectionHeader title="Guide d&apos;entretien" />
        {protocol.sections.map((section, i) => (
          <ExploratorySectionView key={i} section={section} />
        ))}

        {protocol.observer_guide && (
          <>
            <SectionHeader title="Guide observateur" />
            <ScriptBox text={protocol.observer_guide} />
          </>
        )}

        {protocol.materials_needed?.length > 0 && (
          <>
            <SectionHeader title="Matériels nécessaires" />
            {protocol.materials_needed.map((m, i) => (
              <BulletItem key={i} text={m} />
            ))}
          </>
        )}

        {protocol.consent_note && (
          <>
            <SectionHeader title="Note de consentement" />
            <ScriptBox text={protocol.consent_note} />
          </>
        )}
      </ContentPage>
    </>
  );
}

// ─── Moderated ───────────────────────────────────────────────────────────────

function ModeratedSectionView({ section }: { section: ModeratedSection }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: "bold", color: TEXT }}>{section.title}</Text>
        <Text style={{ fontSize: 8.5, color: MUTED }}>{section.duration_minutes} min</Text>
      </View>
      {section.script ? <ScriptBox text={section.script} /> : null}
      {section.questions?.length > 0 && (
        <>
          <Label>Questions</Label>
          {section.questions.map((q, i) => (
            <BulletItem key={i} text={typeof q === "string" ? q : (q as { text: string }).text} />
          ))}
        </>
      )}
      {section.tips ? <TipText text={section.tips} /> : null}
    </View>
  );
}

function ModeratedTaskView({ task }: { task: ModeratedTask }) {
  return (
    <View style={{ marginBottom: 14, borderWidth: 0.5, borderColor: "#E2E8F0", borderRadius: 4, padding: 10 }} wrap={false}>
      <Text style={{ fontSize: 10, fontWeight: "bold", color: TEXT, marginBottom: 4 }}>
        Tâche {task.task_number} — {task.task}
      </Text>
      <Label>Scénario</Label>
      <Text style={{ fontSize: 9, color: TEXT, lineHeight: 1.4, marginBottom: 4 }}>{task.scenario}</Text>
      <Label>Critère de succès</Label>
      <Text style={{ fontSize: 9, color: TEXT, marginBottom: 4 }}>{task.success_criteria}</Text>

      {task.observer_cues?.length > 0 && (
        <>
          <Label>Signaux comportementaux</Label>
          {task.observer_cues.map((c, i) => (
            <BulletItem key={i} text={c} accent="#6B7280" />
          ))}
        </>
      )}

      {task.probe_questions?.length > 0 && (
        <>
          <Label>Questions conditionnelles</Label>
          {task.probe_questions.map((pq, i) => (
            <View key={i} style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 8.5, color: MUTED, fontStyle: "italic" }}>
                Si : {pq.condition}
              </Text>
              <Text style={{ fontSize: 9, color: TEXT, paddingLeft: 8 }}>→ {pq.question}</Text>
            </View>
          ))}
        </>
      )}

      {task.post_task_questions?.length > 0 && (
        <>
          <Label>Questions post-tâche</Label>
          {task.post_task_questions.map((q, i) => (
            <BulletItem key={i} text={typeof q === "string" ? q : (q as { text: string }).text} />
          ))}
        </>
      )}
    </View>
  );
}

function ModeratedContent({ protocol }: { protocol: ModeratedProtocol }) {
  const fidelityLabel: Record<string, string> = {
    live_product: "Produit live",
    prototype_hifi: "Prototype hi-fi",
    prototype_lowfi: "Prototype lo-fi",
  };
  const thinkAloudLabel: Record<string, string> = {
    concurrent: "Concurrent",
    retrospective: "Rétrospectif",
    none: "Sans think-aloud",
  };

  return (
    <>
      <CoverPage
        title={protocol.title}
        studyTypeLabel="Test d&apos;utilisabilité modéré"
        date={new Date().toLocaleDateString("fr-FR")}
        meta={[
          { label: "Produit", value: protocol.product_name },
          { label: "Plateforme", value: protocol.platform },
          { label: "Fidélité", value: fidelityLabel[protocol.fidelity] ?? protocol.fidelity },
          { label: "Think-aloud", value: thinkAloudLabel[protocol.think_aloud] ?? protocol.think_aloud },
          { label: "Durée", value: `${protocol.duration_minutes} min` },
        ]}
      />
      <ContentPage>
        <SectionHeader title="Sections du protocole" />
        {protocol.sections.map((section, i) => (
          <ModeratedSectionView key={i} section={section} />
        ))}

        {protocol.tasks?.length > 0 && (
          <>
            <SectionHeader title="Tâches utilisateur" />
            {protocol.tasks.map((task, i) => (
              <ModeratedTaskView key={i} task={task} />
            ))}
          </>
        )}

        {protocol.observer_guide && (
          <>
            <SectionHeader title="Guide observateur" />
            <ScriptBox text={protocol.observer_guide} />
          </>
        )}

        {protocol.materials_needed?.length > 0 && (
          <>
            <SectionHeader title="Matériels nécessaires" />
            {protocol.materials_needed.map((m, i) => (
              <BulletItem key={i} text={m} />
            ))}
          </>
        )}

        {protocol.consent_note && (
          <>
            <SectionHeader title="Note de consentement" />
            <ScriptBox text={protocol.consent_note} />
          </>
        )}
      </ContentPage>
    </>
  );
}

// ─── Unmoderated ─────────────────────────────────────────────────────────────

function UnmoderatedTaskView({ task }: { task: UnmoderatedTask }) {
  return (
    <View style={{ marginBottom: 12, borderWidth: 0.5, borderColor: "#E2E8F0", borderRadius: 4, padding: 10 }} wrap={false}>
      <Text style={{ fontSize: 10, fontWeight: "bold", color: TEXT, marginBottom: 4 }}>
        Tâche {task.task_number} — {task.task_title}
      </Text>
      <ScriptBox text={task.screen_text} />
      {task.starting_url && (
        <Text style={{ fontSize: 8.5, color: BLUE, marginBottom: 4 }}>
          URL de départ : {task.starting_url}
        </Text>
      )}
      <Label>Critère de succès</Label>
      <Text style={{ fontSize: 9, color: TEXT, marginBottom: 4 }}>{task.success_criteria}</Text>
      {task.automated_metrics?.length > 0 && (
        <>
          <Label>Métriques automatiques</Label>
          <Text style={{ fontSize: 8.5, color: MUTED }}>{task.automated_metrics.join(", ")}</Text>
        </>
      )}
      {task.post_task_questions?.length > 0 && (
        <>
          <Label>Questions post-tâche</Label>
          {task.post_task_questions.map((q, i) => (
            <BulletItem key={i} text={q.text} />
          ))}
        </>
      )}
    </View>
  );
}

function MonadicContent({ protocol }: { protocol: MonadicProtocol }) {
  return (
    <>
      <CoverPage
        title={protocol.title}
        studyTypeLabel="Test non-modéré — Monadic"
        date={new Date().toLocaleDateString("fr-FR")}
        meta={[
          { label: "Produit", value: protocol.product_name },
          { label: "Plateforme", value: protocol.platform },
          { label: "Outil", value: protocol.tool },
          { label: "Durée estimée", value: `${protocol.estimated_duration_minutes} min` },
        ]}
      />
      <ContentPage>
        <SectionHeader title="Bloc d&apos;accueil" />
        <ScriptBox text={protocol.welcome_block?.screen_text ?? ""} />

        <SectionHeader title="Tâches" />
        {protocol.tasks.map((task, i) => (
          <UnmoderatedTaskView key={i} task={task} />
        ))}

        <SectionHeader title="Bloc de clôture" />
        <ScriptBox text={protocol.closing_block?.screen_text ?? ""} />

        {protocol.screener_questions?.length > 0 && (
          <>
            <SectionHeader title="Questions de screening" />
            {protocol.screener_questions.map((q, i) => (
              <BulletItem key={i} text={q} />
            ))}
          </>
        )}

        {protocol.analysis_guide && (
          <>
            <SectionHeader title="Guide d&apos;analyse" />
            <ScriptBox text={protocol.analysis_guide} />
          </>
        )}
      </ContentPage>
    </>
  );
}

function ABContent({ protocol }: { protocol: ABProtocol }) {
  return (
    <>
      <CoverPage
        title={protocol.title}
        studyTypeLabel={`Test non-modéré — A/B (${protocol.ab_design === "within" ? "within-subjects" : "between-subjects"})`}
        date={new Date().toLocaleDateString("fr-FR")}
        meta={[
          { label: "Plateforme", value: protocol.platform },
          { label: "Outil", value: protocol.tool },
          { label: "Contrepartie", value: protocol.counterbalancing ? "Oui" : "Non" },
          { label: "Durée estimée", value: `${protocol.estimated_duration_minutes} min` },
        ]}
      />
      <ContentPage>
        <SectionHeader title="Bloc d&apos;accueil" />
        <ScriptBox text={protocol.welcome_block?.screen_text ?? ""} />

        {protocol.variants.map((variant, vi) => (
          <View key={vi}>
            <SectionHeader title={`Variante ${variant.label} — ${variant.product_name}`} />
            {variant.tasks.map((task, i) => (
              <UnmoderatedTaskView key={i} task={task} />
            ))}
          </View>
        ))}

        {protocol.comparison_questions?.length > 0 && (
          <>
            <SectionHeader title="Questions de comparaison" />
            {protocol.comparison_questions.map((q, i) => (
              <BulletItem key={i} text={q.text} />
            ))}
          </>
        )}

        <SectionHeader title="Bloc de clôture" />
        <ScriptBox text={protocol.closing_block?.screen_text ?? ""} />

        {protocol.screener_questions?.length > 0 && (
          <>
            <SectionHeader title="Questions de screening" />
            {protocol.screener_questions.map((q, i) => (
              <BulletItem key={i} text={q} />
            ))}
          </>
        )}

        {protocol.analysis_guide && (
          <>
            <SectionHeader title="Guide d&apos;analyse" />
            <ScriptBox text={protocol.analysis_guide} />
          </>
        )}
      </ContentPage>
    </>
  );
}

function BenchmarkContent({ protocol }: { protocol: BenchmarkProtocol }) {
  return (
    <>
      <CoverPage
        title={protocol.title}
        studyTypeLabel={`Benchmark ${protocol.benchmark_type === "competitive" ? "concurrentiel" : "interne"}`}
        date={new Date().toLocaleDateString("fr-FR")}
        meta={[
          { label: "Plateforme", value: protocol.platform },
          { label: "Outil", value: protocol.tool },
          { label: "Échelles", value: protocol.standard_scales?.join(", ") ?? "" },
          { label: "Durée estimée", value: `${protocol.estimated_duration_minutes} min` },
        ]}
      />
      <ContentPage>
        {protocol.benchmark_context && (
          <>
            <SectionHeader title="Contexte" />
            <ScriptBox text={protocol.benchmark_context} />
          </>
        )}

        <SectionHeader title="Bloc d&apos;accueil" />
        <ScriptBox text={protocol.welcome_block?.screen_text ?? ""} />

        {protocol.products.map((product, pi) => (
          <View key={pi}>
            <SectionHeader
              title={`${product.name} (${product.role === "our_product" ? "Notre produit" : product.role === "competitor" ? "Concurrent" : "Version précédente"})`}
              accent={product.role === "our_product" ? "#4D91E0" : product.role === "competitor" ? "#6366F1" : "#6B7280"}
            />
            {product.tasks.map((task, i) => (
              <UnmoderatedTaskView key={i} task={task} />
            ))}
            {product.post_product_questions?.length > 0 && (
              <>
                <Label>Questions post-produit</Label>
                {product.post_product_questions.map((q, i) => (
                  <BulletItem key={i} text={q.text} />
                ))}
              </>
            )}
          </View>
        ))}

        <SectionHeader title="Bloc de clôture" />
        <ScriptBox text={protocol.closing_block?.screen_text ?? ""} />

        {protocol.screener_questions?.length > 0 && (
          <>
            <SectionHeader title="Questions de screening" />
            {protocol.screener_questions.map((q, i) => (
              <BulletItem key={i} text={q} />
            ))}
          </>
        )}

        {protocol.analysis_guide && (
          <>
            <SectionHeader title="Guide d&apos;analyse" />
            <ScriptBox text={protocol.analysis_guide} />
          </>
        )}
      </ContentPage>
    </>
  );
}

function UnmoderatedContent({ protocol }: { protocol: UnmoderatedProtocol }) {
  if (protocol.test_design === "monadic") return <MonadicContent protocol={protocol as MonadicProtocol} />;
  if (protocol.test_design === "ab") return <ABContent protocol={protocol as ABProtocol} />;
  if (protocol.test_design === "benchmark") return <BenchmarkContent protocol={protocol as BenchmarkProtocol} />;
  return null;
}

// ─── Survey ──────────────────────────────────────────────────────────────────

function SurveyBlockView({ block }: { block: SurveyBlock }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: "bold", color: TEXT, marginBottom: 6 }}>
        {block.title}
      </Text>
      {block.description && (
        <Text style={{ fontSize: 8.5, color: MUTED, marginBottom: 6 }}>{block.description}</Text>
      )}
      {block.questions.map((q: SurveyQuestion, i: number) => (
        <View key={i} style={{ marginBottom: 8, paddingLeft: 8 }} wrap={false}>
          <View style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ fontSize: 9, color: BLUE, marginRight: 4 }}>{i + 1}.</Text>
            <Text style={{ fontSize: 9, color: TEXT, flex: 1, lineHeight: 1.4 }}>{q.text}</Text>
          </View>
          <Text style={{ fontSize: 8, color: MUTED, paddingLeft: 12 }}>
            {q.type}{q.required ? " · Obligatoire" : ""}
          </Text>
          {q.options && q.options.length > 0 && (
            <View style={{ paddingLeft: 12, marginTop: 2 }}>
              {q.options.map((opt, oi) => (
                <Text key={oi} style={{ fontSize: 8, color: MUTED }}>○ {opt}</Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function SurveyContent({ survey }: { survey: Survey }) {
  return (
    <>
      <CoverPage
        title={survey.title}
        studyTypeLabel="Sondage / Survey"
        date={new Date().toLocaleDateString("fr-FR")}
        meta={[
          { label: "Durée estimée", value: `${survey.estimated_completion_minutes} min` },
          { label: "Canal", value: survey.distribution_channel ?? "" },
        ]}
      />
      <ContentPage>
        {survey.blocks.map((block, i) => (
          <View key={i}>
            <SectionHeader title={block.title} />
            <SurveyBlockView block={block} />
          </View>
        ))}

        {survey.consent_note && (
          <>
            <SectionHeader title="Note de consentement" />
            <ScriptBox text={survey.consent_note} />
          </>
        )}
      </ContentPage>
    </>
  );
}

// ─── Generic fallback ────────────────────────────────────────────────────────

function GenericContent({ protocol }: { protocol: Protocol }) {
  return (
    <>
      <CoverPage
        title={protocol.title}
        studyTypeLabel={protocol.study_type}
        date={new Date().toLocaleDateString("fr-FR")}
        meta={[{ label: "Durée", value: `${protocol.duration_minutes} min` }]}
      />
      <ContentPage>
        {protocol.sections?.map((section, i) => (
          <View key={i} style={{ marginBottom: 14 }}>
            <SectionHeader title={section.title} />
            {section.script ? <ScriptBox text={section.script} /> : null}
            {section.questions?.map((q, qi) => (
              <BulletItem key={qi} text={q.text} />
            ))}
            {section.tips ? <TipText text={section.tips} /> : null}
          </View>
        ))}
      </ContentPage>
    </>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generateProtocolPdf(protocol: AnyProtocol): Promise<Buffer> {
  let content: React.ReactNode;

  if (protocol.study_type === "exploratory_interview") {
    content = <ExploratoryContent protocol={protocol as ExploratoryProtocol} />;
  } else if (protocol.study_type === "moderated_usability") {
    content = <ModeratedContent protocol={protocol as ModeratedProtocol} />;
  } else if (protocol.study_type === "unmoderated_usability") {
    content = <UnmoderatedContent protocol={protocol as UnmoderatedProtocol} />;
  } else if (protocol.study_type === "survey") {
    content = <SurveyContent survey={protocol as Survey} />;
  } else {
    content = <GenericContent protocol={protocol as Protocol} />;
  }

  const doc = (
    <Document title={(protocol as { title: string }).title} author="User Research Suite">
      {content}
    </Document>
  );

  return Buffer.from(await renderToBuffer(doc));
}
