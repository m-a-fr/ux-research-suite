import { NextRequest, NextResponse } from "next/server";
import { generateProtocolPdf } from "@/lib/exporters/pdf-protocol";
import { Protocol } from "@/lib/types/protocol";
import { ExploratoryProtocol } from "@/lib/types/exploratory";
import { Survey } from "@/lib/types/survey";
import { ModeratedProtocol } from "@/lib/types/moderated";
import { UnmoderatedProtocol } from "@/lib/types/unmoderated";

type AnyProtocol = Protocol | ExploratoryProtocol | Survey | ModeratedProtocol | UnmoderatedProtocol;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { protocol } = body as { protocol: AnyProtocol };
  if (!protocol || !(protocol as { title?: string }).title) {
    return NextResponse.json({ error: "Protocole invalide ou manquant" }, { status: 422 });
  }

  try {
    const nodeBuffer = await generateProtocolPdf(protocol);
    const buffer = new Uint8Array(nodeBuffer);
    const filename = `${protocol.study_type}-${Date.now()}.pdf`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(nodeBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la génération PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
