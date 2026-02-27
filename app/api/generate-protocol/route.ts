import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getSystemPrompt } from "@/lib/prompts";
import { StudyType } from "@/lib/types/protocol";

const STUDY_TYPES = [
  "exploratory_interview",
  "moderated_usability",
  "unmoderated_usability",
  "survey",
  "diary_study",
] as const;

const bodySchema = z.object({
  studyType: z.enum(STUDY_TYPES),
  objective: z.string().min(10, "L'objectif doit faire au moins 10 caractères"),
  audience: z.string().min(3, "L'audience est requise"),
  duration: z.number().int().min(15).max(480),
  participants: z.number().int().min(1).max(500),
});

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

  const { studyType, objective, audience, duration, participants } = parsed.data;

  const userMessage = `Génère un protocole de recherche UX complet avec les paramètres suivants :
- Type d'étude : ${studyType}
- Objectif de recherche : ${objective}
- Audience cible : ${audience}
- Durée prévue : ${duration} minutes
- Nombre de participants : ${participants}

Réponds UNIQUEMENT avec le JSON valide du protocole, sans texte supplémentaire.`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: getSystemPrompt(studyType as StudyType),
          messages: [{ role: "user", content: userMessage }],
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
            new TextEncoder().encode("\n__ERROR__:Réponse trop longue — réessaie avec un objectif plus court ou une durée réduite.")
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
