import { NextRequest, NextResponse } from "next/server";
import { generateBriefPdf } from "@/lib/exporters/pdf-brief";
import { Brief } from "@/lib/types/brief";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { brief } = body as { brief?: Brief };
  if (!brief || !brief.project_title || !Array.isArray(brief.slides)) {
    return NextResponse.json({ error: "Brief invalide ou manquant" }, { status: 422 });
  }

  try {
    const nodeBuffer = await generateBriefPdf(brief);
    const buffer = new Uint8Array(nodeBuffer);
    const slug = brief.project_title.slice(0, 40).replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    const filename = `brief-${slug}-${Date.now()}.pdf`;

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
