import { NextRequest, NextResponse } from "next/server";
import { generateProtocolDocx } from "@/lib/exporters/docx-template";
import { generateExploratoryDocx } from "@/lib/exporters/docx-exploratory";
import { generateSurveyDocx } from "@/lib/exporters/docx-survey";
import { generateModeratedDocx } from "@/lib/exporters/docx-moderated";
import { generateUnmoderatedDocx } from "@/lib/exporters/docx-unmoderated";
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
  if (!protocol || !protocol.title) {
    return NextResponse.json({ error: "Protocole invalide ou manquant" }, { status: 422 });
  }

  try {
    let nodeBuffer: Buffer;

    if (protocol.study_type === "exploratory_interview") {
      nodeBuffer = await generateExploratoryDocx(protocol as ExploratoryProtocol);
    } else if (protocol.study_type === "survey") {
      nodeBuffer = await generateSurveyDocx(protocol as Survey);
    } else if (protocol.study_type === "moderated_usability") {
      nodeBuffer = await generateModeratedDocx(protocol as ModeratedProtocol);
    } else if (protocol.study_type === "unmoderated_usability") {
      nodeBuffer = await generateUnmoderatedDocx(protocol as UnmoderatedProtocol);
    } else {
      nodeBuffer = await generateProtocolDocx(protocol as Protocol);
    }

    const buffer = new Uint8Array(nodeBuffer);
    const filename = `${protocol.study_type}-${Date.now()}.docx`;

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
