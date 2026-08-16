import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const OPENAI_IMAGE_MODEL = "gpt-image-2-2026-04-21";
const GOOGLE_NANO_BANANA_2_MODEL = "gemini-3.1-flash-image";

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
      "스타일 규칙: 한국 스마트스토어에서 흔히 보는 완성형 상세페이지 디자인(둥근 정보 카드, 체크 아이콘 목록, 번호 배지, 아이콘 타일, 포인트 컬러 강조)을 유지한다.",
      "정보 밀도 규칙: 정보량을 줄이지 않는다. 화면을 카드, 아이콘 타일, 배지로 채우고 큰 빈 여백을 남기지 않는다.",
      "모바일 가독성 규칙: 정보를 줄이는 대신 글자를 키워서 가독성을 확보한다. 대제목 글자 높이는 이미지 폭의 10% 이상, 소제목과 라벨은 4.5% 이상, 설명문은 3.5% 이상으로 한다. 이미지 폭 2.5% 미만의 작은 글씨와 빽빽한 표만 피한다.",
      "금지: 구매 버튼, 장바구니 버튼, CTA 버튼을 이미지 안에 그리지 않는다.",
      "금지: 기획 메모나 제작 지시문을 이미지에 그리지 않는다. '표기', '노출', '영역', '섹션', '원본', '각주', '~하지 마세요' 같은 표현은 소비자용 문구가 아니다. 모든 문구는 소비자에게 직접 말하는 문장이어야 한다.",
      "제품 사진 규칙: 제품 형태, 패키지 디자인, 라벨 문구, 색상, 로고는 첨부 이미지 그대로 유지한다. 제품을 새로 그리거나 변형하지 않는다.",
      "규칙: 제품명, 핵심 수치, 안전한 표현 원칙은 유지한다. 근거 없는 효능/리뷰/인증/수치를 새로 만들지 않는다. 같은 상세페이지 안에서 이어 붙였을 때 반복 레이아웃처럼 보이지 않도록 정보 배치, 카드 구조, 타이포 리듬을 조정한다. 한 장에 메시지 하나만 담고, 오탈자 없는 자연스러운 한국어로 표기한다."
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
  if (message.includes("does not have access to model") && message.includes("gpt-image-2-2026-04-21")) {
    return "현재 입력한 OpenAI API 키의 프로젝트가 OpenAI Image 2.0 모델에 접근할 수 없습니다. 조직 인증, 프로젝트 권한, 결제 상태를 확인한 뒤 Image 2.0 권한이 있는 프로젝트의 API 키를 다시 입력해주세요.";
  }
  if (message.includes("Billing hard limit has been reached")) {
    return "OpenAI 결제 한도에 도달해 섹션 수정이 중단되었습니다. OpenAI Platform의 Billing 한도 또는 사용량 제한을 올린 뒤 다시 시도해주세요.";
  }
  if (message.includes("exceeded your current quota") || message.includes("Quota exceeded")) {
    return "Google Nano Banana 2 API 할당량을 초과했습니다. Google AI Studio 또는 Cloud Console에서 현재 사용량과 rate limit을 확인한 뒤 잠시 후 다시 시도해주세요.";
  }
  return message;
}
