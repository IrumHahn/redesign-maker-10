import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const OPENAI_IMAGE_MODEL = "gpt-image-2-2026-04-21";
const GOOGLE_NANO_BANANA_2_MODEL = "gemini-3.1-flash-image-preview";

type Provider = "openai" | "google";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider: Provider = body.model === "google" ? "google" : "openai";
    const image = parseDataUrl(String(body.imageUrl || ""));
    const requestText = String(body.request || "");
    const section = body.section || {};
    const project = body.project || {};
    const openaiKey = String(body.openaiKey || "");
    const googleKey = String(body.googleKey || "");
    const apiKey = provider === "google" ? googleKey : openaiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: provider === "google" ? "Google Nano Banana 2 API 키가 필요합니다." : "OpenAI Image 2.0 API 키가 필요합니다." },
        { status: 400 }
      );
    }
    if (!image) {
      return NextResponse.json({ error: "수정할 섹션 이미지가 없습니다." }, { status: 400 });
    }
    if (!requestText.trim()) {
      return NextResponse.json({ error: "섹션 수정 요청사항을 입력해주세요." }, { status: 400 });
    }

    const prompt = [
      "너는 커머스 상세페이지 섹션 이미지 편집 엔진이다.",
      "첨부된 9:16 상세페이지 섹션 이미지를 기반으로 같은 제품과 전체 톤앤매너를 유지하면서 필요한 부분만 편집한다.",
      `프로젝트: ${project.title || "상세페이지 리디자인"}`,
      `판매 채널: ${project.channel || "스마트스토어"}`,
      `섹션: ${section.id || ""} ${section.name || ""}`,
      `섹션 목적: ${section.purpose || ""}`,
      `원본 참조: ${section.source || ""}`,
      `사용자 수정 요청: ${requestText}`,
      "브랜드명 금지 규칙: '한이룸', '한이룸의', '한이룸 스킨', 'HANEERUM', 'Haneerum', 'HR'은 서비스명 또는 도구명일 뿐이며 제품 브랜드가 아니다. 이 단어들을 이미지 안의 제품명, 브랜드명, 로고, 라벨, 헤드라인, 후기, FAQ, CTA, 패키지 텍스트로 절대 사용하지 않는다.",
      "브랜드 사용 규칙: 제품 브랜드명과 제품명은 첨부된 이미지와 프로젝트 원본에서 확인되는 이름만 사용한다. 원본에서 확인되지 않는 새 브랜드명, 새 제품명, 새 로고를 만들지 않는다.",
      "규칙: 제품명, 패키지, 핵심 수치, 안전한 표현 원칙은 유지한다. 근거 없는 효능/리뷰/인증/수치를 새로 만들지 않는다. 같은 상세페이지 안에서 이어 붙였을 때 반복 레이아웃처럼 보이지 않도록 정보 배치, 카드 구조, 타이포 리듬을 조정한다. 한국어 문구는 크게, 작은 글씨는 줄이고, 한 장에 메시지 하나만 담는다."
    ].join("\n");

    const edited = provider === "google"
      ? await editWithGoogle({ apiKey, prompt, image })
      : await editWithOpenAI({ apiKey, prompt, image });

    return NextResponse.json({
      imageUrl: `data:${edited.mimeType};base64,${edited.buffer.toString("base64")}`,
      mimeType: edited.mimeType,
      prompt
    });
  } catch (error) {
    console.error("[api/edit-section]", error);
    return NextResponse.json({ error: error instanceof Error ? humanizeProviderError(error.message) : "섹션 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

async function editWithOpenAI({
  apiKey,
  prompt,
  image
}: {
  apiKey: string;
  prompt: string;
  image: { mimeType: string; buffer: Buffer };
}) {
  const form = new FormData();
  form.append("model", OPENAI_IMAGE_MODEL);
  form.append("prompt", prompt);
  form.append("size", "1152x2048");
  form.append("quality", "low");
  form.append("output_format", "png");
  form.append("image[]", new Blob([new Uint8Array(image.buffer)], { type: image.mimeType }), "section.png");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });

  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(withRequestId(data?.error?.message || "OpenAI Image 2.0 섹션 수정 실패", response));
  const imageBase64 = data?.data?.[0]?.b64_json;
  if (!imageBase64) throw new Error("OpenAI 응답에 이미지 데이터가 없습니다.");
  return { mimeType: "image/png", buffer: Buffer.from(imageBase64, "base64") };
}

async function editWithGoogle({
  apiKey,
  prompt,
  image
}: {
  apiKey: string;
  prompt: string;
  image: { mimeType: string; buffer: Buffer };
}) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_NANO_BANANA_2_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: image.mimeType, data: image.buffer.toString("base64") } }
        ]
      }]
    })
  });

  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(withRequestId(data?.error?.message || "Google Nano Banana 2 섹션 수정 실패", response));
  const imagePart = data?.candidates?.[0]?.content?.parts?.find((part: { inlineData?: { data?: string } }) => part.inlineData);
  if (!imagePart?.inlineData?.data) throw new Error("Google 응답에 이미지 데이터가 없습니다.");
  return {
    mimeType: imagePart.inlineData.mimeType || "image/png",
    buffer: Buffer.from(imagePart.inlineData.data, "base64")
  };
}

function parseDataUrl(value: string) {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text || response.statusText } };
  }
}

function withRequestId(message: string, response: Response) {
  const requestId = response.headers.get("x-request-id");
  return requestId ? `${message} (request_id: ${requestId})` : message;
}

function humanizeProviderError(message: string) {
  if (message.includes("Incorrect API key provided")) {
    return "OpenAI API 키가 올바르지 않습니다. API 키 설정에서 기존 키를 삭제한 뒤 OpenAI Platform에서 발급한 최신 키를 다시 입력해주세요.";
  }
  if (message.includes("invalid_api_key")) {
    return "API 키가 올바르지 않습니다. 선택한 이미지 생성 모델에 맞는 API 키를 다시 입력해주세요.";
  }
  if (message.includes("must be verified") && message.includes("gpt-image-2-2026-04-21")) {
    return "OpenAI Image 2.0 사용 권한이 아직 없습니다. OpenAI 조직 인증을 완료한 뒤 다시 시도해주세요.";
  }
  return message;
}
