import { NextRequest, NextResponse } from "next/server";
import { generateProtocolDocx } from "@/lib/exporters/docx";
import { Protocol } from "@/lib/types/protocol";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { protocol } = body as { protocol: Protocol };
  if (!protocol || !protocol.title || !protocol.sections) {
    return NextResponse.json({ error: "Protocole invalide ou manquant" }, { status: 422 });
  }

  try {
    const nodeBuffer = await generateProtocolDocx(protocol);
    const buffer = new Uint8Array(nodeBuffer);
    const filename = `protocole-${protocol.study_type}-${Date.now()}.docx`;

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(nodeBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la génération DOCX";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
