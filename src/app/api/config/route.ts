import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    serverOpenaiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    serverGoogleKeyConfigured: Boolean(process.env.GOOGLE_API_KEY)
  });
}
