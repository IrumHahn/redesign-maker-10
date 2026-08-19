import { NextRequest, NextResponse } from "next/server";
import {
  BUG_REPORT_CATEGORIES,
  BUG_REPORT_DESCRIPTION_MAX,
  BUG_REPORT_EMAIL_MAX,
  BUG_REPORT_SOURCE,
  BUG_REPORT_TITLE_MAX,
  isValidReporterEmail
} from "@/lib/bug-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 접수 저장과 어드민은 PDP Maker 3.0과 공유한다.
 * 브라우저에서 3.0 도메인으로 바로 쏘면 CORS가 걸리므로 여기서 서버-서버로 넘긴다.
 */
const UPSTREAM_ENDPOINT =
  process.env.PDP_BUG_REPORT_ENDPOINT || "https://pdp-maker-30.vercel.app/api/pdp/bug-reports";
const UPSTREAM_TIMEOUT_MS = 12000;
const MAX_CONTEXT_KEYS = 24;
// 사용자의 API 키나 이미지 원본이 맥락에 섞여 나가지 않게 이름 기준으로 먼저 걸러낸다.
const SENSITIVE_KEY_PATTERN =
  /(key$|api[-_ ]?key|apikey|authorization|bearer|token|secret|password|base64|dataurl|data-url|imageurl|image-url|blob:)/i;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "신고 내용을 읽지 못했습니다." }, { status: 400 });
  }

  // 허니팟이 채워졌으면 접수한 척만 하고 버린다.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ ok: true, message: "접수되었습니다." });
  }

  const description = cleanText(body.description, BUG_REPORT_DESCRIPTION_MAX);
  if (description.length < 5) {
    return NextResponse.json(
      { ok: false, message: "어떤 문제가 있었는지 조금 더 적어주세요." },
      { status: 400 }
    );
  }

  const reporterEmail = cleanLine(body.reporterEmail, BUG_REPORT_EMAIL_MAX).toLowerCase();
  if (!isValidReporterEmail(reporterEmail)) {
    return NextResponse.json(
      { ok: false, message: "처리 결과를 받을 이메일을 입력해 주세요." },
      { status: 400 }
    );
  }

  const category = normalizeCategory(body.category);
  const title = cleanLine(body.title, BUG_REPORT_TITLE_MAX) || firstLine(description);

  const payload = {
    source: BUG_REPORT_SOURCE,
    category,
    title,
    description,
    reporterEmail,
    context: {
      ...sanitizeContext(body.context),
      product: "한이룸의 상세페이지 리디자인 마법사 1.5",
      userAgent: cleanLine(request.headers.get("user-agent"), 320) || undefined
    },
    recentEvents: []
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(UPSTREAM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store"
    });
    const result = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      id?: string;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      console.warn("[bug-report] upstream rejected", response.status, result.message);
      return NextResponse.json(
        { ok: false, message: result.message || "신고를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: result.id,
      message: "접수되었습니다. 처리 결과는 입력한 이메일로 안내드릴게요."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.warn("[bug-report] upstream failed", message);
    return NextResponse.json(
      { ok: false, message: "접수 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}

function normalizeCategory(value: unknown) {
  const normalized = cleanLine(value, 40);
  return BUG_REPORT_CATEGORIES.some((item) => item.value === normalized) ? normalized : "bug";
}

function sanitizeContext(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_CONTEXT_KEYS);
  return Object.fromEntries(
    entries.map(([key, entryValue]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) return [key, "[redacted]"];
      if (typeof entryValue === "string") return [key, entryValue.slice(0, 400)];
      if (typeof entryValue === "number" || typeof entryValue === "boolean") return [key, entryValue];
      return [key, undefined];
    })
  );
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function cleanLine(value: unknown, maxLength: number) {
  return cleanText(value, maxLength).replace(/\s+/g, " ");
}

function firstLine(value: string) {
  return cleanLine(value.split("\n")[0] ?? value, BUG_REPORT_TITLE_MAX);
}
