import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = String(body.event || "client:event").slice(0, 120);
    const payload = sanitizePayload(body.payload);
    console.info(`[client] ${event}`, JSON.stringify(payload));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[client] log failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false });
  }
}

function sanitizePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") return {};
  const blocked = new Set(["openaiKey", "googleKey", "apiKey", "knowledgeAccessKey", "knowledgeAdminKey", "imageUrl"]);
  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>)
      .filter(([key]) => !blocked.has(key))
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 300) : value])
  );
}
