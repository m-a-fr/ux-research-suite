import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { BRIEF_SYSTEM_PROMPT } from "@/lib/prompts/brief";

// ─── Types ────────────────────────────────────────────────────────────────

interface AnyProtocol {
  study_type: string;
  title: string;
  [key: string]: unknown;
}

interface BriefContext {
  trigger?: string;
  audience?: string;
  constraints?: string;
}

// ─── User message builder ──────────────────────────────────────────────────

const STUDY_TYPE_LABELS: Record<string, string> = {
  exploratory_interview: "Entretiens exploratoires",
  moderated_usability: "Test d'utilisabilité modéré",
  unmoderated_usability: "Test d'utilisabilité non-modéré",
  survey: "Sondage / Survey",
  diary_study: "Journal de bord (diary study)",
};

function buildBriefUserMessage(protocol: AnyProtocol, context?: BriefContext): string {
  const typeLabel = STUDY_TYPE_LABELS[protocol.study_type] ?? protocol.study_type;
  const lines: string[] = [
    `Génère un brief stakeholders à partir du protocole UX suivant.`,
    ``,
    `TYPE D'ÉTUDE : ${typeLabel}`,
  ];

  // Optional context fields
  if (context?.trigger?.trim()) {
    lines.push(`CONTEXTE DÉCLENCHEUR : ${context.trigger.trim()}`);
  }
  if (context?.audience?.trim()) {
    lines.push(`AUDIENCE DU BRIEF : ${context.audience.trim()}`);
  }
  if (context?.constraints?.trim()) {
    lines.push(`CONTRAINTES : ${context.constraints.trim()}`);
  }

  // Full protocol JSON
  lines.push(
    ``,
    `PROTOCOLE COMPLET (JSON) :`,
    JSON.stringify(protocol, null, 2),
    ``,
    `Génère le brief stakeholders complet en 9 slides. Respecte scrupuleusement le format de réponse en deux blocs (<reflexion> puis <brief>).`
  );

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

  const { protocol, context } = body as { protocol?: AnyProtocol; context?: BriefContext };
  if (!protocol || !protocol.title || !protocol.study_type) {
    return NextResponse.json({ error: "Protocole invalide ou manquant" }, { status: 422 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 16000,
          system: BRIEF_SYSTEM_PROMPT,
          messages: [{ role: "user", content: buildBriefUserMessage(protocol, context) }],
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
