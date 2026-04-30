import { NextResponse } from "next/server";
import { getKnowledgeStats, isRagConfigured } from "@/lib/rag";
import { isKnowledgeAccessRequired, isKnowledgeAdminRequired } from "@/lib/knowledge-access";

export const runtime = "nodejs";

export async function GET() {
  const knowledgeStats = isRagConfigured()
    ? await getKnowledgeStats().catch(() => ({ configured: true, documents: 0, chunks: 0 }))
    : { configured: false, documents: 0, chunks: 0 };

  return NextResponse.json({
    serverOpenaiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    serverGoogleKeyConfigured: Boolean(process.env.GOOGLE_API_KEY),
    knowledgeConfigured: knowledgeStats.configured,
    knowledgeDocuments: knowledgeStats.documents,
    knowledgeChunks: knowledgeStats.chunks,
    knowledgeAccessRequired: isKnowledgeAccessRequired(),
    knowledgeAdminRequired: isKnowledgeAdminRequired()
  });
}
