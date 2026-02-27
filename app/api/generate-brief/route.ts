import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BRIEF_SYSTEM_PROMPT } from "@/lib/prompts/brief";

// ─── Types ────────────────────────────────────────────────────────────────

interface AnyProtocol {
  study_type: string;
  title: string;
  [key: string]: unknown;
}

// ─── User message builder ──────────────────────────────────────────────────

const STUDY_TYPE_LABELS: Record<string, string> = {
  exploratory_interview: "Entretiens exploratoires",
  moderated_usability: "Test d'utilisabilité modéré",
  unmoderated_usability: "Test d'utilisabilité non-modéré",
  survey: "Sondage / Survey",
  diary_study: "Journal de bord (diary study)",
};

function buildBriefUserMessage(protocol: AnyProtocol): string {
  const typeLabel = STUDY_TYPE_LABELS[protocol.study_type] ?? protocol.study_type;
  const lines: string[] = [
    `Génère un brief stakeholders à partir du protocole UX suivant.`,
    ``,
    `TYPE D'ÉTUDE : ${typeLabel}`,
    `TITRE : ${protocol.title}`,
  ];

  // Duration
  const duration =
    (protocol.duration_minutes as number | undefined) ??
    (protocol.estimated_duration_minutes as number | undefined);
  if (duration) lines.push(`DURÉE PAR SESSION : ${duration} minutes`);

  // Platform (usability tests)
  if (protocol.platform) lines.push(`PLATEFORME : ${protocol.platform}`);

  // Fidelity (usability tests)
  if (protocol.fidelity) lines.push(`FIDÉLITÉ : ${protocol.fidelity}`);

  // Test design (unmoderated)
  if (protocol.test_design) lines.push(`DESIGN DE TEST : ${protocol.test_design}`);

  // Tasks summary (moderated / unmoderated)
  const tasks = protocol.tasks as Array<{ task?: string; screen_text?: string }> | undefined;
  if (tasks && tasks.length > 0) {
    lines.push(`NOMBRE DE TÂCHES : ${tasks.length}`);
    const taskSummary = tasks
      .slice(0, 3)
      .map((t, i) => `  ${i + 1}. ${t.task ?? t.screen_text ?? ""}`)
      .join("\n");
    if (taskSummary.trim()) lines.push(`EXEMPLES DE TÂCHES :\n${taskSummary}`);
  }

  // Sections summary (exploratory / moderated)
  const sections = protocol.sections as Array<{ type?: string; title?: string }> | undefined;
  if (sections && sections.length > 0) {
    lines.push(`SECTIONS : ${sections.map((s) => s.title ?? s.type).join(", ")}`);
  }

  // Survey blocks
  const blocks = protocol.blocks as Array<{ type?: string; title?: string }> | undefined;
  if (blocks && blocks.length > 0) {
    lines.push(`BLOCS SONDAGE : ${blocks.map((b) => b.title ?? b.type).join(", ")}`);
  }

  // A/B variants
  const variants = protocol.variants as Array<{ label?: string; product_name?: string }> | undefined;
  if (variants && variants.length > 0) {
    lines.push(
      `VARIANTES A/B : ${variants.map((v) => `${v.label} — ${v.product_name}`).join(" / ")}`
    );
  }

  // Benchmark products
  const products = protocol.products as Array<{ name?: string; role?: string }> | undefined;
  if (products && products.length > 0) {
    lines.push(`PRODUITS BENCHMARK : ${products.map((p) => p.name).join(", ")}`);
  }

  // Screener
  const screener = protocol.screener_questions as string[] | undefined;
  if (screener && screener.length > 0) {
    lines.push(`SCREENING : Oui (${screener.length} critère${screener.length > 1 ? "s" : ""})`);
  }

  lines.push(``, `Génère le brief stakeholders complet en 9 slides. Réponds UNIQUEMENT avec le JSON valide, sans texte supplémentaire.`);

  return lines.join("\n");
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

  const { protocol } = body as { protocol?: AnyProtocol };
  if (!protocol || !protocol.title || !protocol.study_type) {
    return NextResponse.json({ error: "Protocole invalide ou manquant" }, { status: 422 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: BRIEF_SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildBriefUserMessage(protocol) }],
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
              "\n__ERROR__:Réponse trop longue — réessaie."
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
