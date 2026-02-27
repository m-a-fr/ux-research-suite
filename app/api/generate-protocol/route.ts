import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getSystemPrompt } from "@/lib/prompts";
import { StudyType } from "@/lib/types/protocol";

// ─── Body schemas ─────────────────────────────────────────────────────────

const exploratoryBodySchema = z.object({
  studyType: z.literal("exploratory_interview"),
  themes: z.string().min(5, "Les thèmes à explorer sont requis"),
  hypotheses: z.string().default(""),
  interview_style: z.enum(["semi_directive", "non_directive"]),
  sensitive_topics: z.string().default(""),
  audience: z.string().min(3, "L'audience est requise"),
  duration: z.number().int().min(15).max(480),
  participants: z.number().int().min(1).max(500),
});

const surveyBodySchema = z.object({
  studyType: z.literal("survey"),
  research_questions: z.string().min(10, "Décrivez les questions de recherche"),
  dimensions: z
    .array(z.enum(["satisfaction", "nps", "usability", "awareness", "friction", "other"]))
    .min(1),
  standard_scales: z.array(z.enum(["NPS", "SUS", "UMUX", "CSAT", "none"])).default([]),
  needs_screening: z.boolean(),
  screening_criteria: z.string().default(""),
  target_duration: z.enum(["under_5", "5_to_10", "10_to_15"]),
  distribution_channel: z.enum(["email", "in_app", "qr_intercept", "external_panel"]),
  audience: z.string().min(3, "L'audience est requise"),
});

const moderatedBodySchema = z.object({
  studyType: z.literal("moderated_usability"),
  objective: z.string().min(10, "L'objectif doit faire au moins 10 caractères"),
  product_name: z.string().min(2, "Le nom du produit est requis"),
  platform: z.enum(["web", "mobile", "desktop"]),
  fidelity: z.enum(["live_product", "prototype_hifi", "prototype_lowfi"]),
  think_aloud: z.enum(["concurrent", "retrospective", "none"]),
  audience: z.string().min(3, "L'audience est requise"),
  duration: z.number().int().min(15).max(480),
  participants: z.number().int().min(1).max(500),
});

const unmoderatedCommon = {
  studyType: z.literal("unmoderated_usability"),
  platform: z.enum(["web", "mobile", "desktop"]),
  fidelity: z.enum(["live_product", "prototype_hifi", "prototype_lowfi"]),
  tool: z.string().min(2, "Précisez l'outil de test"),
  audience: z.string().min(3, "L'audience est requise"),
};

const unmoderatedMonadicSchema = z.object({
  ...unmoderatedCommon,
  testDesign: z.literal("monadic"),
  objective: z.string().min(10, "L'objectif doit faire au moins 10 caractères"),
  product_name: z.string().min(2, "Le nom du produit est requis"),
  duration: z.number().int().min(5).max(90),
  participants: z.number().int().min(5).max(500),
});

const unmoderatedABSchema = z.object({
  ...unmoderatedCommon,
  testDesign: z.literal("ab"),
  ab_design: z.enum(["within", "between"]),
  variant_a_name: z.string().min(1, "Nommez la variante A"),
  variant_a_description: z.string().min(5, "Décrivez la variante A"),
  variant_b_name: z.string().min(1, "Nommez la variante B"),
  variant_b_description: z.string().min(5, "Décrivez la variante B"),
  duration: z.number().int().min(5).max(120),
  participants: z.number().int().min(10).max(500),
});

const unmoderatedBenchmarkSchema = z.object({
  ...unmoderatedCommon,
  testDesign: z.literal("benchmark"),
  benchmark_type: z.enum(["internal", "competitive"]),
  products: z.array(z.object({
    name: z.string().min(1),
    role: z.enum(["our_product", "competitor", "previous_version"]),
  })).min(2).max(5),
  standard_scales: z.array(z.string()).min(1, "Choisissez au moins une échelle normée"),
  benchmark_context: z.string().min(10, "Décrivez le contexte du benchmark"),
  duration: z.number().int().min(10).max(180),
  participants: z.number().int().min(10).max(1000),
});

const otherBodySchema = z.object({
  studyType: z.enum(["diary_study"]),
  objective: z.string().min(10, "L'objectif doit faire au moins 10 caractères"),
  audience: z.string().min(3, "L'audience est requise"),
  duration: z.number().int().min(15).max(480),
  participants: z.number().int().min(1).max(500),
});

const bodySchema = z.union([
  exploratoryBodySchema,
  surveyBodySchema,
  moderatedBodySchema,
  unmoderatedMonadicSchema,
  unmoderatedABSchema,
  unmoderatedBenchmarkSchema,
  otherBodySchema,
]);

// ─── User message builders ────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  satisfaction: "Satisfaction produit",
  nps: "Net Promoter Score (NPS)",
  usability: "Usabilité perçue",
  awareness: "Notoriété / perception de marque",
  friction: "Points de friction",
  other: "Autre (voir questions de recherche)",
};

const DURATION_LABELS: Record<string, string> = {
  under_5: "moins de 5 minutes",
  "5_to_10": "5 à 10 minutes",
  "10_to_15": "10 à 15 minutes",
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email (lien dans un email)",
  in_app: "In-app (popup ou overlay dans le produit)",
  qr_intercept: "QR code / intercept présentiel",
  external_panel: "Panel externe (Prolific, UserTesting…)",
};

function buildUserMessage(data: z.infer<typeof bodySchema>): string {
  if (data.studyType === "exploratory_interview") {
    const styleLabel =
      data.interview_style === "semi_directive"
        ? "Semi-directif (guide structuré, questions préparées)"
        : "Non-directif (structure souple, récit libre)";

    const lines = [
      `Génère un guide d'entretien exploratoire avec les paramètres suivants :`,
      `- Style d'entretien : ${styleLabel}`,
      `- Thèmes à explorer : ${data.themes}`,
    ];
    if (data.hypotheses.trim())
      lines.push(`- Hypothèses de départ à explorer sans orienter : ${data.hypotheses}`);
    if (data.sensitive_topics.trim())
      lines.push(`- Sujets sensibles à aborder avec précaution : ${data.sensitive_topics}`);
    lines.push(
      `- Audience cible : ${data.audience}`,
      `- Durée prévue : ${data.duration} minutes`,
      `- Nombre de participants prévus : ${data.participants}`,
      ``,
      `Réponds UNIQUEMENT avec le JSON valide du guide d'entretien, sans texte supplémentaire.`
    );
    return lines.join("\n");
  }

  if (data.studyType === "survey") {
    const lines = [
      `Génère un questionnaire de sondage UX avec les paramètres suivants :`,
      `- Questions de recherche auxquelles le sondage doit répondre : ${data.research_questions}`,
      `- Dimensions à mesurer : ${data.dimensions.map((d) => DIMENSION_LABELS[d] ?? d).join(", ")}`,
    ];

    const scales = data.standard_scales.filter((s) => s !== "none");
    lines.push(
      scales.length > 0
        ? `- Échelles normées à inclure : ${scales.join(", ")}`
        : `- Pas d'échelle normée imposée`
    );

    lines.push(
      `- Durée cible de complétion par répondant : ${DURATION_LABELS[data.target_duration] ?? data.target_duration}`,
      `- Canal de distribution : ${CHANNEL_LABELS[data.distribution_channel] ?? data.distribution_channel}`,
      `- Audience cible : ${data.audience}`
    );

    if (data.needs_screening && data.screening_criteria.trim()) {
      lines.push(`- Screening nécessaire : Oui — Critères : ${data.screening_criteria}`);
    } else if (data.needs_screening) {
      lines.push(`- Screening nécessaire : Oui — définir les critères de qualification appropriés`);
    } else {
      lines.push(`- Pas de screening nécessaire`);
    }

    lines.push(``, `Réponds UNIQUEMENT avec le JSON valide du questionnaire, sans texte supplémentaire.`);
    return lines.join("\n");
  }

  if (data.studyType === "moderated_usability") {
    const PLATFORM_LABELS: Record<string, string> = {
      web: "Web (navigateur)",
      mobile: "Mobile (application native)",
      desktop: "Desktop (application locale)",
    };
    const FIDELITY_LABELS: Record<string, string> = {
      live_product: "Produit en production",
      prototype_hifi: "Prototype haute-fidélité",
      prototype_lowfi: "Prototype basse-fidélité / maquette papier",
    };
    const THINK_ALOUD_LABELS: Record<string, string> = {
      concurrent: "Think-aloud concurrent (le participant pense à voix haute pendant l'exécution)",
      retrospective: "Think-aloud rétrospectif (debriefing après chaque tâche)",
      none: "Pas de think-aloud (observation silencieuse)",
    };
    return `Génère un protocole de test d'utilisabilité modéré avec les paramètres suivants :
- Objectif de recherche : ${data.objective}
- Produit testé : ${data.product_name}
- Plateforme : ${PLATFORM_LABELS[data.platform] ?? data.platform}
- Fidélité du support : ${FIDELITY_LABELS[data.fidelity] ?? data.fidelity}
- Think-aloud : ${THINK_ALOUD_LABELS[data.think_aloud] ?? data.think_aloud}
- Audience cible : ${data.audience}
- Durée prévue : ${data.duration} minutes
- Nombre de participants : ${data.participants}

Réponds UNIQUEMENT avec le JSON valide du protocole, sans texte supplémentaire.`;
  }

  if (data.studyType === "unmoderated_usability") {
    const PLATFORM_LABELS: Record<string, string> = {
      web: "Web (navigateur)",
      mobile: "Mobile (application native)",
      desktop: "Desktop (application locale)",
    };
    const FIDELITY_LABELS: Record<string, string> = {
      live_product: "Produit en production",
      prototype_hifi: "Prototype haute-fidélité",
      prototype_lowfi: "Prototype basse-fidélité / wireframe",
    };
    const AB_DESIGN_LABELS: Record<string, string> = {
      within: "Within-subjects (même participant teste A et B, avec contrebalancement)",
      between: "Between-subjects (deux cohortes séparées, chacune voit une seule variante)",
    };
    const BENCHMARK_TYPE_LABELS: Record<string, string> = {
      internal: "Benchmark interne (évolution temporelle du même produit)",
      competitive: "Benchmark compétitif (notre produit vs concurrents)",
    };
    const ROLE_LABELS: Record<string, string> = {
      our_product: "Notre produit",
      competitor: "Concurrent",
      previous_version: "Version précédente",
    };

    const common = [
      `- Plateforme : ${PLATFORM_LABELS[data.platform] ?? data.platform}`,
      `- Fidélité du support : ${FIDELITY_LABELS[data.fidelity] ?? data.fidelity}`,
      `- Outil de test utilisé : ${data.tool}`,
      `- Audience cible : ${data.audience}`,
      `- Durée estimée de complétion : ${data.duration} minutes`,
      `- Taille cible de l'échantillon : ${data.participants} participants`,
    ];

    if (data.testDesign === "monadic") {
      return [
        `Génère un script de test d'utilisabilité non-modéré monadique avec les paramètres suivants :`,
        `- Objectif de recherche : ${data.objective}`,
        `- Produit testé : ${data.product_name}`,
        ...common,
        ``,
        `Réponds UNIQUEMENT avec le JSON valide du script, sans texte supplémentaire.`,
      ].join("\n");
    }

    if (data.testDesign === "ab") {
      return [
        `Génère un script de test A/B non-modéré avec les paramètres suivants :`,
        `- Design expérimental : ${AB_DESIGN_LABELS[data.ab_design] ?? data.ab_design}`,
        `- Variante A : "${data.variant_a_name}" — ${data.variant_a_description}`,
        `- Variante B : "${data.variant_b_name}" — ${data.variant_b_description}`,
        ...common,
        ``,
        `Réponds UNIQUEMENT avec le JSON valide du script, sans texte supplémentaire.`,
      ].join("\n");
    }

    if (data.testDesign === "benchmark") {
      const productsList = data.products
        .map((p, i) => `  ${i + 1}. "${p.name}" — ${ROLE_LABELS[p.role] ?? p.role}`)
        .join("\n");
      return [
        `Génère un script de benchmark non-modéré avec les paramètres suivants :`,
        `- Type de benchmark : ${BENCHMARK_TYPE_LABELS[data.benchmark_type] ?? data.benchmark_type}`,
        `- Contexte : ${data.benchmark_context}`,
        `- Produits à tester :\n${productsList}`,
        `- Échelles normées à inclure : ${data.standard_scales.join(", ")}`,
        ...common,
        ``,
        `Réponds UNIQUEMENT avec le JSON valide du script, sans texte supplémentaire.`,
      ].join("\n");
    }
  }

  // diary_study (fallback)
  return `Génère un protocole de recherche UX complet avec les paramètres suivants :
- Type d'étude : ${data.studyType}
- Objectif de recherche : ${data.objective}
- Audience cible : ${data.audience}
- Durée prévue : ${data.duration} minutes
- Nombre de participants : ${data.participants}

Réponds UNIQUEMENT avec le JSON valide du protocole, sans texte supplémentaire.`;
}

// ─── Route ────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: getSystemPrompt(
            data.studyType as StudyType,
            "testDesign" in data ? (data as { testDesign: string }).testDesign : undefined
          ),
          messages: [{ role: "user", content: buildUserMessage(data) }],
        });

        for await (const chunk of claudeStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }

        const finalMessage = await claudeStream.finalMessage();
        if (finalMessage.stop_reason === "max_tokens") {
          controller.enqueue(
            new TextEncoder().encode(
              "\n__ERROR__:Réponse trop longue — réessaie avec moins de dimensions ou une durée réduite."
            )
          );
        }

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur interne";
        controller.enqueue(new TextEncoder().encode(`\n__ERROR__:${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  });
}
